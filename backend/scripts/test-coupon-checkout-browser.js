/**
 * Checkout page — "Best Offer For You" suggestion UI test (headless Chrome CDP).
 * Verifies: best offer suggestion shows in the summary sidebar when no coupon
 * is applied, Apply works end-to-end, and the suggestion hides after applying.
 *
 * Prereqs: backend :5000 (new code), frontend :3000 (new build).
 * Run: node backend/scripts/test-coupon-checkout-browser.js
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:5000/api';
const CDP_PORT = 9247;

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
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-cocheck-'));

  const phone = '90000' + String(stamp).slice(-5);
  const reg = await api('/auth/register', {
    method: 'POST',
    body: { name: 'CO Check', email: `co-check-${stamp}@example.com`, phone, password: 'Test@1234' },
  });
  if (reg.status !== 201) throw new Error('register failed: ' + reg.status);
  const token = reg.data.data.accessToken;
  const userId = reg.data.data.user.id;

  const pr = await (await fetch(API_BASE + '/products?limit=2')).json();
  const prods = (pr.data?.products || pr.data || []).slice(0, 2);
  for (const p of prods) {
    await api('/cart/items', { method: 'POST', token, body: { product_id: p.id, quantity: 1 } });
  }
  await api('/users/addresses', {
    method: 'POST', token,
    body: { name: 'Test', phone: '9000000099', house_no: '1', street: 'Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
  });

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
      if (res.result?.exceptionDetails) throw new Error('eval error');
      return res.result?.result?.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: FRONTEND_URL + '/login' });
    await sleep(4000);

    await evalJs(`(() => {
      localStorage.setItem('accessToken', ${JSON.stringify(token)});
      localStorage.setItem('konkan-auth', JSON.stringify({ state: { accessToken: ${JSON.stringify(token)}, isAuthenticated: true }, version: 0 }));
      return true;
    })()`);

    await send('Page.navigate', { url: FRONTEND_URL + '/checkout' });
    await sleep(12000);

    const info = await evalJs(`(() => {
      const text = document.body.textContent;
      return {
        hasOffer: text.includes('Best Offer For You'),
        hasSummary: text.includes('Order Summary'),
        hasSubtotal: text.includes('Subtotal'),
        enabledApply: [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Apply' && !b.disabled).length,
        codes: [...document.querySelectorAll('span')].filter(s => /^[A-Z0-9]{5,10}$/.test(s.textContent.trim())).map(s => s.textContent.trim()).slice(0, 5),
      };
    })()`);
    console.log('Checkout page:', JSON.stringify(info));

    let applied = { offerGone: null, couponShown: null };
    if (info.enabledApply >= 1) {
      await evalJs(`(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Apply' && !b.disabled);
        if (!btn) return false;
        btn.click();
        return true;
      })()`);
      await sleep(6000);
      applied = await evalJs(`(() => {
        const text = document.body.textContent;
        return {
          offerGone: !text.includes('Best Offer For You'),
          couponShown: /Coupon/.test(text) && /-₹[0-9,]+/.test(text),
        };
      })()`);
      console.log('After apply:', JSON.stringify(applied));
    }

    const checks = [
      ['Best Offer For You suggestion renders', info.hasOffer === true],
      ['Order Summary sidebar present', info.hasSummary === true],
      ['Enabled Apply button present', info.enabledApply >= 1],
      ['Real coupon code shown', (info.codes || []).length >= 1],
      ['Apply → coupon applied + suggestion hides', applied.offerGone === true && applied.couponShown === true],
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
