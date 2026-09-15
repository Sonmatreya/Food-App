const mongoose = require("mongoose");
const User = require("../models/User");

const buildStaffUser = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  role: user.role,
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt || null,
});

const getStaff = async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email phone role isVerified createdAt")
      .sort({ role: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      staff: users.map(buildStaffUser),
      summary: {
        total: users.length,
        admins: users.filter((user) => user.role === "admin").length,
        customers: users.filter((user) => user.role === "customer").length,
      },
    });
  } catch (error) {
    console.error("Get staff error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load staff accounts",
    });
  }
};

const promoteToAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(user._id) === String(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own admin role",
      });
    }

    if (user.role === "admin") {
      return res.status(409).json({
        success: false,
        message: "This user is already an admin",
      });
    }

    user.role = "admin";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${user.name || "User"} is now an admin`,
      user: buildStaffUser(user),
    });
  } catch (error) {
    console.error("Promote user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to promote user to admin",
    });
  }
};

const demoteToCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(user._id) === String(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own admin role",
      });
    }

    if (user.role !== "admin") {
      return res.status(409).json({
        success: false,
        message: "This user is already a customer",
      });
    }

    user.role = "customer";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${user.name || "User"} is now a customer`,
      user: buildStaffUser(user),
    });
  } catch (error) {
    console.error("Demote user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to change user to customer",
    });
  }
};

module.exports = {
  getStaff,
  promoteToAdmin,
  demoteToCustomer,
};
