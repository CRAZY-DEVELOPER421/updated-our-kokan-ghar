-- ─────────────────────────────────────────────────────────────
-- Navbar Manager — admin-controlled storefront navigation links
-- The storefront navbar (desktop + mobile) reads from this table.
-- Admin can add / remove / reorder / hide links without touching code.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS navbar_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label_key VARCHAR(50) NULL COMMENT 'Translation key (nav.*) for localized labels; falls back to label',
  label VARCHAR(100) NOT NULL COMMENT 'Display label (used when label_key has no translation)',
  href VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_navbar_active_order (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed with the current storefront nav links (same order as the code had).
INSERT INTO navbar_items (label_key, label, href, sort_order, is_active) VALUES
  ('shop_by_region', 'Shop by Region', '/#shop-by-region', 1, 1),
  ('fresh_arrivals', 'Fresh Arrivals', '/products?sort=newest', 2, 1),
  ('seasonal_picks', 'Seasonal Picks', '/products?seasonal=true', 3, 1),
  ('seafood', 'Seafood', '/categories/coastal-seafood', 4, 1),
  ('organic', 'Organic', '/products?organic=true', 5, 1),
  ('cashew_special', 'Cashew Special', '/categories/cashew-dry-fruits', 6, 1),
  ('konkan_mango', 'Konkan Mango', '/categories/konkan-mangoes-fruits', 7, 1),
  ('offers', 'Offers', '/offers', 8, 1),
  ('about', 'About', '/about', 9, 1),
  ('blog', 'Blog', '/blog', 10, 1),
  ('videos', 'Videos', '/videos', 11, 1);
