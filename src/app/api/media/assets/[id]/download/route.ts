import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSessionUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageAdapter } from '@/lib/media/storage-adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const inline = url.searchParams.get('inline') === 'true';

    const asset = await (prisma as any).mediaAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: 'ফাইল পাওয়া যায়নি' }, { status: 404 });
    }

    // Access control for private assets
    if (asset.visibility === 'PRIVATE' || asset.visibility === 'RESTRICTED') {
      const user = await getVerifiedSessionUser();
      if (!user || !isStaff(user.role)) {
        return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 401 });
      }
    }

    const buffer = await storageAdapter.read(asset.storageKey, asset.visibility);

    const dispositionType = inline ? 'inline' : 'attachment';
    const encodedFilename = encodeURIComponent(asset.originalName || asset.fileName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `${dispositionType}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    console.error('[Media Download API Error]:', err);
    return NextResponse.json(
      { error: 'ফাইল ডাউনলোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
