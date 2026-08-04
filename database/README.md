# 🗄️ Konkan Bazaar — Database

MySQL schema, seed data, and helper scripts for the Konkan Bazaar e-commerce platform.
Full project setup: see the **[main README](../README.md)**.

---

## 🚀 Setup

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE konkan_bazaar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 2. Core tables + seed data (200 products)
mysql -u root -p konkan_bazaar < schema.sql
mysql -u root -p konkan_bazaar < seed.sql

# 3. Verify
mysql -u root -p konkan_bazaar -e "SELECT COUNT(*) AS total_products FROM products"
# Expected: 200
```

---

## 📄 Schema Files

| File | Purpose | Always needed? |
|---|---|---|
| `schema.sql` | Core schema — **26 tables** (users, products, orders, cart, reviews…) | ✅ Yes |
| `seed.sql` | Seed data — 200 products, categories, etc. | ✅ Yes |
| `bundles_schema.sql` | Combo / bundle product tables | 🟡 For bundles feature |
| `bank_offers_schema.sql` | Bank offer / discount tables | 🟡 For bank offers |
| `cms_schema.sql` | CMS — blogs, videos, team | 🟡 For CMS |
| `customer_service_schema.sql` | Terms, returns, shipping, FAQ, privacy pages | 🟡 For policy pages |
| `settings_schema.sql` | `site_settings` — contact info, social links | 🟡 For settings |
| `social_oauth_migration.sql` | OAuth: makes `password_hash` nullable | 🟡 For Google/Facebook login |

Run the optional files only for the features you use — they're idempotent and safe to
re-run. **Do not skip `social_oauth_migration.sql` if you enable social login** — see
[`../docs/SOCIAL_AUTH.md`](../docs/SOCIAL_AUTH.md).

---

## 🗂️ Tables (26 in core schema)

- `users` — Customers, admins, sellers (`role` ENUM: `customer` / `admin` / `seller`)
- `addresses` — User delivery addresses
- `categories` — Hierarchical categories (`parent_id`)
- `products` — Core product catalog
- `product_images` — Gallery images (`is_primary` flag)
- `product_variants` — Size/weight variants
- `product_tags` — Organic, Seasonal, Bestseller tags
- `orders` / `order_items` / `order_tracking` — Orders + status timeline
- `cart` / `cart_items` — Shopping cart
- `wishlist` — User wishlists
- `coupons` / `coupon_usage` — Discount codes + usage tracking
- `reviews` / `review_votes` — Product reviews + helpful votes
- `notifications` — In-app notifications
- `banners` — Homepage banners
- `flash_sales` — Time-limited deals
- `loyalty_points` / `user_loyalty` — Points & tiers
- `referrals` — Referral program
- `search_logs` — Search analytics
- `site_settings` — App configuration (contact, social links)
- `subscribers` — Newsletter subscribers

> **Note:** Social-only accounts insert with `password_hash = NULL`, `role = 'customer'`,
> `is_verified = 1`, `is_active = 1`. Existing users are linked by email — a
> password user who later signs in with Google keeps their password login.

---

## 🔧 Helper Scripts

### Fix scripts (run when data looks wrong)

```bash
node fix-all-issues.js                 # Fix category↔product mismatches
node fix-subcategories-to-products.js  # Convert mistaken subcategories into products
mysql -u root -p konkan_bazaar < fix_primary_images.sql   # Backfill is_primary on images
mysql -u root -p konkan_bazaar < update_product_images.sql # Reset/replace product images
```

### Seed scripts (category content)

```bash
node seed-categories.js            # Idempotent category seed (skips existing)
node seed-category-descriptions.js # Description + image_url for all categories
mysql -u root -p konkan_bazaar < video_cms_seed.sql  # Video CMS categories + demo data
```

> The JavaScript scripts connect using the **root `.env`** credentials
> (DB_HOST / DB_USER / DB_PASS / DB_NAME) — run them from `database/` or via
> `node ../database/<script>.js`.

---

## 🔒 Conventions

- **utf8mb4** charset throughout (full emoji + Devanagari support).
- All application queries use **parameterized statements** — no ORM, no string interpolation.
- Never commit credentials — DB access comes from the root `.env` only.
