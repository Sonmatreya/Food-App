const express = require("express");
const { chatWithAssistant, generateFood } = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

router.post("/chat", optionalAuth, chatWithAssistant);
router.post("/generate-food", protect, requireAdmin, generateFood);

module.exports = router;
