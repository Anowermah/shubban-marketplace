import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { inspectReturnProduct } from '@/lib/returns';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { result, notes } = await req.json();

    if (!result || !notes) {
      return NextResponse.json(
        { error: 'পরিদর্শনের ফলাফল (RESELLABLE / DAMAGED / REJECTED) ও বিস্তারিত নোট আবশ্যক।' },
        { status: 400 }
      );
    }

    const updated = await inspectReturnProduct({
      returnRequestId: params.id,
      inspectorUserId: user.id,
      result,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'পণ্য পরিদর্শন ফলাফল সফলভাবে নথিভুক্ত হয়েছে!',
      returnRequest: updated,
    });
  } catch (error: any) {
    console.error('Inspect return error:', error);
    return NextResponse.json({ error: error.message || 'পরিদর্শন তথ্য সংরক্ষণে ব্যর্থ।' }, { status: 400 });
  }
}

