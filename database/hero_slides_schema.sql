-- ============================================================
-- HERO SLIDES — Admin-managed homepage hero slider
-- blocks: JSON array of { id, type, text, link, variant }
--   type: 'badge' | 'h1'..'h6' | 'p' | 'button'
--   variant (buttons): 'primary' | 'ghost'
-- ============================================================
CREATE TABLE IF NOT EXISTS hero_slides (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  media_type ENUM('image','video') NOT NULL DEFAULT 'image',
  image_url VARCHAR(500) DEFAULT NULL,
  video_url VARCHAR(500) DEFAULT NULL,
  blocks JSON NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hero_slides_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
