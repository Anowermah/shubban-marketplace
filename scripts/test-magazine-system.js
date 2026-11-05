// scripts/test-magazine-system.js — Complete Verification of Magazine, Articles & PDF System
const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

async function runTests() {
  console.log('====================================================');
  console.log('SHUBBAN LIBERY — MAGAZINE & DIGITAL PUBLICATION QA');
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

  // 1. Database Check
  console.log('--- 1. DATABASE RECORD AUDIT ---');
  const magazineCount = await prisma.magazine.count();
  const issueCount = await prisma.publicationIssue.count();
  const articleCount = await prisma.article.count();
  assert(magazineCount > 0, `Magazines in DB: ${magazineCount}`);
  assert(issueCount > 0, `Publication Issues in DB: ${issueCount}`);
  assert(articleCount > 0, `Articles in DB: ${articleCount}`);

  const sampleIssue = await prisma.publicationIssue.findFirst({
    include: { magazine: true },
  });
  const sampleArticle = await prisma.article.findFirst();

  // 2. Public Storefront Routes
  console.log('\n--- 2. PUBLIC STOREFRONT ROUTES ---');
  const publicRoutes = [
    { path: '/magazine', name: 'Magazine Showcase & Archives' },
    { path: `/magazine/${sampleIssue.magazine.slug}`, name: 'Magazine Series Detail Page' },
    { path: `/magazine/${sampleIssue.magazine.slug}/articles`, name: 'Magazine Issue Articles' },
    { path: `/magazine/read/${sampleIssue.id}`, name: 'Distraction-Free PDF Reader' },
    { path: '/articles', name: 'Public Articles Portal' },
    { path: `/articles/${sampleArticle.slug}`, name: 'Public Article Detail Reader' },
    { path: `/magazine/article/${sampleArticle.slug}`, name: 'Magazine Article Detail Route' },
    { path: '/essays', name: 'Public Essays Listing' },
    { path: `/essays/${sampleArticle.slug}`, name: 'Public Essay Reading Route' },
    { path: '/islamic-journals', name: 'Islamic Journals & Research Portal' },
    { path: `/islamic-journals/${sampleArticle.slug}`, name: 'Islamic Journal Paper Route' },
  ];

  for (const r of publicRoutes) {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: r.path,
      method: 'GET',
    });
    assert(
      res.statusCode === 200 && !res.body.includes('Unhandled Runtime Error'),
      `${r.name} (${r.path}) -> HTTP ${res.statusCode}`
    );
  }

  // 3. API Endpoints Check
  console.log('\n--- 3. PUBLIC & ANALYTICS API ENDPOINTS ---');
  // GET /api/publications/magazines
  const magRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/publications/magazines',
    method: 'GET',
  });
  assert(magRes.statusCode === 200, 'GET /api/publications/magazines -> HTTP 200');

  // GET /api/publications/issues
  const issueRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/publications/issues',
    method: 'GET',
  });
  assert(issueRes.statusCode === 200, 'GET /api/publications/issues -> HTTP 200');

  // GET /api/publications/articles
  const artRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/publications/articles',
    method: 'GET',
  });
  assert(artRes.statusCode === 200, 'GET /api/publications/articles -> HTTP 200');

  // POST /api/analytics/reading-session (Heartbeat & Meaningful reader)
  const testSessionId = 'test_sid_' + Date.now();
  const sessionRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/reading-session',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      issueId: sampleIssue.id,
      sessionId: testSessionId,
      currentPage: 3,
      totalPages: 48,
      pagesRead: [1, 2, 3],
      durationIncrement: 35,
      deviceType: 'desktop',
      browser: 'NodeTest',
    }
  );
  const sessionJson = JSON.parse(sessionRes.body);
  assert(
    sessionRes.statusCode === 200 && sessionJson.isMeaningfulReader === true,
    `Reading Session Heartbeat & Meaningful Reader Verified (duration: ${sessionJson.durationSeconds}s, isMeaningful: ${sessionJson.isMeaningfulReader})`
  );

  // GET /api/analytics/reading-session (Resume Reading Position)
  const resumeRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/analytics/reading-session?issueId=${sampleIssue.id}&sessionId=${testSessionId}`,
    method: 'GET',
  });
  const resumeJson = JSON.parse(resumeRes.body);
  assert(
    resumeRes.statusCode === 200 && resumeJson.lastPage === 3,
    `Resume Reading Position Verified: Resumed at Page ${resumeJson.lastPage}`
  );

  // POST /api/analytics/share
  const shareRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analytics/share',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      issueId: sampleIssue.id,
      platform: 'WHATSAPP',
    }
  );
  assert(shareRes.statusCode === 200, 'POST /api/analytics/share -> HTTP 200');

  // GET /api/publications/[id]/download
  const downloadRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/publications/${sampleIssue.id}/download`,
    method: 'GET',
  });
  assert(
    downloadRes.statusCode === 200 || downloadRes.statusCode === 307 || downloadRes.statusCode === 308,
    `Secure PDF Download Endpoint -> HTTP ${downloadRes.statusCode} (Content-Type: ${downloadRes.headers['content-type'] || 'binary'})`
  );

  // 4. Admin Routes with Authentication
  console.log('\n--- 4. AUTHENTICATED ADMIN ROUTES ---');
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });
  const adminToken = jwt.sign(
    {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      membershipTier: adminUser.membershipTier,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminRoutes = [
    { path: '/admin/magazines', name: 'Admin Magazine Issues Management' },
    { path: '/admin/essays', name: 'Admin Essays Management' },
    { path: '/admin/publications/analytics', name: 'Admin Publications Analytics Dashboard' },
  ];

  for (const ar of adminRoutes) {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: ar.path,
      method: 'GET',
      headers: {
        Cookie: `shubban_auth_token=${adminToken}`,
      },
    });
    assert(
      res.statusCode === 200 && !res.body.includes('Unhandled Runtime Error'),
      `${ar.name} (${ar.path}) -> HTTP ${res.statusCode}`
    );
  }

  // Admin Analytics API
  const adminAnalyticsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/publications/analytics?period=30d',
    method: 'GET',
    headers: {
      Cookie: `shubban_auth_token=${adminToken}`,
    },
  });
  const analyticsJson = JSON.parse(adminAnalyticsRes.body);
  assert(
    adminAnalyticsRes.statusCode === 200 && analyticsJson.success === true,
    `GET /api/admin/publications/analytics -> HTTP 200 (Total Sessions: ${analyticsJson.summary.totalSessions}, Unique Readers: ${analyticsJson.summary.uniqueReaders})`
  );

  // Admin Analytics CSV Export
  const csvRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/publications/analytics?format=csv&period=30d',
    method: 'GET',
    headers: {
      Cookie: `shubban_auth_token=${adminToken}`,
    },
  });
  assert(
    csvRes.statusCode === 200 && csvRes.headers['content-type'].includes('text/csv'),
    `GET /api/admin/publications/analytics?format=csv -> HTTP 200 (CSV Content-Type Verified)`
  );

  console.log('\n====================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(async (e) => {
  console.error('Test Suite encountered an error:', e);
  await prisma.$disconnect();
  process.exit(1);
});

