const { PrismaClient } = require('@prisma/client');
const http = require('http');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

function makeAdminCookie(adminUser) {
  if (!adminUser) return '';
  const token = jwt.sign(
    {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      membershipTier: adminUser.membershipTier || 'FREE',
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  return `shubban_auth_token=${token}`;
}

function requestJson(path, method = 'GET', body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const postData = body ? JSON.stringify(body) : '';

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = { raw: data };
        }
        resolve({ statusCode: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('======================================================================');
  console.log('   PRODUCT ATTRIBUTES & VARIANTS COMPREHENSIVE QA TEST SUITE');
  console.log('======================================================================');
  console.log(`Server URL: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
  });
  assert(adminUser !== null, 'Admin user exists in database');
  const adminCookie = makeAdminCookie(adminUser);

  // 1. Database Model Integrity
  console.log('\n--- 1. Database Model Integrity Checks ---');
  const attrCount = await prisma.productAttribute.count();
  const valCount = await prisma.productAttributeValue.count();
  const groupCount = await prisma.productAttributeGroup.count();
  const variantCount = await prisma.productVariant.count();
  const sampleBook = await prisma.book.findFirst({ select: { id: true, title: true, slug: true, price: true } });

  assert(attrCount > 0, `Product Attributes count > 0 (found ${attrCount})`);
  assert(valCount > 0, `Product Attribute Values count > 0 (found ${valCount})`);
  assert(groupCount > 0, `Product Attribute Groups count > 0 (found ${groupCount})`);
  assert(variantCount > 0, `Product Variants count > 0 (found ${variantCount})`);
  assert(sampleBook !== null, `Sample Book exists for assignment: "${sampleBook?.title}"`);

  // 2. Dashboard Statistics & GET API
  console.log('\n--- 2. Dashboard Statistics & Server-Side Pagination API ---');
  const getRes = await requestJson('/api/admin/attributes?page=1&limit=10', 'GET', null, adminCookie);
  assert(getRes.statusCode === 200, 'GET /api/admin/attributes returns 200 OK');
  assert(getRes.data.success === true, 'GET /api/admin/attributes returns success: true');
  assert(getRes.data.stats.totalAttributes >= attrCount, 'Stats contains totalAttributes');
  assert(getRes.data.stats.totalAttributeValues >= valCount, 'Stats contains totalAttributeValues');
  assert(getRes.data.stats.totalProductVariants >= variantCount, 'Stats contains totalProductVariants');
  assert(getRes.data.pagination.limit === 10, 'Server-side pagination limit respected');
  assert(getRes.data.attributes.length > 0, 'Attributes array returned with values and groups');

  // 3. Attribute CRUD Lifecycle
  console.log('\n--- 3. Attribute CRUD Lifecycle ---');
  const testAttrCode = `TEST_ATTR_${Date.now().toString().slice(-5)}`;
  const createAttrRes = await requestJson(
    '/api/admin/attributes',
    'POST',
    {
      name: 'টেস্ট ফ্যাব্রিক (Test Fabric)',
      code: testAttrCode,
      type: 'SELECT',
      displayLabel: 'ফ্যাব্রিক সিলেক্ট করুন',
      displayOrder: 99,
      status: 'ACTIVE',
      isRequired: true,
      isVariant: true,
      values: [
        { name: '100% Linen', code: 'LINEN' },
        { name: 'Pure Silk', code: 'SILK' },
      ],
    },
    adminCookie
  );
  assert(createAttrRes.statusCode === 201, 'POST /api/admin/attributes creates new attribute (HTTP 201)');
  const createdAttrId = createAttrRes.data.attribute?.id;
  assert(createdAttrId !== undefined, 'Created attribute ID returned');
  assert(createAttrRes.data.attribute?.values?.length === 2, 'Initial 2 values created automatically');

  // Read single
  const readAttrRes = await requestJson(`/api/admin/attributes/${createdAttrId}`, 'GET', null, adminCookie);
  assert(readAttrRes.statusCode === 200, 'GET /api/admin/attributes/[id] returns 200');
  assert(readAttrRes.data.attribute.code === testAttrCode, 'Attribute code matches');

  // Update
  const updateAttrRes = await requestJson(
    `/api/admin/attributes/${createdAttrId}`,
    'PUT',
    {
      name: 'টেস্ট ফ্যাব্রিক আপডেট (Updated Fabric)',
      displayOrder: 100,
    },
    adminCookie
  );
  assert(updateAttrRes.statusCode === 200, 'PUT /api/admin/attributes/[id] updates attribute');
  assert(updateAttrRes.data.attribute.displayOrder === 100, 'Updated displayOrder is 100');

  // 4. Attribute Value Management (Single, Bulk Add, Reorder, Delete)
  console.log('\n--- 4. Attribute Values Management ---');
  // Single Add Value
  const addValRes = await requestJson(
    `/api/admin/attributes/${createdAttrId}/values`,
    'POST',
    {
      name: 'Egyptian Cotton',
      code: 'EGYPT',
      colorHex: '#FFFFFF',
    },
    adminCookie
  );
  assert(addValRes.statusCode === 201, 'POST /api/admin/attributes/[id]/values adds single value');

  // Bulk Add Values
  const bulkValRes = await requestJson(
    `/api/admin/attributes/${createdAttrId}/values`,
    'POST',
    {
      bulkText: 'Cashmere, Wool Blend, Modal Fabric',
    },
    adminCookie
  );
  assert(bulkValRes.statusCode === 201, 'Bulk add values parses comma-separated string');
  assert(bulkValRes.data.values.length >= 6, 'Total values increased to 6 or more');

  // Duplicate Value Detection
  const dupValRes = await requestJson(
    `/api/admin/attributes/${createdAttrId}/values`,
    'POST',
    { name: 'Egyptian Cotton' },
    adminCookie
  );
  assert(dupValRes.statusCode === 400, 'Duplicate value name rejected with HTTP 400');

  // 5. Attribute Groups Management
  console.log('\n--- 5. Attribute Groups Management ---');
  const groupCreateRes = await requestJson(
    '/api/admin/attributes/groups',
    'POST',
    {
      name: `টেস্ট গ্রুপ ${Date.now().toString().slice(-4)}`,
      description: 'টেস্টিং পারপাস গ্রুপ',
      displayOrder: 10,
    },
    adminCookie
  );
  assert(groupCreateRes.statusCode === 201, 'POST /api/admin/attributes/groups creates group');
  const testGroupId = groupCreateRes.data.group?.id;

  const groupDeleteRes = await requestJson(`/api/admin/attributes/groups?id=${testGroupId}`, 'DELETE', null, adminCookie);
  assert(groupDeleteRes.statusCode === 200, 'DELETE /api/admin/attributes/groups deletes group safely');

  // 6. Product Attribute Assignment & Variant Combinations
  console.log('\n--- 6. Product Attribute Assignment & Cartesian Generator ---');
  if (sampleBook) {
    // Search Products
    const searchProdRes = await requestJson(`/api/admin/products/search?q=${encodeURIComponent(sampleBook.title.slice(0, 5))}`, 'GET', null, adminCookie);
    assert(searchProdRes.statusCode === 200, 'Product search returns 200 OK');
    assert(searchProdRes.data.products.length > 0, 'Matching products found in search');

    // Assign attribute to sampleBook
    const assignRes = await requestJson(
      `/api/admin/products/${sampleBook.id}/attributes`,
      'POST',
      {
        assignments: [
          {
            attributeId: createdAttrId,
            isRequired: true,
            isVariant: true,
            defaultValue: 'Pure Silk',
            valueIds: [],
          },
        ],
      },
      adminCookie
    );
    assert(assignRes.statusCode === 200, 'Product attributes assigned successfully');

    // Cartesian Preview Combinations
    const previewRes = await requestJson(
      `/api/admin/products/${sampleBook.id}/variants`,
      'POST',
      {
        mode: 'preview',
        attributes: [
          {
            name: 'Fabric',
            values: [
              { name: 'Silk', code: 'SLK' },
              { name: 'Linen', code: 'LIN' },
            ],
          },
          {
            name: 'Size',
            values: [
              { name: 'M', code: 'M' },
              { name: 'L', code: 'L' },
            ],
          },
        ],
        defaultPrice: 1200,
        defaultStock: 15,
      },
      adminCookie
    );
    assert(previewRes.statusCode === 200, 'POST /api/admin/products/[id]/variants preview returns 200');
    assert(previewRes.data.totalCombinations === 4, 'Cartesian product: 2x2 = 4 combinations computed');

    // Generate Combinations in Database
    const genRes = await requestJson(
      `/api/admin/products/${sampleBook.id}/variants`,
      'POST',
      {
        mode: 'generate',
        attributes: [
          {
            name: 'Fabric',
            values: [
              { name: 'Silk', code: 'SLK' },
              { name: 'Linen', code: 'LIN' },
            ],
          },
          {
            name: 'Size',
            values: [
              { name: 'M', code: 'M' },
              { name: 'L', code: 'L' },
            ],
          },
        ],
        preserveExisting: true,
        defaultPrice: 1200,
        defaultStock: 15,
      },
      adminCookie
    );
    assert(genRes.statusCode === 201, 'Generate variants creates records in database (HTTP 201)');
    const createdVariantList = genRes.data.variants.filter((v) => v.name.includes('Fabric: Silk'));
    assert(createdVariantList.length > 0, 'Generated variants saved with attributes and unique SKU');

    // 7. Individual Variant Management
    console.log('\n--- 7. Individual Variant Management ---');
    const firstCreatedVariant = createdVariantList[0];
    const updateVariantRes = await requestJson(
      `/api/admin/variants/${firstCreatedVariant.id}`,
      'PUT',
      {
        price: 1350,
        salePrice: 1250,
        stockQuantity: 25,
        weight: 350,
      },
      adminCookie
    );
    assert(updateVariantRes.statusCode === 200, 'PUT /api/admin/variants/[id] updates price and stock');
    assert(updateVariantRes.data.variant.price === 1350, 'Updated price is 1350 BDT');
    assert(updateVariantRes.data.variant.salePrice === 1250, 'Updated salePrice is 1250 BDT');
    assert(updateVariantRes.data.variant.stockQuantity === 25, 'Updated stockQuantity is 25');

    // 8. Bulk Variant Operations
    console.log('\n--- 8. Bulk Variant Operations ---');
    const varIdsToAdjust = createdVariantList.map((v) => v.id);

    // Bulk Price Adjust (+10%)
    const bulkPriceRes = await requestJson(
      `/api/admin/products/${sampleBook.id}/variants`,
      'PUT',
      {
        action: 'bulk_price',
        variantIds: varIdsToAdjust,
        payload: { type: 'adjust_percent', value: 10 },
      },
      adminCookie
    );
    assert(bulkPriceRes.statusCode === 200, 'Bulk price adjustment +10% succeeded');

    // Bulk Stock Set (50 units)
    const bulkStockRes = await requestJson(
      `/api/admin/products/${sampleBook.id}/variants`,
      'PUT',
      {
        action: 'bulk_stock',
        variantIds: varIdsToAdjust,
        payload: { type: 'set', value: 50 },
      },
      adminCookie
    );
    assert(bulkStockRes.statusCode === 200, 'Bulk stock set to 50 succeeded');

    // Bulk Delete Generated Test Variants
    const bulkDelRes = await requestJson(
      `/api/admin/products/${sampleBook.id}/variants`,
      'PUT',
      {
        action: 'bulk_delete',
        variantIds: varIdsToAdjust,
      },
      adminCookie
    );
    assert(bulkDelRes.statusCode === 200, 'Bulk delete generated test variants succeeded');
  }

  // 9. Clean up created attribute
  console.log('\n--- 9. Cleanup & Safety Verification ---');
  const cleanAttrRes = await requestJson(`/api/admin/attributes/${createdAttrId}`, 'DELETE', null, adminCookie);
  assert(cleanAttrRes.statusCode === 200, 'DELETE /api/admin/attributes/[id] deletes attribute cleanly');

  // 10. Check UI Routes
  console.log('\n--- 10. Admin UI Routes Verification ---');
  const attrPageRes = await requestJson('/admin/attributes', 'GET', null, adminCookie);
  assert(attrPageRes.statusCode === 200, 'GET /admin/attributes page loads with HTTP 200');

  const firstAttr = await prisma.productAttribute.findFirst({ select: { id: true } });
  if (firstAttr) {
    const attrDetailUiRes = await requestJson(`/admin/attributes/${firstAttr.id}`, 'GET', null, adminCookie);
    assert(attrDetailUiRes.statusCode === 200, `GET /admin/attributes/${firstAttr.id} details page loads with HTTP 200`);
  }

  console.log('\n======================================================================');
  console.log(`   TEST SUMMARY: ${passedTests} of ${totalTests} ASSERTIONS PASSED`);
  console.log('======================================================================');

  await prisma.$disconnect();
  process.exit(totalTests === passedTests ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

