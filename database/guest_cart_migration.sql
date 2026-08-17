-- ============================================================
-- GUEST CART MIGRATION
-- Allows a cart to belong to a guest (device id) OR a logged-in user,
-- so visitors can add items WITHOUT an account and only log in at
-- checkout (guest cart → login → merge → payment).
--
-- Run: mysql -u root -p konkan_bazaar < database/guest_cart_migration.sql
-- ============================================================

-- 1. user_id becomes nullable (a guest cart has no user)
ALTER TABLE cart MODIFY COLUMN user_id INT UNSIGNED NULL;

-- 2. guest_id column — unique per device. NULL for user carts.
ALTER TABLE cart ADD COLUMN guest_id VARCHAR(64) DEFAULT NULL AFTER user_id;

-- 3. Unique index on guest_id (MySQL allows multiple NULLs)
ALTER TABLE cart ADD UNIQUE INDEX idx_cart_guest (guest_id);
