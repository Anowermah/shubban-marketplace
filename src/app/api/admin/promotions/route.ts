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

    // If searching for candidates to add to promotion
    if (searchParams.get('searchCandidates') === 'true') {
      const candidates = await prisma.book.findMany({
        where: {
          title: { contains: search },
        },
        include: { author: { select: { name: true } } },
        take: 20,
      });

      return NextResponse.json({ success: true, candidates });
    }

    const discountedBooks = await prisma.book.findMany({
      where: {
        discountPrice: { not: null },
        ...(search ? { title: { contains: search } } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      promotions: discountedBooks,
      total: discountedBooks.length,
    });
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'প্রমোশন লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const { bookId, discountPrice } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'বই নির্বাচন করুন।' }, { status: 400 });
    }

    const numDiscount = parseFloat(discountPrice);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      return NextResponse.json({ error: 'সঠিক ডিসকাউন্ট মূল্য লিখুন।' }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { author: { select: { name: true } } },
    });

    if (!book) {
      return NextResponse.json({ error: 'বইটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    if (numDiscount >= book.price) {
      return NextResponse.json(
        { error: `ছাড়কৃত মূল্য অবশ্যই মূল মূল্য (৳${book.price}) থেকে কম হতে হবে।` },
        { status: 400 }
      );
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: { discountPrice: numDiscount },
      include: { author: { select: { id: true, name: true } } },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'BOOK_PROMOTION_SET',
          entity: 'Book',
          entityId: bookId,
          details: JSON.stringify({
            title: book.title,
            originalPrice: book.price,
            discountPrice: numDiscount,
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
      message: `"${book.title}" বইটিতে সফলভাবে প্রমোশনাল ছাড় নির্ধারণ করা হয়েছে!`,
      book: updated,
    });
  } catch (error: any) {
    console.error('Error adding promotion:', error);
    return NextResponse.json({ error: 'প্রমোশন সংরক্ষণে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const queryBookId = searchParams.get('bookId');
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const bookId = queryBookId || body.bookId;

    if (!bookId) {
      return NextResponse.json({ error: 'বই নির্বাচন করুন।' }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: 'বইটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    await prisma.book.update({
      where: { id: bookId },
      data: { discountPrice: null },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'BOOK_PROMOTION_REMOVED',
          entity: 'Book',
          entityId: bookId,
          details: JSON.stringify({
            title: book.title,
            removedDiscount: book.discountPrice,
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
      message: `"${book.title}" প্রমোশন ও ছাড় থেকে সফলভাবে বাদ দেওয়া হয়েছে!`,
    });
  } catch (error: any) {
    console.error('Error removing promotion:', error);
    return NextResponse.json({ error: 'প্রমোশন মুছতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

