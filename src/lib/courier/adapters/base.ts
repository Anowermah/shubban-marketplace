/**
 * Abstract Base Courier Provider Adapter
 */

import {
  CourierCode,
  CreateShipmentInput,
  CourierBookingResult,
  CourierTrackingResult,
} from '../types';

export interface CourierAdapter {
  readonly code: CourierCode;
  readonly name: string;

  /**
   * Book shipment / parcel with courier provider
   */
  createShipment(input: CreateShipmentInput): Promise<CourierBookingResult>;

  /**
   * Track parcel status by consignment ID or tracking code
   */
  trackShipment(trackingOrConsignmentId: string): Promise<CourierTrackingResult>;

  /**
   * Cancel an active pickup or booking
   */
  cancelShipment(consignmentId: string): Promise<{ success: boolean; message: string }>;

  /**
   * Test API connectivity and authentication credentials
   */
  testConnection(): Promise<{ success: boolean; message: string; balance?: number }>;

  /**
   * Verify authenticity of incoming webhook payloads
   */
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string | any): boolean;
}

