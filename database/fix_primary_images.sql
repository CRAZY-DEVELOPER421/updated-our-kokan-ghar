-- ============================================================
-- FIX: Backfill is_primary for existing product images
-- 
-- Problem: When images were added through the admin panel,
-- is_primary was not sent, so it defaulted to 0.
-- The listing API queries filter by is_primary=1, returning
-- NULL for primary_image on product cards.
--
-- This script sets is_primary=1 on the first image (lowest 
-- sort_order) for every product that has images but no 
-- primary image set.
-- ============================================================

USE konkan_bazaar;

-- For products that have images but NO primary image,
-- set the first image (by sort_order) as primary
UPDATE product_images 
SET is_primary = 1
WHERE id IN (
    SELECT first_image.id FROM (
        SELECT pi.id
        FROM product_images pi
        WHERE pi.is_primary = 0
        AND pi.product_id NOT IN (
            -- Products that already have a primary image
            SELECT DISTINCT product_id 
            FROM product_images 
            WHERE is_primary = 1
        )
        AND pi.sort_order = (
            -- Lowest sort_order for this product
            SELECT MIN(pi2.sort_order)
            FROM product_images pi2
            WHERE pi2.product_id = pi.product_id
        )
    ) AS first_image
);
