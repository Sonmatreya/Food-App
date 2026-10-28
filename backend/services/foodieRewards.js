const User = require("../models/User");
const Order = require("../models/Order");

// One point is worth ₹0.10. Earn one point for every ₹100 of eligible
// food spend, and award it only after a delivery/pickup is completed.
const awardFoodiePoints = async (orderId) => {
  const order = await Order.findOne({ _id: orderId, status: { $in: ["delivered", "picked_up"] }, rewardsAwarded: { $ne: true } });
  if (!order) return 0;
  const eligibleSpend = Math.max(0, Number(order.pricing?.subtotal || 0) - Number(order.pricing?.discount || 0) - Number(order.pricing?.rewardsDiscount || 0));
  const points = Math.floor(eligibleSpend / 100);
  order.rewardsAwarded = true;
  order.rewardsPointsEarned = points;
  await order.save();
  if (points > 0) await User.updateOne({ _id: order.userId }, { $inc: { foodiePoints: points } });
  return points;
};

const refundRedeemedFoodiePoints = async (orderId) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, rewardsPointsRedeemed: { $gt: 0 }, rewardsPointsRefunded: { $ne: true } },
    { $set: { rewardsPointsRefunded: true } },
    { new: true }
  );
  if (!order) return 0;
  await User.updateOne({ _id: order.userId }, { $inc: { foodiePoints: order.rewardsPointsRedeemed } });
  return order.rewardsPointsRedeemed;
};

module.exports = { awardFoodiePoints, refundRedeemedFoodiePoints };
