const Coupon = require("../models/Coupon");
const Order = require("../models/Order");

const round2 = (value) => Math.round(value * 100) / 100;

const sanitize = (body = {}) => {
  const rawExpiry = body.expiresAt;
  let expiresAt = null;

  if (rawExpiry) {
    const parsed = new Date(rawExpiry);
    expiresAt = Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
  }

  const maxDiscountRaw = body.maxDiscount;
  const maxDiscount = maxDiscountRaw === "" || maxDiscountRaw === null || maxDiscountRaw === undefined
    ? null
    : Number(maxDiscountRaw);

  return {
    code: String(body.code || "").trim().toUpperCase().replace(/\s+/g, ""),
    type: body.type === "fixed" ? "fixed" : "percentage",
    value: Number(body.value),
    minimum: Number(body.minimum ?? 0),
    maxDiscount,
    expiresAt,
    maxUses: Number(body.maxUses ?? 0),
    perCustomerLimit: Number(body.perCustomerLimit ?? 0),
    active: body.active !== false,
  };
};

const validate = (coupon) => {
  if (!/^[A-Z0-9_-]{3,20}$/.test(coupon.code)) return "Coupon code must contain 3-20 letters, numbers, _ or -.";
  if (!Number.isFinite(coupon.value) || coupon.value <= 0) return "Discount value must be greater than zero.";
  if (coupon.type === "percentage" && coupon.value > 100) return "Percentage discount cannot exceed 100%.";
  if (!Number.isFinite(coupon.minimum) || coupon.minimum < 0) return "Minimum order value cannot be negative.";
  if (coupon.maxDiscount !== null && (!Number.isFinite(coupon.maxDiscount) || coupon.maxDiscount < 0)) return "Maximum discount cannot be negative.";
  if (!Number.isInteger(coupon.maxUses) || coupon.maxUses < 0) return "Usage limit must be a whole number of 0 or more.";
  if (!Number.isInteger(coupon.perCustomerLimit) || coupon.perCustomerLimit < 0) return "Per-customer limit must be a whole number of 0 or more.";
  if (coupon.expiresAt === "invalid") return "Please enter a valid expiry date.";
  return null;
};

const getStatus = (coupon, usageCount = 0) => {
  if (!coupon.active) return "inactive";
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) return "expired";
  if (coupon.maxUses > 0 && usageCount >= coupon.maxUses) return "exhausted";
  return "active";
};

const statusLabel = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  exhausted: "Usage Limit Reached",
};

const serialize = (coupon, usageCount = 0) => ({
  id: coupon._id,
  code: coupon.code,
  type: coupon.type,
  value: coupon.value,
  minimum: coupon.minimum,
  maxDiscount: coupon.maxDiscount ?? null,
  expiresAt: coupon.expiresAt || null,
  maxUses: coupon.maxUses || 0,
  perCustomerLimit: coupon.perCustomerLimit || 0,
  usageCount,
  status: getStatus(coupon, usageCount),
  statusLabel: statusLabel[getStatus(coupon, usageCount)],
  active: coupon.active,
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
});

const getUsageCounts = async (coupons) => {
  const codes = coupons.map((coupon) => coupon.code).filter(Boolean);
  if (!codes.length) return new Map();

  const rows = await Order.aggregate([
    {
      $match: {
        "pricing.couponCode": { $in: codes },
        status: { $ne: "cancelled" },
      },
    },
    { $group: { _id: "$pricing.couponCode", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [row._id, row.count]));
};

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ active: true }).sort({ createdAt: -1 }).lean();
    const usageCounts = await getUsageCounts(coupons);
    const now = new Date();

    const available = coupons.filter((coupon) => {
      const usageCount = usageCounts.get(coupon.code) || 0;
      return (!coupon.expiresAt || new Date(coupon.expiresAt) > now) &&
        (!coupon.maxUses || usageCount < coupon.maxUses);
    });

    res.json({
      success: true,
      coupons: available.map((coupon) => serialize(coupon, usageCounts.get(coupon.code) || 0)),
    });
  } catch (error) {
    next(error);
  }
};

const getAdminCoupons = async (req, res, next) => {
  try {
    const { search = "", status = "all" } = req.query;
    const filter = {};
    const query = String(search).trim();

    if (query) filter.code = { $regex: query, $options: "i" };
    if (status === "active" || status === "inactive") filter.active = status === "active";

    const allCoupons = await Coupon.find(filter).sort({ createdAt: -1 }).lean();
    const usageCounts = await getUsageCounts(allCoupons);

    let coupons = allCoupons.map((coupon) => serialize(coupon, usageCounts.get(coupon.code) || 0));
    if (["expired", "exhausted"].includes(status)) {
      coupons = coupons.filter((coupon) => coupon.status === status);
    }

    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    if (!hasPagination) return res.json({ success: true, coupons });

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 9));
    const total = coupons.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageCoupons = coupons.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      coupons: pageCoupons,
      pagination: { page, limit, total, totalPages },
      summary: {
        total: allCoupons.length,
        active: allCoupons.filter((coupon) => getStatus(coupon, usageCounts.get(coupon.code) || 0) === "active").length,
        inactive: allCoupons.filter((coupon) => !coupon.active).length,
        expired: allCoupons.filter((coupon) => getStatus(coupon, usageCounts.get(coupon.code) || 0) === "expired").length,
        exhausted: allCoupons.filter((coupon) => getStatus(coupon, usageCounts.get(coupon.code) || 0) === "exhausted").length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const payload = sanitize(req.body);
    const validationError = validate(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const coupon = await Coupon.create({
      ...payload,
      value: round2(payload.value),
      minimum: round2(payload.minimum),
      maxDiscount: payload.maxDiscount === null ? null : round2(payload.maxDiscount),
    });

    res.status(201).json({ success: true, coupon: serialize(coupon, 0) });
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

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        ...payload,
        value: round2(payload.value),
        minimum: round2(payload.minimum),
        maxDiscount: payload.maxDiscount === null ? null : round2(payload.maxDiscount),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
    const usageCount = await Order.countDocuments({ "pricing.couponCode": coupon.code, status: { $ne: "cancelled" } });
    res.json({ success: true, coupon: serialize(coupon, usageCount) });
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
  } catch (error) {
    next(error);
  }
};

module.exports = { getCoupons, getAdminCoupons, createCoupon, updateCoupon, deleteCoupon };
