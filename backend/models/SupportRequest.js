const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    orderNumber: { type: String, trim: true, maxlength: 100, default: "" },
    // Optional links used when a request is created from an authenticated order.
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    subject: {
      type: String,
      required: true,
      enum: ["order", "payment", "food", "feedback", "general"],
    },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
    status: { type: String, enum: ["new", "in-progress", "resolved"], default: "new", index: true },
    adminReply: { type: String, trim: true, maxlength: 3000, default: "" },
    supportAccessTokenHash: { type: String, select: false },
    resolutionNote: { type: String, trim: true, maxlength: 3000, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportRequest", supportRequestSchema);
