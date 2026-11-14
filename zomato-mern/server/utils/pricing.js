// Single source of truth for bill calculation (used by /quote and /orders)
const COUPONS = {
  SAVE75: { min: 149, off: 75 },
  FLAT175: { min: 349, off: 175 },
};

function buildBill(restaurant, cartItems, couponCode) {
  const lines = [];
  for (const ci of cartItems) {
    const qty = Math.floor(Number(ci.qty));
    if (!qty || qty < 1) continue;
    const item = restaurant.menu.id(ci.menuItemId);
    if (!item) {
      const err = new Error('Item not available at this restaurant');
      err.status = 400;
      throw err;
    }
    lines.push({ menuItemId: String(item._id), name: item.name, price: item.price, qty });
  }
  if (!lines.length) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const deliveryFee = subtotal >= 199 ? 0 : 30;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;

  let discount = 0;
  let couponApplied = null;
  let couponMessage = null;
  if (couponCode) {
    const code = String(couponCode).toUpperCase().trim();
    const c = COUPONS[code];
    if (!c) couponMessage = 'Invalid coupon';
    else if (subtotal < c.min) couponMessage = `Add items worth ₹${c.min - subtotal} more to use ${code}`;
    else {
      discount = c.off;
      couponApplied = code;
      couponMessage = `${code} applied: ₹${c.off} off`;
    }
  }
  const total = Math.max(0, Math.round((subtotal + deliveryFee + tax - discount) * 100) / 100);
  return { lines, subtotal, deliveryFee, tax, discount, total, couponApplied, couponMessage };
}

module.exports = { buildBill, COUPONS };
