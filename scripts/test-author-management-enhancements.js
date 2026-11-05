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

async function runAuthorTests() {
  console.log('======================================================================');
  console.log('   TEST SUITE: AUTHOR PROFILE & CMS ARTICLE MANAGEMENT SYSTEM');
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
    // 1. Auth Setup
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
    if (!adminUser) throw new Error('No admin user found');

    const customerUser = await prisma.user.findFirst({
      where: { role: 'REGISTERED_MEMBER' },
    });

    const adminCookie = makeAuthCookie(adminUser);
    const customerCookie = customerUser ? makeAuthCookie(customerUser) : '';

    console.log(`  [OK] Admin user found: ${adminUser.name} (${adminUser.role})`);

    // 2. Unauthenticated & Non-Admin RBAC Rejection
    const unauthRes = await fetch(`${BASE_URL}/api/admin/authors`);
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated GET /api/admin/authors rejected (401/403)');

    if (customerCookie) {
      const custRes = await fetch(`${BASE_URL}/api/admin/authors`, {
        headers: { Cookie: customerCookie },
      });
      assert(custRes.status === 403, 'Customer role GET /api/admin/authors rejected with 403');
    }

    // 3. Admin Access & Stats Verification
    const listRes = await fetch(`${BASE_URL}/api/admin/authors`, {
      headers: { Cookie: adminCookie },
    });
    assert(listRes.status === 200, 'Admin successfully fetched authors list (200 OK)');
    const listData = await listRes.json();
    assert(listData.success === true, 'Authors API returned success: true');
    assert(typeof listData.stats.totalAuthors === 'number', 'Stats contains totalAuthors');
    assert(typeof listData.stats.activeAuthors === 'number', 'Stats contains activeAuthors');
    assert(typeof listData.stats.inactiveAuthors === 'number', 'Stats contains inactiveAuthors');
    assert(typeof listData.stats.totalPublishedArticles === 'number', 'Stats contains totalPublishedArticles');

    // 4. Create New Author Profile
    const createRes = await fetch(`${BASE_URL}/api/admin/authors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'ড. আহমাদ উল্লাহ ' + Date.now(),
        nameEn: 'Dr. Ahmadullah',
        slug: 'dr-ahmadullah-' + Date.now(),
        designation: 'প্রখ্যাত ইসলামিক চিন্তাবিদ ও গবেষক',
        email: `author-${Date.now()}@example.com`,
        phone: '+880 1711-123456',
        bio: 'আন্তর্জাতিক খ্যাতিসম্পন্ন গবেষক ও লেখক।',
        bioDetails: 'বিভিন্ন আন্তর্জাতিক সেমিনার ও ইসলামিক গবেষণা সাময়িকীতে বহু প্রবন্ধ প্রকাশিত হয়েছে।',
        expertise: 'তাফসির ও উসূলে ফিকহ',
        workplace: 'আস-সুন্নাহ ফাউন্ডেশন',
        education: 'এম.এ, পিএইচডি',
        experience: '১৫ বছরের গবেষণা অভিজ্ঞতা',
        awards: 'জাতীয় ইসলামিক গবেষণা পুরস্কার',
        website: 'https://ahmadullah.me',
        status: 'ACTIVE',
        isActive: true,
        isFeatured: true,
        isVerified: true,
        seoTitle: 'ড. আহমাদ উল্লাহ | লেখক পরিচিতি',
        seoDescription: 'ড. আহমাদ উল্লাহর বিস্তারিত জীবন ও রচনাবলী।',
      }),
    });
    assert(createRes.status === 201, 'Author created with status 201');
    const createData = await createRes.json();
    const authorAId = createData.author.id;
    assert(!!authorAId, `Author A ID created: ${authorAId}`);

    // Verify AuditLog
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: authorAId, action: 'CREATE_AUTHOR' },
    });
    assert(!!auditLog, 'AuditLog recorded CREATE_AUTHOR event');

    // 5. Update Author Profile
    const patchRes = await fetch(`${BASE_URL}/api/admin/authors/${authorAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        designation: 'প্রধান গবেষক ও অধ্যাপক',
        expertise: 'হাদিস বিজ্ঞান ও ফিকহ',
        status: 'ACTIVE',
      }),
    });
    assert(patchRes.status === 200, 'Author profile updated successfully (HTTP 200)');
    const patchData = await patchRes.json();
    assert(patchData.author.designation === 'প্রধান গবেষক ও অধ্যাপক', 'Updated designation confirmed');

    // 6. Test Author Articles Management & Reassign
    // Find or create test category for article
    let testCategory = await prisma.category.findFirst();
    if (!testCategory) {
      testCategory = await prisma.category.create({
        data: { name: 'ইসলামিক চিন্তাধারা', slug: 'islamic-thought-' + Date.now() },
      });
    }

    // Create an article for Author A
    const testArticle = await prisma.article.create({
      data: {
        title: 'টেস্ট প্রবন্ধ ' + Date.now(),
        slug: 'test-article-' + Date.now(),
        content: 'এটি একটি পরীক্ষামূলক গবেষণা প্রবন্ধের পূর্ণাঙ্গ কন্টেন্ট।',
        excerpt: 'সংক্ষিপ্ত সারসংক্ষেপ...',
        status: 'PUBLISHED',
        authorId: authorAId,
        categoryId: testCategory.id,
      },
    });
    assert(!!testArticle.id, 'Test article created and linked to Author A');

    // Fetch author articles via API
    const authArticlesRes = await fetch(`${BASE_URL}/api/admin/authors/${authorAId}/articles`, {
      headers: { Cookie: adminCookie },
    });
    assert(authArticlesRes.status === 200, 'Author articles API returned 200 OK');
    const authArticlesData = await authArticlesRes.json();
    assert(authArticlesData.articles.length >= 1, 'Author articles list contains linked article');

    // 7. Deletion Guard: Try to delete Author A with linked article
    const delBlockedRes = await fetch(`${BASE_URL}/api/admin/authors/${authorAId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delBlockedRes.status === 400, 'Deleting author with linked articles blocked with HTTP 400');
    const delBlockedData = await delBlockedRes.json();
    assert(delBlockedData.error.includes('প্রবন্ধ'), 'Helpful error message returned about linked articles');

    // 8. Reassign Article to Another Author
    const authorB = await prisma.author.create({
      data: {
        name: 'লেখক বি ' + Date.now(),
        slug: 'author-b-' + Date.now(),
        status: 'ACTIVE',
      },
    });

    const reassignRes = await fetch(`${BASE_URL}/api/admin/authors/${authorAId}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        action: 'reassign',
        articleIds: [testArticle.id],
        newAuthorId: authorB.id,
      }),
    });
    assert(reassignRes.status === 200, 'Reassign article to Author B succeeded (HTTP 200)');
    const checkArticle = await prisma.article.findUnique({ where: { id: testArticle.id } });
    assert(checkArticle.authorId === authorB.id, 'Article authorId successfully updated to Author B');

    // 9. Now Delete Author A (now that content is reassigned)
    const delAuthorARes = await fetch(`${BASE_URL}/api/admin/authors/${authorAId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delAuthorARes.status === 200, 'Author A deleted successfully after article reassignment');

    // 10. Batch Operations: Activate, Deactivate & Delete
    const batchCat1 = await prisma.author.create({
      data: { name: 'ব্যাচ লেখক ১ ' + Date.now(), slug: 'batch-auth-1-' + Date.now(), status: 'ACTIVE', isActive: true },
    });
    const batchCat2 = await prisma.author.create({
      data: { name: 'ব্যাচ লেখক ২ ' + Date.now(), slug: 'batch-auth-2-' + Date.now(), status: 'ACTIVE', isActive: true },
    });

    const batchDeactRes = await fetch(`${BASE_URL}/api/admin/authors/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        action: 'deactivate',
        authorIds: [batchCat1.id, batchCat2.id],
      }),
    });
    assert(batchDeactRes.status === 200, 'Batch deactivate returned 200 OK');
    const checkBatch1 = await prisma.author.findUnique({ where: { id: batchCat1.id } });
    assert(checkBatch1.isActive === false, 'Batch Author 1 isActive is now false');

    const batchDelRes = await fetch(`${BASE_URL}/api/admin/authors/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        action: 'delete',
        authorIds: [batchCat1.id, batchCat2.id],
      }),
    });
    assert(batchDelRes.status === 200, 'Batch delete returned 200 OK');
    const checkBatch2 = await prisma.author.findUnique({ where: { id: batchCat2.id } });
    assert(checkBatch2 === null, 'Batch Author 2 deleted from database');

    // 11. Clean up Author B and test article
    await prisma.article.delete({ where: { id: testArticle.id } });
    await prisma.author.delete({ where: { id: authorB.id } });

    // 12. Check Admin Dashboard & Details Page HTTP 200
    const pageRes = await fetch(`${BASE_URL}/admin/authors`, {
      headers: { Cookie: adminCookie },
    });
    assert(pageRes.status === 200, 'Admin authors dashboard page accessible (HTTP 200)');

    const sampleAuthor = await prisma.author.findFirst();
    if (sampleAuthor) {
      const detailsPageRes = await fetch(`${BASE_URL}/admin/authors/${sampleAuthor.id}`, {
        headers: { Cookie: adminCookie },
      });
      assert(detailsPageRes.status === 200, `Admin author details page accessible for ${sampleAuthor.name} (HTTP 200)`);
    }

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

runAuthorTests();

