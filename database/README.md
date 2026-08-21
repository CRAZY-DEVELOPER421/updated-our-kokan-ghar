# Konkan Bazaar — Database

MySQL schema, seed data, and helper scripts for the Konkan Bazaar e-commerce platform.
Full project setup: see the **[main README](../README.md)**.

---

## Setup

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

## Schema Files

| File | Purpose | Always needed? |
|---|---|---|
| `schema.sql` | Core schema — **26 tables** (users, products, orders, cart, reviews…) | Yes |
| `seed.sql` | Seed data — 200 products, categories, etc. | Yes |
| `bundles_schema.sql` | Combo / bundle product tables | For bundles feature |
| `bank_offers_schema.sql` | Bank offer / discount tables | For bank offers |
| `cms_schema.sql` | CMS — blogs, videos, team | For CMS |
| `customer_service_schema.sql` | Terms, returns, shipping, FAQ, privacy pages | For policy pages |
| `settings_schema.sql` | `site_settings` — contact info, social links | For settings |
| `social_oauth_migration.sql` | OAuth: makes `password_hash` nullable | For Google/Facebook login |
| `campaigns_schema.sql` | Festive campaign landing pages (`campaigns` + `campaign_products`) | For festival collection pages |
| `campaigns_sections_schema.sql` | Campaign v2 — page background + unlimited sections (`campaign_sections`, `campaign_section_products`, `campaign_section_blogs`) | For festival collection pages (run after `campaigns_schema.sql`) |
| `low_stock_schema.sql` | Low stock alerts — adds `low_stock_threshold`/`critical_stock_threshold` to products + `stock_alerts` table | For low stock alerts & daily digest |

Run the optional files only for the features you use — they're idempotent and safe to
re-run. **Do not skip `social_oauth_migration.sql` if you enable social login** — see
[`../docs/SOCIAL_AUTH.md`](../docs/SOCIAL_AUTH.md).

---

## Tables (26 in core schema)

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

## Helper Scripts

### Seed scripts (feature content)

```bash
mysql -u root -p konkan_bazaar < video_cms_seed.sql  # Video CMS categories + demo data
```

> The old one-off fix scripts (`fix-all-issues.js`, `fix-subcategories-to-products.js`,
> `fix_primary_images.sql`, `update_product_images.sql`) and the legacy category seeds
> (`seed-categories.js`, `seed-category-descriptions.js`) were removed — they fixed/seeded
> a category structure that no longer exists. The catalog is now maintained entirely by
> `migrate-kokan-catalog.js` + `kokan-catalog-data.js` (below).

---

## Kokan Catalog Migration (categories → subcategories → products)

The full store catalog — **53 categories, 633 subcategories, 570 products** — lives in
the database. Duplicate products (the same item listed under more than one category,
e.g. "Mango Pickle" or "Wooden Spoon") are removed **automatically** on every run — the
first occurrence is kept, later duplicates are skipped. It is sourced from:

| File | Purpose |
|---|---|
| `kokan-catalog-data.js` | **Single source of truth** — the 53-category tree with all subcategories (committed to git, fully visible) |
| `migrate-kokan-catalog.js` | Migration runner — saves the catalog into MySQL with rich demo data for every product (description, price, MRP, stock, SKU, brand, unit, region, shelf life, ingredients, nutrition, storage, rating, tags, primary image) |
| `backups/legacy-catalog-backup.sql` | Backup of the pre-migration catalog data (safe to restore if ever needed) |

Run it (from project root — reads DB credentials from the root `.env`):

```bash
node database/migrate-kokan-catalog.js              # safe upsert — adds/updates rows, never deletes
node database/migrate-kokan-catalog.js --reset      # clear catalog tables first, then insert fresh
node database/migrate-kokan-catalog.js --reset-all  # clear catalog + orders/reviews/carts/bundles too (clean slate)
node database/migrate-kokan-catalog.js --dry-run    # print what would happen, touch nothing
```

> **Why `--reset-all`?** If existing test orders (`order_items`) reference old products,
> MySQL's `ON DELETE RESTRICT` will prevent `--reset` from deleting them. `--reset-all`
> also clears orders, reviews, carts, wishlists, flash sales and bundles first — use it
> for a completely clean catalog. It asks for confirmation (`--yes` skips the prompt).
>
> The migration is **deterministic and idempotent** — re-running it produces the exact
> same data (SKUs and slugs are derived from stable product identity, never from a
> positional counter), so it is safe to run any number of times.
>
> **Safe mode (`--reset` / no flag) note:** upserts match rows by slug. If a same-slug
> row already exists with a different name (e.g. old seed data), it will be updated to
> match the catalog and its previous children are kept — use `--reset-all` for a clean,
> exactly-53-category catalog.

Example flow for a fresh catalog:

```bash
node database/migrate-kokan-catalog.js --reset-all
```

Verify:

```bash
mysql -u root -p konkan_bazaar -e "SELECT COUNT(*) AS categories FROM categories; SELECT COUNT(*) AS products FROM products;"
# Expected: categories 686 (53 top-level + 633 sub), products 570
```

> The catalog intentionally keeps all 633 subcategories (including a few that end up
> with no product after duplicate removal — e.g. "Mango Pickle" under LONCHE/PICKLES
> while the kept copy lives under MANGO / AAMBA PRODUCTS). If you prefer those removed
> too, delete the matching entries from `kokan-catalog-data.js` and re-run the migration.
>
> **After any structural edit to `kokan-catalog-data.js` (moving/reordering categories
> or subcategories), re-run with `--reset-all`** so the "keep first occurrence" rule
> stays aligned with the new tree order.

> The JavaScript scripts connect using the **root `.env`** credentials
> (DB_HOST / DB_USER / DB_PASS / DB_NAME) — run them from `database/` or via
> `node ../database/<script>.js`.

---

## Conventions

- **utf8mb4** charset throughout (full emoji + Devanagari support).
- All application queries use **parameterized statements** — no ORM, no string interpolation.
- Never commit credentials — DB access comes from the root `.env` only.
