/**
 * Shubban Library Marketplace — Courier Manager
 * 
 * Orchestrates courier booking, tracking, duplicate prevention,
 * and database synchronization across Pathao, Steadfast, and REDX.
 */

import { prisma } from '@/lib/prisma';
import { CourierAdapter } from './adapters/base';
import { SteadfastAdapter } from './adapters/steadfast';
import { PathaoAdapter } from './adapters/pathao';
import { RedxAdapter } from './adapters/redx';
import {
  CourierCode,
  CreateShipmentInput,
  CourierBookingResult,
  CourierTrackingResult,
  ShipmentStatus,
} from './types';

export class CourierManager {
  /**
   * Instantiate appropriate adapter for a given courier provider
   */
  static async getAdapter(courierCode?: CourierCode): Promise<CourierAdapter> {
    const code = courierCode?.toUpperCase() || 'STEADFAST';

    // Retrieve credentials from DB
    const provider = await prisma.courierProvider.findFirst({
      where: courierCode ? { code } : { isDefault: true, isEnabled: true },
      include: { settings: true },
    });

    const settingsMap: Record<string, string> = {};
    provider?.settings?.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    switch (code) {
      case 'STEADFAST':
        return new SteadfastAdapter(
          settingsMap['api_key'],
          settingsMap['secret_key'],
          provider?.apiBaseUrl
        );

      case 'PATHAO':
        return new PathaoAdapter(
          settingsMap['client_id'],
          settingsMap['client_secret'],
          settingsMap['username'],
          settingsMap['password'],
          settingsMap['store_id'],
          provider?.apiBaseUrl
        );

      case 'REDX':
        return new RedxAdapter(
          settingsMap['access_token'],
          provider?.apiBaseUrl
        );

      default:
        return new SteadfastAdapter();
    }
  }

  /**
   * Book a shipment with duplicate booking prevention
   */
  static async bookShipment(input: CreateShipmentInput): Promise<CourierBookingResult> {
    // 1. Verify Order Exists
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        shipments: {
          where: {
            status: { not: 'CANCELLED' },
          },
        },
      },
    });

    if (!order) {
      throw new Error(`অর্ডার আইডি ${input.orderId} পাওয়া যায়নি।`);
    }

    // 2. Accidental Duplicate Booking Prevention
    if (order.shipments && order.shipments.length > 0) {
      const active = order.shipments[0];
      throw new Error(
        `এই অর্ডারের জন্য ইতিমধ্যে একটি সক্রিয় শিপমেন্ট বুক করা আছে (শিপমেন্ট নং: ${active.shipmentNumber}, কুরিয়ার: ${active.courierName}, ট্র্যাকিং: ${active.trackingNumber || active.consignmentId})। পুনরাবৃত্তি বুকিং রোধ করা হয়েছে।`
      );
    }

    // 3. Resolve Provider & Mode
    const targetCode: CourierCode = input.courierCode || 'STEADFAST';
    const isManual = targetCode === 'MANUAL' || Boolean(input.isManual);

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const shipmentNumber = `SHP-${year}-${randomSuffix}`;

    if (isManual) {
      // 4A. Manual Courier Booking
      const manualName = input.manualCourierName?.trim() || 'ম্যানুয়াল কুরিয়ার';
      const manualTracking = input.manualTrackingNumber?.trim() || input.manualConsignmentId?.trim() || shipmentNumber;
      const manualConsignment = input.manualConsignmentId?.trim() || null;
      const courierFee = typeof input.manualCourierFee === 'number' ? input.manualCourierFee : 60.0;

      const shipment = await prisma.shipment.create({
        data: {
          shipmentNumber,
          orderId: order.id,
          courierCode: 'MANUAL',
          courierName: manualName,
          trackingNumber: manualTracking,
          consignmentId: manualConsignment,
          status: 'BOOKED',
          shippingAddress: input.recipientAddress,
          shippingPhone: input.recipientPhone,
          recipientName: input.recipientName,
          codAmount: input.codAmount,
          courierFee,
          weightKg: input.weightKg || 1.0,
          deliveryTimeline: JSON.stringify([
            {
              time: new Date().toISOString(),
              status: 'ম্যানুয়াল পার্সেল বুকিং নথিভুক্ত',
              note: `${manualName} এ পার্সেল পাঠানোর তথ্য অ্যাডমিন কর্তৃক নথিভুক্ত হয়েছে।`,
            },
          ]),
        },
      });

      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: 'BOOKED',
          note: `ম্যানুয়াল কুরিয়ার বুকিং সম্পন্ন হয়েছে (${manualName})`,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: manualTracking,
          courierName: manualName,
        },
      });

      return {
        success: true,
        courierCode: 'MANUAL',
        trackingNumber: manualTracking,
        consignmentId: manualConsignment || manualTracking,
        courierFee,
        status: 'BOOKED',
        rawResponse: { shipmentId: shipment.id, shipmentNumber },
        message: `ম্যানুয়াল কুরিয়ার বুকিং সফল হয়েছে! ট্র্যাকিং নং: ${manualTracking}`,
      };
    }

    // 4B. Automated Courier Provider API Booking (Steadfast, Pathao, REDX)
    const adapter = await this.getAdapter(targetCode);
    const bookingResult = await adapter.createShipment(input);

    if (!bookingResult.success) {
      // Log failed attempt for audit and debug
      await prisma.courierWebhookLog.create({
        data: {
          providerCode: targetCode,
          event: 'booking_failed',
          shipmentId: null,
          payload: JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            error: bookingResult.error || bookingResult.message,
            timestamp: new Date().toISOString(),
          }),
          processedStatus: 'FAILED',
          errorMessage: bookingResult.error || bookingResult.message || 'Courier API booking failed',
        },
      });

      return bookingResult;
    }

    // 5. Persist Shipment in DB upon verified provider API success
    const providerRecord = await prisma.courierProvider.findUnique({
      where: { code: targetCode },
    });

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        orderId: order.id,
        providerId: providerRecord?.id,
        courierCode: targetCode,
        courierName: adapter.name,
        trackingNumber: bookingResult.trackingNumber,
        consignmentId: bookingResult.consignmentId,
        status: bookingResult.status,
        shippingAddress: input.recipientAddress,
        shippingPhone: input.recipientPhone,
        recipientName: input.recipientName,
        codAmount: input.codAmount,
        courierFee: bookingResult.courierFee || 60.0,
        weightKg: input.weightKg || 1.0,
        deliveryTimeline: JSON.stringify([
          {
            time: new Date().toISOString(),
            status: 'পার্সেল বুকিং সম্পন্ন',
            note: `${adapter.name} এ পার্সেল কনসাইনমেন্ট সৃষ্টি হয়েছে।`,
          },
        ]),
      },
    });

    // 6. Record Shipment Event
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: bookingResult.status,
        note: `কুরিয়ার বুকিং সম্পন্ন হয়েছে (${adapter.name})`,
      },
    });

    // 7. Update Order Tracking Info
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: bookingResult.trackingNumber || bookingResult.consignmentId,
        courierName: adapter.name,
      },
    });

    return {
      ...bookingResult,
      rawResponse: {
        ...bookingResult.rawResponse,
        shipmentId: shipment.id,
        shipmentNumber,
      },
    };
  }

  /**
   * Update manual shipment details (courier name, tracking code, status, fee)
   */
  static async updateManualShipment(params: {
    shipmentId: string;
    courierName?: string;
    trackingNumber?: string;
    consignmentId?: string;
    status?: ShipmentStatus;
    courierFee?: number;
    note?: string;
  }) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: params.shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      throw new Error('শিপমেন্ট পাওয়া যায়নি।');
    }

    const updateData: any = {};
    if (params.courierName) updateData.courierName = params.courierName;
    if (params.trackingNumber) updateData.trackingNumber = params.trackingNumber;
    if (params.consignmentId) updateData.consignmentId = params.consignmentId;
    if (params.status) updateData.status = params.status;
    if (typeof params.courierFee === 'number') updateData.courierFee = params.courierFee;
    if (params.status === 'DELIVERED') updateData.deliveredAt = new Date();

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    if (params.status) {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: params.status,
          note: params.note || `শিপমেন্ট স্ট্যাটাস পরিবর্তন: ${params.status}`,
        },
      });
    }

    if (params.trackingNumber || params.courierName) {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          ...(params.trackingNumber ? { trackingNumber: params.trackingNumber } : {}),
          ...(params.courierName ? { courierName: params.courierName } : {}),
        },
      });
    }

    return updated;
  }

  /**
   * Track parcel live status
   */
  static async trackShipment(identifier: string): Promise<CourierTrackingResult> {
    // 1. Look up Shipment record by trackingNumber, consignmentId, shipmentNumber, or orderId/orderNumber
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { trackingNumber: identifier },
          { consignmentId: identifier },
          { shipmentNumber: identifier },
          { order: { orderNumber: identifier } },
          { orderId: identifier },
        ],
      },
      include: {
        order: { select: { orderNumber: true, createdAt: true } },
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!shipment) {
      throw new Error(`ট্র্যাকিং নম্বর বা অর্ডার আইডি "${identifier}" দিয়ে কোনো পার্সেল পাওয়া যায়নি।`);
    }

    const adapter = await this.getAdapter(shipment.courierCode as CourierCode);
    const trackingCode = shipment.trackingNumber || shipment.consignmentId || shipment.shipmentNumber;
    const providerTracking = await adapter.trackShipment(trackingCode);

    // Merge DB events with provider checkpoints
    const dbEvents: any[] = shipment.events.map((e) => ({
      time: e.timestamp.toISOString(),
      status: e.status,
      note: e.note,
    }));

    return {
      success: true,
      courierCode: shipment.courierCode as CourierCode,
      trackingNumber: trackingCode,
      consignmentId: shipment.consignmentId || undefined,
      currentStatus: (shipment.status as ShipmentStatus) || providerTracking.currentStatus,
      courierRawStatus: providerTracking.courierRawStatus,
      checkpoints: providerTracking.checkpoints.length > 0 ? providerTracking.checkpoints : dbEvents,
      deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.toISOString() : undefined,
    };
  }

  /**
   * Cancel shipment
   */
  static async cancelShipment(shipmentId: string, reason = 'Admin cancelled'): Promise<{ success: boolean; message: string }> {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      throw new Error('শিপমেন্ট পাওয়া যায়নি।');
    }

    if (shipment.status === 'DELIVERED') {
      throw new Error('ইতিমধ্যে ডেলিভারকৃত পার্সেল বাতিল করা সম্ভব নয়।');
    }

    const adapter = await this.getAdapter(shipment.courierCode as CourierCode);
    if (shipment.consignmentId) {
      await adapter.cancelShipment(shipment.consignmentId);
    }

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: 'CANCELLED',
        failedReason: reason,
      },
    });

    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: 'CANCELLED',
        note: reason,
      },
    });

    await prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        orderStatus: 'PROCESSING',
        cancelReason: `শিপমেন্ট বাতিল: ${reason}`,
      },
    });

    return {
      success: true,
      message: `শিপমেন্ট ${shipment.shipmentNumber} সফলভাবে বাতিল করা হয়েছে।`,
    };
  }
}

