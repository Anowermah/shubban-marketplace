const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runQa() {
  console.log('====================================================');
  console.log('SHUBBAN LIBERY — MANDATORY QA PROTOCOL EXECUTION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  // --- SECTION 1: FILE INSPECTION ---
  console.log('--- 1. FILE INSPECTION ---');
  const criticalFiles = [
    'public/manifest.webmanifest',
    'public/admin/manifest.webmanifest',
    'public/sw.js',
    'public/admin-sw.js',
    'src/app/(storefront)/offline/page.tsx',
    'src/app/(admin)/admin/offline/page.tsx',
    'src/lib/pwa/client-pwa.ts',
    'src/components/pwa/MainPwaManager.tsx',
    'src/components/pwa/AdminPwaManager.tsx',
    'src/app/(admin)/admin/(dashboard)/settings/pwa/page.tsx',
    'src/lib/push/vapid.ts',
    'src/app/api/push/public-key/route.ts',
    'src/app/api/push/subscribe/route.ts',
    'src/app/api/push/unsubscribe/route.ts',
    'src/app/api/push/preferences/route.ts',
    'src/app/api/admin/push/send/route.ts',
    'src/app/api/admin/push/stats/route.ts',
    'src/app/layout.tsx',
    'src/app/error.tsx',
    'src/app/(storefront)/layout.tsx',
    'src/components/layout/Header.tsx',
    'next.config.mjs',
    'src/middleware.ts'
  ];

  for (const file of criticalFiles) {
    const exists = fs.existsSync(file);
    assert(exists, `Critical file exists: ${file}`);
    if (exists) {
      const content = fs.readFileSync(file, 'utf8');
      assert(!content.includes('password123') && !content.includes('sk_live_'), `No raw secrets in ${file}`);
    }
  }

  // --- SECTION 2: ROUTE AND COMPONENT VERIFICATION ---
  console.log('\n--- 2. ROUTE AND COMPONENT VERIFICATION ---');
  const routeChecks = [
    { path: '/', expectedStatus: [200], name: 'Homepage (/)' },
    { path: '/offline', expectedStatus: [200], name: 'Main Offline (/offline)' },
    { path: '/admin/login', expectedStatus: [200], name: 'Admin Login (/admin/login)' },
    { path: '/admin', expectedStatus: [307, 308, 302], name: 'Admin root redirects unauthenticated' },
    { path: '/admin/offline', expectedStatus: [200], name: 'Admin Offline (/admin/offline)' },
    { path: '/manifest.webmanifest', expectedStatus: [200], name: 'Main Manifest' },
    { path: '/admin/manifest.webmanifest', expectedStatus: [200], name: 'Admin Manifest' },
    { path: '/sw.js', expectedStatus: [200], name: 'Main Service Worker' },
    { path: '/admin-sw.js', expectedStatus: [200], name: 'Admin Service Worker' },
  ];

  for (const check of routeChecks) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 3000,
        path: check.path,
        method: 'GET',
      });
      assert(
        check.expectedStatus.includes(res.statusCode),
        `${check.name} responded with status ${res.statusCode} (expected: ${check.expectedStatus.join(',')})`
      );
    } catch (err) {
      assert(false, `${check.name} connection error: ${err.message}`);
    }
  }

  // --- SECTION 6: DATABASE AND MIGRATION VERIFICATION ---
  console.log('\n--- 6. DATABASE VERIFICATION ---');
  const userCount = await prisma.user.count();
  const orderCount = await prisma.order.count();
  const bookCount = await prisma.book.count();

  assert(userCount >= 140, `User accounts intact: ${userCount} records`);
  assert(orderCount >= 110, `Orders intact: ${orderCount} records`);
  assert(bookCount >= 130, `Books intact: ${bookCount} records`);

  // --- SECTION 7 & 8: API FUNCTIONALITY & SERVER-SIDE AUTHORIZATION ---
  console.log('\n--- 7 & 8. API FUNCTIONALITY & SERVER-SIDE AUTHORIZATION ---');

  // Test 8.1: Unauthenticated access to admin push endpoints (should return 401 or 403)
  const unauthStats = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/push/stats',
    method: 'GET',
  });
  assert(
    unauthStats.statusCode === 401 || unauthStats.statusCode === 403,
    `Unauthenticated /api/admin/push/stats blocked (Status: ${unauthStats.statusCode})`
  );

  const unauthSend = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/push/send',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { title: 'Test', body: 'Test' }
  );
  assert(
    unauthSend.statusCode === 401 || unauthSend.statusCode === 403,
    `Unauthenticated /api/admin/push/send blocked (Status: ${unauthSend.statusCode})`
  );

  // Test 8.2: Customer (Non-admin) access to admin push endpoints
  const customerUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (customerUser) {
    const customerToken = jwt.sign(
      {
        id: customerUser.id,
        email: customerUser.email,
        name: customerUser.name,
        role: customerUser.role,
        membershipTier: customerUser.membershipTier || 'FREE',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const customerStats = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/push/stats',
      method: 'GET',
      headers: { Cookie: `shubban_auth_token=${customerToken}` },
    });
    assert(
      customerStats.statusCode === 401 || customerStats.statusCode === 403,
      `Non-admin role blocked from /api/admin/push/stats (Status: ${customerStats.statusCode})`
    );
  }

  // Test 8.3: Admin access to admin push endpoints
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminUser) {
    const adminToken = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        membershipTier: adminUser.membershipTier || 'FREE',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminStats = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/push/stats',
      method: 'GET',
      headers: { Cookie: `shubban_auth_token=${adminToken}` },
    });
    assert(adminStats.statusCode === 200, `Admin access to /api/admin/push/stats succeeds (Status: ${adminStats.statusCode})`);
    try {
      const statsJson = JSON.parse(adminStats.body);
      assert(statsJson.success === true, `Admin stats returns success JSON`);
    } catch (e) {
      assert(false, `Admin stats returns invalid JSON`);
    }
  }

  // Test 7.1: Public push APIs
  const pubKeyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/push/public-key',
    method: 'GET',
  });
  assert(pubKeyRes.statusCode === 200, `GET /api/push/public-key returns 200`);

  const testEndpoint = `https://fcm.googleapis.com/fcm/send/test-qa-${Date.now()}`;
  const subRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/push/subscribe',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      endpoint: testEndpoint,
      keys: { p256dh: 'test_p256dh', auth: 'test_auth' },
      appScope: 'MAIN',
    }
  );
  assert(subRes.statusCode === 200, `POST /api/push/subscribe returns 200`);

  // Verify DB record
  const subRecord = await prisma.pushSubscription.findUnique({
    where: { endpoint: testEndpoint },
  });
  assert(subRecord !== null && subRecord.subscriptionStatus === 'ACTIVE', `Push subscription written to database and active`);

  // Clean up test sub record
  if (subRecord) {
    await prisma.pushSubscription.delete({ where: { id: subRecord.id } });
    assert(true, `Temporary test subscription cleaned up`);
  }

  // --- SECTION 9: RESPONSIVE DESIGN & MOBILE HAMBURGER VERIFICATION ---
  console.log('\n--- 9. RESPONSIVE DESIGN & MOBILE HAMBURGER VERIFICATION ---');
  const headerCode = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
  assert(headerCode.includes('w-11 h-11'), `Mobile hamburger button has prominent 44px container (w-11 h-11)`);
  assert((headerCode.includes('h-[2.5px]') || headerCode.includes('h-[3px]')) && headerCode.includes('w-6'), `Hamburger bars are bold & prominent (w-6, h-[3px] / h-[2.5px])`);
  assert(headerCode.includes('z-[70]') && headerCode.includes('z-[60]'), `Mobile drawer & backdrop have proper high z-index (z-[70], z-[60])`);
  assert(!headerCode.includes('<header') || headerCode.indexOf('</header>') < headerCode.indexOf('id="mobile-navigation-drawer"'), `Mobile drawer is placed OUTSIDE <header> to escape backdrop-filter containing block`);

  // --- SECTION 10: PLACEHOLDER AUDIT ---
  console.log('\n--- 10. PLACEHOLDER AND INCOMPLETE FEATURE AUDIT ---');
  let todoCount = 0;
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const todos = (content.match(/TODO:/gi) || []).length;
      const fixmes = (content.match(/FIXME:/gi) || []).length;
      if (todos > 0 || fixmes > 0) {
        console.warn(`  [INFO] ${file} has ${todos} TODOs and ${fixmes} FIXMEs`);
        todoCount += todos + fixmes;
      }
    }
  }
  assert(todoCount === 0, `Zero critical TODOs/FIXMEs in current phase files (Count: ${todoCount})`);

  console.log('\n====================================================');
  console.log(`TOTAL QA PROTOCOL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runQa().catch((err) => {
  console.error('QA Runner encountered unhandled error:', err);
  process.exit(1);
});

