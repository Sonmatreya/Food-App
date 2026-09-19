const express = require("express");

const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const {
  getCustomers,
  getCustomerDetails,
  updateCustomerVerification,
} = require("../controllers/adminCustomerController");

const router = express.Router();

// =========================================================
// ADMIN PROTECTION
// Every route below requires:
// 1. Valid login
// 2. Admin role
// =========================================================

router.use(protect);
router.use(requireAdmin);

// =========================================================
// CUSTOMER MANAGEMENT
// =========================================================

// Customer list
// GET /api/admin/customers
router.get("/", getCustomers);

// Customer details
// GET /api/admin/customers/:id
router.patch("/:id/verification", updateCustomerVerification);

// Customer details
// GET /api/admin/customers/:id
router.get("/:id", getCustomerDetails);

module.exports = router;