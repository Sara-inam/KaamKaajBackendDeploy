const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const { cloudinary } = require("../config/cloudinary");
const validateServices = require("../utils/validateServices");



// ================= SUBMIT PROFILE (Provider) =================
// Ab provider multiple profiles bana sakta hai, isliye
// "already exists" wala block hata diya gaya hai

exports.submitProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Same category mein pehle se profile mojood na ho
    const alreadyExists = await ProviderProfile.findOne({
      user: userId,
      category: req.body.category,
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "You are already involved in this category",
      });
    }

    let profile;

    try {

      let parsedServices = [];
if (req.body.services) {
  try {
    parsedServices = JSON.parse(req.body.services);
    parsedServices = await validateServices(parsedServices, req.body.category);
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
}

profile = await ProviderProfile.create({
  user: userId,
  name: req.body.name,
  email: req.body.email,
  phone: req.body.phone,
  address: req.body.address,
  experience: req.body.experience,
  about: req.body.about,
  category: req.body.category,
  availabilityStatus: req.body.availabilityStatus || "available",
  image: req.file ? req.file.path : "",
  imagePublicId: req.file ? req.file.filename : "",
  services: parsedServices,
});

    } catch (createError) {

      // DB level compound unique index (user + category) bhi isi
      // case ko catch karta hai, agar upar wala check kisi race
      // condition mein miss ho jaye
      if (createError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "You are already involved in this category",
        });
      }

      throw createError;

    }

    try {
      await sendEmail(
        user.email,
        "Provider Profile Submitted",
        `
        <h2>Hello ${user.name}</h2>
        <p>Your provider profile has been submitted.</p>
        <p>Status: <b>Pending</b></p>
        `
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Profile submitted",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= GET MY PROFILES (Provider) =================
// Ab list return hoti hai, kyunke provider ki multiple
// profiles ho sakti hain

exports.getMyProfiles = async (req, res) => {
  try {
    const profiles = await ProviderProfile.find({
      user: req.user.id,
    })
      .populate("category", "name")
.populate("services.service", "name description")
      .sort("-createdAt");

    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= UPDATE PROFILE (Provider) =================
// Ab specific profile id se update hoti hai (ownership check ke sath)

exports.updateProfile = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const newCategory = req.body.category || profile.category;

    // Agar category badli ja rahi hai, check karo ke provider ki
    // koi aur profile pehle se us category mein na ho
    if (
      req.body.category &&
      req.body.category.toString() !== profile.category.toString()
    ) {

      const alreadyExists = await ProviderProfile.findOne({
        user: req.user.id,
        category: req.body.category,
        _id: { $ne: profile._id },
      });

      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: "You are already involved in this category",
        });
      }

    }

    profile.name = req.body.name || profile.name;
    profile.email = req.body.email || profile.email;
    profile.phone = req.body.phone || profile.phone;
    profile.address = req.body.address || profile.address;
    profile.experience = req.body.experience || profile.experience;
    profile.about = req.body.about || profile.about;
    profile.category = newCategory;
    if (req.body.services) {
  try {
    const parsed = JSON.parse(req.body.services);
    profile.services = await validateServices(parsed, newCategory);
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
}
    profile.availabilityStatus =
      req.body.availabilityStatus || profile.availabilityStatus;

    // Edit hone ke baad dobara review ke liye pending pe chala jayega
    profile.status = "pending";
    profile.published = false;

   if (req.file) {
  // Purani image Cloudinary se delete karo
  if (profile.imagePublicId) {
    await cloudinary.uploader.destroy(profile.imagePublicId);
  }

  profile.image = req.file.path;
  profile.imagePublicId = req.file.filename;
}

    let saved;

    try {
      saved = await profile.save();
    } catch (saveError) {

      if (saveError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "You are already involved in this category",
        });
      }

      throw saveError;

    }

    res.json({ success: true, message: "Profile updated", data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= DELETE PROFILE (Provider) =================
// Ab specific profile id se delete hoti hai (ownership check ke sath)

exports.deleteProfile = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

   if (profile.imagePublicId) {
  await cloudinary.uploader.destroy(profile.imagePublicId);
}

    await profile.deleteOne();

    res.json({ success: true, message: "Profile deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= ADMIN: GET ALL =================
// Ye pehle se sab providers ki sab profiles deta hai (multiple
// profiles per provider bhi automatically saath dikh jayengi)

exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await ProviderProfile.find()
      .populate("user", "name email")
.populate("category", "name")
.populate("services.service", "name description")
      .sort("-createdAt");

    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= PUBLIC: GET PROVIDERS BY CATEGORY =================
// Customer app ke liye — sirf wahi providers dikhengay jo admin ne
// approve aur publish kiye hain, kisi bhi ek category ke andar

exports.getProvidersByCategory = async (req, res) => {
  try {
    const profiles = await ProviderProfile.find({
      category: req.params.categoryId,
      status: "approved",
      published: true,
    })
      .populate("category", "name")
.populate("services.service", "name")
      .sort("-rating");

    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= ADMIN: APPROVE / REJECT =================

exports.updateStatus = async (req, res) => {
  try {
    const profile = await ProviderProfile.findById(req.params.id);

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    profile.status = req.body.status;

    // reject hone par publish bhi hata do
    if (req.body.status === "rejected") {
      profile.published = false;
    }

    await profile.save();

    let subject = "";
    let message = "";

    if (req.body.status === "approved") {
      subject = "Provider Profile Approved";
      message = `
        <h2>Congratulations ${profile.name}</h2>
        <p>Your provider profile has been <b>approved</b>.</p>
      `;
    } else if (req.body.status === "rejected") {
      subject = "Provider Profile Rejected";
      message = `
        <h2>Hello ${profile.name}</h2>
        <p>Your provider profile has been <b>rejected</b>.</p>
      `;
    } else {
      subject = "Provider Profile Status Updated";
      message = `
        <h2>Hello ${profile.name}</h2>
        <p>Your profile status has been updated to: <b>${req.body.status}</b></p>
      `;
    }

    try {
      await sendEmail(profile.email, subject, message);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    res.json({ success: true, message: "Status updated", data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ================= ADMIN: PUBLISH =================

exports.publishProfile = async (req, res) => {
  try {
    const profile = await ProviderProfile.findById(req.params.id);

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    if (profile.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved profiles can be published",
      });
    }

    profile.published = true;
    await profile.save();

    res.json({ success: true, message: "Profile published", data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ================= ADMIN: EDIT PROFILE =================

exports.updateProviderByAdmin = async (req, res) => {
  try {
    const profile = await ProviderProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    profile.name = req.body.name ?? profile.name;
    profile.email = req.body.email ?? profile.email;
    profile.phone = req.body.phone ?? profile.phone;
    profile.address = req.body.address ?? profile.address;
    profile.experience = req.body.experience ?? profile.experience;
    profile.about = req.body.about ?? profile.about;
    profile.category = req.body.category ?? profile.category;
    
    profile.availabilityStatus =
      req.body.availabilityStatus ?? profile.availabilityStatus;

    if (req.body.status) {
      profile.status = req.body.status;
    }

    if (req.body.published !== undefined) {
      profile.published = req.body.published;
    }

    // ⭐ Rating
    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating);

      if (rating < 0 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 0 and 5",
        });
      }

      profile.rating = rating;
    }

    // Image Update
    if (req.file) {

      if (profile.imagePublicId) {
        await cloudinary.uploader.destroy(profile.imagePublicId);
      }

      profile.image = req.file.path;
      profile.imagePublicId = req.file.filename;
    }

    await profile.save();

    res.json({
      success: true,
      message: "Provider profile updated successfully",
      data: profile,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ================= ADMIN DELETE PROFILE =================

exports.deleteProviderByAdmin = async (req, res) => {
  try {

    const profile = await ProviderProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Cloudinary image delete
    if (profile.imagePublicId) {
      await cloudinary.uploader.destroy(profile.imagePublicId);
    }

    await profile.deleteOne();

    res.json({
      success: true,
      message: "Provider deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};