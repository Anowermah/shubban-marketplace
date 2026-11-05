import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const magazineId = searchParams.get('magazineId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (magazineId) where.magazineId = magazineId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { issueTitle: { contains: search } },
        { summary: { contains: search } },
        { volume: { contains: search } },
        { issueNumber: { contains: search } },
        { toc: { contains: search } },
      ];
    }

    const [total, issues] = await Promise.all([
      prisma.publicationIssue.count({ where }),
      prisma.publicationIssue.findMany({
        where,
        include: {
          magazine: true,
          _count: {
            select: { articles: true, readingSessions: true, downloadsLog: true },
          },
        },
        orderBy: { publicationDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      issues,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const body = await req.json();
    const {
      magazineId,
      issueTitle,
      volume,
      issueNumber,
      publicationDate,
      coverImage,
      pdfUrl,
      fileSize = '5.0 MB',
      pageCount = 48,
      summary,
      toc,
      authorizedPdfUrl,
      allowDownload = true,
      allowShare = true,
      readOnline = true,
      requireLogin = false,
      status = 'PUBLISHED',
      editorNotes,
      isFree = true,
      price = 0,
    } = body;

    if (!magazineId || !issueTitle || !coverImage || !pdfUrl) {
      return NextResponse.json(
        { error: 'সাময়িকী, সংখ্যার শিরোনাম, প্রচ্ছদ ও PDF লিঙ্ক আবশ্যক।' },
        { status: 400 }
      );
    }

    const issue = await prisma.publicationIssue.create({
      data: {
        magazineId,
        issueTitle,
        volume: volume || null,
        issueNumber: issueNumber || null,
        publicationDate: publicationDate ? new Date(publicationDate) : new Date(),
        coverImage,
        pdfUrl,
        fileSize,
        pageCount: parseInt(pageCount) || 0,
        summary: summary || null,
        toc: toc || null,
        authorizedPdfUrl: authorizedPdfUrl || null,
        allowDownload: Boolean(allowDownload),
        allowShare: Boolean(allowShare),
        readOnline: Boolean(readOnline),
        requireLogin: Boolean(requireLogin),
        status,
        editorNotes: editorNotes || null,
        isFree: Boolean(isFree),
        price: parseFloat(price) || 0,
        approvedBy: session.id,
        approvedAt: new Date(),
      },
      include: {
        magazine: true,
      },
    });

    return NextResponse.json({ success: true, issue }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

