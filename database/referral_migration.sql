-- ============================================================
-- REFERRAL PROGRAM — migration for EXISTING databases
-- ============================================================
-- Run this ONCE against your existing database to enable the
-- Refer & Earn program and its anti-fake-signup safeguards:
--
--   mysql -u <user> -p konkan_bazaar < referral_migration.sql
--   node backend/scripts/seed-referral-codes.js   (backfill codes for existing users)
--
-- Why:
--   1. `referral_code` — every user needs a personal, shareable code.
--   2. UNIQUE `phone` — the key anti-fraud guard: the same phone number
--      can never create a second account (no email-swap coin farming).
--   3. UNIQUE `referral_code` — codes never collide.

-- Normalize legacy empty-string phones so the unique key is clean.
UPDATE users SET phone = NULL WHERE phone = '';

-- Personal referral code (8 chars, e.g. KB7X9F2M). Generated in code at
-- signup; existing users are backfilled by seed-referral-codes.js.
ALTER TABLE users
  ADD COLUMN referral_code VARCHAR(20) DEFAULT NULL AFTER phone,
  ADD UNIQUE KEY uk_users_referral_code (referral_code),
  ADD UNIQUE KEY uk_users_phone (phone);
