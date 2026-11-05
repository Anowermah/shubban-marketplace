import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { seedDefaultShippingZones } from '@/lib/shipping';

export async function GET() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    await seedDefaultShippingZones();

    const zones = await prisma.shippingZone.findMany({
      include: { methods: true },
      orderBy: { rate: 'asc' },
    });

    return NextResponse.json({
      success: true,
      zones,
    });
  } catch (error: any) {
    console.error('Fetch shipping zones error:', error);
    return NextResponse.json({ error: 'শিপিং জোন লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { name, code, rate, estimatedDays, freeDeliveryMin } = await req.json();

    if (!name || !code || rate === undefined) {
      return NextResponse.json({ error: 'জোনের নাম, কোড ও রেট আবশ্যক।' }, { status: 400 });
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name,
        code,
        rate: parseFloat(rate),
        estimatedDays: estimatedDays || '২-৩ কার্যদিবস',
        freeDeliveryMin: freeDeliveryMin ? parseFloat(freeDeliveryMin) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'শিপিং জোন সফলভাবে সংরক্ষিত হয়েছে!',
      zone,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create shipping zone error:', error);
    return NextResponse.json({ error: error.message || 'শিপিং জোন তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}

