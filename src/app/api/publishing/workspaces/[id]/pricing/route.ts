import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyMagazineAccess } from '@/lib/services/publishingService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const [plans, magazine] = await Promise.all([
      prisma.publicationSubscriptionPlan.findMany({
        where: { magazineId: id },
        orderBy: { durationMonths: 'asc' },
        include: {
          _count: { select: { subscriptions: true } },
        },
      }),
      prisma.magazine.findUnique({
        where: { id },
        select: {
          isSubscribable: true,
          singleIssuePrice: true,
          monthlySubscriptionPrice: true,
          annualSubscriptionPrice: true,
          totalSubscribers: true,
          totalRevenue: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      plans,
      pricing: magazine,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized || (!auth.isSuperAdmin && auth.role !== 'PUBLICATION_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, durationMonths, price, originalPrice, description, features, isFeatured } = body;

    if (!name?.trim() || !price) {
      return NextResponse.json({ success: false, error: 'প্ল্যানের নাম ও মূল্য আবশ্যক' }, { status: 400 });
    }

    const generatedSlug = slug?.trim() || `${id}-${durationMonths}m-${Date.now()}`;

    const plan = await prisma.publicationSubscriptionPlan.create({
      data: {
        magazineId: id,
        name,
        slug: generatedSlug,
        durationMonths: Number(durationMonths) || 1,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        description: description || null,
        features: features ? JSON.stringify(features) : null,
        isFeatured: Boolean(isFeatured),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'সাবস্ক্রিপশন প্ল্যান তৈরি হয়েছে',
      plan,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

