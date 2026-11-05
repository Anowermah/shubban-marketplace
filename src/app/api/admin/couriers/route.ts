import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CourierManager } from '@/lib/courier/manager';
import { CreateShipmentInput, CourierCode } from '@/lib/courier/types';

export const dynamic = 'force-dynamic';

/**
 * GET: Admin Courier Dashboard Data
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ — অ্যাডমিন অনুমতি আবশ্যক' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const providerCode = searchParams.get('provider') || 'ALL';
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    // 1. Providers list with settings
    const providers = await prisma.courierProvider.findMany({
      include: {
        settings: true,
        _count: {
          select: { shipments: true },
        },
      },
      orderBy: { isDefault: 'desc' },
    });

    // 2. Aggregate shipment statistics
    const [
      totalShipments,
      pendingPickups,
      inTransit,
      delivered,
      returned,
      cancelled,
      codTotalDelivered,
      codTotalRemitted,
    ] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: 'PENDING_PICKUP' } }),
      prisma.shipment.count({ where: { status: { in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
      prisma.shipment.count({ where: { status: 'DELIVERED' } }),
      prisma.shipment.count({ where: { status: 'RETURNED' } }),
      prisma.shipment.count({ where: { status: 'CANCELLED' } }),
      prisma.shipment.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { codAmount: true },
      }),
      prisma.shipment.aggregate({
        where: { status: 'DELIVERED', isRemitted: true },
        _sum: { codAmount: true },
      }),
    ]);

    // 3. Filtered Shipments Query
    const whereClause: any = {};
    if (status !== 'ALL') {
      whereClause.status = status;
    }
    if (providerCode !== 'ALL') {
      whereClause.courierCode = providerCode;
    }
    if (search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { shipmentNumber: { contains: q } },
        { trackingNumber: { contains: q } },
        { consignmentId: { contains: q } },
        { recipientName: { contains: q } },
        { shippingPhone: { contains: q } },
        { order: { orderNumber: { contains: q } } },
      ];
    }

    const [shipments, filteredTotal] = await Promise.all([
      prisma.shipment.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              paymentMethod: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipment.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalShipments,
        pendingPickups,
        inTransit,
        delivered,
        returned,
        cancelled,
        totalCodCollected: codTotalDelivered._sum.codAmount || 0,
        totalCodRemitted: codTotalRemitted._sum.codAmount || 0,
        pendingCodSettlement: (codTotalDelivered._sum.codAmount || 0) - (codTotalRemitted._sum.codAmount || 0),
      },
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        apiBaseUrl: p.apiBaseUrl,
        trackingUrl: p.webhookUrl,
        isDefault: p.isDefault,
        isEnabled: p.isEnabled,
        isSandbox: p.status !== 'ACTIVE',
        shipmentCount: p._count.shipments,
        settings: p.settings.map((s) => ({
          key: s.key,
          hasValue: Boolean(s.value && s.value.length > 0),
          isSecret: s.isEncrypted,
          // Mask secret keys in response
          value: s.isEncrypted ? (s.value ? '••••••••••••' : '') : s.value,
        })),
      })),
      shipments: shipments.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        orderId: s.orderId,
        orderNumber: s.order.orderNumber,
        courierName: s.courierName,
        courierCode: s.courierCode,
        trackingNumber: s.trackingNumber,
        consignmentId: s.consignmentId,
        recipientName: s.recipientName,
        shippingPhone: s.shippingPhone,
        shippingAddress: s.shippingAddress,
        status: s.status,
        codAmount: s.codAmount,
        courierFee: s.courierFee,
        weightKg: s.weightKg,
        isRemitted: s.isRemitted,
        labelPrintedAt: s.labelPrintedAt,
        createdAt: s.createdAt,
        deliveredAt: s.deliveredAt,
      })),
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin Couriers GET Error:', error);
    return NextResponse.json({ error: error.message || 'কুরিয়ার তথ্য লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

/**
 * POST: Book courier parcel for an existing order with duplicate prevention
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ — অ্যাডমিন অনুমতি আবশ্যক' }, { status: 403 });
    }

    const body = await req.json();
    const {
      orderId,
      courierCode,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientCity,
      recipientZone,
      recipientArea,
      codAmount,
      weightKg,
      itemDescription,
      specialInstruction,
      isManual,
      manualCourierName,
      manualTrackingNumber,
      manualConsignmentId,
      manualCourierFee,
      adminNotes,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'অর্ডার আইডি প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    // Verify order exists and get defaults if not provided in payload
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: {
          include: { book: { select: { title: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const booksSummary = order.items.map((i) => `${i.book.title} (x${i.quantity})`).join(', ');

    const bookingInput: CreateShipmentInput = {
      orderId: order.id,
      courierCode: (courierCode?.toUpperCase() as CourierCode) || (isManual ? 'MANUAL' : 'STEADFAST'),
      recipientName: recipientName || order.shippingName || 'সম্মানিত গ্রাহক',
      recipientPhone: recipientPhone || order.shippingPhone,
      recipientAddress: recipientAddress || order.shippingAddress,
      recipientCity: recipientCity || order.shippingCity || 'ঢাকা',
      recipientZone,
      recipientArea,
      codAmount: typeof codAmount === 'number' ? codAmount : (order.paymentMethod === 'cod' ? order.total : 0),
      weightKg: weightKg ? parseFloat(weightKg) : 1.0,
      itemDescription: itemDescription || `বই ও প্রকাশনা: ${booksSummary.substring(0, 150)}`,
      specialInstruction: specialInstruction || `অর্ডার নং: ${order.orderNumber} - সাবধানে হ্যান্ডেল করুন।`,
      isManual: Boolean(isManual || courierCode === 'MANUAL'),
      manualCourierName,
      manualTrackingNumber,
      manualConsignmentId,
      manualCourierFee: typeof manualCourierFee === 'number' ? manualCourierFee : undefined,
      adminNotes,
    };

    const result = await CourierManager.bookShipment(bookingInput);

    if (!result.success) {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'COURIER_BOOKING_FAILED',
          entity: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            courierCode: bookingInput.courierCode,
            error: result.error || result.message,
          }),
        },
      });

      return NextResponse.json({ success: false, error: result.error || 'কুরিয়ার বুকিং ব্যর্থ হয়েছে।' }, { status: 400 });
    }

    // Record successful booking in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'COURIER_BOOKING_SUCCESS',
        entity: 'Shipment',
        entityId: result.rawResponse?.shipmentId || null,
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          shipmentNumber: result.rawResponse?.shipmentNumber,
          courierCode: result.courierCode,
          trackingNumber: result.trackingNumber,
          consignmentId: result.consignmentId,
          isManual: bookingInput.isManual,
          codAmount: bookingInput.codAmount,
          bookedBy: session.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `কুরিয়ার বুকিং সফল হয়েছে! ট্র্যাকিং নং: ${result.trackingNumber || result.consignmentId}`,
      booking: {
        ...result,
        id: result.rawResponse?.shipmentId,
        shipmentId: result.rawResponse?.shipmentId,
      },
    });
  } catch (error: any) {
    console.error('Courier Booking POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'বুকিং সম্পন্ন করা যায়নি।' }, { status: 400 });
  }
}

/**
 * PUT: Update Courier Provider Configurations & API Credentials
 */
export async function PUT(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ — অ্যাডমিন অনুমতি আবশ্যক' }, { status: 403 });
    }

    const body = await req.json();
    const { code, isDefault, isEnabled, isSandbox, apiBaseUrl, trackingUrl, settings } = body;

    if (!code) {
      return NextResponse.json({ error: 'কুরিয়ার কোড আবশ্যক।' }, { status: 400 });
    }

    const provider = await prisma.courierProvider.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!provider) {
      return NextResponse.json({ error: 'কুরিয়ার প্রোভাইডার পাওয়া যায়নি।' }, { status: 404 });
    }

    // If setting this provider as default, unset other defaults
    if (isDefault) {
      await prisma.courierProvider.updateMany({
        where: { id: { not: provider.id } },
        data: { isDefault: false },
      });
    }

    // Update main provider table
    const updated = await prisma.courierProvider.update({
      where: { id: provider.id },
      data: {
        isDefault: isDefault !== undefined ? isDefault : provider.isDefault,
        isEnabled: isEnabled !== undefined ? isEnabled : provider.isEnabled,
        status: isSandbox ? 'PENDING_CONFIG' : 'ACTIVE',
        apiBaseUrl: apiBaseUrl !== undefined ? apiBaseUrl : provider.apiBaseUrl,
      },
    });

    // Update settings / credentials if passed
    if (settings && typeof settings === 'object') {
      for (const [key, val] of Object.entries(settings)) {
        if (typeof val === 'string' && val.trim() !== '' && !val.includes('••••')) {
          await prisma.courierSetting.upsert({
            where: {
              providerId_key: {
                providerId: provider.id,
                key,
              },
            },
            create: {
              providerId: provider.id,
              key,
              value: val.trim(),
              isEncrypted: key.includes('secret') || key.includes('key') || key.includes('token') || key.includes('password'),
            },
            update: {
              value: val.trim(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${provider.name} কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!`,
      provider: updated,
    });
  } catch (error: any) {
    console.error('Update Courier Provider PUT Error:', error);
    return NextResponse.json({ error: error.message || 'কনফিগারেশন সংরক্ষণ ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
