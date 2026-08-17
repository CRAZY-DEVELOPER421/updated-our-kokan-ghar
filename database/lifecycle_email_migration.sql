-- Post-delivery lifecycle emails
-- Tracks which delivered orders already got their review-request / reorder
-- reminder so the background scheduler never emails the same order twice.
ALTER TABLE orders
  ADD COLUMN review_email_sent_at DATETIME NULL AFTER delivered_at,
  ADD COLUMN reorder_email_sent_at DATETIME NULL AFTER review_email_sent_at;
