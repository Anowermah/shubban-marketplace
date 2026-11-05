/**
 * Test Suite: Product Management Enhancements, Batch API & Catalog Controls
 */

require('./load-env');
const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [OK] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log('   TEST SUITE: PRODUCT MANAGEMENT & BATCH CATALOG CONTROLS');
  console.log('='.repeat(70));

  try {
    // 1. Auth Setup
    const admin = await prisma.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    });
    assert(!!admin, `Admin user available: ${admin?.name}`);

    const adminToken = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const adminHeaders = {
      Cookie: `shubban_auth_token=${adminToken}`,
    };

    // 2. Unauthenticated Batch Rejection
    const unauthBatch = await request('/api/admin/products/batch', {
      method: 'POST',
      body: { action: 'publish', productIds: ['dummy'] },
    });
    assert(unauthBatch.status === 403 || unauthBatch.status === 401, 'Unauthenticated batch action rejected (401/403)');

    // 3. Select 2 sample books for batch operations
    const sampleBooks = await prisma.book.findMany({ take: 2 });
    assert(sampleBooks.length >= 2, `Found ${sampleBooks.length} sample books for testing`);
    const testIds = sampleBooks.map((b) => b.id);

    // 4. Batch Feature
    const batchFeatureRes = await request('/api/admin/products/batch', {
      method: 'POST',
      headers: adminHeaders,
      body: { action: 'feature', productIds: testIds },
    });
    assert(batchFeatureRes.status === 200 && batchFeatureRes.data.success, 'Batch feature API returned 200 OK');
    assert(batchFeatureRes.data.updatedCount === testIds.length, `Batch feature updated ${testIds.length} items`);

    const featuredBooks = await prisma.book.findMany({ where: { id: { in: testIds } } });
    assert(featuredBooks.every((b) => b.isFeatured === true), 'All target books are now marked isFeatured = true');

    // 5. Batch Stock Add (+5)
    const initialStocks = sampleBooks.map((b) => b.stockQuantity);
    const batchStockAddRes = await request('/api/admin/products/batch', {
      method: 'POST',
      headers: adminHeaders,
      body: { action: 'stock_add', productIds: testIds, value: 5 },
    });
    assert(batchStockAddRes.status === 200 && batchStockAddRes.data.success, 'Batch stock increment (+5) succeeded');

    const restockedBooks = await prisma.book.findMany({ where: { id: { in: testIds } } });
    assert(
      restockedBooks[0].stockQuantity === initialStocks[0] + 5,
      `Book 1 stock incremented from ${initialStocks[0]} to ${restockedBooks[0].stockQuantity}`
    );

    // Rollback stock increment
    await request('/api/admin/products/batch', {
      method: 'POST',
      headers: adminHeaders,
      body: { action: 'stock_add', productIds: testIds, value: -5 },
    });

    // 6. Verify AuditLog Recorded
    const auditRecord = await prisma.auditLog.findFirst({
      where: { action: 'BATCH_UPDATE_PRODUCTS' },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditRecord, 'AuditLog recorded BATCH_UPDATE_PRODUCTS with details');

    // 7. Verify Admin Products Page HTTP 200
    const pageRes = await request('/admin/products', {
      headers: adminHeaders,
    });
    assert(pageRes.status === 200 || pageRes.status === 307, `Admin products page accessible (Got HTTP ${pageRes.status})`);

  } catch (error) {
    console.error('Test Suite Error:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

run();

