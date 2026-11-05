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

async function runFinancialAndLogisticsSuite() {
  console.log('\n============================================================');
  console.log('⚡ MARKETPLACE FINANCIAL & SHIPPING OPERATIONS TEST SUITE');
  console.log('============================================================\n');

  try {
    // -------------------------------------------------------------------------
    // STEP 0: SETUP USERS, SELLERS, AND SESSIONS
    // -------------------------------------------------------------------------
    console.log('▶️ [Step 0] Auth Setup: SuperAdmin, Checker Admin, and 2 Vendors');

    // 1. SuperAdmin (for master actions)
    let superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin_fin@shubban.com',
          name: 'হেড অব ফাইন্যান্স',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'SUPER_ADMIN',
        },
      });
    }
    const superAdminToken = jwt.sign(
      { id: superAdmin.id, email: superAdmin.email, name: superAdmin.name, role: superAdmin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const superAdminCookie = `shubban_auth_token=${superAdminToken}`;
    assert(!!superAdminCookie, 'SuperAdmin auth session prepared');

    // 2. Checker Admin (for Maker-Checker verification)
    let checkerAdmin = await prisma.user.findUnique({
      where: { email: 'checker_admin@shubban.com' },
    });
    if (!checkerAdmin) {
      checkerAdmin = await prisma.user.create({
        data: {
          email: 'checker_admin@shubban.com',
          name: 'চেকার ম্যানেজার (অডিট)',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'ADMIN',
        },
      });
    }
    const checkerToken = jwt.sign(
      { id: checkerAdmin.id, email: checkerAdmin.email, name: checkerAdmin.name, role: checkerAdmin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const checkerCookie = `shubban_auth_token=${checkerToken}`;
    assert(!!checkerCookie, 'Checker Admin auth session prepared');

    // 3. Vendor 1 (Custom Commission: 12%)
    let vendor1 = await prisma.vendor.findFirst({ where: { slug: 'fin-vendor-1' } });
    let vendor1User = await prisma.user.findUnique({ where: { email: 'fin_seller_1@test.com' } });
    if (!vendor1User) {
      vendor1User = await prisma.user.create({
        data: {
          email: 'fin_seller_1@test.com',
          name: 'সেলার ১ (দারুল কিতাব)',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'PUBLISHER',
          phone: '01711223301',
        },
      });
    }
    if (!vendor1) {
      vendor1 = await prisma.vendor.create({
        data: {
          name: 'দারুল কিতাব প্রকাশনী',
          slug: 'fin-vendor-1',
          email: 'fin_seller_1@test.com',
          phone: '01711223301',
          address: 'বাংলাবাজার, ঢাকা',
          city: 'ঢাকা',
          commissionRate: 12.0, // Seller specific override
          status: 'APPROVED',
          isVerified: true,
          members: { create: { userId: vendor1User.id, role: 'OWNER' } },
        },
      });
    }
    const tokenV1 = jwt.sign(
      { id: vendor1User.id, email: vendor1User.email, name: vendor1User.name, role: vendor1User.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const cookieV1 = `shubban_auth_token=${tokenV1}`;

    // 4. Vendor 2 (Default platform commission)
    let vendor2 = await prisma.vendor.findFirst({ where: { slug: 'fin-vendor-2' } });
    let vendor2User = await prisma.user.findUnique({ where: { email: 'fin_seller_2@test.com' } });
    if (!vendor2User) {
      vendor2User = await prisma.user.create({
        data: {
          email: 'fin_seller_2@test.com',
          name: 'সেলার ২ (মাকতাবাতুল বায়ান)',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'PUBLISHER',
          phone: '01711223302',
        },
      });
    }
    if (!vendor2) {
      vendor2 = await prisma.vendor.create({
        data: {
          name: 'মাকতাবাতুল বায়ান',
          slug: 'fin-vendor-2',
          email: 'fin_seller_2@test.com',
          phone: '01711223302',
          address: 'পল্টন, ঢাকা',
          city: 'ঢাকা',
          commissionRate: null, // Inherits category or platform default
          status: 'APPROVED',
          isVerified: true,
          members: { create: { userId: vendor2User.id, role: 'OWNER' } },
        },
      });
    }
    const tokenV2 = jwt.sign(
      { id: vendor2User.id, email: vendor2User.email, name: vendor2User.name, role: vendor2User.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const cookieV2 = `shubban_auth_token=${tokenV2}`;

    // Customer
    const customer = await prisma.user.create({
      data: {
        name: 'রাশেদ খান',
        email: `customer_logistics_${Date.now()}@shubban.com`,
        phone: '01912345678',
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

    const testCategory = await prisma.category.findFirst();

    // -------------------------------------------------------------------------
    // STEP 1: COMMISSION HIERARCHY, RULES & STATEMENTS
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 1] Commission Engine: Hierarchy & Statements');

    // 1.1 List rules API
    const rulesRes = await request('/api/admin/commission/rules', {
      headers: { Cookie: superAdminCookie },
    });
    assert(rulesRes.status === 200, 'Admin fetched commission rules');
    assert(rulesRes.data.platformDefaultRate === 10, 'Default platform commission is 10%');

    // 1.2 Create custom category rule for 'darse-nizami' (7%)
    const createRuleRes = await request('/api/admin/commission/rules', {
      method: 'POST',
      headers: { Cookie: superAdminCookie },
      body: {
        name: 'দরসে নেজামী বিশেষ ছাড়',
        categorySlug: 'darse-nizami-spec',
        percentage: 7.0,
        description: 'কওমি মাদরাসা কিতাবাত কমিশন',
      },
    });
    assert(createRuleRes.status === 201 || createRuleRes.status === 200, 'Created or updated category-based commission rule (7%)');

    // 1.3 Create Products for Multiple Vendors
    const prodV1Res = await request('/api/seller/products', {
      method: 'POST',
      headers: { Cookie: cookieV1 },
      body: {
        title: `হিদায়া ১ম খণ্ড (${Date.now()})`,
        categoryId: testCategory.id,
        price: 600,
        stockQuantity: 30,
      },
    });
    assert(prodV1Res.status === 201, 'Created Product for Vendor 1');
    const prodV1 = prodV1Res.data.product;

    const prodV2Res = await request('/api/seller/products', {
      method: 'POST',
      headers: { Cookie: cookieV2 },
      body: {
        title: `উসুলে শাশী (${Date.now()})`,
        categoryId: testCategory.id,
        price: 400,
        stockQuantity: 25,
      },
    });
    assert(prodV2Res.status === 201, 'Created Product for Vendor 2');
    const prodV2 = prodV2Res.data.product;

    // 1.4 Place multi-vendor order
    const orderRes = await request('/api/checkout', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        items: [
          { id: prodV1.id, type: 'PHYSICAL', quantity: 2 }, // 2 * 600 = 1200
          { id: prodV2.id, type: 'PHYSICAL', quantity: 1 }, // 1 * 400 = 400
        ],
        shippingName: 'রাশেদ খান',
        shippingPhone: '01912345678',
        shippingAddress: 'মিরপুর ১০, ঢাকা',
        shippingCity: 'ঢাকা',
        paymentMethod: 'cod',
      },
    });
    assert(orderRes.status === 200 || orderRes.status === 201, 'Multi-vendor order placed');
    const orderId = orderRes.data.orderId;

    const subOrders = await prisma.subOrder.findMany({ where: { orderId } });
    assert(subOrders.length === 2, 'Order split into exactly 2 SubOrders');

    const subOrderV1 = subOrders.find((s) => s.vendorId === vendor1.id);
    const subOrderV2 = subOrders.find((s) => s.vendorId === vendor2.id);

    // Vendor 1 has 12% custom override: 1200 * 12% = 144 commission, 1056 payout
    assert(subOrderV1.commissionRate === 12.0, `Vendor 1 custom commission applied (12%)`);
    assert(subOrderV1.commissionAmt === 144, `Vendor 1 commission amount: ৳ ${subOrderV1.commissionAmt}`);
    assert(subOrderV1.payoutAmt === 1056, `Vendor 1 net payout: ৳ ${subOrderV1.payoutAmt}`);

    // Vendor 2 has 10% platform default: 400 * 10% = 40 commission, 360 payout
    assert(subOrderV2.commissionRate === 10.0, `Vendor 2 default commission applied (10%)`);
    assert(subOrderV2.commissionAmt === 40, `Vendor 2 commission amount: ৳ ${subOrderV2.commissionAmt}`);
    assert(subOrderV2.payoutAmt === 360, `Vendor 2 net payout: ৳ ${subOrderV2.payoutAmt}`);

    // 1.5 Commission Adjustment with Auditable Double-Entry Ledger
    const adjustRes = await request('/api/admin/commission/adjust', {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: {
        subOrderId: subOrderV1.id,
        newCommissionRate: 9.0, // Reduced from 12% to 9%
        reason: 'পবিত্র রমজান উপলক্ষে বিশেষ ৩% কমিশন ছাড়',
      },
    });
    assert(adjustRes.status === 200, 'Admin adjusted sub-order commission rate (12% -> 9%)');
    assert(adjustRes.data.result.subOrder.commissionAmt === 108, 'New commission amount is ৳ 108 (was 144)');
    assert(adjustRes.data.result.payoutDelta === 36, 'Vendor credited with +৳ 36 adjustment delta');

    // 1.6 Seller Statement API
    const stmtRes = await request('/api/seller/statements', {
      headers: { Cookie: cookieV1 },
    });
    assert(stmtRes.status === 200, 'Seller 1 fetched itemized financial statement');
    assert(stmtRes.data.statement.summary.grossSales >= 1200, 'Statement reports gross sales');
    assert(stmtRes.data.statement.ledgerEntries.length > 0, 'Statement includes ledger audit entries');

    // -------------------------------------------------------------------------
    // STEP 2: MAKER-CHECKER PAYOUT WORKFLOW & REVERSALS
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 2] Payout Operations: Maker-Checker & Reversals');

    // 2.1 Overdraw protection
    const overdrawRes = await request('/api/seller/payouts', {
      method: 'POST',
      headers: { Cookie: cookieV1 },
      body: {
        amount: 999999,
        method: 'BANK_TRANSFER',
      },
    });
    assert(overdrawRes.status === 400, 'Overdraw payout rejected with HTTP 400');

    // 2.2 Maker initiates valid payout request (৳ 600)
    const payoutReqRes = await request('/api/seller/payouts', {
      method: 'POST',
      headers: { Cookie: cookieV1 },
      body: {
        amount: 600,
        method: 'BANK_TRANSFER',
        accountDetails: 'ইসলামী ব্যাংক বাংলাদেশ, অ্যাকাউন্ট: ২০৫০১২৩৪৫৬৭৮৯০',
        notes: 'নভেম্বর সপ্তাহের নিয়মিত পেআউট উত্তোলন',
      },
    });
    assert(payoutReqRes.status === 200, 'Maker requested ৳ 600 payout');
    const payoutId = payoutReqRes.data.payout.id;

    // 2.3 Maker-Checker Violation Guard:
    // Maker creates session as ADMIN and tries to approve their own payout
    // Let's create an Admin User who also is Maker
    const makerAdminUser = await prisma.user.create({
      data: {
        name: 'মেকার স্টাফ',
        email: `maker_staff_${Date.now()}@shubban.com`,
        passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
        role: 'ADMIN',
      },
    });
    const makerAdminToken = jwt.sign(
      { id: makerAdminUser.id, email: makerAdminUser.email, name: makerAdminUser.name, role: makerAdminUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const makerAdminCookie = `shubban_auth_token=${makerAdminToken}`;

    // MakerAdmin initiates high-risk payout
    const internalPayout = await prisma.sellerPayout.create({
      data: {
        payoutNumber: `PO-TEST-${Date.now().toString().slice(-4)}`,
        vendorId: vendor1.id,
        amount: 500,
        method: 'BANK_TRANSFER',
        accountDetails: 'Test Account',
        status: 'REQUESTED',
        requestedBy: makerAdminUser.id, // Maker
      },
    });

    // Maker tries to approve own payout -> Must fail with Maker-Checker violation
    const selfApproveRes = await request(`/api/admin/payouts/${internalPayout.id}/approve`, {
      method: 'PATCH',
      headers: { Cookie: makerAdminCookie },
    });
    assert(
      selfApproveRes.status === 403,
      `Maker-Checker Guard BLOCKED self-approval: 403 Forbidden (Received ${selfApproveRes.status})`
    );

    // Independent Checker (checkerAdmin) approves the real payout
    const approveRes = await request(`/api/admin/payouts/${payoutId}/approve`, {
      method: 'PATCH',
      headers: { Cookie: checkerCookie },
      body: { notes: 'ব্যাংক তথ্য ও কেওয়াইসি যাচাইকৃত' },
    });
    assert(approveRes.status === 200, 'Independent Checker approved payout (status: APPROVED)');

    // 2.4 Disburser processes payout with official bank transaction reference
    const processRes = await request(`/api/admin/payouts/${payoutId}/process`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: {
        transactionRef: `IBBL-FT-2026-998811`,
        notes: 'BEFTN-এর মাধ্যমে প্রেরিত',
      },
    });
    assert(processRes.status === 200, 'Disbursed payout with official transaction reference');
    assert(processRes.data.payout.status === 'PAID', 'Payout status updated to PAID');
    assert(processRes.data.payout.transactionRef === 'IBBL-FT-2026-998811', 'Payment reference saved');

    // 2.5 Reversal of Bounced Payout (Never silently deletes records!)
    const reverseRes = await request(`/api/admin/payouts/${payoutId}/reverse`, {
      method: 'POST',
      headers: { Cookie: superAdminCookie },
      body: {
        reason: 'গ্রাহকের ব্যাংক অ্যাকাউন্ট নম্বর ভুল থাকায় BEFTN বাউন্স হয়েছে',
      },
    });
    assert(reverseRes.status === 200, 'Bounced payout reversed with offsetting ledger entry');
    assert(reverseRes.data.result.payout.status === 'REVERSED', 'Status marked REVERSED');
    assert(reverseRes.data.result.ledgerEntry.type === 'PAYOUT_REVERSAL', 'Auditable PAYOUT_REVERSAL logged');

    // 2.6 Payout Reconciliation
    const reconRes = await request('/api/admin/payouts/reconcile', {
      headers: { Cookie: superAdminCookie },
    });
    assert(reconRes.status === 200, 'Payout reconciliation executed');
    assert(reconRes.data.report.isBalanced === true, 'Financial balances are completely balanced');
    assert(reconRes.data.report.status === 'RECONCILED', 'Status is RECONCILED');

    // -------------------------------------------------------------------------
    // STEP 3: SHIPPING ZONES, COURIER SHIPMENTS & FAILED SHIPMENT
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 3] Shipping: Zones, Courier Shipments & Failed Deliveries');

    // 3.1 Calculate delivery charge dynamically
    const dhakaCalcRes = await request('/api/shipping/calculate?city=Dhaka&weightKg=2&cartTotal=500');
    assert(dhakaCalcRes.status === 200, 'Calculated delivery charge for Dhaka Metro (2kg)');
    assert(dhakaCalcRes.data.calculation.zoneCode === 'DHAKA_METRO', 'Zone identified: DHAKA_METRO');
    assert(dhakaCalcRes.data.calculation.totalDeliveryCharge === 80, 'Charge: ৳60 base + ৳20 extra kg = ৳80');

    // Free delivery check (cartTotal >= 1000 in Dhaka Metro)
    const freeCalcRes = await request('/api/shipping/calculate?city=Dhaka&weightKg=1&cartTotal=1500');
    assert(freeCalcRes.data.calculation.isFreeDelivery === true, 'Free delivery applied over threshold');
    assert(freeCalcRes.data.calculation.totalDeliveryCharge === 0, 'Delivery fee is ৳ 0');

    // 3.2 Create Courier Shipment (Steadfast Logistics)
    const createShpRes = await request('/api/admin/shipping/shipments', {
      method: 'POST',
      headers: { Cookie: superAdminCookie },
      body: {
        orderId,
        subOrderId: subOrderV1.id,
        courierCode: 'STEADFAST',
        recipientName: 'রাশেদ খান',
        shippingPhone: '01912345678',
        shippingAddress: 'মিরপুর ১০, ঢাকা',
        codAmount: 1200,
        notes: 'বইয়ের পার্সেল সাবধানে হ্যান্ডেল করবেন',
      },
    });
    assert(createShpRes.status === 201, 'Created shipment record');
    const shipment = createShpRes.data.shipment;
    assert(!!shipment.trackingNumber, `Tracking number generated: ${shipment.trackingNumber}`);
    assert(!!shipment.consignmentId, `Consignment ID generated: ${shipment.consignmentId}`);

    // 3.3 Courier Pipeline Updates
    const pickedUpRes = await request(`/api/admin/shipping/shipments/${shipment.id}`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: { status: 'PICKED_UP' },
    });
    assert(pickedUpRes.status === 200, 'Shipment status: PICKED_UP');

    const inTransitRes = await request(`/api/admin/shipping/shipments/${shipment.id}`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: { status: 'IN_TRANSIT' },
    });
    assert(inTransitRes.status === 200, 'Shipment status: IN_TRANSIT');

    // 3.4 Delivery Confirmation & COD Collection
    const deliverRes = await request(`/api/admin/shipping/shipments/${shipment.id}`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: { status: 'DELIVERED' },
    });
    assert(deliverRes.status === 200, 'Shipment status: DELIVERED');
    assert(deliverRes.data.shipment.codCollected === 1200, 'COD collected ৳ 1200 recorded');

    // 3.5 Courier Remittance Settlement (COD collection minus courier fee)
    const remitRes = await request(`/api/admin/shipping/shipments/${shipment.id}/remittance`, {
      method: 'POST',
      headers: { Cookie: superAdminCookie },
      body: { courierFee: 80 }, // ৳80 delivery fee charged by courier
    });
    assert(remitRes.status === 200, 'Courier remittance settled');
    assert(remitRes.data.shipment.netRemittance === 1120, 'Net remittance: 1200 - 80 = ৳ 1120');
    assert(remitRes.data.shipment.isRemitted === true, 'Marked isRemitted = true');

    // 3.6 Failed Shipment Test (Second Shipment)
    const failedShp = await prisma.shipment.create({
      data: {
        shipmentNumber: `SHP-FAIL-${Date.now().toString().slice(-4)}`,
        orderId,
        courierCode: 'REDX',
        courierName: 'RedX Logistics',
        recipientName: 'রাশেদ খান',
        shippingPhone: '01912345678',
        shippingAddress: 'মিরপুর ১০, ঢাকা',
        codAmount: 400,
        status: 'PENDING_PICKUP',
      },
    });

    const markFailedRes = await request(`/api/admin/shipping/shipments/${failedShp.id}`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: {
        status: 'FAILED',
        failedReason: 'গ্রাহক ফোন রিসিভ করেননি এবং ঠিকানায় তালাবদ্ধ ছিল',
      },
    });
    assert(markFailedRes.status === 200, 'Failed shipment updated with status FAILED');
    assert(markFailedRes.data.shipment.failedReason.includes('ফোন রিসিভ করেননি'), 'Failure reason saved');

    // 3.7 COD Collection Report
    const codReportRes = await request('/api/admin/shipping/cod-report', {
      headers: { Cookie: superAdminCookie },
    });
    assert(codReportRes.status === 200, 'Admin generated COD collection & remittance report');
    assert(codReportRes.data.report.financials.totalCodCollected >= 1200, 'COD collected accounted for');

    // -------------------------------------------------------------------------
    // STEP 4: RETURNS, INSPECTIONS, RESTOCKING & PARTIAL REFUNDS
    // -------------------------------------------------------------------------
    console.log('\n▶️ [Step 4] Returns: Inspection, Inventory Restocking & Partial Refunds');

    // 4.1 Customer initiates return request (1 copy of Prod V1)
    const returnReqRes = await request('/api/returns', {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        orderId,
        subOrderId: subOrderV1.id,
        reason: 'DEFECTIVE_PRINTING',
        explanation: 'পৃষ্ঠা ৪১ থেকে ৪৮ পর্যন্ত প্রিন্টিং অস্পষ্ট ও মিসিং রয়েছে।',
        items: [
          {
            bookId: prodV1.id,
            quantity: 1,
            unitPrice: 600,
          },
        ],
      },
    });
    assert(returnReqRes.status === 201, 'Customer submitted return request');
    const returnRequest = returnReqRes.data.returnRequest;
    assert(returnRequest.status === 'REQUESTED', 'Initial status is REQUESTED');

    // 4.2 Admin approves return request
    const approveRetRes = await request(`/api/admin/returns/${returnRequest.id}/approve`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: { notes: 'গ্রাহকের অভিযোগ যুক্তিসঙ্গত, রিটার্ন কুরিয়ার বুকিং নিশ্চিত করুন' },
    });
    assert(approveRetRes.status === 200, 'Admin approved return request');

    // 4.3 Inspection Case A: Product inspected as RESELLABLE (intact book)
    const inspectRes = await request(`/api/admin/returns/${returnRequest.id}/inspect`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: {
        result: 'RESELLABLE',
        notes: 'পণ্যটি অক্ষত পাওয়া গেছে। বাইন্ডিং ও ছাপা ঠিক আছে।',
      },
    });
    assert(inspectRes.status === 200, 'Product inspected as RESELLABLE');

    // Capture stock before refund/restock
    const bookBeforeRestock = await prisma.book.findUnique({ where: { id: prodV1.id } });
    const stockBefore = bookBeforeRestock.stockQuantity;

    // 4.4 Process Partial Refund & Restock (deducting ৳50 return courier fee)
    const processRefundRes = await request(`/api/admin/returns/${returnRequest.id}/refund`, {
      method: 'POST',
      headers: { Cookie: superAdminCookie },
      body: {
        refundDeduction: 50, // ৳600 - ৳50 = ৳550 refund
        adminNote: 'রিটার্ন কুরিয়ার চার্জ বাবদ ৫০ টাকা কর্তন করে আংশিক রিফান্ড',
      },
    });
    assert(processRefundRes.status === 200, 'Processed refund and inventory restocking');
    assert(processRefundRes.data.result.refundAmount === 550, 'Partial refund amount: ৳ 550');
    assert(processRefundRes.data.result.restocked === true, 'Product marked as restocked');

    // Verify stock incremented by 1
    const bookAfterRestock = await prisma.book.findUnique({ where: { id: prodV1.id } });
    assert(
      bookAfterRestock.stockQuantity === stockBefore + 1,
      `Inventory incremented from ${stockBefore} to ${bookAfterRestock.stockQuantity}`
    );

    // Verify vendor ledger was debited for refund and credited back commission
    const returnLedgers = await prisma.sellerLedgerEntry.findMany({
      where: { vendorId: vendor1.id, subOrderId: subOrderV1.id },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    assert(
      returnLedgers.some((l) => l.type === 'REFUND_DEBIT'),
      'Vendor debited with REFUND_DEBIT in ledger'
    );
    assert(
      returnLedgers.some((l) => l.type === 'COMMISSION_REFUND_CREDIT'),
      'Vendor credited with COMMISSION_REFUND_CREDIT in ledger'
    );

    // 4.5 Return Dispute Management
    // Customer disputes the ৳50 courier fee deduction
    const disputeRes = await request(`/api/returns/${returnRequest.id}/dispute`, {
      method: 'POST',
      headers: { Cookie: custCookie },
      body: {
        reason: 'বইয়ের মিসিং পেইজের ত্রুটির কারণে কুরিয়ার ফি গ্রাহকের উপর চাপানো অনুচিত।',
      },
    });
    assert(disputeRes.status === 201, 'Dispute raised by customer');
    const disputeId = disputeRes.data.dispute.id;

    // Admin arbitrates and resolves in customer favor
    const resolveDisputeRes = await request(`/api/admin/returns/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      headers: { Cookie: superAdminCookie },
      body: {
        resolution: 'RESOLVED_CUSTOMER_FAVOR',
        notes: 'প্রকাশনা ত্রুটি থাকায় সম্পূর্ণ কুরিয়ার ফি প্ল্যাটফর্ম বহন করবে।',
      },
    });
    assert(resolveDisputeRes.status === 200, 'Dispute resolved in customer favor with admin arbitration');
    assert(resolveDisputeRes.data.dispute.status === 'RESOLVED_CUSTOMER_FAVOR', 'Dispute status updated');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n============================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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

runFinancialAndLogisticsSuite();

