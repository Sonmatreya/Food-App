const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const { getFoodReviews, createReview, getAdminReviews } = require("../controllers/reviewController");

const router = express.Router();

router.get("/food/:foodId", getFoodReviews);
router.get("/admin", protect, requireAdmin, getAdminReviews);
router.post("/", protect, createReview);

module.exports = router;
