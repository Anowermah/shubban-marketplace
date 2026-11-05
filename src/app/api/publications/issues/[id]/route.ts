import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.publicationIssue.findUnique({
      where: { id: params.id },
      include: {
        magazine: {
          include: { category: true, publisher: true },
        },
        articles: {
          include: { author: true, category: true },
          orderBy: { publishedAt: 'desc' },
        },
        _count: {
          select: { readingSessions: true, downloadsLog: true, sharesLog: true },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'সংখ্যাটি পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      fileSize,
      pageCount,
      summary,
      toc,
      authorizedPdfUrl,
      allowDownload,
      allowShare,
      readOnline,
      requireLogin,
      status,
      editorNotes,
      isFree,
      price,
    } = body;

    const data: any = {};
    if (magazineId !== undefined) data.magazineId = magazineId;
    if (issueTitle !== undefined) data.issueTitle = issueTitle;
    if (volume !== undefined) data.volume = volume;
    if (issueNumber !== undefined) data.issueNumber = issueNumber;
    if (publicationDate !== undefined) data.publicationDate = new Date(publicationDate);
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (pdfUrl !== undefined) data.pdfUrl = pdfUrl;
    if (fileSize !== undefined) data.fileSize = fileSize;
    if (pageCount !== undefined) data.pageCount = parseInt(pageCount) || 0;
    if (summary !== undefined) data.summary = summary;
    if (toc !== undefined) data.toc = toc;
    if (authorizedPdfUrl !== undefined) data.authorizedPdfUrl = authorizedPdfUrl;
    if (allowDownload !== undefined) data.allowDownload = Boolean(allowDownload);
    if (allowShare !== undefined) data.allowShare = Boolean(allowShare);
    if (readOnline !== undefined) data.readOnline = Boolean(readOnline);
    if (requireLogin !== undefined) data.requireLogin = Boolean(requireLogin);
    if (status !== undefined) data.status = status;
    if (editorNotes !== undefined) data.editorNotes = editorNotes;
    if (isFree !== undefined) data.isFree = Boolean(isFree);
    if (price !== undefined) data.price = parseFloat(price) || 0;

    const updated = await prisma.publicationIssue.update({
      where: { id: params.id },
      data,
      include: { magazine: true },
    });

    return NextResponse.json({ success: true, issue: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন সংখ্যা মুছে ফেলতে পারেন' }, { status: 403 });
    }

    await prisma.publicationIssue.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'সংখ্যাটি সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

