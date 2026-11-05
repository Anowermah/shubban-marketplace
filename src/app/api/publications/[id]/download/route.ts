import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.publicationIssue.findUnique({
      where: { id: params.id },
      include: { magazine: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'কাঙ্ক্ষিত প্রকাশনাটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // 1. Permission check: allowDownload
    if (!issue.allowDownload) {
      return NextResponse.json(
        { error: 'এই প্রকাশনাটি ডাউনলোড করার অনুমতি সংরক্ষিত।' },
        { status: 403 }
      );
    }

    // 2. Permission check: requireLogin
    const session = await getSessionUser();
    if (issue.requireLogin && !session) {
      return NextResponse.json(
        {
          error: 'এই প্রকাশনাটি ডাউনলোড করার জন্য অ্যাকাউন্টে লগইন করা আবশ্যক।',
          requireLogin: true,
          loginUrl: `/login?redirect=${encodeURIComponent(`/magazine/${issue.magazine.slug}`)}`,
        },
        { status: 401 }
      );
    }

    // 3. Privacy-conscious IP hash
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    const ipHash = crypto.createHash('sha256').update(`${ip}-${userAgent}-${params.id}`).digest('hex').slice(0, 32);

    // 4. Record download event & increment counter
    await Promise.all([
      prisma.publicationIssue.update({
        where: { id: params.id },
        data: { downloads: { increment: 1 } },
      }),
      prisma.publicationDownload.create({
        data: {
          issueId: issue.id,
          userId: session?.id || null,
          ipHash,
          fileType: 'PDF',
          fileSize: issue.fileSize || '5.0 MB',
        },
      }),
    ]);

    // 5. File Delivery
    const pdfPath = issue.authorizedPdfUrl || issue.pdfUrl;

    // If local file in public directory, stream or deliver with Content-Disposition
    if (pdfPath.startsWith('/')) {
      const fullPath = path.join(process.cwd(), 'public', pdfPath);
      if (fs.existsSync(fullPath)) {
        const fileBuffer = fs.readFileSync(fullPath);
        const filename = `${issue.magazine.title}-${issue.issueTitle}.pdf`.replace(/[\/\\?%*:|"<>]/g, '_');
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          },
        });
      }
    }

    // If external URL or fallback
    return NextResponse.redirect(new URL(pdfPath, req.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  return GET(req, { params });
}

