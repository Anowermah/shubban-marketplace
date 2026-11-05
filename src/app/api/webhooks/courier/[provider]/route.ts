import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShipmentStatus } from '@/lib/courier/types';

export const dynamic = 'force-dynamic';

/**
 * Maps raw courier webhook status to normalized internal ShipmentStatus
 */
function normalizeWebhookStatus(provider: string, rawStatus: string): ShipmentStatus {
  const norm = (rawStatus || '').toLowerCase().trim();

  // Steadfast status mapping
  if (provider === 'steadfast') {
    if (['in_review', 'pending'].includes(norm)) return 'PENDING_PICKUP';
    if (['picked_up', 'in_transit'].includes(norm)) return 'IN_TRANSIT';
    if (['out_for_delivery'].includes(norm)) return 'OUT_FOR_DELIVERY';
    if (['delivered', 'delivery_successful'].includes(norm)) return 'DELIVERED';
    if (['cancelled', 'cancelled_by_recipient'].includes(norm)) return 'CANCELLED';
    if (['returned', 'return_received_by_merchant', 'partial_delivered'].includes(norm)) return 'RETURNED';
    if (['hold', 'unknown', 'failed'].includes(norm)) return 'FAILED';
  }

  // Pathao status mapping
  if (provider === 'pathao') {
    if (['Pickup_Requested', 'Pending'].includes(rawStatus)) return 'PENDING_PICKUP';
    if (['Picked_Up', 'In_Transit'].includes(rawStatus)) return 'IN_TRANSIT';
    if (['Out_For_Delivery'].includes(rawStatus)) return 'OUT_FOR_DELIVERY';
    if (['Delivered', 'Partial_Delivery'].includes(rawStatus)) return 'DELIVERED';
    if (['Cancelled'].includes(rawStatus)) return 'CANCELLED';
    if (['Returned', 'Return_Received'].includes(rawStatus)) return 'RETURNED';
  }

  // REDX status mapping
  if (provider === 'redx') {
    if (['pickup-pending', 'ready-for-pickup'].includes(norm)) return 'PENDING_PICKUP';
    if (['picked-up', 'in-transit'].includes(norm)) return 'IN_TRANSIT';
    if (['out-for-delivery'].includes(norm)) return 'OUT_FOR_DELIVERY';
    if (['delivered'].includes(norm)) return 'DELIVERED';
    if (['canceled', 'cancelled'].includes(norm)) return 'CANCELLED';
    if (['returned', 'returning'].includes(norm)) return 'RETURNED';
  }

  if (norm.includes('deliver')) return 'DELIVERED';
  if (norm.includes('return')) return 'RETURNED';
  if (norm.includes('cancel')) return 'CANCELLED';
  if (norm.includes('transit')) return 'IN_TRANSIT';

  return 'IN_TRANSIT';
}

export async function POST(
  req: Request,
  { params }: { params: { provider: string } }
) {
  const providerCode = params.provider.toLowerCase();
  const rawBodyText = await req.text();

  let body: any = {};
  try {
    body = JSON.parse(rawBodyText);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // 1. Extract Tracking and Status details based on provider format
  let trackingId = '';
  let consignmentId = '';
  let rawStatus = '';
  let eventType = 'status_update';
  let eventId = '';

  if (providerCode === 'steadfast') {
    // Steadfast payload format: { consignment_id, order_id, invoice, status, ... }
    consignmentId = String(body.consignment_id || body.cid || '');
    trackingId = String(body.tracking_code || body.tracking_id || consignmentId);
    rawStatus = body.status || '';
    eventType = `steadfast.${rawStatus}`;
    eventId = `stf_${consignmentId}_${rawStatus}_${body.updated_at || Date.now()}`;
  } else if (providerCode === 'pathao') {
    // Pathao payload format: { consignment_id, merchant_order_id, order_status, ... }
    consignmentId = String(body.consignment_id || '');
    trackingId = String(body.consignment_id || '');
    rawStatus = body.order_status || '';
    eventType = `pathao.${rawStatus}`;
    eventId = `pth_${consignmentId}_${rawStatus}_${Date.now()}`;
  } else if (providerCode === 'redx') {
    // REDX payload format: { tracking_id, status, ... }
    trackingId = String(body.tracking_id || '');
    consignmentId = trackingId;
    rawStatus = body.status || '';
    eventType = `redx.${rawStatus}`;
    eventId = `rdx_${trackingId}_${rawStatus}_${Date.now()}`;
  } else {
    trackingId = String(body.tracking_id || body.trackingNumber || '');
    rawStatus = body.status || '';
    eventId = `generic_${Date.now()}`;
  }

  // 2. Locate corresponding Shipment
  const shipment = await prisma.shipment.findFirst({
    where: {
      OR: [
        { trackingNumber: trackingId },
        { consignmentId: consignmentId },
        { shipmentNumber: trackingId },
        { order: { orderNumber: String(body.invoice || body.merchant_order_id || body.order_id || '') } },
      ],
    },
    include: { order: true },
  });

  // 3. Log Webhook Receipt in Database (Idempotent tracking)
  const webhookLog = await prisma.courierWebhookLog.create({
    data: {
      providerCode: providerCode.toUpperCase(),
      event: eventType,
      consignmentId: consignmentId || null,
      trackingNumber: trackingId || null,
      shipmentId: shipment?.id || null,
      payload: rawBodyText,
      processedStatus: 'PENDING',
    },
  });

  if (!shipment) {
    await prisma.courierWebhookLog.update({
      where: { id: webhookLog.id },
      data: {
        processedStatus: 'FAILED',
        errorMessage: `Shipment not found for tracking: ${trackingId || consignmentId}`,
      },
    });
    // Return 200 so courier does not infinitely retry
    return NextResponse.json({
      success: true,
      message: 'Webhook logged, but no matching shipment found in system.',
    });
  }

  // 4. Check for redundant/idempotent status
  const normalizedStatus = normalizeWebhookStatus(providerCode, rawStatus);

  if (shipment.status === normalizedStatus) {
    await prisma.courierWebhookLog.update({
      where: { id: webhookLog.id },
      data: { processedStatus: 'PROCESSED' },
    });
    return NextResponse.json({
      success: true,
      message: 'Status already up-to-date.',
    });
  }

  // 5. Apply Status Synchronization
  const updateData: any = {
    status: normalizedStatus,
  };

  if (normalizedStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }

  await prisma.shipment.update({
    where: { id: shipment.id },
    data: updateData,
  });

  // 6. Record Shipment Event
  await prisma.shipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      status: normalizedStatus,
      note: `কুরিয়ার ওয়েবহুক ইভেন্ট: ${rawStatus} (${providerCode.toUpperCase()})`,
      location: body.location || body.hub_name || 'কুরিয়ার হাব',
    },
  });

  // 7. Update Parent Order
  if (normalizedStatus === 'DELIVERED') {
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        orderStatus: 'DELIVERED',
        paymentStatus: 'PAID', // Delivered parcels have their COD collected
      },
    });
  } else if (normalizedStatus === 'RETURNED') {
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        orderStatus: 'CANCELLED',
        cancelReason: `কুরিয়ার পার্সেল রিটার্ন হয়েছে (${rawStatus})`,
      },
    });
  } else if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(normalizedStatus)) {
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: { orderStatus: 'SHIPPED' },
    });
  }

  // 8. Mark Webhook as Processed
  await prisma.courierWebhookLog.update({
    where: { id: webhookLog.id },
    data: { processedStatus: 'PROCESSED' },
  });

  return NextResponse.json({
    success: true,
    message: `Shipment ${shipment.shipmentNumber} updated to ${normalizedStatus}.`,
  });
}
