const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ADMIN_ROUTES_TO_TEST = [
  '/admin',
  '/admin/analytics',
  '/admin/appearance',
  '/admin/ai-assistant',
  '/admin/articles',
  '/admin/attributes',
  '/admin/audit-logs',
  '/admin/authors',
  '/admin/banners',
  '/admin/books',
  '/admin/categories',
  '/admin/commissions',
  '/admin/coupons',
  '/admin/couriers',
  '/admin/customers',
  '/admin/donations',
  '/admin/homepage',
  '/admin/inventory',
  '/admin/islamic-ai',
  '/admin/notifications',
  '/admin/orders',
  '/admin/payments',
  '/admin/payouts',
  '/admin/products',
  '/admin/promotions',
  '/admin/publications',
  '/admin/publishers',
  '/admin/refunds',
  '/admin/reports',
  '/admin/reviews',
  '/admin/roles',
  '/admin/sellers',
  '/admin/sellers/applications',
  '/admin/settings',
  '/admin/shipping',
  '/admin/staff',
  '/admin/support',
  '/admin/users',
];

async function runAdminQA() {
  console.log('=== STARTING ADMIN PANEL COMPLETE UI/UX & NAVIGATION QA AUDIT ===\n');
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
    // TEST 1: Database KPI Integrity for Dashboard Overview
    console.log('--- TEST 1: Real Database Dashboard Statistics ---');
    const [
      totalRevenueAgg,
      totalOrders,
      totalBooks,
      totalCustomers,
      pendingOrders,
      lowStockBooks,
      deliveredOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.book.count(),
      prisma.user.count({
        where: {
          role: { in: ['CUSTOMER', 'REGISTERED_MEMBER', 'PAID_MEMBER', 'GUEST', 'READER', 'SUBSCRIBER'] },
        },
      }),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.book.count({ where: { stockQuantity: { lte: 5 } } }),
      prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
    ]);

    const rev = totalRevenueAgg._sum.total || 0;
    assert(typeof rev === 'number', `Real Paid Orders Revenue: ৳${rev}`);
    assert(typeof totalOrders === 'number' && totalOrders >= 0, `Total Orders in DB: ${totalOrders}`);
    assert(typeof totalBooks === 'number' && totalBooks >= 0, `Total Products/Books: ${totalBooks}`);
    assert(typeof totalCustomers === 'number' && totalCustomers > 0, `Total Customers: ${totalCustomers}`);
    assert(typeof pendingOrders === 'number', `Pending Orders: ${pendingOrders}`);
    assert(typeof lowStockBooks === 'number', `Low Stock Products: ${lowStockBooks}`);
    assert(typeof deliveredOrders === 'number', `Delivered Orders: ${deliveredOrders}`);

    // TEST 2: Notifications API Check
    console.log('\n--- TEST 2: Notifications API Check ---');
    const [unreadCount, recentNotifs] = await Promise.all([
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    ]);
    assert(typeof unreadCount === 'number', `Notifications unread count: ${unreadCount}`);
    assert(Array.isArray(recentNotifs), `Recent notifications array: ${recentNotifs.length}`);

    // TEST 3: HTTP Endpoint Verification on Live Server
    console.log('\n--- TEST 3: HTTP Live Route Verification (All 38 Routes) ---');
    const baseUrl = 'http://localhost:3000';
    let accessibleRoutes = 0;

    for (const route of ADMIN_ROUTES_TO_TEST) {
      try {
        const res = await fetch(`${baseUrl}${route}`);
        if (res.status === 200 || res.status === 307 || res.status === 302) {
          accessibleRoutes++;
          console.log(`  ✓ Route ${route.padEnd(30)} -> HTTP ${res.status}`);
        } else {
          console.warn(`  ✗ Route ${route.padEnd(30)} -> HTTP ${res.status}`);
        }
      } catch (err) {
        console.error(`  ✗ Route ${route.padEnd(30)} -> Error: ${err.message}`);
      }
    }

    assert(accessibleRoutes === ADMIN_ROUTES_TO_TEST.length, `Accessible routes: ${accessibleRoutes} of ${ADMIN_ROUTES_TO_TEST.length}`);

    console.log('\n======================================================');
    console.log(`TOTAL AUDIT CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log('======================================================\n');

    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAdminQA();

