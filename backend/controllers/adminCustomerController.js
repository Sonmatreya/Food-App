const User = require("../models/User");
const Order = require("../models/Order");

// =========================================================
// CUSTOMER RESPONSE SANITIZER
// Never expose passwords, Google IDs, OTP hashes,
// payment-card information, JWTs, or other secrets.
// =========================================================

const buildCustomerResponse = (user, stats = {}) => ({
  id: user._id,
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt || null,

  totalOrders: stats.totalOrders || 0,
  totalSpent: stats.totalSpent || 0,
  lastOrderDate: stats.lastOrderDate || null,
});

// =========================================================
// GET ALL CUSTOMERS
// GET /api/admin/customers
// =========================================================

const getCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {
      role: "customer",
    };

    const [users, totalCustomers] = await Promise.all([
      User.find(filter)
        .select("_id name email phone isVerified createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const userIds = users.map((user) => user._id);

    const orderStats = await Order.aggregate([
      {
        $match: {
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: "$userId",

          totalOrders: {
            $sum: 1,
          },

          totalSpent: {
            $sum: {
              $cond: [
                {
                  $ne: ["$status", "cancelled"],
                },
                "$pricing.grandTotal",
                0,
              ],
            },
          },

          lastOrderDate: {
            $max: "$createdAt",
          },
        },
      },
    ]);

    const statsMap = new Map(
      orderStats.map((stat) => [
        String(stat._id),
        {
          totalOrders: stat.totalOrders || 0,
          totalSpent: stat.totalSpent || 0,
          lastOrderDate: stat.lastOrderDate || null,
        },
      ])
    );

    const customers = users.map((user) =>
      buildCustomerResponse(
        user,
        statsMap.get(String(user._id)) || {}
      )
    );

    return res.status(200).json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit),
        hasMore: page * limit < totalCustomers,
      },
    });
  } catch (error) {
    console.error("Get customers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load customers",
    });
  }
};

// =========================================================
// GET CUSTOMER DETAILS
// GET /api/admin/customers/:id
// =========================================================

const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------------------
    // Validate MongoDB ObjectId
    // -----------------------------------------------------

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // -----------------------------------------------------
    // Find customer
    // -----------------------------------------------------

    const user = await User.findOne({
      _id: id,
      role: "customer",
    })
      .select("_id name email phone isVerified createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // -----------------------------------------------------
    // Get customer's orders
    // -----------------------------------------------------

    const orders = await Order.find({
      userId: user._id,
    })
      .select(
        [
          "_id",
          "orderNumber",
          "items",
          "pricing",
          "deliveryType",
          "paymentMethod",
          "paymentStatus",
          "status",
          "createdAt",
          "updatedAt",
        ].join(" ")
      )
      .sort({ createdAt: -1 })
      .lean();

    // -----------------------------------------------------
    // Calculate customer statistics
    // -----------------------------------------------------

    const totalOrders = orders.length;

    const totalSpent = orders.reduce((total, order) => {
      if (order.status === "cancelled") {
        return total;
      }

      return total + Number(order.pricing?.grandTotal || 0);
    }, 0);

    const lastOrderDate =
      orders.length > 0 ? orders[0].createdAt : null;

    // -----------------------------------------------------
    // Sanitize order response
    // -----------------------------------------------------

    const safeOrders = orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber || "",
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

      deliveryType: order.deliveryType || "",
      paymentMethod: order.paymentMethod || "",
      paymentStatus: order.paymentStatus || "",
      status: order.status || "",
      createdAt: order.createdAt || null,
      updatedAt: order.updatedAt || null,
    }));

    // -----------------------------------------------------
    // Customer response
    // -----------------------------------------------------

    const customer = buildCustomerResponse(user, {
      totalOrders,
      totalSpent,
      lastOrderDate,
    });

    return res.status(200).json({
      success: true,
      customer,
      orders: safeOrders,
      pagination: {
        total: totalOrders,
      },
    });
  } catch (error) {
    console.error("Get customer details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load customer details",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getCustomers,
  getCustomerDetails,
};