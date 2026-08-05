const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await User.updateMany(
    { isVerified: { $ne: true } },
    { $set: { isVerified: true } }
  );

  console.log(`✅ ${result.modifiedCount} users marked as verified.`);
  await mongoose.disconnect();
};

run();