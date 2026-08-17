/**
 * EXACT real-world flow: 
 *   1. guest adds item (guest id created)
 *   2. login via UI (authStore.login → mergeGuestCart → clearGuestId)
 *   3. logout via UI (authStore.logout → resetCart + auth:logout event)
 *   4. guest adds item AGAIN
 * Run: node backend/scripts/test-logout-guest-add2.js
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:5000/api';
const CDP_PORT = 9256;

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
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-logout2-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userData}`,
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' });

  let ws;
  let userId = null;
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
      if (res.result?.exceptionDetails) return 'EXC: ' + JSON.stringify(res.result.exceptionDetails).slice(0, 250);
      return res.result?.result?.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');

    // Register a user
    const reg = await api('/auth/register', {
      method: 'POST',
      body: { name: 'Logout2', email: `logout2-${stamp}@example.com`, phone: '90000' + String(stamp).slice(-5), password: 'Test@1234' },
    });
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;
    console.log('User registered, id:', userId);

    // ── STEP 1: fresh guest adds an item ──
    const pr = await (await fetch(API_BASE + '/products?limit=1')).json();
    const product = (pr.data?.products || pr.data || [])[0];
    await send('Page.navigate', { url: FRONTEND_URL + `/products/${product.slug}` });
    await sleep(6000);

    let guestId1 = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    console.log('\nStep 1 — fresh guest id:', guestId1 || '(none)');

    await evalJs(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add to Cart'));
      if (btn) btn.click();
      return !!btn;
    })()`);
    await sleep(4000);
    guestId1 = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    const cartAfterAdd1 = await (await fetch(API_BASE + '/cart', { headers: { 'X-Guest-Id': guestId1 } })).json();
    console.log('   Guest cart items:', (cartAfterAdd1?.data?.items || []).length, '| badge guest id:', guestId1);

    // ── STEP 2: LOGIN exactly like authStore.login does ──
    console.log('\nStep 2 — LOGIN (authStore.login → mergeGuestCart → clearGuestId)');
    await evalJs(`(() => {
      localStorage.setItem('accessToken', ${JSON.stringify(token)});
      localStorage.setItem('konkan-auth', JSON.stringify({ state: { user: { id: ${userId} }, accessToken: ${JSON.stringify(token)}, isAuthenticated: true }, version: 0 }));
      return true;
    })()`);
    // simulate authStore login's merge (as the real login would do):
    const mergeRes = await fetch(API_BASE + '/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'X-Guest-Id': guestId1 },
    });
    const mergeData = await mergeRes.json();
    console.log('   merge status:', mergeRes.status, 'merged:', mergeData?.data?.merged);
    // clearGuestId — exactly what mergeGuestCart does on success
    await evalJs(`localStorage.removeItem('konkan-guest-id'); true`);
    const guestIdAfterLogin = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    console.log('   guest id after login+merge (should be null):', guestIdAfterLogin || '(cleared)');

    // ── STEP 3: LOGOUT exactly like authStore.logout does ──
    console.log('\nStep 3 — LOGOUT (authStore.logout → resetCart + auth:logout)');
    await evalJs(`(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('konkan-auth');
      window.dispatchEvent(new Event('auth:logout'));
      return true;
    })()`);
    await sleep(2000);

    // ── STEP 4: guest adds item AGAIN ──
    console.log('\nStep 4 — guest adds item AGAIN after logout');
    await send('Page.navigate', { url: FRONTEND_URL + `/products/${product.slug}` });
    await sleep(6000);

    const guestId2 = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    console.log('   guest id regenerated:', guestId2 || '(NONE — BUG!)');

    const clicked = await evalJs(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add to Cart'));
      if (!btn) return 'NO BUTTON';
      btn.click();
      return 'clicked';
    })()`);
    console.log('   Add to Cart:', clicked);
    await sleep(5000);

    // Check server-side guest cart
    const guestIdNow = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    let serverItems = [];
    let serverStatus = 'n/a';
    if (guestIdNow) {
      const gc = await fetch(API_BASE + '/cart', { headers: { 'X-Guest-Id': guestIdNow } });
      const gcData = await gc.json();
      serverStatus = gc.status;
      serverItems = (gcData?.data?.items || []).map(i => ({ pid: i.product_id, q: i.quantity }));
    }
    console.log('   Server guest cart:', JSON.stringify(serverItems), 'status:', serverStatus);

    // Navbar badge
    const badge = await evalJs(`(() => {
      const links = [...document.querySelectorAll('a')].filter(a => (a.getAttribute('aria-label') || '').toLowerCase().includes('cart'));
      return links.length > 0 ? (links[0].getAttribute('aria-label') || '') : 'no cart link';
    })()`);
    console.log('   Cart badge:', badge);

    const checks = [
      ['Guest id regenerated after login→logout', !!guestId2],
      ['Add to Cart clickable after logout', clicked === 'clicked'],
      ['Item in guest cart server-side', serverItems.length >= 1],
      ['Cart badge shows item count', /\(1/.test(badge) || /\([2-9]/.test(badge)],
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
        await pool.query('DELETE FROM users WHERE id = ?', [userId]).catch(() => {});
        await pool.end();
      }
    } catch {}
  }
}

main().catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
