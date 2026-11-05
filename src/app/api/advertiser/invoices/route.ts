import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [{ ownerId: session.id }, { members: { some: { userId: session.id } } }],
      },
    });

    if (!advertiser) {
      return NextResponse.json({ success: true, invoices: [] });
    }

    const invoices = await prisma.adInvoice.findMany({
      where: { advertiserId: advertiser.id },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: { select: { id: true, name: true, campaignNumber: true } },
        payments: true,
      },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (err: any) {
    console.error('Error fetching advertiser invoices:', err);
    return NextResponse.json({ error: 'ইনভয়েস লোড করা সম্ভব হয়নি।' }, { status: 500 });
  }
}

