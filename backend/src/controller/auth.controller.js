const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const logger = require("../utils/logger");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const userCount = await User.countDocuments();
    const assignedRole =
      userCount === 0
        ? "admin"
        : role === "admin" && req.user?.role === "admin"
        ? "admin"
        : "user";

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      provider: "local",
    });

    const token = signToken(user._id);
    logger.info(`New user registered: ${email} (${assignedRole})`);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // Block password login for Google-only accounts
    if (user.provider === "google" && !user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated." });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    logger.info(`User logged in: ${email}`);
    res.json({ success: true, token, user });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ success: false, message: "Login failed." });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PATCH /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (user.provider === "google" && !user.password) {
      return res.status(400).json({
        success: false,
        message: "Google accounts do not have a password. Set one first.",
      });
    }

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password incorrect." });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password change failed." });
  }
};

// ─── Google OAuth callbacks ───────────────────────────────────────────────────

/**
 * GET /api/auth/google/callback
 *
 * Passport has already authenticated the user and attached req.user.
 * We issue a JWT and redirect the browser back to the frontend.
 * The frontend reads the token from the URL once, stores it, then
 * removes it from the address bar.
 */
const googleCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
      );
    }

    const token = signToken(req.user._id);
    logger.info(`Google OAuth login: ${req.user.email}`);

    // Pass token via URL fragment — never via query string in production;
    // fragments are not sent to the server so they stay client-side.
    res.redirect(`${process.env.FRONTEND_URL}/oauth/callback#token=${token}`);
  } catch (err) {
    logger.error(`googleCallback error: ${err.message}`);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * GET /api/auth/google/failure
 * Passport redirects here on authentication failure.
 */
const googleFailure = (_req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=google_denied`);
};

module.exports = { register, login, getMe, changePassword, googleCallback, googleFailure };
