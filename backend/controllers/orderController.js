const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Order = require("../models/Order");

// =========================================================
// SERVER-SIDE PRICING RULES
// Ported from Cart.js so totals can never be spoofed
// =========================================================

const DELIVERY_FEE = 2.99;
const FREE_DELIVERY_THRESHOLD = 40;
const SERVICE_FEE = 1.49;
const TAX_RATE = 0.05;

const AVAILABLE_COUPONS = [
  { code: "WELCOME20", type: "percentage", value: 20, minimum: 20 },
  { code: "SAVE10", type: "fixed", value: 10, minimum: 30 },
  { code: "FOOD5", type: "fixed", value: 5, minimum: 15 },
];

const round2 = (value) => Math.round(value * 100) / 100;

// =========================================================
// HANDOVER OTP CONFIGURATION (Phase 2E)
// =========================================================

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const OTP_MAX_ATTEMPTS = 5; // failed verifications before invalidation

// Statuses from which handover is still possible
const ACTIVE_HANDOVER_STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
];

// =========================================================
// HELPERS
// =========================================================

const buildOrderResponse = (order) => ({
  id: order._id,
  orderNumber: order.orderNumber,
  items: order.items,
  pricing: order.pricing,
  deliveryType: order.deliveryType,
  address:
    order.deliveryType === "delivery" ? order.address : null,
  location:
    order.deliveryType === "delivery" ? order.location : null,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  status: order.status,
  createdAt: order.createdAt,

  // Handover state for the customer UI — never the hash or attempts
  handover: {
    verifiedAt: order.handover?.verifiedAt || null,
    expiresAt: order.handover?.expiresAt || null,
    hasActiveCode: Boolean(
      order.handover?.codeHash &&
      order.handover?.expiresAt &&
      order.handover.expiresAt > new Date()
    ),
  },
});

const generateOrderNumber = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `ORD-${timePart}${randomPart}`;
};

// Sanitize + validate incoming items; returns null when invalid
const sanitizeItems = (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return null;
  }

  if (rawItems.length > 50) {
    return null;
  }

  const items = [];

  for (const raw of rawItems) {
    const name = String(raw?.name ?? "").trim();
    const price = Number(raw?.price);
    const quantity = Number(raw?.quantity);

    if (!name || name.length > 100) {
      return null;
    }

    if (!Number.isFinite(price) || price < 0) {
      return null;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return null;
    }

    // Store images only as short http(s) URLs — base64 data
    // URIs are dropped so payloads stay small and safe
    let image = String(raw?.image ?? "").trim();
    if (!/^https?:\/\//i.test(image) || image.length > 500) {
      image = "";
    }

    items.push({
      foodId: String(raw?.foodId ?? "").trim().slice(0, 50),
      name: name.slice(0, 100),
      category: String(raw?.category ?? "").trim().slice(0, 50),
      price: round2(price),
      quantity,
      cookingRequest: String(raw?.cookingRequest ?? "")
        .trim()
        .slice(0, 200),
      image,
    });
  }

  return items;
};

// Recompute the full pricing snapshot server-side
const computePricing = (items, deliveryType, coupon) => {
  const subtotal = round2(
    items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  let discount = 0;

  if (coupon && subtotal >= coupon.minimum) {
    discount =
      coupon.type === "percentage"
        ? (subtotal * coupon.value) / 100
        : Math.min(coupon.value, subtotal);

    discount = round2(discount);
  }

  const discountedSubtotal = round2(
    Math.max(subtotal - discount, 0)
  );

  const deliveryFee =
    deliveryType === "pickup"
      ? 0
      : discountedSubtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE;

  const serviceFee =
    deliveryType === "delivery" ? SERVICE_FEE : 0;

  const tax = round2(
    (discountedSubtotal + serviceFee) * TAX_RATE
  );

  const grandTotal = round2(
    discountedSubtotal + deliveryFee + serviceFee + tax
  );

  return {
    subtotal,
    discount,
    couponCode: coupon ? coupon.code : "",
    deliveryFee,
    serviceFee,
    tax,
    grandTotal,
  };
};

// =========================================================
// CREATE ORDER
// POST /api/orders  (protected)
// =========================================================

const createOrder = async (req, res) => {
  try {
    // Identity comes ONLY from the auth middleware
    const userId = req.user.userId;

    const body = req.body || {};

    // ---------------- ITEMS ----------------

    const items = sanitizeItems(body.items);

    if (!items) {
      return res.status(400).json({
        success: false,
        message:
          "Order must contain valid items (name, price, quantity 1-50, max 50 items)",
      });
    }

    // ---------------- DELIVERY TYPE ----------------

    const deliveryType =
      body.deliveryType === "pickup" ? "pickup" : "delivery";

    // ---------------- ADDRESS (delivery only) ----------------

    let address = {
      name: "",
      phone: "",
      addressLine: "",
      city: "",
      pincode: "",
    };

    let location = {
      latitude: null,
      longitude: null,
      locationText: "",
    };

    if (deliveryType === "delivery") {
      const rawAddress = body.address || {};

      address = {
        name: String(rawAddress.name ?? "").trim().slice(0, 100),
        phone: String(rawAddress.phone ?? "").trim().slice(0, 20),
        addressLine: String(rawAddress.addressLine ?? "")
          .trim()
          .slice(0, 300),
        city: String(rawAddress.city ?? "").trim().slice(0, 100),
        pincode: String(rawAddress.pincode ?? "").trim().slice(0, 10),
      };

      if (
        !address.name ||
        !address.phone ||
        !address.addressLine ||
        !address.city ||
        !address.pincode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complete delivery address (name, phone, address, city, pincode) is required",
        });
      }

      const latitude = Number(body.location?.latitude);
      const longitude = Number(body.location?.longitude);

      location = {
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        locationText: String(body.location?.locationText ?? "")
          .trim()
          .slice(0, 300),
      };
    }

    // ---------------- PAYMENT METHOD ----------------

    const paymentMethod = body.paymentMethod;

    if (
      !["upi", "card", "netbanking", "cod"].includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // COD is only offered for delivery orders (matches Payment page)
    if (paymentMethod === "cod" && deliveryType === "pickup") {
      return res.status(400).json({
        success: false,
        message:
          "Cash on Delivery is only available for delivery orders",
      });
    }

    // ---------------- COUPON ----------------

    const couponCode = String(body.couponCode ?? "")
      .trim()
      .toUpperCase();

    let coupon = null;

    if (couponCode) {
      coupon = AVAILABLE_COUPONS.find(
        (item) => item.code === couponCode
      );

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Invalid coupon code",
        });
      }

      const subtotal = round2(
        items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
      );

      if (subtotal < coupon.minimum) {
        return res.status(400).json({
          success: false,
          message: `Minimum order value for coupon ${coupon.code} is $${coupon.minimum.toFixed(2)}`,
        });
      }
    }

    // ---------------- PRICING (server-computed) ----------------

    const pricing = computePricing(items, deliveryType, coupon);

    // ---------------- SAVE (with order-number retry) ----------------

    let order = null;

    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          userId,
          items,
          pricing,
          deliveryType,
          address,
          location,
          paymentMethod,
          paymentStatus:
            paymentMethod === "cod" ? "cod_pending" : "pending",
          status: "placed",
        });
      } catch (createError) {
        // Duplicate order number — regenerate and retry
        if (createError.code === 11000 && attempt < 2) {
          continue;
        }

        throw createError;
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: buildOrderResponse(order),
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to place order",
    });
  }
};

// =========================================================
// MY ORDERS
// GET /api/orders  (protected)
// =========================================================

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50
    );

    const filter = { userId };

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders: orders.map(buildOrderResponse),
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to get orders",
    });
  }
};

// =========================================================
// SINGLE ORDER (owner only)
// GET /api/orders/:id  (protected)
// =========================================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Ownership check — users can only see their own orders
    if (order.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this order",
      });
    }

    res.json({
      success: true,
      order: buildOrderResponse(order),
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to get order",
    });
  }
};

// =========================================================
// GENERATE HANDOVER OTP
// POST /api/orders/:id/handover-code  (protected)
// =========================================================

const generateHandoverCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Ownership-filtered load — another user's order = 404
    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!ACTIVE_HANDOVER_STATUSES.includes(order.status)) {
      return res.status(409).json({
        success: false,
        message:
          order.status === "cancelled"
            ? "This order was cancelled"
            : "Handover was already completed for this order",
      });
    }

    // 6-digit OTP from a CSPRNG — no leading-zero bias
    const code = crypto.randomInt(100000, 1000000).toString();

    const codeHash = await bcrypt.hash(code, 10);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    // Overwrites any previous code — the old OTP is instantly void
    order.handover = {
      codeHash,
      expiresAt,
      attempts: 0,
      generatedAt: now,
      verifiedAt: null,
    };

    await order.save();

    res.json({
      success: true,
      message: "Handover code generated",
      handover: {
        code,
        expiresAt,
        expiresInSec: Math.round(OTP_TTL_MS / 1000),
      },
    });
  } catch (error) {
    console.error("Generate handover code error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to generate handover code",
    });
  }
};

// =========================================================
// VERIFY HANDOVER OTP
// POST /api/orders/:id/handover-verify  (protected)
// =========================================================

const verifyHandoverCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const { code } = req.body || {};

    const trimmedCode = String(code ?? "").trim();

    if (!/^[0-9]{6}$/.test(trimmedCode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the 6-digit handover code",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Ownership-filtered load — another user's order = 404
    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Already handed over — reuse blocked
    if (
      order.status === "delivered" ||
      order.status === "picked_up" ||
      order.handover?.verifiedAt
    ) {
      return res.status(409).json({
        success: false,
        message: "Handover was already completed for this order",
      });
    }

    if (order.status === "cancelled") {
      return res.status(409).json({
        success: false,
        message: "This order was cancelled",
      });
    }

    const handover = order.handover;

    if (!handover || !handover.codeHash) {
      return res.status(400).json({
        success: false,
        message:
          "No handover code has been generated yet. Please generate one first.",
      });
    }

    // Expired — invalidate and require regeneration
    if (!handover.expiresAt || handover.expiresAt <= new Date()) {
      order.handover.codeHash = null;
      order.handover.expiresAt = null;
      order.handover.attempts = 0;

      await order.save();

      return res.status(410).json({
        success: false,
        message: "This handover code has expired. Please generate a new one.",
      });
    }

    const matches = await bcrypt.compare(
      trimmedCode,
      handover.codeHash
    );

    if (!matches) {
      const attempts = (handover.attempts || 0) + 1;

      order.handover.attempts = attempts;

      // Too many failures — invalidate the code entirely
      if (attempts >= OTP_MAX_ATTEMPTS) {
        order.handover.codeHash = null;
        order.handover.expiresAt = null;
        order.handover.attempts = 0;

        await order.save();

        return res.status(410).json({
          success: false,
          message:
            "Too many incorrect attempts. Please generate a new handover code.",
        });
      }

      await order.save();

      return res.status(401).json({
        success: false,
        message: "Incorrect handover code",
        attemptsRemaining: OTP_MAX_ATTEMPTS - attempts,
      });
    }

    // Success — atomically flip to the terminal handover status.
    // The conditional filter guarantees a concurrent verification
    // cannot double-complete the order.
    const newStatus =
      order.deliveryType === "pickup" ? "picked_up" : "delivered";

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        userId,
        status: { $in: ACTIVE_HANDOVER_STATUSES },
        "handover.verifiedAt": null,
      },
      {
        $set: {
          status: newStatus,
          "handover.verifiedAt": new Date(),
          "handover.codeHash": null,
          "handover.expiresAt": null,
          "handover.attempts": 0,
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        message: "Handover was already completed for this order",
      });
    }

    res.json({
      success: true,
      message:
        newStatus === "picked_up"
          ? "Pickup confirmed. Enjoy your food!"
          : "Delivery confirmed. Enjoy your food!",
      order: buildOrderResponse(updatedOrder),
    });
  } catch (error) {
    console.error("Verify handover code error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to verify handover code",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  generateHandoverCode,
  verifyHandoverCode,
};