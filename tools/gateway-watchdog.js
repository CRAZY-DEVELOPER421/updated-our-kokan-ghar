// ============================================================
// GATEWAY WATCHDOG — auto-restarts ngrok-gateway.js on crash
//
// Usage:
//   node tools/gateway-watchdog.js
//
// Features:
//   - Spawns gateway as child process
//   - Auto-restarts on crash with exponential backoff
//   - Max 10 restarts within 60s window (then cooldown)
//   - Graceful shutdown on SIGINT / SIGTERM
//   - Color-coded console output
// ============================================================

const { spawn } = require('child_process');
const path = require('path');

const GATEWAY = path.join(__dirname, 'ngrok-gateway.js');
const MAX_RESTARTS = 10;
const WINDOW_MS = 60_000;      // 1 minute window
const COOLDOWN_MS = 5_000;     // 5s initial cooldown
const MAX_BACKOFF_MS = 30_000; // cap backoff at 30s

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

let restarts = [];
let shuttingDown = false;
let child = null;

function log(color, tag, msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`${DIM}${ts}${RESET} ${color}${tag}${RESET} ${msg}`);
}

function backoff(attempts) {
  const ms = Math.min(COOLDOWN_MS * Math.pow(2, attempts - 1), MAX_BACKOFF_MS);
  return ms;
}

function prune(timestamps) {
  const cutoff = Date.now() - WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

function spawnGateway() {
  if (shuttingDown) return;

  child = spawn(process.execPath, [GATEWAY], {
    stdio: 'inherit',
    cwd: path.dirname(GATEWAY),
  });

  log(GREEN, '[watchdog]', `Gateway started (pid ${child.pid})`);

  child.on('error', (err) => {
    log(RED, '[watchdog]', `Spawn error: ${err.message}`);
    scheduleRestart();
  });

  child.on('exit', (code, signal) => {
    child = null;
    if (shuttingDown) return;

    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      log(YELLOW, '[watchdog]', `Gateway killed by signal: ${signal}`);
      return;
    }

    log(RED, '[watchdog]', `Gateway exited with code ${code}`);
    scheduleRestart();
  });
}

function scheduleRestart() {
  if (shuttingDown) return;

  restarts = prune(restarts);
  const count = restarts.length;

  if (count >= MAX_RESTARTS) {
    log(RED, '[watchdog]',
      `${MAX_RESTARTS} restarts in ${WINDOW_MS / 1000}s — entering cooldown (${WINDOW_MS / 1000}s)...`);
    restarts = [];
    setTimeout(() => {
      if (!shuttingDown) spawnGateway();
    }, WINDOW_MS);
    return;
  }

  const delay = backoff(count + 1);
  log(YELLOW, '[watchdog]', `Restarting in ${delay / 1000}s (attempt ${count + 1}/${MAX_RESTARTS})...`);

  restarts.push(Date.now());
  setTimeout(() => {
    if (!shuttingDown) spawnGateway();
  }, delay);
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  log(YELLOW, '[watchdog]', 'Shutting down...');
  if (child) {
    child.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

log(CYAN, '[watchdog]', `Watching: ${GATEWAY}`);
log(CYAN, '[watchdog]', `Limits: ${MAX_RESTARTS} restarts / ${WINDOW_MS / 1000}s window`);

spawnGateway();
