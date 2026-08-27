-- ============================================================
-- Regional Content Migration — Marathi product names & descriptions
-- Adds name_mr and description_mr columns to the products table.
-- Run: mysql -u root -p konkan_bazaar < database/regional_content_migration.sql
-- ============================================================

-- Add Marathi name column (nullable — falls back to English `name`)
ALTER TABLE products
  ADD COLUMN name_mr VARCHAR(255) DEFAULT NULL AFTER name;

-- Add Marathi description column (nullable — falls back to English `description`)
ALTER TABLE products
  ADD COLUMN description_mr TEXT DEFAULT NULL AFTER description;

-- Add Marathi short description column
ALTER TABLE products
  ADD COLUMN short_description_mr VARCHAR(500) DEFAULT NULL AFTER short_description;

-- Add Marathi meta columns for SEO
ALTER TABLE products
  ADD COLUMN meta_title_mr VARCHAR(255) DEFAULT NULL AFTER meta_title;

ALTER TABLE products
  ADD COLUMN meta_description_mr TEXT DEFAULT NULL AFTER meta_description;

-- Index for regional content queries
ALTER TABLE products
  ADD INDEX idx_products_name_mr (name_mr);
