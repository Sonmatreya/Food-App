# FoodDash – MERN food delivery app (Zomato-style)

MongoDB + Express + React (Vite) + Node.

## Features (from the screen recording)
- Search by restaurant or dish, cuisine chips, Veg Mode
- Filters: Near & Fast, Under ₹150, Rating 4.0+, sort
- Restaurant page with menu, veg filter, ADD / +/- stepper, cart bar
- Cart, coupons (SAVE75, FLAT175), server-calculated bill
- Login/Register (JWT), saved addresses, payment choice, place order, order history

## AI section (`/ai` page – "Your feed")
- **Snack pick + swipe to order** – time-of-day pick, bill priced by the server, swipe adds it to the cart and opens checkout
- **Trending items near you** – most-ordered dishes in the last 7 days (falls back to top-rated restaurants)
- **Chat: "What do you feel like eating?"** – `POST /api/ai/chat`
  1. Claude turns the message into filters (`keywords`, `veg`, `maxPrice`) and understands follow-ups like "cheaper"
  2. MongoDB search + ranking (rating, delivery time, offers, **your past orders**)
  3. Claude writes a short reply using only the retrieved facts (no invented dishes/prices)
  4. Client shows the reply plus restaurant cards with dish ADD buttons
- Works without `ANTHROPIC_API_KEY` too (rule-based parsing + template replies). Set the key in `server/.env` for the full AI mode.
- Chat is rate-limited (15 requests/min) to protect API cost; the key stays on the server.

## Run
Prerequisite: Node 18+ and MongoDB running locally (or an Atlas URI).

```bash
# 1. Backend
cd server
cp .env.example .env      # edit MONGO_URI / JWT_SECRET
npm install
npm run seed              # loads sample restaurants
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

## API
| Method | Route | Auth |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | – |
| GET | /api/auth/me | ✔ |
| POST/DELETE | /api/auth/address, /api/auth/address/:id | ✔ |
| GET | /api/restaurants (q, cuisine, veg, fast, under150, rating, sort) | – |
| GET | /api/restaurants/meta/cuisines, /api/restaurants/:id | – |
| POST | /api/orders/quote | – |
| POST | /api/orders | ✔ |
| GET | /api/orders/my, /api/orders/:id | ✔ |
| GET | /api/ai/feed | optional |
| POST | /api/ai/chat | optional (personalises when logged in) |
