-- ============================================================
-- SITE SETTINGS — Contact info, Social Links, Map, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default settings
INSERT IGNORE INTO site_settings (setting_key, `value`) VALUES
  ('phone_primary', '+919876543210'),
  ('phone_secondary', '+918765432109'),
  ('email_primary', 'hello@konkanbazaar.in'),
  ('email_secondary', 'support@konkanbazaar.in'),
  ('email_contact_form', 'hello@konkanbazaar.in'),
  ('address_line1', 'Kokan Ghar Pvt. Ltd.'),
  ('address_line2', 'Shop No. 7, Mapusa Market'),
  ('address_city', 'Mapusa, Goa — 403507'),
  ('address_country', 'India'),
  ('map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3847.123!2d73.816!3d15.594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMapusa%2C+Goa!5e0!3m2!1sen!2sin!4v1'),
  ('map_location_name', 'Mapusa, Goa'),
  ('business_hours_weekday', 'Monday – Saturday: 9:00 AM – 7:00 PM'),
  ('business_hours_sunday', 'Sunday: 10:00 AM – 2:00 PM'),
  ('business_hours_holiday', 'Public Holidays: Closed'),
  ('social_instagram', 'https://instagram.com/kokanaghar'),
  ('social_facebook', 'https://facebook.com/kokanaghar'),
  ('social_twitter', 'https://twitter.com/kokanaghar'),
  ('social_youtube', 'https://youtube.com/@kokanaghar'),
  ('social_whatsapp', 'https://wa.me/919876543210'),
  ('social_linkedin', 'https://linkedin.com/company/kokanaghar');
