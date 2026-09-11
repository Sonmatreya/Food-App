const express = require("express");
const passport = require("../config/googleAuth");
const { clientUrl } = require("../config/env");

const {
  register,
  login,
  googleLoginSuccess,
  logout,
  getMe,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const requireCaptcha = require("../middleware/requireCaptcha");
const {
  loginLimiter,
  registerLimiter,
  googleAuthLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

// ===============================
// Normal Authentication
// ===============================

router.post("/register", registerLimiter, register);

router.post("/login", loginLimiter, requireCaptcha, login);

router.post("/logout", logout);

router.get("/me", protect, getMe);


// ===============================
// Google Authentication
// ===============================

// Start Google Login
router.get(
  "/google",
  googleAuthLimiter,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth Callback
router.get(
  "/google/callback",
  googleAuthLimiter,
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      `${clientUrl}/login?google=failed`,
  }),
  googleLoginSuccess
);

module.exports = router;
