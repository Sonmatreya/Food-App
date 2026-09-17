const mongoose = require("mongoose");
const Review = require("../models/Review");
const Food = require("../models/Food");
const Order = require("../models/Order");

const refreshFoodRating = async (foodId) => {
  const [summary] = await Review.aggregate([
    { $match: { foodId: new mongoose.Types.ObjectId(foodId) } },
    {
      $group: {
        _id: "$foodId",
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  await Food.findByIdAndUpdate(foodId, {
    rating: summary ? Math.round(summary.averageRating * 10) / 10 : 0,
    ratingCount: summary ? summary.ratingCount : 0,
  });
};

const getFoodReviews = async (req, res) => {
  try {
    const { foodId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ success: false, message: "Invalid food item." });
    }

    const reviews = await Review.find({ foodId })
      .populate("userId", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      count: reviews.length,
      reviews: reviews.map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          name: review.userId?.name || "Customer",
          profileImage: review.userId?.profileImage || "",
        },
      })),
    });
  } catch (error) {
    console.error("Get reviews error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load reviews." });
  }
};

const createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { foodId, orderId, rating, comment } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(foodId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid food or order." });
    }

    const numericRating = Number(rating);
    const cleanComment = String(comment || "").trim().slice(0, 500);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const food = await Food.findById(foodId).select("_id").lean();
    if (!food) {
      return res.status(404).json({ success: false, message: "Food item not found." });
    }

    // A review is allowed only after successful delivery or pickup,
    // and only for food that was actually included in that order.
    const order = await Order.findOne({
      _id: orderId,
      userId,
      status: { $in: ["delivered", "picked_up"] },
      "items.foodId": foodId,
    }).select("_id").lean();

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You can review this food only after completing an eligible order.",
      });
    }

    const existing = await Review.findOne({ userId, orderId, foodId }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this food for this order.",
      });
    }

    const review = await Review.create({
      foodId,
      userId,
      orderId,
      rating: numericRating,
      comment: cleanComment,
    });

    await refreshFoodRating(foodId);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this food for this order.",
      });
    }

    console.error("Create review error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to submit review." });
  }
};

module.exports = { getFoodReviews, createReview };
