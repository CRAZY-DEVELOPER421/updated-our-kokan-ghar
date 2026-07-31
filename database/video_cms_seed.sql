-- ============================================================
-- VIDEO CMS — Categories & Demo Data
-- ============================================================

USE konkan_bazaar;

-- Insert predefined video categories (skip if already exist)
INSERT IGNORE INTO video_categories (id, name, slug, type, description) VALUES
(1, 'Reels', 'reels', 'reels', 'Short, engaging vertical videos under 60 seconds'),
(2, 'Shorts', 'shorts', 'shorts', 'Quick vertical videos under 3 minutes'),
(3, 'Long Videos', 'long-videos', 'long', 'In-depth videos and full-length content'),
(4, 'Customer Stories', 'customer-stories', 'customer_story', 'Real stories and testimonials from our customers'),
(5, 'Product Videos', 'product-videos', 'product', 'Product showcases, reviews, and demonstrations');

-- Insert demo videos
INSERT IGNORE INTO videos (title, slug, description, video_url, thumbnail_url, category_id, tags, duration_seconds, is_published, is_featured, view_count, meta_title, meta_description, published_at) VALUES
(
  'Konkan Mango Magic - 60 Sec Reel',
  'konkan-mango-magic-reel',
  'Watch the journey of our Alphonso mangoes from Devgad orchards to your doorstep. Fresh, organic, and straight from Konkan!',
  'https://www.youtube.com/shorts/abc123reel1',
  'https://images.unsplash.com/photo-1551434678-e076238b5f42?w=400',
  1,
  'mango, reels, konkan, alphonso, fresh',
  45,
  1, 1, 1200,
  'Alphonso Mango Reel - Konkan Bazaar',
  'Short reel showing fresh Alphonso mangoes from Konkan farms',
  NOW() - INTERVAL 5 DAY
),
(
  'Goan Cashew Harvest - Short',
  'goan-cashew-harvest-short',
  'A quick look at how premium Goan cashews are harvested, dried, and packed. From tree to table, pure Konkan quality.',
  'https://www.youtube.com/shorts/abc456short2',
  'https://images.unsplash.com/photo-1566858850532-6b5f5b02c3a2?w=400',
  2,
  'cashew, goa, shorts, harvest, nuts',
  120,
  1, 1, 850,
  'Goan Cashew Harvest Short - Konkan Bazaar',
  'Short video showing premium cashew harvest in Goa',
  NOW() - INTERVAL 3 DAY
),
(
  'A Day in Konkan - Full Documentary',
  'day-in-konkan-documentary',
  'Experience a complete day in the beautiful Konkan region. From sunrise at the beaches of Ratnagiri to the spice gardens of Sindhudurg. A visual journey through the heart of Konkan.',
  'https://www.youtube.com/watch?v=demoLongVideo1',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  3,
  'documentary, konkan, travel, culture, food',
  1840,
  1, 1, 3400,
  'A Day in Konkan - Full Documentary - Konkan Bazaar',
  'Full-length documentary showcasing the beauty of Konkan region',
  NOW() - INTERVAL 10 DAY
),
(
  'Our Customer Journey with Konkan Bazaar - Anita',
  'customer-story-anita',
  'Meet Anita from Pune who has been ordering from Konkan Bazaar for over a year. Hear her experience with our products, delivery, and quality. Real story, real satisfaction.',
  'https://www.youtube.com/watch?v=demoCustomerStory1',
  'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400',
  4,
  'customer, story, testimonial, review, anita',
  280,
  1, 1, 2100,
  'Customer Story - Anita from Pune - Konkan Bazaar',
  'Real customer testimonial sharing her experience with Konkan Bazaar products',
  NOW() - INTERVAL 7 DAY
),
(
  'Alphonso Mango - Product Guide & Review',
  'alphonso-mango-product-guide',
  'Everything you need to know about our premium Devgad Alphonso mangoes. How to select, store, and enjoy the king of mangoes. Includes tasting notes and serving suggestions.',
  'https://www.youtube.com/watch?v=demoProductVideo1',
  'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
  5,
  'product, mango, alphonso, guide, review, devgad',
  420,
  1, 1, 1800,
  'Alphonso Mango Guide - Konkan Bazaar',
  'Complete guide to premium Devgad Alphonso mangoes - selection, storage, and serving',
  NOW() - INTERVAL 2 DAY
);
