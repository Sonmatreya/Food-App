const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const { getCoupons, getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } = require("../controllers/couponController");

const router = express.Router();

router.get("/", getCoupons);
router.get("/admin", protect, requireAdmin, getAdminCoupons);
router.post("/", protect, requireAdmin, createCoupon);
router.put("/:id", protect, requireAdmin, updateCoupon);
router.delete("/:id", protect, requireAdmin, deleteCoupon);

module.exports = router;
