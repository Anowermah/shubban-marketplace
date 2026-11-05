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

async function runPublisherTests() {
  console.log('======================================================================');
  console.log('   TEST SUITE: PUBLISHER PROFILE & PUBLICATION MANAGEMENT SYSTEM');
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

  let createdPublisherId = null;
  let targetPublisherId = null;
  let testBookId = null;

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
    const unauthRes = await fetch(`${BASE_URL}/api/admin/publishers`);
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated GET /api/admin/publishers rejected (401/403)');

    if (customerCookie) {
      const custRes = await fetch(`${BASE_URL}/api/admin/publishers`, {
        headers: { Cookie: customerCookie },
      });
      assert(custRes.status === 403, 'Customer role access to /api/admin/publishers rejected with 403');
    }

    // 3. Admin GET /api/admin/publishers: Real DB Statistics & List
    const listRes = await fetch(`${BASE_URL}/api/admin/publishers?page=1&limit=10`, {
      headers: { Cookie: adminCookie },
    });
    assert(listRes.status === 200, 'Admin can fetch /api/admin/publishers (200)');
    const listData = await listRes.json();
    assert(listData.success === true, 'Response contains success=true');
    assert(listData.stats && typeof listData.stats.totalPublishers === 'number', 'Stats totalPublishers is a valid number');
    assert(typeof listData.stats.activePublishers === 'number', 'Stats activePublishers is a valid number');
    assert(typeof listData.stats.totalPublishedContent === 'number', 'Stats totalPublishedContent is a valid number');
    assert(Array.isArray(listData.publishers), 'Response contains publishers array');
    console.log(`  [INFO] Real DB Stats: Total Pubs=${listData.stats.totalPublishers}, Active=${listData.stats.activePublishers}, Published Content=${listData.stats.totalPublishedContent}`);

    // 4. Create Publisher with Auto Slug & Full Details
    const createPayload = {
      name: 'টেস্ট প্রকাশনী সংস্থা ' + Date.now().toString().slice(-4),
      nameEn: 'Test Publisher Press',
      publisherType: 'COMMERCIAL',
      description: 'ইসলামিক ও গবেষণামূলক বই প্রকাশের অন্যতম শীর্ষ প্রতিষ্ঠান।',
      descriptionDetails: '১৯৯৮ সাল থেকে সুনামের সাথে সৃজনশীল পাণ্ডুলিপি প্রকাশ করে আসছে।',
      contactPerson: 'মাওলানা মাহমুদ হাসান',
      email: `test-publisher-${Date.now()}@example.com`,
      phone: '01711000000',
      altPhone: '01811000000',
      website: 'https://testpublisher.example.com',
      country: 'বাংলাদেশ',
      city: 'ঢাকা',
      address: '৩৮/২ বাংলাবাজার, ঢাকা',
      regNumber: 'TR-PUB-99120',
      binNumber: '003928172-0101',
      establishedYear: 1998,
      organizationType: 'LIMITED',
      mainCategory: 'কুরআন ও হাদিস গবেষণা',
      specialization: 'ক্লাসিক্যাল তাফসির অনুবাদ',
      facebook: 'https://facebook.com/testpublisher',
      status: 'ACTIVE',
      isActive: true,
      isVerified: true,
      isFeatured: false,
    };

    const createRes = await fetch(`${BASE_URL}/api/admin/publishers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(createPayload),
    });

    assert(createRes.status === 201, 'POST /api/admin/publishers creates new publisher (201)');
    const createData = await createRes.json();
    assert(createData.success === true, 'Create response has success=true');
    assert(createData.publisher && createData.publisher.id, 'Created publisher has an id');
    createdPublisherId = createData.publisher.id;
    assert(createData.publisher.slug && createData.publisher.slug.length > 0, `Auto-generated slug: ${createData.publisher.slug}`);

    // Verify AuditLog was recorded
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: createdPublisherId, action: 'CREATE_PUBLISHER' },
    });
    assert(auditLog !== null, 'AuditLog entry created for CREATE_PUBLISHER');

    // 5. Update Publisher Details (PATCH)
    const updateRes = await fetch(`${BASE_URL}/api/admin/publishers/${createdPublisherId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        isFeatured: true,
        specialization: 'আধুনিক ইসলামিক অর্থনীতি ও ফিকহ',
      }),
    });
    assert(updateRes.status === 200, 'PATCH /api/admin/publishers/[id] updates publisher (200)');
    const updateData = await updateRes.json();
    assert(updateData.publisher.isFeatured === true, 'isFeatured updated to true');
    assert(updateData.publisher.specialization === 'আধুনিক ইসলামিক অর্থনীতি ও ফিকহ', 'Specialization updated');

    // 6. Test Single Publisher GET & Profile Completion
    const getSingleRes = await fetch(`${BASE_URL}/api/admin/publishers/${createdPublisherId}`, {
      headers: { Cookie: adminCookie },
    });
    assert(getSingleRes.status === 200, 'GET /api/admin/publishers/[id] returns publisher details (200)');
    const singleData = await getSingleRes.json();
    assert(typeof singleData.publisher.profileCompletion === 'number', `Profile completion calculated: ${singleData.publisher.profileCompletion}%`);
    assert(singleData.publisher.profileCompletion > 50, 'High profile completion score achieved');

    // 7. Deletion Guard Test: Attach a publication and try to delete
    const sampleAuthor = await prisma.author.findFirst();
    const sampleCategory = await prisma.category.findFirst();

    if (sampleAuthor && sampleCategory) {
      const book = await prisma.book.create({
        data: {
          title: 'টেস্ট বই প্রকাশনা প্রটেকশন',
          slug: `test-book-protection-${Date.now()}`,
          price: 350,
          coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
          description: 'টেস্ট বই বিবরণ',
          authorId: sampleAuthor.id,
          categoryId: sampleCategory.id,
          publisherId: createdPublisherId,
        },
      });
      testBookId = book.id;
      console.log(`  [INFO] Created sample book attached to publisher: ${book.title}`);

      // Attempt to delete publisher with active publication -> MUST BE REJECTED
      const blockedDeleteRes = await fetch(`${BASE_URL}/api/admin/publishers/${createdPublisherId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      assert(blockedDeleteRes.status === 400, 'DELETE guarded: returns 400 when active publications exist');
      const blockedData = await blockedDeleteRes.json();
      assert(blockedData.hasPublications === true, 'Response indicates hasPublications=true');
      console.log(`  [OK] Deletion Guard successfully prevented deleting publisher with ${blockedData.totalPublications} publications.`);

      // 8. Publications Reassignment Feature
      // Create a second target publisher
      const targetPubRes = await fetch(`${BASE_URL}/api/admin/publishers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          name: 'টার্গেট প্রকাশনী রিসিভার ' + Date.now().toString().slice(-4),
        }),
      });
      const targetPubData = await targetPubRes.json();
      targetPublisherId = targetPubData.publisher.id;

      // Reassign all publications from createdPublisherId to targetPublisherId
      const reassignRes = await fetch(`${BASE_URL}/api/admin/publishers/${createdPublisherId}/publications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          targetPublisherId,
          reassignAll: true,
        }),
      });
      assert(reassignRes.status === 200, 'POST /api/admin/publishers/[id]/publications reassigns publications (200)');
      const reassignData = await reassignRes.json();
      assert(reassignData.success === true && reassignData.totalReassigned >= 1, `Reassigned ${reassignData.totalReassigned} publications`);

      // Verify book is now linked to target publisher
      const updatedBook = await prisma.book.findUnique({ where: { id: testBookId } });
      assert(updatedBook.publisherId === targetPublisherId, 'Book successfully moved to target publisher');

      // Now source publisher has 0 publications; deletion should succeed!
      const allowedDeleteRes = await fetch(`${BASE_URL}/api/admin/publishers/${createdPublisherId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      assert(allowedDeleteRes.status === 200, 'DELETE succeeds (200) once publications are safely reassigned');
      createdPublisherId = null; // Marked as deleted
    }

    // 9. Batch Operations Test
    const b1 = await prisma.publisher.create({
      data: { name: 'ব্যাচ টেস্ট ১ ' + Date.now(), slug: 'batch-test-1-' + Date.now(), status: 'INACTIVE', isActive: false },
    });
    const b2 = await prisma.publisher.create({
      data: { name: 'ব্যাচ টেস্ট ২ ' + Date.now(), slug: 'batch-test-2-' + Date.now(), status: 'INACTIVE', isActive: false },
    });

    const batchActivateRes = await fetch(`${BASE_URL}/api/admin/publishers/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        action: 'activate',
        ids: [b1.id, b2.id],
      }),
    });
    assert(batchActivateRes.status === 200, 'Batch activate returns 200');
    const batchActData = await batchActivateRes.json();
    assert(batchActData.affectedCount === 2, 'Batch activate affected 2 publishers');

    // Batch Safe Delete
    const batchDelRes = await fetch(`${BASE_URL}/api/admin/publishers/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        action: 'delete',
        ids: [b1.id, b2.id],
      }),
    });
    assert(batchDelRes.status === 200, 'Batch delete returns 200');
    const batchDelData = await batchDelRes.json();
    assert(batchDelData.affectedCount === 2, 'Batch safely deleted both test publishers');

    // Clean up target publisher and test book if created
    if (testBookId) {
      await prisma.book.delete({ where: { id: testBookId } }).catch(() => {});
    }
    if (targetPublisherId) {
      await prisma.publisher.delete({ where: { id: targetPublisherId } }).catch(() => {});
    }

    // 10. Route Rendering Verification
    const pageRes = await fetch(`${BASE_URL}/admin/publishers`, {
      headers: { Cookie: adminCookie },
    });
    assert(pageRes.status === 200, '/admin/publishers page renders with HTTP 200');

    const firstPub = await prisma.publisher.findFirst();
    if (firstPub) {
      const detailsPageRes = await fetch(`${BASE_URL}/admin/publishers/${firstPub.id}`, {
        headers: { Cookie: adminCookie },
      });
      assert(detailsPageRes.status === 200, `/admin/publishers/[id] renders with HTTP 200 for ${firstPub.name}`);
    }

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Cleanup if anything left over
    if (createdPublisherId) {
      await prisma.publisher.delete({ where: { id: createdPublisherId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  console.log('======================================================================');
  console.log(`   TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) process.exit(1);
}

runPublisherTests();

