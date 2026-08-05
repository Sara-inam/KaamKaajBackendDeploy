const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controllers/providerController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// service_provider aur admin dono access kar sakte hain
router.get("/dashboard", protect, authorize("service_provider", "admin"), getDashboard);

module.exports = router;