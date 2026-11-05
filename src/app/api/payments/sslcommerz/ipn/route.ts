import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSSLCommerz } from '@/lib/payments/sslcommerz';
import { fulfillStock } from '@/lib/inventory/service';

export async function POST(req: Request) {
  try {
    let params: Record<string, string> = {};

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const urlParams = new URLSearchParams(text);
      urlParams.forEach((val, key) => {
        params[key] = val;
      });
    } else if (contentType.includes('application/json')) {
      params = await req.json();
    } else {
      const text = await req.text();
      const urlParams = new URLSearchParams(text);
      urlParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    const tranId = params.tran_id;
    const valId = params.val_id;
    const status = (params.status || '').toUpperCase();

    if (!tranId) {
      return NextResponse.json({ error: 'tran_id parameter missing' }, { status: 400 });
    }

    const pmtTxn = await prisma.paymentTransaction.findUnique({
      where: { transactionId: tranId },
    });

    if (!pmtTxn || !pmtTxn.orderId) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
    }

    // IDEMPOTENCY: Check if already processed
    if (pmtTxn.status === 'SUCCESS') {
      return NextResponse.json({ success: true, message: 'IPN ALREADY PROCESSED' });
    }

    // SERVER VALIDATION
    if (status === 'VALID' || status === 'VALIDATED') {
      const validation = await validateSSLCommerz(valId, tranId, pmtTxn.amount);

      if (!validation.isValid) {
        await prisma.paymentTransaction.update({
          where: { id: pmtTxn.id },
          data: {
            status: 'FAILED',
            gatewayResponse: JSON.stringify({
              ipnFailedReason: validation.error,
              raw: validation.rawResponse,
            }),
          },
        });
        return NextResponse.json({ error: 'IPN verification failed' }, { status: 400 });
      }

      const order = await prisma.order.findUnique({
        where: { id: pmtTxn.orderId },
        include: { items: true },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { id: pmtTxn.id },
          data: {
            status: 'SUCCESS',
            gatewayResponse: JSON.stringify({
              ipnVerified: true,
              valId,
              bankTranId: validation.bankTranId,
              receivedAt: new Date().toISOString(),
            }),
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
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
      });

      return NextResponse.json({ success: true, message: 'IPN VERIFIED & ORDER CONFIRMED' });
    }

    return NextResponse.json({ success: true, message: 'IPN ACKNOWLEDGED' });
  } catch (error: any) {
    console.error('IPN processing error:', error);
    return NextResponse.json({ error: error.message || 'IPN error' }, { status: 500 });
  }
}

