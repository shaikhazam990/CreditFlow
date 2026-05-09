const router = require("express").Router();
const passport = require("passport");
const { body } = require("express-validator");
const {
  register, login, getMe, changePassword,
  googleCallback, googleFailure,
} = require("../controller/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { handleValidation } = require("../middlewares/validation.middleware");

// ─── Email / Password Auth ────────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  handleValidation,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password required"),
  ],
  handleValidation,
  login
);

router.get("/me", authenticate, getMe);

router.patch(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  handleValidation,
  changePassword
);

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * Step 1 — Redirect user to Google's consent screen.
 * Frontend: window.location.href = '/api/auth/google'
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // always show account picker
  })
);

/**
 * Step 2 — Google redirects back here with authorization code.
 * Passport exchanges the code, runs the verify callback, and populates req.user.
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: true, // session is used only for this redirect round-trip
  }),
  googleCallback
);

router.get("/google/failure", googleFailure);

module.exports = router;
