const express = require("express");
const rateLimit = require("express-rate-limit");
const { createSupportRequest } = require("../controllers/supportController");

const router = express.Router();

const supportRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many support requests. Please try again in 15 minutes." },
});

router.post("/", supportRequestLimiter, createSupportRequest);

module.exports = router;
