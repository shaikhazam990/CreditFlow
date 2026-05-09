const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    recipientName: {
      type: String,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    stage: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    tone: {
      type: String,
      enum: ["warm_reminder", "polite_firm", "formal_notice", "final_warning", "escalated"],
    },
    status: {
      type: String,
      enum: ["sent", "failed", "dry_run"],
      default: "dry_run",
    },
    dryRun: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    aiProvider: {
      type: String,
      enum: ["openai", "gemini", "manual"],
      default: "openai",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

emailLogSchema.index({ invoice: 1 });
emailLogSchema.index({ status: 1, sentAt: -1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);
