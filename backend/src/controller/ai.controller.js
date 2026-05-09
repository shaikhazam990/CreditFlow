const { generateFollowUpEmail, getSubjectForStage } = require("../services/ai.service");
const { buildInvoiceContext } = require("../services/invoice.service");
const { STAGE_LABELS } = require("../utils/overdueCalculator");
const Invoice = require("../model/invoice.model");
const logger = require("../utils/logger");

// POST /api/ai/generate
// Body: { invoiceId, stage }
const generateEmail = async (req, res) => {
  try {
    const { invoiceId, stage } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    const resolvedStage = parseInt(stage) || invoice.followUpStage || 1;
    const ctx = buildInvoiceContext(invoice);

    logger.info(`AI generate request: invoice=${invoiceId}, stage=${resolvedStage}, user=${req.user._id}`);

    const emailBody = await generateFollowUpEmail(resolvedStage, ctx);
    const subject = getSubjectForStage(resolvedStage, invoice.invoiceNumber, invoice.clientName);

    res.json({
      success: true,
      emailBody,
      subject,
      stage: resolvedStage,
      tone: STAGE_LABELS[resolvedStage],
      invoiceContext: ctx,
    });
  } catch (err) {
    logger.error(`AI generate error: ${err.message}`);
    res.status(500).json({ success: false, message: `AI generation failed: ${err.message}` });
  }
};

// GET /api/ai/provider
const getProvider = async (req, res) => {
  res.json({
    success: true,
    provider: process.env.AI_PROVIDER || "openai",
    model:
      process.env.AI_PROVIDER === "gemini"
        ? process.env.GEMINI_MODEL || "gemini-1.5-flash"
        : process.env.OPENAI_MODEL || "gpt-4o-mini",
  });
};

module.exports = { generateEmail, getProvider };
