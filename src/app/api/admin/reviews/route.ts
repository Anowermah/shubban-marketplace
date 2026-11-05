import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim() || '';
    const ratingParam = searchParams.get('rating');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = {};
    if (ratingParam) {
      const parsedRating = parseInt(ratingParam, 10);
      if (!isNaN(parsedRating)) {
        where.rating = parsedRating;
      }
    }

    if (search) {
      where.OR = [
        { comment: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { book: { title: { contains: search } } },
      ];
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          book: { select: { id: true, title: true, slug: true, coverImage: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'রিভিউ লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'মুছে ফেলার জন্য রিভিউ নির্বাচন করুন।' }, { status: 400 });
    }

    const deleted = await prisma.review.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'REVIEWS_BULK_DELETED',
          entity: 'Review',
          details: JSON.stringify({
            deletedCount: deleted.count,
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
      message: `নির্বাচিত ${deleted.count}টি রিভিউ সফলভাবে মুছে ফেলা হয়েছে!`,
    });
  } catch (error: any) {
    console.error('Error bulk deleting reviews:', error);
    return NextResponse.json({ error: 'রিভিউ মুছে ফেলতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

