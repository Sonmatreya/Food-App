# Food-App environment and deployment checklist

This document lists the backend configuration expected by the current source code. It does not contain credentials. Set secrets in the hosting provider's Environment settings; never commit real keys or salts.

## Required backend variables

The backend imports `backend/config/env.js` during startup, so these variables must be present even if a feature is not being used:

- `NODE_ENV` — use `production` on the hosted backend.
- `MONGO_URI` — MongoDB connection string.
- `JWT_SECRET` — long, random secret used to sign authentication tokens.
- `CAPTCHA_SECRET` — secret used by CAPTCHA verification.
- `CLIENT_URL` — frontend origin, for example `https://food-app-5qi5.onrender.com`.
- `CORS_ORIGINS` — comma-separated frontend origins allowed to send credentialed API requests. Include only trusted origins; `CLIENT_URL` is also added automatically.
- `GOOGLE_CALLBACK_URL` — full public OAuth callback URL registered in the Google OAuth client.
- `GOOGLE_CLIENT_ID` — Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret.
- `PORT` — normally supplied by the hosting platform.
- `TRUST_PROXY` — optional numeric proxy-hop count; source defaults to one hop in production.

## Payment configuration (PayU test mode only)

- `PAYU_MODE` — keep set to `test`; the current controller intentionally refuses non-test mode.
- `PAYU_KEY` — PayU test key.
- `PAYU_SALT` — PayU test salt; treat it as a secret.
- `PAYU_CALLBACK_URL` — optional public backend callback URL. If omitted, source defaults to `https://food-app-backend-lxic.onrender.com/api/payments/payu/return`.

The callback URL must point to the deployed backend route `/api/payments/payu/return`. PayU must be configured to return to the same endpoint. Do not describe this integration as live payment processing while the controller remains test-only.

## Optional AI configuration

- `OPENROUTER_API_KEY` — if absent, FoodAI uses the built-in catalogue fallback.
- `OPENROUTER_MODEL` — optional model identifier; current source default is `openrouter/free`.
- `OPENROUTER_SITE_URL` — optional HTTP Referer value sent to OpenRouter.
- `OPENROUTER_APP_NAME` — optional app title sent to OpenRouter.

## Frontend configuration

- `REACT_APP_API_URL` — optional backend base URL. Set it to the deployed backend origin for the hosted frontend if you do not want to rely on the source default. Do not include an API path suffix unless the frontend configuration expects it.

## Before deploying

1. Confirm all required backend variables are present in the backend service's environment.
2. Confirm `CLIENT_URL`, `CORS_ORIGINS`, and `REACT_APP_API_URL` point to the intended deployed services.
3. Confirm the Google OAuth callback URL exactly matches the URL registered in Google Cloud.
4. Confirm MongoDB network access allows the backend service to connect.
5. Keep PayU test credentials and `PAYU_MODE=test` while validating checkout.
6. Run `npm run check` from `backend/` to syntax-check backend JavaScript files.
7. Run `npm run build` from `frontend/` to validate the production frontend build.
8. After deployment, check `/api/health`, login/session behavior, My Orders, support threads, and both successful and failed PayU test returns.

## Important verification note

A source-code review cannot reveal which variables are currently configured in Render. A successful GitHub commit also does not prove that a deployment completed or that a live checkout works. Verify those separately in the hosting dashboard and browser.
