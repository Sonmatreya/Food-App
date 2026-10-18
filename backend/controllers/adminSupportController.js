const mongoose = require("mongoose");
const SupportRequest = require("../models/SupportRequest");

const listSupportRequests = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const status = String(req.query.status || "all");
    const subject = String(req.query.subject || "all");
    const search = String(req.query.search || "").trim().slice(0, 100);
    const filter = {};

    if (["new", "in-progress", "resolved"].includes(status)) filter.status = status;
    if (["order", "payment", "food", "feedback", "general"].includes(subject)) filter.subject = subject;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { orderNumber: { $regex: escaped, $options: "i" } },
        { message: { $regex: escaped, $options: "i" } },
      ];
    }

    const [requests, total, newCount, inProgressCount, resolvedCount] = await Promise.all([
      SupportRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      SupportRequest.countDocuments(filter),
      SupportRequest.countDocuments({ status: "new" }),
      SupportRequest.countDocuments({ status: "in-progress" }),
      SupportRequest.countDocuments({ status: "resolved" }),
    ]);

    return res.json({
      success: true,
      requests,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      summary: { new: newCount, inProgress: inProgressCount, resolved: resolvedCount, total: newCount + inProgressCount + resolvedCount },
    });
  } catch (error) {
    console.error("List support requests failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load support messages." });
  }
};

const updateSupportRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body?.status === undefined ? undefined : String(req.body.status);
    const adminReply = req.body?.adminReply === undefined ? undefined : String(req.body.adminReply).trim();
    const resolutionNote = req.body?.resolutionNote === undefined ? undefined : String(req.body.resolutionNote).trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid support request." });
    }
    if (!["new", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Choose a valid support status." });
    }

    const request = await SupportRequest.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true }).lean();
    if (!request) return res.status(404).json({ success: false, message: "Support request not found." });
    return res.json({ success: true, message: "Support status updated.", request });
  } catch (error) {
    console.error("Update support request failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update support status." });
  }
};

module.exports = { listSupportRequests, updateSupportRequestStatus };
