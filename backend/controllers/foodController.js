const Food = require("../models/Food");
const starterFoods = require("../data/starterFoods");

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

    if (search && search.trim()) filter.$text = { $search: search.trim() };

    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const categories = (await Food.distinct("category")).filter(Boolean).sort();

    if (!hasPagination) {
      const foods = await Food.find(filter).sort({ isFeatured: -1, createdAt: -1 }).lean();
      return res.json({ success: true, count: foods.length, foods, categories });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const [foods, total] = await Promise.all([
      Food.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Food.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      count: foods.length,
      foods,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
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

const seedStarterFoods = async (req, res, next) => {
  try {
    const starterNames = starterFoods.map((food) => food.name);
    const existingFoods = await Food.find({ name: { $in: starterNames } }).select("name image").lean();
    const existingByName = new Map(existingFoods.map((food) => [food.name.toLowerCase(), food]));

    const foodsToInsert = starterFoods.filter((food) => !existingByName.has(food.name.toLowerCase()));
    const inserted = foodsToInsert.length
      ? await Food.insertMany(foodsToInsert, { ordered: false })
      : [];

    const imageUpdates = starterFoods.filter((food) => {
      const existing = existingByName.get(food.name.toLowerCase());
      return existing && food.image && existing.image !== food.image;
    });

    if (imageUpdates.length) {
      await Promise.all(
        imageUpdates.map((food) =>
          Food.updateOne(
            { name: food.name },
            { $set: { image: food.image } }
          )
        )
      );
    }

    if (!inserted.length && !imageUpdates.length) {
      return res.json({
        success: true,
        insertedCount: 0,
        updatedImageCount: 0,
        skippedCount: starterFoods.length,
        message: "Starter catalogue is already loaded.",
      });
    }

    return res.status(201).json({
      success: true,
      insertedCount: inserted.length,
      updatedImageCount: imageUpdates.length,
      skippedCount: starterFoods.length - inserted.length,
      message: "Starter catalogue loaded successfully.",
    });
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
  seedStarterFoods,
};
