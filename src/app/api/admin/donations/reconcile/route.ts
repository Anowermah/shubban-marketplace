import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { reconcileDonations, getDonationReports } from '@/lib/donations';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন অডিট রিপোর্ট দেখতে পারেন।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId') || undefined;

    const [reconciliation, reports] = await Promise.all([
      reconcileDonations(campaignId),
      getDonationReports(),
    ]);

    return NextResponse.json({
      success: true,
      reconciliation,
      reports,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

