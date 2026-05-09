const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { getPromptForStage } = require("../utils/promptTemplates");
const logger = require("../utils/logger");

/**
 * Lazy-initialise the LLM client so we only create it on first use.
 * Supports OpenAI (default) and Gemini via env var AI_PROVIDER.
 */
let llmClient = null;

const getLLMClient = () => {
  if (llmClient) return llmClient;

  const provider = process.env.AI_PROVIDER || "openai";

  if (provider === "openai") {
    llmClient = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 800,
    });
  } else if (provider === "gemini") {
    // Using @langchain/community GoogleGenerativeAI wrapper
    const { ChatGoogleGenerativeAI } = require("@langchain/community/chat_models/googleai");
    llmClient = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      temperature: 0.7,
      maxOutputTokens: 800,
    });
  } else {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }

  return llmClient;
};

/**
 * Generate a follow-up email body for the given stage and invoice context.
 *
 * @param {number} stage        - Follow-up stage (1–5)
 * @param {object} invoiceCtx   - { clientName, invoiceNumber, amount, dueDate, overdueDays, followUpCount, paymentLink }
 * @returns {Promise<string>}   - Generated email body
 */
const generateFollowUpEmail = async (stage, invoiceCtx) => {
  const prompt = getPromptForStage(stage, invoiceCtx);
  const client = getLLMClient();

  logger.info(`Generating stage-${stage} email for invoice ${invoiceCtx.invoiceNumber}`);

  try {
    const messages = [
      new SystemMessage(prompt.system),
      new HumanMessage(prompt.user),
    ];

    const response = await client.invoke(messages);
    const emailBody = response.content?.trim();

    if (!emailBody) throw new Error("LLM returned empty response");

    return emailBody;
  } catch (err) {
    logger.error(`AI generation error: ${err.message}`);
    throw new Error(`Failed to generate email: ${err.message}`);
  }
};

/**
 * Map stage number → subject line prefix.
 */
const getSubjectForStage = (stage, invoiceNumber, clientName) => {
  const subjects = {
    1: `Friendly Reminder: Invoice ${invoiceNumber} Payment Due`,
    2: `Follow-Up: Invoice ${invoiceNumber} — Payment Overdue`,
    3: `Formal Notice: Invoice ${invoiceNumber} Requires Immediate Attention`,
    4: `Final Warning: Invoice ${invoiceNumber} — Action Required Within 48 Hours`,
    5: `Escalation Notice: Invoice ${invoiceNumber} — Account Referred for Further Action`,
  };
  return subjects[stage] || `Invoice ${invoiceNumber} — Payment Required`;
};

module.exports = { generateFollowUpEmail, getSubjectForStage };
