const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    orderNumber: { type: String, trim: true, maxlength: 100, default: "" },
    subject: {
      type: String,
      required: true,
      enum: ["order", "payment", "food", "feedback", "general"],
    },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
    status: { type: String, enum: ["new", "in-progress", "resolved"], default: "new", index: true },
    adminReply: { type: String, trim: true, maxlength: 3000, default: "" },
    resolutionNote: { type: String, trim: true, maxlength: 3000, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportRequest", supportRequestSchema);
