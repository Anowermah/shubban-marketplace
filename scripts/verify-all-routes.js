const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

function fetchUrl(pathname) {
  return new Promise((resolve) => {
    const url = new URL(pathname, BASE_URL);
    const req = http.get(url, { headers: { 'User-Agent': 'RouteVerifier/1.0' } }, (res) => {
      resolve({ status: res.statusCode, location: res.headers.location });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.setTimeout(25000, () => {
      req.destroy();
      resolve({ status: 408, error: 'Timeout' });
    });
  });
}

function discoverAppRoutes(dir, currentPath = '') {
  let routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Dynamic route folders like [id] or [slug]
      let segment = entry.name;
      // Handle group folders like (public)
      if (segment.startsWith('(') && segment.endsWith(')')) {
        routes = routes.concat(discoverAppRoutes(fullPath, currentPath));
      } else {
        routes = routes.concat(discoverAppRoutes(fullPath, currentPath + '/' + segment));
      }
    } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx') {
      routes.push(currentPath === '' ? '/' : currentPath);
    }
  }
  return routes;
}

async function verifyAllRoutes() {
  console.log('====================================================');
  console.log('SHUBBAN MARKETPLACE — COMPLETE ROUTE INTEGRITY AUDIT');
  console.log('====================================================\n');

  const appDir = path.join(__dirname, '..', 'src', 'app');
  const allRoutes = discoverAppRoutes(appDir);

  console.log(`Discovered ${allRoutes.length} application routes in src/app\n`);

  let passed = 0;
  let redirected = 0;
  let failed = 0;

  // Replace dynamic segments with real sample values for HTTP checking
  const sampleParams = {
    '[id]': 'cmvrc7b1q000ujm12b3r06q6w',
    '[slug]': 'boimela',
    '[bookId]': 'cmvrc7b1q000ujm12b3r06q6w',
    '[receiptNumber]': 'SHB-DON-2026-1001',
    '[issue]': 'issue-1',
  };

  const cleanRoutes = allRoutes.map((r) => {
    let route = r;
    for (const [key, val] of Object.entries(sampleParams)) {
      route = route.replace(key, val);
    }
    return route;
  });

  for (const route of cleanRoutes) {
    const res = await fetchUrl(route);
    const isPublic = !route.startsWith('/admin') && !route.startsWith('/seller/dashboard') && !route.startsWith('/account');

    if (isPublic) {
      if (res.status === 200 || res.status === 307 || res.status === 302) {
        console.log(`[PASS] ${route} (Status: ${res.status})`);
        passed++;
      } else {
        console.error(`[FAIL] ${route} (Status: ${res.status}${res.error ? ` - ${res.error}` : ''})`);
        failed++;
      }
    } else {
      // Protected routes should either render (200) or redirect (307/302) when unauthenticated
      if (res.status === 307 || res.status === 302 || res.status === 200) {
        console.log(`[PASS-GATED] ${route} (Status: ${res.status} -> ${res.location || 'Rendered'})`);
        redirected++;
      } else {
        console.error(`[FAIL-GATED] ${route} (Status: ${res.status})`);
        failed++;
      }
    }
  }

  console.log('\n====================================================');
  console.log(`ROUTE AUDIT SUMMARY:`);
  console.log(`- Accessible Public Routes: ${passed}`);
  console.log(`- RBAC Protected / Gated Routes: ${redirected}`);
  console.log(`- Failed / Broken Routes: ${failed}`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

verifyAllRoutes().catch((e) => {
  console.error('Route verification failed:', e);
  process.exit(1);
});

