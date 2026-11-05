import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d'; // today, 7d, 30d, month, all
    const publicationId = searchParams.get('publicationId');
    const format = searchParams.get('format'); // csv or json

    // Date range filter
    const now = new Date();
    let startDate: Date | undefined;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const sessionWhere: any = {};
    const downloadWhere: any = {};
    const shareWhere: any = {};

    if (startDate) {
      sessionWhere.createdAt = { gte: startDate };
      downloadWhere.createdAt = { gte: startDate };
      shareWhere.createdAt = { gte: startDate };
    }

    if (publicationId) {
      sessionWhere.issueId = publicationId;
      downloadWhere.issueId = publicationId;
      shareWhere.issueId = publicationId;
    }

    // Fetch metrics
    const [
      allSessions,
      allDownloads,
      allShares,
      issuesWithCounts,
    ] = await Promise.all([
      prisma.readingSession.findMany({
        where: sessionWhere,
        select: {
          id: true,
          issueId: true,
          articleId: true,
          sessionId: true,
          ipHash: true,
          deviceType: true,
          browser: true,
          durationSeconds: true,
          totalPagesViewed: true,
          isMeaningfulReader: true,
          completionRate: true,
          createdAt: true,
        },
      }),
      prisma.publicationDownload.findMany({
        where: downloadWhere,
        select: {
          id: true,
          issueId: true,
          ipHash: true,
          createdAt: true,
        },
      }),
      prisma.publicationShare.findMany({
        where: shareWhere,
        select: {
          id: true,
          issueId: true,
          platform: true,
          createdAt: true,
        },
      }),
      prisma.publicationIssue.findMany({
        take: 20,
        orderBy: { views: 'desc' },
        include: {
          magazine: { select: { title: true } },
          _count: {
            select: { readingSessions: true, downloadsLog: true, sharesLog: true },
          },
        },
      }),
    ]);

    // Aggregate statistics
    const totalSessions = allSessions.length;
    const uniqueReadersSet = new Set<string>();
    let totalDuration = 0;
    let totalPagesRead = 0;
    let meaningfulReaders = 0;
    let totalCompletion = 0;
    const sessionsByVisitor: Record<string, number> = {};

    const deviceBreakdown: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const dailySessionsMap: Record<string, { date: string; sessions: number; readers: number }> = {};

    allSessions.forEach((s) => {
      const visitorKey = s.ipHash || s.sessionId;
      uniqueReadersSet.add(visitorKey);
      sessionsByVisitor[visitorKey] = (sessionsByVisitor[visitorKey] || 0) + 1;

      totalDuration += s.durationSeconds;
      totalPagesRead += s.totalPagesViewed;
      if (s.isMeaningfulReader) meaningfulReaders++;
      totalCompletion += s.completionRate;

      const device = (s.deviceType || 'desktop').toLowerCase();
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;

      const dateStr = s.createdAt.toISOString().split('T')[0];
      if (!dailySessionsMap[dateStr]) {
        dailySessionsMap[dateStr] = { date: dateStr, sessions: 0, readers: 0 };
      }
      dailySessionsMap[dateStr].sessions += 1;
    });

    const uniqueReaders = uniqueReadersSet.size;
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const avgPages = totalSessions > 0 ? Number((totalPagesRead / totalSessions).toFixed(1)) : 0;
    const avgCompletion = totalSessions > 0 ? Math.round(totalCompletion / totalSessions) : 0;
    const returningReaders = Object.values(sessionsByVisitor).filter((count) => count > 1).length;

    // Downloads
    const totalDownloads = allDownloads.length;
    const uniqueDownloaders = new Set(allDownloads.map((d) => d.ipHash || d.id)).size;

    // Shares
    const totalShares = allShares.length;
    const sharesByPlatform: Record<string, number> = {};
    allShares.forEach((sh) => {
      sharesByPlatform[sh.platform] = (sharesByPlatform[sh.platform] || 0) + 1;
    });

    // Trend chart points (sorted by date)
    const trendData = Object.values(dailySessionsMap).sort((a, b) => a.date.localeCompare(b.date));

    // Handle CSV export request
    if (format === 'csv') {
      const csvHeader = 'Issue Title,Magazine,Views,Sessions,Downloads,Shares,Publication Date\n';
      const csvRows = issuesWithCounts
        .map(
          (iss) =>
            `"${iss.issueTitle.replace(/"/g, '""')}","${iss.magazine.title.replace(/"/g, '""')}",${iss.views},${iss._count.readingSessions},${iss.downloads},${iss._count.sharesLog},"${iss.publicationDate.toISOString().split('T')[0]}"`
        )
        .join('\n');

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="shubban-reading-analytics-${period}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalSessions,
        uniqueReaders,
        meaningfulReaders,
        meaningfulRate: uniqueReaders > 0 ? Math.round((meaningfulReaders / uniqueReaders) * 100) : 0,
        totalDuration,
        avgDuration,
        totalPagesRead,
        avgPages,
        avgCompletion,
        returningReaders,
        totalDownloads,
        uniqueDownloaders,
        totalShares,
      },
      deviceBreakdown,
      sharesByPlatform,
      trendData,
      publications: issuesWithCounts.map((iss) => ({
        id: iss.id,
        title: iss.issueTitle,
        magazine: iss.magazine.title,
        coverImage: iss.coverImage,
        views: iss.views,
        sessions: iss._count.readingSessions,
        downloads: iss.downloads,
        shares: iss._count.sharesLog,
        status: iss.status,
        date: iss.publicationDate,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

