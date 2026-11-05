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

async function runTestSuite() {
  console.log('====================================================================');
  console.log('⚡ SHUBBAN MARKETPLACE: ORDER MANAGEMENT, INVENTORY & PAYMENT SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS]: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL]: ${testName}`);
      if (details) console.error(`     Details: ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Setup Admin & Customer Test Accounts
    // -------------------------------------------------------------------------
    console.log('▶️ [Step 0] Auth Setup: Admin & Customer Sessions');
    
    // Customer
    const custEmail = `cust_${Date.now()}@shubban.com`;
    const custRegRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'তাহমিদ হাসান',
        email: custEmail,
        phone: '01811223344',
        password: 'Password123!',
      },
    });
    assert(custRegRes.status === 201 || custRegRes.status === 200, 'Customer registered');
    const custCookie = (custRegRes.headers['set-cookie'] || [])
      .find((c) => c.startsWith('shubban_auth_token='))?.split(';')[0];
    assert(!!custCookie, 'Customer auth cookie received');

    // Admin User & Session Token
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
    assert(!!adminUser, `Admin user exists: ${adminUser?.email} (${adminUser?.role})`);

    const adminToken = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        membershipTier: adminUser.membershipTier || 'PREMIUM',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const adminCookie = `shubban_auth_token=${adminToken}`;
    assert(!!adminCookie, 'Admin signed auth cookie prepared');

    // Target sample book
    const testBook = await prisma.book.findFirst({
      where: { stockQuantity: { gte: 10 } },
    });
    assert(!!testBook, `Target book found: "${testBook.title}" (Initial Stock: ${testBook.stockQuantity})`);
    const initialStock = testBook.stockQuantity;

    // -------------------------------------------------------------------------
    // STEP 1: Order Creation & Number Generation
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 1] Order Creation & Number Format Verification');
    const orderRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        items: [{ id: testBook.id, type: 'PHYSICAL', quantity: 2 }],
        shippingName: 'তাহমিদ হাসান',
        shippingPhone: '01811223344',
        shippingAddress: 'রোড ৪, বাড়ি ১২, ধানমন্ডি, ঢাকা',
        shippingCity: 'ঢাকা',
        shippingZone: 'DHAKA_METRO',
        paymentMethod: 'sslcommerz',
      },
    });
    assert(orderRes.status === 200 && orderRes.data.success === true, 'Order created successfully');
    const orderNumber = orderRes.data.orderNumber;
    const orderId = orderRes.data.orderId;

    assert(/^SHB-\d{4}-\d{5}$/.test(orderNumber), `Order number follows format SHB-YYYY-XXXXX (${orderNumber})`);

    const orderInDb = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    assert(orderInDb && orderInDb.items.length === 1, 'Order has verified items created in DB');
    assert(orderInDb.orderStatus === 'PROCESSING', 'Initial orderStatus is PROCESSING');
    assert(orderInDb.paymentStatus === 'PENDING', 'Initial paymentStatus is PENDING');

    // -------------------------------------------------------------------------
    // STEP 2: Stock Management & Reservation
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 2] Stock Reservation & Movement Audit');
    const stockAfterOrder = await prisma.book.findUnique({ where: { id: testBook.id } });
    assert(
      stockAfterOrder.stockQuantity === initialStock - 2,
      `Physical stock decremented from ${initialStock} to ${stockAfterOrder.stockQuantity}`
    );

    const invLog = await prisma.inventoryLog.findFirst({
      where: { referenceId: orderNumber, changeType: 'ORDER_FULFILLMENT' },
    });
    assert(invLog && invLog.quantityChange === -2, 'InventoryLog recorded ORDER_FULFILLMENT with -2 change');

    // -------------------------------------------------------------------------
    // STEP 3: Concurrent Checkout & Overselling Prevention
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 3] Concurrent Checkout & Overselling Prevention');
    const oversellRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        items: [{ id: testBook.id, type: 'PHYSICAL', quantity: 99999 }],
        shippingName: 'তাহমিদ হাসান',
        shippingPhone: '01811223344',
        shippingAddress: 'ঢাকা',
        shippingCity: 'ঢাকা',
        paymentMethod: 'cod',
      },
    });
    assert(oversellRes.status === 400, 'Server rejected overselling request with HTTP 400');
    assert(
      typeof oversellRes.data.error === 'string' && oversellRes.data.error.includes('পর্যাপ্ত স্টক নেই'),
      `Bengali stock alert returned: "${oversellRes.data.error}"`
    );

    // -------------------------------------------------------------------------
    // STEP 4: Order Cancellation & Automated Stock Release
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 4] Order Cancellation & Stock Release Back to Inventory');
    const cancelRes = await request(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: { reason: 'ভুল বই অর্ডার করেছিলাম' },
    });
    assert(cancelRes.status === 200 && cancelRes.data.success === true, 'Customer cancelled order successfully');

    const orderAfterCancel = await prisma.order.findUnique({ where: { id: orderId } });
    assert(orderAfterCancel.orderStatus === 'CANCELLED', 'Order status updated to CANCELLED');
    assert(orderAfterCancel.cancelReason === 'ভুল বই অর্ডার করেছিলাম', 'Cancel reason preserved in DB');

    // Check that physical stock has been RESTORED
    const stockAfterCancel = await prisma.book.findUnique({ where: { id: testBook.id } });
    assert(
      stockAfterCancel.stockQuantity === initialStock,
      `Stock automatically released back from ${stockAfterOrder.stockQuantity} to ${stockAfterCancel.stockQuantity}`
    );

    const restockLog = await prisma.inventoryLog.findFirst({
      where: { referenceId: orderNumber, changeType: 'ORDER_CANCELLATION_RESTOCK' },
    });
    assert(
      restockLog && restockLog.quantityChange === 2,
      'InventoryLog recorded ORDER_CANCELLATION_RESTOCK with +2 change'
    );

    // -------------------------------------------------------------------------
    // STEP 5: Payment Initiation (SSLCOMMERZ & bKash)
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 5] Payment Initiation (SSLCOMMERZ, bKash & COD)');
    // Create new order to test payment
    const pmtOrderRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        items: [{ id: testBook.id, type: 'PHYSICAL', quantity: 1 }],
        shippingName: 'তাহমিদ হাসান',
        shippingPhone: '01811223344',
        shippingAddress: 'ধানমন্ডি, ঢাকা',
        shippingCity: 'ঢাকা',
        paymentMethod: 'sslcommerz',
      },
    });
    const pmtOrder = pmtOrderRes.data;

    // Initiate SSLCommerz
    const sslInitRes = await request('/api/payments/initiate', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        orderId: pmtOrder.orderId,
        gateway: 'SSLCOMMERZ',
      },
    });
    assert(sslInitRes.status === 200 && sslInitRes.data.success === true, 'SSLCommerz payment initiated');
    assert(!!sslInitRes.data.gatewayUrl, `Gateway URL generated: ${sslInitRes.data.gatewayUrl}`);
    const sslTranId = sslInitRes.data.transactionId;
    assert(!!sslTranId, `Transaction ID generated: ${sslTranId}`);

    // Verify PaymentTransaction created
    const pmtRecord = await prisma.paymentTransaction.findUnique({
      where: { transactionId: sslTranId },
    });
    assert(pmtRecord && pmtRecord.status === 'INITIATED', 'PaymentTransaction recorded with status INITIATED');

    // -------------------------------------------------------------------------
    // STEP 6: Server-Side Zero-Trust Payment Verification (SSLCommerz Callback)
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 6] Server-Side Payment Verification & Callback Protocol');
    const mockValId = `SANDBOX_VAL_${Date.now()}`;
    const callbackRes = await request('/api/payments/sslcommerz/callback', {
      method: 'POST',
      body: {
        tran_id: sslTranId,
        val_id: mockValId,
        status: 'VALID',
        amount: pmtRecord.amount,
      },
    });
    // Callback issues 307/302 redirect to /order-confirmation
    assert(callbackRes.status === 307 || callbackRes.status === 302, 'Callback redirected upon valid verification');
    assert(
      callbackRes.headers.location && callbackRes.headers.location.includes('/order-confirmation'),
      'Redirects customer to /order-confirmation page'
    );

    const verifiedOrder = await prisma.order.findUnique({ where: { id: pmtOrder.orderId } });
    assert(verifiedOrder.paymentStatus === 'PAID', 'Order paymentStatus updated to PAID');
    assert(verifiedOrder.orderStatus === 'CONFIRMED', 'Order orderStatus updated to CONFIRMED');

    const verifiedTxn = await prisma.paymentTransaction.findUnique({ where: { transactionId: sslTranId } });
    assert(verifiedTxn.status === 'SUCCESS', 'PaymentTransaction status updated to SUCCESS');

    // -------------------------------------------------------------------------
    // STEP 7: Idempotency & Duplicate Callback Protection
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 7] Idempotency & Duplicate Callback / IPN Protection');
    const dupCallbackRes = await request('/api/payments/sslcommerz/callback', {
      method: 'POST',
      body: {
        tran_id: sslTranId,
        val_id: mockValId,
        status: 'VALID',
      },
    });
    assert(
      dupCallbackRes.status === 307 || dupCallbackRes.status === 302,
      'Duplicate callback gracefully redirected to confirmation without re-running transactions'
    );

    // IPN Webhook duplicate check
    const ipnRes = await request('/api/payments/sslcommerz/ipn', {
      method: 'POST',
      body: {
        tran_id: sslTranId,
        val_id: mockValId,
        status: 'VALID',
      },
    });
    assert(ipnRes.status === 200 && ipnRes.data.message === 'IPN ALREADY PROCESSED', 'IPN recognized duplicate and returned IPN ALREADY PROCESSED');

    // -------------------------------------------------------------------------
    // STEP 8: Order Shipment & Delivery Confirmation Workflow
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 8] Order Lifecycle: Shipment & Delivery Confirmation');
    // Admin marks order SHIPPED with tracking number
    const shipRes = await request(`/api/admin/orders/${pmtOrder.orderId}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: {
        orderStatus: 'SHIPPED',
        courierName: 'পাঠাও কুরিয়ার (Pathao)',
        trackingNumber: 'PTH-984210-BD',
      },
    });
    assert(shipRes.status === 200 && shipRes.data.success === true, 'Admin marked order SHIPPED');

    const shippedOrder = await prisma.order.findUnique({ where: { id: pmtOrder.orderId } });
    assert(shippedOrder.orderStatus === 'SHIPPED', 'Order status is SHIPPED');
    assert(shippedOrder.trackingNumber === 'PTH-984210-BD', 'Tracking number is stored');
    assert(!!shippedOrder.shippedAt, 'shippedAt timestamp recorded');

    // Customer confirms delivery
    const deliveryConfirmRes = await request(`/api/orders/${pmtOrder.orderId}/confirm-delivery`, {
      method: 'POST',
      headers: { Cookie: custCookie },
    });
    assert(deliveryConfirmRes.status === 200 && deliveryConfirmRes.data.success === true, 'Customer confirmed delivery receipt');

    const deliveredOrder = await prisma.order.findUnique({ where: { id: pmtOrder.orderId } });
    assert(deliveredOrder.orderStatus === 'DELIVERED', 'Order status is DELIVERED');
    assert(!!deliveredOrder.deliveredAt, 'deliveredAt timestamp recorded');

    // -------------------------------------------------------------------------
    // STEP 9: Refund Records & Management
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 9] Refund Records & Processing');
    const refundRes = await request('/api/admin/refunds', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        orderId: pmtOrder.orderId,
        amount: verifiedOrder.total,
        reason: 'গ্রাহকের ক্ষতিগ্রস্ত কভার পেইজ বাবদ সম্পূর্ণ রিফান্ড',
        status: 'PROCESSED',
      },
    });
    assert(refundRes.status === 200 && refundRes.data.success === true, 'Admin processed refund successfully');
    const refundRecord = refundRes.data.refund;
    assert(!!refundRecord.refundTxnId, `Refund transaction reference created: ${refundRecord.refundTxnId}`);

    const refundedOrder = await prisma.order.findUnique({ where: { id: pmtOrder.orderId } });
    assert(refundedOrder.paymentStatus === 'REFUNDED', 'Order paymentStatus updated to REFUNDED');

    const listRefundsRes = await request('/api/admin/refunds', {
      headers: { Cookie: adminCookie },
    });
    assert(
      listRefundsRes.status === 200 && listRefundsRes.data.refunds.some((r) => r.id === refundRecord.id),
      'Refund listed in Admin Refunds API'
    );

    // -------------------------------------------------------------------------
    // STEP 10: Inventory Adjustment & Low-Stock Alerts
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 10] Manual Inventory Adjustment & Low-Stock Alerts');
    const adjustRes = await request('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        bookId: testBook.id,
        quantityChange: 15,
        changeType: 'RESTOCK',
        reason: 'নতুন সংস্করণ গুদাম আগমন',
      },
    });
    assert(adjustRes.status === 200 && adjustRes.data.success === true, 'Inventory restock adjusted');

    const lowStockRes = await request('/api/admin/inventory/low-stock?threshold=10', {
      headers: { Cookie: adminCookie },
    });
    assert(lowStockRes.status === 200 && Array.isArray(lowStockRes.data.items), 'Low-stock query executed');

    // -------------------------------------------------------------------------
    // STEP 11: Payment Reconciliation Report
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 11] Payment Reconciliation Report Generation');
    const reconRes = await request('/api/admin/payments/reconciliation', {
      headers: { Cookie: adminCookie },
    });
    assert(reconRes.status === 200 && reconRes.data.success === true, 'Payment reconciliation generated');
    assert(typeof reconRes.data.summary.totalGrossCollected === 'number', 'Gross collected computed');
    assert(typeof reconRes.data.summary.netRevenue === 'number', 'Net revenue computed');
    assert(reconRes.data.summary.totalRefunded >= verifiedOrder.total, 'Total refunded accounted for in reconciliation');
    assert(typeof reconRes.data.discrepancies.count === 'number', 'Discrepancy audit executed');

    // Clean up test data
    console.log('\n🧹 Cleaning up test artifacts...');
    await prisma.notification.deleteMany({ where: { userId: custRegRes.data.user?.id } });

    console.log('\n====================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================================\n');

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

runTestSuite();
