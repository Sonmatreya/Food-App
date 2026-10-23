const crypto = require("crypto");
const mongoose = require("mongoose");
const SupportRequest = require("../models/SupportRequest");
const Order = require("../models/Order");
const User = require("../models/User");

const hashAccessToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const allowedSubjects = new Set(["order", "payment", "food", "feedback", "general"]);

const createSupportRequest = async (req, res) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const orderNumber = String(req.body.orderNumber || "").trim();
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Please complete all required fields." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    if (!allowedSubjects.has(subject)) {
      return res.status(400).json({ success: false, message: "Please choose a valid support topic." });
    }
    if (message.length < 10 || message.length > 3000) {
      return res.status(400).json({ success: false, message: "Your message must be between 10 and 3000 characters." });
    }

    // A random, unguessable access key lets the customer check this request without an account.
    const trackingToken = crypto.randomBytes(32).toString("hex");
    const request = await SupportRequest.create({
      firstName,
      lastName,
      email,
      phone,
      orderNumber,
      subject,
      message,
      supportAccessTokenHash: hashAccessToken(trackingToken),
    });

    // Email notifications are optional; the request is saved in MongoDB regardless.
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SUPPORT_EMAIL) {
      try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.SUPPORT_EMAIL,
          replyTo: email,
          subject: `FoodApp support request #${request._id}`,
          text: [
            `Request ID: ${request._id}`,
            `Customer: ${firstName} ${lastName}`,
            `Email: ${email}`,
            `Phone: ${phone || "Not provided"}`,
            `Order number: ${orderNumber || "Not provided"}`,
            `Topic: ${subject}`,
            "",
            message,
          ].join("\n"),
        });
      } catch (emailError) {
        console.error("Support email notification failed:", emailError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Your support request has been received.",
      requestId: request._id,
      trackingToken,
    });
  } catch (error) {
    console.error("Create support request failed:", error);
    return res.status(500).json({ success: false, message: "We couldn't send your request right now. Please try again." });
  }
};

const trackSupportRequest = async (req, res) => {
  try {
    const requestId = String(req.body?.requestId || "").trim();
    const trackingToken = String(req.body?.trackingToken || "").trim();
    if (!mongoose.Types.ObjectId.isValid(requestId) || !/^[a-f0-9]{64}$/i.test(trackingToken)) {
      return res.status(400).json({ success: false, message: "Enter a valid reference number and tracking key." });
    }

    const request = await SupportRequest.findById(requestId).select("+supportAccessTokenHash").lean();
    if (!request || !request.supportAccessTokenHash) {
      return res.status(404).json({ success: false, message: "We couldn't find that request. Check the reference number and tracking key." });
    }
    const submittedHash = hashAccessToken(trackingToken);
    const expected = Buffer.from(request.supportAccessTokenHash, "hex");
    const actual = Buffer.from(submittedHash, "hex");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return res.status(404).json({ success: false, message: "We couldn't find that request. Check the reference number and tracking key." });
    }

    return res.json({
      success: true,
      request: {
        requestId: String(request._id),
        firstName: request.firstName,
        subject: request.subject,
        message: request.message,
        status: request.status,
        adminReply: request.adminReply || "",
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        resolvedAt: request.resolvedAt || null,
      },
    });
  } catch (error) {
    console.error("Track support request failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to check this request right now. Please try again." });
  }
};


const createOrderSupportRequest = async (req, res) => {
  try {
    const orderId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order reference." });
    }

    const order = await Order.findOne({ _id: orderId, userId: req.user.userId }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const subject = String(req.body?.subject || "order").trim();
    const message = String(req.body?.message || "").trim();
    if (!allowedSubjects.has(subject)) {
      return res.status(400).json({ success: false, message: "Please choose a valid support topic." });
    }
    if (message.length < 10 || message.length > 3000) {
      return res.status(400).json({ success: false, message: "Your message must be between 10 and 3000 characters." });
    }

    const user = await User.findById(req.user.userId).select("name email phone").lean();
    if (!user?.email) {
      return res.status(400).json({ success: false, message: "Add an email address to your account before contacting support." });
    }
    const nameParts = String(user.name || "Customer").trim().split(/\s+/);
    const request = await SupportRequest.create({
      firstName: nameParts.shift() || "Customer",
      lastName: nameParts.join(" ") || "-",
      email: user.email,
      phone: user.phone || "",
      orderNumber: String(order.orderNumber || order._id),
      orderId: order._id,
      userId: user._id,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Your message was added to this order. Support will reply here.",
      request: {
        requestId: String(request._id),
        orderId: String(order._id),
        orderNumber: request.orderNumber,
        subject: request.subject,
        message: request.message,
        status: request.status,
        adminReply: request.adminReply || "",
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create order support request failed:", error);
    return res.status(500).json({ success: false, message: "Unable to send your message right now. Please try again." });
  }
};

const getOrderSupportRequests = async (req, res) => {
  try {
    const orderId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order reference." });
    }
    const order = await Order.findOne({ _id: orderId, userId: req.user.userId }).select("_id").lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    const requests = await SupportRequest.find({ orderId: order._id, userId: req.user.userId })
      .select("subject message status adminReply createdAt updatedAt resolvedAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      requests: requests.map((request) => ({
        requestId: String(request._id),
        subject: request.subject,
        message: request.message,
        status: request.status,
        adminReply: request.adminReply || "",
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        resolvedAt: request.resolvedAt || null,
      })),
    });
  } catch (error) {
    console.error("Get order support requests failed:", error);
    return res.status(500).json({ success: false, message: "Unable to load order messages right now." });
  }
};

module.exports = { createSupportRequest, trackSupportRequest, createOrderSupportRequest, getOrderSupportRequests };
