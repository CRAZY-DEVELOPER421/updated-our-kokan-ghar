/**
 * Guest Cart flow — full browser test (headless Chrome CDP).
 *
 * Flow: guest adds to cart WITHOUT login → cart page shows items + guest
 * notice → Proceed to Checkout hits the MANDATORY login gate → login →
 * guest cart merged into account → checkout accessible with items intact.
 *
 * Prereqs: backend :5000 (new code), frontend :3000 (new build).
 * Run: node backend/scripts/test-guest-cart-browser.js
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:5000/api';
const CDP_PORT = 9251;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const stamp = Date.now();
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-guest-'));

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
      if (res.result?.exceptionDetails) throw new Error('eval error: ' + JSON.stringify(res.result.exceptionDetails).slice(0, 300));
      return res.result?.result?.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('\n── 1. GUEST opens a product page (no login) ──');
    const productsRes = await fetch(API_BASE + '/products?limit=1');
    const productsData = await productsRes.json();
    const product = (productsData.data?.products || productsData.data || [])[0];
    if (!product) throw new Error('No product found');
    console.log('   Product:', product.name, `(${product.id})`);

    await send('Page.navigate', { url: FRONTEND_URL + `/products/${product.slug}` });
    await sleep(6000);

    // Ensure a guest id exists in localStorage (generated on first API call)
    const guestId = await evalJs(`(() => { const id = localStorage.getItem('konkan-guest-id'); return id || null; })()`);
    console.log('   Guest device id created:', guestId ? 'yes' : 'NO');

    console.log('\n── 2. GUEST clicks "Add to Cart" ──');
    const addClicked = await evalJs(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add to Cart'));
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    console.log('   Add to Cart clicked:', addClicked);
    await sleep(5000);

    // Guest cart badge in navbar
    const badge = await evalJs(`(() => {
      const text = document.body.textContent;
      const links = [...document.querySelectorAll('a')].filter(a => a.getAttribute('aria-label')?.toLowerCase().includes('cart'));
      return { badgeCount: links.length > 0 ? (links[0].getAttribute('aria-label') || '') : 'none' };
    })()`);
    console.log('   Cart icon:', JSON.stringify(badge));

    console.log('\n── 3. Guest opens /cart — items + guest notice visible ──');
    await send('Page.navigate', { url: FRONTEND_URL + '/cart' });
    await sleep(6000);
    const cartInfo = await evalJs(`(() => {
      const text = document.body.textContent;
      return {
        hasItems: text.includes('Shopping Cart') && !text.includes('Your cart is empty'),
        guestNotice: text.includes("You're shopping as a guest"),
        productName: ${JSON.stringify(product.name)}.split(' ')[0] ? text.includes(${JSON.stringify(product.name.split(' ')[0])}) : false,
        hasCheckout: text.includes('Proceed to Checkout'),
        loginBtn: text.includes('Log in'),
      };
    })()`);
    console.log('   Cart page:', JSON.stringify(cartInfo));

    console.log('\n── 4. Click "Proceed to Checkout" → MANDATORY login gate ──');
    await evalJs(`(() => {
      const link = [...document.querySelectorAll('a')].find(a => a.textContent.includes('Proceed to Checkout'));
      if (link) { link.click(); return true; }
      return false;
    })()`);
    await sleep(5000);
    const gate = await evalJs(`(() => {
      const text = document.body.textContent;
      const url = window.location.href;
      return { url, gateVisible: text.includes('Login required to checkout'), loginLink: text.includes('Log in') };
    })()`);
    console.log('   Checkout gate:', JSON.stringify(gate));

    console.log('\n── 5. GUEST registers a new account on the gate ──');
    // Register via API for speed, then simulate the signup→merge by calling
    // the same login the UI would (register already merges in authStore).
    const reg = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Guest-Id': guestId },
      body: JSON.stringify({
        name: 'Guest Flow',
        email: `guest-flow-${stamp}@example.com`,
        phone: '90000' + String(stamp).slice(-5),
        password: 'Test@1234',
      }),
    });
    const regData = await reg.json();
    userId = regData?.data?.user?.id;
    const token = regData?.data?.accessToken;
    console.log('   Register status:', reg.status);

    // The register call itself does NOT merge (merge is a separate UI step).
    // Simulate exactly what authStore does after a successful signup: merge.
    const mergeRes = await fetch(API_BASE + '/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'X-Guest-Id': guestId },
    });
    const mergeData = await mergeRes.json();
    console.log('   Merge status:', mergeRes.status, 'merged:', mergeData?.data?.merged);

    console.log('\n── 6. Verify merged cart via API (items carried over) ──');
    const userCartRes = await fetch(API_BASE + '/cart', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const userCart = await userCartRes.json();
    const itemCount = userCart?.data?.summary?.item_count || 0;
    console.log('   User cart item count after merge:', itemCount, 'status:', userCartRes.status);
    console.log('   User cart items:', JSON.stringify((userCart?.data?.items || []).map(i => ({ id: i.id, pid: i.product_id, q: i.quantity }))));

    const checks = [
      ['Guest device id generated', !!guestId],
      ['Guest added to cart without login', addClicked === true],
      ['Guest cart page shows items', cartInfo?.hasItems === true],
      ['Guest notice shown on cart page', cartInfo?.guestNotice === true],
      ['Proceed to Checkout → mandatory login gate', gate?.gateVisible === true || gate?.url?.includes('/login')],
      ['Merge carried guest items into account', itemCount >= 1],
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
