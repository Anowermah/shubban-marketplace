import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json(
        { error: 'অননুমোদিত অনুরোধ। শুধুমাত্র অ্যাডমিনরা কুপন দেখতে পারেন।' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = {};
    if (search) {
      where.code = { contains: search };
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'কুপন লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json(
        { error: 'অননুমোদিত অনুরোধ। শুধুমাত্র অ্যাডমিনরা কুপন তৈরি করতে পারেন।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      code,
      discountPct,
      discountAmt,
      minAmount,
      maxUsage,
      expiresAt,
      isActive = true,
    } = body;

    const trimmedCode = code?.trim().toUpperCase();
    if (!trimmedCode) {
      return NextResponse.json({ error: 'কুপন কোড আবশ্যক।' }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: trimmedCode },
    });

    if (existing) {
      return NextResponse.json({ error: 'এই কুপন কোডটি ইতিমধ্যে ডাটাবেজে রয়েছে।' }, { status: 400 });
    }

    const pct = discountPct !== undefined && discountPct !== '' ? parseFloat(discountPct) : null;
    const amt = discountAmt !== undefined && discountAmt !== '' ? parseFloat(discountAmt) : null;
    const minAmt = minAmount !== undefined && minAmount !== '' ? parseFloat(minAmount) : null;
    const maxUse = maxUsage !== undefined && maxUsage !== '' ? parseInt(maxUsage, 10) : null;
    const expDate = expiresAt ? new Date(expiresAt) : null;

    if (!pct && !amt) {
      return NextResponse.json(
        { error: 'শতাংশ ছাড় অথবা ফিক্সড টাকার ছাড় এর যেকোনো একটি নির্ধারণ করুন।' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: trimmedCode,
        discountPct: pct,
        discountAmt: amt,
        minAmount: minAmt,
        maxUsage: maxUse,
        expiresAt: expDate,
        isActive: Boolean(isActive),
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'COUPON_CREATED',
          entity: 'Coupon',
          entityId: coupon.id,
          details: JSON.stringify({
            code: coupon.code,
            discountPct: coupon.discountPct,
            discountAmt: coupon.discountAmt,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `কুপন "${coupon.code}" সফলভাবে তৈরি হয়েছে!`,
      coupon,
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'কুপন তৈরিতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

