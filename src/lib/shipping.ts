import { prisma } from './prisma';

export interface DeliveryCalculation {
  zoneCode: string;
  zoneName: string;
  baseRate: number;
  weightKg: number;
  extraWeightCharge: number;
  totalDeliveryCharge: number;
  isFreeDelivery: boolean;
  estimatedDays: string;
  courierPartner: string;
}

/**
 * Seeds standard Bangladesh shipping zones and courier methods if not yet present.
 */
export async function seedDefaultShippingZones() {
  const count = await prisma.shippingZone.count();
  if (count > 0) return;

  const zonesData = [
    {
      name: 'ঢাকা মেট্রো (Dhaka City)',
      code: 'DHAKA_METRO',
      rate: 60.0,
      estimatedDays: '১-২ কার্যদিবস',
      freeDeliveryMin: 1000.0,
      methods: {
        create: [
          {
            name: 'স্ট্যান্ডার্ড ডেলিভারি (পাঠাও / স্টিডফাস্ট)',
            code: 'STANDARD',
            baseCharge: 60.0,
            perKgExtra: 20.0,
            courierPartner: 'Pathao Courier',
          },
          {
            name: 'এক্সপ্রেস ২৪ ঘণ্টা ডেলিভারি',
            code: 'EXPRESS',
            baseCharge: 110.0,
            perKgExtra: 30.0,
            courierPartner: 'Steadfast Logistics',
          },
        ],
      },
    },
    {
      name: 'ঢাকা উপশহর (সাভার, কেরানীগঞ্জ, টঙ্গী, গাজীপুর)',
      code: 'DHAKA_SUBURBS',
      rate: 90.0,
      estimatedDays: '২-৩ কার্যদিবস',
      freeDeliveryMin: 1500.0,
      methods: {
        create: [
          {
            name: 'হোম ডেলিভারি',
            code: 'STANDARD',
            baseCharge: 90.0,
            perKgExtra: 25.0,
            courierPartner: 'Steadfast Logistics',
          },
        ],
      },
    },
    {
      name: 'ঢাকার বাইরে (সমগ্র বাংলাদেশ জেলা সদর)',
      code: 'OUTSIDE_DHAKA',
      rate: 120.0,
      estimatedDays: '২-৪ কার্যদিবস',
      freeDeliveryMin: 2000.0,
      methods: {
        create: [
          {
            name: 'কুরিয়ার হোম ডেলিভারি (স্টিডফাস্ট / পেপারফ্লাই)',
            code: 'STANDARD',
            baseCharge: 120.0,
            perKgExtra: 25.0,
            courierPartner: 'Steadfast Logistics',
          },
          {
            name: 'রেডএক্স ডোরস্টেপ সার্ভিস',
            code: 'REDX_STANDARD',
            baseCharge: 130.0,
            perKgExtra: 30.0,
            courierPartner: 'RedX Logistics',
          },
        ],
      },
    },
    {
      name: 'পার্বত্য জেলা ও উপকূলীয় প্রত্যন্ত অঞ্চল',
      code: 'REMOTE',
      rate: 150.0,
      estimatedDays: '৩-৫ কার্যদিবস',
      freeDeliveryMin: null,
      methods: {
        create: [
          {
            name: 'সুন্দরবন কুরিয়ার / ই-কুরিয়ার সার্ভিস',
            code: 'REMOTE_STANDARD',
            baseCharge: 150.0,
            perKgExtra: 35.0,
            courierPartner: 'eCourier / Sundarban',
          },
        ],
      },
    },
  ];

  for (const zone of zonesData) {
    await prisma.shippingZone.create({
      data: zone,
    });
  }
}

/**
 * Calculates delivery charge based on destination zone, package weight, and cart total.
 */
export async function calculateDeliveryCharge(params: {
  zoneCode?: string;
  city?: string;
  weightKg?: number;
  cartTotal?: number;
}): Promise<DeliveryCalculation> {
  await seedDefaultShippingZones();

  const { zoneCode, city, weightKg = 1.0, cartTotal = 0 } = params;

  // Resolve zone code from city if zoneCode is not explicitly given
  let targetCode = zoneCode || 'OUTSIDE_DHAKA';
  if (!zoneCode && city) {
    const normCity = city.toLowerCase().trim();
    if (normCity.includes('ঢাকা') || normCity.includes('dhaka')) {
      if (
        normCity.includes('সাভার') ||
        normCity.includes('কেরানীগঞ্জ') ||
        normCity.includes('গাজীপুর') ||
        normCity.includes('টঙ্গী')
      ) {
        targetCode = 'DHAKA_SUBURBS';
      } else {
        targetCode = 'DHAKA_METRO';
      }
    } else if (
      normCity.includes('বান্দরবান') ||
      normCity.includes('রাঙ্গামাটি') ||
      normCity.includes('খাগড়াছড়ি') ||
      normCity.includes('দ্বীপ')
    ) {
      targetCode = 'REMOTE';
    } else {
      targetCode = 'OUTSIDE_DHAKA';
    }
  }

  const zone = await prisma.shippingZone.findUnique({
    where: { code: targetCode },
    include: { methods: true },
  });

  const effectiveZone =
    zone ||
    (await prisma.shippingZone.findFirst({
      where: { code: 'OUTSIDE_DHAKA' },
      include: { methods: true },
    }))!;

  const baseRate = effectiveZone.rate;
  const isFree = Boolean(
    effectiveZone.freeDeliveryMin && cartTotal >= effectiveZone.freeDeliveryMin
  );

  const extraWeight = Math.max(0, weightKg - 1.0);
  const method = effectiveZone.methods[0];
  const perKgCharge = method?.perKgExtra || 20.0;
  const extraWeightCharge = Math.ceil(extraWeight) * perKgCharge;

  const totalDeliveryCharge = isFree ? 0 : baseRate + extraWeightCharge;

  return {
    zoneCode: effectiveZone.code,
    zoneName: effectiveZone.name,
    baseRate,
    weightKg,
    extraWeightCharge,
    totalDeliveryCharge,
    isFreeDelivery: isFree,
    estimatedDays: effectiveZone.estimatedDays,
    courierPartner: method?.courierPartner || 'Pathao Courier',
  };
}

/**
 * Creates an official courier shipment record with tracking number and consignment details.
 */
export async function createShipment(params: {
  orderId: string;
  subOrderId?: string | null;
  courierCode: 'PATHAO' | 'STEADFAST' | 'REDX' | 'ECOURIER' | 'PAPERFLY';
  courierName?: string;
  recipientName: string;
  shippingPhone: string;
  shippingAddress: string;
  codAmount?: number;
  notes?: string;
}) {
  const {
    orderId,
    subOrderId,
    courierCode,
    courierName,
    recipientName,
    shippingPhone,
    shippingAddress,
    codAmount = 0,
    notes,
  } = params;

  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const shipmentNumber = `SHP-${new Date().getFullYear()}-${randomDigits}`;

  // Generate standardized courier tracking and consignment references
  const trackingNumber = `${courierCode.slice(0, 3)}-BD-${Date.now().toString().slice(-7)}`;
  const consignmentId = `CN-${courierCode.slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;

  const effectiveCourierName =
    courierName ||
    (courierCode === 'PATHAO'
      ? 'Pathao Courier'
      : courierCode === 'STEADFAST'
      ? 'Steadfast Logistics'
      : courierCode === 'REDX'
      ? 'RedX Logistics'
      : 'eCourier Bangladesh');

  return await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        shipmentNumber,
        orderId,
        subOrderId: subOrderId || null,
        courierCode,
        courierName: effectiveCourierName,
        trackingNumber,
        consignmentId,
        status: 'PENDING_PICKUP',
        recipientName,
        shippingPhone,
        shippingAddress,
        codAmount,
        notes: notes || null,
      },
    });

    // Update SubOrder with tracking
    if (subOrderId) {
      await tx.subOrder.update({
        where: { id: subOrderId },
        data: {
          courierName: effectiveCourierName,
          trackingNumber,
        },
      });
    }

    // Update Order with tracking
    await tx.order.update({
      where: { id: orderId },
      data: {
        courierName: effectiveCourierName,
        trackingNumber,
      },
    });

    return shipment;
  });
}

/**
 * Updates shipment status along the fulfillment pipeline:
 * PENDING_PICKUP -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED / FAILED / RETURNED.
 * Automatically marks COD collected and confirms order delivery when delivered.
 */
export async function updateShipmentStatus(params: {
  shipmentId: string;
  status:
    | 'PENDING_PICKUP'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'RETURNED'
    | 'FAILED';
  failedReason?: string;
  notes?: string;
  adminUserId?: string;
}) {
  const { shipmentId, status, failedReason, notes, adminUserId } = params;

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { order: true, subOrder: true },
  });

  if (!shipment) {
    throw new Error('শিপমেন্ট রেকর্ডটি পাওয়া যায়নি।');
  }

  const isNowDelivered = status === 'DELIVERED';
  const isNowFailed = status === 'FAILED' || status === 'RETURNED';

  return await prisma.$transaction(async (tx) => {
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status,
        ...(status === 'PICKED_UP' ? { shippedAt: new Date() } : {}),
        ...(isNowDelivered ? { deliveredAt: new Date(), codCollected: shipment.codAmount } : {}),
        ...(isNowFailed ? { failedReason: failedReason || 'ডেলিভারি ব্যর্থ বা গ্রাহক অনুপস্থিত' } : {}),
        notes: notes ? `${shipment.notes ? shipment.notes + ' | ' : ''}${notes}` : shipment.notes,
      },
    });

    // Update SubOrder if associated
    if (shipment.subOrderId) {
      await tx.subOrder.update({
        where: { id: shipment.subOrderId },
        data: {
          status: isNowDelivered ? 'DELIVERED' : isNowFailed ? 'CANCELLED' : 'SHIPPED',
          ...(isNowDelivered ? { deliveredAt: new Date() } : {}),
          ...(status === 'PICKED_UP' ? { shippedAt: new Date() } : {}),
        },
      });
    }

    // If shipment is DELIVERED, update master Order and mark payment PAID if COD
    if (isNowDelivered) {
      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          orderStatus: 'DELIVERED',
          deliveredAt: new Date(),
          ...(shipment.order.paymentMethod === 'cod' ? { paymentStatus: 'PAID' } : {}),
        },
      });
    }

    if (adminUserId) {
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'SHIPMENT_STATUS_UPDATED',
          entity: 'Shipment',
          entityId: shipment.id,
          details: JSON.stringify({
            shipmentNumber: shipment.shipmentNumber,
            oldStatus: shipment.status,
            newStatus: status,
            trackingNumber: shipment.trackingNumber,
          }),
        },
      });
    }

    return updatedShipment;
  });
}

/**
 * Settles courier COD collection remittance:
 * Records courier delivery fee deduction and net remittance to the platform.
 */
export async function settleCourierRemittance(params: {
  shipmentId: string;
  courierFee: number;
  adminUserId: string;
}) {
  const { shipmentId, courierFee, adminUserId } = params;

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
  });

  if (!shipment) {
    throw new Error('শিপমেন্ট পাওয়া যায়নি।');
  }

  if (shipment.status !== 'DELIVERED') {
    throw new Error('কেবলমাত্র সফলভাবে ডেলিভারিকৃত শিপমেন্টের সিওডি রেমিট্যান্স সেটেল করা সম্ভব।');
  }

  const netRemittance = Math.max(0, shipment.codCollected - courierFee);

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        courierFee,
        netRemittance,
        isRemitted: true,
        remittedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'COURIER_REMITTANCE_SETTLED',
        entity: 'Shipment',
        entityId: shipment.id,
        details: JSON.stringify({
          shipmentNumber: shipment.shipmentNumber,
          codCollected: shipment.codCollected,
          courierFee,
          netRemittance,
        }),
      },
    });

    return updated;
  });
}

/**
 * Returns complete COD collection, remittance, and courier performance report.
 */
export async function getCodCollectionReport(courierCode?: string) {
  const where: any = {};
  if (courierCode) where.courierCode = courierCode;

  const shipments = await prisma.shipment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const totalCodExpected = shipments.reduce((acc, s) => acc + s.codAmount, 0);
  const totalCodCollected = shipments.reduce((acc, s) => acc + s.codCollected, 0);
  const totalCourierFees = shipments.reduce((acc, s) => acc + s.courierFee, 0);
  const totalNetRemitted = shipments.reduce((acc, s) => acc + (s.isRemitted ? s.netRemittance : 0), 0);
  const unremittedBalance = shipments
    .filter((s) => s.status === 'DELIVERED' && !s.isRemitted)
    .reduce((acc, s) => acc + s.codCollected, 0);

  return {
    totalShipments: shipments.length,
    deliveredCount: shipments.filter((s) => s.status === 'DELIVERED').length,
    inTransitCount: shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'PICKED_UP').length,
    failedCount: shipments.filter((s) => s.status === 'FAILED' || s.status === 'RETURNED').length,
    financials: {
      totalCodExpected,
      totalCodCollected,
      totalCourierFees,
      totalNetRemitted,
      unremittedBalance,
    },
    shipments,
  };
}

