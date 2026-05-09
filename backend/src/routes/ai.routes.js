const router = require("express").Router();
const { body } = require("express-validator");
const { generateEmail, getProvider } = require("../controller/ai.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { handleValidation } = require("../middlewares/validation.middleware");

router.use(authenticate);

router.get("/provider", getProvider);

router.post(
  "/generate",
  requireRole("admin"),
  [
    body("invoiceId").notEmpty().withMessage("invoiceId required"),
    body("stage").optional().isInt({ min: 1, max: 5 }).withMessage("Stage must be 1–5"),
  ],
  handleValidation,
  generateEmail
);

module.exports = router;
