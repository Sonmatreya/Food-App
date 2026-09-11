const { rateLimit } = require('express-rate-limit');

const createLimiter = (options) => rateLimit({
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  ...options,
});

module.exports = {
  loginLimiter: createLimiter({ windowMs: 15 * 60 * 1000, limit: 10 }),
  registerLimiter: createLimiter({ windowMs: 60 * 60 * 1000, limit: 5 }),
  captchaGenerateLimiter: createLimiter({ windowMs: 15 * 60 * 1000, limit: 30 }),
  captchaVerifyLimiter: createLimiter({ windowMs: 15 * 60 * 1000, limit: 15 }),
  googleAuthLimiter: createLimiter({ windowMs: 15 * 60 * 1000, limit: 20 }),
};
