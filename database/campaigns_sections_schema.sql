-- ============================================================
-- CAMPAIGN SECTIONS — v2 of the festive campaign pages
-- ------------------------------------------------------------
-- Run AFTER campaigns_schema.sql (it adds columns to campaigns
-- and creates the campaign_sections family of tables).
--
-- What's new:
--   campaigns.page_bg_*            → one full-page background
--                                    (color / image / video / transparent)
--   campaign_sections              → unlimited admin-built sections per
--                                    campaign: products | story | blog |
--                                    overview, each with its OWN background
--   campaign_section_products      → curated products inside a section
--   campaign_section_blogs         → existing blog posts linked to a section
--
-- Every statement is re-runnable (column-existence guards + IF NOT
-- EXISTS), so it is safe to run more than once.
-- ============================================================

-- ── 1. Page-level background on campaigns ─────────────────────
SET @dbname = DATABASE();

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'campaigns' AND COLUMN_NAME = 'page_bg_type'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE campaigns ADD COLUMN page_bg_type VARCHAR(20) NOT NULL DEFAULT ''transparent'' AFTER theme_color',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'campaigns' AND COLUMN_NAME = 'page_bg_color'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE campaigns ADD COLUMN page_bg_color VARCHAR(20) DEFAULT NULL AFTER page_bg_type',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'campaigns' AND COLUMN_NAME = 'page_bg_image'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE campaigns ADD COLUMN page_bg_image VARCHAR(500) DEFAULT NULL AFTER page_bg_color',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'campaigns' AND COLUMN_NAME = 'page_bg_video'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE campaigns ADD COLUMN page_bg_video VARCHAR(500) DEFAULT NULL AFTER page_bg_image',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. Sections (unlimited, ordered) ──────────────────────────
CREATE TABLE IF NOT EXISTS campaign_sections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT UNSIGNED NOT NULL,
  -- products | story | blog | overview
  section_type VARCHAR(20) NOT NULL DEFAULT 'products',
  title VARCHAR(255) DEFAULT NULL,
  subtitle VARCHAR(500) DEFAULT NULL,
  -- rich text (HTML allowed) for story / overview sections
  content MEDIUMTEXT,
  -- products layout: grid (5-per-row, wraps) | scroll (horizontal)
  layout VARCHAR(10) NOT NULL DEFAULT 'grid',
  -- per-section background: transparent | color | image | video
  bg_type VARCHAR(20) NOT NULL DEFAULT 'transparent',
  bg_color VARCHAR(20) DEFAULT NULL,
  bg_image VARCHAR(500) DEFAULT NULL,
  bg_video VARCHAR(500) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_campaign_sections_order (campaign_id, sort_order),
  CONSTRAINT fk_campaign_sections_campaign FOREIGN KEY (campaign_id)
    REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Products inside a section ──────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_section_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_campaign_section_product (section_id, product_id),
  CONSTRAINT fk_csp_section FOREIGN KEY (section_id)
    REFERENCES campaign_sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_csp_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Blog posts inside a section ────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_section_blogs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_id INT UNSIGNED NOT NULL,
  blog_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_campaign_section_blog (section_id, blog_id),
  CONSTRAINT fk_csb_section FOREIGN KEY (section_id)
    REFERENCES campaign_sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_csb_blog FOREIGN KEY (blog_id)
    REFERENCES blogs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
