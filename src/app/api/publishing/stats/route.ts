import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [
      publisherCount,
      magazineCount,
      issueCount,
      articleCount,
      readingSessionCount,
      meaningfulReadersCount,
      downloadCount,
      shareCount,
      subscriptionCount,
      magazines,
      publishers,
    ] = await Promise.all([
      prisma.publisher.count(),
      prisma.magazine.count(),
      prisma.publicationIssue.count(),
      prisma.article.count(),
      prisma.readingSession.count(),
      prisma.readingSession.count({ where: { isMeaningfulReader: true } }),
      prisma.publicationDownload.count(),
      prisma.publicationShare.count(),
      prisma.publicationSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.magazine.findMany({
        select: {
          id: true,
          title: true,
          frequency: true,
          totalRevenue: true,
          totalSubscribers: true,
          _count: { select: { issues: true, articles: true } },
        },
      }),
      prisma.publisher.findMany({
        select: {
          id: true,
          name: true,
          publisherType: true,
          _count: { select: { magazines: true, books: true } },
        },
      }),
    ]);

    // Frequency breakdown
    const frequencyMap: Record<string, number> = {};
    let totalPlatformRevenue = 0;
    magazines.forEach((m) => {
      frequencyMap[m.frequency] = (frequencyMap[m.frequency] || 0) + 1;
      totalPlatformRevenue += m.totalRevenue || 0;
    });

    return NextResponse.json({
      success: true,
      stats: {
        publisherCount,
        magazineCount,
        issueCount,
        articleCount,
        readingSessionCount,
        meaningfulReadersCount,
        downloadCount,
        shareCount,
        subscriptionCount,
        totalPlatformRevenue,
        frequencyBreakdown: frequencyMap,
        topMagazines: magazines.slice(0, 5),
        publishers: publishers.slice(0, 10),
      },
    });
  } catch (error: any) {
    console.error('Error fetching publishing stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch publishing stats' },
      { status: 500 }
    );
  }
}

