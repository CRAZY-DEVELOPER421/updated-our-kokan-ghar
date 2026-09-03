-- ============================================================
-- Migration: Add color_histogram for image similarity search
-- ============================================================

-- Store pre-computed color histogram (JSON array of 64 numbers)
-- as a compact visual fingerprint for each product image.
ALTER TABLE product_images
  ADD COLUMN color_histogram JSON DEFAULT NULL
  COMMENT 'Pre-computed 64-bin RGB color histogram for visual similarity search';

-- Index for fast comparison (not needed for JSON, but useful for queries)
-- The comparison happens in application code, not SQL.
