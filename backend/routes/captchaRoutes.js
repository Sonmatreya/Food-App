const express = require("express");

const {
  generateCaptcha,
  readCaptcha,
  verifyCaptcha,
} = require("../controllers/captchaController");

const router = express.Router();

// Generate CAPTCHA
router.get("/generate", generateCaptcha);

// Read CAPTCHA aloud
router.post("/read", readCaptcha);

// Verify CAPTCHA
router.post("/verify", verifyCaptcha);

module.exports = router;