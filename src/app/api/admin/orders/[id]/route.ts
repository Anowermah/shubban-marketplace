import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { releaseStock } from '@/lib/inventory/service';

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch detailed order information with shipments and available couriers
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: params.id },
          { orderNumber: params.id },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                coverImage: true,
                price: true,
                author: { select: { name: true } },
              },
            },
          },
        },
        subOrders: {
          include: {
            vendor: { select: { id: true, name: true, legalName: true } },
          },
        },
        shipments: {
          include: {
            events: { orderBy: { timestamp: 'desc' } },
            provider: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // Available courier providers
    const providers = await prisma.courierProvider.findMany({
      orderBy: { isDefault: 'desc' },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        isEnabled: true,
        isDefault: true,
        defaultChargeInsideDhaka: true,
        defaultChargeOutsideDhaka: true,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      providers,
    });
  } catch (error: any) {
    console.error('Admin Order GET error:', error);
    return NextResponse.json({ error: error.message || 'অর্ডার তথ্য লোড ব্যর্থ।' }, { status: 500 });
  }
}

/**
 * PATCH: Update order details and statuses with strict separation and audit logging
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      orderStatus,
      paymentStatus,
      trackingNumber,
      courierName,
      cancelReason,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
    } = body;

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id: params.id }, { orderNumber: params.id }],
      },
      include: { subOrders: true, items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'অর্ডারটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      if (trackingNumber !== undefined) {
        updateData.trackingNumber = trackingNumber;
      }

      if (courierName) {
        updateData.courierName = courierName;
      }

      if (shippingName) updateData.shippingName = shippingName.trim();
      if (shippingPhone) updateData.shippingPhone = shippingPhone.trim();
      if (shippingAddress) updateData.shippingAddress = shippingAddress.trim();
      if (shippingCity) updateData.shippingCity = shippingCity.trim();

      if (orderStatus && orderStatus !== existingOrder.orderStatus) {
        updateData.orderStatus = orderStatus;

        if (orderStatus === 'CONFIRMED') {
          // Explicit confirmation by admin
          await tx.notification.create({
            data: {
              userId: existingOrder.userId,
              title: `অর্ডার নিশ্চিত করা হয়েছে (#${existingOrder.orderNumber})`,
              message: `আপনার #${existingOrder.orderNumber} অর্ডারটি নিশ্চিত করা হয়েছে। শীঘ্রই পার্সেল প্রস্তুত করা হবে।`,
              type: 'ORDER',
              link: `/account/orders`,
            },
          });
        } else if (orderStatus === 'SHIPPED') {
          updateData.shippedAt = new Date();
          if (courierName) updateData.courierName = courierName;
          if (trackingNumber) updateData.trackingNumber = trackingNumber;

          await tx.subOrder.updateMany({
            where: { orderId: existingOrder.id },
            data: {
              status: 'SHIPPED',
              courierName: courierName || 'কুরিয়ার পার্টনার',
              trackingNumber: trackingNumber || existingOrder.trackingNumber || `TRK-${existingOrder.orderNumber}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: existingOrder.userId,
              title: `অর্ডার পাঠানো হয়েছে (#${existingOrder.orderNumber})`,
              message: `আপনার #${existingOrder.orderNumber} অর্ডারটি ${courierName || 'কুরিয়ারে'} পাঠানো হয়েছে। ট্র্যাকিং কোড: ${trackingNumber || 'শীঘ্রই সংযুক্ত হবে'}।`,
              type: 'ORDER',
              link: `/account/orders`,
            },
          });
        } else if (orderStatus === 'DELIVERED') {
          updateData.deliveredAt = new Date();

          if (existingOrder.paymentMethod === 'cod') {
            updateData.paymentStatus = 'PAID';

            await tx.paymentTransaction.create({
              data: {
                orderId: existingOrder.id,
                gateway: 'COD',
                amount: existingOrder.total,
                currency: 'BDT',
                transactionId: `COD-DELIVERY-${existingOrder.orderNumber}`,
                status: 'SUCCESS',
                gatewayResponse: JSON.stringify({
                  note: 'ডেলিভারিতে ক্যাশ সংগ্রহ সম্পন্ন হয়েছে',
                  collectedAt: new Date().toISOString(),
                }),
              },
            });
          }

          await tx.subOrder.updateMany({
            where: { orderId: existingOrder.id },
            data: { status: 'DELIVERED' },
          });

          await tx.notification.create({
            data: {
              userId: existingOrder.userId,
              title: `অর্ডার সফলভাবে পৌঁছেছে (#${existingOrder.orderNumber})`,
              message: `আপনার #${existingOrder.orderNumber} অর্ডারটি সফলভাবে ডেলিভারি সম্পন্ন হয়েছে।`,
              type: 'ORDER',
              link: `/account/orders`,
            },
          });
        } else if (orderStatus === 'CANCELLED') {
          updateData.cancelledAt = new Date();
          updateData.cancelReason = cancelReason || 'অ্যাডমিন কর্তৃক বাতিল';

          await releaseStock(existingOrder.id, cancelReason || 'অ্যাডমিন কর্তৃক অর্ডার বাতিল', tx);

          await tx.subOrder.updateMany({
            where: { orderId: existingOrder.id },
            data: { status: 'CANCELLED' },
          });

          if (existingOrder.paymentStatus === 'PAID') {
            updateData.paymentStatus = 'REFUNDED';

            await tx.refund.create({
              data: {
                orderId: existingOrder.id,
                amount: existingOrder.total,
                reason: cancelReason || 'অর্ডার বাতিল বাবদ রিফান্ড',
                status: 'PENDING',
                refundTxnId: `REF-${existingOrder.orderNumber}-${Date.now().toString().slice(-4)}`,
                adminNote: `অ্যাডমিন (${user.name}) কর্তৃক বাতিল`,
              },
            });
          }

          await tx.notification.create({
            data: {
              userId: existingOrder.userId,
              title: `অর্ডার বাতিল হয়েছে (#${existingOrder.orderNumber})`,
              message: `আপনার #${existingOrder.orderNumber} নম্বর অর্ডারটি বাতিল করা হয়েছে। কারণ: ${cancelReason || 'অনিবার্য কারণ'}।`,
              type: 'ORDER',
              link: `/account/orders`,
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: existingOrder.id },
        data: updateData,
      });

      // Audit Log for status or detail update
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entityId: existingOrder.id,
          details: JSON.stringify({
            previousOrderStatus: existingOrder.orderStatus,
            newOrderStatus: orderStatus || existingOrder.orderStatus,
            previousPaymentStatus: existingOrder.paymentStatus,
            newPaymentStatus: paymentStatus || existingOrder.paymentStatus,
            trackingNumber,
            courierName,
            updatedBy: user.name,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'অর্ডার আপডেট করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
