// @desc    Service provider dashboard example
// @route   GET /api/provider/dashboard
// @access  Private/ServiceProvider (admin bhi dekh sakta hai)
const getDashboard = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: `Welcome ${req.user.name}, this is your service provider dashboard`,
      data: {
        name: req.user.name,
        email: req.user.email,
        phoneNumber: req.user.phoneNumber,
        role: req.user.role,
        isActive: req.user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };