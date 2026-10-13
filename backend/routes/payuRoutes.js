const express = require("express");
const protect = require("../middleware/authMiddleware");
const { initiatePayU, handlePayUReturn, handlePayUWebhook } = require("../controllers/payuController");

const router = express.Router();

// Browser return routes and webhook are public callbacks; signatures are verified by the controller.
router.post("/return", handlePayUReturn);
router.post("/webhook", handlePayUWebhook);

// Initiating checkout requires a logged-in customer.
router.post("/initiate", protect, initiatePayU);

module.exports = router;
