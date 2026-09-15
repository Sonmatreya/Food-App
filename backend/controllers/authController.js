const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret, isProduction, clientUrl } = require("../config/env");

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: "7d" }
  );
};

// Set authentication cookie
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Whitelisted public user shape — mirrors the objects returned by
// register / login / getMe. Never exposes password or internal fields.
// Used only by updateProfile.
const buildProfileResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  profileImage: user.profileImage,
});

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

    const identifier = email?.trim().toLowerCase() || phone?.trim();

    const query = email ? { email: identifier } : { phone: identifier };

    const user = await User.findOne(query).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/phone or password",
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);

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
      return res.redirect(`${clientUrl}/login?google=failed`);
    }

    const token = generateToken(req.user._id);

    setAuthCookie(res, token);

    // Google authentication already gives us the complete User document,
    // including the database role. Send admins directly to the admin panel
    // instead of always sending every Google user to the customer home page.
    const destination = req.user.role === "admin" ? "/admin" : "/";

    return res.redirect(`${clientUrl}${destination}`);
  } catch (error) {
    console.error("Google login success error:", error.message);

    return res.redirect(`${clientUrl}/login?google=failed`);
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.json({
    success: true,
    message: "Logout successful",
  });
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

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

// Update own profile (Phase 1: name and phone ONLY)
const updateProfile = async (req, res) => {
  try {
    // Identity comes ONLY from the auth middleware — never from the body
    const userId = req.user.userId;

    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { name, phone } = req.body || {};

    const setUpdate = {};
    const unsetUpdate = {};

    // ---------------- NAME ----------------
    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 50 characters",
        });
      }

      setUpdate.name = trimmedName;
    }

    // ---------------- PHONE ----------------
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();

      if (trimmedPhone === "") {
        // Clearing phone is only allowed when an email exists
        // as an alternative login identifier
        if (!currentUser.email) {
          return res.status(400).json({
            success: false,
            message:
              "Phone cannot be removed because it is your only login identifier",
          });
        }

        // $unset removes the field so the sparse unique index stays valid
        unsetUpdate.phone = "";
      } else {
        // Normalize: strip spaces, hyphens and parentheses
        //   "+91 98765 43210" -> "+919876543210"
        //   "98765-43210"     -> "9876543210"
        //   "(555) 123-4567"  -> "5551234567"
        const normalizedPhone = trimmedPhone.replace(/[\s\-()]/g, "");

        // Optional "+" followed by 7–15 digits
        if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid phone number (7-15 digits, optional +)",
          });
        }

        // Duplicate-phone check (excluding the current user)
        const phoneOwner = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: userId },
        });

        if (phoneOwner) {
          return res.status(409).json({
            success: false,
            message: "This phone number is already in use",
          });
        }

        // Store the normalized phone number
        setUpdate.phone = normalizedPhone;
      }
    }

    // ---------------- APPLY UPDATE ----------------
    if (
      Object.keys(setUpdate).length === 0 &&
      Object.keys(unsetUpdate).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields to update",
      });
    }

    const updateQuery = {};

    if (Object.keys(setUpdate).length > 0) {
      updateQuery.$set = setUpdate;
    }

    if (Object.keys(unsetUpdate).length > 0) {
      updateQuery.$unset = unsetUpdate;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateQuery, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: buildProfileResponse(updatedUser),
    });
  } catch (error) {
    // Duplicate key — phone unique index race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already in use",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];

      return res.status(400).json({
        success: false,
        message: firstError?.message || "Invalid profile data",
      });
    }

    console.error("Update profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};

module.exports = {
  register,
  login,
  googleLoginSuccess,
  logout,
  getMe,
  updateProfile,
  generateToken,
};
