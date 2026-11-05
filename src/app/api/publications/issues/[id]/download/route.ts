import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { verifyPublicationAccess } from '@/lib/cms';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    const access = await verifyPublicationAccess({
      issueId: params.id,
      userId: session?.id,
      userRole: session?.role,
    });

    if (!access.allowed || !access.canDownload) {
      return NextResponse.json(
        { error: 'এই প্রকাশনাটি ডাউনলোড করার অনুমতি আপনার নেই।' },
        { status: 403 }
      );
    }

    const updated = await prisma.publicationIssue.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
      select: { id: true, downloads: true, authorizedPdfUrl: true, pdfUrl: true },
    });

    return NextResponse.json({
      success: true,
      downloads: updated.downloads,
      downloadUrl: updated.authorizedPdfUrl || updated.pdfUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

