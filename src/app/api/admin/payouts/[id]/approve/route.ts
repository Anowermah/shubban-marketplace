import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { approvePayout } from '@/lib/payout';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { notes } = await req.json().catch(() => ({}));

    const payout = await approvePayout({
      payoutId: params.id,
      checkerUserId: user.id,
      checkerRole: user.role,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'পেআউট অনুরোধটি সফলভাবে অনুমোদিত হয়েছে (Checker Verified)!',
      payout,
    });
  } catch (error: any) {
    console.error('Approve payout error:', error);
    return NextResponse.json(
      { error: error.message || 'পেআউট অনুমোদন করতে সমস্যা হয়েছে।' },
      { status: error.message?.includes('মেকার-চেকার') ? 403 : 400 }
    );
  }
}

