const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const { createOrder } = require("./orderController");

const PAYU_TEST_URL = "https://test.payu.in/_payment";
const CLIENT_URL = (process.env.CLIENT_URL || "https://food-app-5qi5.onrender.com").replace(/\/+$/, "");
const CALLBACK_URL = process.env.PAYU_CALLBACK_URL || "https://food-app-backend-lxic.onrender.com/api/payments/payu/return";

const sha512 = (value) => crypto.createHash("sha512").update(value, "utf8").digest("hex");
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || "").toLowerCase(), "utf8");
  const b = Buffer.from(String(right || "").toLowerCase(), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const amountString = (value) => Number(value).toFixed(2);

const makePayUHash = (fields, salt) => sha512([
  fields.key, fields.txnid, fields.amount, fields.productinfo, fields.firstname,
  fields.email, fields.udf1 || "", fields.udf2 || "", fields.udf3 || "",
  fields.udf4 || "", fields.udf5 || "", "", "", "", "", "", salt,
].join("|"));

const verifyPayUHash = (body, salt) => {
  // PayU's standard reverse hash. If PayU adds additional charges, its
  // documentation requires the additional-charges value before the Salt.
  const additionalCharges = body.additional_charges || body.additionalCharges || "";
  // PayU reverse hash includes all ten UDF fields, from udf10 down to udf1.
  // Even when udf6-udf10 are blank in the callback, their empty positions matter.
  const hashParts = [
    salt, body.status || "",
    body.udf10 || "", body.udf9 || "", body.udf8 || "",
    body.udf7 || "", body.udf6 || "", body.udf5 || "",
    body.udf4 || "", body.udf3 || "", body.udf2 || "",
    body.udf1 || "", body.email || "", body.firstname || "",
    body.productinfo || "", body.amount || "", body.txnid || "",
    body.key || "",
  ];
  const standardHash = sha512(hashParts.join("|"));
  if (!additionalCharges) return safeEqual(standardHash, body.hash);

  const withAdditionalCharges = sha512([
    additionalCharges, ...hashParts,
  ].join("|"));
  return safeEqual(withAdditionalCharges, body.hash);
};

const initiatePayU = async (req, res) => {
  try {
    // This project intentionally supports PayU TEST mode only.
    if ((process.env.PAYU_MODE || "test").toLowerCase() !== "test") {
      return res.status(403).json({ success: false, message: "Only PayU test mode is enabled in this project." });
    }
    const key = process.env.PAYU_KEY?.trim();
    const salt = process.env.PAYU_SALT?.trim();
    if (!key || !salt || key.includes("your_test_") || salt.includes("your_test_")) {
      return res.status(503).json({ success: false, message: "PayU test credentials are not configured on the backend yet. Add PAYU_KEY and PAYU_SALT in Render Environment." });
    }

    const channel = String(req.body?.channel || "").toLowerCase();
    if (!["upi", "card", "netbanking", "wallet"].includes(channel)) {
      return res.status(400).json({ success: false, message: "Choose UPI, card, net banking, or wallet." });
    }

    const user = await User.findById(req.user.userId).select("name email phone").lean();
    if (!user?.email) {
      return res.status(400).json({ success: false, message: "A valid email address is required for PayU test checkout. Add an email to your account and retry." });
    }

    // Reuse the existing order validation and server-side price calculation.
    // Create an unpaid order first; it becomes paid only after a verified PayU callback.
    const orderBody = { ...req.body, paymentMethod: channel };
    delete orderBody.channel;
    const orderReq = Object.create(req);
    orderReq.body = orderBody;
    let createStatus = 200;
    let createPayload = null;
    const captureRes = {
      status(code) { createStatus = code; return this; },
      json(payload) { createPayload = payload; return this; },
    };
    await createOrder(orderReq, captureRes);
    if (createStatus >= 400 || !createPayload?.success || !createPayload.order) {
      return res.status(createStatus).json(createPayload || { success: false, message: "Unable to create pending order." });
    }

    const order = createPayload.order;

    const fields = {
      key,
      txnid: String(order.orderNumber).slice(0, 25),
      amount: amountString(order.pricing.grandTotal),
      productinfo: String(order.orderNumber),
      firstname: String(order.address?.name || user.name || "Food App Customer").trim().slice(0, 60),
      email: String(user.email).trim().slice(0, 100),
      phone: String(order.address?.phone || user.phone || "").replace(/\D/g, "").slice(-10) || "9999999999",
      country: "India",
      ...(order.deliveryType === "delivery" ? {
        address1: String(order.address?.addressLine || "").trim().slice(0, 100),
        city: String(order.address?.city || "").trim().slice(0, 50),
        zipcode: String(order.address?.pincode || "").trim().slice(0, 10),
      } : {}),
      surl: CALLBACK_URL,
      furl: CALLBACK_URL,
      curl: CALLBACK_URL,
      udf1: String(order.id),
      udf2: "",
      udf3: "",
      udf4: "",
      udf5: "",
    };
    fields.hash = makePayUHash(fields, salt);

    return res.json({
      success: true,
      action: PAYU_TEST_URL,
      fields,
      orderId: order.id,
      message: "Redirecting to PayU test checkout. No live payment will be processed.",
    });
  } catch (error) {
    console.error("PayU initiation error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to start PayU test checkout." });
  }
};

const processPayUResponse = async (req, res, isWebhook = false) => {
  try {
    if ((process.env.PAYU_MODE || "test").toLowerCase() !== "test") {
      return res.status(403).send("Only PayU test mode is enabled.");
    }
    const key = process.env.PAYU_KEY?.trim();
    const salt = process.env.PAYU_SALT?.trim();
    const body = req.body || {};
    if (!key || !salt || body.key !== key || !body.txnid || !body.hash || !verifyPayUHash(body, salt)) {
      return res.status(400).send("Invalid PayU response.");
    }

    const order = await Order.findOne({ orderNumber: String(body.txnid) });
    if (!order || String(order._id) !== String(body.udf1 || "") || amountString(order.pricing.grandTotal) !== amountString(body.amount)) {
      return res.status(400).send("PayU transaction does not match an order.");
    }

    const status = String(body.status || "").toLowerCase();
    if (status === "success") {
      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        await order.save();
      }
    } else if (["failure", "usercancelled", "cancel"].includes(status) && order.paymentStatus !== "paid") {
      // A failed payment attempt is not the same as an operational order cancellation.
      // Keep the order's lifecycle status intact so the customer/admin can review it
      // and a legitimate retry or delayed verified success callback is not blocked.
      order.paymentStatus = "failed";
      await order.save();
    }

    if (isWebhook) return res.status(200).send("OK");

    // Base the browser redirect on the persisted order state, not only this
    // callback's status. A late duplicate failure callback must not show a failed
    // payment page after an earlier verified success already marked the order paid.
    const result = order.paymentStatus === "paid" ? "success" : "failed";
    // Use the same final confirmation page for mobile and desktop PayU returns.
    // Keep /payment-success available for existing bookmarks and older links.
    return res.redirect(303, result === "success"
      ? `${CLIENT_URL}/payment-success/${order._id}?payment=success`
      : `${CLIENT_URL}/payment-result?status=failed&orderId=${order._id}`);
  } catch (error) {
    console.error("PayU response handling error:", error.message);
    return res.status(500).send("Unable to process PayU response.");
  }
};

const handlePayUReturn = (req, res) => processPayUResponse(req, res, false);
const handlePayUWebhook = (req, res) => processPayUResponse(req, res, true);

module.exports = { initiatePayU, handlePayUReturn, handlePayUWebhook };
