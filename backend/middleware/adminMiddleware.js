const User = require("../models/User");

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("role").lean();

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to verify admin access",
    });
  }
};

module.exports = requireAdmin;