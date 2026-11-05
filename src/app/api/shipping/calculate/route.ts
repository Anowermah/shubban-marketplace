import { NextResponse } from 'next/server';
import { ShippingCalculator } from '@/lib/courier/calculator';
import { calculateDeliveryCharge } from '@/lib/shipping';
import { ShippingCalculationInput } from '@/lib/courier/types';

/**
 * GET handler: Standard delivery charge calculation
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zoneCode = searchParams.get('zoneCode') || undefined;
    const city = searchParams.get('city') || searchParams.get('district') || undefined;
    const weightKg = parseFloat(searchParams.get('weightKg') || searchParams.get('totalWeightKg') || '1');
    const cartTotal = parseFloat(searchParams.get('cartTotal') || searchParams.get('subtotalAmount') || '0');

    // Call standard delivery calculation
    const result = await calculateDeliveryCharge({
      zoneCode,
      city,
      weightKg,
      cartTotal,
    });

    return NextResponse.json({
      success: true,
      calculation: result,
    });
  } catch (error: any) {
    console.error('Delivery calculation GET error:', error);
    return NextResponse.json({ error: 'ডেলিভারি চার্জ নির্ণয়ে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

/**
 * POST handler: Full dynamic calculation based on weight, COD, and district/zone
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { destinationType, district, upazila, totalWeightKg, subtotalAmount, paymentMethod } = body;

    let detectedDestination = destinationType;
    if (!detectedDestination && (district || body.address)) {
      detectedDestination = ShippingCalculator.detectDestinationType(district, body.address);
    }

    const input: ShippingCalculationInput = {
      destinationType: detectedDestination || 'OUTSIDE_DHAKA',
      district,
      upazila,
      totalWeightKg: totalWeightKg ? parseFloat(totalWeightKg) : 1.0,
      subtotalAmount: subtotalAmount ? parseFloat(subtotalAmount) : 0,
      paymentMethod: paymentMethod || 'cod',
    };

    const calculation = await ShippingCalculator.calculateRate(input);

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error: any) {
    console.error('Delivery calculation POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'ডেলিভারি চার্জ নির্ণয় ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}
