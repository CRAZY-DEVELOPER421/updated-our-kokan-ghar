require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: process.env.DB_HOST||'localhost', user: process.env.DB_USER||'root', password: process.env.DB_PASS||'', database: process.env.DB_NAME||'konkan_bazaar', connectTimeout: 6000 });
  const [rows] = await c.query(`SELECT p.id, p.name, c.slug AS cat, (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS img FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.is_active=1 HAVING img IS NOT NULL ORDER BY c.slug LIMIT 60`);
  console.log(JSON.stringify(rows, null, 1));
  await c.end();
})().catch(e => { console.log('FAIL:', e.message); process.exit(1); });
