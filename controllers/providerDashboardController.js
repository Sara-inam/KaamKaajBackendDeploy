const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");
const Order = require("../models/Order");

const getDashboard = async (req, res) => {
  try {
    // Logged-in provider
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Provider Profile
    const profile = await ProviderProfile.findOne({
      user: req.user._id,
    }).populate("category", "name");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    // ==========================
    // Dashboard Statistics
    // ==========================

    // Approved Jobs
    const approvedJobs = await Order.countDocuments({
      providerUser: req.user._id,
      providerStatus: "approved",
    });

    // Pending Jobs
    const pendingJobs = await Order.countDocuments({
      providerUser: req.user._id,
      providerStatus: "pending",
    });

    // Total Earnings
    const earningResult = await Order.aggregate([
      {
        $match: {
          providerUser: user._id,
          providerStatus: "approved",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const earnings =
      earningResult.length > 0 ? earningResult[0].total : 0;

    // ==========================
    // Recent Requests
    // ==========================

    const recentOrders = await Order.find({
      providerUser: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentRequests = recentOrders.map((order) => ({
      id: order._id,
      customerName: order.customerName,
      category: order.services.map((s) => s.name).join(", "),
      providerStatus: order.providerStatus,
    }));

    // ==========================
    // Stats Object
    // ==========================

    const stats = {
      approvedJobs,
      pendingJobs,
      rating: profile.rating ?? 0, // Agar rating field nahi hai to 0 kar dena
      earnings,
    };

    // ==========================
    // Response
    // ==========================

    return res.status(200).json({
      success: true,
      data: {
        provider: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phoneNumber,
          role: user.role,
          image: profile.image ?? "",
          category: profile.category?.name ?? "",
          about: profile.about ?? "",
          experience: profile.experience ?? "",
          availability: profile.availabilityStatus,
        },

        stats,

        recentRequests,
      },
    });
  } catch (error) {
    console.error("Provider Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};