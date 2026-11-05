import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { validateSSLCommerz } from '@/lib/payments/sslcommerz';
import { verifyBkash } from '@/lib/payments/bkash';
import { fulfillStock } from '@/lib/inventory/service';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const body = await req.json();
    const { transactionId, valId, paymentId, gateway } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId আবশ্যক।' }, { status: 400 });
    }

    const pmtTxn = await prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });

    if (!pmtTxn || !pmtTxn.orderId) {
      return NextResponse.json({ error: 'লেনদেন রেকর্ড পাওয়া যায়নি।' }, { status: 404 });
    }

    const order = await prisma.order.findUnique({
      where: { id: pmtTxn.orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'অর্ডার পাওয়া যায়নি।' }, { status: 404 });
    }

    // Permission check
    if (session && order.userId !== session.id && !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    // Idempotency: If already verified
    if (pmtTxn.status === 'SUCCESS' && order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        isVerified: true,
        alreadyVerified: true,
        orderNumber: order.orderNumber,
        status: 'PAID',
        amount: pmtTxn.amount,
      });
    }

    const effectiveGateway = (gateway || pmtTxn.gateway).toUpperCase();
    let isGatewayValid = false;
    let verificationMeta: any = {};

    // 1. SSLCOMMERZ
    if (effectiveGateway === 'SSLCOMMERZ') {
      const vResult = await validateSSLCommerz(valId || `VAL_${transactionId}`, transactionId, pmtTxn.amount);
      isGatewayValid = vResult.isValid;
      verificationMeta = vResult;
    }
    // 2. BKASH
    else if (effectiveGateway === 'BKASH') {
      const bResult = await verifyBkash(paymentId || `BKASH_${transactionId}`, pmtTxn.amount);
      isGatewayValid = bResult.isValid;
      verificationMeta = bResult;
    }
    // 3. CASH ON DELIVERY (COD)
    else if (effectiveGateway === 'COD') {
      if (isAdmin(session?.role)) {
        isGatewayValid = true;
        verificationMeta = { confirmedByAdmin: session?.name };
      } else {
        return NextResponse.json({ error: 'ক্যাশ অন ডেলিভারি কেবল অ্যাডমিন বা কুরিয়ার নিশ্চিত করতে পারে।' }, { status: 403 });
      }
    }

    if (!isGatewayValid) {
      await prisma.paymentTransaction.update({
        where: { id: pmtTxn.id },
        data: {
          status: 'FAILED',
          gatewayResponse: JSON.stringify({
            verificationFailed: true,
            meta: verificationMeta,
            checkedAt: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: false,
        isVerified: false,
        error: verificationMeta.error || 'গেটের সার্ভারে পেমেন্ট ভ্যালিডেশন ব্যর্থ হয়েছে।',
      }, { status: 400 });
    }

    // Commit verification
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: pmtTxn.id },
        data: {
          status: 'SUCCESS',
          gatewayResponse: JSON.stringify({
            manualVerification: true,
            meta: verificationMeta,
            verifiedAt: new Date().toISOString(),
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

    return NextResponse.json({
      success: true,
      isVerified: true,
      orderNumber: order.orderNumber,
      status: 'PAID',
      amount: pmtTxn.amount,
      gateway: effectiveGateway,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

