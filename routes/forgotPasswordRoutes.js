const express = require("express");

const router = express.Router();

const {
  sendForgotPasswordOTP,
  verifyOTP,
  resetPassword,
} = require("../controllers/forgotPasswordController");

router.post("/send-otp", sendForgotPasswordOTP);

router.post("/verify-otp", verifyOTP);

router.post("/reset-password", resetPassword);

module.exports = router;