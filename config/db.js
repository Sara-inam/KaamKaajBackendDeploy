const mongoose = require("mongoose");

// Vercel serverless env mein connection cache karna zaroori hai
// warna har request pe naya connection banega aur DB overload/timeout ho ga
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    // Pehle se connected hai -> wahi reuse karo
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // buffering off, warna timeout par silent hang hota hai
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB Connected");
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("❌ MongoDB Connection Error:", error.message);
        cached.promise = null; // reset taake agli request phir try kare
        throw error; // process.exit(1) MAT karo — serverless mein ye crash deta hai
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;