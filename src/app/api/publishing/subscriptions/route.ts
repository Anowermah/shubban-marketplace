import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.publicationSubscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
        magazine: { select: { id: true, title: true, themeColor: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, subscriptions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, extendMonths } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Subscription ID is required' }, { status: 400 });
    }

    const current = await prisma.publicationSubscription.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
    }

    let newEndDate = current.endDate;
    if (extendMonths && extendMonths > 0) {
      const baseDate = new Date(current.endDate) > new Date() ? new Date(current.endDate) : new Date();
      baseDate.setMonth(baseDate.getMonth() + Number(extendMonths));
      newEndDate = baseDate;
    }

    const updated = await prisma.publicationSubscription.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(extendMonths && { endDate: newEndDate }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
        magazine: { select: { id: true, title: true, themeColor: true } },
      },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

