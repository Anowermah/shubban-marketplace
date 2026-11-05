import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || '';
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

    if (platform) {
      where.platform = platform.toUpperCase();
    }

    if (search) {
      where.OR = [
        { issue: { issueTitle: { contains: search } } },
        { article: { title: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }

    const [shares, total, fbCount, waCount, copyCount, nativeCount] = await Promise.all([
      prisma.publicationShare.findMany({
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
      prisma.publicationShare.count({ where }),
      prisma.publicationShare.count({ where: { ...where, platform: 'FACEBOOK' } }),
      prisma.publicationShare.count({ where: { ...where, platform: 'WHATSAPP' } }),
      prisma.publicationShare.count({ where: { ...where, platform: 'COPY_LINK' } }),
      prisma.publicationShare.count({ where: { ...where, platform: 'NATIVE' } }),
    ]);

    if (exportCsv) {
      const csvRows = [
        ['ID', 'Title', 'Type', 'Platform', 'User', 'Date'],
        ...shares.map((s: any) => [
          s.id,
          `"${(s.issue?.issueTitle || s.article?.title || 'Unknown').replace(/"/g, '""')}"`,
          s.issueId ? 'Magazine Issue' : 'Article',
          s.platform,
          `"${(s.user?.name || 'Reader').replace(/"/g, '""')}"`,
          s.createdAt.toISOString(),
        ]),
      ];
      const csvContent = csvRows.map((e) => e.join(',')).join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="publication-shares-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      shares,
      stats: {
        totalShares: total,
        byPlatform: {
          FACEBOOK: fbCount,
          WHATSAPP: waCount,
          COPY_LINK: copyCount,
          NATIVE: nativeCount,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching publication share logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch share logs' },
      { status: 500 }
    );
  }
}
