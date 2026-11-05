import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { processDonation } from '@/lib/donations';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isFeatured = searchParams.get('featured');

    const where: any = { status: 'ACTIVE' };
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    const campaigns = await prisma.donationCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'ক্যাম্পেইন লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getSessionUser();

    const {
      campaignId,
      donorName,
      donorEmail,
      donorPhone,
      isAnonymous,
      amount,
      paymentMethod,
      transactionId,
      notes,
    } = body;

    if (!campaignId || !donorName || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে ক্যাম্পেইন, নাম ও অনুদানের সঠিক পরিমাণ দিন।' },
        { status: 400 }
      );
    }

    const result = await processDonation({
      campaignId,
      donorName,
      donorEmail,
      donorPhone,
      isAnonymous: Boolean(isAnonymous),
      amount: Number(amount),
      paymentMethod: paymentMethod || 'bkash',
      transactionId,
      notes,
      userId: session?.id,
    });

    return NextResponse.json({
      success: true,
      donationNumber: result.donation.donationNumber,
      receiptNumber: result.receipt.receiptNumber,
      donation: result.donation,
      receipt: result.receipt,
      message: 'আপনার অনুদান সফলভাবে গৃহীত হয়েছে। মহান আল্লাহ আপনার সদকাহ কবুল করুন!',
    });
  } catch (error: any) {
    console.error('Donation error:', error);
    return NextResponse.json(
      { error: error.message || 'অনুদান প্রক্রিয়াকরণে সমস্যা হয়েছে।' },
      { status: 400 }
    );
  }
}
