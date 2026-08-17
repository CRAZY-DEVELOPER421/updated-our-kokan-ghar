// Backfill referral codes for existing users (no code yet). Run once after
// applying database/referral_migration.sql:
//   node backend/scripts/seed-referral-codes.js
const pool = require('../config/db');
const { ensureReferralCode } = require('../controllers/referral.controller');

(async () => {
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE referral_code IS NULL OR referral_code = \'\'');
    let done = 0;
    for (const u of users) {
      await ensureReferralCode(u.id);
      done++;
    }
    console.log(`Backfilled referral codes for ${done} user(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  }
})();
