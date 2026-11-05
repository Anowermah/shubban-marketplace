import { NextResponse } from 'next/server';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';
import { raiseReturnDispute } from '@/lib/returns';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const { reason } = await req.json();
    if (!reason) {
      return NextResponse.json({ error: 'বিরোধের (Dispute) কারণ উল্লেখ করুন।' }, { status: 400 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    const raisedByRole = vendorAuth ? 'VENDOR' : 'CUSTOMER';

    const dispute = await raiseReturnDispute({
      returnRequestId: params.id,
      raisedByRole,
      raisedByUserId: session.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'বিরোধের আবেদন (Dispute) সফলভাবে নিবন্ধিত হয়েছে। অ্যাডমিন আরবিট্রেশন টিম তদন্ত করবে।',
      dispute,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Raise dispute error:', error);
    return NextResponse.json({ error: error.message || 'ডিসপ্যুট তৈরি করতে ব্যর্থ।' }, { status: 400 });
  }
}

