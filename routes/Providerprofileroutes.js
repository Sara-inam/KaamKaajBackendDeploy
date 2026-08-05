const express = require("express");
const router = express.Router();

const {
  submitProfile,
  getMyProfiles,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  getProvidersByCategory,
  updateStatus,
  publishProfile,
  updateProviderByAdmin,
  deleteProviderByAdmin,
} = require("../controllers/providerProfileController");

const { protect, isAdmin } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");


// ---------- Public (Customer browsing) ----------

// Ek category ke andar sirf approved + published providers
router.get("/category/:categoryId", getProvidersByCategory);


// ---------- Provider ----------

// Naya profile create karo (provider multiple bana sakta hai)
router.post("/", protect, upload.single("image"), submitProfile);

// Apni sari profiles ki list
router.get("/me", protect, getMyProfiles);

// Specific profile update (id se)
router.put("/:id", protect, upload.single("image"), updateProfile);

// Specific profile delete (id se)
router.delete("/:id", protect, deleteProfile);


// ---------- Admin ----------

router.get("/admin", protect, isAdmin, getAllProfiles);

router.put("/admin/:id/status", protect, isAdmin, updateStatus);

router.put("/admin/:id/publish", protect, isAdmin, publishProfile);

// Admin Edit Provider
router.put(
  "/admin/provider-profile/:id",
  protect,
  isAdmin,
  upload.single("image"),
  updateProviderByAdmin
);

// Admin Delete Provider
router.delete(
  "/admin/provider-profile/:id",
  protect,
  isAdmin,
  deleteProviderByAdmin
);

module.exports = router;