const User = require("../models/User");
const Order = require("../models/Order");

const getFoodieRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("foodiePoints").lean();
    if (!user) return res.status(404).json({ success: false, message: "Customer account not found." });
    const orders = await Order.find({ userId: req.user.userId, rewardsPointsEarned: { $gt: 0 } })
      .select("orderNumber rewardsPointsEarned status createdAt")
      .sort({ createdAt: -1 }).limit(10).lean();
    return res.json({
      success: true,
      points: Math.max(0, Number(user.foodiePoints || 0)),
      rules: { pointsPerRupee: 10, rupeesPerPoint: 0.1, earnPerHundredRupees: 1, awardOn: "delivery or pickup completion" },
      recentEarnings: orders.map((order) => ({
        orderNumber: order.orderNumber,
        points: order.rewardsPointsEarned,
        status: order.status,
        date: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get Foodie Rewards failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load Foodie Rewards." });
  }
};

module.exports = { getFoodieRewards };
