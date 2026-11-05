import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'কুপন কোড প্রদান করুন।' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const orderSubtotal = Number(subtotal) || 0;

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'এই কুপন কোডটি অবৈধ বা বর্তমানে সক্রিয় নয়।' }, { status: 404 });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: 'এই কুপন কোডের মেয়াদ উত্তীর্ণ হয়ে গেছে।' }, { status: 400 });
    }

    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return NextResponse.json({ error: 'এই কুপনের সর্বোচ্চ ব্যবহার সীমা শেষ হয়ে গেছে।' }, { status: 400 });
    }

    if (coupon.minAmount && orderSubtotal < coupon.minAmount) {
      return NextResponse.json({
        error: `এই কুপনটি ব্যবহারের জন্য সর্বনিম্ন ৳${coupon.minAmount} মূল্যের অর্ডার আবশ্যক।`,
      }, { status: 400 });
    }

    let calculatedDiscount = 0;
    if (coupon.discountPct) {
      calculatedDiscount = Math.round((orderSubtotal * coupon.discountPct) / 100);
    } else if (coupon.discountAmt) {
      calculatedDiscount = Math.min(orderSubtotal, Math.round(coupon.discountAmt));
    }

    return NextResponse.json({
      success: true,
      valid: true,
      code: coupon.code,
      discount: calculatedDiscount,
      discountPct: coupon.discountPct,
      discountAmt: coupon.discountAmt,
      message: `${coupon.code} কুপন সফলভাবে প্রয়োগ হয়েছে! আপনি ৳${calculatedDiscount} ছাড় পেয়েছেন।`,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'কুপন যাচাই করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

