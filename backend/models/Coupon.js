const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 20,
      match: /^[A-Z0-9_-]{3,20}$/,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0.01,
    },
    minimum: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    maxUses: {
      type: Number,
      min: 0,
      default: 0,
    },
    perCustomerLimit: {
      type: Number,
      min: 0,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

couponSchema.pre("validate", function () {
  if (this.type === "percentage" && this.value > 100) {
    throw new Error("Percentage discount cannot exceed 100");
  }

  if (this.maxDiscount !== null && this.maxDiscount < 0) {
    throw new Error("Maximum discount cannot be negative");
  }
});

module.exports = mongoose.model("Coupon", couponSchema);
