import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { reconcilePayouts } from '@/lib/payout';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId') || undefined;

    const report = await reconcilePayouts(vendorId);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Payout reconciliation error:', error);
    return NextResponse.json({ error: error.message || 'রিকনসিলিয়েশন রিপোর্ট তৈরি করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

