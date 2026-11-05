const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function runDualPwaQA() {
  console.log('=== STARTING SHUBBAN LIBERY DUAL PWA QA & AUDIT SUITE ===\n');

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

  try {
    // -------------------------------------------------------------
    // TEST 1: Main Website PWA Manifest Validation
    // -------------------------------------------------------------
    console.log('--- TEST 1: Main Website Manifest (/manifest.webmanifest) ---');
    const mainManifestRes = await fetch(`${BASE_URL}/manifest.webmanifest`);
    assert(mainManifestRes.status === 200, `HTTP status is 200 (Got: ${mainManifestRes.status})`);
    
    const mainContentType = mainManifestRes.headers.get('content-type') || '';
    assert(mainContentType.includes('manifest+json') || mainContentType.includes('application/json'), `Content-Type is manifest JSON (Got: ${mainContentType})`);

    const mainManifest = await mainManifestRes.json();
    assert(mainManifest.name === 'Shubban Libery', `Name is 'Shubban Libery' (Got: ${mainManifest.name})`);
    assert(mainManifest.short_name === 'Shubban', `Short name is 'Shubban' (Got: ${mainManifest.short_name})`);
    assert(mainManifest.start_url === '/', `Start URL is '/' (Got: ${mainManifest.start_url})`);
    assert(mainManifest.scope === '/', `Scope is '/' (Got: ${mainManifest.scope})`);
    assert(mainManifest.display === 'standalone', `Display is 'standalone' (Got: ${mainManifest.display})`);
    assert(Array.isArray(mainManifest.icons) && mainManifest.icons.length >= 4, `Icons array has ${mainManifest.icons?.length} items`);
    assert(mainManifest.theme_color === '#C49A45', `Theme color is gold #C49A45 (Got: ${mainManifest.theme_color})`);

    // -------------------------------------------------------------
    // TEST 2: Admin Management PWA Manifest Validation
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Admin Management Manifest (/admin/manifest.webmanifest) ---');
    const adminManifestRes = await fetch(`${BASE_URL}/admin/manifest.webmanifest`);
    assert(adminManifestRes.status === 200, `HTTP status is 200 (Got: ${adminManifestRes.status})`);

    const adminContentType = adminManifestRes.headers.get('content-type') || '';
    assert(adminContentType.includes('manifest+json') || adminContentType.includes('application/json'), `Content-Type is manifest JSON (Got: ${adminContentType})`);

    const adminManifest = await adminManifestRes.json();
    assert(adminManifest.name === 'Shubban Admin', `Name is 'Shubban Admin' (Got: ${adminManifest.name})`);
    assert(adminManifest.short_name === 'Admin', `Short name is 'Admin' (Got: ${adminManifest.short_name})`);
    assert(adminManifest.start_url === '/admin', `Start URL is '/admin' (Got: ${adminManifest.start_url})`);
    assert(adminManifest.scope === '/admin', `Scope is '/admin' (Got: ${adminManifest.scope})`);
    assert(adminManifest.display === 'standalone', `Display is 'standalone' (Got: ${adminManifest.display})`);
    assert(Array.isArray(adminManifest.icons) && adminManifest.icons.length >= 4, `Icons array has ${adminManifest.icons?.length} items`);
    assert(adminManifest.theme_color === '#D97706', `Theme color is amber #D97706 (Got: ${adminManifest.theme_color})`);

    // Verify isolation
    assert(mainManifest.id !== adminManifest.id, 'Main and Admin manifest IDs are strictly distinct');
    assert(mainManifest.scope !== adminManifest.scope, 'Main and Admin scopes are strictly distinct (/ vs /admin)');

    // -------------------------------------------------------------
    // TEST 3: Service Worker Endpoints & Scopes
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Independent Service Workers Validation ---');
    
    // Main Service Worker
    const mainSwRes = await fetch(`${BASE_URL}/sw.js`);
    assert(mainSwRes.status === 200, `Main SW (/sw.js) returns HTTP 200`);
    const mainSwHeaders = mainSwRes.headers.get('service-worker-allowed') || '';
    assert(mainSwHeaders === '/' || !mainSwHeaders, `Main SW allowed scope is '/' (Got: '${mainSwHeaders}')`);
    const mainSwText = await mainSwRes.text();
    assert(mainSwText.includes('shubban-main-'), `Main SW contains main cache version tag`);
    assert(mainSwText.includes('EXCLUDED_PATHS'), `Main SW enforces security excluded paths`);

    // Admin Service Worker (/admin-sw.js and /admin/sw.js)
    const adminSwRes = await fetch(`${BASE_URL}/admin-sw.js`);
    assert(adminSwRes.status === 200, `Admin SW (/admin-sw.js) returns HTTP 200`);
    const adminSwHeaders = adminSwRes.headers.get('service-worker-allowed') || '';
    assert(adminSwHeaders.includes('/admin'), `Admin SW allowed scope is '/admin' (Got: '${adminSwHeaders}')`);
    const adminSwText = await adminSwRes.text();
    assert(adminSwText.includes('shubban-admin-'), `Admin SW contains admin cache version tag`);
    assert(adminSwText.includes('CLEAR_ADMIN_CACHE'), `Admin SW implements security cache purge on logout`);

    // -------------------------------------------------------------
    // TEST 4: Brand Icon Files Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Brand Icon Files on Disk ---');
    const mainIcons = [
      'icon-192x192.png',
      'icon-512x512.png',
      'icon-maskable-192x192.png',
      'icon-maskable-512x512.png',
      'apple-touch-icon.png',
      'favicon-32x32.png',
      'favicon-48x48.png',
    ];
    let mainIconsFound = 0;
    for (const icon of mainIcons) {
      const p = path.join(__dirname, '..', 'public', 'icons', 'main', icon);
      if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
        mainIconsFound++;
      }
    }
    assert(mainIconsFound === mainIcons.length, `All ${mainIcons.length} Main website icons verified on disk`);

    const adminIcons = [
      'icon-192x192.png',
      'icon-512x512.png',
      'icon-maskable-192x192.png',
      'icon-maskable-512x512.png',
      'apple-touch-icon.png',
      'favicon-32x32.png',
      'favicon-48x48.png',
    ];
    let adminIconsFound = 0;
    for (const icon of adminIcons) {
      const p = path.join(__dirname, '..', 'public', 'icons', 'admin', icon);
      if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
        adminIconsFound++;
      }
    }
    assert(adminIconsFound === adminIcons.length, `All ${adminIcons.length} Admin icons verified on disk`);

    // -------------------------------------------------------------
    // TEST 5: Offline Fallback Pages
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Branded Offline Experiences ---');
    const mainOfflineRes = await fetch(`${BASE_URL}/offline`);
    assert(mainOfflineRes.status === 200, `Main Offline page (/offline) returns HTTP 200`);
    const mainOfflineHtml = await mainOfflineRes.text();
    assert(mainOfflineHtml.includes('ইন্টারনেট সংযোগ') || mainOfflineHtml.includes('অফলাইন'), `Main Offline page contains Bengali connectivity guidance`);

    const adminOfflineRes = await fetch(`${BASE_URL}/admin/offline`);
    assert(adminOfflineRes.status === 200, `Admin Offline page (/admin/offline) returns HTTP 200`);
    const adminOfflineHtml = await adminOfflineRes.text();
    assert(adminOfflineHtml.includes('অ্যাডমিন') || adminOfflineHtml.includes('Enterprise'), `Admin Offline page contains Admin security guidance`);

    // -------------------------------------------------------------
    // TEST 6: Web Push Subscription API & Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Web Push Subscription API & Database Flow ---');
    const pubKeyRes = await fetch(`${BASE_URL}/api/push/public-key`);
    assert(pubKeyRes.status === 200, `GET /api/push/public-key returns HTTP 200`);
    const pubKeyData = await pubKeyRes.json();
    assert(pubKeyData.success === true, `Public key endpoint returns success: true`);

    // Mock test subscription
    const mockEndpoint = `https://fcm.googleapis.com/fcm/send/test-sub-${Date.now()}`;
    const subRes = await fetch(`${BASE_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: mockEndpoint,
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcUbVYOIx0',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
        applicationType: 'MAIN',
        userAgent: 'Dual PWA QA Automation Runner',
      }),
    });
    assert(subRes.status === 200, `POST /api/push/subscribe returns HTTP 200`);
    const subData = await subRes.json();
    assert(subData.success === true, `Push subscription registered in database (ID: ${subData.subscriptionId})`);

    // Verify record in database
    const dbSub = await prisma.pushSubscription.findUnique({
      where: { endpoint: mockEndpoint },
    });
    assert(dbSub !== null && dbSub.subscriptionStatus === 'ACTIVE', `Database confirms ACTIVE push subscription record`);

    // Unsubscribe test
    const unsubRes = await fetch(`${BASE_URL}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: mockEndpoint }),
    });
    assert(unsubRes.status === 200, `POST /api/push/unsubscribe returns HTTP 200`);
    const updatedDbSub = await prisma.pushSubscription.findUnique({
      where: { endpoint: mockEndpoint },
    });
    assert(updatedDbSub?.subscriptionStatus === 'UNSUBSCRIBED', `Database confirms UNSUBSCRIBED status`);

    // Clean up test record
    await prisma.pushSubscription.delete({ where: { endpoint: mockEndpoint } });

    // -------------------------------------------------------------
    // TEST 7: Database Integrity & Existing Records Preservation
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Database Integrity Verification ---');
    const [userCount, orderCount, bookCount] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.book.count(),
    ]);
    assert(userCount >= 140, `User accounts preserved: ${userCount} (Target: >= 140)`);
    assert(orderCount >= 110, `Orders preserved: ${orderCount} (Target: >= 110)`);
    assert(bookCount >= 130, `Book catalog preserved: ${bookCount} (Target: >= 130)`);

    console.log('\n======================================================');
    console.log(`TOTAL DUAL PWA QA CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('======================================================\n');

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('QA Execution error:', err);
    process.exit(1);
  }
}

runDualPwaQA();

