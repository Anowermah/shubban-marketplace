import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSSLCommerz } from '@/lib/payments/sslcommerz';
import { fulfillStock, releaseStock } from '@/lib/inventory/service';

export async function POST(req: Request) {
  return handleCallback(req);
}

export async function GET(req: Request) {
  return handleCallback(req);
}

async function handleCallback(req: Request) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${proto}://${host}`;

  try {
    let params: Record<string, string> = {};

    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await req.text();
        const urlParams = new URLSearchParams(text);
        urlParams.forEach((val, key) => {
          params[key] = val;
        });
      } else if (contentType.includes('application/json')) {
        params = await req.json();
      }
    } else {
      const { searchParams } = new URL(req.url);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    const tranId = params.tran_id;
    const valId = params.val_id;
    const rawStatus = (params.status || '').toUpperCase();

    if (!tranId) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=missing_transaction_id`);
    }

    // Find the payment transaction
    const pmtTxn = await prisma.paymentTransaction.findUnique({
      where: { transactionId: tranId },
    });

    if (!pmtTxn || !pmtTxn.orderId) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=transaction_not_found`);
    }

    const order = await prisma.order.findUnique({
      where: { id: pmtTxn.orderId },
      include: { items: true, subOrders: true },
    });

    if (!order) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=order_not_found`);
    }

    // -------------------------------------------------------------------------
    // IDEMPOTENCY & DUPLICATE CALLBACK PROTECTION
    // -------------------------------------------------------------------------
    if (pmtTxn.status === 'SUCCESS' && order.paymentStatus === 'PAID') {
      return NextResponse.redirect(`${baseUrl}/order-confirmation?orderNumber=${order.orderNumber}`);
    }

    // -------------------------------------------------------------------------
    // SERVER-TO-SERVER VALIDATION (ZERO-TRUST ON BROWSER/CALLBACK PARAMS)
    // -------------------------------------------------------------------------
    if (rawStatus === 'VALID' || rawStatus === 'VALIDATED') {
      const validation = await validateSSLCommerz(valId, tranId, pmtTxn.amount);

      if (!validation.isValid) {
        // Record failed validation
        await prisma.paymentTransaction.update({
          where: { id: pmtTxn.id },
          data: {
            status: 'FAILED',
            gatewayResponse: JSON.stringify({
              error: validation.error,
              raw: validation.rawResponse,
              validationTimestamp: new Date().toISOString(),
            }),
          },
        });

        return NextResponse.redirect(
          `${baseUrl}/checkout?error=validation_failed&reason=${encodeURIComponent(
            validation.error || 'Server validation failed'
          )}`
        );
      }

      // -----------------------------------------------------------------------
      // ATOMIC TRANSACTION: MARK PAID, FULFILL INVENTORY, GRANT ENTITLEMENTS
      // -----------------------------------------------------------------------
      await prisma.$transaction(async (tx) => {
        // 1. Mark transaction SUCCESS
        await tx.paymentTransaction.update({
          where: { id: pmtTxn.id },
          data: {
            status: 'SUCCESS',
            gatewayResponse: JSON.stringify({
              valId,
              bankTranId: validation.bankTranId,
              cardType: validation.cardType,
              verifiedAt: new Date().toISOString(),
            }),
          },
        });

        // 2. Mark Master Order PAID & CONFIRMED
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
          },
        });

        // 3. Mark Sub-Orders CONFIRMED
        await tx.subOrder.updateMany({
          where: { orderId: order.id },
          data: { status: 'CONFIRMED' },
        });

        // 4. Fulfill stock reservations & record InventoryLog
        await fulfillStock(
          order.id,
          order.items.map((i) => ({
            bookId: i.bookId,
            quantity: i.quantity,
            type: i.type,
          })),
          order.orderNumber,
          tx
        );

        // 5. Grant Digital Entitlements
        for (const item of order.items) {
          if (item.type === 'DIGITAL') {
            const existing = await tx.digitalEntitlement.findFirst({
              where: { userId: order.userId, bookId: item.bookId },
            });
            if (!existing) {
              await tx.digitalEntitlement.create({
                data: {
                  userId: order.userId,
                  bookId: item.bookId,
                  type: 'PURCHASE',
                },
              });
            }
          }
        }

        // 6. Send Customer Notification
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: `পেমেন্ট সফল ও অর্ডার নিশ্চিত (#${order.orderNumber})`,
            message: `আপনার #${order.orderNumber} অর্ডারের অনলাইন পেমেন্ট (৳ ${order.total}) সফলভাবে গৃহীত হয়েছে। খুব শীঘ্রই বই পাঠানো হবে।`,
            type: 'ORDER',
            link: '/account/orders',
          },
        });
      });

      return NextResponse.redirect(`${baseUrl}/order-confirmation?orderNumber=${order.orderNumber}`);
    }

    // -------------------------------------------------------------------------
    // FAILED OR CANCELLED PAYMENT HANDLING
    // -------------------------------------------------------------------------
    await prisma.$transaction(async (tx) => {
      const failStatus = rawStatus === 'CANCELLED' ? 'CANCELLED' : 'FAILED';

      await tx.paymentTransaction.update({
        where: { id: pmtTxn.id },
        data: {
          status: failStatus,
          gatewayResponse: JSON.stringify({
            status: failStatus,
            params,
            failedAt: new Date().toISOString(),
          }),
        },
      });

      // Release reserved stock so other customers can purchase
      await releaseStock(order.id, `অনলাইন পেমেন্ট ${failStatus === 'CANCELLED' ? 'বাতিল' : 'ব্যর্থ'} হয়েছে`, tx);
    });

    return NextResponse.redirect(
      `${baseUrl}/checkout?error=${rawStatus === 'CANCELLED' ? 'payment_cancelled' : 'payment_failed'}&orderNumber=${order.orderNumber}`
    );
  } catch (error: any) {
    console.error('SSLCommerz callback error:', error);
    return NextResponse.redirect(`${baseUrl}/checkout?error=callback_exception`);
  }
}

