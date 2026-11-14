const router = require('express').Router();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const asyncHandler = require('../middleware/asyncHandler');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/restaurants?q=&cuisine=&veg=true&rating=4&fast=true&under150=true&sort=rating|time|relevance
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, cuisine, veg, rating, fast, under150, sort } = req.query;
    const filter = {};

    if (q && q.trim()) {
      const rx = new RegExp(esc(q.trim()), 'i');
      filter.$or = [{ name: rx }, { cuisines: rx }, { 'menu.name': rx }];
    }
    if (cuisine && cuisine !== 'All') filter.cuisines = new RegExp(`^${esc(cuisine)}$`, 'i');
    if (veg === 'true') filter.isVeg = true;
    if (rating) filter.rating = { $gte: Number(rating) };
    if (fast === 'true') filter.deliveryMinutes = { $lte: 20 };
    if (under150 === 'true') filter.costForOne = { $lte: 150 };

    const sorts = {
      rating: { rating: -1 },
      time: { deliveryMinutes: 1 },
      relevance: { ratingCount: -1 },
    };
    const restaurants = await Restaurant.find(filter)
      .select('-menu')
      .sort(sorts[sort] || sorts.relevance)
      .lean();
    res.json({ count: restaurants.length, restaurants });
  })
);

router.get(
  '/meta/cuisines',
  asyncHandler(async (req, res) => {
    const cuisines = await Restaurant.distinct('cuisines');
    res.json({ cuisines: cuisines.sort() });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const r = await Restaurant.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ message: 'Restaurant not found' });
    if (req.query.veg === 'true') r.menu = r.menu.filter((m) => m.isVeg);
    res.json({ restaurant: r });
  })
);

module.exports = router;
