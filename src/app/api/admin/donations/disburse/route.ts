import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { disburseReliefFund } from '@/lib/donations';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন ত্রাণ বা তহবিল বিতরণ অনুমোদন করতে পারেন।' }, { status: 403 });
    }

    const { campaignId, amount, recipientDescription, referenceNumber } = await req.json();
    if (!campaignId || !amount || !recipientDescription) {
      return NextResponse.json(
        { error: 'campaignId, amount এবং recipientDescription আবশ্যক।' },
        { status: 400 }
      );
    }

    const result = await disburseReliefFund({
      campaignId,
      amount: Number(amount),
      recipientDescription,
      referenceNumber,
      adminUserId: session.id,
    });

    return NextResponse.json({
      success: true,
      message: 'ত্রাণ বিতরণ রেকর্ড ও লেজার ডেবিট সফলভাবে সম্পন্ন হয়েছে।',
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

