const Invoice = require("../model/invoice.model");
const EmailLog = require("../model/emailLog.model");
const { generateFollowUpEmail, getSubjectForStage } = require("../services/ai.service");
const { sendFollowUpEmail } = require("../services/email.service");
const { buildInvoiceContext } = require("../services/invoice.service");
const { STAGE_LABELS } = require("../utils/overdueCalculator");
const { getIO } = require("../config/socket");
const Notification = require("../model/notification.model");
const logger = require("../utils/logger");

const sendEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    if (invoice.status === "paid") {
      return res.status(400).json({ success: false, message: "Invoice already paid. No email needed." });
    }

    const stage = req.body.stage || invoice.followUpStage || 1;
    const dryRun = req.body.dryRun !== undefined ? req.body.dryRun : process.env.DRY_RUN === "true";

    const ctx = buildInvoiceContext(invoice);
    const emailBody = await generateFollowUpEmail(stage, ctx);
    const subject = getSubjectForStage(stage, invoice.invoiceNumber, invoice.clientName);
    const tone = STAGE_LABELS[stage];

    const log = await sendFollowUpEmail({
      invoiceId: invoice._id,
      recipientEmail: invoice.clientEmail,
      recipientName: invoice.clientName,
      subject,
      body: emailBody,
      stage,
      tone,
      sentBy: req.user._id,
      dryRun,
    });

    invoice.followUpCount += 1;
    invoice.lastFollowUpAt = new Date();
    await invoice.save();

    const notif = await Notification.create({
      user: req.user._id,
      title: dryRun ? "[Dry Run] Email Simulated" : "Follow-up Email Sent",
      message: `Stage ${stage} email ${dryRun ? "simulated" : "sent"} to ${invoice.clientName} for Invoice ${invoice.invoiceNumber}`,
      type: "email_sent",
      relatedInvoice: invoice._id,
    });

    try {
      getIO().to(`user_${req.user._id}`).emit("notification", notif);
      getIO().emit("invoice_updated", { invoiceId: invoice._id });
    } catch (_) {}

    res.json({ success: true, log, emailBody, subject });
  } catch (err) {
    logger.error(`sendEmail error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, invoiceId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (invoiceId) filter.invoice = invoiceId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("invoice", "invoiceNumber clientName clientEmail")
        .populate("sentBy", "name email"),
      EmailLog.countDocuments(filter),
    ]);

    res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getLog = async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id)
      .populate("invoice", "invoiceNumber clientName clientEmail amount dueDate")
      .populate("sentBy", "name email");

    if (!log) return res.status(404).json({ success: false, message: "Log not found." });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const previewEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    const stage = req.body.stage || invoice.followUpStage || 1;
    const ctx = buildInvoiceContext(invoice);
    const emailBody = await generateFollowUpEmail(stage, ctx);
    const subject = getSubjectForStage(stage, invoice.invoiceNumber, invoice.clientName);

    res.json({ success: true, subject, body: emailBody, stage, tone: STAGE_LABELS[stage] });
  } catch (err) {
    logger.error(`previewEmail error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendEmail, getLogs, getLog, previewEmail };
