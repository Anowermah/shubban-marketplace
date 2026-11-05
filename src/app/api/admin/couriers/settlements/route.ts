import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET: List COD Settlements and unremitted delivered shipments
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courierCode = searchParams.get('courierCode') || undefined;

    // 1. Fetch unremitted delivered shipments
    const unremittedShipments = await prisma.shipment.findMany({
      where: {
        status: 'DELIVERED',
        isRemitted: false,
        codAmount: { gt: 0 },
        ...(courierCode ? { courierCode } : {}),
      },
      include: {
        order: { select: { orderNumber: true, total: true } },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    // 2. Fetch past settlements
    const settlements = await prisma.codSettlement.findMany({
      where: courierCode ? { courierCode } : {},
      include: {
        shipments: {
          select: {
            id: true,
            shipmentNumber: true,
            trackingNumber: true,
            codAmount: true,
            courierFee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate unremitted totals
    const unremittedTotalCod = unremittedShipments.reduce((sum, s) => sum + s.codAmount, 0);
    const unremittedCourierFees = unremittedShipments.reduce((sum, s) => sum + s.courierFee, 0);
    const estimatedNetPending = unremittedTotalCod - unremittedCourierFees;

    return NextResponse.json({
      success: true,
      summary: {
        unremittedCount: unremittedShipments.length,
        unremittedTotalCod,
        unremittedCourierFees,
        estimatedNetPending,
      },
      unremittedShipments: unremittedShipments.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        trackingNumber: s.trackingNumber || s.consignmentId,
        orderNumber: s.order.orderNumber,
        courierName: s.courierName,
        courierCode: s.courierCode,
        recipientName: s.recipientName,
        codAmount: s.codAmount,
        courierFee: s.courierFee,
        deliveredAt: s.deliveredAt,
      })),
      settlements: settlements.map((set) => ({
        id: set.id,
        settlementNumber: set.settlementNumber,
        courierCode: set.courierCode,
        totalShipments: set.shipments.length,
        totalCodAmount: set.totalCodCollected,
        courierCharges: set.totalCourierCharges,
        codFees: set.totalCodFees,
        netReceivable: set.netSettlementAmount,
        amountReceived: set.receivedAmount,
        status: set.status,
        remittanceRef: set.bankTxnReference,
        bankAccountInfo: set.bankAccount,
        discrepancyNote: set.notes,
        settledAt: set.settledAt,
        createdAt: set.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('COD Settlements GET Error:', error);
    return NextResponse.json({ error: error.message || 'সেটেলমেন্ট তথ্য লোড ব্যর্থ' }, { status: 500 });
  }
}

/**
 * POST: Create a new COD Settlement reconciliation
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const {
      courierCode,
      shipmentIds,
      remittanceRef,
      bankAccountInfo,
      amountReceived,
      notes,
    } = body;

    if (!courierCode || !shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ error: 'কুরিয়ার ও ন্যূনতম একটি পার্সেল নির্বাচন করা আবশ্যক।' }, { status: 400 });
    }

    // Fetch the shipments
    const shipments = await prisma.shipment.findMany({
      where: {
        id: { in: shipmentIds },
        status: 'DELIVERED',
        isRemitted: false,
      },
    });

    if (shipments.length === 0) {
      return NextResponse.json({ error: 'নির্বাচিত পার্সেলগুলো ইতিমধ্যে সেটেল্ড অথবা ডেলিভারি সম্পন্ন হয়নি।' }, { status: 400 });
    }

    const totalCod = shipments.reduce((sum, s) => sum + s.codAmount, 0);
    const courierCharges = shipments.reduce((sum, s) => sum + s.courierFee, 0);
    const codFees = Math.round(totalCod * 0.01); // 1% typical COD gateway fee
    const netReceivable = totalCod - courierCharges - codFees;
    const received = typeof amountReceived === 'number' ? amountReceived : netReceivable;

    // Generate settlement number
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const settlementNumber = `STL-${courierCode}-${year}-${rand}`;

    // Create settlement record
    const settlement = await prisma.codSettlement.create({
      data: {
        settlementNumber,
        courierCode,
        totalCodCollected: totalCod,
        totalCourierCharges: courierCharges,
        totalCodFees: codFees,
        netSettlementAmount: netReceivable,
        receivedAmount: received,
        status: received >= netReceivable ? 'SETTLED' : 'DISCREPANCY',
        bankTxnReference: remittanceRef || `INV-${Date.now()}`,
        bankAccount: bankAccountInfo || 'ব্যাংক রেমিট্যান্স অ্যাকাউন্ট',
        notes: received < netReceivable ? `পার্থক্য: ৳${netReceivable - received} (${notes || 'রেমিট্যান্স অমিল'})` : (notes || null),
        settledAt: new Date(),
      },
    });

    // Mark shipments as remitted
    await prisma.shipment.updateMany({
      where: { id: { in: shipments.map((s) => s.id) } },
      data: {
        isRemitted: true,
        settlementId: settlement.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `কুরিয়ার সিওডি সেটেলমেন্ট (${settlement.settlementNumber}) সফলভাবে সম্পন্ন হয়েছে! মোট সংগৃহীত: ৳${totalCod}, প্রাপ্ত রেমিট্যান্স: ৳${received}`,
      settlement,
    });
  } catch (error: any) {
    console.error('COD Settlement POST Error:', error);
    return NextResponse.json({ error: error.message || 'সেটেলমেন্ট সম্পন্ন করা যায়নি।' }, { status: 500 });
  }
}
