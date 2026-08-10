// ============================================================
// NGROK GATEWAY — one port, three apps
// Lets a SINGLE ngrok tunnel (free plan = 1 tunnel) expose the
// whole Konkan Bazaar stack:
//
//   /admin/*                  -> admin panel   (Next.js, :3001, basePath /admin)
//   /api/* /uploads/* /images/* /api-docs*  -> backend API (Express, :5000)
//   everything else           -> storefront    (Next.js, :3000)
//
// Zero dependencies — plain Node http. Run:
//   node tools/ngrok-gateway.js
// Then tunnel to it:
//   ngrok http 8080
//
// Optional shared-password protection (recommended when the URL is public):
//   GATEWAY_USER=kokan GATEWAY_PASS='your-shared-password' node tools/ngrok-gateway.js
// When GATEWAY_PASS is set, every request must present HTTP Basic auth
// credentials (browsers prompt once, then remember them for the session).
// Requests already carrying an app-issued `Authorization: Bearer` token
// (created after login) pass through — the backend validates those. This gate
// deters casual visitors without breaking logged-in sessions, but it is NOT a
// security boundary: anyone with the URL can send a dummy Bearer header.
// ============================================================
const crypto = require('crypto');
const http = require('http');

const PORT = parseInt(process.env.GATEWAY_PORT || '8080', 10);
const TARGETS = {
  frontend: process.env.FRONTEND_TARGET || 'http://localhost:3000',
  admin: process.env.ADMIN_TARGET || 'http://localhost:3001',
  backend: process.env.BACKEND_TARGET || 'http://localhost:5000',
};

// ---- Optional shared-password (HTTP Basic) protection ----
// Enabled by setting GATEWAY_PASS. GATEWAY_USER defaults to 'kokan'.
const AUTH_USER = (process.env.GATEWAY_USER || 'kokan').trim();
const AUTH_PASS = (process.env.GATEWAY_PASS || '').trim();
const AUTH_ENABLED = AUTH_PASS.length > 0;
const AUTH_REALM = 'Konkan Bazaar Gateway';

// Constant-time comparison so credential checks don't leak timing info.
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Returns 'basic' (valid shared password), 'bearer' (app-signed JWT — the
// backend validates it), or null (rejected).
function authStatus(req) {
  const header = req.headers.authorization || '';
  if (/^bearer\s/i.test(header)) return 'bearer';
  if (!/^basic\s/i.test(header)) return null;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  if (sep === -1) return null;
  const ok =
    safeEqual(decoded.slice(0, sep), AUTH_USER) &&
    safeEqual(decoded.slice(sep + 1), AUTH_PASS);
  return ok ? 'basic' : null;
}

function rejectUnauthorized(res) {
  res.writeHead(401, {
    'WWW-Authenticate': `Basic realm="${AUTH_REALM}"`,
    'Content-Type': 'text/plain',
  });
  res.end('401 Unauthorized — this tunnel is password protected.');
}

const isAdmin = (p) => p === '/admin' || p.startsWith('/admin/');
const isBackend = (p) =>
  p === '/api' || p.startsWith('/api/') ||
  p.startsWith('/api-docs') ||
  p.startsWith('/uploads/') || p.startsWith('/images/');

// Headers that must never be forwarded between hops (RFC 7230 §6.1)
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
]);

function routeFor(pathname) {
  if (isAdmin(pathname)) return TARGETS.admin;
  if (isBackend(pathname)) return TARGETS.backend;
  return TARGETS.frontend;
}

const server = http.createServer((req, res) => {
  const gate = AUTH_ENABLED ? authStatus(req) : 'basic';
  if (AUTH_ENABLED && !gate) {
    rejectUnauthorized(res);
    return;
  }
  const target = routeFor(req.url.split('?')[0]);
  const targetUrl = new URL(target);
  const logLine = `[gateway] ${req.method} ${req.url} -> ${targetUrl.host}`;

  const forwardHeaders = { ...req.headers, host: targetUrl.host };
  // Never hand the gateway's shared password to the upstream apps.
  if (gate === 'basic') delete forwardHeaders.authorization;
  // Strip spoofable X-Forwarded-* headers: ngrok sets them, and the backend's
  // express-rate-limit rejects unexpected values (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
  for (const h of ['x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'x-forwarded-port', 'x-forwarded-server']) {
    delete forwardHeaders[h];
  }

  const proxyReq = http.request(
    {
      host: targetUrl.hostname,
      port: targetUrl.port || 80,
      method: req.method,
      path: req.url,
      headers: forwardHeaders,
    },
    (proxyRes) => {
      // Redirects issued by local apps may contain absolute URLs pointing at
      // localhost — rewrite them to be relative so they stay on the tunnel host.
      const loc = proxyRes.headers.location;
      if (loc && /https?:\/\/localhost:\d+/.test(loc)) {
        proxyRes.headers.location = loc.replace(/https?:\/\/localhost:\d+/g, '');
      }
      // Strip hop-by-hop headers; Node re-chunks the response as needed.
      const headers = { ...proxyRes.headers };
      for (const h of HOP_BY_HOP) delete headers[h];
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`${logLine} FAILED: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('502 Bad Gateway — local target is not running');
    } else {
      res.destroy();
    }
  });

  req.pipe(proxyReq);
  console.log(logLine);
});

// Bind to loopback only: ngrok connects via localhost, and this keeps the
// whole stack off the local network (LAN users cannot reach it directly).
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[gateway] listening on http://127.0.0.1:${PORT}`);
  console.log(`[gateway] /admin*            -> ${TARGETS.admin}`);
  console.log(`[gateway] /api* /uploads* /images* /api-docs* -> ${TARGETS.backend}`);
  console.log(`[gateway] everything else    -> ${TARGETS.frontend}`);
  console.log(AUTH_ENABLED
    ? `[gateway] basic auth: ENABLED (user: ${AUTH_USER})`
    : '[gateway] basic auth: DISABLED (set GATEWAY_PASS to protect the tunnel)');
});
