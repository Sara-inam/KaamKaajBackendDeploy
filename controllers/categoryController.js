const Category = require("../models/Category");
const { cloudinary } = require("../config/cloudinary");

// @desc   Get all active categories (public - customer home screen)
// @route  GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc   Add new category (admin)
// @route  POST /api/categories/admin
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !req.file) {
      return res.status(400).json({ success: false, message: "Name and image are required" });
    }

    const category = await Category.create({
      name,
      imageUrl: req.file.path,
      imagePublicId: req.file.filename,
    });

    // addCategory
res.status(201).json({ 
  success: true, 
  message: "Category added successfully", 
  data: category 
});
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc   Update category (admin)
// @route  PUT /api/categories/admin/:id
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    if (req.body.name) category.name = req.body.name;

    if (req.file) {
      // purani image cloudinary se delete karo
      if (category.imagePublicId) {
        await cloudinary.uploader.destroy(category.imagePublicId);
      }
      category.imageUrl = req.file.path;
      category.imagePublicId = req.file.filename;
    }

    await category.save();
    // updateCategory
res.json({ 
  success: true, 
  message: "Category updated successfully", 
  data: category 
});
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc   Delete category (admin)
// @route  DELETE /api/categories/admin/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (category.imagePublicId) {
      await cloudinary.uploader.destroy(category.imagePublicId);
    }

    await category.deleteOne();
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};