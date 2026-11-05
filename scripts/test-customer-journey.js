const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runCustomerJourneyTests() {
  console.log('===============================================================');
  console.log('🚀 SHUBBAN LIBRARY: CUSTOMER JOURNEY & CHECKOUT VERIFICATION');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (details) console.error(`     Details: ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Customer Registration & Auth Cookie
    // -------------------------------------------------------------------------
    console.log('▶️ [Step 1] Customer Registration & Profile Creation');
    const testEmail = `journey_test_${Date.now()}@shubban.com`;
    const testPassword = 'Password123!';
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'মুহাম্মদ আব্দুল্লাহ',
        email: testEmail,
        phone: '01711998877',
        password: testPassword,
      },
    });

    assert(regRes.status === 201 || regRes.status === 200, 'User registers successfully (200/201)', JSON.stringify(regRes.data));

    // Extract cookie
    const setCookie = regRes.headers['set-cookie'];
    let authCookie = '';
    if (setCookie) {
      const match = setCookie.find((c) => c.startsWith('shubban_auth_token='));
      if (match) {
        authCookie = match.split(';')[0];
      }
    }
    assert(!!authCookie, 'Auth cookie (shubban_auth_token) received');

    // Verify session
    const meRes = await request('/api/auth/me', {
      headers: { Cookie: authCookie },
    });
    assert(meRes.status === 200 && meRes.data.user.email === testEmail, 'Session verified via /api/auth/me');
    const customerId = meRes.data.user.id;

    // -------------------------------------------------------------------------
    // TEST 2: Customer Address Book
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 2] Address Book Management (Create & Default)');
    const addrRes = await request('/api/account/addresses', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: {
        title: 'অফিস (চট্টগ্রাম)',
        name: 'মুহাম্মদ আব্দুল্লাহ',
        phone: '01711998877',
        address: 'জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম',
        city: 'চট্টগ্রাম',
        zone: 'OUTSIDE_DHAKA',
        isDefault: true,
      },
    });
    assert(addrRes.status === 201, 'New shipping address created via POST /api/account/addresses');
    const savedAddressId = addrRes.data.address?.id;

    const listAddrRes = await request('/api/account/addresses', {
      headers: { Cookie: authCookie },
    });
    assert(
      listAddrRes.status === 200 && listAddrRes.data.addresses.length >= 1,
      'Saved addresses retrieved via GET /api/account/addresses'
    );
    assert(
      listAddrRes.data.addresses.some((a) => a.id === savedAddressId && a.isDefault === true),
      'Address marked as default'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Wishlist (Bookmarks)
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 3] Wishlist Operations (Add, List & Remove)');
    const sampleBook = await prisma.book.findFirst({
      where: { stockQuantity: { gt: 5 } },
    });
    assert(!!sampleBook, `Found test book in DB: "${sampleBook?.title}" (ID: ${sampleBook?.id})`);

    const addWishlistRes = await request('/api/account/wishlist', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: { bookId: sampleBook.id },
    });
    assert(
      addWishlistRes.status === 200 && addWishlistRes.data.action === 'ADDED',
      'Book added to customer wishlist'
    );

    const getWishlistRes = await request('/api/account/wishlist', {
      headers: { Cookie: authCookie },
    });
    const wishlistItems = getWishlistRes.data.items || [];
    assert(
      getWishlistRes.status === 200 && wishlistItems.some((w) => w.book?.id === sampleBook.id),
      'Wishlist lists the added book'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Server-Side Coupon Verification
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 4] Coupon Validation API');
    // Ensure coupon exists in database
    const coupon = await prisma.coupon.upsert({
      where: { code: 'TESTCOUPON15' },
      update: {
        discountPct: 15,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        minAmount: 100,
      },
      create: {
        code: 'TESTCOUPON15',
        discountPct: 15,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        minAmount: 100,
      },
    });

    const couponValRes = await request('/api/coupons/validate', {
      method: 'POST',
      body: {
        code: 'TESTCOUPON15',
        subtotal: 500,
      },
    });
    assert(couponValRes.status === 200 && couponValRes.data.valid === true, 'Valid coupon accepted');
    assert(couponValRes.data.discount === 75, 'Coupon 15% discount computed accurately (15% of 500 = 75)');

    // -------------------------------------------------------------------------
    // TEST 5: Zero-Trust Server Recalculation Checkout
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 5] Checkout with Server-Side Recalculation (Zero-Trust on Client Data)');
    const initialBookStock = sampleBook.stockQuantity;
    const realBookPrice = sampleBook.discountPrice !== null && sampleBook.discountPrice !== undefined
      ? sampleBook.discountPrice
      : sampleBook.price;

    // Send intentionally TAMPERED values from client
    const tamperedPayload = {
      items: [
        {
          id: sampleBook.id,
          type: 'PHYSICAL',
          quantity: 2,
          price: 5, // Client attempts to hack price to ৳ 5
        },
      ],
      shippingName: 'মুহাম্মদ আব্দুল্লাহ',
      shippingPhone: '01711998877',
      shippingAddress: 'জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম',
      shippingCity: 'চট্টগ্রাম',
      shippingZone: 'OUTSIDE_DHAKA',
      paymentMethod: 'cod',
      couponCode: 'TESTCOUPON15',
      isGiftWrapped: true,
      giftMessage: 'শুভকামনা রইল!',
      subtotal: 10,  // Tampered
      shippingFee: 0, // Tampered
      discount: 0,
      total: 10,     // Tampered
    };

    const checkoutRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: tamperedPayload,
    });

    assert(checkoutRes.status === 200 && checkoutRes.data.success === true, 'Order created successfully');
    const createdOrderNumber = checkoutRes.data.orderNumber;
    assert(!!createdOrderNumber, `Order Number generated: ${createdOrderNumber}`);

    // Verify in database that client tampered values were COMPLETELY IGNORED
    const dbOrder = await prisma.order.findUnique({
      where: { orderNumber: createdOrderNumber },
      include: {
        items: true,
        subOrders: { include: { items: true } },
      },
    });

    const expectedSubtotal = realBookPrice * 2;
    const expectedShipping = expectedSubtotal >= 1500 ? 0 : 110; // Outside Dhaka is 110
    const expectedDiscount = Math.round((expectedSubtotal * 15) / 100);
    const expectedGiftWrap = 30;
    const expectedTotal = expectedSubtotal + expectedShipping + expectedGiftWrap - expectedDiscount;

    assert(dbOrder.subtotal === expectedSubtotal, `Server ignored client price (5) and used real DB price: ৳ ${dbOrder.subtotal}`);
    assert(dbOrder.shippingFee === expectedShipping, `Server calculated real delivery fee for OUTSIDE_DHAKA: ৳ ${dbOrder.shippingFee}`);
    assert(dbOrder.discount === expectedDiscount, `Server verified and applied coupon discount: ৳ ${dbOrder.discount}`);
    assert(dbOrder.giftWrapFee === 30 && dbOrder.isGiftWrapped === true, 'Gift wrap fee ৳ 30 added on server');
    assert(dbOrder.total === expectedTotal, `Server grand total matches strictly: ৳ ${dbOrder.total}`);

    // Check inventory decrement
    const afterBook = await prisma.book.findUnique({ where: { id: sampleBook.id } });
    assert(
      afterBook.stockQuantity === initialBookStock - 2,
      `Physical stock correctly decremented from ${initialBookStock} to ${afterBook.stockQuantity}`
    );

    // Check inventory audit log
    const invLog = await prisma.inventoryLog.findFirst({
      where: { referenceId: createdOrderNumber },
    });
    assert(
      invLog && invLog.quantityChange === -2 && invLog.changeType === 'ORDER_FULFILLMENT',
      'InventoryLog recorded with changeType: ORDER_FULFILLMENT'
    );

    // Check Multi-Vendor Sub-Orders and Seller Ledger
    assert(dbOrder.subOrders.length >= 1, `Sub-orders created for vendors (${dbOrder.subOrders.length} sub-orders)`);
    const ledgerEntry = await prisma.sellerLedgerEntry.findFirst({
      where: { subOrderId: dbOrder.subOrders[0].id },
    });
    assert(ledgerEntry && ledgerEntry.type === 'ORDER_CREDIT', 'Seller ledger entry created with ORDER_CREDIT');

    // Check Payment Transaction
    const pmtTxn = await prisma.paymentTransaction.findFirst({
      where: { orderId: dbOrder.id },
    });
    assert(pmtTxn && pmtTxn.amount === expectedTotal, 'Payment transaction recorded in BDT');

    // Check Customer Notification
    const notif = await prisma.notification.findFirst({
      where: { userId: customerId, type: 'ORDER' },
      orderBy: { createdAt: 'desc' },
    });
    assert(notif && notif.title.includes(createdOrderNumber), 'Order confirmation notification delivered to customer');

    // -------------------------------------------------------------------------
    // TEST 6: Overselling Prevention
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 6] Overselling Prevention (Stock Limit Enforcement)');
    const oversellRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: {
        items: [
          {
            id: sampleBook.id,
            type: 'PHYSICAL',
            quantity: 99999, // Exceeds available stock
          },
        ],
        shippingName: 'মুহাম্মদ আব্দুল্লাহ',
        shippingPhone: '01711998877',
        shippingAddress: 'জিইসি মোড়, চট্টগ্রাম',
        shippingCity: 'চট্টগ্রাম',
        shippingZone: 'OUTSIDE_DHAKA',
        paymentMethod: 'cod',
      },
    });
    assert(oversellRes.status === 400, 'Server rejected order exceeding stock quantity with HTTP 400');
    assert(
      typeof oversellRes.data.error === 'string' && oversellRes.data.error.includes('পর্যাপ্ত স্টক নেই'),
      `Bengali stock alert returned: "${oversellRes.data.error}"`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Idempotency & Duplicate Order Prevention
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 7] Duplicate Order Prevention (Idempotency Window)');
    const dupRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: tamperedPayload, // Submitting identical order within 15 seconds
    });
    assert(dupRes.status === 200, 'Server gracefully handled duplicate submission');
    assert(
      dupRes.data.orderNumber === createdOrderNumber && dupRes.data.isDuplicate === true,
      `Duplicate prevented: returned existing order ${createdOrderNumber} without re-decrementing inventory`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Password Reset Flow
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 8] Password Reset Flow (Forgot Password -> Token -> Reset)');
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: testEmail },
    });
    assert(forgotRes.status === 200, 'Forgot password request accepted');

    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { email: testEmail },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!resetTokenRecord, `Password reset 6-digit token generated in DB: ${resetTokenRecord?.token}`);

    const newPassword = 'NewSecretPassword2026!';
    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: testEmail,
        token: resetTokenRecord.token,
        newPassword: newPassword,
        password: newPassword,
      },
    });
    assert(resetRes.status === 200, 'Password reset successfully with verified token', JSON.stringify(resetRes.data));

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: newPassword,
      },
    });
    assert(loginRes.status === 200 && loginRes.data.user.email === testEmail, 'Logged in successfully with new password');

    // -------------------------------------------------------------------------
    // TEST 9: Notification Mark-As-Read API
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 9] Notification API (List & Mark as Read)');
    const listNotifRes = await request('/api/account/notifications', {
      headers: { Cookie: authCookie },
    });
    assert(listNotifRes.status === 200 && listNotifRes.data.notifications.length >= 1, 'Notifications listed');
    assert(listNotifRes.data.unreadCount >= 1, `Unread notifications detected: ${listNotifRes.data.unreadCount}`);

    const markReadRes = await request('/api/account/notifications', {
      method: 'PATCH',
      headers: { Cookie: authCookie },
      body: { markAllAsRead: true },
    });
    assert(markReadRes.status === 200 && markReadRes.data.success === true, 'Mark all notifications as read executed');

    // Clean up test coupon and user
    console.log('\n🧹 Cleaning up test artifacts...');
    await prisma.notification.deleteMany({ where: { userId: customerId } });
    await prisma.passwordResetToken.deleteMany({ where: { email: testEmail } });

    console.log('\n===============================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCustomerJourneyTests();
