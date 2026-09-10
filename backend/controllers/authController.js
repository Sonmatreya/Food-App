const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Set authentication cookie
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Register
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: "Name, password and email or phone are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    const existingUser = await User.findOne({
      $or: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this email or phone",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
      password: hashedPassword,
      isVerified: true,
    });

    const token = generateToken(user._id);

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or phone and password are required",
      });
    }

    const identifier =
      email?.trim().toLowerCase() || phone?.trim();

    const query = email
      ? { email: identifier }
      : { phone: identifier };

    const user = await User.findOne(query).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/phone or password",
      });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/phone or password",
      });
    }

    const token = generateToken(user._id);

    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Google Login Success
const googleLoginSuccess = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        "http://localhost:3000/login?google=failed"
      );
    }

    const token = generateToken(req.user._id);

    setAuthCookie(res, token);

    return res.redirect("http://localhost:3000/");
  } catch (error) {
    console.error(
      "Google login success error:",
      error.message
    );

    return res.redirect(
      "http://localhost:3000/login?google=failed"
    );
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.json({
    success: true,
    message: "Logout successful",
  });
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Get user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to get user",
    });
  }
};

module.exports = {
  register,
  login,
  googleLoginSuccess,
  logout,
  getMe,
  generateToken,
};