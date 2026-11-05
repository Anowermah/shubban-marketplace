import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { processPayout } from '@/lib/payout';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { transactionRef, notes } = await req.json();
    if (!transactionRef) {
      return NextResponse.json(
        { error: 'অফিসিয়াল ব্যাংক ট্রান্সফার বা গেটওয়ে পেমেন্ট রেফারেন্স ট্রানজেকশন আইডি আবশ্যক।' },
        { status: 400 }
      );
    }

    const payout = await processPayout({
      payoutId: params.id,
      disburserUserId: user.id,
      transactionRef,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'পেআউট অর্থ সফলভাবে স্থানান্তরিত (PAID) হয়েছে এবং ট্রানজেকশন রেফারেন্স সংরক্ষিত হয়েছে!',
      payout,
    });
  } catch (error: any) {
    console.error('Process payout error:', error);
    return NextResponse.json({ error: error.message || 'পেআউট ডিসবার্স করতে ব্যর্থ।' }, { status: 400 });
  }
}

