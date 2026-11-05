import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'invoices';

    if (view === 'payments') {
      const payments = await prisma.adPayment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          advertiser: { select: { id: true, name: true, companyName: true, email: true } },
          campaign: { select: { id: true, name: true, campaignNumber: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
      });
      return NextResponse.json({ success: true, payments });
    }

    if (view === 'refunds') {
      const refunds = await prisma.adRefund.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          advertiser: { select: { id: true, name: true, companyName: true } },
          payment: true,
        },
      });
      return NextResponse.json({ success: true, refunds });
    }

    // Default: invoices
    const invoices = await prisma.adInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        advertiser: { select: { id: true, name: true, companyName: true, email: true } },
        campaign: { select: { id: true, name: true, campaignNumber: true } },
        payments: true,
      },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (err: any) {
    console.error('Error fetching admin ads billing:', err);
    return NextResponse.json({ error: 'বিলিং তথ্য লোড করা সম্ভব হয়নি।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'CREATE_INVOICE') {
      const { advertiserId, campaignId, amount, taxAmount, discountAmount, dueDateDays, notes } = body;

      if (!advertiserId || !amount) {
        return NextResponse.json({ error: 'বিজ্ঞাপনদাতা ও টাকার পরিমাণ আবশ্যক।' }, { status: 400 });
      }

      const total = Number(amount) + (Number(taxAmount) || 0) - (Number(discountAmount) || 0);
      const invoiceNumber = `INV-AD-${Date.now().toString().slice(-6)}`;
      const dueDate = new Date(Date.now() + (Number(dueDateDays) || 7) * 24 * 60 * 60 * 1000);

      const invoice = await prisma.adInvoice.create({
        data: {
          invoiceNumber,
          advertiserId,
          campaignId: campaignId || null,
          amount: Number(amount),
          taxAmount: Number(taxAmount) || 0,
          discountAmount: Number(discountAmount) || 0,
          totalAmount: total,
          dueDate,
          notes,
          status: 'ISSUED',
        },
      });

      return NextResponse.json({ success: true, invoice });
    }

    if (action === 'RECORD_PAYMENT') {
      const { invoiceId, advertiserId, campaignId, amount, paymentGateway, transactionId, notes } = body;

      if (!advertiserId || !amount || !transactionId) {
        return NextResponse.json({ error: 'প্রয়োজনীয় পেমেন্ট তথ্য দিন।' }, { status: 400 });
      }

      // Check transaction id unique
      const existing = await prisma.adPayment.findUnique({ where: { transactionId } });
      if (existing) {
        return NextResponse.json({ error: 'এই ট্রানজেকশন আইডি পূর্বেই রেকর্ড করা হয়েছে।' }, { status: 409 });
      }

      const payment = await prisma.adPayment.create({
        data: {
          transactionId,
          invoiceId: invoiceId || null,
          advertiserId,
          campaignId: campaignId || null,
          amount: Number(amount),
          paymentGateway: paymentGateway || 'BANK_TRANSFER',
          status: 'COMPLETED',
          verifiedAt: new Date(),
          notes,
        },
      });

      // Update invoice if linked
      if (invoiceId) {
        await prisma.adInvoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID', paidAt: new Date() },
        });
      }

      // Update campaign billingStatus if linked
      if (campaignId) {
        await prisma.adCampaign.update({
          where: { id: campaignId },
          data: { billingStatus: 'PAID' },
        });
      }

      return NextResponse.json({ success: true, payment });
    }

    return NextResponse.json({ error: 'অবৈধ বিলিং অ্যাকশন।' }, { status: 400 });
  } catch (err: any) {
    console.error('Error creating billing record:', err);
    return NextResponse.json({ error: 'বিলিং রেকর্ড তৈরি করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

