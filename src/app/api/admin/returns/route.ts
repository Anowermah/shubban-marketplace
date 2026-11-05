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
    const reason = searchParams.get('reason');

    const returns = await prisma.returnRequest.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(reason ? { reason } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: { select: { orderNumber: true, total: true, paymentMethod: true } },
        subOrder: {
          select: {
            subOrderNumber: true,
            vendor: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            book: { select: { id: true, title: true, coverImage: true, stockQuantity: true } },
          },
        },
        refund: true,
        disputes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const metrics = {
      totalRequested: returns.filter((r) => r.status === 'REQUESTED').length,
      totalApproved: returns.filter((r) => r.status === 'APPROVED').length,
      totalInspected: returns.filter((r) => r.status === 'INSPECTED').length,
      totalRefunded: returns.filter((r) => r.status === 'REFUNDED').length,
      totalDisputed: returns.filter((r) => r.status === 'DISPUTED').length,
    };

    return NextResponse.json({
      success: true,
      count: returns.length,
      metrics,
      returns,
    });
  } catch (error: any) {
    console.error('Fetch admin returns error:', error);
    return NextResponse.json({ error: 'রিটার্ন তালিকা লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

