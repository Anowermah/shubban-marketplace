import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { refundDonation } from '@/lib/donations';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন অনুদান রিফান্ড করতে পারেন।' }, { status: 403 });
    }

    const { donationId, reason } = await req.json();
    if (!donationId || !reason) {
      return NextResponse.json({ error: 'donationId এবং reason প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const result = await refundDonation({
      donationId,
      reason,
      adminUserId: session.id,
    });

    return NextResponse.json({
      success: true,
      message: 'অনুদান সফলভাবে রিফান্ড করা হয়েছে এবং চ্যারিটি লেজারে ডেবিট রেকর্ড করা হয়েছে।',
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

