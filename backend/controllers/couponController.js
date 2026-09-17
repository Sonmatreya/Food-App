const Coupon = require("../models/Coupon");

const sanitize = (body = {}) => ({
  code: String(body.code || "").trim().toUpperCase().replace(/\s+/g, ""),
  type: body.type === "fixed" ? "fixed" : "percentage",
  value: Number(body.value),
  minimum: Number(body.minimum ?? 0),
  active: body.active !== false,
});

const validate = (coupon) => {
  if (!/^[A-Z0-9_-]{3,20}$/.test(coupon.code)) return "Coupon code must contain 3-20 letters, numbers, _ or -.";
  if (!Number.isFinite(coupon.value) || coupon.value <= 0) return "Discount value must be greater than zero.";
  if (coupon.type === "percentage" && coupon.value > 100) return "Percentage discount cannot exceed 100%.";
  if (!Number.isFinite(coupon.minimum) || coupon.minimum < 0) return "Minimum order value cannot be negative.";
  return null;
};

const serialize = (coupon) => ({
  id: coupon._id,
  code: coupon.code,
  type: coupon.type,
  value: coupon.value,
  minimum: coupon.minimum,
  active: coupon.active,
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
});

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ active: true }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, coupons: coupons.map(serialize) });
  } catch (error) { next(error); }
};

const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, coupons: coupons.map(serialize) });
  } catch (error) { next(error); }
};

const createCoupon = async (req, res, next) => {
  try {
    const payload = sanitize(req.body);
    const validationError = validate(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const coupon = await Coupon.create({ ...payload, value: Number(payload.value.toFixed(2)), minimum: Number(payload.minimum.toFixed(2)) });
    res.status(201).json({ success: true, coupon: serialize(coupon) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Coupon code already exists." });
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const payload = sanitize(req.body);
    const validationError = validate(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { ...payload, value: Number(payload.value.toFixed(2)), minimum: Number(payload.minimum.toFixed(2)) }, { new: true, runValidators: true }).lean();
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    res.json({ success: true, coupon: serialize(coupon) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Coupon code already exists." });
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    res.json({ success: true, message: "Coupon deleted successfully." });
  } catch (error) { next(error); }
};

module.exports = { getCoupons, getAdminCoupons, createCoupon, updateCoupon, deleteCoupon };
