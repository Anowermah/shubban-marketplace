import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { processReturnRefundAndRestock } from '@/lib/returns';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { refundDeduction = 0, adminNote } = await req.json().catch(() => ({}));

    const result = await processReturnRefundAndRestock({
      returnRequestId: params.id,
      adminUserId: user.id,
      refundDeduction: parseFloat(refundDeduction) || 0,
      adminNote,
    });

    return NextResponse.json({
      success: true,
      message: `রিটার্ন রিফান্ড (৳ ${result.refundAmount}) সফলভাবে প্রসেস করা হয়েছে${
        result.restocked ? ' এবং অক্ষত পণ্য ইনভেন্টরিতে রিস্টক হয়েছে!' : ' এবং নষ্ট পণ্য অবলোপন করা হয়েছে।'
      }`,
      result,
    });
  } catch (error: any) {
    console.error('Process return refund error:', error);
    return NextResponse.json({ error: error.message || 'রিফান্ড প্রক্রিয়াকরণে সমস্যা হয়েছে।' }, { status: 400 });
  }
}

