const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controllers/providerDashboardController");
const { protect } = require("../middleware/authMiddleware");

// Provider Dashboard
router.get("/", protect, getDashboard);

module.exports = router;