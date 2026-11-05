import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const dateRange = searchParams.get('range') || '30d';
    const exportCsv = searchParams.get('export') === 'csv';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = exportCsv ? 1000 : parseInt(searchParams.get('limit') || '25', 10);
    const skip = (page - 1) * limit;

    let startDate = new Date();
    if (dateRange === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (dateRange === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (dateRange === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (dateRange === '365d') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setFullYear(2020);

    const where: any = {
      createdAt: { gte: startDate },
    };

    if (search) {
      where.OR = [
        { issue: { issueTitle: { contains: search } } },
        { article: { title: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }

    const [downloads, total, issueDownloads, articleDownloads] = await Promise.all([
      prisma.publicationDownload.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          issue: {
            select: { id: true, issueTitle: true, issueNumber: true, volume: true },
          },
          article: {
            select: { id: true, title: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.publicationDownload.count({ where }),
      prisma.publicationDownload.count({
        where: { ...where, issueId: { not: null } },
      }),
      prisma.publicationDownload.count({
        where: { ...where, articleId: { not: null } },
      }),
    ]);

    // Handle CSV Export
    if (exportCsv) {
      const csvRows = [
        ['ID', 'Title', 'Type', 'User', 'IP Hash', 'File Type', 'File Size', 'Date'],
        ...downloads.map((d: any) => [
          d.id,
          `"${(d.issue?.issueTitle || d.article?.title || 'Unknown').replace(/"/g, '""')}"`,
          d.issueId ? 'Magazine Issue' : 'Article',
          `"${(d.user?.name || 'Guest Reader').replace(/"/g, '""')}"`,
          d.ipHash || 'N/A',
          d.fileType,
          d.fileSize || 'N/A',
          d.createdAt.toISOString(),
        ]),
      ];
      const csvContent = csvRows.map((e) => e.join(',')).join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="publication-downloads-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      downloads,
      stats: {
        totalDownloads: total,
        issueDownloads,
        articleDownloads,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching publication download logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch download logs' },
      { status: 500 }
    );
  }
}
