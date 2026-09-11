const express = require("express");

const {
  generateCaptcha,
  audioCaptcha,
  verifyCaptcha,
} = require("../controllers/captchaController");

const {
  captchaGenerateLimiter,
  captchaVerifyLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

// =========================================================
// GENERATE CAPTCHA
// =========================================================

router.get(
  "/generate",
  captchaGenerateLimiter,
  generateCaptcha
);

// =========================================================
// AUDIO CAPTCHA
// =========================================================

router.get(
  "/audio/:captchaId",
  captchaGenerateLimiter,
  audioCaptcha
);

// =========================================================
// VERIFY CAPTCHA
// =========================================================

router.post(
  "/verify",
  captchaVerifyLimiter,
  verifyCaptcha
);

module.exports = router;