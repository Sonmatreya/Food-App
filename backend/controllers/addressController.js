const SavedAddress = require("../models/SavedAddress");

const cleanAddress = (body = {}) => ({
  label: ["Home", "Work", "Other"].includes(body.label) ? body.label : "Home",
  name: String(body.name || "").trim(),
  phone: String(body.phone || "").replace(/[\s\-()]/g, ""),
  addressLine: String(body.addressLine || "").trim(),
  city: String(body.city || "").trim(),
  pincode: String(body.pincode || "").trim(),
  landmark: String(body.landmark || "").trim(),
  latitude: body.latitude === null || body.latitude === undefined ? null : Number(body.latitude),
  longitude: body.longitude === null || body.longitude === undefined ? null : Number(body.longitude),
  locationText: String(body.locationText || "").trim(),
});

const validate = (address) => {
  if (address.name.length < 2 || address.name.length > 50) return "Name must be between 2 and 50 characters.";
  if (!/^\+?[0-9]{7,15}$/.test(address.phone)) return "Please enter a valid phone number.";
  if (!address.addressLine) return "Complete address is required.";
  if (!address.city) return "City is required.";
  if (!/^\d{6}$/.test(address.pincode)) return "Please enter a valid 6-digit PIN code.";
  if ((address.latitude !== null && !Number.isFinite(address.latitude)) || (address.longitude !== null && !Number.isFinite(address.longitude))) return "Invalid map coordinates.";
  return "";
};

const getAddresses = async (req, res) => {
  try {
    const addresses = await SavedAddress.find({ user: req.user.userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.json({ success: true, addresses });
  } catch (error) {
    console.error("Get saved addresses error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load saved addresses." });
  }
};

const createAddress = async (req, res) => {
  try {
    const address = cleanAddress(req.body);
    const validationError = validate(address);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const existingCount = await SavedAddress.countDocuments({ user: req.user.userId });
    const shouldBeDefault = Boolean(req.body.isDefault) || existingCount === 0;

    if (shouldBeDefault) {
      await SavedAddress.updateMany({ user: req.user.userId }, { $set: { isDefault: false } });
    }

    const created = await SavedAddress.create({ ...address, user: req.user.userId, isDefault: shouldBeDefault });
    res.status(201).json({ success: true, message: "Address saved successfully.", address: created });
  } catch (error) {
    console.error("Create saved address error:", error.message);
    res.status(500).json({ success: false, message: "Unable to save address." });
  }
};

const updateAddress = async (req, res) => {
  try {
    const address = cleanAddress(req.body);
    const validationError = validate(address);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const current = await SavedAddress.findOne({ _id: req.params.id, user: req.user.userId });
    if (!current) return res.status(404).json({ success: false, message: "Address not found." });

    if (req.body.isDefault) {
      await SavedAddress.updateMany({ user: req.user.userId, _id: { $ne: current._id } }, { $set: { isDefault: false } });
    }

    Object.assign(current, address);
    current.isDefault = Boolean(req.body.isDefault);
    await current.save();
    res.json({ success: true, message: "Address updated successfully.", address: current });
  } catch (error) {
    console.error("Update saved address error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update address." });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const current = await SavedAddress.findOne({ _id: req.params.id, user: req.user.userId });
    if (!current) return res.status(404).json({ success: false, message: "Address not found." });
    await current.deleteOne();

    if (current.isDefault) {
      const next = await SavedAddress.findOne({ user: req.user.userId }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ success: true, message: "Address deleted successfully." });
  } catch (error) {
    console.error("Delete saved address error:", error.message);
    res.status(500).json({ success: false, message: "Unable to delete address." });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const current = await SavedAddress.findOne({ _id: req.params.id, user: req.user.userId });
    if (!current) return res.status(404).json({ success: false, message: "Address not found." });
    await SavedAddress.updateMany({ user: req.user.userId }, { $set: { isDefault: false } });
    current.isDefault = true;
    await current.save();
    res.json({ success: true, message: "Default address updated.", address: current });
  } catch (error) {
    console.error("Set default address error:", error.message);
    res.status(500).json({ success: false, message: "Unable to set default address." });
  }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };