const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// Generate 6 Digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// Send Forgot Password OTP
// POST /api/forgot-password/send-otp
// ============================================

const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Email Required
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find User
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // OTP Expire Time (10 Minutes)
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = otpExpire;

    await user.save();

    // Email Template
    const html = `
        <div style="font-family:Arial,sans-serif;padding:20px">
            <h2>Reset Password OTP</h2>

            <p>Hello <b>${user.name}</b>,</p>

            <p>Your OTP for resetting password is:</p>

            <h1 style="
                color:#0d6efd;
                letter-spacing:5px;
            ">
                ${otp}
            </h1>

            <p>
                This OTP will expire in
                <b>10 minutes</b>.
            </p>

            <p>
                If you did not request a password reset,
                simply ignore this email.
            </p>
        </div>
    `;

    // Send Email
    await sendEmail(
      user.email,
      "Reset Password OTP",
      html
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// ============================================
// Verify OTP
// POST /api/forgot-password/verify-otp
// ============================================

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resetPasswordOTP) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new OTP.",
      });
    }

    if (user.resetPasswordOTPExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });

  }
};
// ============================================
// Reset Password
// POST /api/forgot-password/reset-password
// ============================================

const resetPassword = async (req, res) => {

  try {

    const {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !email ||
      !otp ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resetPasswordOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    if (user.resetPasswordOTPExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Save New Password
    user.password = newPassword;

    // Clear OTP
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpire = null;

    // Password automatically hash hoga
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });

  }

};
module.exports = {
  sendForgotPasswordOTP,
  verifyOTP,
  resetPassword,
};