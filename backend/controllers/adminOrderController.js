const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const { getUserRoom, ADMIN_ROOM } = require("../config/socket");

const OPERATIONAL_STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "cancelled",
];

const STATUS_TRANSITIONS = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["cancelled"],
  out_for_delivery: [],
  cancelled: [],
};

const buildAdminOrderResponse = (order) => ({
  id: order._id,
  orderNumber: order.orderNumber || "",
  customer: order.userId
    ? {
        id: order.userId._id,
        name: order.userId.name || "",
        email: order.userId.email || "",
        phone: order.userId.phone || "",
      }
    : null,
  items: Array.isArray(order.items)
    ? order.items.map((item) => ({
        foodId: item.foodId || null,
        name: item.name || "",
        category: item.category || "",
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 0),
        cookingRequest: item.cookingRequest || "",
        image: item.image || "",
      }))
    : [],
  pricing: {
    subtotal: Number(order.pricing?.subtotal || 0),
    discount: Number(order.pricing?.discount || 0),
    couponCode: order.pricing?.couponCode || "",
    deliveryFee: Number(order.pricing?.deliveryFee || 0),
    serviceFee: Number(order.pricing?.serviceFee || 0),
    tax: Number(order.pricing?.tax || 0),
    grandTotal: Number(order.pricing?.grandTotal || 0),
  },
  deliveryType: order.deliveryType || "delivery",
  address:
    order.deliveryType === "delivery"
      ? {
          name: order.address?.name || "",
          phone: order.address?.phone || "",
          addressLine: order.address?.addressLine || "",
          city: order.address?.city || "",
          pincode: order.address?.pincode || "",
        }
      : null,
  location:
    order.deliveryType === "delivery"
      ? {
          latitude: order.location?.latitude ?? null,
          longitude: order.location?.longitude ?? null,
          locationText: order.location?.locationText || "",
        }
      : null,
  paymentMethod: order.paymentMethod || "",
  paymentStatus: order.paymentStatus || "",
  status: order.status || "",
  createdAt: order.createdAt || null,
  updatedAt: order.updatedAt || null,
  cancelledAt: order.cancelledAt || null,
  statusHistory: Array.isArray(order.statusHistory)
    ? order.statusHistory.map((entry) => ({
        status: entry.status,
        changedAt: entry.changedAt,
      }))
    : [],
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

const getAdminOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const paymentStatus = String(req.query.paymentStatus || "").trim();
    const deliveryType = String(req.query.deliveryType || "").trim();

    const filter = {};

    if (status) {
      if (!["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled", "picked_up"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid order status" });
      }
      filter.status = status;
    }

    if (paymentStatus) {
      if (!["pending", "cod_pending", "paid", "failed"].includes(paymentStatus)) {
        return res.status(400).json({ success: false, message: "Invalid payment status" });
      }
      filter.paymentStatus = paymentStatus;
    }

    if (deliveryType) {
      if (!["delivery", "pickup"].includes(deliveryType)) {
        return res.status(400).json({ success: false, message: "Invalid delivery type" });
      }
      filter.deliveryType = deliveryType;
    }

    if (search) {
      const matchingUsers = await User.find({
        role: "customer",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }).select("_id").lean();

      const userIds = matchingUsers.map((user) => user._id);
      const searchConditions = [{ orderNumber: { $regex: search, $options: "i" } }];
      if (userIds.length > 0) searchConditions.push({ userId: { $in: userIds } });
      filter.$or = searchConditions;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate("userId", "_id name email phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      orders: orders.map(buildAdminOrderResponse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total },
    });
  } catch (error) {
    console.error("Get admin orders error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
};

const getAdminOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ success: false, message: "Order not found" });

    const order = await Order.findById(id).populate("userId", "_id name email phone").lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    return res.status(200).json({ success: true, order: buildAdminOrderResponse(order) });
  } catch (error) {
    console.error("Get admin order details error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load order details" });
  }
};

const updateAdminOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const requestedStatus = String(req.body?.status || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ success: false, message: "Order not found" });
    if (!OPERATIONAL_STATUSES.includes(requestedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid operational order status" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (["delivered", "picked_up"].includes(order.status)) {
      return res.status(409).json({ success: false, message: "Completed orders cannot be changed" });
    }

    if (requestedStatus === order.status) {
      return res.status(200).json({ success: true, message: "Order status unchanged", order: buildAdminOrderResponse(await Order.findById(order._id).populate("userId", "_id name email phone").lean()) });
    }

    const allowedNextStatuses = [...(STATUS_TRANSITIONS[order.status] || [])];

    // A pickup order goes from Ready directly to handover verification.
    // A delivery order may move from Ready to Out for Delivery.
    if (order.status === "ready" && order.deliveryType === "delivery") {
      allowedNextStatuses.push("out_for_delivery");
    }

    if (!allowedNextStatuses.includes(requestedStatus)) {
      return res.status(409).json({
        success: false,
        message: `Invalid status transition: ${order.status} → ${requestedStatus}`,
      });
    }

    if (requestedStatus === "cancelled") {
      order.cancelledAt = new Date();
      order.handover = {
        codeHash: null,
        expiresAt: null,
        attempts: 0,
        generatedAt: null,
        verifiedAt: null,
      };
    }

    order.status = requestedStatus;

    order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    order.statusHistory.push({
      status: requestedStatus,
      changedAt: new Date(),
      changedBy: req.user.userId,
    });
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("userId", "_id name email phone")
      .lean();
    // Notify the customer immediately after the status is persisted.
    // The event is sent only to the authenticated customer room.
    const io = req.app.get("io");
    if (io && populated?.userId?._id) {
      const eventPayload = {
        orderId: String(populated._id),
        orderNumber: populated.orderNumber || "",
        status: populated.status || "",
        statusHistory: Array.isArray(populated.statusHistory)
          ? populated.statusHistory.map((entry) => ({
              status: entry.status,
              changedAt: entry.changedAt,
            }))
          : [],
        updatedAt: populated.updatedAt || null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order: buildAdminOrderResponse(populated),
    });
  } catch (error) {
    console.error("Update admin order status error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
};

const getAdminDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const indiaDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayStart = new Date(indiaDate + "T00:00:00+05:30");
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [totalOrders, totalCustomers, todayRevenue, pendingOrders, recentOrders] = await Promise.all([
      Order.countDocuments({}),
      User.countDocuments({ role: "customer" }),
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lt: tomorrowStart }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$pricing.grandTotal" } } },
      ]),
      Order.countDocuments({ status: { $in: ["placed", "confirmed", "preparing", "ready", "out_for_delivery"] } }),
      Order.find({}).populate("userId", "_id name email phone").sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return res.status(200).json({
      success: true,
      stats: { totalOrders, customers: totalCustomers, revenueToday: Number(todayRevenue[0]?.total || 0), pendingOrders },
      recentOrders: recentOrders.map(buildAdminOrderResponse),
    });
  } catch (error) {
    console.error("Get admin dashboard summary error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load dashboard summary" });
  }
};
module.exports = { getAdminOrders, getAdminOrderDetails, updateAdminOrderStatus, getAdminDashboardSummary };
