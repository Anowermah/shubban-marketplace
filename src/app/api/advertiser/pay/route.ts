import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';
import { invalidateAdsCache } from '@/lib/ads/ad-serving-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [{ ownerId: session.id }, { members: { some: { userId: session.id } } }],
      },
    });

    if (!advertiser) {
      return NextResponse.json({ error: 'বিজ্ঞাপনদাতা প্রোফাইল পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const { invoiceId, paymentGateway, transactionId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'ইনভয়েস আইডি আবশ্যক।' }, { status: 400 });
    }

    // Verify invoice belongs to this advertiser and is unpaid
    const invoice = await prisma.adInvoice.findFirst({
      where: { id: invoiceId, advertiserId: advertiser.id },
      include: { campaign: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'ইনভয়েস পাওয়া যায়নি।' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'এই ইনভয়েসটি পূর্বেই পরিশোধ করা হয়েছে।' }, { status: 400 });
    }

    const validTrx = transactionId?.trim() || `TRX-AD-${Date.now().toString().slice(-8)}`;

    // Create completed payment record
    const payment = await prisma.adPayment.create({
      data: {
        transactionId: validTrx,
        invoiceId: invoice.id,
        advertiserId: advertiser.id,
        campaignId: invoice.campaignId || null,
        amount: invoice.totalAmount,
        currency: 'BDT',
        paymentGateway: paymentGateway || 'BKASH',
        status: 'COMPLETED',
        verifiedAt: new Date(),
        notes: `অনলাইন পেমেন্ট সম্পন্ন: ${paymentGateway || 'BKASH'}`,
      },
    });

    // Mark invoice as paid
    await prisma.adInvoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // If campaign is linked, mark campaign as paid
    if (invoice.campaignId) {
      const campaign = await prisma.adCampaign.findUnique({ where: { id: invoice.campaignId } });
      if (campaign) {
        const nextStatus = campaign.approvalStatus === 'APPROVED' ? 'ACTIVE' : campaign.status;
        await prisma.adCampaign.update({
          where: { id: campaign.id },
          data: {
            billingStatus: 'PAID',
            status: nextStatus,
          },
        });
        invalidateAdsCache();
      }
    }

    return NextResponse.json({
      success: true,
      payment,
      message: 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।',
    });
  } catch (err: any) {
    console.error('Error processing advertiser payment:', err);
    return NextResponse.json({ error: 'পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

