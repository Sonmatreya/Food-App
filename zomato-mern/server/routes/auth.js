const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, addresses: u.addresses });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: sign(user._id), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user || !(await user.matchPassword(password || '')))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: sign(user._id), user: publicUser(user) });
  })
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

router.post(
  '/address',
  protect,
  asyncHandler(async (req, res) => {
    const { label, line, landmark, phone } = req.body;
    if (!line) return res.status(400).json({ message: 'Address is required' });
    req.user.addresses.push({ label, line, landmark, phone });
    await req.user.save();
    res.status(201).json({ addresses: req.user.addresses });
  })
);

router.delete(
  '/address/:id',
  protect,
  asyncHandler(async (req, res) => {
    req.user.addresses.pull({ _id: req.params.id });
    await req.user.save();
    res.json({ addresses: req.user.addresses });
  })
);

module.exports = router;
