/**
 * Shubban Library Marketplace — Courier & Logistics Types & DTOs
 */

export type CourierCode = 'STEADFAST' | 'PATHAO' | 'REDX' | 'ECOURIER' | 'PAPERFLY' | 'MANUAL';

export type ShipmentStatus =
  | 'NOT_BOOKED'
  | 'BOOKING_PENDING'
  | 'BOOKED'
  | 'PENDING_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILED'
  | 'CANCELLED';

export interface CreateShipmentInput {
  orderId: string;
  courierCode?: CourierCode;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity?: string;
  recipientZone?: string;
  recipientArea?: string;
  codAmount: number;
  weightKg?: number;
  itemDescription?: string;
  specialInstruction?: string;
  // Manual courier fields
  isManual?: boolean;
  manualCourierName?: string;
  manualTrackingNumber?: string;
  manualConsignmentId?: string;
  manualCourierFee?: number;
  adminNotes?: string;
}

export interface CourierBookingResult {
  success: boolean;
  courierCode: CourierCode;
  trackingNumber: string;
  consignmentId: string;
  courierFee: number;
  status: ShipmentStatus;
  rawResponse: any;
  message?: string;
  error?: string;
}

export interface CourierTrackingCheckpoint {
  time: string;
  status: string;
  location?: string;
  note?: string;
}

export interface CourierTrackingResult {
  success: boolean;
  courierCode: CourierCode;
  trackingNumber: string;
  consignmentId?: string;
  currentStatus: ShipmentStatus;
  courierRawStatus: string;
  checkpoints: CourierTrackingCheckpoint[];
  deliveredAt?: string;
  failedReason?: string;
  message?: string;
}

export interface ShippingCalculationInput {
  destinationType: 'INSIDE_DHAKA' | 'SUB_DHAKA' | 'OUTSIDE_DHAKA' | 'DISTRICT';
  district?: string;
  upazila?: string;
  totalWeightKg?: number;
  subtotalAmount?: number;
  paymentMethod?: string; // 'cod', 'sslcommerz', 'bkash'
}

export interface ShippingCalculationResult {
  baseRate: number;
  weightCharge: number;
  codCharge: number;
  specialDeliveryFee: number;
  totalShippingFee: number;
  isFreeDelivery: boolean;
  estimatedDays: string;
  appliedZoneName: string;
}

export interface CodSettlementSummary {
  courierCode: CourierCode;
  totalShipments: number;
  totalCodCollected: number;
  totalCourierCharges: number;
  totalCodFees: number;
  netReceivable: number;
  receivedAmount: number;
  pendingSettlement: number;
}

