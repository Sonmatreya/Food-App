const Food = require("../models/Food");

const sanitizeFoodPayload = (body = {}) => ({
  name: typeof body.name === "string" ? body.name.trim() : body.name,
  description: typeof body.description === "string" ? body.description.trim() : "",
  category: typeof body.category === "string" ? body.category.trim() : body.category,
  price: Number(body.price),
  image: typeof body.image === "string" ? body.image.trim() : "",
  ingredients: Array.isArray(body.ingredients)
    ? body.ingredients.map((item) => String(item).trim()).filter(Boolean)
    : [],
  rating: body.rating === undefined ? 0 : Number(body.rating),
  ratingCount: body.ratingCount === undefined ? 0 : Number(body.ratingCount),
  isAvailable: body.isAvailable !== false,
  isFeatured: body.isFeatured === true,
});

const validateFoodPayload = (payload) => {
  if (!payload.name || payload.name.length < 2) return "Food name must contain at least 2 characters.";
  if (!payload.category) return "Category is required.";
  if (!Number.isFinite(payload.price) || payload.price < 0) return "Price must be a valid non-negative number.";
  if (!Number.isFinite(payload.rating) || payload.rating < 0 || payload.rating > 5) return "Rating must be between 0 and 5.";
  if (!Number.isInteger(payload.ratingCount) || payload.ratingCount < 0) return "Rating count must be a non-negative integer.";
  return null;
};

const getFoods = async (req, res, next) => {
  try {
    const { search, category, available, featured } = req.query;
    const filter = {};

    if (category && category !== "All") filter.category = category;
    if (available === "true") filter.isAvailable = true;
    if (available === "false") filter.isAvailable = false;
    if (featured === "true") filter.isFeatured = true;

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const foods = await Food.find(filter).sort({ isFeatured: -1, createdAt: -1 }).lean();
    return res.json({ success: true, count: foods.length, foods });
  } catch (error) {
    return next(error);
  }
};

const getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id).lean();
    if (!food) return res.status(404).json({ success: false, message: "Food not found." });
    return res.json({ success: true, food });
  } catch (error) {
    return next(error);
  }
};

const createFood = async (req, res, next) => {
  try {
    const payload = sanitizeFoodPayload(req.body);
    const validationError = validateFoodPayload(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const food = await Food.create(payload);
    return res.status(201).json({ success: true, food });
  } catch (error) {
    return next(error);
  }
};

const updateFood = async (req, res, next) => {
  try {
    const payload = sanitizeFoodPayload(req.body);
    const validationError = validateFoodPayload(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const food = await Food.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!food) return res.status(404).json({ success: false, message: "Food not found." });
    return res.json({ success: true, food });
  } catch (error) {
    return next(error);
  }
};

const deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found." });
    return res.json({ success: true, message: "Food deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
};
