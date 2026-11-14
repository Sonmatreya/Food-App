require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

const data = [
  {
    name: 'Chotpot Fast Food Center', emoji: '🍗', cuisines: ['Chicken', 'Chinese', 'Momo'],
    rating: 4.3, ratingCount: 820, deliveryMinutes: 15, distanceKm: 1.3, costForOne: 140,
    offer: 'Flat ₹175 OFF above ₹349', isVeg: false, area: 'Shyamlal Para',
    menu: [
      { name: 'Chicken Tangdi Kebab (4 Pieces)', price: 430, category: 'Best in Chicken', emoji: '🍗' },
      { name: 'Chicken Afghani (4 Pieces)', price: 450, category: 'Best in Chicken', emoji: '🍗' },
      { name: 'Egg Chowmein', price: 117, category: 'Chinese', emoji: '🍜' },
      { name: 'Veg Chowmein', price: 99, isVeg: true, category: 'Chinese', emoji: '🍜' },
      { name: 'Steamed Chicken Momo (6)', price: 90, category: 'Momo', emoji: '🥟' },
      { name: 'Veg Momo (6)', price: 80, isVeg: true, category: 'Momo', emoji: '🥟' },
    ],
  },
  {
    name: 'Chatterjee Restaurant And Bar', emoji: '🍛', cuisines: ['North Indian', 'Chicken', 'Biryani'],
    rating: 4.2, ratingCount: 1300, deliveryMinutes: 30, distanceKm: 1.7, costForOne: 350,
    offer: '50% OFF up to ₹100', isVeg: false, area: 'Kalna',
    menu: [
      { name: 'Butter Chicken', price: 340, category: 'Main Course', emoji: '🍛' },
      { name: 'Paneer Butter Masala', price: 260, isVeg: true, category: 'Main Course', emoji: '🧀' },
      { name: 'Chicken Biryani', price: 280, category: 'Biryani', emoji: '🍚' },
      { name: 'Butter Naan', price: 45, isVeg: true, category: 'Breads', emoji: '🫓' },
    ],
  },
  {
    name: 'Rollick Family Restaurant', emoji: '🍽️', cuisines: ['Biryani', 'Chinese', 'North Indian'],
    rating: 4.4, ratingCount: 2100, deliveryMinutes: 20, distanceKm: 2.1, costForOne: 250,
    offer: 'Flat ₹75 OFF above ₹149', isVeg: false, area: 'Kalna',
    menu: [
      { name: 'Mutton Biryani', price: 360, category: 'Biryani', emoji: '🍚' },
      { name: 'Veg Biryani', price: 190, isVeg: true, category: 'Biryani', emoji: '🍚' },
      { name: 'Chilli Chicken', price: 220, category: 'Chinese', emoji: '🌶️' },
      { name: 'Veg Fried Rice', price: 150, isVeg: true, category: 'Chinese', emoji: '🍚' },
    ],
  },
  {
    name: 'Monginis Cake Shop', emoji: '🎂', cuisines: ['Desserts', 'Bakery'],
    rating: 4.5, ratingCount: 640, deliveryMinutes: 25, distanceKm: 1.0, costForOne: 120,
    offer: '50% OFF up to ₹100', isVeg: true, area: 'Kalna',
    menu: [
      { name: 'Black Forest Pastry', price: 60, isVeg: true, category: 'Pastries', emoji: '🍰' },
      { name: 'Chocolate Truffle Cake (500g)', price: 450, isVeg: true, category: 'Cakes', emoji: '🎂' },
      { name: 'Veg Puff', price: 25, isVeg: true, category: 'Snacks', emoji: '🥐' },
    ],
  },
  {
    name: 'Khal Khal Food Zone', emoji: '🍕', cuisines: ['Pizza', 'Burger', 'Fast Food'],
    rating: 3.9, ratingCount: 410, deliveryMinutes: 15, distanceKm: 1.4, costForOne: 130,
    offer: '50% OFF up to ₹100', isVeg: false, area: 'Kalna',
    menu: [
      { name: 'Margherita Pizza', price: 149, isVeg: true, category: 'Pizza', emoji: '🍕' },
      { name: 'Chicken Burger', price: 129, category: 'Burgers', emoji: '🍔' },
      { name: 'French Fries', price: 79, isVeg: true, category: 'Sides', emoji: '🍟' },
    ],
  },
  {
    name: 'Kurkure Momos', emoji: '🥟', cuisines: ['Momo', 'Chinese'],
    rating: 4.1, ratingCount: 530, deliveryMinutes: 18, distanceKm: 1.1, costForOne: 100,
    offer: 'Flat ₹75 OFF above ₹149', isVeg: false, area: 'Kalna',
    menu: [
      { name: 'Kurkure Momos (5 Pieces)', price: 111, category: 'Momo', emoji: '🥟' },
      { name: 'Paneer Momo (6)', price: 95, isVeg: true, category: 'Momo', emoji: '🥟' },
    ],
  },
  {
    name: '916 Restaurant', emoji: '☕', cuisines: ['Snacks', 'Beverages', 'Fast Food'],
    rating: 4.3, ratingCount: 970, deliveryMinutes: 22, distanceKm: 1.6, costForOne: 110,
    offer: 'Flat ₹75 OFF above ₹149', isVeg: false, area: 'Kalna',
    menu: [
      { name: 'Cold Coffee', price: 90, isVeg: true, category: 'Beverages', emoji: '🥤' },
      { name: 'Hot Coffee', price: 50, isVeg: true, category: 'Beverages', emoji: '☕' },
      { name: 'Kurkure Momos (5 Pieces)', price: 111, category: 'Snacks', emoji: '🥟' },
      { name: 'Chicken Roll', price: 99, category: 'Snacks', emoji: '🌯' },
      { name: 'Veg Sandwich', price: 70, isVeg: true, category: 'Snacks', emoji: '🥪' },
    ],
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Restaurant.deleteMany({});
  await Restaurant.insertMany(data);
  console.log(`Seeded ${data.length} restaurants`);
  await mongoose.disconnect();
})();
