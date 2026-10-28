const User = require("../models/User");
const Order = require("../models/Order");

// One point is worth ₹0.10. Earn one point for every ₹100 of eligible
// food spend, and award it only after a delivery/pickup is completed.
const awardFoodiePoints = async (orderId) => {
  // Read the pricing snapshot first, then atomically claim the one-time award.
  // The conditional update prevents simultaneous handover requests from
  // awarding the same order's points more than once.
  const candidate = await Order.findOne({
    _id: orderId,
    status: { $in: ["delivered", "picked_up"] },
    rewardsAwarded: { $ne: true },
  }).select("userId pricing").lean();

  if (!candidate) return 0;

  const eligibleSpend = Math.max(
    0,
    Number(candidate.pricing?.subtotal || 0) -
      Number(candidate.pricing?.discount || 0) -
      Number(candidate.pricing?.rewardsDiscount || 0)
  );
  const points = Math.floor(eligibleSpend / 100);

  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: { $in: ["delivered", "picked_up"] },
      rewardsAwarded: { $ne: true },
    },
    { $set: { rewardsAwarded: true, rewardsPointsEarned: points } },
    { new: true }
  ).select("userId").lean();

  // Another request may have claimed the award between the read and update.
  if (!claimedOrder) return 0;

  if (points > 0) {
    await User.updateOne(
      { _id: claimedOrder.userId },
      { $inc: { foodiePoints: points } }
    );
  }
  return points;
};

const refundRedeemedFoodiePoints = async (orderId) => {
  // Claim the refund atomically so concurrent cancellation requests cannot
  // credit the same redeemed points twice.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, rewardsPointsRedeemed: { $gt: 0 }, rewardsPointsRefunded: { $ne: true } },
    { $set: { rewardsPointsRefunded: true } },
    { new: true }
  );
  if (!order) return 0;

  try {
    const credit = await User.updateOne(
      { _id: order.userId },
      { $inc: { foodiePoints: order.rewardsPointsRedeemed } }
    );
    if (credit.matchedCount === 0) {
      throw new Error("Could not refund Foodie Points because the customer account was not found");
    }
    return order.rewardsPointsRedeemed;
  } catch (error) {
    // Make a failed credit retryable. The conditional reset avoids changing
    // the flag if another recovery path has already changed it.
    await Order.updateOne(
      { _id: order._id, rewardsPointsRefunded: true },
      { $set: { rewardsPointsRefunded: false } }
    );
    throw error;
  }
};

module.exports = { awardFoodiePoints, refundRedeemedFoodiePoints };
