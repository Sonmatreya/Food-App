const express = require("express");
const passport = require("../config/googleAuth");

const {
  register,
  login,
  googleLoginSuccess,
  logout,
  getMe,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// Normal Authentication
// ===============================

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", protect, getMe);


// ===============================
// Google Authentication
// ===============================

// Start Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      "http://localhost:3000/login?google=failed",
  }),
  googleLoginSuccess
);

module.exports = router;