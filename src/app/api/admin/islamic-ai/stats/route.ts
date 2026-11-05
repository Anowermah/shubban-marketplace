import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const [
      totalVerses,
      totalHadiths,
      totalCollections,
      totalScholarlyTopics,
      totalConversations,
      totalMessages,
      feedbackReports,
      collections,
    ] = await Promise.all([
      prisma.quranVerse.count(),
      prisma.hadithEntry.count(),
      prisma.hadithCollection.count(),
      prisma.scholarlyReference.count(),
      prisma.islamicAiConversation.count(),
      prisma.islamicAiMessage.count(),
      prisma.islamicAiFeedback.findMany({
        where: { reportedError: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hadithCollection.findMany({
        include: { _count: { select: { entries: true } } },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        totalVerses,
        totalHadiths,
        totalCollections,
        totalScholarlyTopics,
        totalConversations,
        totalMessages,
        errorReportsCount: feedbackReports.length,
      },
      collections,
      recentReports: feedbackReports,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

