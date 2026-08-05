const mongoose = require("mongoose");
const Service = require("../models/serviceModel");

async function validateServices(servicesInput, categoryId) {
  if (!Array.isArray(servicesInput)) {
    throw new Error("Services must be an array");
  }

  const serviceIds = servicesInput.map((s) => s.service);

  for (const id of serviceIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid service id");
    }
  }

  const uniqueIds = new Set(serviceIds.map(String));
  if (uniqueIds.size !== serviceIds.length) {
    throw new Error("Duplicate service selected");
  }

  const validServices = await Service.find({
    _id: { $in: serviceIds },
    category: categoryId,
    isActive: true,
  });

  if (validServices.length !== serviceIds.length) {
    throw new Error("One or more services are invalid for this category");
  }

  for (const s of servicesInput) {
    if (typeof s.price !== "number" || s.price < 0) {
      throw new Error("Invalid price for a service");
    }
  }

  return servicesInput;
}

module.exports = validateServices;