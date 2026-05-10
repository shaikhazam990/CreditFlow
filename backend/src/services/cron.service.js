const cron = require("node-cron");
const Invoice = require("../model/invoice.model");
const Notification = require("../model/notification.model");
const { syncOverdueStatus } = require("./invoice.service");
const { generateFollowUpEmail, getSubjectForStage } = require("./ai.service");
const { sendFollowUpEmail } = require("./email.service");
const { buildInvoiceContext } = require("./invoice.service");
const { getIO } = require("../config/socket");
const { STAGE_LABELS } = require("../utils/overdueCalculator");
const logger = require("../utils/logger");

const startCronJobs = () => {
  cron.schedule("0 8 * * *", async () => {
    logger.info("CRON: Starting daily follow-up job");

    try {
      await syncOverdueStatus();

      const overdueInvoices = await Invoice.find({
        status: { $in: ["overdue", "escalated"] },
        overdueDays: { $gt: 0 },
      }).populate("createdBy", "_id name email");

      logger.info(`CRON: Found ${overdueInvoices.length} overdue invoices`);

      for (const invoice of overdueInvoices) {
        try {
          const stage = invoice.followUpStage || 1;
          if (stage === 0) continue;

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
            sentBy: invoice.createdBy?._id,
            dryRun: process.env.DRY_RUN === "true",
          });

          invoice.followUpCount += 1;
          invoice.lastFollowUpAt = new Date();
          await invoice.save();

          if (invoice.createdBy) {
            const notif = await Notification.create({
              user: invoice.createdBy._id,
              title: log.status === "dry_run" ? "[Dry Run] Follow-up Email Queued" : "Follow-up Email Sent",
              message: `Stage ${stage} email ${log.status === "dry_run" ? "simulated" : "sent"} for ${invoice.clientName} — Invoice ${invoice.invoiceNumber}`,
              type: "email_sent",
              relatedInvoice: invoice._id,
            });

            try {
              getIO().to(`user_${invoice.createdBy._id}`).emit("notification", notif);
              getIO().to(`user_${invoice.createdBy._id}`).emit("invoice_updated", { invoiceId: invoice._id });
            } catch (_) {
            }
          }

          logger.info(`CRON: Processed invoice ${invoice.invoiceNumber} (stage ${stage})`);
        } catch (innerErr) {
          logger.error(`CRON: Failed for invoice ${invoice.invoiceNumber}: ${innerErr.message}`);
        }
      }

      logger.info("CRON: Daily follow-up job complete");
    } catch (err) {
      logger.error(`CRON: Job failed: ${err.message}`);
    }
  });

  cron.schedule("0 */6 * * *", async () => {
    logger.info("CRON: Running overdue sync");
    await syncOverdueStatus();
  });

  logger.info("Cron jobs registered: daily follow-up @ 08:00, overdue sync every 6h");
};

module.exports = { startCronJobs };
