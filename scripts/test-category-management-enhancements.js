const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

function makeAuthCookie(user) {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      membershipTier: user.membershipTier || 'FREE',
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  return `shubban_auth_token=${token}`;
}

async function runCategoryTests() {
  console.log('======================================================================');
  console.log('   TEST SUITE: CATEGORY & SUBCATEGORY MANAGEMENT SYSTEM');
  console.log('======================================================================');

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

  try {
    // 1. Setup Admin & Customer Users
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
    if (!adminUser) throw new Error('No admin user found in database');

    const customerUser = await prisma.user.findFirst({
      where: { role: 'REGISTERED_MEMBER' },
    });

    const adminCookie = makeAuthCookie(adminUser);
    const customerCookie = customerUser ? makeAuthCookie(customerUser) : '';

    console.log(`  [OK] Admin user found: ${adminUser.name} (${adminUser.role})`);

    // 2. Unauthenticated & Non-Admin Access Rejection (RBAC)
    const unauthRes = await fetch(`${BASE_URL}/api/admin/categories`);
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated GET /api/admin/categories rejected with 401/403');

    if (customerCookie) {
      const custRes = await fetch(`${BASE_URL}/api/admin/categories`, {
        headers: { Cookie: customerCookie },
      });
      assert(custRes.status === 403, 'Customer role GET /api/admin/categories rejected with 403');
    }

    // 3. Admin Access & Stats Verification
    const listRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      headers: { Cookie: adminCookie },
    });
    assert(listRes.status === 200, 'Admin successfully fetched categories list (200 OK)');
    const listData = await listRes.json();
    assert(listData.success === true, 'Categories API returned success: true');
    assert(typeof listData.stats.totalCategories === 'number', 'Stats contains totalCategories');
    assert(typeof listData.stats.totalSubcategories === 'number', 'Stats contains totalSubcategories');
    assert(typeof listData.stats.activeCategories === 'number', 'Stats contains activeCategories');

    // 4. Create Parent Category
    const createParentRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'টেস্ট মূল বিভাগ ' + Date.now(),
        nameEn: 'Test Main Category',
        slug: 'test-main-' + Date.now(),
        description: 'টেস্ট বিভাগের বিবরণ',
        icon: 'FolderTree',
        displayOrder: 1,
        isActive: true,
        seoTitle: 'টেস্ট এসইও শিরোনাম',
        seoDescription: 'টেস্ট এসইও মেটা বিবরণ',
      }),
    });
    assert(createParentRes.status === 201, 'Parent category created with status 201');
    const parentData = await createParentRes.json();
    const parentId = parentData.category.id;
    assert(!!parentId, `Parent category ID created: ${parentId}`);

    // Verify AuditLog for creation
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: parentId, action: 'CREATE_CATEGORY' },
    });
    assert(!!auditLog, 'AuditLog recorded CREATE_CATEGORY event');

    // 5. Create Child Subcategory
    const createSubRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'টেস্ট উপ-বিভাগ ' + Date.now(),
        nameEn: 'Test Subcategory',
        slug: 'test-sub-' + Date.now(),
        parentId: parentId,
        displayOrder: 1,
        isActive: true,
      }),
    });
    assert(createSubRes.status === 201, 'Subcategory created with status 201');
    const subData = await createSubRes.json();
    const subId = subData.category.id;
    assert(subData.category.parentId === parentId, 'Subcategory parentId correctly assigned');

    // 6. Hierarchy Cycle Prevention
    const cycleRes = await fetch(`${BASE_URL}/api/admin/categories/${parentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        parentId: parentId, // Self-parenting attempt
      }),
    });
    assert(cycleRes.status === 400, 'Self-parenting cycle rejected with HTTP 400');

    // 7. Prevent Deletion of Category with Subcategories
    const delParentWithSubRes = await fetch(`${BASE_URL}/api/admin/categories/${parentId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delParentWithSubRes.status === 400, 'Deleting category with subcategories blocked (HTTP 400)');
    const delParentWithSubData = await delParentWithSubRes.json();
    assert(delParentWithSubData.error.includes('উপ-বিভাগ'), 'Clear error message returned about subcategories');

    // 8. Delete Subcategory First
    const delSubRes = await fetch(`${BASE_URL}/api/admin/categories/${subId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delSubRes.status === 200, 'Subcategory deleted successfully (HTTP 200)');

    // 9. Now Delete Parent Category
    const delParentRes = await fetch(`${BASE_URL}/api/admin/categories/${parentId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delParentRes.status === 200, 'Empty parent category deleted successfully (HTTP 200)');

    // 10. Batch Operations: Activate, Deactivate & Delete
    const catA = await prisma.category.create({
      data: {
        name: 'ব্যাচ টেস্ট ১ ' + Date.now(),
        slug: 'batch-test-1-' + Date.now(),
        isActive: true,
      },
    });
    const catB = await prisma.category.create({
      data: {
        name: 'ব্যাচ টেস্ট ২ ' + Date.now(),
        slug: 'batch-test-2-' + Date.now(),
        isActive: true,
      },
    });

    const batchDeactRes = await fetch(`${BASE_URL}/api/admin/categories/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        action: 'deactivate',
        categoryIds: [catA.id, catB.id],
      }),
    });
    assert(batchDeactRes.status === 200, 'Batch deactivate returned 200 OK');
    const catACheck = await prisma.category.findUnique({ where: { id: catA.id } });
    assert(catACheck.isActive === false, 'Category A isActive is now false');

    const batchDelRes = await fetch(`${BASE_URL}/api/admin/categories/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        action: 'delete',
        categoryIds: [catA.id, catB.id],
      }),
    });
    assert(batchDelRes.status === 200, 'Batch delete returned 200 OK');
    const catBCheck = await prisma.category.findUnique({ where: { id: catB.id } });
    assert(catBCheck === null, 'Category B successfully deleted by batch operation');

    // 11. Admin Categories Page Accessibility
    const pageRes = await fetch(`${BASE_URL}/admin/categories`, {
      headers: { Cookie: adminCookie },
    });
    assert(pageRes.status === 200, 'Admin categories page accessible (HTTP 200)');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
    console.log('======================================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runCategoryTests();

