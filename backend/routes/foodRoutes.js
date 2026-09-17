const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require("../controllers/foodController");

const router = express.Router();

// Public catalogue endpoints
router.get("/", getFoods);
router.get("/:id", getFoodById);

// Admin catalogue management
router.post("/", protect, requireAdmin, createFood);
router.put("/:id", protect, requireAdmin, updateFood);
router.delete("/:id", protect, requireAdmin, deleteFood);

module.exports = router;
