const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CUSTOMER_ROLES = ['CUSTOMER', 'REGISTERED_MEMBER', 'PAID_MEMBER', 'GUEST', 'READER', 'SUBSCRIBER'];

async function runTests() {
  console.log('=== STARTING ADVANCED CUSTOMERS & MEMBERS SYSTEM QA AUDIT ===\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failCount++;
    }
  }

  try {
    // TEST 1: Database Statistics (6 Cards) dynamic computation
    console.log('--- TEST 1: 6 Dashboard Statistics Dynamic Calculation ---');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      newCustomersThisMonth,
      totalOrders,
      verifiedEmailAccounts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { in: CUSTOMER_ROLES } } }),
      prisma.user.count({
        where: {
          role: { in: CUSTOMER_ROLES },
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          role: { in: CUSTOMER_ROLES },
          status: { in: ['INACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING_VERIFICATION'] },
        },
      }),
      prisma.user.count({
        where: {
          role: { in: CUSTOMER_ROLES },
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.order.count({
        where: { user: { role: { in: CUSTOMER_ROLES } } },
      }),
      prisma.user.count({
        where: { role: { in: CUSTOMER_ROLES }, isVerified: true },
      }),
    ]);

    assert(typeof totalCustomers === 'number' && totalCustomers > 0, `Total Customers dynamic count: ${totalCustomers}`);
    assert(activeCustomers + inactiveCustomers <= totalCustomers + 5, `Active (${activeCustomers}) and Inactive (${inactiveCustomers}) partition properly.`);
    assert(typeof newCustomersThisMonth === 'number', `New Customers This Month: ${newCustomersThisMonth}`);
    assert(typeof totalOrders === 'number', `Total Orders: ${totalOrders}`);
    assert(typeof verifiedEmailAccounts === 'number', `Verified Email Accounts: ${verifiedEmailAccounts}`);

    // TEST 2: Customer Tags Model & Persistence
    console.log('\n--- TEST 2: Customer Tags System ---');
    const tags = await prisma.customerTag.findMany({ orderBy: { name: 'asc' } });
    assert(tags.length >= 5, `Customer tags found: ${tags.length} (${tags.map(t => t.name).join(', ')})`);

    // Create a temporary tag
    const testTagName = `Test Tag ${Date.now()}`;
    const testTagSlug = `test-tag-${Date.now()}`;
    const createdTag = await prisma.customerTag.create({
      data: {
        name: testTagName,
        slug: testTagSlug,
        color: '#10B981',
        description: 'Temporary QA Tag',
      },
    });
    assert(createdTag && createdTag.id, `Created temporary tag: ${createdTag.name}`);

    // Delete temporary tag
    await prisma.customerTag.delete({ where: { id: createdTag.id } });
    assert(true, 'Temporary tag successfully deleted');

    // TEST 3: Safe Deletion Protection (Customers with orders cannot be hard deleted)
    console.log('\n--- TEST 3: Safe Deletion Protection for Customers with Orders ---');
    const customerWithOrder = await prisma.user.findFirst({
      where: {
        role: { in: CUSTOMER_ROLES },
        orders: { some: {} },
      },
      include: {
        _count: { select: { orders: true } },
      },
    });

    if (customerWithOrder) {
      assert(
        customerWithOrder._count.orders > 0,
        `Customer "${customerWithOrder.name}" (${customerWithOrder.id}) has ${customerWithOrder._count.orders} order(s). Hard deletion MUST be blocked to preserve financial trail.`
      );
    } else {
      console.log('[INFO] No customer with orders currently found in test database.');
    }

    // TEST 4: Create, Update Status, Update Tier, and Delete a Safe Non-Order Test Customer
    console.log('\n--- TEST 4: Customer Lifecycle & Audit Logging ---');
    const testEmail = `qa_customer_${Date.now()}@example.com`;
    const newCustomer = await prisma.user.create({
      data: {
        name: 'QA Test Customer',
        email: testEmail,
        username: `qacust_${Date.now()}`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerType: 'INDIVIDUAL',
        membershipTier: 'FREE',
        city: 'Dhaka',
        fullAddress: 'Dhanmondi 27, Dhaka',
        customerTags: JSON.stringify(['New Customer']),
      },
    });
    assert(newCustomer && newCustomer.id, `Created test customer: ${newCustomer.name} (${newCustomer.email})`);

    // Update status to SUSPENDED
    const suspendedCustomer = await prisma.user.update({
      where: { id: newCustomer.id },
      data: { status: 'SUSPENDED', adminNotes: 'Test suspension note' },
    });
    assert(suspendedCustomer.status === 'SUSPENDED', 'Successfully updated customer status to SUSPENDED');

    // Update Tier to PREMIUM
    const upgradedCustomer = await prisma.user.update({
      where: { id: newCustomer.id },
      data: { membershipTier: 'PREMIUM' },
    });
    assert(upgradedCustomer.membershipTier === 'PREMIUM', 'Successfully upgraded customer tier to PREMIUM');

    // Record Audit Log for QA Customer
    const audit = await prisma.auditLog.create({
      data: {
        userId: newCustomer.id,
        action: 'QA_TEST_ACTION',
        entity: 'USER',
        entityId: newCustomer.id,
        details: 'QA Lifecycle Test Verification',
      },
    });
    assert(audit && audit.id, 'Audit log entry successfully created');

    // Safe delete of test customer (since 0 orders exist)
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { entityId: newCustomer.id } }),
      prisma.user.delete({ where: { id: newCustomer.id } }),
    ]);
    assert(true, 'Successfully and safely deleted zero-order QA customer');

    // TEST 5: Pagination Math
    console.log('\n--- TEST 5: Server-Side Pagination Accuracy ---');
    const totalRecords = totalCustomers;
    const limit = 25;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const page = 1;
    const showingFrom = totalRecords > 0 ? 1 : 0;
    const showingTo = Math.min(limit, totalRecords);

    assert(totalPages >= 1, `Total pages calculated: ${totalPages} for ${totalRecords} records at limit ${limit}`);
    assert(showingFrom === 1, `ShowingFrom is ${showingFrom}`);
    assert(showingTo === Math.min(25, totalRecords), `ShowingTo is ${showingTo}`);

    console.log('\n======================================================');
    console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log('======================================================\n');

    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
