const express = require("express");
const { chatWithAssistant } = require("../controllers/aiController");

const router = express.Router();

router.post("/chat", chatWithAssistant);

module.exports = router;
