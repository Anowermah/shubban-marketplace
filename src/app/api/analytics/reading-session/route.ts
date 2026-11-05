import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const issueId = searchParams.get('issueId');
    const sessionId = searchParams.get('sessionId');

    if (!issueId) {
      return NextResponse.json({ error: 'issueId আবশ্যক' }, { status: 400 });
    }

    const sessionUser = await getSessionUser();

    // 1. Check logged-in user progress first
    if (sessionUser) {
      const progress = await prisma.issueReadingProgress.findUnique({
        where: {
          userId_issueId: {
            userId: sessionUser.id,
            issueId,
          },
        },
      });

      if (progress) {
        return NextResponse.json({
          success: true,
          lastPage: progress.currentPage,
          totalPages: progress.totalPages,
        });
      }
    }

    // 2. Check guest reading session by sessionId
    if (sessionId) {
      const readingSession = await prisma.readingSession.findFirst({
        where: {
          issueId,
          sessionId,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (readingSession) {
        return NextResponse.json({
          success: true,
          lastPage: readingSession.lastPage,
          totalPagesViewed: readingSession.totalPagesViewed,
        });
      }
    }

    return NextResponse.json({ success: true, lastPage: 1 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      issueId,
      articleId,
      sessionId,
      currentPage = 1,
      totalPages = 1,
      pagesRead = [],
      durationIncrement = 15,
      deviceType = 'desktop',
      browser = 'Unknown',
      os = 'Unknown',
    } = body;

    if (!sessionId || (!issueId && !articleId)) {
      return NextResponse.json({ error: 'sessionId এবং issueId/articleId আবশ্যক' }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(`${ip}-${sessionId}`).digest('hex').slice(0, 32);

    // 1. Find or create reading session
    let existingSession = await prisma.readingSession.findFirst({
      where: {
        sessionId,
        ...(issueId ? { issueId } : { articleId }),
      },
    });

    let currentPagesSet = new Set<number>();
    let currentDuration = 0;

    if (existingSession) {
      try {
        const parsed = JSON.parse(existingSession.pagesRead || '[]');
        if (Array.isArray(parsed)) {
          parsed.forEach((p: number) => currentPagesSet.add(p));
        }
      } catch (e) { }
      currentDuration = existingSession.durationSeconds;
    }

    // Merge newly read pages
    if (Array.isArray(pagesRead)) {
      pagesRead.forEach((p: number) => currentPagesSet.add(p));
    }
    if (currentPage) {
      currentPagesSet.add(Number(currentPage));
    }

    const newDuration = currentDuration + Math.max(0, parseInt(durationIncrement) || 0);
    const pagesArray = Array.from(currentPagesSet);
    const totalPagesViewed = pagesArray.length;

    // Meaningful reader threshold: >= 30 seconds OR >= 3 pages
    const isMeaningfulReader = newDuration >= 30 || totalPagesViewed >= 3;
    const completionRate = Math.min(
      100,
      Math.round((totalPagesViewed / Math.max(1, parseInt(totalPages) || 1)) * 100)
    );

    if (existingSession) {
      existingSession = await prisma.readingSession.update({
        where: { id: existingSession.id },
        data: {
          userId: sessionUser?.id || existingSession.userId,
          pagesRead: JSON.stringify(pagesArray),
          totalPagesViewed,
          lastPage: Number(currentPage),
          durationSeconds: newDuration,
          isMeaningfulReader,
          completionRate,
          deviceType,
          browser,
          os,
        },
      });
    } else {
      existingSession = await prisma.readingSession.create({
        data: {
          issueId: issueId || null,
          articleId: articleId || null,
          userId: sessionUser?.id || null,
          sessionId,
          ipHash,
          deviceType,
          browser,
          os,
          pagesRead: JSON.stringify(pagesArray),
          totalPagesViewed,
          lastPage: Number(currentPage),
          durationSeconds: newDuration,
          isMeaningfulReader,
          completionRate,
        },
      });

      // Increment overall views on publication
      if (issueId) {
        await prisma.publicationIssue.update({
          where: { id: issueId },
          data: { views: { increment: 1 } },
        });
      } else if (articleId) {
        await prisma.article.update({
          where: { id: articleId },
          data: { views: { increment: 1 } },
        });
      }
    }

    // 2. If user is logged in, sync last reading position to resume later
    if (sessionUser && issueId) {
      await prisma.issueReadingProgress.upsert({
        where: {
          userId_issueId: {
            userId: sessionUser.id,
            issueId,
          },
        },
        update: {
          currentPage: Number(currentPage),
          totalPages: Number(totalPages) || 1,
          lastReadAt: new Date(),
        },
        create: {
          userId: sessionUser.id,
          issueId,
          currentPage: Number(currentPage),
          totalPages: Number(totalPages) || 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: existingSession.sessionId,
      isMeaningfulReader,
      durationSeconds: newDuration,
      totalPagesViewed,
      completionRate,
      lastPage: Number(currentPage),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

