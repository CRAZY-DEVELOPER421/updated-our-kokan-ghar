// Audit: compare category image_url values in DB against actual files in frontend/public
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'frontend', 'public');

(async () => {
  const [rows] = await pool.query(
    "SELECT id, name, image_url FROM categories WHERE image_url IS NOT NULL ORDER BY id"
  );
  let missing = 0;
  for (const r of rows) {
    const rel = r.image_url.replace(/^\//, '');
    const full = path.join(PUBLIC_DIR, rel);
    const ok = fs.existsSync(full);
    if (!ok) {
      missing++;
      console.log(`✗ id=${r.id} "${r.name}" -> ${r.image_url}  [FILE MISSING]`);
    } else {
      console.log(`✓ id=${r.id} "${r.name}" -> ${r.image_url}`);
    }
  }
  console.log(`\nTotal: ${rows.length} | Missing: ${missing}`);
  process.exit(0);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
