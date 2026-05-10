const router = require("express").Router();
const passport = require("passport");
const { body } = require("express-validator");
const {
  register, login, getMe, changePassword,
  googleCallback, googleFailure,
} = require("../controller/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { handleValidation } = require("../middlewares/validation.middleware");

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


router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: true,
  }),
  googleCallback
);

router.get("/google/failure", googleFailure);

module.exports = router;
