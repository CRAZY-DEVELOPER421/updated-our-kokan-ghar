// ============================================================
// NGROK GATEWAY — single tunnel, three apps
//
// Routes a SINGLE ngrok tunnel (free plan = 1 tunnel) to the
// whole Konkan Bazaar stack:
//
//   /admin/*                  -> admin panel   (Next.js :3001)
//   /api/* /uploads/* /api-docs*  -> backend (Express :5000)
//   everything else           -> storefront    (Next.js :3000)
//
// Zero external dependencies — plain Node http module.
//
// Usage:
//   node tools/ngrok-gateway.js
//
// Then in another terminal:
//   ngrok http 8080
//
// Environment variables (all optional, have sensible defaults):
//   GATEWAY_PORT        - port to listen on (default 8080)
//   FRONTEND_TARGET     - frontend URL (default http://localhost:3000)
//   ADMIN_TARGET        - admin panel URL (default http://localhost:3001)
//   BACKEND_TARGET      - backend API URL (default http://localhost:5000)
//   PROXY_TIMEOUT_MS    - upstream timeout in ms (default 30000)
// ============================================================

const http = require('http');

const PORT = parseInt(process.env.GATEWAY_PORT || '8080', 10);
const PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT_MS || '30000', 10);
const TARGETS = {
  frontend: process.env.FRONTEND_TARGET || 'http://localhost:3000',
  admin: process.env.ADMIN_TARGET || 'http://localhost:3001',
  backend: process.env.BACKEND_TARGET || 'http://localhost:5000',
};

// ---- Path-based routing ----
const isAdmin = (p) => p === '/admin' || p.startsWith('/admin/');
const isBackend = (p) =>
  p === '/api' || p.startsWith('/api/') ||
  p.startsWith('/api-docs') || p.startsWith('/uploads/');

function routeFor(pathname) {
  if (isAdmin(pathname)) return TARGETS.admin;
  if (isBackend(pathname)) return TARGETS.backend;
  return TARGETS.frontend;
}

// ---- Hop-by-hop headers to strip (RFC 7230 §6.1) ----
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate',
  'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade',
]);

// ---- Headers to remove from forwarded requests (prevent spoofing) ----
const STRIP_REQ = [
  'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host',
  'x-forwarded-port', 'x-forwarded-server',
];

const server = http.createServer((req, res) => {
  const target = routeFor(req.url.split('?')[0]);
  const targetUrl = new URL(target);
  const logLine = `[gateway] ${req.method} ${req.url} -> ${targetUrl.host}`;

  // Build forwarded headers — strip hop-by-hop from requests too
  const forwardHeaders = { ...req.headers, host: targetUrl.host };
  for (const h of STRIP_REQ) delete forwardHeaders[h];
  for (const h of HOP_BY_HOP) delete forwardHeaders[h];

  const proxyReq = http.request(
    {
      host: targetUrl.hostname,
      port: targetUrl.port || 80,
      method: req.method,
      path: req.url,
      headers: forwardHeaders,
      timeout: PROXY_TIMEOUT,
    },
    (proxyRes) => {
      // Rewrite absolute localhost redirects to relative paths so the browser
      // stays on the ngrok domain instead of bouncing to localhost.
      const loc = proxyRes.headers.location;
      if (loc && /https?:\/\/localhost:\d+/.test(loc)) {
        proxyRes.headers.location = loc.replace(/https?:\/\/localhost:\d+/g, '');
      }

      // Rewrite Set-Cookie domain attributes that point to localhost
      // so the cookie is set on the ngrok domain instead.
      const setCookie = proxyRes.headers['set-cookie'];
      if (Array.isArray(setCookie)) {
        proxyRes.headers['set-cookie'] = setCookie.map((c) =>
          c.replace(/domain=localhost;?/gi, '')
            .replace(/secure;\s*/gi, '')    // ngrok terminates TLS, backend sees HTTP
            .replace(/;\s*secure$/gi, '')
        );
      }

      // Strip hop-by-hop headers from response
      const headers = { ...proxyRes.headers };
      for (const h of HOP_BY_HOP) delete headers[h];

      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    }
  );

  // Timeout handler — if upstream doesn't respond in time, abort
  proxyReq.on('timeout', () => {
    console.error(`${logLine} TIMEOUT after ${PROXY_TIMEOUT}ms`);
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'text/plain' });
      res.end('504 Gateway Timeout');
    } else {
      res.destroy();
    }
  });

  proxyReq.on('error', (err) => {
    console.error(`${logLine} FAILED: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`502 Bad Gateway — ${targetUrl.host} is not running`);
    } else {
      res.destroy();
    }
  });

  // If the client aborts mid-request, cancel the upstream request.
  // NOTE: req 'close' fires when the request body is consumed (not on
  // client disconnect), so we must NOT destroy proxyReq there — it
  // would kill the connection before the response arrives.
  req.on('aborted', () => {
    if (!proxyReq.destroyed) {
      proxyReq.destroy();
    }
  });

  req.pipe(proxyReq);
  console.log(logLine);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────────┐');
  console.log('  │           Konkan Bazaar — Ngrok Gateway           │');
  console.log('  ├──────────────────────────────────────────────────┤');
  console.log(`  │  Gateway    http://127.0.0.1:${PORT}                │`);
  console.log(`  │  Storefront -> ${TARGETS.frontend}          │`);
  console.log(`  │  Admin      -> ${TARGETS.admin}             │`);
  console.log(`  │  Backend    -> ${TARGETS.backend}             │`);
  console.log(`  │  Timeout    ${PROXY_TIMEOUT}ms                      │`);
  console.log('  ├──────────────────────────────────────────────────┤');
  console.log('  │  Now start ngrok:  ngrok http 8080               │');
  console.log('  └──────────────────────────────────────────────────┘');
  console.log('');
});
