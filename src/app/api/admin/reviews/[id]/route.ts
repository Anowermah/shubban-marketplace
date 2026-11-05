import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const existing = await prisma.review.findUnique({
      where: { id: params.id },
      include: { book: { select: { title: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'রিভিউটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const { rating, comment, isVerified } = body;

    const updateData: any = {};
    if (rating !== undefined) {
      updateData.rating = Math.max(1, Math.min(5, parseInt(rating, 10)));
    }
    if (comment !== undefined) {
      updateData.comment = comment.trim();
    }
    if (isVerified !== undefined) {
      updateData.isVerified = Boolean(isVerified);
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        book: { select: { id: true, title: true, slug: true, coverImage: true } },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'REVIEW_MODERATED',
          entity: 'Review',
          entityId: params.id,
          details: JSON.stringify({
            bookTitle: existing.book.title,
            updatedFields: Object.keys(updateData),
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
      message: 'রিভিউ সফলভাবে মডারেশন ও হালনাগাদ করা হয়েছে!',
      review: updated,
    });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'রিভিউ হালনাগাদ করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const existing = await prisma.review.findUnique({
      where: { id: params.id },
      include: { book: { select: { title: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'রিভিউটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: params.id },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'REVIEW_DELETED',
          entity: 'Review',
          entityId: params.id,
          details: JSON.stringify({
            bookTitle: existing.book.title,
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
      message: 'রিভিউ সফলভাবে মুছে ফেলা হয়েছে!',
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'রিভিউ মুছতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

