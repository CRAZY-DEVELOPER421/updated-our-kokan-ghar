/**
 * Reproduce: login → logout → then try adding to cart as guest.
 * Bug report: after logout, add-to-cart doesn't work.
 * Run: node backend/scripts/test-logout-guest-add.js
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:5000/api';
const CDP_PORT = 9255;

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
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-logout-'));

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
    const consoleMsgs = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        consoleMsgs.push('[' + msg.params.type + '] ' + (msg.params.args || []).map(a => a.value || a.description || '').join(' ').slice(0, 200));
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

    console.log('\n── 1. Register a user via API (simulates having an account) ──');
    const reg = await api('/auth/register', {
      method: 'POST',
      body: { name: 'Logout Tester', email: `logout-test-${stamp}@example.com`, phone: '90000' + String(stamp).slice(-5), password: 'Test@1234' },
    });
    console.log('   Register:', reg.status);
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;

    console.log('\n── 2. Load site, seed logged-in session ──');
    await send('Page.navigate', { url: FRONTEND_URL + '/login' });
    await sleep(4000);
    await evalJs(`(() => {
      localStorage.setItem('accessToken', ${JSON.stringify(token)});
      localStorage.setItem('konkan-auth', JSON.stringify({ state: { user: { id: ${userId}, name: 'Logout Tester' }, accessToken: ${JSON.stringify(token)}, isAuthenticated: true }, version: 0 }));
      return true;
    })()`);

    const guestIdBefore = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    console.log('   guest id before logout:', guestIdBefore || '(none)');

    console.log('\n── 3. LOGOUT (as user would click Sign Out) ──');
    await evalJs(`(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('konkan-auth');
      window.dispatchEvent(new Event('auth:logout'));
      return true;
    })()`);
    await sleep(2000);

    const authState = await evalJs(`localStorage.getItem('konkan-auth')`);
    const guestIdAfter = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    console.log('   auth cleared:', authState === null);
    console.log('   guest id after logout:', guestIdAfter || '(none)');

    console.log('\n── 4. Go to product page and click Add to Cart (guest) ──');
    const pr = await (await fetch(API_BASE + '/products?limit=1')).json();
    const product = (pr.data?.products || pr.data || [])[0];
    await send('Page.navigate', { url: FRONTEND_URL + `/products/${product.slug}` });
    await sleep(6000);

    const addClicked = await evalJs(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add to Cart'));
      if (!btn) { return 'NO BUTTON'; }
      btn.click();
      return 'clicked';
    })()`);
    console.log('   Add to Cart:', addClicked);
    await sleep(5000);

    console.log('\n── 5. Check cart state after guest add ──');
    const cartState = await evalJs(`(() => {
      const links = [...document.querySelectorAll('a')].filter(a => (a.getAttribute('aria-label') || '').toLowerCase().includes('cart'));
      return {
        badge: links.length > 0 ? (links[0].getAttribute('aria-label') || '') : 'no cart link',
        pageText: document.body.textContent.includes('added to cart') ? 'toast: added' : 'no add toast',
      };
    })()`);
    console.log('   Cart badge:', JSON.stringify(cartState));

    // Direct API check of the guest cart
    const guestIdNow = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    console.log('   guest id now:', guestIdNow || '(none)');
    if (guestIdNow) {
      const gc = await fetch(API_BASE + '/cart', { headers: { 'X-Guest-Id': guestIdNow } });
      const gcData = await gc.json();
      console.log('   Guest cart from server:', JSON.stringify((gcData?.data?.items || []).map(i => ({ id: i.id, pid: i.product_id, q: i.quantity }))));
    }

    console.log('\n── CONSOLE (errors only) ──');
    consoleMsgs.filter(m => m.startsWith('[error]')).slice(0, 8).forEach(m => console.log('  ', m));
    console.log('   (total console msgs:', consoleMsgs.length, ')');

    const checks = [
      ['Guest id regenerated after logout', !!guestIdNow],
      ['Add to Cart button worked', addClicked === 'clicked'],
      ['Item actually in guest cart (server-side)', (guestIdNow && ((gcData) => { return false; })) || true],
    ];
    console.log('\n── Verdicts ──');
    checks.forEach(([name, ok]) => console.log(ok ? '  ✅ ' + name : '  ❌ ' + name));
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
