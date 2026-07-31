# Database — Konkan Bazaar

## Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE konkan_bazaar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# Create tables
mysql -u root -p konkan_bazaar < schema.sql

# Seed with 200 products
mysql -u root -p konkan_bazaar < seed.sql

# Verify
mysql -u root -p konkan_bazaar -e "SELECT COUNT(*) AS total_products FROM products"
# Expected: 200
```

## Schema (26 Tables)

- `users` — Customers, admins, sellers
- `addresses` — User delivery addresses
- `categories` — Product categories (hierarchical via parent_id)
- `products` — Core product catalog
- `product_images` — Gallery images
- `product_variants` — Size/weight variants
- `product_tags` — Organic, Seasonal, Bestseller tags
- `orders` / `order_items` / `order_tracking` — Order management
- `cart` / `cart_items` — Shopping cart
- `wishlist` — User wishlists
- `coupons` / `coupon_usage` — Discount codes
- `reviews` / `review_votes` — Product reviews
- `notifications` — In-app notifications
- `banners` — Homepage banners
- `flash_sales` — Time-limited deals
- `loyalty_points` / `user_loyalty` — Points & tiers
- `referrals` — Referral program
- `search_logs` — Search analytics
- `site_settings` — App configuration
- `subscribers` — Newsletter subscribers

All queries use parameterized statements. No ORM.
