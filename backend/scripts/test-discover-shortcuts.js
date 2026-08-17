/**
 * Discover Products For You — desktop category shortcut buttons test.
 * Verifies: 5 shortcut buttons render next to "All Categories", clicking one
 * sends category=<slug> in the API call, and the button gets active styling.
 *
 * Run: node backend/scripts/test-discover-shortcuts.js   (frontend :3000, backend :5000)
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const CDP_PORT = 9240;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-shortcut-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userData}`,
    '--window-size=1440,900',
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

    // Wait for desktop Discover section with products
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
    console.log('Desktop section ready:', ready);

    // Check shortcut buttons render
    const shortcuts = await evalJs(`(() => {
      const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
      const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
      const btns = [...el.querySelectorAll('button')].map(b => b.textContent.trim());
      const expected = ['Mangoes', 'Cashews', 'Kokum', 'Spices', 'Pickles'];
      const found = expected.filter(l => btns.includes(l));
      return { allFivePresent: found.length === 5, found, allButtons: btns.slice(0, 12) };
    })()`);
    console.log('Shortcut buttons:', JSON.stringify(shortcuts));

    // Click "Cashews" shortcut
    const clicked = await evalJs(`(() => {
      const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
      const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
      const btn = [...el.querySelectorAll('button')].find(b => b.textContent.trim() === 'Cashews');
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    console.log('Cashews shortcut clicked:', clicked);
    await sleep(4000);

    const after = await evalJs(`(() => {
      const h2s = [...document.querySelectorAll('h2')].filter(h => h.textContent.includes('Discover Products For You'));
      const visible = h2s.filter(h => { const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      let el = visible[0]; while (el && el.tagName !== 'SECTION') el = el.parentElement;
      const btn = [...el.querySelectorAll('button')].find(b => b.textContent.trim() === 'Cashews');
      const cards = el.querySelectorAll('a[href*="/products/"]');
      const noProd = el.textContent.includes('No products found');
      return {
        btnBg: btn ? getComputedStyle(btn).backgroundColor : 'n/a',
        btnColor: btn ? getComputedStyle(btn).color : 'n/a',
        cards: cards.length,
        noProducts: noProd,
      };
    })()`);
    console.log('After click:', JSON.stringify(after));

    console.log('\n── /products/random API calls ──');
    apiRequests.forEach((u) => console.log('   ', u.split('http://localhost:5000')[1] || u));

    const checks = [
      ['5 shortcut buttons present', shortcuts?.allFivePresent === true],
      ['Cashews click → category=kokan-cashew-kaju', apiRequests.some((u) => u.includes('category=kokan-cashew-kaju'))],
      ['Active button highlighted (green fill)', after?.btnBg === 'rgb(45, 106, 79)'],
      ['Products loaded for category', after?.cards > 0 && !after?.noProducts],
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
