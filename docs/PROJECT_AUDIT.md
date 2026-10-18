# Food-App project audit

**Audit date:** 2026-10-18  
**Branch reviewed:** `main`  
**Repository:** https://github.com/Sonmatreya/Food-App

## Scope and verification boundary

This audit is based on the current GitHub source files fetched from `main`. It is a source review, not a local build, automated test run, penetration test, or live Render verification. Deployment environment values and database contents are not visible through the source review.

## Current architecture observed

- Frontend: React 19, React Scripts 5, React Router DOM 7, Material UI/icons, React Icons, Socket.IO client, Leaflet / React Leaflet.
- Backend: Node.js / Express 5, Mongoose 9, JWT stored in an HTTP-only cookie, Helmet, CORS, Express rate limiting, Socket.IO, PayU test checkout, OpenRouter-based AI.
- Data and product features represented in source: food catalogue, customer accounts, orders, coupons, reviews, wishlist, saved addresses, notifications, support inbox, admin pages, delivery/pickup, order status history and handover OTP.
- Frontend API URL is selected using `REACT_APP_API_URL`, otherwise production defaults to `https://food-app-backend-lxic.onrender.com` and development to `http://localhost:5000`.

## Findings and priorities

### P0 — Verify deployment prerequisites before changing behavior

`backend/config/env.js` requires `MONGO_URI`, `JWT_SECRET`, `CAPTCHA_SECRET`, `GOOGLE_CALLBACK_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` at module load. Missing values can stop backend startup. Review Render environment configuration and ensure CORS origins, client URL, Google callback URL, PayU test credentials, and API base URLs agree. Actual configured values were not available during this audit.

### P1 — Customer support must be integrated with My Orders

The current `SupportRequest` schema stores `orderNumber` as free text and has no verified `orderId` / customer ownership relationship. `POST /api/support` is public, while the secure request tracking experience is a separate route. This does not provide a first-class complaint/reply panel in the customer's order details.

**Recommended change:** allow authenticated customers to create support requests from their own order details; store an explicit order reference and customer user ID; expose only the owner's support requests through authenticated order APIs; show admin replies and support status inline in My Orders / order details. Keep general unauthenticated contact requests supported, but do not attach them to an order solely from a user-entered order number. Never return internal resolution notes to customers.

### P1 — Audit the full PayU return and confirmation lifecycle

The frontend has separate `/payment-result`, `/payment-success/:orderId`, and `/order-success/:orderId` pages. `PaymentSuccess` requires a `payment=success` query and checks `paymentStatus === paid`; `OrderSuccess` also clears the cart when that query parameter says success. Backend PayU routes are public for the provider callback and rely on controller-side signature validation. Before consolidating pages, verify transaction/order association, signed callback validation, payment status transitions, idempotency, duplicate callbacks, mobile/desktop redirects, refresh behavior, and cart clearing. PayU is explicitly test mode in the controller; do not present it as live payment processing.

### P1 — Validate startup, API and dependency compatibility

The checked-in manifests specify React 19 with React Scripts 5 and React Router DOM 7, plus Express 5 and Mongoose 9. This combination should be validated against the actual build/runtime and Render Node version rather than assumed compatible. The root `package.json` only declares Leaflet packages, while application manifests live in separate frontend/backend directories; verify Render root directories and install/build commands for each service.

### P1 — Add repeatable automated verification

The repository search did not surface GitHub Actions workflows or backend test files, and the frontend manifest only exposes the standard Create React App test script. Confirm whether tests exist outside the indexed paths. Add CI checks for frontend production build, backend syntax/module loading, and tests for auth/ownership, order totals, PayU callback verification, support visibility, and admin authorization.

### P2 — Security and operational hardening

- Review rate limiting for AI endpoints, public food endpoints and payment initiation; retain current authentication and admin checks.
- Verify cookie flags, CORS allow-list, trust-proxy configuration, and CSRF protections for cookie-authenticated state-changing routes.
- Confirm all customer-facing API responses omit internal fields such as support resolution notes, access-token hashes, OTP hashes, and secrets.
- Review OpenRouter timeout/error handling and model configuration; AI output must remain advisory and must not claim an order/refund/payment action happened without a verified backend operation.
- Run dependency vulnerability checks in a controlled branch or local environment. Do not run `npm audit fix --force` without reviewing breaking changes.

### P2 — Product UX and maintainability

The project already contains a broad set of pages and components. Upgrade the existing implementation rather than replacing it with a CSS-only redesign. Prioritize a consistent red brand system, accessible responsive layouts, loading/empty/error states, keyboard focus, image fallbacks, and consistent toast/error handling across Home, Menu, Food Details, Cart, Checkout, My Orders, and Admin pages. Avoid broad visual rewrites until the main checkout and account flows are stable.

## Recommended phase sequence

1. **Phase 1 — Stabilize:** validate package/build configuration, required environment variable documentation, API errors, auth/session and payment return behavior; add repeatable checks.
2. **Phase 2 — Order-centred support:** connect authenticated support requests to the user's order and show replies inside My Orders/order details while retaining general contact.
3. **Phase 3 — Checkout reliability:** test PayU test callbacks, success/failure routes, refresh, and cart-clearing idempotency across browser navigation.
4. **Phase 4 — Admin workflows and API security:** review permissions, pagination, validation, AI support analysis, and operational error handling.
5. **Phase 5 — Premium UI:** improve all customer/admin pages with substantive component-level changes while preserving the existing red brand and API contracts.
6. **Phase 6 — Verification and release:** run frontend build, backend syntax/tests, targeted flow tests, then check Render deployment and live smoke tests separately.

## Verification status

- **Source fetched from GitHub:** yes, selected current files from `main`.
- **Changes made during this audit:** none to application behavior.
- **Local build / tests executed:** no.
- **Render deployment / live API verified:** no.
- **Next recommended implementation:** Phase 1 stabilization checks, then order-centred support integration.
