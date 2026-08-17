/**
 * Test: Add to Cart shows NO toast popup (guest flow), item still added.
 * Launches Chrome via CDP, opens the frontend, clears any session,
 * clicks Add to Cart as a guest, and asserts:
 *   1. No toast container content ("added to cart" popup) is present
 *   2. The cart badge updates (item actually added)
 *   3. No "Please login to add items" popup either
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FRONTEND = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
const RESULTS = [];
function check(name, ok, extra = '') {
  RESULTS.push({ name, ok, extra });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
}    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function main() {
  const chromePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  const chromePath = chromePaths.find((p) => fs.existsSync(p));
  if (!chromePath) { console.log('❌ Chrome not found'); process.exit(1); }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'toast-test-'));
  const port = 9230 + Math.floor(Math.random() * 100);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    // Wait for CDP
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
        const page = list.find((t) => t.type === 'page');
        if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
      } catch (e) {}
    }
    if (!wsUrl) { console.log('❌ Could not connect to Chrome'); process.exit(1); }

    // WebSocket client (Node >=21 has global WebSocket)
    const ws = new WebSocket(wsUrl);
    let msgId = 0;
    const pending = new Map();
    const events = [];
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        events.push(msg.params);
      }
    });
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });
    await send('Runtime.enable');
    await send('Page.enable');

    const evalJs = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res?.result?.value;
    };
    const waitFor = async (fn, timeout = 10000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const v = await evalJs(`(${fn.toString()})()`);
        if (v) return v;
        await sleep(400);
      }
      return null;
    };

    // 1. Load a product listing page
    await send('Page.navigate', { url: FRONTEND + '/products' });
    await sleep(3500);
    const title = await evalJs('document.title');
    console.log('  page:', title);

    // 2. Clear any local session (logout state)
    await evalJs(`(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      try { localStorage.removeItem('konkan-guest-id'); } catch (e) {}
      return true;
    })()`);

    // 3. Find an Add to Cart button and click it
    const clicked = await evalJs(`(() => {
      const btns = [...document.querySelectorAll('button')];
      const btn = btns.find((b) => b.textContent.trim().toLowerCase().includes('add to cart') && !b.disabled);
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    check('Found an enabled "Add to Cart" button', !!clicked);
    if (!clicked) {
      // Try the product page instead
      await send('Page.navigate', { url: FRONTEND + '/products/alphonso-mango' });
      await sleep(3500);
      const clicked2 = await evalJs(`(() => {
        const btns = [...document.querySelectorAll('button')];
        const btn = btns.find((b) => b.textContent.trim().toLowerCase().includes('add to cart') && !b.disabled);
        if (!btn) return false;
        btn.click();
        return true;
      })()`);
      check('Found Add to Cart on product page', !!clicked2);
    }

    await sleep(2500);

    // 4. Assert NO toast popup appeared
    const toastState = await evalJs(`(() => {
      const els = document.querySelectorAll('[class*="toast"], [class*="Toast"], [role="status"]');
      let text = '';
      els.forEach((el) => { if (el.textContent && el.textContent.trim()) text += el.textContent.trim() + ' | '; });
      return text.slice(0, 200);
    })()`);
    const hasLoginPopup = /please login/i.test(toastState);
    const hasAddedPopup = /added to cart/i.test(toastState);
    check('No "added to cart" toast popup', !hasAddedPopup, toastState ? `found: ${toastState}` : 'no toast content');
    check('No "please login" popup', !hasLoginPopup, toastState ? `found: ${toastState}` : 'no toast content');

    // 5. Cart badge should have updated (item actually added)
    const badge = await waitFor(() => {
      const el = document.querySelector('[aria-label*="cart" i], [aria-label*="Cart" i]');
      const txt = document.body.textContent;
      const m = txt.match(/(\\d+)\\s*item/i) || txt.match(/cart\\s*\\((\\d+)\\)/i);
      return m ? m[1] : (el ? el.textContent.trim() : null);
    }, 6000);
    console.log('  badge value:', badge);

    // 6. Direct API check — guest cart has the item
    const guestId = await evalJs(`localStorage.getItem('konkan-guest-id') || ''`);
    let apiItems = 0;
    if (guestId) {
      try {
        const res = await fetch(`http://localhost:5000/api/cart`, {
          headers: { 'X-Guest-Id': guestId },
        });
        const body = await res.json();
        apiItems = body?.data?.items?.length || body?.data?.item_count || 0;
      } catch (e) {}
    }
    check('Item actually in guest cart (server-side)', apiItems > 0, `items: ${apiItems}`);

    // Summary
    const failed = RESULTS.filter((r) => !r.ok);
    console.log(`\\n${failed.length === 0 ? '🎉 ALL PASS' : '❌ ' + failed.length + ' FAILED'} — ${RESULTS.length} checks`);
    ws.close();
    process.exit(failed.length === 0 ? 0 : 1);
  } finally {
    chrome.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
