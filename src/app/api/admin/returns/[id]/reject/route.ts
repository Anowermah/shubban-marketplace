import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { rejectReturnRequest } from '@/lib/returns';

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
      return NextResponse.json({ error: 'বাতিলের কারণ উল্লেখ করুন।' }, { status: 400 });
    }

    const updated = await rejectReturnRequest({
      returnRequestId: params.id,
      adminUserId: user.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'রিটার্ন আবেদনটি বাতিল করা হয়েছে।',
      returnRequest: updated,
    });
  } catch (error: any) {
    console.error('Reject return error:', error);
    return NextResponse.json({ error: error.message || 'রিটার্ন বাতিল করতে ব্যর্থ।' }, { status: 400 });
  }
}

