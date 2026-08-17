# Konkan Bazaar — Authentic Konkan Products Online

An e-commerce marketplace exclusively for authentic Konkan region products from the Konkan coast of **Maharashtra, Goa, and Karnataka** — Alphonso mangoes, spices, cashews, seafood, and more.

Monorepo with three apps: a customer-facing **storefront**, an **admin panel**, and a **REST API** backend — all sharing a single environment file.

---

## Features

### Storefront (`frontend/`)
- 570 products across 53 categories & 633 subcategories (mangoes, kokum, cashews, spices, pickles, handicrafts…)
- Full-text search with autocomplete + trending suggestions
- Cart, wishlist, coupons & combo/bundle deals
- Checkout with **Razorpay** payments + order tracking timeline
- Product reviews with helpful-vote system
- Loyalty points with tier system & referrals
- Flash sales & bank offers
- Order history, buy-again, addresses & account settings
- Fully responsive, Konkan-themed design (infinite scroll, skeleton loading)

### Admin Panel (`admin/`)
- Analytics dashboard
- Product / category / variant management
- Orders, users, coupons, bundles, flash sales, bank offers
- CMS — blogs, videos, team
- Customer service pages (terms, shipping, FAQ…) & site settings

### Auth
- Email/password login (JWT: access 15 min + refresh 7 days httpOnly cookie)
- Google & Facebook **OAuth login** (reuses the same JWT session)

### Email Notifications (Nodemailer / SMTP)
- **Signup** — rich welcome email (brand, website link, “Start Searching” CTA, `WELCOME15` code, thank-you note)
- **Login** — welcome-back email for existing users (sent in the background; never delays login)
- **Google / Facebook OAuth** — new users get the welcome email, returning users the welcome-back email
- **New offer broadcast** — when a coupon is **created or edited/activated** in the admin panel, an offer email (e.g. “Kokan Ghar gives 30% OFF on our products!” with min-order details + coupon code) is sent to **every active user** in the database — fire-and-forget, so the admin API responds instantly. (Only broadcast while the coupon is active, so deactivating or editing an inactive draft never spams users)
- Password reset OTP, order confirmations, shipment updates & back-in-stock emails

### SMS Notifications (MSG91 / Fast2SMS)
- **Order placed** — SMS to the delivery-address phone (COD customers usually have no email)
- **Confirmed / Shipped / Out-for-delivery / Delivered / Cancelled** — status texts triggered from the admin order-status update (fire-and-forget, never fails the admin action)
- Set `SMS_PROVIDER=none` (or leave keys empty) to disable — the app skips SMS silently and orders are unaffected

### Post-Delivery Lifecycle Emails (repeat-order engine)
- **Review request** — ~2-3 days after delivery, an email lists each delivered item with a direct “Rate it ★” link (deep-links to the product page’s `#reviews` section) → feeds reviews into product pages
- **Reorder nudge** — ~14 days after delivery, a “restock your favourites” email with the same items and one-click product links → repeat orders
- Runs on a background scheduler (default every 60 min; disable with `LIFECYCLE_EMAILS_ENABLED=false`). Each order is emailed at most once per flow (`review_email_sent_at` / `reorder_email_sent_at`), so restarts never double-send

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Storefront** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 3 |
| **Admin Panel** | Next.js 16 (App Router), React 19, Tailwind CSS 3 |
| **Backend** | Node.js + Express, MySQL2 (parameterized raw queries, no ORM) |
| **Database** | MySQL 8+ (utf8mb4, 26 tables) |
| **State** | Zustand + TanStack React Query |
| **Auth** | JWT (access + refresh) with Google / Facebook OAuth |
| **Payments** | Razorpay |
| **API Docs** | Swagger UI (`/api-docs`) |
| **Email** | Nodemailer (SMTP) |
| **SMS** | MSG91 / Fast2SMS (transactional order updates) |

---

## Project Structure

```
konkan-bazaar/
├── frontend/        ← Storefront — Next.js 16 (PORT 3000)
├── admin/           ← Admin panel — Next.js 16 (PORT 3001)
├── backend/         ← REST API — Node.js + Express (PORT 5000)
├── database/        ← MySQL schema + seed files
├── docs/            ← Guides (e.g. docs/SOCIAL_AUTH.md)
└── .env             ← ONE shared env file for the whole project
```

---

## Prerequisites

- **Node.js 20.9+** (Node 24 recommended)
- **MySQL 8+** running locally
- npm (comes with Node)

---

## Quick Start

### 1. Database

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE konkan_bazaar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# Create tables + seed 200 products
mysql -u root -p konkan_bazaar < database/schema.sql
mysql -u root -p konkan_bazaar < database/seed.sql

# Optional feature tables (bundles, bank offers, CMS, settings, OAuth)
mysql -u root -p konkan_bazaar < database/bundles_schema.sql
mysql -u root -p konkan_bazaar < database/bank_offers_schema.sql
mysql -u root -p konkan_bazaar < database/cms_schema.sql
mysql -u root -p konkan_bazaar < database/customer_service_schema.sql
mysql -u root -p konkan_bazaar < database/settings_schema.sql
mysql -u root -p konkan_bazaar < database/social_oauth_migration.sql

# Load the full Kokan catalog (53 categories, 633 subcategories, 570 products)
# All catalog data comes from database/kokan-catalog-data.js — nothing is hardcoded in the app.
# Duplicate products (same item in multiple categories) are removed automatically.
node database/migrate-kokan-catalog.js --reset-all

# Verify
mysql -u root -p konkan_bazaar -e "SELECT COUNT(*) AS total_products FROM products"
# Expected: 570
```

> **Note:** `migrate-kokan-catalog.js` is the single source of truth for the store catalog.
> `--reset-all` gives a clean slate (also clears test orders/reviews/carts); use plain
> `node database/migrate-kokan-catalog.js` for a non-destructive upsert. See
> [`database/README.md`](database/README.md) for details.

### 2. Environment — ONE file for the whole project

Frontend, admin, and backend **all read the same `.env`** at the project root.

```bash
cp .env.example .env
# Then edit .env with your real values
```

| Variable | Purpose |
|---|---|
| `DB_HOST` / `DB_USER` / `DB_PASS` / `DB_NAME` | MySQL connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing (use `openssl rand -hex 32`) |
| `ADMIN_PANEL_PASSWORD` | Admin panel login — **required, no fallback** |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment gateway |
| `SMTP_*` | Transactional + promotional emails (OTP, welcome, welcome-back, offer broadcasts…) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google login |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook login |
| `FRONTEND_URL` / `BACKEND_URL` | CORS origins + OAuth redirect target |
| `NEXT_PUBLIC_*` | Inlined into the browser bundle at build time |

> **Never commit `.env`.** Only `.env.example` is committed.

### 3. Backend (API)

```bash
cd backend
npm install
npm run dev        # http://localhost:5000
```

### 4. Frontend (Storefront)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### 5. Admin Panel

```bash
cd admin
npm install
npm run dev        # http://localhost:3001
```

Login with the password from `ADMIN_PANEL_PASSWORD` in your root `.env`.
The password is **verified by the backend** — it is never checked in the browser.

---

## Social Login (Google & Facebook)

Both login methods use a redirect-based OAuth flow with PKCE and reuse the existing JWT session — no NextAuth needed.

Setup involves creating apps in the **Google Cloud Console** and **Facebook Developer Console**, whitelisting exact callback URLs, and setting the env vars above.

**Full setup guide: [`docs/SOCIAL_AUTH.md`](docs/SOCIAL_AUTH.md)**

---

## API Docs

With the backend running:

- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json
- **Health check**: http://localhost:5000/api/health

Main route groups: `auth`, `users`, `products`, `categories`, `cart`, `wishlist`, `orders`, `payment`, `search`, `coupons`, `flash-sales`, `bank-offers`, `bundles`, `reviews`, `notifications`, `banners`, `analytics`, `contact`, `cms`, `customer-service`, `settings`, `upload`, `admin`.

---

## Database (26 tables)

Users, addresses, categories, products, product_images, product_variants, product_tags, orders/order_items/order_tracking, cart/cart_items, wishlist, coupons/coupon_usage, reviews/review_votes, notifications, banners, flash_sales, loyalty_points/user_loyalty, referrals, search_logs, site_settings, subscribers.

All queries use parameterized statements — no ORM.

---

## Useful Scripts

```bash
# Backend seed scripts (after DB setup)
cd backend
node scripts/seed-offers.js           # coupons + bank offers
node scripts/seed-customer-service.js # terms/shipping/FAQ pages
node scripts/seed-settings.js         # site settings
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Admin login fails with "password is not configured" | Set `ADMIN_PANEL_PASSWORD` in root `.env` (required) |
| `EADDRINUSE` on :5000 | Another backend instance is running — stop it first |
| OAuth redirect mismatch | Follow `docs/SOCIAL_AUTH.md` section 4 — callback URLs must match exactly |
| Payments don't complete | Real `RAZORPAY_KEY_ID`/`SECRET` needed in `.env` |
| Emails not sent | Set real `SMTP_*` credentials (Gmail app passwords work) |
| Offer email not sent to users | SMTP may be failing (check backend logs) — the broadcast is fire-and-forget and emails queue in the background |
