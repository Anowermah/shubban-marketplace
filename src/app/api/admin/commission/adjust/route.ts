import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { adjustSubOrderCommission } from '@/lib/commission';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { subOrderId, newCommissionRate, reason } = await req.json();

    if (!subOrderId || newCommissionRate === undefined || !reason) {
      return NextResponse.json(
        { error: 'সাব-অর্ডার আইডি, নতুন কমিশন হার ও সমন্বয়ের সুনির্দিষ্ট কারণ উল্লেখ করুন।' },
        { status: 400 }
      );
    }

    const numRate = parseFloat(newCommissionRate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) {
      return NextResponse.json({ error: 'কমিশন হার ০% থেকে ১০০% এর মধ্যে হতে হবে।' }, { status: 400 });
    }

    const result = await adjustSubOrderCommission({
      subOrderId,
      newCommissionRate: numRate,
      reason,
      adminUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'সাব-অর্ডারের কমিশন সফলভাবে সমন্বয় করা হয়েছে এবং ভেন্ডর লেজারে অডিট লগ যুক্ত হয়েছে।',
      result,
    });
  } catch (error: any) {
    console.error('Adjust commission error:', error);
    return NextResponse.json({ error: error.message || 'কমিশন সমন্বয়ে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

