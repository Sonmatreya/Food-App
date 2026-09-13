const express = require("express");

const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const {
  getAdminOrders,
  getAdminOrderDetails,
  updateAdminOrderStatus,
} = require("../controllers/adminOrderController");

const router = express.Router();

// Every admin order endpoint requires authentication and admin access.
router.use(protect);
router.use(requireAdmin);

// GET /api/admin/orders
router.get("/", getAdminOrders);

// GET /api/admin/orders/:id
router.get("/:id", getAdminOrderDetails);

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", updateAdminOrderStatus);

module.exports = router;
