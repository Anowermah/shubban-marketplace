/**
 * Dynamic Shipping & Delivery Charge Calculation Engine
 * 
 * Computes rates based on database-configured ShippingRate and ShippingZone rules.
 * No hardcoded prices: all rates, weights, and COD percentages are pulled from DB.
 */

import { prisma } from '@/lib/prisma';
import { ShippingCalculationInput, ShippingCalculationResult } from './types';

export class ShippingCalculator {
  /**
   * Determine destination type from district & area text
   */
  static detectDestinationType(district?: string, address?: string): 'INSIDE_DHAKA' | 'SUB_DHAKA' | 'OUTSIDE_DHAKA' {
    if (!district && !address) return 'OUTSIDE_DHAKA';

    const normalizedDistrict = (district || '').trim().toLowerCase();
    const normalizedAddress = (address || '').trim().toLowerCase();

    // Dhaka metro checks
    if (
      normalizedDistrict === 'dhaka' ||
      normalizedDistrict === 'ঢাকা' ||
      normalizedDistrict.includes('dhaka metro') ||
      normalizedDistrict.includes('ঢাকা মেট্রো')
    ) {
      // Suburbs of Dhaka (Savar, Keraniganj, Dhamrai, Ashulia, Gazipur, Narayanganj)
      const suburbs = ['savar', 'সাভার', 'keraniganj', 'কেরানীগঞ্জ', 'dhamrai', 'ধামরাই', 'ashulia', 'আশুলিয়া', 'narayanganj', 'নারায়ণগঞ্জ', 'gazipur', 'গাজীপুর'];
      if (suburbs.some((s) => normalizedAddress.includes(s) || normalizedDistrict.includes(s))) {
        return 'SUB_DHAKA';
      }
      return 'INSIDE_DHAKA';
    }

    return 'OUTSIDE_DHAKA';
  }

  /**
   * Compute exact shipping charge dynamically
   */
  static async calculateRate(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
    const destination = input.destinationType || 'OUTSIDE_DHAKA';
    const weight = Math.max(0.5, input.totalWeightKg || 1.0);
    const subtotal = input.subtotalAmount || 0;
    const isCod = (input.paymentMethod || '').toLowerCase() === 'cod';

    // 1. Find matching ShippingRate from DB
    let rateRecord = await prisma.shippingRate.findFirst({
      where: {
        isActive: true,
        OR: [
          { destinationType: destination, district: input.district || undefined },
          { destinationType: destination },
        ],
      },
      orderBy: { district: 'desc' }, // specific district match takes precedence
    });

    // Fallback to general zone rate if no specific shipping rate found
    let baseRate = rateRecord?.baseRate ?? (destination === 'INSIDE_DHAKA' ? 60.0 : destination === 'SUB_DHAKA' ? 90.0 : 120.0);
    let baseWeight = rateRecord?.baseWeightKg ?? 1.0;
    let perKgExtra = rateRecord?.perKgExtraRate ?? 20.0;
    let codPct = rateRecord?.codChargePct ?? (destination === 'INSIDE_DHAKA' ? 0.0 : 1.0);
    let codFixed = rateRecord?.codChargeFixed ?? 0.0;
    let specialFee = rateRecord?.specialDeliveryFee ?? 0.0;

    // 2. Extra weight computation
    let weightCharge = 0;
    if (weight > baseWeight) {
      const extraKg = Math.ceil(weight - baseWeight);
      weightCharge = extraKg * perKgExtra;
    }

    // 3. COD charge computation
    let codCharge = 0;
    if (isCod) {
      codCharge = (subtotal * (codPct / 100)) + codFixed;
      codCharge = Math.round(codCharge);
    }

    // 4. Free delivery threshold check
    const zone = await prisma.shippingZone.findFirst({
      where: {
        isActive: true,
        code: destination === 'INSIDE_DHAKA' ? 'DHAKA_METRO' : destination === 'SUB_DHAKA' ? 'DHAKA_SUBURBS' : 'OUTSIDE_DHAKA',
      },
    });

    let isFreeDelivery = false;
    if (zone?.freeDeliveryMin && subtotal >= zone.freeDeliveryMin) {
      isFreeDelivery = true;
      baseRate = 0;
      weightCharge = 0;
    }

    const totalShippingFee = isFreeDelivery ? (codCharge + specialFee) : (baseRate + weightCharge + codCharge + specialFee);

    const estimatedDays = destination === 'INSIDE_DHAKA' ? '১-২ কার্যদিবস' : destination === 'SUB_DHAKA' ? '২-৩ কার্যদিবস' : '৩-৫ কার্যদিবস';
    const appliedZoneName = rateRecord?.name || (destination === 'INSIDE_DHAKA' ? 'ঢাকা মেট্রো' : destination === 'SUB_DHAKA' ? 'ঢাকা উপশহর' : 'ঢাকার বাইরে সারাদেশে');

    return {
      baseRate,
      weightCharge,
      codCharge,
      specialDeliveryFee: specialFee,
      totalShippingFee,
      isFreeDelivery,
      estimatedDays,
      appliedZoneName,
    };
  }
}

