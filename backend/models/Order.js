const mongoose = require("mongoose");

// =========================================================
// ORDER ITEM (snapshot of the food at purchase time)
// =========================================================

const orderItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },

    cookingRequest: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    // Stored only when it is a short http(s) URL —
    // base64 data URIs are stripped by the controller
    image: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// =========================================================
// ORDER
// =========================================================

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) =>
          Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    // Server-computed pricing snapshot — never trusted from client
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      discount: { type: Number, required: true, min: 0, default: 0 },
      couponCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },
      deliveryFee: { type: Number, required: true, min: 0, default: 0 },
      serviceFee: { type: Number, required: true, min: 0, default: 0 },
      tax: { type: Number, required: true, min: 0, default: 0 },
      grandTotal: { type: Number, required: true, min: 0 },
    },

    deliveryType: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },

    // Address snapshot — validated as complete for delivery orders
    address: {
      name: { type: String, trim: true, maxlength: 100, default: "" },
      phone: { type: String, trim: true, maxlength: 20, default: "" },
      addressLine: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "",
      },
      city: { type: String, trim: true, maxlength: 100, default: "" },
      pincode: { type: String, trim: true, maxlength: 10, default: "" },
      landmark: { type: String, trim: true, maxlength: 120, default: "" },
    },

    // Map location snapshot
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      locationText: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "",
      },
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "cod", "demo"],
      default: "cod",
    },

    // No gateway yet — non-COD stays "pending" until a gateway phase
    paymentStatus: {
      type: String,
      enum: ["pending", "cod_pending", "paid", "failed"],
      default: "pending",
    },

    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "picked_up",
      ],
      default: "placed",
    },

    // Operational status audit trail
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: [
              "placed",
              "confirmed",
              "preparing",
              "ready",
              "out_for_delivery",
              "delivered",
              "cancelled",
              "picked_up",
            ],
          },
          changedAt: { type: Date, default: Date.now },
          changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
        },
      ],
      default: [],
    },

    // =========================================================
    // HANDOVER OTP (Phase 2E)
    // One-time code the customer shows at delivery/pickup
    // handover. Plaintext is NEVER stored — only a bcrypt hash.
    // =========================================================
    handover: {
      codeHash: {
        type: String,
        default: null,
      },

      expiresAt: {
        type: Date,
        default: null,
      },

      attempts: {
        type: Number,
        default: 0,
      },

      generatedAt: {
        type: Date,
        default: null,
      },

      // Set once on successful verification — blocks reuse
      verifiedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Fast "my orders, newest first" queries
orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;