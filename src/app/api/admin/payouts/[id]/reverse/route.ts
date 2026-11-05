import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { reversePayout } from '@/lib/payout';

export async function POST(
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
      return NextResponse.json(
        { error: 'বাউন্স বা রিভার্সালের সুনির্দিষ্ট ব্যাংকিং কারণ উল্লেখ করুন।' },
        { status: 400 }
      );
    }

    const result = await reversePayout({
      payoutId: params.id,
      adminUserId: user.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'পেআউট রিভার্সাল সম্পন্ন হয়েছে। অর্থ অফসেটিং এন্ট্রির মাধ্যমে বিক্রেতার লেজারে ক্রেডিট হয়েছে।',
      result,
    });
  } catch (error: any) {
    console.error('Reverse payout error:', error);
    return NextResponse.json({ error: error.message || 'পেআউট রিভার্সাল করতে ব্যর্থ।' }, { status: 400 });
  }
}

