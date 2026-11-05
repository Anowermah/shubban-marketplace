import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { releaseStock } from '@/lib/inventory/service';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body.reason || 'গ্রাহকের অনুরোধে অর্ডার বাতিল').trim();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        subOrders: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // Permission check: only order owner or admin can cancel
    const isOwner = order.userId === session.id;
    const isStaff = isAdmin(session.role);

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'এই অর্ডারটি বাতিল করার অনুমতি আপনার নেই।' }, { status: 403 });
    }

    // State check: cannot cancel already shipped or delivered orders
    if (order.orderStatus === 'SHIPPED') {
      return NextResponse.json(
        { error: 'অর্ডারটি ইতিমধ্যে কুরিয়ারে পাঠানো হয়েছে। এটি বাতিল করতে কাস্টমার সাপোর্টে যোগাযোগ করুন।' },
        { status: 400 }
      );
    }

    if (order.orderStatus === 'DELIVERED') {
      return NextResponse.json(
        { error: 'অর্ডারটি ইতিমধ্যে ডেলিভারি সম্পন্ন হয়েছে। পণ্য ফেরত দিতে রিটার্ন রিকুয়েস্ট করুন।' },
        { status: 400 }
      );
    }

    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'অর্ডারটি পূর্বে থেকেই বাতিল করা রয়েছে।' },
        { status: 400 }
      );
    }

    // Execute atomic cancellation transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Release physical stock back to database
      await releaseStock(order.id, reason, tx);

      // 2. If order was paid, create pending refund record
      let targetPaymentStatus = order.paymentStatus;
      if (order.paymentStatus === 'PAID') {
        targetPaymentStatus = 'REFUNDED';

        const pmtTxn = await tx.paymentTransaction.findFirst({
          where: { orderId: order.id, status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
        });

        await tx.refund.create({
          data: {
            orderId: order.id,
            paymentTransactionId: pmtTxn ? pmtTxn.id : null,
            amount: order.total,
            reason: `অর্ডার #${order.orderNumber} বাতিল বাবদ ক্যাশব্যাক: ${reason}`,
            status: 'PENDING',
            refundTxnId: `REF-${order.orderNumber}-${Date.now().toString().slice(-4)}`,
            adminNote: isStaff ? `অ্যাডমিন (${session.name}) কর্তৃক বাতিলকৃত` : 'গ্রাহক স্বয়ং বাতিল করেছেন',
          },
        });
      }

      // 3. Update Order record
      const cancelled = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'CANCELLED',
          paymentStatus: targetPaymentStatus,
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });

      // 4. Update Sub-Orders
      await tx.subOrder.updateMany({
        where: { orderId: order.id },
        data: { status: 'CANCELLED' },
      });

      // 5. Notify customer
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `অর্ডার বাতিল হয়েছে (#${order.orderNumber})`,
          message: `আপনার #${order.orderNumber} নম্বরের অর্ডারটি বাতিল করা হয়েছে। কারণ: ${reason}`,
          type: 'ORDER',
          link: '/account/orders',
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: 'CANCEL_ORDER',
          entity: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            reason,
            refundInitiated: order.paymentStatus === 'PAID',
          }),
        },
      });

      return cancelled;
    });

    return NextResponse.json({
      success: true,
      message: `অর্ডার #${order.orderNumber} সফলভাবে বাতিল করা হয়েছে এবং স্টক পুনরুদ্ধার করা হয়েছে।`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { error: error.message || 'অর্ডার বাতিল করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

