const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { body } = require("express-validator");
const {
  getInvoices, getInvoice, createInvoice, updateInvoice,
  deleteInvoice, markPaid, uploadCSV, getDashboard,
  uploadAttachment, deleteAttachment,
} = require("../controller/invoice.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { handleValidation } = require("../middlewares/validation.middleware");

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) cb(null, true);
    else cb(new Error("Only CSV files allowed"));
  },
});

const attachmentUpload = multer({
  dest: "uploads/attachments/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and image files allowed"));
  },
});

const invoiceValidation = [
  body("invoiceNumber").trim().notEmpty().withMessage("Invoice number required").toUpperCase(),
  body("clientName").trim().notEmpty().withMessage("Client name required"),
  body("clientEmail").isEmail().withMessage("Valid client email required").normalizeEmail(),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  body("dueDate").isISO8601().withMessage("Valid due date required"),
];

// All routes require authentication
router.use(authenticate);

router.get("/stats/dashboard", getDashboard);
router.get("/", getInvoices);
router.get("/:id", getInvoice);

router.post("/", requireRole("admin"), invoiceValidation, handleValidation, createInvoice);
router.patch("/:id", requireRole("admin"), updateInvoice);
router.delete("/:id", requireRole("admin"), deleteInvoice);
router.patch("/:id/mark-paid", requireRole("admin"), markPaid);
router.post("/upload-csv", requireRole("admin"), upload.single("file"), uploadCSV);
router.post("/:id/attachments", requireRole("admin"), attachmentUpload.single("file"), uploadAttachment);
router.delete("/:id/attachments/:filename", requireRole("admin"), deleteAttachment);

module.exports = router;
