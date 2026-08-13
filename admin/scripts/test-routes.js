/**
 * Admin Route Tester
 * Visits every admin route and reports HTTP status codes.
 *
 * Usage:
 *   node scripts/test-routes.js
 *
 * Requires the admin dev server to be running on http://localhost:3001
 */

const BASE_URL = 'http://localhost:3001';

const ROUTES = [
  { path: '/',            label: 'Dashboard' },
  { path: '/login',       label: 'Login Page' },
  { path: '/analytics',   label: 'Analytics' },
  { path: '/products',    label: 'Products' },
  { path: '/categories',  label: 'Categories' },
  { path: '/orders',      label: 'Orders' },
  { path: '/users',       label: 'Users' },
  { path: '/coupons',     label: 'Coupons' },
  { path: '/blogs',       label: 'Blogs' },
  { path: '/blogs/create', label: 'Blog Create' },
  { path: '/team',        label: 'Team' },
  { path: '/videos',      label: 'Videos' },
];

const DYNAMIC_ROUTES = [
  { path: path => `/products/${path}`, label: 'Product Detail (ID: 1)', id: '1' },
  { path: path => `/orders/${path}`,   label: 'Order Detail (ID: 1)',   id: '1' },
  { path: path => `/blogs/${path}`,     label: 'Blog Edit (ID: 1)',     id: '1' },
];

const ACCEPTABLE_STATUSES = [200, 307, 308, 302];

class RouteTestReporter {
  constructor() { this.results = []; }

  addResult(route, status, ok) {
    this.results.push({ route, status, ok });
  }

  print() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           Admin Route Status Report                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`  Base URL: ${BASE_URL}\n`);

    let passed = 0, failed = 0;

    for (const r of this.results) {
      const statusStr = String(r.status).padEnd(4);
      console.log(`  ${r.route.label.padEnd(28)} ${statusStr} ${r.ok ? 'OK' : 'FAIL'}`);
      if (r.ok) passed++;
      else failed++;
    }

    console.log('');
    console.log(`  ───────────────────────────────────────────`);
    console.log(`  Total: ${this.results.length}  |  Passed: ${passed}  |  Failed: ${failed}`);
    console.log('');

    if (failed === 0) {
      console.log('  All routes responded successfully!');
    } else {
      console.log(`  ${failed} route(s) had issues. Review above.`);
    }
    console.log('');

    process.exit(failed > 0 ? 1 : 0);
  }
}

async function checkRoute(url, reporter, routeInfo) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'Admin-Route-Tester/1.0' },
    });

    clearTimeout(timeout);

    const status = response.status;
    const ok = ACCEPTABLE_STATUSES.includes(status);

    // If redirected, follow and check final destination
    if (status === 307 || status === 302 || status === 308) {
      const location = response.headers.get('location');
      reporter.addResult(routeInfo, `${status} → ${location}`, true);
    } else {
      reporter.addResult(routeInfo, status, ok);
      if (!ok) {
        const text = await response.text().catch(() => '');
        console.error(`    └─ Body snippet: ${text.slice(0, 150)}`);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      reporter.addResult(routeInfo, 'TIMEOUT', false);
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`\n  Cannot connect to ${BASE_URL}. Is the admin dev server running?`);
      console.error('     Start it with: npm run dev   (from the admin directory)\n');
      process.exit(1);
    } else {
      reporter.addResult(routeInfo, err.message, false);
    }
  }
}

async function run() {
  console.log(`\n  Testing admin routes at ${BASE_URL}...`);
  console.log(`  Timeout: 10s per route\n`);

  const reporter = new RouteTestReporter();
  const checks = [];

  // Static routes
  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    checks.push(checkRoute(url, reporter, route));
  }

  // Dynamic routes (with placeholder IDs)
  for (const route of DYNAMIC_ROUTES) {
    const url = `${BASE_URL}${route.path(route.id)}`;
    checks.push(checkRoute(url, reporter, route));
  }

  await Promise.all(checks);
  reporter.print();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
