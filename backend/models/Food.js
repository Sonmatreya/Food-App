const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    restaurantName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Food App Kitchen",
    },
    deliveryTime: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "20-30 min",
    },
    distanceKm: {
      type: Number,
      min: 0,
      default: 3.5,
    },
    offerText: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    ingredients: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

foodSchema.index({ name: "text", description: "text", category: "text" });

module.exports = mongoose.model("Food", foodSchema);
