const fs = require("fs");
const csv = require("csv-parser");
const Invoice = require("../model/invoice.model");
const { calcOverdueDays, getStageFromOverdueDays } = require("../utils/overdueCalculator");
const { getDashboardStats } = require("../services/invoice.service");
const { getIO } = require("../config/socket");
const logger = require("../utils/logger");

// GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = req.user.role === "admin" ? {} : { createdBy: req.user._id };

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
        { clientEmail: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("createdBy", "name email"),
      Invoice.countDocuments(filter),
    ]);

    res.json({ success: true, invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/invoices/:id
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("createdBy", "name email");
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    if (req.user.role !== "admin" && invoice.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    data.overdueDays = calcOverdueDays(data.dueDate);
    data.followUpStage = getStageFromOverdueDays(data.overdueDays);

    const invoice = await Invoice.create(data);
    logger.info(`Invoice created: ${invoice.invoiceNumber} by ${req.user.email}`);

    try { getIO().emit("invoice_created", invoice); } catch (_) {}
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Invoice number already exists." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    if (req.user.role !== "admin" && invoice.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const allowed = ["clientName", "clientEmail", "amount", "currency", "dueDate", "notes", "paymentLink"];
    allowed.forEach((field) => { if (req.body[field] !== undefined) invoice[field] = req.body[field]; });

    invoice.overdueDays = calcOverdueDays(invoice.dueDate);
    invoice.followUpStage = getStageFromOverdueDays(invoice.overdueDays);

    await invoice.save();
    try { getIO().emit("invoice_updated", invoice); } catch (_) {}
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    try { getIO().emit("invoice_deleted", { id: req.params.id }); } catch (_) {}
    res.json({ success: true, message: "Invoice deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/invoices/:id/mark-paid
const markPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    invoice.status = "paid";
    invoice.paidAt = new Date();
    invoice.overdueDays = 0;
    await invoice.save();

    try { getIO().emit("invoice_updated", invoice); } catch (_) {}
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/invoices/upload-csv
const uploadCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", async () => {
      fs.unlinkSync(req.file.path); // clean up temp file

      for (const row of results) {
        try {
          const dueDate = new Date(row.due_date || row.dueDate);
          const overdueDays = calcOverdueDays(dueDate);

          await Invoice.create({
            invoiceNumber: (row.invoice_number || row.invoiceNumber || "").toUpperCase(),
            clientName: row.client_name || row.clientName,
            clientEmail: row.client_email || row.clientEmail,
            amount: parseFloat(row.amount),
            currency: (row.currency || "USD").toUpperCase(),
            dueDate,
            notes: row.notes || "",
            overdueDays,
            followUpStage: getStageFromOverdueDays(overdueDays),
            status: overdueDays > 0 ? "overdue" : "pending",
            createdBy: req.user._id,
          });
        } catch (err) {
          errors.push({ row, error: err.message });
        }
      }

      res.json({
        success: true,
        imported: results.length - errors.length,
        failed: errors.length,
        errors: errors.slice(0, 10),
      });
    })
    .on("error", (err) => {
      res.status(500).json({ success: false, message: `CSV parse error: ${err.message}` });
    });
};

// POST /api/invoices/:id/attachments
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    invoice.attachments.push(attachment);
    await invoice.save();

    res.json({ success: true, attachment, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/invoices/:id/attachments/:filename
const deleteAttachment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    const { filename } = req.params;
    const idx = invoice.attachments.findIndex((a) => a.filename === filename);
    if (idx === -1) return res.status(404).json({ success: false, message: "Attachment not found." });

    // Remove file from disk
    const filePath = `uploads/attachments/${filename}`;
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}

    invoice.attachments.splice(idx, 1);
    await invoice.save();

    res.json({ success: true, message: "Attachment deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/invoices/stats/dashboard
const getDashboard = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.user._id, req.user.role === "admin");
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, markPaid, uploadCSV, getDashboard, uploadAttachment, deleteAttachment };
