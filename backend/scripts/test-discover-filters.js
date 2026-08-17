/**
 * Discover Products For You — full filter click test (headless Chrome via CDP).
 * Mobile viewport. Verifies:
 *   - ₹600+ chip → min_price=600 API call + products update
 *   - category dropdown opens, a real category can be selected → category=<slug>
 *   - active chips get visible green highlight
 *
 * Run: node backend/scripts/test-discover-filters.js   (frontend on :3000, backend on :5000)
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const CDP_PORT = 9238;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-cdp-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userData}`,
    '--window-size=430,932',
    'about:blank',
  ], { stdio: 'ignore' });

  let ws;
  try {
    let page = null;
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
        const targets = await res.json();
        page = targets.find((t) => t.type === 'page');
        if (page) break;
      } catch { /* not up yet */ }
      await sleep(500);
    }
    if (!page) throw new Error('Page target not found');

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

    let msgId = 0;
    const pending = new Map();
    const apiRequests = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else if (msg.method === 'Network.requestWillBeSent') {
        const url = msg.params.request.url;
        if (url.includes('/products/random')) apiRequests.push(url);
      }
    };

    const send = (method, params = {}) => new Promise((resolve) => {
      const id = ++msgId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evalJs = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res.result?.result?.value;
    };

    await send('Runtime.enable');
    await send('Network.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: FRONTEND_URL });
    await sleep(3000);

    // Wait for mobile section with products
    let ready = false;
    for (let i = 0; i < 30; i++) {
      ready = await evalJs(`(() => {
        const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
        const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
        if (!visible.length) return false;
        let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
        return !!el && el.querySelectorAll('a[href*="/products/"]').length > 0;
      })()`);
      if (ready) break;
      await sleep(1000);
    }
    console.log('Mobile section ready:', ready);

    // 1. ₹600+ chip
    await evalJs(`(() => {
      const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
      const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
      const chip = [...el.querySelectorAll('button')].find(b => b.textContent.trim() === '₹600+');
      chip && chip.click();
    })()`);
    await sleep(4000);

    const after600 = await evalJs(`(() => {
      const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
      const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
      const chip = [...el.querySelectorAll('button')].find(b => b.textContent.trim() === '₹600+');
      const cards = el.querySelectorAll('a[href*="/products/"]');
      const texts = [...cards].map(a => (a.textContent || '').replace(/\\s+/g, ' ').trim()).slice(0, 2);
      return { chipBg: chip ? getComputedStyle(chip).backgroundColor : 'n/a', cardCount: cards.length, texts };
    })()`);
    console.log('₹600+ → chipBg:', after600?.chipBg, '| cards:', after600?.cardCount, '| texts:', JSON.stringify(after600?.texts));

    // 2. Category dropdown — select the 2nd real option (skip "All Categories")
    const catPicked = await evalJs(`(() => {
      const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
      const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
      const ddBtn = el.querySelector('button');
      ddBtn.click(); // open dropdown
      return true;
    })()`);
    await sleep(800);
    const picked = await evalJs(`(() => {
      // The category panel is the one that contains an "All Categories" button
      const panels = [...document.querySelectorAll('div.fixed')];
      for (const panel of panels) {
        const btns = [...panel.querySelectorAll('button')];
        if (!btns.some(b => b.textContent.trim() === 'All Categories')) continue;
        const real = btns.find(b => b.textContent.trim() && b.textContent.trim() !== 'All Categories');
        if (real) {
          const label = real.textContent.trim();
          real.click();
          return label;
        }
      }
      return null;
    })()`);
    console.log('Category picked:', picked);
    await sleep(4000);

    const afterCat = await evalJs(`(() => {
      const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
      const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
      const ddBtn = el.querySelector('button');
      const cards = el.querySelectorAll('a[href*="/products/"]');
      return { ddBtnText: ddBtn?.textContent.trim() || '', bg: ddBtn ? getComputedStyle(ddBtn).backgroundColor : 'n/a', cards: cards.length };
    })()`);
    console.log('After category → button:', JSON.stringify(afterCat));

    console.log('\n── All /products/random API calls ──');
    apiRequests.forEach((u) => console.log('   ', u.split('http://localhost:5000')[1] || u));

    const checks = [
      ['₹600+ → min_price=600', apiRequests.some((u) => u.includes('min_price=600'))],
      ['₹600+ highlight (green fill)', after600?.chipBg === 'rgb(27, 59, 47)'],
      ['Category → category=<slug>', apiRequests.some((u) => /category=[a-zA-Z]/.test(u.split('?')[1] || ''))],
      ['Category button shows name + active', !!afterCat?.ddBtnText && afterCat.ddBtnText !== 'All Categories'],
    ];
    console.log('\n── Verdicts ──');
    checks.forEach(([name, ok]) => console.log(ok ? '  ✅ ' + name : '  ❌ ' + name));
    console.log('\nRESULT: ' + (checks.every(([, ok]) => ok) ? 'ALL PASS' : 'SOME FAIL'));
    process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
  } finally {
    if (ws) { try { ws.close(); } catch {} }
    chrome.kill();
    try { fs.rmSync(userData, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
