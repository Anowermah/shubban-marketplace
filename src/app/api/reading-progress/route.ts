import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: 'Anonymous reader - local progress only' });
    }

    const { bookId, currentPage, totalPages } = await req.json();

    if (!bookId || !currentPage) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const pct = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

    await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: session.id,
          bookId,
        },
      },
      update: {
        currentPage,
        totalPages: totalPages || 100,
        percentage: pct,
        lastReadAt: new Date(),
      },
      create: {
        userId: session.id,
        bookId,
        currentPage,
        totalPages: totalPages || 100,
        percentage: pct,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reading progress error:', error);
    return NextResponse.json({ error: 'Failed to record progress' }, { status: 500 });
  }
}
