const fs = require('fs');
const lines = fs.readFileSync('/tmp/lint_full.txt', 'utf8').split('\n');
let cur = null;
for (const line of lines) {
  if (/^[A-Z]:\\/.test(line.trim())) {
    cur = line.trim();
  }
  const m = line.match(/\s+(\d+):(\d+)\s+error\s+(.*)/);
  if (m && cur) {
    console.log(`${cur}:${m[1]} :: ${m[3].slice(0, 110)}`);
  }
}
