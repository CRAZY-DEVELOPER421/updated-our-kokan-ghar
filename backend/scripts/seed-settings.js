require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar'
  });

  const defaults = [
    ['site_logo', ''], // Custom logo URL — leave empty to use the default brand logo
    ['phone_primary', '+919876543210'],
    ['phone_secondary', '+918765432109'],
    ['email_primary', 'hello@kokanghar.in'],
    ['email_secondary', 'support@kokanghar.in'],
    ['email_contact_form', 'hello@kokanghar.in'],
    ['address_line1', 'Kokan Ghar Pvt. Ltd.'],
    ['address_line2', 'Shop No. 7, Mapusa Market'],
    ['address_city', 'Mapusa, Goa -- 403507'],
    ['address_country', 'India'],
    ['map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3847.123!2d73.816!3d15.594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMapusa%2C+Goa!5e0!3m2!1sen!2sin!4v1'],
    ['map_location_name', 'Mapusa, Goa'],
    ['business_hours_weekday', 'Monday - Saturday: 9:00 AM - 7:00 PM'],
    ['business_hours_sunday', 'Sunday: 10:00 AM - 2:00 PM'],
    ['business_hours_holiday', 'Public Holidays: Closed'],
    ['social_instagram', 'https://instagram.com/kokanaghar'],
    ['social_facebook', 'https://facebook.com/kokanaghar'],
    ['social_twitter', 'https://twitter.com/kokanaghar'],
    ['social_youtube', 'https://youtube.com/@kokanaghar'],
    ['social_whatsapp', 'https://wa.me/919876543210'],
    ['social_linkedin', 'https://linkedin.com/company/kokanaghar'],
    // Buy More, Save More tiers — JSON array of { min_order, discount_percent }
    ['bulk_discount_tiers', '[{"min_order":1000,"discount_percent":5},{"min_order":2000,"discount_percent":10},{"min_order":3000,"discount_percent":15},{"min_order":5000,"discount_percent":20}]'],
  ];

  let count = 0;
  for (const [key, val] of defaults) {
    await c.query(
      'INSERT IGNORE INTO site_settings (setting_key, `value`) VALUES (?, ?)',
      [key, val]
    );
    count++;
  }
  console.log('Inserted ' + count + ' default settings');

  const [rows] = await c.query('SELECT setting_key, `value` FROM site_settings ORDER BY id');
  rows.forEach(r => console.log('  ' + r.setting_key + ' = ' + r.value));

  await c.end();
  console.log('Done.');
})();
