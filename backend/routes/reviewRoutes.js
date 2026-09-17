const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getFoodReviews, createReview } = require("../controllers/reviewController");

const router = express.Router();

router.get("/food/:foodId", getFoodReviews);
router.post("/", protect, createReview);

module.exports = router;
