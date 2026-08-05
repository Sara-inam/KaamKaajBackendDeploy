const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const generateVerificationToken = require("../utils/generateVerificationToken");
const transporter = require("../config/nodemailer");

// ===========================
// Helper: verification email bhejna
// ===========================
const sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = `http://192.168.1.10:5000/api/auth/verify-email/${token}`;
  // 👆 apna current local IP daalein (ipconfig se check karein)

  const mailOptions = {
    from: `"Your App Name" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Hi ${name},</h2>
        <p style="color: #555; font-size: 15px;">Thanks for registering! Please click the button below to verify your email address.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verifyUrl}" style="background: #F5A623; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Helper: browser me dikhne wala simple HTML result page
const htmlPage = (title, message, color) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #FFFDF5;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .card {
          background: white;
          padding: 40px 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          max-width: 400px;
        }
        h2 { color: ${color}; margin-bottom: 12px; }
        p { color: #555; font-size: 15px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    </body>
  </html>
`;

// @desc    Register new user (user / service_provider / admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. @, $, !, %, *, ?, &).",
      });
    }

    // Check karo user pehle se to exist nahi karta
    const userExists = await User.findOne({ email });

    // Agar exist karta hai aur already verified hai -> block karo
    if (userExists && userExists.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Note: Production me "admin" role sirf existing admin hi assign kar sake
    let finalRole = role || "user";
    if (finalRole === "admin") {
      if (!req.user || req.user.role !== "admin") {
        finalRole = "user";
      }
    }

    const token = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let user;
    if (userExists && !userExists.isVerified) {
      // Purana unverified record hai -> update karke naya link bhejo
      userExists.name = name;
      userExists.password = password;
      userExists.phoneNumber = phoneNumber;
      userExists.verificationToken = token;
      userExists.verificationTokenExpiry = tokenExpiry;
      user = await userExists.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        phoneNumber,
        role: finalRole,
        verificationToken: token,
        verificationTokenExpiry: tokenExpiry,
        isVerified: false,
      });
    }

    // Verification email bhejo
    try {
      await sendVerificationEmail(email, token, name);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    // NOTE: Yaha token nahi bhej rahe kyunke user abhi verified nahi hai
    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email via link (browser se click hoga)
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token }).select(
      "+verificationToken +verificationTokenExpiry"
    );

    if (!user) {
      return res
        .status(400)
        .send(htmlPage("❌ Invalid Link", "This verification link is invalid or has already been used.", "#e53935"));
    }

    if (user.verificationTokenExpiry < new Date()) {
      return res
        .status(400)
        .send(htmlPage("⏰ Link Expired", "This verification link has expired. Please register again from the app.", "#e53935"));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return res
      .status(200)
      .send(htmlPage("✅ Email Verified!", "Your email has been verified successfully. You can now go back to the app and login.", "#43a047"));
  } catch (error) {
    return res.status(500).send(htmlPage("⚠️ Something went wrong", "Please try again later.", "#e53935"));
  }
};

// @desc    Resend verification link
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified. Please login." });
    }

    const token = generateVerificationToken();
    user.verificationToken = token;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, token, user.name);

    res.status(200).json({
      success: true,
      message: "Verification link sent again. Please check your email.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email. Please register first.",
      });
    }

    // Verified nahi hai -> login block karo
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in. Check your inbox.",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (any authenticated role)
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  getMe,
};