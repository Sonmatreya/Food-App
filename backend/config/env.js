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
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || '';
const rawGoogleCallbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim() || '';
const googleOAuthConfigured = Boolean(googleClientId && googleClientSecret && rawGoogleCallbackUrl);
const googleOAuthPartiallyConfigured = Boolean(googleClientId || googleClientSecret || rawGoogleCallbackUrl);

if (googleOAuthPartiallyConfigured && !googleOAuthConfigured) {
  throw new Error('Google OAuth is partially configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL together, or leave all three unset to disable Google login.');
}

const googleCallbackUrl = googleOAuthConfigured
  ? normalizeUrl(rawGoogleCallbackUrl, 'GOOGLE_CALLBACK_URL') + new URL(rawGoogleCallbackUrl).pathname
  : '';
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
  googleClientId,
  googleClientSecret,
  googleCallbackUrl,
  googleOAuthEnabled: googleOAuthConfigured,
  trustProxy: trustProxyValue
    ? Number(trustProxyValue) || false
    : (nodeEnv === 'production' ? 1 : false),
};
