const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    // DB se connect karo
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Check karo admin pehle se to exist nahi karta
    const adminExists = await User.findOne({ email: "admin@example.com" });

    if (adminExists) {
      console.log("⚠️  Admin already exists:", adminExists.email);
      process.exit();
    }

    // Naya admin banao — password automatically hash ho jayega (pre-save hook se)
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@example.com",
      password: "Admin@123", // plain text yahan hai, save hote hi hash ho jayega
      phoneNumber: "03001234567", // apna required field hai, koi bhi number de do
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin created successfully:");
    console.log({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      phoneNumber: admin.phoneNumber,
    });

    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();