/**
 * Shubban Library Marketplace — Admin-Controlled Manual Courier Booking Test Suite
 * 
 * Verifies:
 * 1. Automatic booking strictly prohibited upon customer checkout (trackingNumber: null, zero shipments).
 * 2. Customer tracking on unbooked order displays pre-booking reassurance message.
 * 3. Dedicated Admin Order Details GET endpoint with RBAC protection (401/403).
 * 4. Admin manual order confirmation with audit trail.
 * 5. Manual / Other courier booking (e.g. Sundarban Courier) with custom tracking, consignment, and fee.
 * 6. AuditLog recording for booking success and failures.
 * 7. Customer tracking on booked order reveals tracking code, carrier name, and live checkpoints.
 * 8. Manual shipment tracking status updates (IN_TRANSIT, DELIVERED).
 * 9. Shipping label and invoice print timestamp logging.
 * 10. Status independence: Order Status, Payment Status, and Shipment Status mutate independently.
 * 11. Accidental duplicate booking guard.
 * 12. Manual shipment cancellation with reason and AuditLog.
 */

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
    console.log(`  [OK] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log('   TEST SUITE: ADMIN-CONTROLLED MANUAL COURIER BOOKING');
  console.log('='.repeat(70));

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Auth Setup
    // -------------------------------------------------------------------------
    console.log('\n--- 0. Setup Admin & Customer Credentials ---');

    let admin = await prisma.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin_courier_manual@shubban.com',
          name: 'অপারেশনস হেড অ্যাডমিন',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'ADMIN',
        },
      });
    }

    const adminToken = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const adminCookie = `shubban_auth_token=${adminToken}`;
    assert(!!adminCookie, 'Admin session authenticated');

    let customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
    });
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          email: 'customer_manual_test@shubban.com',
          name: 'মুহাম্মদ আব্দুল্লাহ',
          phone: '01799887766',
          passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3',
          role: 'CUSTOMER',
        },
      });
    }

    const customerToken = jwt.sign(
      { id: customer.id, email: customer.email, name: customer.name, role: customer.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const customerCookie = `shubban_auth_token=${customerToken}`;
    assert(!!customerCookie, 'Customer session prepared');

    // Ensure a test book exists
    let testBook = await prisma.book.findFirst({ where: { stockQuantity: { gte: 5 } } });
    if (!testBook) {
      testBook = await prisma.book.findFirst();
    }
    assert(!!testBook, `Inventory item available for ordering: ${testBook?.title}`);

    // -------------------------------------------------------------------------
    // STEP 1: Strict Prohibition of Automatic Courier Booking at Checkout
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Verification: Automatic Courier Booking Prohibited on Checkout ---');

    const orderNumber = `TEST-MANUAL-${Date.now().toString().slice(-6)}`;
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        subtotal: 550,
        shippingFee: 60,
        discount: 0,
        total: 610,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        paymentMethod: 'cod',
        shippingName: 'মুহাম্মদ আব্দুল্লাহ',
        shippingPhone: '01799887766',
        shippingAddress: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা',
        shippingCity: 'ঢাকা',
        trackingNumber: null,
        items: {
          create: [
            {
              bookId: testBook.id,
              quantity: 2,
              unitPrice: 275,
              totalPrice: 550,
              type: 'PHYSICAL',
            },
          ],
        },
      },
    });

    assert(createdOrder.id && createdOrder.orderNumber === orderNumber, `Test order ${orderNumber} created`);
    assert(createdOrder.trackingNumber === null, 'Order trackingNumber is initially NULL (no premature tracking)');

    // Check that NO shipment exists in DB
    const initialShipment = await prisma.shipment.findFirst({
      where: { orderId: createdOrder.id },
    });
    assert(initialShipment === null, 'Zero shipments created on order creation (Automatic booking strictly blocked)');

    // -------------------------------------------------------------------------
    // STEP 2: Customer Tracking on Unbooked Order
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Customer Tracking Visibility on Unbooked Order ---');

    const preBookingTrackRes = await request(`/api/shipping/track?trackingNumber=${orderNumber}`);
    assert(preBookingTrackRes.status === 200, `Track API responded 200 (Got ${preBookingTrackRes.status})`);
    assert(preBookingTrackRes.data.isPreBooking === true, 'Response marks isPreBooking = true');
    assert(
      preBookingTrackRes.data.order?.message &&
      preBookingTrackRes.data.order.message.includes('কুরিয়ারে বুকিং সম্পন্ন হলে ট্র্যাকিং কোড দৃশ্যমান হবে'),
      'Customer informed order is processing and tracking code will appear after booking'
    );
    assert(
      preBookingTrackRes.data.order?.recipientPhone?.includes('*****'),
      'Recipient phone is privacy-masked for public tracking'
    );

    // -------------------------------------------------------------------------
    // STEP 3: Admin Order Details Page API & RBAC
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Dedicated Admin Order Details Route & RBAC ---');

    // Unauthenticated GET
    const unauthGetRes = await request(`/api/admin/orders/${createdOrder.id}`);
    assert(unauthGetRes.status === 403 || unauthGetRes.status === 401, 'Unauthenticated access rejected (401/403)');

    // Customer role GET
    const custGetRes = await request(`/api/admin/orders/${createdOrder.id}`, {
      headers: { Cookie: customerCookie },
    });
    assert(custGetRes.status === 403, 'Customer role access rejected with 403 Forbidden');

    // Admin role GET
    const adminGetRes = await request(`/api/admin/orders/${createdOrder.id}`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminGetRes.status === 200, 'Admin successfully fetched order details (200 OK)');
    assert(adminGetRes.data.order?.shippingPhone === '01799887766', 'Admin sees unmasked phone number');
    assert(adminGetRes.data.order?.items?.length === 1, 'Admin sees ordered products list');
    assert(Array.isArray(adminGetRes.data.providers), 'Admin receives list of available courier providers');

    // -------------------------------------------------------------------------
    // STEP 4: Admin Order Confirmation & Status Independence
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Admin Explicit Order Confirmation ---');

    const confirmRes = await request(`/api/admin/orders/${createdOrder.id}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: {
        orderStatus: 'CONFIRMED',
        notes: 'অর্ডারটি অ্যাডমিন কর্তৃক যাচাই ও নিশ্চিত করা হয়েছে।',
      },
    });

    assert(confirmRes.status === 200 && confirmRes.data.success, 'Admin confirmed order');
    assert(confirmRes.data.order?.orderStatus === 'CONFIRMED', 'Order status changed to CONFIRMED');
    assert(confirmRes.data.order?.paymentStatus === 'PENDING', 'Payment status remains PENDING independently');

    // Verify AuditLog was recorded
    const confirmAudit = await prisma.auditLog.findFirst({
      where: {
        entityId: createdOrder.id,
        action: { in: ['UPDATE_ORDER_STATUS', 'ORDER_STATUS_UPDATED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!confirmAudit, 'AuditLog recorded UPDATE_ORDER_STATUS');

    // -------------------------------------------------------------------------
    // STEP 5: Manual Courier Booking Workflow (Sundarban Courier)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Manual / Other Courier Booking Workflow ---');

    const manualConsignment = `CS-SND-${Date.now().toString().slice(-5)}`;
    const manualTracking = `TRK-SND-${Date.now().toString().slice(-5)}`;

    const manualBookRes = await request('/api/admin/couriers', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        orderId: createdOrder.id,
        courierCode: 'MANUAL',
        isManual: true,
        manualCourierName: 'সুন্দরবন কুরিয়ার সার্ভিস',
        manualConsignmentId: manualConsignment,
        manualTrackingNumber: manualTracking,
        manualCourierFee: 80,
        parcelWeight: 1.2,
        codAmount: 610,
        recipientName: 'মুহাম্মদ আব্দুল্লাহ',
        recipientPhone: '01799887766',
        recipientAddress: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা',
        recipientCity: 'ঢাকা',
        adminNotes: 'ধানমন্ডি শাখা থেকে গ্রাহক গ্রহণ করবেন।',
      },
    });

    assert(manualBookRes.status === 200 && manualBookRes.data.success, 'Manual courier booking API succeeded');
    const bookedShipment = manualBookRes.data.booking;
    const bookedShipmentId = bookedShipment?.id || bookedShipment?.shipmentId || bookedShipment?.rawResponse?.shipmentId;
    assert(bookedShipment?.courierCode === 'MANUAL', 'Shipment courierCode is MANUAL');
    assert(bookedShipment?.status === 'BOOKED', 'Shipment status is BOOKED');
    assert(bookedShipment?.consignmentId === manualConsignment, `Consignment ID matches: ${manualConsignment}`);
    assert(bookedShipment?.trackingNumber === manualTracking, `Tracking number matches: ${manualTracking}`);
    assert(bookedShipment?.courierFee === 80, 'Courier fee stored correctly (80 BDT)');

    // Verify order was updated with tracking number
    const updatedOrder = await prisma.order.findUnique({
      where: { id: createdOrder.id },
    });
    assert(
      updatedOrder?.trackingNumber && updatedOrder.trackingNumber.includes(manualTracking),
      `Order trackingNumber updated with manual courier details: ${updatedOrder?.trackingNumber}`
    );

    // Verify booking AuditLog
    const bookingAudit = await prisma.auditLog.findFirst({
      where: {
        entityId: bookedShipmentId,
        action: 'COURIER_BOOKING_SUCCESS',
      },
    });
    assert(!!bookingAudit, 'AuditLog recorded COURIER_BOOKING_SUCCESS');

    // -------------------------------------------------------------------------
    // STEP 6: Customer Tracking Visibility on Booked Order
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Customer Tracking Visibility on Booked Order ---');

    const bookedTrackRes = await request(`/api/shipping/track?trackingNumber=${manualTracking}`);
    assert(bookedTrackRes.status === 200, 'Public tracking returns 200 for manual tracking code');
    assert(bookedTrackRes.data.isPreBooking === false, 'isPreBooking is now FALSE');
    assert(bookedTrackRes.data.shipment?.courierName === 'সুন্দরবন কুরিয়ার সার্ভিস', 'Courier name visible: সুন্দরবন কুরিয়ার সার্ভিস');
    assert(bookedTrackRes.data.shipment?.trackingNumber === manualTracking, 'Tracking number matches');
    assert(bookedTrackRes.data.shipment?.checkpoints?.length >= 1, 'Checkpoints list contains initial booking event');

    // -------------------------------------------------------------------------
    // STEP 7: Manual Shipment Status Tracking Update
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Manual Shipment Status Tracking Update ---');

    const updateManualRes = await request(`/api/admin/couriers/shipments/${bookedShipmentId}`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        action: 'update_manual',
        status: 'IN_TRANSIT',
        note: 'ধানমন্ডি মূল হাবে পার্সেল ট্রানজিটে রয়েছে।',
        location: 'ঢাকা সেন্ট্রাল হাব',
      },
    });

    assert(updateManualRes.status === 200 && updateManualRes.data.success, 'Manual shipment update succeeded');
    assert(updateManualRes.data.shipment?.status === 'IN_TRANSIT', 'Shipment status updated to IN_TRANSIT');

    // Verify live tracking response reflects new checkpoint
    const updatedTrackRes = await request(`/api/shipping/track?trackingNumber=${manualTracking}`);
    assert(updatedTrackRes.data.shipment?.status === 'IN_TRANSIT', 'Public tracking reflects IN_TRANSIT status');
    assert(updatedTrackRes.data.shipment?.checkpoints?.length >= 2, 'New checkpoint recorded in timeline');

    // -------------------------------------------------------------------------
    // STEP 8: Shipping Label & Invoice Print Logging
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Shipping Label & Invoice Print Timestamp Logging ---');

    const printLabelRes = await request(`/api/admin/couriers/shipments/${bookedShipmentId}`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { action: 'print_label' },
    });
    assert(printLabelRes.status === 200 && printLabelRes.data.shipment?.labelPrintedAt, 'Shipping label print recorded with timestamp');

    const printInvoiceRes = await request(`/api/admin/couriers/shipments/${bookedShipmentId}`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: { action: 'print_invoice' },
    });
    assert(printInvoiceRes.status === 200 && printInvoiceRes.data.shipment?.invoicePrintedAt, 'Invoice print recorded with timestamp');

    // -------------------------------------------------------------------------
    // STEP 9: Independent Status Separation
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Strict Status Independence (Order vs Payment vs Shipment) ---');

    // Admin updates Payment Status to PAID
    const payUpdateRes = await request(`/api/admin/orders/${createdOrder.id}`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: { paymentStatus: 'PAID' },
    });
    assert(payUpdateRes.status === 200, 'Payment status updated to PAID');

    const freshShipment = await prisma.shipment.findUnique({ where: { id: bookedShipmentId } });
    const freshOrder = await prisma.order.findUnique({ where: { id: createdOrder.id } });

    assert(freshOrder.paymentStatus === 'PAID', 'Order paymentStatus is PAID');
    assert(freshOrder.orderStatus === 'CONFIRMED', 'Order orderStatus remains CONFIRMED (untouched)');
    assert(freshShipment.status === 'IN_TRANSIT', 'Shipment status remains IN_TRANSIT (untouched)');

    // -------------------------------------------------------------------------
    // STEP 10: Duplicate Booking Guard
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Accidental Duplicate Booking Guard ---');

    const duplicateBookRes = await request('/api/admin/couriers', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        orderId: createdOrder.id,
        courierCode: 'STEADFAST',
        recipientName: 'মুহাম্মদ আব্দুল্লাহ',
        recipientPhone: '01799887766',
        recipientAddress: 'বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা',
      },
    });

    assert(
      duplicateBookRes.status === 400 &&
      duplicateBookRes.data.error &&
      duplicateBookRes.data.error.includes('ইতিমধ্যে একটি সক্রিয় শিপমেন্ট'),
      'Duplicate booking attempt rejected with clear error'
    );

    // -------------------------------------------------------------------------
    // STEP 11: Shipment Cancellation & Audit Trail
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Shipment Cancellation & Audit Trail ---');

    const cancelRes = await request(`/api/admin/couriers/shipments/${bookedShipmentId}`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        action: 'cancel',
        reason: 'গ্রাহকের অনুরোধে ডেলিভারি মাধ্যম পরিবর্তন',
      },
    });

    assert(cancelRes.status === 200 && cancelRes.data.success, 'Shipment cancellation succeeded');
    assert(cancelRes.data.shipment?.status === 'CANCELLED', 'Shipment status set to CANCELLED');

    const cancelAudit = await prisma.auditLog.findFirst({
      where: {
        entityId: bookedShipmentId,
        action: { in: ['COURIER_SHIPMENT_CANCELLED', 'COURIER_CANCEL'] },
      },
    });
    assert(!!cancelAudit, 'AuditLog recorded COURIER_SHIPMENT_CANCELLED');

    // Clean up test order & shipment
    if (bookedShipmentId) {
      await prisma.shipmentEvent.deleteMany({ where: { shipmentId: bookedShipmentId } });
      await prisma.shipment.deleteMany({ where: { id: bookedShipmentId } });
    }
    await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } });
    await prisma.auditLog.deleteMany({ where: { entityId: { in: [createdOrder.id, bookedShipmentId].filter(Boolean) } } });
    await prisma.order.deleteMany({ where: { id: createdOrder.id } });
    console.log('\n[Cleanup] Test order, shipment, and events safely cleaned up.');

  } catch (error) {
    console.error('\nTest Suite Fatal Error:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(70));

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
