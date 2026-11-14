const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

async function getHistory(userId) {
  const history = { restaurants: {}, dishes: new Set() };
  if (!userId) return history;
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean();
  for (const o of orders) {
    const id = String(o.restaurant);
    history.restaurants[id] = (history.restaurants[id] || 0) + 1;
    o.items.forEach((i) => history.dishes.add(String(i.menuItemId)));
  }
  return history;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Finds restaurants + dishes for the parsed intent and ranks them (rating, speed, offers, order history).
async function findCandidates({ keywords = [], veg = false, maxPrice = null, history, limit = 5, dishLimit = 4 }) {
  const filter = {};
  if (keywords.length) {
    const rxs = keywords.map((k) => new RegExp(esc(k), 'i'));
    filter.$or = [{ name: { $in: rxs } }, { cuisines: { $in: rxs } }, { 'menu.name': { $in: rxs } }, { 'menu.category': { $in: rxs } }];
  }
  const restaurants = await Restaurant.find(filter).lean();
  const hit = (s) => keywords.some((k) => s.toLowerCase().includes(k));
  const results = [];

  for (const r of restaurants) {
    const allowed = r.menu.filter((m) => (!veg || m.isVeg) && (!maxPrice || m.price <= maxPrice));
    if (!allowed.length) continue;
    const direct = keywords.length ? allowed.filter((m) => hit(m.name) || hit(m.category)) : [];
    const restaurantMatch = keywords.length && (hit(r.name) || r.cuisines.some(hit));
    if (keywords.length && !direct.length) {
      // skip if the budget/veg filter is what removed the matching dishes (don't show unrelated items)
      const excluded = r.menu.some((m) => hit(m.name) || hit(m.category));
      if (!restaurantMatch || excluded) continue;
    }

    const dishes = (direct.length ? direct : allowed).slice(0, dishLimit);
    const visits = history?.restaurants[String(r._id)] || 0;
    const orderedDishes = dishes.filter((d) => history?.dishes.has(String(d._id)));

    const score =
      r.rating * 2 +
      Math.log10((r.ratingCount || 0) + 1) +
      (30 - r.deliveryMinutes) / 10 +
      (r.offer ? 1 : 0) +
      (visits ? 2 + Math.min(visits, 3) : 0) +
      (orderedDishes.length ? 2 : 0) +
      direct.length * 0.5;

    results.push({
      score,
      restaurant: {
        _id: r._id, name: r.name, emoji: r.emoji, rating: r.rating,
        deliveryMinutes: r.deliveryMinutes, distanceKm: r.distanceKm, offer: r.offer,
      },
      dishes: dishes.map((d) => ({ _id: d._id, name: d.name, price: d.price, isVeg: d.isVeg, emoji: d.emoji })),
      orderedBefore: visits > 0,
      orderedDishNames: orderedDishes.map((d) => d.name),
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit).map(({ score, ...rest }) => rest);
}

module.exports = { getHistory, findCandidates };
