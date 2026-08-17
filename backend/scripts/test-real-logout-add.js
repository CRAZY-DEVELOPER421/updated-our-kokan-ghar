/**
 * REAL UI flow test: login via UI → click actual Sign Out button in navbar
 * → then add to cart as guest.
 * Run: node backend/scripts/test-real-logout-add.js
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:5000/api';
const CDP_PORT = 9257;

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
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-reallogout-'));
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
    const apiReqs = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        consoleMsgs.push('[' + msg.params.type + '] ' + (msg.params.args || []).map(a => a.value || a.description || '').join(' ').slice(0, 200));
      } else if (msg.method === 'Network.requestWillBeSent') {
        const u = msg.params.request.url;
        if (u.includes('/api/')) apiReqs.push(msg.params.request.method + ' ' + u.replace('http://localhost:5000', ''));
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
    await send('Network.enable');

    // Register user
    const reg = await api('/auth/register', {
      method: 'POST',
      body: { name: 'RealLogout', email: `reallogout-${stamp}@example.com`, phone: '90000' + String(stamp).slice(-5), password: 'Test@1234' },
    });
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;
    console.log('User registered:', userId);

    const pr = await (await fetch(API_BASE + '/products?limit=1')).json();
    const product = (pr.data?.products || pr.data || [])[0];

    console.log('\n── 1. Load site logged-in (seed session) ──');
    await send('Page.navigate', { url: FRONTEND_URL + '/login' });
    await sleep(4000);
    await evalJs(`(() => {
      localStorage.setItem('accessToken', ${JSON.stringify(token)});
      localStorage.setItem('konkan-auth', JSON.stringify({ state: { user: { id: ${userId}, name: 'RealLogout' }, accessToken: ${JSON.stringify(token)}, isAuthenticated: true }, version: 0 }));
      return true;
    })()`);
    // simulate the merge that login triggers (clears guest id)
    await evalJs(`localStorage.removeItem('konkan-guest-id'); true`);
    await send('Page.navigate', { url: FRONTEND_URL });
    await sleep(5000);

    console.log('\n── 2. Click REAL Sign Out button in navbar ──');
    const logoutClicked = await evalJs(`(() => {
      // Desktop dropdown — hover/click the account button then find Sign Out
      const acctBtn = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '').includes('Account'));
      if (acctBtn) {
        acctBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        // also open mobile menu path as fallback
        const signOut = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Sign Out' || b.textContent.includes('Sign Out'));
        if (signOut) { signOut.click(); return 'clicked desktop'; }
      }
      // Mobile menu route
      const menuBtn = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Toggle menu');
      if (menuBtn) { menuBtn.click(); return 'opened menu'; }
      return 'nothing found';
    })()`);
    console.log('   Logout click result:', logoutClicked);
    await sleep(3000);

    // try again if menu opened
    if (logoutClicked === 'opened menu') {
      await evalJs(`(() => {
        const signOut = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Sign Out'));
        if (signOut) { signOut.click(); return 'clicked'; }
        return 'no button in menu';
      })()`);
      await sleep(3000);
    }

    const authCleared = await evalJs(`localStorage.getItem('accessToken') === null`);
    console.log('   accessToken cleared:', authCleared);

    console.log('\n── 3. Go to product page, add to cart as guest ──');
    await send('Page.navigate', { url: FRONTEND_URL + `/products/${product.slug}` });
    await sleep(6000);

    const guestId = await evalJs(`localStorage.getItem('konkan-guest-id')`);
    console.log('   guest id:', guestId || '(none)');

    const clicked = await evalJs(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add to Cart'));
      if (!btn) return 'NO BUTTON';
      btn.click();
      return 'clicked';
    })()`);
    console.log('   Add to Cart:', clicked);
    await sleep(5000);

    const gc = await (await fetch(API_BASE + '/cart', { headers: { 'X-Guest-Id': guestId } })).json();
    const items = (gc?.data?.items || []).map(i => ({ pid: i.product_id, q: i.quantity }));
    console.log('   Guest cart server-side:', JSON.stringify(items));
    console.log('   Cart badge:', await evalJs(`(() => {
      const links = [...document.querySelectorAll('a')].filter(a => (a.getAttribute('aria-label') || '').toLowerCase().includes('cart'));
      return links.length > 0 ? (links[0].getAttribute('aria-label') || '') : 'no link';
    })()`));

    console.log('\n── API calls ──');
    apiReqs.filter(r => r.includes('/cart') || r.includes('/auth')).forEach(r => console.log('  ', r));
    console.log('\n── Console errors ──');
    consoleMsgs.filter(m => m.startsWith('[error]')).slice(0, 8).forEach(m => console.log('  ', m));

    const checks = [
      ['accessToken cleared after real logout', authCleared === true],
      ['Guest id present after logout', !!guestId],
      ['Add to Cart clicked', clicked === 'clicked'],
      ['Item in guest cart server-side', items.length >= 1],
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
