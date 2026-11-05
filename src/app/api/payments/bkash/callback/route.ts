import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyBkash } from '@/lib/payments/bkash';
import { fulfillStock, releaseStock } from '@/lib/inventory/service';

export async function POST(req: Request) {
  return handleBkashCallback(req);
}

export async function GET(req: Request) {
  return handleBkashCallback(req);
}

async function handleBkashCallback(req: Request) {
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
    const paymentId = params.paymentID || params.paymentId;
    const status = (params.status || '').toLowerCase();

    if (!tranId) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=missing_transaction`);
    }

    const pmtTxn = await prisma.paymentTransaction.findUnique({
      where: { transactionId: tranId },
    });

    if (!pmtTxn || !pmtTxn.orderId) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=transaction_not_found`);
    }

    const order = await prisma.order.findUnique({
      where: { id: pmtTxn.orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=order_not_found`);
    }

    // IDEMPOTENCY CHECK
    if (pmtTxn.status === 'SUCCESS' && order.paymentStatus === 'PAID') {
      return NextResponse.redirect(`${baseUrl}/order-confirmation?orderNumber=${order.orderNumber}`);
    }

    if (status === 'success') {
      // Server-side verification
      const verifyResult = await verifyBkash(paymentId || `BKASH_${tranId}`, pmtTxn.amount);

      if (!verifyResult.isValid) {
        await prisma.paymentTransaction.update({
          where: { id: pmtTxn.id },
          data: {
            status: 'FAILED',
            gatewayResponse: JSON.stringify({ error: verifyResult.error }),
          },
        });
        return NextResponse.redirect(`${baseUrl}/checkout?error=bkash_verification_failed`);
      }

      // Atomic fulfillment
      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { id: pmtTxn.id },
          data: {
            status: 'SUCCESS',
            gatewayResponse: JSON.stringify({
              paymentId: verifyResult.paymentId,
              trxID: verifyResult.trxID,
              verifiedAt: new Date().toISOString(),
            }),
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
            transactionId: verifyResult.trxID || tranId,
          },
        });

        await tx.subOrder.updateMany({
          where: { orderId: order.id },
          data: { status: 'CONFIRMED' },
        });

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

        await tx.notification.create({
          data: {
            userId: order.userId,
            title: `বিকাশ পেমেন্ট সফল (#${order.orderNumber})`,
            message: `আপনার #${order.orderNumber} অর্ডারে ৳ ${order.total} বিকাশ পেমেন্ট সফল হয়েছে (TrxID: ${verifyResult.trxID || tranId})।`,
            type: 'ORDER',
            link: '/account/orders',
          },
        });
      });

      return NextResponse.redirect(`${baseUrl}/order-confirmation?orderNumber=${order.orderNumber}`);
    }

    // Cancelled / Failed
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: pmtTxn.id },
        data: {
          status: status === 'cancel' ? 'CANCELLED' : 'FAILED',
          gatewayResponse: JSON.stringify({ status, params }),
        },
      });

      await releaseStock(order.id, 'বিকাশ পেমেন্ট বাতিল বা ব্যর্থ হয়েছে', tx);
    });

    return NextResponse.redirect(
      `${baseUrl}/checkout?error=${status === 'cancel' ? 'payment_cancelled' : 'payment_failed'}&orderNumber=${order.orderNumber}`
    );
  } catch (err: any) {
    console.error('bKash callback error:', err);
    return NextResponse.redirect(`${baseUrl}/checkout?error=bkash_exception`);
  }
}

