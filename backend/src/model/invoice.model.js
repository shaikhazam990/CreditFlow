const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      maxlength: [150, "Client name too long"],
    },
    clientEmail: {
      type: String,
      required: [true, "Client email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      maxlength: 3,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "overdue", "paid", "escalated", "cancelled"],
      default: "pending",
    },
    overdueDays: {
      type: Number,
      default: 0,
    },
    followUpCount: {
      type: Number,
      default: 0,
    },
    followUpStage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    lastFollowUpAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes too long"],
    },
    paymentLink: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paidAt: {
      type: Date,
    },
    attachments: [
      {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual — recalculate overdue days on the fly
invoiceSchema.virtual("currentOverdueDays").get(function () {
  if (this.status === "paid") return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  return Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
});

// Index for efficient overdue queries
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ clientEmail: 1 });
invoiceSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
