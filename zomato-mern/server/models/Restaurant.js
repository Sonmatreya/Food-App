const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  isVeg: { type: Boolean, default: false },
  category: { type: String, default: 'Recommended' },
  description: String,
  emoji: { type: String, default: '🍽️' },
});

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: '🍴' },
    cuisines: [String],
    rating: { type: Number, default: 4 },
    ratingCount: { type: Number, default: 0 },
    deliveryMinutes: { type: Number, default: 30 },
    distanceKm: { type: Number, default: 2 },
    costForOne: { type: Number, default: 200 },
    offer: String,
    isVeg: { type: Boolean, default: false },
    area: String,
    menu: [menuItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
