const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

const DELIVERY_FEE = 2.99;
const FREE_DELIVERY_THRESHOLD = 40;
const SERVICE_FEE = 1.49;
const TAX_RATE = 0.05;
const OTP_TTL_MS = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const ACTIVE_HANDOVER_STATUSES = ["placed", "confirmed", "preparing", "ready", "out_for_delivery"];
const round2 = (value) => Math.round(value * 100) / 100;

const buildOrderResponse = (order) => ({
  id: order._id,
  orderNumber: order.orderNumber,
  items: order.items,
  pricing: order.pricing,
  deliveryType: order.deliveryType,
  address: order.deliveryType === "delivery" ? order.address : null,
  location: order.deliveryType === "delivery" ? order.location : null,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory.map((entry) => ({
    status: entry.status,
    changedAt: entry.changedAt,
  })) : [],
  handover: {
    verifiedAt: order.handover?.verifiedAt || null,
    expiresAt: order.handover?.expiresAt || null,
    hasActiveCode: Boolean(order.handover?.codeHash && order.handover?.expiresAt && order.handover.expiresAt > new Date()),
  },
});

const generateOrderNumber = () => `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const sanitizeItems = (rawItems) => {
  if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > 50) return null;
  const items = [];
  for (const raw of rawItems) {
    const name = String(raw?.name ?? "").trim();
    const price = Number(raw?.price);
    const quantity = Number(raw?.quantity);
    if (!name || name.length > 100 || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return null;
    let image = String(raw?.image ?? "").trim();
    if (!/^https?:\/\//i.test(image) || image.length > 500) image = "";
    items.push({
      foodId: String(raw?.foodId ?? "").trim().slice(0, 50),
      name: name.slice(0, 100),
      category: String(raw?.category ?? "").trim().slice(0, 50),
      price: round2(price),
      quantity,
      cookingRequest: String(raw?.cookingRequest ?? "").trim().slice(0, 200),
      image,
    });
  }
  return items;
};

const computePricing = (items, deliveryType, coupon) => {
  const subtotal = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  let discount = 0;
  if (coupon && subtotal >= coupon.minimum) {
    discount = coupon.type === "percentage" ? (subtotal * coupon.value) / 100 : Math.min(coupon.value, subtotal);
    discount = round2(discount);
  }
  const discountedSubtotal = round2(Math.max(subtotal - discount, 0));
  const deliveryFee = deliveryType === "pickup" ? 0 : discountedSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const serviceFee = deliveryType === "delivery" ? SERVICE_FEE : 0;
  const tax = round2((discountedSubtotal + serviceFee) * TAX_RATE);
  const grandTotal = round2(discountedSubtotal + deliveryFee + serviceFee + tax);
  return { subtotal, discount, couponCode: coupon?.code || "", deliveryFee, serviceFee, tax, grandTotal };
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    const items = sanitizeItems(body.items);
    if (!items) return res.status(400).json({ success: false, message: "Order must contain valid items (name, price, quantity 1-50, max 50 items)" });

    const deliveryType = body.deliveryType === "pickup" ? "pickup" : "delivery";
    let address = { name: "", phone: "", addressLine: "", city: "", pincode: "" };
    let location = { latitude: null, longitude: null, locationText: "" };
    if (deliveryType === "delivery") {
      const raw = body.address || {};
      address = {
        name: String(raw.name ?? "").trim().slice(0, 100),
        phone: String(raw.phone ?? "").trim().slice(0, 20),
        addressLine: String(raw.addressLine ?? "").trim().slice(0, 300),
        city: String(raw.city ?? "").trim().slice(0, 100),
        pincode: String(raw.pincode ?? "").trim().slice(0, 10),
      };
      if (!address.name || !address.phone || !address.addressLine || !address.city || !address.pincode) return res.status(400).json({ success: false, message: "Complete delivery address (name, phone, address, city, pincode) is required" });
      const latitude = Number(body.location?.latitude);
      const longitude = Number(body.location?.longitude);
      location = {
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        locationText: String(body.location?.locationText ?? "").trim().slice(0, 300),
      };
    }

    const paymentMethod = body.paymentMethod;
    if (!["upi", "card", "netbanking", "cod"].includes(paymentMethod)) return res.status(400).json({ success: false, message: "Invalid payment method" });
    if (paymentMethod === "cod" && deliveryType === "pickup") return res.status(400).json({ success: false, message: "Cash on Delivery is only available for delivery orders" });

    const couponCode = String(body.couponCode ?? "").trim().toUpperCase();
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, active: true }).lean();
      if (!coupon) return res.status(400).json({ success: false, message: "Invalid or inactive coupon code" });
      const subtotal = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
      if (subtotal < coupon.minimum) return res.status(400).json({ success: false, message: `Minimum order value for coupon ${coupon.code} is $${coupon.minimum.toFixed(2)}` });
    }

    const pricing = computePricing(items, deliveryType, coupon);
    let order = null;
    for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
      try {
        order = await Order.create({ orderNumber: generateOrderNumber(), userId, items, pricing, deliveryType, address, location, paymentMethod, paymentStatus: paymentMethod === "cod" ? "cod_pending" : "pending", status: "placed", statusHistory: [{ status: "placed", changedAt: new Date(), changedBy: userId }] });
      } catch (error) {
        if (error.code === 11000 && attempt < 2) continue;
        throw error;
      }
    }
    return res.status(201).json({ success: true, message: "Order placed successfully", order: buildOrderResponse(order) });
  } catch (error) {
    console.error("Create order error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to place order" });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const filter = { userId: req.user.userId };
    const [orders, totalOrders] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Order.countDocuments(filter)]);
    return res.json({ success: true, orders: orders.map(buildOrderResponse), pagination: { page, limit, totalOrders, totalPages: Math.ceil(totalOrders / limit) || 1 } });
  } catch (error) {
    console.error("Get orders error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to get orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ success: false, message: "Order not found" });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId.toString() !== req.user.userId) return res.status(403).json({ success: false, message: "You do not have access to this order" });
    return res.json({ success: true, order: buildOrderResponse(order) });
  } catch (error) {
    console.error("Get order error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to get order" });
  }
};

const generateHandoverCode = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ success: false, message: "Order not found" });
    const order = await Order.findOne({ _id: id, userId: req.user.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (!ACTIVE_HANDOVER_STATUSES.includes(order.status)) return res.status(409).json({ success: false, message: order.status === "cancelled" ? "This order was cancelled" : "Handover was already completed for this order" });
    const code = crypto.randomInt(100000, 1000000).toString();
    const now = new Date();
    order.handover = { codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(now.getTime() + OTP_TTL_MS), attempts: 0, generatedAt: now, verifiedAt: null };
    await order.save();
    return res.json({ success: true, message: "Handover code generated", handover: { code, expiresAt: order.handover.expiresAt, expiresInSec: OTP_TTL_MS / 1000 } });
  } catch (error) {
    console.error("Generate handover code error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to generate handover code" });
  }
};

const verifyHandoverCode = async (req, res) => {
  try {
    const { id } = req.params;
    const code = String(req.body?.code ?? "").trim();
    if (!/^[0-9]{6}$/.test(code)) return res.status(400).json({ success: false, message: "Please enter the 6-digit handover code" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ success: false, message: "Order not found" });
    const order = await Order.findOne({ _id: id, userId: req.user.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (["delivered", "picked_up"].includes(order.status) || order.handover?.verifiedAt) return res.status(409).json({ success: false, message: "Handover was already completed for this order" });
    if (order.status === "cancelled") return res.status(409).json({ success: false, message: "This order was cancelled" });
    const handover = order.handover;
    if (!handover?.codeHash) return res.status(400).json({ success: false, message: "No handover code has been generated yet. Please generate one first." });
    if (!handover.expiresAt || handover.expiresAt <= new Date()) {
      order.handover.codeHash = null; order.handover.expiresAt = null; order.handover.attempts = 0; await order.save();
      return res.status(410).json({ success: false, message: "This handover code has expired. Please generate a new one." });
    }
    const matches = await bcrypt.compare(code, handover.codeHash);
    if (!matches) {
      const attempts = (handover.attempts || 0) + 1;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        order.handover.codeHash = null; order.handover.expiresAt = null; order.handover.attempts = 0; await order.save();
        return res.status(410).json({ success: false, message: "Too many incorrect attempts. Please generate a new handover code." });
      }
      order.handover.attempts = attempts; await order.save();
      return res.status(401).json({ success: false, message: "Incorrect handover code", attemptsRemaining: OTP_MAX_ATTEMPTS - attempts });
    }
    const newStatus = order.deliveryType === "pickup" ? "picked_up" : "delivered";
    const updatedOrder = await Order.findOneAndUpdate({ _id: order._id, userId: req.user.userId, status: { $in: ACTIVE_HANDOVER_STATUSES }, "handover.verifiedAt": null }, { $set: { status: newStatus, "handover.verifiedAt": new Date(), "handover.codeHash": null, "handover.expiresAt": null, "handover.attempts": 0 } }, { new: true });
    if (!updatedOrder) return res.status(409).json({ success: false, message: "Handover was already completed for this order" });
    return res.json({ success: true, message: newStatus === "picked_up" ? "Pickup confirmed. Enjoy your food!" : "Delivery confirmed. Enjoy your food!", order: buildOrderResponse(updatedOrder) });
  } catch (error) {
    console.error("Verify handover code error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to verify handover code" });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, generateHandoverCode, verifyHandoverCode };
