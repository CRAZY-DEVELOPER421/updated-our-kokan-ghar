/**
 * Cart page — "Best Offers For You" UI test (headless Chrome CDP).
 * Verifies: best offer section renders, Apply button works end-to-end,
 * applied coupon shows in the applied state with savings.
 *
 * Prereqs: backend :5000 (new code), frontend :3000 (new build).
 * Run: node backend/scripts/test-coupon-suggest-browser.js
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:5000/api';
const CDP_PORT = 9241;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(pathname, opts = {}) {
  const headers = { ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) };
  if (opts.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(API_BASE + pathname, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  const stamp = Date.now();
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-coupon-'));

  // 1. Register a fresh user + fill the cart via API (unique phone per run)
  const phoneSuffix = String(stamp).slice(-5);
  const reg = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Coupon UI',
      email: `coupon-ui-${stamp}@example.com`,
      phone: `90000${phoneSuffix}`,
      password: 'Test@1234',
    },
  });
  if (reg.status !== 201) throw new Error('register failed: ' + reg.status);
  const token = reg.data.data.accessToken;
  const userId = reg.data.data.user.id;

  const productsRes = await fetch('http://localhost:5000/api/products?limit=3');
  const productsData = await productsRes.json();
  const products = (productsData.data?.products || productsData.data || []).slice(0, 3);
  for (const p of products) {
    await api('/cart/items', { method: 'POST', token, body: { product_id: p.id, quantity: 1 } });
  }
  const cart = await api('/cart', { token });
  const subtotal = cart.data?.data?.summary?.subtotal || 0;
  console.log(`Cart ready: ${products.length} items, subtotal ₹${subtotal}`);

  // 2. Launch Chrome, seed auth, open /cart
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
      } catch {}
      await sleep(500);
    }
    if (!page) throw new Error('Page target not found');

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

    let msgId = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
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
    await send('Page.enable');
    await send('Page.navigate', { url: FRONTEND_URL + '/login' });
    await sleep(4000);

    // Seed auth + token like the real login flow does
    await evalJs(`(() => {
      localStorage.setItem('accessToken', ${JSON.stringify(token)});
      localStorage.setItem('konkan-auth', JSON.stringify({ state: { accessToken: ${JSON.stringify(token)}, isAuthenticated: true }, version: 0 }));
      return true;
    })()`);

    await send('Page.navigate', { url: FRONTEND_URL + '/cart' });
    await sleep(6000);

    // Wait for items to render
    let itemsReady = false;
    for (let i = 0; i < 20; i++) {
      itemsReady = await evalJs(`document.body.textContent.includes('Shopping Cart') && document.body.textContent.includes('Proceed to Checkout')`);
      if (itemsReady) break;
      await sleep(1000);
    }
    console.log('Cart page ready:', itemsReady);

    // Check "Best Offers For You" section
    const sectionInfo = await evalJs(`(() => {
      const text = document.body.textContent;
      const hasTitle = text.includes('Best Offers For You');
      const applyBtns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Apply');
      const codeEls = [...document.querySelectorAll('.font-mono')].map(e => e.textContent.trim()).filter(t => /^[A-Z0-9]{4,}$/.test(t));
      return { hasTitle, applyCount: applyBtns.length, codes: codeEls };
    })()`);
    console.log('Best offers section:', JSON.stringify(sectionInfo));

    // Click the first ENABLED Apply button (the suggestion card one — the
    // input-row Apply is disabled while the input is empty)
    const clicked = await evalJs(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Apply' && !b.disabled);
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    console.log('Apply clicked:', clicked);
    await sleep(5000);

    const after = await evalJs(`(() => {
      const text = document.body.textContent;
      const hasApplied = text.includes('You saved');
      const appliedCard = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === 'FIRST20' || s.textContent.trim() === 'WELCOME15');
      const couponRemoved = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Remove' && b.className.includes('text-konkan-error'));
      const suggestionsGone = !text.includes('Best Offers For You');
      return { hasApplied, appliedCard: !!appliedCard, couponRemoved: !!couponRemoved, suggestionsGone };
    })()`);
    console.log('After apply:', JSON.stringify(after));

    const checks = [
      ['Best Offers For You section renders', sectionInfo?.hasTitle === true],
      ['At least 1 enabled Apply button', (sectionInfo?.applyCount || 0) >= 1],
      ['Real coupon codes shown', (sectionInfo?.codes || []).length >= 1],
      ['Apply click → coupon applied (You saved shown)', after?.hasApplied === true],
      ['Suggestions section hides after apply', after?.suggestionsGone === true],
    ];
    console.log('\n── Verdicts ──');
    checks.forEach(([name, ok]) => console.log(ok ? '  ✅ ' + name : '  ❌ ' + name));
    console.log('\nRESULT: ' + (checks.every(([, ok]) => ok) ? 'ALL PASS' : 'SOME FAIL'));
    process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
  } finally {
    if (ws) { try { ws.close(); } catch {} }
    chrome.kill();
    try { fs.rmSync(userData, { recursive: true, force: true }); } catch {}
    try {
      if (userId) {
        const pool = require('../config/db');
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        await pool.end();
      }
    } catch {}
  }
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
