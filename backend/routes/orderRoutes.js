const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  generateHandoverCode,
  verifyHandoverCode,
} = require("../controllers/orderController");

const {
  otpGenerateLimiter,
  otpVerifyLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

// All order routes require authentication
router.use(protect);

// POST /api/orders — place a new order
router.post("/", createOrder);

// GET /api/orders — current user's order history
router.get("/", getMyOrders);

// GET /api/orders/:id — single order (owner only)
router.get("/:id", getOrderById);

// POST /api/orders/:id/handover-code — generate handover OTP (owner only)
router.post(
  "/:id/handover-code",
  otpGenerateLimiter,
  generateHandoverCode
);

// POST /api/orders/:id/handover-verify — verify handover OTP (owner only)
router.post(
  "/:id/handover-verify",
  otpVerifyLimiter,
  verifyHandoverCode
);

module.exports = router;
