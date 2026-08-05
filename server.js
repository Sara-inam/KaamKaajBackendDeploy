const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const providerDashboardRoutes = require("./routes/providerDashboardRoutes");
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes");



connectDB();

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/provider", require("./routes/providerRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));// Health check
app.use("/api/services", require("./routes/serviceRoutes"));
app.use(
"/api/provider-applications",
require("./routes/providerApplicationRoutes")
);
app.use(
"/api/provider-profile",
require("./routes/providerProfileRoutes")
);
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/provider/providerdashboard", providerDashboardRoutes);
app.use(
  "/api/forgot-password",
  forgotPasswordRoutes
);
app.get("/", (req, res) => {
  res.json({ success: true, message: "Auth API is running" });
});

// Error handling middlewares (hamesha sab routes ke baad)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));