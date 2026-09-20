const mongoose = require("mongoose");
const User = require("../models/User");

const buildStaffUser = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  profileImage: user.profileImage || "",
  role: user.role,
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt || null,
});

const getStaff = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "all").trim().toLowerCase();

    const filter = {};
    if (role === "admin" || role === "customer") {
      filter.role = role;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeSearch, "i");
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [users, total, admins, customers, verified] = await Promise.all([
      User.find(filter)
        .select("_id name email phone profileImage role isVerified createdAt")
        .sort({ role: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.countDocuments({ ...filter, role: "admin" }),
      User.countDocuments({ ...filter, role: "customer" }),
      User.countDocuments({ ...filter, isVerified: true }),
    ]);

    return res.status(200).json({
      success: true,
      staff: users.map(buildStaffUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
      summary: { total, admins, customers, verified, unverified: Math.max(total - verified, 0) },
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

    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(409).json({
        success: false,
        message: "The last admin account cannot be changed to a customer.",
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
