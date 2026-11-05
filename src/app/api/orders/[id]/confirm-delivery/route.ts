import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { subOrders: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    if (order.userId !== session.id) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    if (order.orderStatus === 'DELIVERED') {
      return NextResponse.json({ success: true, message: 'অর্ডারটি ইতিমধ্যে ডেলিভারি হিসেবে চিহ্নিত রয়েছে।' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        orderStatus: 'DELIVERED',
        deliveredAt: new Date(),
      };

      if (order.paymentMethod === 'cod') {
        updateData.paymentStatus = 'PAID';

        await tx.paymentTransaction.create({
          data: {
            orderId: order.id,
            gateway: 'COD',
            amount: order.total,
            currency: 'BDT',
            transactionId: `COD-CONFIRMED-${order.orderNumber}`,
            status: 'SUCCESS',
            gatewayResponse: JSON.stringify({
              note: 'গ্রাহক কর্তৃক ডেলিভারি ও পেমেন্ট প্রাপ্তি নিশ্চিত',
              confirmedAt: new Date().toISOString(),
            }),
          },
        });
      }

      await tx.subOrder.updateMany({
        where: { orderId: order.id },
        data: { status: 'DELIVERED' },
      });

      return await tx.order.update({
        where: { id: order.id },
        data: updateData,
      });
    });

    return NextResponse.json({
      success: true,
      message: 'পণ্য প্রাপ্তি সফলভাবে নিশ্চিত করা হয়েছে। ধন্যবাদ!',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Confirm delivery error:', error);
    return NextResponse.json(
      { error: 'ডেলিভারি নিশ্চিত করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

