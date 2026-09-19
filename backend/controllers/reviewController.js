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

const getAdminReviews = async (req, res) => {
  try {
    const { search = "", rating = "all", page = 1, limit = 9 } = req.query;
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 9));
    const filters = {};
    if (rating !== "all" && /^[1-5]$/.test(String(rating))) filters.rating = Number(rating);

    const searchText = String(search).trim();
    const pipeline = [
      { $match: filters },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "foods", localField: "foodId", foreignField: "_id", as: "food" } },
      { $unwind: { path: "$food", preserveNullAndEmptyArrays: true } },
      ...(searchText ? [{
        $match: {
          $or: [
            { comment: { $regex: searchText, $options: "i" } },
            { "user.name": { $regex: searchText, $options: "i" } },
            { "food.name": { $regex: searchText, $options: "i" } },
          ],
        },
      }] : []),
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          reviews: [
            { $skip: (currentPage - 1) * pageSize },
            { $limit: pageSize },
            { $project: {
              _id: 1, rating: 1, comment: 1, createdAt: 1,
              customer: { $ifNull: ["$user.name", "Customer"] },
              customerImage: { $ifNull: ["$user.profileImage", ""] },
              food: { $ifNull: ["$food.name", "Food item"] },
              foodImage: { $ifNull: ["$food.image", ""] },
            } },
          ],
          count: [{ $count: "total" }],
          summary: [
            { $group: { _id: null, total: { $sum: 1 }, average: { $avg: "$rating" }, five: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }, low: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } } } },
          ],
        },
      },
    ];

    const [result] = await Review.aggregate(pipeline);
    const total = result.count?.[0]?.total || 0;
    const summary = result.summary?.[0] || { total: 0, average: 0, five: 0, low: 0 };
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.json({
      success: true,
      reviews: result.reviews || [],
      pagination: { page: currentPage, limit: pageSize, total, totalPages },
      summary: {
        total: summary.total || 0,
        average: Math.round((summary.average || 0) * 10) / 10,
        five: summary.five || 0,
        low: summary.low || 0,
      },
    });
  } catch (error) {
    console.error("Get admin reviews error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load customer feedback." });
  }
};

module.exports = { getFoodReviews, createReview, getAdminReviews };
