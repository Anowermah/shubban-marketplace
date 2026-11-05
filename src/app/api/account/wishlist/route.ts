import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত।' }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.id,
        bookId: { not: null },
      },
      include: {
        book: {
          include: {
            author: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
            variants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = bookmarks.filter((b) => b.book !== null).map((b) => ({
      bookmarkId: b.id,
      book: b.book,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'উইশলিস্ট লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'উইশলিস্টে যুক্ত করতে লগইন করুন।' }, { status: 401 });
    }

    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json({ error: 'বইয়ের আইডি আবশ্যক।' }, { status: 400 });
    }

    const existing = await prisma.bookmark.findFirst({
      where: {
        userId: session.id,
        bookId,
      },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({
        success: true,
        action: 'REMOVED',
        message: 'পণ্যটি আপনার উইশলিস্ট থেকে সরানো হয়েছে।',
      });
    } else {
      const created = await prisma.bookmark.create({
        data: {
          userId: session.id,
          bookId,
        },
      });
      return NextResponse.json({
        success: true,
        action: 'ADDED',
        message: 'পণ্যটি সফলভাবে উইশলিস্টে যুক্ত হয়েছে!',
        bookmark: created,
      });
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return NextResponse.json({ error: 'উইশলিস্ট প্রক্রিয়াকরণে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

