const Invoice = require("../model/invoice.model");
const { calcOverdueDays, getStageFromOverdueDays, STAGE_LABELS } = require("../utils/overdueCalculator");
const logger = require("../utils/logger");

/**
 * Sync the overdue fields on all non-paid invoices.
 * Called by the cron job and on-demand.
 */
const syncOverdueStatus = async () => {
  const invoices = await Invoice.find({ status: { $nin: ["paid", "cancelled"] } });
  let updatedCount = 0;

  for (const inv of invoices) {
    const days = calcOverdueDays(inv.dueDate);
    const stage = getStageFromOverdueDays(days);
    const newStatus = days > 0 ? (stage === 5 ? "escalated" : "overdue") : "pending";

    if (inv.overdueDays !== days || inv.status !== newStatus || inv.followUpStage !== stage) {
      inv.overdueDays = days;
      inv.followUpStage = stage;
      if (inv.status !== "paid") inv.status = newStatus;
      await inv.save();
      updatedCount++;
    }
  }

  logger.info(`syncOverdueStatus: updated ${updatedCount} invoices`);
  return updatedCount;
};

/**
 * Build the context object passed to AI prompt templates.
 */
const buildInvoiceContext = (invoice) => ({
  clientName: invoice.clientName,
  invoiceNumber: invoice.invoiceNumber,
  amount: `${invoice.currency} ${invoice.amount.toLocaleString()}`,
  dueDate: new Date(invoice.dueDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  }),
  overdueDays: invoice.overdueDays,
  followUpCount: invoice.followUpCount,
  paymentLink: invoice.paymentLink ||
    `${process.env.PAYMENT_BASE_URL || "https://pay.example.com"}/${invoice.invoiceNumber}`,
});

/**
 * Get dashboard summary stats.
 */
const getDashboardStats = async (userId, isAdmin) => {
  const baseFilter = isAdmin ? {} : { createdBy: userId };

  const [total, overdue, paid, escalated, emailLogs] = await Promise.all([
    Invoice.countDocuments(baseFilter),
    Invoice.countDocuments({ ...baseFilter, status: "overdue" }),
    Invoice.countDocuments({ ...baseFilter, status: "paid" }),
    Invoice.countDocuments({ ...baseFilter, status: "escalated" }),
    require("../model/emailLog.model").countDocuments(
      isAdmin ? {} : undefined  // admin sees all logs
    ),
  ]);

  return { total, overdue, paid, escalated, emailsSent: emailLogs };
};

module.exports = { syncOverdueStatus, buildInvoiceContext, getDashboardStats };
