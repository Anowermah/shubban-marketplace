import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { rejectPayout } from '@/lib/payout';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { reason } = await req.json();
    if (!reason) {
      return NextResponse.json({ error: 'বাতিলের সুনির্দিষ্ট কারণ উল্লেখ করুন।' }, { status: 400 });
    }

    const result = await rejectPayout({
      payoutId: params.id,
      checkerUserId: user.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'পেআউট অনুরোধটি বাতিল করা হয়েছে এবং বিক্রেতার লেজারে অর্থ পুনর্বহাল হয়েছে।',
      result,
    });
  } catch (error: any) {
    console.error('Reject payout error:', error);
    return NextResponse.json({ error: error.message || 'পেআউট বাতিল করতে ব্যর্থ।' }, { status: 400 });
  }
}

