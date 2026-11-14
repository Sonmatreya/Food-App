const router = require('express').Router();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/auth');
const { buildBill } = require('../utils/pricing');

async function loadRestaurant(id) {
  if (!mongoose.isValidObjectId(id)) {
    const e = new Error('Invalid restaurant');
    e.status = 400;
    throw e;
  }
  const r = await Restaurant.findById(id);
  if (!r) {
    const e = new Error('Restaurant not found');
    e.status = 404;
    throw e;
  }
  return r;
}

// Bill preview (no login needed)
router.post(
  '/quote',
  asyncHandler(async (req, res) => {
    const { restaurantId, items = [], coupon } = req.body;
    const r = await loadRestaurant(restaurantId);
    const { lines, ...bill } = buildBill(r, items, coupon);
    res.json({ bill });
  })
);

router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { restaurantId, items = [], coupon, addressId, paymentMethod = 'COD' } = req.body;
    const address = req.user.addresses.id(addressId);
    if (!address) return res.status(400).json({ message: 'Please select a delivery address' });
    if (!['COD', 'UPI', 'CARD'].includes(paymentMethod))
      return res.status(400).json({ message: 'Invalid payment method' });

    const r = await loadRestaurant(restaurantId);
    const b = buildBill(r, items, coupon);

    const order = await Order.create({
      user: req.user._id,
      restaurant: r._id,
      restaurantName: r.name,
      items: b.lines,
      address: address.toObject(),
      paymentMethod,
      bill: {
        subtotal: b.subtotal,
        deliveryFee: b.deliveryFee,
        tax: b.tax,
        discount: b.discount,
        total: b.total,
        coupon: b.couponApplied,
      },
    });
    res.status(201).json({ order });
  })
);

router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  })
);

router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  })
);

module.exports = router;
