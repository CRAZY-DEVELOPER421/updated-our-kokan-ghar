-- ============================================================
-- SOCIAL OAUTH (Google / Facebook) — migration for EXISTING databases
-- ============================================================
-- Run this ONCE against your existing database before enabling
-- Google/Facebook login:
--
--   mysql -u <user> -p konkan_bazaar < social_oauth_migration.sql
--
-- Why: social-only accounts have no password, so `password_hash` must be
-- allowed to be NULL. Existing password accounts are unaffected.

ALTER TABLE users
  MODIFY password_hash VARCHAR(255) DEFAULT NULL;
