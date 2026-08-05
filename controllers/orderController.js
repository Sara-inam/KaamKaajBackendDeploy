const Order = require("../models/Order");
const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");
const { sendEmail } = require("../services/emailService");
const stripe = require("../config/stripe");


// ================= CUSTOMER: CREATE ORDER =================

exports.createOrder = async (req, res) => {
  try {
    const {
      providerProfileId,
      customerName,
      customerEmail,
      phone,
      address,
      services,
      bookingDate,
      bookingTime,
    } = req.body;

    if (!providerProfileId || !phone || !address || !bookingDate || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one service",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const providerProfile = await ProviderProfile.findById(providerProfileId)
      .populate("category", "name")
      .populate("services.service", "name description");

    if (!providerProfile) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (providerProfile.status !== "approved" || !providerProfile.published) {
      return res.status(400).json({
        success: false,
        message: "This provider is not available for booking",
      });
    }

    // Har selected service ko provider ki actual services list se match karo
    // (price/name client se trust nahi karte, DB se lete hain)
    let totalAmount = 0;
    const orderServices = [];

    for (const s of services) {
      const match = providerProfile.services.find(
        (ps) => ps.service._id.toString() === s.serviceId
      );

      if (!match) {
        return res.status(400).json({
          success: false,
          message: "One or more selected services are invalid for this provider",
        });
      }

      orderServices.push({
        service: match.service._id,
        name: match.service.name,
        price: match.price,
      });

      totalAmount += match.price;
    }

    const advanceAmount = Number((totalAmount * 0.2).toFixed(2));

    const order = await Order.create({
      customer: user._id,
      providerProfile: providerProfile._id,
      providerUser: providerProfile.user,
      category: providerProfile.category._id,
      customerName: customerName || user.name,
      customerEmail: customerEmail || user.email,
      customerPhone: phone,
      customerAddress: address,
      providerName: providerProfile.name,
      providerEmail: providerProfile.email,
      services: orderServices,
      totalAmount,
      advanceAmount,
      bookingDate,
      bookingTime,
    });

    // Customer ko email
    try {
      await sendEmail(
        order.customerEmail,
        "Booking Request Sent",
        `
        <h2>Hello ${order.customerName}</h2>
        <p>Your booking request for <b>${order.providerName}</b> has been sent.</p>
        <p>Status: <b>Pending</b></p>
        <p>Total Amount: Rs. ${order.totalAmount}</p>
        `
      );
    } catch (e) {
      console.error("Email failed:", e.message);
    }

    // Provider ko email
    try {
      await sendEmail(
        order.providerEmail,
        "New Booking Request",
        `
        <h2>Hello ${order.providerName}</h2>
        <p>You have a new booking request from <b>${order.customerName}</b>.</p>
        <p>Date: ${order.bookingDate} | Time: ${order.bookingTime}</p>
        <p>Please open the app to accept or reject this request.</p>
        `
      );
    } catch (e) {
      console.error("Email failed:", e.message);
    }

    res.status(201).json({
      success: true,
      message: "Booking request sent",
      data: order,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= CUSTOMER: MY ORDERS =================

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).sort("-createdAt");
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= PROVIDER: GET MY BOOKING REQUESTS =================

exports.getProviderOrders = async (req, res) => {
  try {
    const orders = await Order.find({ providerUser: req.user.id }).sort("-createdAt");
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= PROVIDER: ACCEPT / REJECT =================

exports.updateProviderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      providerUser: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.providerStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This order has already been processed",
      });
    }

    order.providerStatus = status;
    await order.save();

    let subject = "";
    let message = "";

    if (status === "approved") {
      subject = "Booking Request Approved";
      message = `
        <h2>Hello ${order.customerName}</h2>
        <p>Your booking with <b>${order.providerName}</b> has been <b>approved</b>.</p>
        <p>Please pay 20% advance (Rs. ${order.advanceAmount}) to confirm your booking.</p>
        <p>Open the app, go to My Orders, and tap "Pay Now".</p>
      `;
    } else {
      subject = "Booking Request Rejected";
      message = `
        <h2>Hello ${order.customerName}</h2>
        <p>Your booking with <b>${order.providerName}</b> has been <b>rejected</b>.</p>
      `;
    }

    try {
      await sendEmail(order.customerEmail, subject, message);
    } catch (e) {
      console.error("Email failed:", e.message);
    }

    res.json({ success: true, message: `Order ${status}`, data: order });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= ADMIN: GET ALL ORDERS =================

exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .sort("-createdAt");

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= CUSTOMER: CREATE PAYMENT INTENT (20% advance) =================

exports.createPaymentIntent = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.providerStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Order is not approved by provider yet",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.advanceAmount * 100), // smallest currency unit
      currency: process.env.STRIPE_CURRENCY || "usd",
      metadata: { orderId: order._id.toString() },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= CUSTOMER: CONFIRM PAYMENT =================
// Client Stripe payment sheet complete karne ke baad ye call karta hai.
// Hum khud Stripe se verify karte hain (client par trust nahi karte).

exports.confirmPayment = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.paymentIntentId) {
      return res.status(400).json({ success: false, message: "No payment found" });
    }

    const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

    if (intent.status === "succeeded") {
      order.paymentStatus = "paid";
      await order.save();

      try {
        await sendEmail(
          order.customerEmail,
          "Advance Payment Received",
          `
          <h2>Hello ${order.customerName}</h2>
          <p>We received your 20% advance payment of Rs. ${order.advanceAmount} for your booking with <b>${order.providerName}</b>.</p>
          <p>Your booking is now confirmed.</p>
          `
        );
      } catch (e) {
        console.error("Email failed:", e.message);
      }

      return res.json({ success: true, message: "Payment confirmed", data: order });
    }

    res.status(400).json({ success: false, message: "Payment not completed yet" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};