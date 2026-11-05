import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    const [payouts, ledgerEntries, subOrdersAgg] = await Promise.all([
      prisma.sellerPayout.findMany({
        where: { vendorId: vendorAuth.vendor.id },
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.sellerLedgerEntry.findMany({
        where: { vendorId: vendorAuth.vendor.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.subOrder.aggregate({
        where: { vendorId: vendorAuth.vendor.id, status: { in: ['DELIVERED', 'SHIPPED', 'CONFIRMED'] } },
        _sum: { payoutAmt: true, commissionAmt: true, subtotal: true },
      }),
    ]);

    const totalEarnedPayouts = subOrdersAgg._sum.payoutAmt || 0;
    const withdrawnSum = payouts
      .filter((p) => p.status === 'PAID' || p.status === 'PROCESSING' || p.status === 'REQUESTED')
      .reduce((acc, p) => acc + p.amount, 0);

    const availableBalance = Math.max(0, totalEarnedPayouts - withdrawnSum);

    return NextResponse.json({
      success: true,
      balance: {
        totalEarnings: totalEarnedPayouts,
        totalWithdrawnOrPending: withdrawnSum,
        availableForWithdrawal: availableBalance,
      },
      payouts,
      ledgerEntries,
    });
  } catch (error: any) {
    console.error('Fetch seller payouts error:', error);
    return NextResponse.json({ error: 'পেআউট তথ্য পেতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    // Suspension Guard
    if (vendorAuth.isSuspended) {
      return NextResponse.json(
        { error: 'আপনার সেলার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত রয়েছে। পেআউট উত্তোলন সম্ভব নয়।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount, method = 'BANK_TRANSFER', accountDetails, notes } = body;

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount < 500) {
      return NextResponse.json(
        { error: 'ন্যূনতম ৫০০ টাকা বা তদূর্ধ্ব উত্তোলনের অনুরোধ করুন।' },
        { status: 400 }
      );
    }

    // Server-side balance calculation: NEVER trust client claims
    const [subOrdersAgg, existingPayouts] = await Promise.all([
      prisma.subOrder.aggregate({
        where: { vendorId: vendorAuth.vendor.id },
        _sum: { payoutAmt: true },
      }),
      prisma.sellerPayout.findMany({
        where: {
          vendorId: vendorAuth.vendor.id,
          status: { in: ['PAID', 'PROCESSING', 'REQUESTED', 'APPROVED'] },
        },
      }),
    ]);

    const totalEarned = subOrdersAgg._sum.payoutAmt || 0;
    const committedPayouts = existingPayouts.reduce((acc, p) => acc + p.amount, 0);
    const availableBalance = totalEarned - committedPayouts;

    if (payoutAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `আপনার উত্তোলনের অনুরোধকৃত অর্থ (৳ ${payoutAmount}) বিদ্যমান ব্যালেন্সের (৳ ${availableBalance.toFixed(
            2
          )}) চেয়ে বেশি।`,
        },
        { status: 400 }
      );
    }

    const payoutNum = `PO-${vendorAuth.vendor.slug.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`;

    const details = accountDetails ||
      `${vendorAuth.vendor.bankName || 'ইসলামী ব্যাংক বাংলাদেশ'}, A/C: ${vendorAuth.vendor.bankAccountNumber || 'অ্যাকাউন্ট নম্বর'}`;

    const payout = await prisma.$transaction(async (tx) => {
      const newPayout = await tx.sellerPayout.create({
        data: {
          payoutNumber: payoutNum,
          vendorId: vendorAuth.vendor.id, // Strictly server-assigned
          amount: payoutAmount,
          method,
          accountDetails: details,
          status: 'REQUESTED',
          notes: notes || null,
        },
      });

      // Create Ledger Entry
      await tx.sellerLedgerEntry.create({
        data: {
          vendorId: vendorAuth.vendor.id,
          payoutId: newPayout.id,
          type: 'PAYOUT_DEBIT',
          amount: -payoutAmount,
          balanceAfter: availableBalance - payoutAmount,
          description: `উত্তোলন অনুরোধ #${payoutNum} বাবদ ডেবিট`,
        },
      });

      return newPayout;
    });

    return NextResponse.json({
      success: true,
      message: 'উত্তোলনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন অনুমোদনের পর অর্থ স্থানান্তর করা হবে।',
      payout,
    });
  } catch (error: any) {
    console.error('Payout request error:', error);
    return NextResponse.json({ error: error.message || 'পেআউট অনুরোধে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
