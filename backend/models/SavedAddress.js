const mongoose = require("mongoose");

const savedAddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    locationText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

savedAddressSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("SavedAddress", savedAddressSchema);