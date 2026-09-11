const normalizeUrl = (value, name) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('unsupported protocol');
    }
    return url.origin;
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL`);
  }
};

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const clientUrl = normalizeUrl(
  process.env.CLIENT_URL || 'http://localhost:3000',
  'CLIENT_URL'
);
const googleCallbackUrl = required('GOOGLE_CALLBACK_URL');
const trustProxyValue = process.env.TRUST_PROXY;
const configuredOrigins = (process.env.CORS_ORIGINS || clientUrl)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => normalizeUrl(origin, 'CORS_ORIGINS'));

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  captchaSecret: required('CAPTCHA_SECRET'),
  clientUrl,
  corsOrigins: [...new Set([clientUrl, ...configuredOrigins])],
  googleClientId: required('GOOGLE_CLIENT_ID'),
  googleClientSecret: required('GOOGLE_CLIENT_SECRET'),
  googleCallbackUrl: normalizeUrl(
    googleCallbackUrl,
    'GOOGLE_CALLBACK_URL'
  ) + new URL(googleCallbackUrl).pathname,
  trustProxy: trustProxyValue
    ? Number(trustProxyValue) || false
    : (nodeEnv === 'production' ? 1 : false),
};
