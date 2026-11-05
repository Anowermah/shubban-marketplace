import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { resolveReturnDispute } from '@/lib/returns';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { resolution, notes } = await req.json();

    if (!resolution || !notes) {
      return NextResponse.json(
        { error: 'আরবিট্রেশন সিদ্ধান্ত (RESOLVED_CUSTOMER_FAVOR / RESOLVED_VENDOR_FAVOR / REJECTED) ও বিস্তারিত কারণ আবশ্যক।' },
        { status: 400 }
      );
    }

    const updated = await resolveReturnDispute({
      disputeId: params.id,
      adminUserId: user.id,
      resolution,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'রিটার্ন বিরোধের সমাধান ও চূড়ান্ত রায় প্রদান সফল হয়েছে!',
      dispute: updated,
    });
  } catch (error: any) {
    console.error('Resolve dispute error:', error);
    return NextResponse.json({ error: error.message || 'ডিসপ্যুট সমাধান করতে ব্যর্থ।' }, { status: 400 });
  }
}

