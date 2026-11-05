import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'বুকমার্ক সংরক্ষণ করতে অনুগ্রহ করে প্রথমে লগইন করুন।' }, { status: 401 });
    }

    const { bookId, articleId, page, note } = await req.json();

    if (!bookId && !articleId) {
      return NextResponse.json({ error: 'বই বা প্রবন্ধের আইডি আবশ্যক।' }, { status: 400 });
    }

    // Toggle bookmark
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId: session.id,
        bookId: bookId || null,
        articleId: articleId || null,
        page: page !== undefined ? Number(page) : null,
      },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, isBookmarked: false, message: 'বুকমার্ক সরানো হয়েছে।' });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.id,
        bookId: bookId || null,
        articleId: articleId || null,
        page: page !== undefined ? Number(page) : null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, isBookmarked: true, bookmark, message: 'বুকমার্কে সংরক্ষিত হয়েছে!' });
  } catch (error) {
    console.error('Bookmark error:', error);
    return NextResponse.json({ error: 'বুকমার্ক প্রক্রিয়ায় ত্রুটি হয়েছে।' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ bookmarks: [] });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.id },
      include: { book: true, article: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    return NextResponse.json({ bookmarks: [] });
  }
}

