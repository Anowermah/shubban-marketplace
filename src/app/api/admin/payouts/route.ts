import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');

    const payouts = await prisma.sellerPayout.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(vendorId ? { vendorId } : {}),
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            bankName: true,
            bankAccountNumber: true,
            bkashMerchantNumber: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    const metrics = {
      totalRequested: payouts
        .filter((p) => p.status === 'REQUESTED')
        .reduce((acc, p) => acc + p.amount, 0),
      totalApproved: payouts
        .filter((p) => p.status === 'APPROVED')
        .reduce((acc, p) => acc + p.amount, 0),
      totalPaid: payouts
        .filter((p) => p.status === 'PAID')
        .reduce((acc, p) => acc + p.amount, 0),
      totalReversed: payouts
        .filter((p) => p.status === 'REVERSED')
        .reduce((acc, p) => acc + p.amount, 0),
    };

    return NextResponse.json({
      success: true,
      count: payouts.length,
      metrics,
      payouts,
    });
  } catch (error: any) {
    console.error('Fetch admin payouts error:', error);
    return NextResponse.json({ error: 'পেআউট তালিকা লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

