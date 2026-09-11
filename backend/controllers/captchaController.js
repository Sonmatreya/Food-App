const svgCaptcha = require("svg-captcha");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Gtts = require("node-gtts");

const { captchaSecret } = require("../config/env");

// =========================================================
// CAPTCHA STORAGE
// =========================================================

// In-memory storage is suitable for the current single-instance
// development setup.
//
// For production horizontal scaling, move these stores to Redis
// or another shared TTL-backed store.
const captchaStore = new Map();
const captchaProofStore = new Map();

const CAPTCHA_EXPIRY = 5 * 60 * 1000;
const CAPTCHA_PROOF_EXPIRY = 5 * 60 * 1000;

// =========================================================
// REMOVE EXPIRED ENTRIES
// =========================================================

const removeExpiredEntries = () => {
  const now = Date.now();

  for (const [captchaId, captchaData] of captchaStore) {
    if (now > captchaData.expiresAt) {
      captchaStore.delete(captchaId);
    }
  }

  for (const [proofId, proofData] of captchaProofStore) {
    if (now > proofData.expiresAt) {
      captchaProofStore.delete(proofId);
    }
  }
};

// =========================================================
// GENERATE CAPTCHA
// =========================================================

const generateCaptcha = (req, res) => {
  try {
    removeExpiredEntries();

    const captcha = svgCaptcha.create({
      size: 5,
      noise: 3,
      color: true,
      background: "#f5f5f5",
      width: 170,
      height: 55,
      fontSize: 42,
      ignoreChars: "0o1iIl",
      charPreset: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    });

    const captchaId = crypto.randomUUID();

    captchaStore.set(captchaId, {
      answer: captcha.text.toUpperCase(),
      expiresAt: Date.now() + CAPTCHA_EXPIRY,
    });

    return res.json({
      success: true,
      captchaId,
      captchaImage: captcha.data,
    });
  } catch (error) {
    console.error("CAPTCHA generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate CAPTCHA",
    });
  }
};

// =========================================================
// AUDIO CAPTCHA
// =========================================================
//
// The CAPTCHA answer stays on the backend.
//
// React only receives an audio/mpeg response.
// The answer is NEVER returned as JSON.
//
// =========================================================

const audioCaptcha = (req, res) => {
  try {
    removeExpiredEntries();

    const { captchaId } = req.params;

    if (!captchaId) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA ID is required",
      });
    }

    const captchaData = captchaStore.get(captchaId);

    if (!captchaData) {
      return res.status(404).json({
        success: false,
        message: "CAPTCHA expired or invalid. Please refresh.",
      });
    }

    if (Date.now() > captchaData.expiresAt) {
      captchaStore.delete(captchaId);

      return res.status(404).json({
        success: false,
        message: "CAPTCHA expired. Please refresh.",
      });
    }

    const captchaText = captchaData.answer;

    // Spell the characters individually so the audio
    // is understandable as a CAPTCHA.
    //
    // Example:
    // ABC23
    //
    // becomes:
    // "A B C 2 3"
    const speechText = captchaText
      .split("")
      .join(" ");

    const gtts = new Gtts("en");

    res.status(200);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const audioStream = gtts.stream(speechText);

    audioStream.on("error", (error) => {
      console.error("CAPTCHA audio stream error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Unable to generate CAPTCHA audio",
        });
      }

      res.end();
    });

    audioStream.pipe(res);
  } catch (error) {
    console.error("CAPTCHA audio error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to generate CAPTCHA audio",
      });
    }

    res.end();
  }
};

// =========================================================
// VERIFY CAPTCHA
// =========================================================

const verifyCaptcha = (req, res) => {
  try {
    removeExpiredEntries();

    const { captchaId, captchaAnswer } = req.body;

    if (!captchaId || !captchaAnswer) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA is required",
      });
    }

    const captchaData = captchaStore.get(captchaId);

    if (!captchaData || Date.now() > captchaData.expiresAt) {
      captchaStore.delete(captchaId);

      return res.status(400).json({
        success: false,
        message: "CAPTCHA expired or invalid. Please refresh.",
      });
    }

    const answer = String(captchaAnswer)
      .trim()
      .toUpperCase();

    // CAPTCHA is one-time-use.
    captchaStore.delete(captchaId);

    if (answer !== captchaData.answer) {
      return res.status(400).json({
        success: false,
        message: "Incorrect CAPTCHA. Please try again.",
      });
    }

    // =====================================================
    // CAPTCHA PROOF
    // =====================================================

    const proofId = crypto.randomUUID();

    const expiresAt =
      Date.now() + CAPTCHA_PROOF_EXPIRY;

    const captchaProof = jwt.sign(
      {
        purpose: "login",
        proofId,
      },
      captchaSecret,
      {
        expiresIn: "5m",
      }
    );

    captchaProofStore.set(proofId, {
      expiresAt,
    });

    return res.json({
      success: true,
      message: "CAPTCHA verified",
      captchaProof,
    });
  } catch (error) {
    console.error(
      "CAPTCHA verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify CAPTCHA",
    });
  }
};

// =========================================================
// CONSUME CAPTCHA PROOF
// =========================================================

const consumeCaptchaProof = (captchaProof) => {
  try {
    removeExpiredEntries();

    const decoded = jwt.verify(
      captchaProof,
      captchaSecret
    );

    if (
      decoded.purpose !== "login" ||
      !decoded.proofId
    ) {
      return false;
    }

    const proofData =
      captchaProofStore.get(decoded.proofId);

    if (
      !proofData ||
      Date.now() > proofData.expiresAt
    ) {
      return false;
    }

    // One-time proof
    captchaProofStore.delete(decoded.proofId);

    return true;
  } catch {
    return false;
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  generateCaptcha,
  audioCaptcha,
  verifyCaptcha,
  consumeCaptchaProof,
};