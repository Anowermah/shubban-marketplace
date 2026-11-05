import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CourierManager } from '@/lib/courier/manager';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                book: { select: { id: true, title: true, author: { select: { name: true } } } },
              },
            },
          },
        },
        events: { orderBy: { timestamp: 'desc' } },
        webhookLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'শিপমেন্ট পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shipment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'শিপমেন্ট লোড ব্যর্থ' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action;

    const shipment = await prisma.shipment.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                book: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'শিপমেন্ট পাওয়া যায়নি।' }, { status: 404 });
    }

    if (action === 'cancel') {
      const reason = body.reason || 'Admin cancelled from dashboard';
      const cancelResult = await CourierManager.cancelShipment(shipment.id, reason);

      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'COURIER_SHIPMENT_CANCELLED',
          entity: 'Shipment',
          entityId: shipment.id,
          details: JSON.stringify({
            shipmentNumber: shipment.shipmentNumber,
            reason,
            cancelledBy: session.name,
          }),
        },
      });

      return NextResponse.json({
        ...cancelResult,
        shipment: { id: shipment.id, status: 'CANCELLED' },
      });
    }

    if (action === 'update_manual') {
      const updated = await CourierManager.updateManualShipment({
        shipmentId: shipment.id,
        courierName: body.courierName,
        trackingNumber: body.trackingNumber,
        consignmentId: body.consignmentId,
        status: body.status,
        courierFee: typeof body.courierFee === 'number' ? body.courierFee : undefined,
        note: body.note,
      });

      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'MANUAL_COURIER_UPDATE',
          entity: 'Shipment',
          entityId: shipment.id,
          details: JSON.stringify({
            shipmentNumber: shipment.shipmentNumber,
            updates: body,
            updatedBy: session.name,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'ম্যানুয়াল শিপমেন্ট তথ্য সফলভাবে আপডেট হয়েছে।',
        shipment: updated,
      });
    }

    if (action === 'print_invoice') {
      // Mark invoice printed
      const updatedShipment = await prisma.shipment.update({
        where: { id: shipment.id },
        data: { invoicePrintedAt: new Date() },
      });

      const invoiceData = {
        invoiceNumber: `INV-${shipment.order.orderNumber}`,
        orderNumber: shipment.order.orderNumber,
        date: new Date().toLocaleDateString('bn-BD'),
        storeName: 'শুব্বান লাইব্রেরী',
        storeDomain: 'atrbd.com',
        storePhone: '+৮৮০ ১৭১১-০০০০০০',
        storeAddress: 'ঢাকা, বাংলাদেশ',
        customerName: shipment.recipientName,
        customerPhone: shipment.shippingPhone,
        shippingAddress: shipment.shippingAddress,
        paymentMethod: shipment.order.paymentMethod,
        paymentStatus: shipment.order.paymentStatus,
        items: shipment.order.items.map((i) => ({
          title: i.book.title,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
        })),
        subtotal: shipment.order.subtotal,
        shippingFee: shipment.order.shippingFee,
        discount: shipment.order.discount,
        total: shipment.order.total,
        codAmount: shipment.codAmount,
      };

      return NextResponse.json({
        success: true,
        invoiceData,
        shipment: updatedShipment,
      });
    }

    if (action === 'track') {
      const trackingIdentifier = shipment.trackingNumber || shipment.consignmentId || shipment.shipmentNumber;
      const trackingResult = await CourierManager.trackShipment(trackingIdentifier);
      return NextResponse.json(trackingResult);
    }

    if (action === 'print_label') {
      // Mark as printed
      const updatedShipment = await prisma.shipment.update({
        where: { id: shipment.id },
        data: { labelPrintedAt: new Date() },
      });

      // Prepare label data
      const labelData = {
        storeName: 'শুব্বান লাইব্রেরী',
        storeDomain: 'atrbd.com',
        storePhone: '+৮৮০ ১৭১১-০০০০০০',
        returnAddress: 'শুব্বান লাইব্রেরী হাব, ঢাকা, বাংলাদেশ',
        shipmentNumber: shipment.shipmentNumber,
        trackingNumber: shipment.trackingNumber || shipment.consignmentId,
        courierName: shipment.courierName,
        courierCode: shipment.courierCode,
        orderNumber: shipment.order.orderNumber,
        date: new Date().toLocaleDateString('bn-BD'),
        recipientName: shipment.recipientName,
        recipientPhone: shipment.shippingPhone,
        shippingAddress: shipment.shippingAddress,
        weightKg: shipment.weightKg,
        codAmount: shipment.codAmount,
        isCod: shipment.codAmount > 0,
        items: shipment.order.items.map((i) => ({
          title: i.book.title,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      return NextResponse.json({
        success: true,
        labelData,
        shipment: updatedShipment,
      });
    }

    return NextResponse.json({ error: 'অবৈধ অ্যাকশন নির্দেশ' }, { status: 400 });
  } catch (error: any) {
    console.error('Shipment Action POST Error:', error);
    return NextResponse.json({ error: error.message || 'অপারেশন ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

