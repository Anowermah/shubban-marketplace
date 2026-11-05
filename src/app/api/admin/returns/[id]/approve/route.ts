import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { approveReturnRequest } from '@/lib/returns';

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

    const updated = await approveReturnRequest({
      returnRequestId: params.id,
      adminUserId: user.id,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'রিটার্ন আবেদনটি সফলভাবে অনুমোদিত হয়েছে!',
      returnRequest: updated,
    });
  } catch (error: any) {
    console.error('Approve return error:', error);
    return NextResponse.json({ error: error.message || 'রিটার্ন অনুমোদন করতে ব্যর্থ।' }, { status: 400 });
  }
}

