// One-off helper: rotate ADMIN_PANEL_PASSWORD in .env safely (avoids sed escaping pitfalls)
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');
const NEW_PASSWORD = process.env.NEW_ADMIN_PASSWORD;

if (!NEW_PASSWORD) {
  console.error('Usage: NEW_ADMIN_PASSWORD=... node scripts/_update_admin_password.cjs');
  process.exit(1);
}

let content = fs.readFileSync(ENV_PATH, 'utf8');

if (/^ADMIN_PANEL_PASSWORD=.*$/m.test(content)) {
  content = content.replace(/^ADMIN_PANEL_PASSWORD=.*$/m, `ADMIN_PANEL_PASSWORD=${NEW_PASSWORD}`);
  console.log('✓ ADMIN_PANEL_PASSWORD line updated');
} else {
  // Append if missing
  content += `\nADMIN_PANEL_PASSWORD=${NEW_PASSWORD}\n`;
  console.log('✓ ADMIN_PANEL_PASSWORD line appended');
}

fs.writeFileSync(ENV_PATH, content, 'utf8');
console.log('✓ .env written');
process.exit(0);
