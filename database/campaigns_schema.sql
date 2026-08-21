-- ============================================================
-- CAMPAIGNS — Admin-managed festive collection landing pages
-- (Ganesh Chaturthi, Diwali, Holi, etc.)
--
-- campaigns:       page metadata + theming (slug, theme color,
--                  banner image, countdown window)
-- campaign_products: curated product list for the page (ordered)
--
-- Storefront renders at /campaign/[slug] — no code needed per
-- festival; the admin creates a campaign and the page just works.
-- Banners / hero slides can link straight to /campaign/<slug>.
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  tagline VARCHAR(500) DEFAULT NULL,
  description TEXT,
  theme_color VARCHAR(20) NOT NULL DEFAULT '#2D6A4F',
  banner_image_url VARCHAR(500) DEFAULT NULL,
  mobile_banner_image_url VARCHAR(500) DEFAULT NULL,
  meta_title VARCHAR(255) DEFAULT NULL,
  meta_description VARCHAR(500) DEFAULT NULL,
  starts_at DATETIME DEFAULT NULL,
  ends_at DATETIME DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_campaigns_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaign_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_campaign_product (campaign_id, product_id),
  CONSTRAINT fk_campaign_products_campaign FOREIGN KEY (campaign_id)
    REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_campaign_products_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
