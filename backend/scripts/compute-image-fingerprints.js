/**
 * Pre-compute color histograms for all product images.
 * Run: node backend/scripts/compute-image-fingerprints.js
 *
 * Checks both frontend/public/ and backend/uploads/ directories.
 * Skips images whose files don't exist (placeholder URLs from seed).
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const BINS_PER_CHANNEL = 4;
const TOTAL_BINS = BINS_PER_CHANNEL ** 3;

async function computeHistogram(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .resize(32, 32, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const histogram = new Array(TOTAL_BINS).fill(0);
  for (let i = 0; i < data.length; i += 3) {
    const rBin = Math.min(Math.floor(data[i] / (256 / BINS_PER_CHANNEL)), BINS_PER_CHANNEL - 1);
    const gBin = Math.min(Math.floor(data[i + 1] / (256 / BINS_PER_CHANNEL)), BINS_PER_CHANNEL - 1);
    const bBin = Math.min(Math.floor(data[i + 2] / (256 / BINS_PER_CHANNEL)), BINS_PER_CHANNEL - 1);
    const idx = rBin * BINS_PER_CHANNEL * BINS_PER_CHANNEL + gBin * BINS_PER_CHANNEL + bBin;
    histogram[idx]++;
  }
  const max = Math.max(...histogram, 1);
  return histogram.map(v => Math.round((v / max) * 255));
}

function resolveImagePath(imageUrl) {
  // Express serves BOTH '/uploads/*' and '/images/*' from backend/uploads
  // (see server.js: app.use('/uploads'|'/images', express.static(uploads))),
  // so a DB URL such as /images/products/<slug>.jpg physically lives at
  // backend/uploads/products/<slug>.jpg. Try multiple locations:
  const uploadsDir = path.join(__dirname, '../uploads');
  const urlPath = imageUrl.replace(/^\/images\//, '').replace(/^\/uploads\//, '');
  const candidates = [
    path.join(uploadsDir, urlPath),                // backend/uploads/products/x.jpg
    path.join(uploadsDir, path.basename(imageUrl)), // flat /uploads/<uuid>.png
    path.join(__dirname, '../../frontend/public', imageUrl),
    path.join(__dirname, '..', imageUrl),          // legacy e.g. backend/uploads/...
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  console.log('🎨 Computing color fingerprints...\n');

  const [images] = await pool.query(`
    SELECT pi.id, pi.product_id, pi.image_url
    FROM product_images pi
    WHERE pi.color_histogram IS NULL
    ORDER BY pi.id
  `);

  console.log(`Found ${images.length} images to process\n`);

  let processed = 0, skipped = 0, errors = 0;

  for (const img of images) {
    try {
      const imagePath = resolveImagePath(img.image_url);
      if (!imagePath) { skipped++; continue; }

      const imageBuffer = fs.readFileSync(imagePath);
      const histogram = await computeHistogram(imageBuffer);
      await pool.query('UPDATE product_images SET color_histogram = ? WHERE id = ?', [JSON.stringify(histogram), img.id]);
      processed++;
      if (processed % 25 === 0) console.log(`  ✅ ${processed}/${images.length}...`);
    } catch (err) {
      console.error(`  ❌ Image ${img.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n🎉 Done! Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);

  const [count] = await pool.query('SELECT COUNT(*) as total, SUM(color_histogram IS NOT NULL) as computed FROM product_images');
  console.log(`   Total: ${count[0].total}, With fingerprint: ${count[0].computed || 0}`);

  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
