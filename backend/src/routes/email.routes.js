const router = require("express").Router();
const { sendEmail, getLogs, getLog, previewEmail } = require("../controller/email.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");

router.use(authenticate);

router.get("/logs", getLogs);
router.get("/logs/:id", getLog);
router.post("/send/:invoiceId", requireRole("admin"), sendEmail);
router.post("/preview/:invoiceId", requireRole("admin"), previewEmail);

module.exports = router;
