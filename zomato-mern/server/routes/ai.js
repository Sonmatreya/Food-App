const router = require('express').Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const asyncHandler = require('../middleware/asyncHandler');
const optionalAuth = require('../middleware/optionalAuth');
const rateLimit = require('../middleware/rateLimit');
const { buildBill } = require('../utils/pricing');
const { getHistory, findCandidates } = require('../services/recommender');
const { parseIntent, writeReply, chitchatReply, isAIEnabled } = require('../services/claude');

router.use(optionalAuth);

function localHour() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: process.env.APP_TZ || 'Asia/Kolkata' }).format(new Date()));
  return h % 24;
}
const mealKeywords = (h) =>
  h < 11 ? ['coffee', 'sandwich', 'puff'] : h < 16 ? ['biryani', 'rice', 'chowmein'] : h < 19 ? ['coffee', 'momo', 'roll', 'pastry'] : ['biryani', 'pizza', 'chicken'];

/* GET /api/ai/feed  → { snack, trending, aiEnabled } */
router.get(
  '/feed',
  asyncHandler(async (req, res) => {
    const history = await getHistory(req.user?._id);

    // 1. "Perfect snack pick for you"
    let snack = null;
    const [top] = await findCandidates({ keywords: mealKeywords(localHour()), history, limit: 1, dishLimit: 1 });
    if (top) {
      const doc = await Restaurant.findById(top.restaurant._id);
      const item = top.dishes[0];
      const bill = buildBill(doc, [{ menuItemId: item._id, qty: 1 }], '');
      snack = { restaurant: top.restaurant, item, total: bill.total };
    }

    // 2. "Trending items near you" (most ordered in the last 7 days, topped up with best-rated dishes)
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const agg = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: { _id: { r: '$restaurant', m: '$items.menuItemId' }, count: { $sum: '$items.qty' } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const restaurants = await Restaurant.find().sort({ rating: -1, ratingCount: -1 }).lean();
    const byId = new Map(restaurants.map((r) => [String(r._id), r]));
    const trending = [];
    const seen = new Set();
    const push = (r, m) => {
      if (!r || !m || seen.has(String(m._id)) || trending.length >= 6) return;
      seen.add(String(m._id));
      trending.push({
        restaurant: { _id: r._id, name: r.name },
        item: { _id: m._id, name: m.name, price: m.price, isVeg: m.isVeg, emoji: m.emoji },
      });
    };
    for (const a of agg) {
      const r = byId.get(String(a._id.r));
      push(r, r?.menu.find((m) => String(m._id) === a._id.m));
    }
    for (const r of restaurants) push(r, r.menu[0]);

    res.json({ snack, trending, aiEnabled: isAIEnabled() });
  })
);

/* POST /api/ai/chat  { message, history?: [{role, text}] } */
router.post(
  '/chat',
  rateLimit({ max: 15 }),
  asyncHandler(async (req, res) => {
    const message = String(req.body.message || '').trim().slice(0, 300);
    if (!message) return res.status(400).json({ message: 'Tell me what you feel like eating' });
    const history = (Array.isArray(req.body.history) ? req.body.history : [])
      .slice(-6)
      .map((h) => ({ role: h.role === 'ai' ? 'assistant' : 'user', text: String(h.text || '').slice(0, 300) }));

    const intent = await parseIntent(message, history);
    if (intent.chitchat) return res.json({ reply: chitchatReply, intent, results: [], fallback: false });

    const userHistory = await getHistory(req.user?._id);
    let results = await findCandidates({ ...intent, history: userHistory });
    let fallback = false;

    if (!results.length) {
      // relax: drop the budget/veg limits first, then fall back to popular picks
      fallback = true;
      results = await findCandidates({ keywords: [], veg: intent.veg, history: userHistory, limit: 3 });
      if (!results.length) results = await findCandidates({ keywords: [], history: userHistory, limit: 3 });
    }

    const reply = await writeReply({ message, intent, results, fallback });
    res.json({ reply, intent, results, fallback });
  })
);

module.exports = router;
