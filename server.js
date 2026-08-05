const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const providerDashboardRoutes = require("./routes/providerDashboardRoutes");
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes");

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Har request se pehle DB connection ensure karo (cached hai, dobara connect nahi karega)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB connection failed for request:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed. Please try again.",
    });
  }
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/provider", require("./routes/providerRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use(
  "/api/provider-applications",
  require("./routes/providerApplicationRoutes")
);
app.use(
  "/api/provider-profile",
  require("./routes/Providerprofileroutes")
);
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/provider/providerdashboard", providerDashboardRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Auth API is running" });
});

// Error handling middlewares (hamesha sab routes ke baad)
app.use(notFound);
app.use(errorHandler);

// Local development ke liye (Vercel is listen ko ignore karega)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Vercel ke liye export zaroori hai — isi se serverless function ban ta hai
module.exports = app;