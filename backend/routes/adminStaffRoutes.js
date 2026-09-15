const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const { getStaff, promoteToAdmin } = require("../controllers/adminStaffController");

const router = express.Router();

// Every staff endpoint requires authentication and admin access.
router.use(protect);
router.use(requireAdmin);

// GET /api/admin/staff
router.get("/", getStaff);

// PATCH /api/admin/staff/:id/promote
router.patch("/:id/promote", promoteToAdmin);

module.exports = router;
