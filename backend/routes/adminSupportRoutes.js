const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const { listSupportRequests, updateSupportRequestStatus } = require("../controllers/adminSupportController");
const router = express.Router();
router.use(protect, requireAdmin);
router.get("/", listSupportRequests);
router.patch("/:id/status", updateSupportRequestStatus);
module.exports = router;
