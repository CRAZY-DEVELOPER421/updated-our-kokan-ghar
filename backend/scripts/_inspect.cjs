require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: process.env.DB_HOST||'localhost', user: process.env.DB_USER||'root', password: process.env.DB_PASS||'', database: process.env.DB_NAME||'konkan_bazaar', connectTimeout: 8000 });
  const [uc] = await c.query('SHOW COLUMNS FROM users');
  console.log('USER_COLS', JSON.stringify(uc.map(x => x.Field)));
  const [sc] = await c.query('SHOW COLUMNS FROM site_settings');
  console.log('SETTINGS_COLS', JSON.stringify(sc.map(x => x.Field)));
  const [sr] = await c.query('SELECT setting_key, value FROM site_settings LIMIT 10');
  console.log('SETTINGS_SAMPLE', JSON.stringify(sr, null, 1));
  const [cnt] = await c.query('SELECT COUNT(*) AS total, SUM(role = "admin") AS admins, SUM(role = "seller") AS sellers, SUM(role = "customer") AS customers, SUM(is_active = 1) AS active FROM users');
  console.log('COUNTS', JSON.stringify(cnt));
  const [lg] = await c.query('SELECT COUNT(*) AS today FROM users WHERE last_login >= NOW() - INTERVAL 24 HOUR');
  console.log('LOGIN24H', JSON.stringify(lg[0]));
  await c.end();
})().catch(e => { console.log('FAIL:', e.message); process.exit(1); });
