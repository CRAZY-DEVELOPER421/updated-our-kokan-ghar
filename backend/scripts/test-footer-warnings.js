/**
 * Verify the Next.js browser warnings are gone: Image dimension warnings
 * (mastercard/rupay/footer) and scroll-behavior smooth warning.
 *
 * Run: node backend/scripts/test-footer-warnings.js  (frontend :3000)
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONTEND_URL = 'http://localhost:3000';
const CDP_PORT = 9254;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-warn-'));
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
    const warnings = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        if (type === 'warning' && (
          text.includes('Image with src') ||
          text.includes('scroll-behavior')
        )) {
          warnings.push(text.slice(0, 160));
        }
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
    await send('Page.navigate', { url: FRONTEND_URL });
    await sleep(10000);

    // Also check the html data attribute
    const attr = await evalJs(`document.documentElement.getAttribute('data-scroll-behavior')`);

    const imageWarnings = warnings.filter((w) => w.includes('Image with src'));
    const scrollWarnings = warnings.filter((w) => w.includes('scroll-behavior'));
    console.log('Image warnings:', imageWarnings.length);
    imageWarnings.forEach((w) => console.log('  ⚠️', w));
    console.log('Scroll-behavior warnings:', scrollWarnings.length);
    console.log('html[data-scroll-behavior]:', attr);

    const checks = [
      ['No Image dimension warnings', imageWarnings.length === 0],
      ['No scroll-behavior smooth warning', scrollWarnings.length === 0],
      ['data-scroll-behavior="smooth" on <html>', attr === 'smooth'],
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
