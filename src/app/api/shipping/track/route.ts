import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CourierManager } from '@/lib/courier/manager';
import { CourierCode } from '@/lib/courier/types';

/**
 * Mask string for customer privacy: e.g. "01712345678" -> "017*****678"
 */
function maskPhone(phone?: string | null): string {
  if (!phone) return 'N/A';
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  return clean.substring(0, 3) + '*****' + clean.substring(clean.length - 3);
}

function maskName(name?: string | null): string {
  if (!name) return 'সম্মানিত গ্রাহক';
  const parts = name.trim().split(' ');
  return parts
    .map((p) => {
      if (p.length <= 2) return p;
      return p[0] + '*'.repeat(Math.min(p.length - 2, 4)) + p[p.length - 1];
    })
    .join(' ');
}

function maskAddress(address?: string | null, city?: string | null): string {
  if (city) {
    return `${city} (বিস্তারিত ঠিকানা সংরক্ষিত)`;
  }
  if (!address) return 'বাংলাদেশ';
  const parts = address.split(',');
  if (parts.length > 1) {
    return `${parts[parts.length - 1].trim()} (বিস্তারিত গোপনীয়)`;
  }
  return 'ঠিকানা সংরক্ষিত';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingCode = searchParams.get('trackingNumber') || searchParams.get('code') || searchParams.get('orderNumber');

    if (!trackingCode || !trackingCode.trim()) {
      return NextResponse.json(
        { success: false, error: 'অনুগ্রহ করে সঠিক ট্র্যাকিং কোড বা অর্ডার আইডি দিন।' },
        { status: 400 }
      );
    }

    const cleanCode = trackingCode.trim();

    // 1. Locate shipment record
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { trackingNumber: cleanCode },
          { consignmentId: cleanCode },
          { shipmentNumber: cleanCode },
          { order: { orderNumber: cleanCode } },
          { orderId: cleanCode },
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            shippingCity: true,
            shippingName: true,
            shippingPhone: true,
            shippingAddress: true,
            orderStatus: true,
            paymentStatus: true,
            total: true,
            trackingNumber: true,
          },
        },
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // 2. If no shipment found OR shipment is still in NOT_BOOKED / BOOKING_PENDING status:
    if (!shipment || ['NOT_BOOKED', 'BOOKING_PENDING'].includes(shipment.status)) {
      // Check if an order exists matching the number/id
      const order = shipment?.order || await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: cleanCode },
            { id: cleanCode },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          shippingCity: true,
          shippingName: true,
          shippingPhone: true,
          shippingAddress: true,
          orderStatus: true,
          paymentStatus: true,
          total: true,
          trackingNumber: true,
        },
      });

      if (order && !order.trackingNumber) {
        return NextResponse.json({
          success: true,
          isPreBooking: true,
          order: {
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            recipientName: maskName(order.shippingName),
            recipientPhone: maskPhone(order.shippingPhone),
            maskedDestination: maskAddress(order.shippingAddress, order.shippingCity),
            createdAt: order.createdAt.toISOString(),
            message: 'অর্ডারটি সফলভাবে গৃহীত হয়েছে এবং প্রক্রিয়াকরণ চলছে। কুরিয়ারে বুকিং সম্পন্ন হলে ট্র্যাকিং কোড দৃশ্যমান হবে।',
          },
        });
      }

      if (!shipment) {
        return NextResponse.json(
          {
            success: false,
            error: `"${cleanCode}" ট্র্যাকিং কোড বা অর্ডার নম্বরে কোনো পার্সেল পাওয়া যায়নি। আপনার ট্র্যাকিং নম্বরটি পরীক্ষা করে পুনরায় চেষ্টা করুন।`,
          },
          { status: 404 }
        );
      }
    }

    // 3. Fetch live updates if adapter supports it and shipment has tracking
    let liveTracking;
    try {
      liveTracking = await CourierManager.trackShipment(cleanCode);
    } catch (e: any) {
      console.warn('Live tracking fallback to DB events:', e.message);
    }

    // 4. Format privacy-safe tracking response
    const checkpoints = (liveTracking?.checkpoints && liveTracking.checkpoints.length > 0)
      ? liveTracking.checkpoints
      : shipment.events.map((e) => ({
          time: e.timestamp.toISOString(),
          status: e.status,
          note: e.note,
          location: e.location || 'হাব / ডেলিভারি কেন্দ্র',
        }));

    return NextResponse.json({
      success: true,
      isPreBooking: false,
      shipment: {
        shipmentNumber: shipment.shipmentNumber,
        trackingNumber: shipment.trackingNumber || shipment.consignmentId || shipment.shipmentNumber,
        consignmentId: shipment.consignmentId,
        courierName: shipment.courierName,
        courierCode: shipment.courierCode,
        status: liveTracking?.currentStatus || shipment.status,
        recipientName: maskName(shipment.recipientName || shipment.order.shippingName),
        recipientPhone: maskPhone(shipment.shippingPhone || shipment.order.shippingPhone),
        maskedDestination: maskAddress(shipment.shippingAddress || shipment.order.shippingAddress, shipment.order.shippingCity),
        orderNumber: shipment.order.orderNumber,
        bookedAt: shipment.createdAt.toISOString(),
        deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.toISOString() : null,
        weightKg: shipment.weightKg,
        codAmount: shipment.codAmount,
        checkpoints,
      },
    });
  } catch (error: any) {
    console.error('Public order tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'সার্ভারে সাময়িক ত্রুটি ঘটেছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
