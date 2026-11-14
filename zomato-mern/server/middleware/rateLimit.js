// Tiny in-memory limiter to protect the paid AI endpoint (use redis in production).
module.exports = function rateLimit({ windowMs = 60_000, max = 15 } = {}) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const key = req.user ? String(req.user._id) : req.ip;
    const n = (hits.get(key) || 0) + 1;
    hits.set(key, n);
    if (n > max) return res.status(429).json({ message: 'Too many requests, please slow down a little.' });
    next();
  };
};
