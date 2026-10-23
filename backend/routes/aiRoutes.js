const express = require("express");
const { chatWithAssistant, generateFood } = require("../controllers/aiController");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const optionalAuth = require("../middleware/optionalAuthMiddleware");
const { aiChatLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/chat", aiChatLimiter, optionalAuth, chatWithAssistant);
router.post("/generate-food", protect, requireAdmin, generateFood);

module.exports = router;
