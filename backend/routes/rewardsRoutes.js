const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getFoodieRewards } = require("../controllers/rewardsController");

const router = express.Router();
router.use(protect);
router.get("/", getFoodieRewards);

module.exports = router;
