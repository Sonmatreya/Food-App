const SupportRequest = require("../models/SupportRequest");

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

    const request = await SupportRequest.create({
      firstName,
      lastName,
      email,
      phone,
      orderNumber,
      subject,
      message,
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
    });
  } catch (error) {
    console.error("Create support request failed:", error);
    return res.status(500).json({ success: false, message: "We couldn't send your request right now. Please try again." });
  }
};

module.exports = { createSupportRequest };
