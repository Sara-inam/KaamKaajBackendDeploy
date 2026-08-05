const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getProviderOrders,
  updateProviderStatus,
  getAllOrdersAdmin,
  createPaymentIntent,
  confirmPayment,
} = require("../controllers/orderController");

const { protect, isAdmin } = require("../middleware/authMiddleware");

// ---------- Customer ----------
router.post("/", protect, createOrder);
router.get("/me", protect, getMyOrders);
router.post("/:id/payment-intent", protect, createPaymentIntent);
router.post("/:id/confirm-payment", protect, confirmPayment);

// ---------- Provider ----------
router.get("/provider", protect, getProviderOrders);
router.put("/provider/:id/status", protect, updateProviderStatus);

// ---------- Admin ----------
router.get("/admin", protect, isAdmin, getAllOrdersAdmin);

module.exports = router;