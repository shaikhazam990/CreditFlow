const nodemailer = require("nodemailer");
const EmailLog = require("../model/emailLog.model");
const logger = require("../utils/logger");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

/**
 * Send (or dry-run) a follow-up email and write to EmailLog.
 *
 * @param {object} opts
 * @returns {Promise<EmailLog>}  The persisted log document
 */
const sendFollowUpEmail = async ({
  invoiceId,
  recipientEmail,
  recipientName,
  subject,
  body,
  stage,
  tone,
  sentBy,
  dryRun = true,
}) => {
  const isDryRun = dryRun || process.env.DRY_RUN === "true";

  const logData = {
    invoice: invoiceId,
    recipientEmail,
    recipientName,
    subject,
    body,
    stage,
    tone,
    sentBy,
    dryRun: isDryRun,
    aiProvider: process.env.AI_PROVIDER || "openai",
  };

  try {
    if (!isDryRun) {
      const transport = getTransporter();
      await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to: recipientEmail,
        subject,
        text: body,
        html: `<div style="font-family:sans-serif;line-height:1.6;max-width:600px">${body.replace(/\n/g, "<br>")}</div>`,
      });
      logger.info(`Email sent to ${recipientEmail} (stage ${stage})`);
      logData.status = "sent";
    } else {
      logger.info(`[DRY RUN] Would send stage-${stage} email to ${recipientEmail}`);
      logData.status = "dry_run";
    }
  } catch (err) {
    logger.error(`Email send failed: ${err.message}`);
    logData.status = "failed";
    logData.errorMessage = err.message;
  }

  const log = await EmailLog.create(logData);
  return log;
};

module.exports = { sendFollowUpEmail };
