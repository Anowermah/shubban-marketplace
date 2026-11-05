import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত।' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'ঠিকানা লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত।' }, { status: 401 });
    }

    const { title, name, phone, address, city, zone, isDefault } = await req.json();

    if (!name || !phone || !address) {
      return NextResponse.json({ error: 'নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা আবশ্যক।' }, { status: 400 });
    }

    // If making this default, reset previous defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.id },
        data: { isDefault: false },
      });
    }

    // If first address, auto make default
    const count = await prisma.address.count({ where: { userId: session.id } });
    const shouldBeDefault = isDefault || count === 0;

    const newAddress = await prisma.address.create({
      data: {
        userId: session.id,
        title: title || 'বাসার ঠিকানা',
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city || 'ঢাকা',
        zone: zone || (city === 'ঢাকা' ? 'DHAKA_METRO' : 'OUTSIDE_DHAKA'),
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'ঠিকানা সংরক্ষণ করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
