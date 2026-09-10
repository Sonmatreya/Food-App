const svgCaptcha = require("svg-captcha");
const crypto = require("crypto");

// Temporary in-memory CAPTCHA storage.
// Later, for production/multiple server instances,
// move this to Redis or another shared store.
const captchaStore = new Map();

const CAPTCHA_EXPIRY = 5 * 60 * 1000; // 5 minutes

// ========================================
// GENERATE CAPTCHA
// ========================================

const generateCaptcha = (req, res) => {
  try {
    const captcha = svgCaptcha.create({
      size: 5,
      noise: 3,
      color: true,
      background: "#f5f5f5",
      width: 170,
      height: 55,
      fontSize: 42,
      ignoreChars: "0o1iIl",
      charPreset:
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    });

    // Generate a random CAPTCHA ID
    const captchaId = crypto.randomUUID();

    // Store CAPTCHA answer on server
    captchaStore.set(captchaId, {
      answer: captcha.text.toUpperCase(),
      expiresAt: Date.now() + CAPTCHA_EXPIRY,
      audioRequested: false,
    });

    // Send ONLY the ID and image
    // Do NOT send the answer here.
    res.json({
      success: true,
      captchaId,
      captchaImage: captcha.data,
    });
  } catch (error) {
    console.error(
      "CAPTCHA generation error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to generate CAPTCHA",
    });
  }
};

// ========================================
// READ CAPTCHA FOR ACCESSIBILITY
// ========================================

const readCaptcha = (req, res) => {
  try {
    const { captchaId } = req.body;

    if (!captchaId) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA ID is required",
      });
    }

    const captchaData = captchaStore.get(captchaId);

    if (!captchaData) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA expired or invalid",
      });
    }

    // Check expiry
    if (Date.now() > captchaData.expiresAt) {
      captchaStore.delete(captchaId);

      return res.status(400).json({
        success: false,
        message: "CAPTCHA expired. Please refresh.",
      });
    }

    /*
      Return the CAPTCHA text only when the user
      explicitly requests accessibility reading.

      The frontend will use browser SpeechSynthesis
      to speak these characters aloud.
    */

    captchaData.audioRequested = true;

    return res.json({
      success: true,
      captchaText: captchaData.answer,
    });
  } catch (error) {
    console.error(
      "CAPTCHA read error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to read CAPTCHA",
    });
  }
};

// ========================================
// VERIFY CAPTCHA
// ========================================

const verifyCaptcha = (req, res) => {
  try {
    const {
      captchaId,
      captchaAnswer,
    } = req.body;

    if (!captchaId || !captchaAnswer) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA is required",
      });
    }

    const captchaData = captchaStore.get(captchaId);

    if (!captchaData) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA expired or invalid",
      });
    }

    // Check expiry before verification
    if (Date.now() > captchaData.expiresAt) {
      captchaStore.delete(captchaId);

      return res.status(400).json({
        success: false,
        message: "CAPTCHA expired. Please refresh.",
      });
    }

    const answer = String(captchaAnswer)
      .trim()
      .toUpperCase();

    // Wrong answer
    if (answer !== captchaData.answer) {
      // Delete the CAPTCHA after an incorrect attempt
      captchaStore.delete(captchaId);

      return res.status(400).json({
        success: false,
        message: "Incorrect CAPTCHA. Please try again.",
      });
    }

    // Correct answer
    // Delete immediately so it cannot be reused.
    captchaStore.delete(captchaId);

    return res.json({
      success: true,
      message: "CAPTCHA verified",
    });
  } catch (error) {
    console.error(
      "CAPTCHA verification error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to verify CAPTCHA",
    });
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  generateCaptcha,
  readCaptcha,
  verifyCaptcha,
};