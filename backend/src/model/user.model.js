const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      // NOT required — Google OAuth users never set a password
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    // ─── Google OAuth fields ─────────────────────────────────────
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows null for email/password users
    },
    avatar: {
      type: String,
      default: "",
    },
    // provider: "local" = email+password  |  "google" = Google OAuth
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    // ─────────────────────────────────────────────────────────────

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving — skip for Google OAuth users (no password set)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method — compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
