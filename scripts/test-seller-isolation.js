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
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runSellerIsolationTests() {
  console.log('\n============================================================');
  console.log('🧪 MULTI-VENDOR SELLER SYSTEM & ISOLATION TEST SUITE');
  console.log('============================================================\n');

  try {
    // -------------------------------------------------------------------------
    // STEP 0: SETUP SELLER A, SELLER B, AND ADMIN SESSIONS
    // -------------------------------------------------------------------------
    console.log('▶️ [Step 0] Setting up Sellers & Authenticated Sessions');

    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
    assert(!!adminUser, `Platform Admin user found: ${adminUser?.email}`);

    const adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const adminCookie = `shubban_auth_token=${adminToken}`;

    // Create or find Seller A
    const sellerAEmail = 'darul_ilm_seller@test.com';
    let sellerAUser = await prisma.user.findUnique({ where: { email: sellerAEmail } });
    if (!sellerAUser) {
      sellerAUser = await prisma.user.create({
        data: {
          email: sellerAEmail,
          name: 'মুফতী মাহমুদ হাসান (দারুল ইলম)',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'PUBLISHER',
          phone: '01711000001',
        },
      });
    }

    let vendorA = await prisma.vendor.findFirst({ where: { slug: 'darul-ilm-test' } });
    if (!vendorA) {
      vendorA = await prisma.vendor.create({
        data: {
          name: 'দারুল ইলম প্রকাশনী',
          slug: 'darul-ilm-test',
          email: sellerAEmail,
          phone: '01711000001',
          address: 'বাংলাবাজার, ঢাকা',
          city: 'ঢাকা',
          status: 'APPROVED',
          isVerified: true,
          commissionRate: 10.0,
          members: {
            create: {
              userId: sellerAUser.id,
              role: 'OWNER',
            },
          },
        },
      });
    } else {
      // Ensure membership exists
      const memA = await prisma.vendorMember.findFirst({
        where: { userId: sellerAUser.id, vendorId: vendorA.id },
      });
      if (!memA) {
        await prisma.vendorMember.create({
          data: { userId: sellerAUser.id, vendorId: vendorA.id, role: 'OWNER' },
        });
      }
    }

    const tokenA = jwt.sign(
      { id: sellerAUser.id, email: sellerAUser.email, name: sellerAUser.name, role: sellerAUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const cookieA = `shubban_auth_token=${tokenA}`;
    assert(!!cookieA, 'Seller A session token created');

    // Create or find Seller B
    const sellerBEmail = 'maktaba_salaf_seller@test.com';
    let sellerBUser = await prisma.user.findUnique({ where: { email: sellerBEmail } });
    if (!sellerBUser) {
      sellerBUser = await prisma.user.create({
        data: {
          email: sellerBEmail,
          name: 'আহমাদুল্লাহ আল-মামুন (মাকতাবাতুস সালাফ)',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'PUBLISHER',
          phone: '01711000002',
        },
      });
    }

    let vendorB = await prisma.vendor.findFirst({ where: { slug: 'maktaba-salaf-test' } });
    if (!vendorB) {
      vendorB = await prisma.vendor.create({
        data: {
          name: 'মাকতাবাতুস সালাফ',
          slug: 'maktaba-salaf-test',
          email: sellerBEmail,
          phone: '01711000002',
          address: 'বংশাল, ঢাকা',
          city: 'ঢাকা',
          status: 'APPROVED',
          isVerified: true,
          commissionRate: 12.0,
          members: {
            create: {
              userId: sellerBUser.id,
              role: 'OWNER',
            },
          },
        },
      });
    } else {
      const memB = await prisma.vendorMember.findFirst({
        where: { userId: sellerBUser.id, vendorId: vendorB.id },
      });
      if (!memB) {
        await prisma.vendorMember.create({
          data: { userId: sellerBUser.id, vendorId: vendorB.id, role: 'OWNER' },
        });
      }
    }

    const tokenB = jwt.sign(
      { id: sellerBUser.id, email: sellerBUser.email, name: sellerBUser.name, role: sellerBUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const cookieB = `shubban_auth_token=${tokenB}`;
    assert(!!cookieB, 'Seller B session token created');

    // Category for tests
    const category = await prisma.category.findFirst();
    assert(!!category, `Test category resolved: ${category?.name}`);

    // -------------------------------------------------------------------------
    // STEP 1: PRODUCT CREATION & ZERO-TRUST SERVER DERIVATION
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 1] Product Creation & Server Ownership Derivation');

    const prodATitle = `সহীহ বুখারী শারহ - খণ্ড ১ (${Date.now()})`;
    const createProdARes = await request('/api/seller/products', {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: {
        title: prodATitle,
        authorName: 'ইমাম বুখারী (রহ.)',
        categoryId: category.id,
        price: 750,
        discountPrice: 680,
        stockQuantity: 25,
        coverImage: '/images/books/bukhari.jpg',
        isbn: `978-984-${Date.now().toString().slice(-6)}`,
        edition: '১ম সংস্করণ',
        pageCount: 640,
        description: 'দারুল ইলম তাহকীক ও তাখরীজসহ মূল গ্রন্থ।',
      },
    });

    assert(createProdARes.status === 201, `Seller A created product (Status: ${createProdARes.status})`);
    assert(createProdARes.data.success === true, 'Response marked success');
    const prodA = createProdARes.data.product;
    assert(prodA && prodA.vendorId === vendorA.id, 'Product A strictly assigned to Seller A vendor ID on server');

    // -------------------------------------------------------------------------
    // STEP 2: CROSS-SELLER PRODUCT ISOLATION (ZERO-TRUST OWNERSHIP CHECK)
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 2] Cross-Seller Product Isolation Checks');

    // Seller A reads their own product -> 200 OK
    const getOwnProdRes = await request(`/api/seller/products/${prodA.id}`, {
      headers: { Cookie: cookieA },
    });
    assert(getOwnProdRes.status === 200, 'Seller A can read Product A');

    // Cross-Seller Read Attempt: Seller B attempts to GET Product A -> 403 Forbidden
    const crossGetRes = await request(`/api/seller/products/${prodA.id}`, {
      headers: { Cookie: cookieB },
    });
    assert(crossGetRes.status === 403, `Seller B GET Product A blocked: 403 Forbidden (Received ${crossGetRes.status})`);

    // Cross-Seller Edit Attempt: Seller B attempts to PATCH Product A -> 403 Forbidden
    const crossPatchRes = await request(`/api/seller/products/${prodA.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieB },
      body: { price: 10, stockQuantity: 999 },
    });
    assert(crossPatchRes.status === 403, `Seller B PATCH Product A blocked: 403 Forbidden (Received ${crossPatchRes.status})`);

    // Cross-Seller Variant Attempt: Seller B attempts to add variant to Product A -> 403 Forbidden
    const crossVariantRes = await request(`/api/seller/products/${prodA.id}/variants`, {
      method: 'POST',
      headers: { Cookie: cookieB },
      body: { name: 'লাক্সারি চামড়ার বাঁধাই', price: 1200, stockQuantity: 5 },
    });
    assert(crossVariantRes.status === 403, `Seller B Add Variant to Product A blocked: 403 Forbidden (Received ${crossVariantRes.status})`);

    // Cross-Seller Delete Attempt: Seller B attempts to DELETE Product A -> 403 Forbidden
    const crossDeleteRes = await request(`/api/seller/products/${prodA.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    assert(crossDeleteRes.status === 403, `Seller B DELETE Product A blocked: 403 Forbidden (Received ${crossDeleteRes.status})`);

    // Seller A can legally update Product A -> 200 OK
    const updateOwnProdRes = await request(`/api/seller/products/${prodA.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieA },
      body: { price: 780, stockQuantity: 30 },
    });
    assert(updateOwnProdRes.status === 200, 'Seller A successfully updated Product A');
    assert(updateOwnProdRes.data.product.price === 780, 'Updated price reflected');

    // Seller A legally adds a variant to Product A -> 201 Created
    const addOwnVariantRes = await request(`/api/seller/products/${prodA.id}/variants`, {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: { name: 'হার্ডকভার প্রিমিয়াম বাঁধাই', price: 950, stockQuantity: 10 },
    });
    assert(addOwnVariantRes.status === 201, 'Seller A successfully added variant to Product A');

    // -------------------------------------------------------------------------
    // STEP 3: MULTI-VENDOR ORDER DISPATCH & SUB-ORDER ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 3] Multi-Vendor Parent Orders & Sub-Order Isolation');

    // Seller B creates Product B
    const prodBTitle = `রিয়াদুস সালেহীন - মূল ও ব্যাখ্যা (${Date.now()})`;
    const createProdBRes = await request('/api/seller/products', {
      method: 'POST',
      headers: { Cookie: cookieB },
      body: {
        title: prodBTitle,
        authorName: 'ইমাম নববী (রহ.)',
        categoryId: category.id,
        price: 520,
        stockQuantity: 20,
        description: 'মাকতাবাতুস সালাফ বাংলা সংস্করণ।',
      },
    });
    assert(createProdBRes.status === 201, 'Seller B created Product B');
    const prodB = createProdBRes.data.product;

    // Customer places a split multi-vendor order containing Product A and Product B
    const customer = await prisma.user.create({
      data: {
        name: 'আব্দুল আহাদ',
        email: `customer_split_${Date.now()}@shubban.com`,
        phone: '01855667788',
        passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
        role: 'REGISTERED_MEMBER',
      },
    });
    const custToken = jwt.sign(
      { id: customer.id, email: customer.email, name: customer.name, role: customer.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const custCookie = `shubban_auth_token=${custToken}`;

    const splitOrderRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        items: [
          { id: prodA.id, type: 'PHYSICAL', quantity: 2 },
          { id: prodB.id, type: 'PHYSICAL', quantity: 1 },
        ],
        shippingName: 'আব্দুল আহাদ',
        shippingPhone: '01855667788',
        shippingAddress: 'ধানমন্ডি ২৭, ঢাকা',
        shippingCity: 'ঢাকা',
        paymentMethod: 'cod',
      },
    });

    assert(splitOrderRes.status === 200 || splitOrderRes.status === 201, `Multi-vendor split checkout successful (Status: ${splitOrderRes.status})`);
    const masterOrderId = splitOrderRes.data.orderId;

    // Verify sub-orders in DB
    const subOrdersInDb = await prisma.subOrder.findMany({
      where: { orderId: masterOrderId },
    });
    assert(subOrdersInDb.length === 2, `Split order generated exactly 2 SubOrders (Found: ${subOrdersInDb.length})`);

    const subOrderA = subOrdersInDb.find((s) => s.vendorId === vendorA.id);
    const subOrderB = subOrdersInDb.find((s) => s.vendorId === vendorB.id);
    assert(!!subOrderA && !!subOrderB, 'Both Seller A and Seller B sub-orders present in DB');

    // Seller A orders list query -> Must see SubOrder A, NOT SubOrder B
    const listOrdersARes = await request('/api/seller/orders', {
      headers: { Cookie: cookieA },
    });
    assert(listOrdersARes.status === 200, 'Seller A listed orders');
    const sellerAOrders = listOrdersARes.data.subOrders || [];
    assert(sellerAOrders.some((o) => o.id === subOrderA.id), "Seller A sees their own SubOrder A");
    assert(!sellerAOrders.some((o) => o.id === subOrderB.id), "Seller A CANNOT see Seller B's SubOrder B");

    // Cross-Seller SubOrder Read Attempt: Seller B attempts to view SubOrder A -> 403 Forbidden
    const crossOrderGetRes = await request(`/api/seller/orders/${subOrderA.id}`, {
      headers: { Cookie: cookieB },
    });
    assert(crossOrderGetRes.status === 403, `Seller B view SubOrder A blocked: 403 Forbidden (Received ${crossOrderGetRes.status})`);

    // Cross-Seller SubOrder Fulfill Attempt: Seller B attempts to change SubOrder A status -> 403 Forbidden
    const crossOrderPatchRes = await request(`/api/seller/orders/${subOrderA.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieB },
      body: { status: 'SHIPPED', trackingNumber: 'HACKED-TRK' },
    });
    assert(crossOrderPatchRes.status === 403, `Seller B PATCH SubOrder A blocked: 403 Forbidden (Received ${crossOrderPatchRes.status})`);

    // Seller A legally packs and ships SubOrder A -> 200 OK
    const fulfillOwnOrderRes = await request(`/api/seller/orders/${subOrderA.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieA },
      body: {
        status: 'SHIPPED',
        courierName: 'Steadfast Courier',
        trackingNumber: `STDF-DARULILM-${Date.now().toString().slice(-5)}`,
      },
    });
    assert(fulfillOwnOrderRes.status === 200, 'Seller A updated SubOrder A with courier & tracking');
    assert(fulfillOwnOrderRes.data.subOrder.status === 'SHIPPED', 'SubOrder A status is SHIPPED');

    // -------------------------------------------------------------------------
    // STEP 4: FINANCIAL ISOLATION, COMMISSION & PAYOUT PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 4] Financial Ledgers & Payout Isolation');

    // Check Seller A payouts & ledger
    const getPayoutsARes = await request('/api/seller/payouts', {
      headers: { Cookie: cookieA },
    });
    assert(getPayoutsARes.status === 200, 'Seller A retrieved financial balance & payouts');
    const balA = getPayoutsARes.data.balance;
    assert(balA && balA.availableForWithdrawal > 0, `Seller A available balance positive: ৳ ${balA.availableForWithdrawal}`);

    // Overselling/Overdrawing Payout Protection: Seller A requests more than available
    const overdrawPayoutRes = await request('/api/seller/payouts', {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: {
        amount: balA.availableForWithdrawal + 999999,
        method: 'BANK_TRANSFER',
      },
    });
    assert(overdrawPayoutRes.status === 400, `Overdraw payout rejected: 400 Bad Request (Received ${overdrawPayoutRes.status})`);

    // Valid Payout Request by Seller A
    const validPayoutAmt = 500;
    if (balA.availableForWithdrawal >= validPayoutAmt) {
      const validPayoutRes = await request('/api/seller/payouts', {
        method: 'POST',
        headers: { Cookie: cookieA },
        body: {
          amount: validPayoutAmt,
          method: 'BANK_TRANSFER',
          accountDetails: 'ইসলামী ব্যাংক বাংলাদেশ, অ্যাকাউন্ট নং: 2050123456789',
          notes: 'নভেম্বর সপ্তাহের নিয়মিত পেআউট উত্তোলন',
        },
      });
      assert(validPayoutRes.status === 200, `Seller A requested ৳ ${validPayoutAmt} payout successfully`);
      assert(validPayoutRes.data.payout && validPayoutRes.data.payout.amount === validPayoutAmt, 'Payout record created');
    }

    // -------------------------------------------------------------------------
    // STEP 5: SELLER SUSPENSION WORKFLOW & WRITE OPERATION GUARDS
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 5] Admin Suspension & Enforcement Verification');

    // Admin suspends Seller B
    const suspendRes = await request(`/api/admin/sellers/${vendorB.id}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: { status: 'SUSPENDED' },
    });
    assert(suspendRes.status === 200, `Admin suspended Seller B (Status: ${suspendRes.status})`);
    assert(suspendRes.data.vendor.status === 'SUSPENDED', 'Vendor B status updated to SUSPENDED');

    // Suspended Seller B attempts to create product -> 403 Forbidden
    const suspendedCreateProdRes = await request('/api/seller/products', {
      method: 'POST',
      headers: { Cookie: cookieB },
      body: {
        title: 'স্থগিত অবস্থার নিষিদ্ধ পণ্য',
        categoryId: category.id,
        price: 300,
      },
    });
    assert(
      suspendedCreateProdRes.status === 403,
      `Suspended Seller B create product BLOCKED: 403 Forbidden (Received ${suspendedCreateProdRes.status})`
    );

    // Suspended Seller B attempts to update order -> 403 Forbidden
    const suspendedUpdateOrderRes = await request(`/api/seller/orders/${subOrderB.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieB },
      body: { status: 'SHIPPED' },
    });
    assert(
      suspendedUpdateOrderRes.status === 403,
      `Suspended Seller B update order BLOCKED: 403 Forbidden (Received ${suspendedUpdateOrderRes.status})`
    );

    // Suspended Seller B attempts to request payout -> 403 Forbidden
    const suspendedPayoutRes = await request('/api/seller/payouts', {
      method: 'POST',
      headers: { Cookie: cookieB },
      body: { amount: 500, method: 'BANK_TRANSFER' },
    });
    assert(
      suspendedPayoutRes.status === 403,
      `Suspended Seller B payout BLOCKED: 403 Forbidden (Received ${suspendedPayoutRes.status})`
    );

    // Admin reactivates Seller B
    const reactivateRes = await request(`/api/admin/sellers/${vendorB.id}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: { status: 'APPROVED' },
    });
    assert(reactivateRes.status === 200, 'Admin reactivated Seller B to APPROVED');

    // Seller B can now operate normally
    const normalUpdateOrderRes = await request(`/api/seller/orders/${subOrderB.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookieB },
      body: { status: 'PACKED' },
    });
    assert(normalUpdateOrderRes.status === 200, 'Reactivated Seller B successfully updated order status to PACKED');

    // -------------------------------------------------------------------------
    // STEP 6: STORE SETTINGS & REVIEWS ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 6] Store Settings & Customer Reviews Isolation');

    // Seller A updates store settings
    const updateSettingsRes = await request('/api/seller/settings', {
      method: 'PATCH',
      headers: { Cookie: cookieA },
      body: {
        description: 'বাংলাবাজারের অন্যতম শীর্ষ নির্ভরযোগ্য প্রকাশনা।',
        bankName: 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি',
        bankAccountName: 'দারুল ইলম প্রকাশনী',
        bankAccountNumber: '20501234567890',
        bkashMerchantNumber: '01711000001',
      },
    });
    assert(updateSettingsRes.status === 200, 'Seller A updated store settings & bank info');

    // Verify Seller B's settings are NOT affected
    const getSettingsBRes = await request('/api/seller/settings', {
      headers: { Cookie: cookieB },
    });
    assert(getSettingsBRes.status === 200, 'Seller B retrieved own settings');
    assert(getSettingsBRes.data.vendor.bankAccountNumber !== '20501234567890', "Seller B's settings remain completely isolated");

    // Add customer review on Product A
    await prisma.review.create({
      data: {
        bookId: prodA.id,
        userId: customer.id,
        rating: 5,
        comment: 'দারুল ইলম প্রকাশনীর ছাপা ও কাগজের মান অসাধারণ!',
        isVerified: true,
      },
    });

    // Seller A fetches reviews
    const getReviewsARes = await request('/api/seller/reviews', {
      headers: { Cookie: cookieA },
    });
    assert(getReviewsARes.status === 200, 'Seller A fetched product reviews');
    assert(
      getReviewsARes.data.reviews.some((r) => r.book.id === prodA.id),
      "Product A's review listed in Seller A dashboard"
    );

    // Seller B fetches reviews -> Product A's review MUST NOT be present
    const getReviewsBRes = await request('/api/seller/reviews', {
      headers: { Cookie: cookieB },
    });
    assert(getReviewsBRes.status === 200, 'Seller B fetched product reviews');
    assert(
      !getReviewsBRes.data.reviews.some((r) => r.book.id === prodA.id),
      "Seller B CANNOT see Seller A's reviews"
    );

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n============================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during test run:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSellerIsolationTests();
