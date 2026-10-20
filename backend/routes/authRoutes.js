const express = require("express");
const passport = require("../config/googleAuth");
const { clientUrl, googleOAuthEnabled } = require("../config/env");

const {
  register,
  login,
  googleLoginSuccess,
  logout,
  getMe,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  demoResetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const requireCaptcha = require("../middleware/requireCaptcha");
const {
  loginLimiter,
  registerLimiter,
  googleAuthLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

const requireGoogleOAuth = (req, res, next) => {
  if (!googleOAuthEnabled) {
    return res.status(503).json({
      success: false,
      message: "Google login is not configured on this server. Use email/phone login instead.",
    });
  }
  return next();
};

// ===============================
// Normal Authentication
// ===============================

router.post("/register", registerLimiter, register);

router.post("/login", loginLimiter, requireCaptcha, login);
router.post("/forgot-password", passwordResetLimiter, requestPasswordReset);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.post("/demo-reset-password", passwordResetLimiter, demoResetPassword);

router.post("/logout", logout);

router.get("/me", protect, getMe);

// Update own profile (name, phone)
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);


// ===============================
// Google Authentication
// ===============================

// Start Google Login
router.get(
  "/google",
  googleAuthLimiter,
  requireGoogleOAuth,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth Callback
router.get(
  "/google/callback",
  googleAuthLimiter,
  requireGoogleOAuth,
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      `${clientUrl}/login?google=failed`,
  }),
  googleLoginSuccess
);

module.exports = router;
