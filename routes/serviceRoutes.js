const express = require("express");
const router = express.Router();

const {
  addService,
  getAllServices,
  getServicesByCategory,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const { protect, isAdmin } = require("../middleware/authMiddleware");

// ===============================
// Admin Routes
// ===============================

// Add Service
router.post(
  "/",
  protect,
  isAdmin,
  addService
);

// Get All Services
router.get(
  "/",
  protect,
  isAdmin,
  getAllServices
);

// Update Service
router.put(
  "/:id",
  protect,
  isAdmin,
  updateService
);

// Delete Service
router.delete(
  "/:id",
  protect,
  isAdmin,
  deleteService
);

// ===============================
// Public Route
// ===============================

// Get Services By Category
router.get(
  "/category/:categoryId",
  getServicesByCategory
);

module.exports = router;