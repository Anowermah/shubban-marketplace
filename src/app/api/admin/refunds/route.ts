import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const refunds = await prisma.refund.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            paymentStatus: true,
            orderStatus: true,
            shippingName: true,
            shippingPhone: true,
          },
        },
        paymentTransaction: {
          select: {
            id: true,
            transactionId: true,
            gateway: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRefunded = refunds
      .filter((r) => r.status === 'PROCESSED')
      .reduce((acc, r) => acc + r.amount, 0);

    return NextResponse.json({
      success: true,
      totalRefunded,
      count: refunds.length,
      refunds,
    });
  } catch (error: any) {
    console.error('Fetch refunds error:', error);
    return NextResponse.json(
      { error: 'রিফান্ড রেকর্ড লোড করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, amount, reason, status = 'PROCESSED', adminNote } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId আবশ্যক।' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const refundAmount = amount !== undefined ? parseFloat(amount) : order.total;
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json({ error: 'সঠিক রিফান্ড পরিমাণ প্রদান করুন।' }, { status: 400 });
    }

    const refundTxnId = `RFD-${order.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

    const pmtTxn = await prisma.paymentTransaction.findFirst({
      where: { orderId: order.id, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
    });

    const refund = await prisma.$transaction(async (tx) => {
      // 1. Create Refund record
      const newRefund = await tx.refund.create({
        data: {
          orderId: order.id,
          paymentTransactionId: pmtTxn ? pmtTxn.id : null,
          amount: refundAmount,
          reason: reason || 'অর্ডার বাতিল বা অসন্তোষজনিত রিফান্ড',
          status,
          refundTxnId,
          adminNote: adminNote || `অ্যাডমিন (${user.name}) কর্তৃক অনুমোদিত`,
          processedAt: status === 'PROCESSED' ? new Date() : null,
        },
      });

      // 2. Update Order payment status
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
        },
      });

      // 3. User notification
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `রিফান্ড সম্পন্ন হয়েছে (#${order.orderNumber})`,
          message: `আপনার #${order.orderNumber} অর্ডারে ৳ ${refundAmount} রিফান্ড প্রদান করা হয়েছে (Ref: ${refundTxnId})।`,
          type: 'ORDER',
          link: '/account/orders',
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PROCESS_REFUND',
          entity: 'Refund',
          entityId: newRefund.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            refundAmount,
            reason,
            refundTxnId,
          }),
        },
      });

      return newRefund;
    });

    return NextResponse.json({
      success: true,
      message: `৳ ${refundAmount} রিফান্ড সফলভাবে সম্পন্ন হয়েছে।`,
      refund,
    });
  } catch (error: any) {
    console.error('Create refund error:', error);
    return NextResponse.json(
      { error: error.message || 'রিফান্ড প্রক্রিয়াকরণে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

