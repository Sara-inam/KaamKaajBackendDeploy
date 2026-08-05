const mongoose = require("mongoose");
const servicePriceSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // unique hata diya — ab ek provider multiple profiles bana sakta hai
    },

    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },

   image: {
  type: String,
  default: "",
},

imagePublicId: {
  type: String,
  default: "",
},

    experience: { type: String, required: true },
    about: { type: String, required: true },

    category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Category",
  required: true,
},

services: {
  type: [servicePriceSchema],
  default: [],
},

availabilityStatus: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    published: {
  type: Boolean,
  default: false,
},

rating: {
  type: Number,
  min: 0,
  max: 5,
  default: 0,
},

ratingBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
  },
  { timestamps: true }
);

// Ek provider same category mein dobara profile na bana sake —
// database level par bhi enforce karne ke liye compound unique index
providerProfileSchema.index(
  { user: 1, category: 1 },
  { unique: true }
);

module.exports = mongoose.model("ProviderProfile", providerProfileSchema);