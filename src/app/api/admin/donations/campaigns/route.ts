import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createDonationCampaign } from '@/lib/donations';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const campaigns = await prisma.donationCampaign.findMany({
      include: {
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন নতুন ক্যাম্পেইন তৈরি করতে পারেন।' }, { status: 403 });
    }

    const body = await req.json();
    const campaign = await createDonationCampaign(body, session.id);

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

