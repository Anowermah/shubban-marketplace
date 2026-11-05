import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { createShipment } from '@/lib/shipping';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const courierCode = searchParams.get('courierCode');
    const tracking = searchParams.get('tracking');

    const shipments = await prisma.shipment.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(courierCode ? { courierCode } : {}),
        ...(tracking ? { trackingNumber: { contains: tracking } } : {}),
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            paymentMethod: true,
            paymentStatus: true,
            total: true,
          },
        },
        subOrder: {
          select: {
            subOrderNumber: true,
            vendor: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: shipments.length,
      shipments,
    });
  } catch (error: any) {
    console.error('Fetch shipments error:', error);
    return NextResponse.json({ error: 'শিপমেন্ট তালিকা লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      orderId,
      subOrderId,
      courierCode = 'PATHAO',
      courierName,
      recipientName,
      shippingPhone,
      shippingAddress,
      codAmount = 0,
      notes,
    } = body;

    if (!orderId || !recipientName || !shippingPhone || !shippingAddress) {
      return NextResponse.json(
        { error: 'অর্ডার আইডি, প্রাপকের নাম, ফোন ও ঠিকানা পূরণ করা আবশ্যক।' },
        { status: 400 }
      );
    }

    const shipment = await createShipment({
      orderId,
      subOrderId,
      courierCode,
      courierName,
      recipientName,
      shippingPhone,
      shippingAddress,
      codAmount: parseFloat(codAmount) || 0,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'শিপমেন্ট তৈরি হয়েছে এবং ট্র্যাকিং নম্বর জেনারেট করা হয়েছে!',
      shipment,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create shipment error:', error);
    return NextResponse.json({ error: error.message || 'শিপমেন্ট তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}

