const Service = require("../models/serviceModel");
const Category = require("../models/Category");

// ===============================
// Add Service
// ===============================
const addService = async (req, res) => {
  try {
    const { category, name, description } = req.body;

    if (!category || !name) {
      return res.status(400).json({
        success: false,
        message: "Category and Service Name are required.",
      });
    }

    // Check category exists
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Prevent duplicate service in same category
    const existingService = await Service.findOne({
      category,
      name: name.trim(),
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "Service already exists in this category.",
      });
    }

    const service = await Service.create({
      category,
      name: name.trim(),
      description,
    });

    res.status(201).json({
      success: true,
      message: "Service added successfully.",
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get All Services
// ===============================
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Services By Category
// ===============================
const getServicesByCategory = async (req, res) => {
  try {
    const services = await Service.find({
      category: req.params.categoryId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Update Service
// ===============================
const updateService = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    service.name = name ?? service.name;
    service.description = description ?? service.description;

    if (typeof isActive === "boolean") {
      service.isActive = isActive;
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Delete Service
// ===============================
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addService,
  getAllServices,
  getServicesByCategory,
  updateService,
  deleteService,
};