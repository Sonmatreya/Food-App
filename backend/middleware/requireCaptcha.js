const { consumeCaptchaProof } = require('../controllers/captchaController');

const requireCaptcha = (req, res, next) => {
  const captchaProof = req.get('x-captcha-proof');
  if (!captchaProof || !consumeCaptchaProof(captchaProof)) {
    return res.status(400).json({
      success: false,
      message: 'Please complete the CAPTCHA before logging in.',
    });
  }
  return next();
};

module.exports = requireCaptcha;
