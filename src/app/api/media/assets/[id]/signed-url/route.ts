import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSessionUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageAdapter } from '@/lib/media/storage-adapter';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || !isStaff(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 401 });
    }

    const { id } = params;
    const asset = await (prisma as any).mediaAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: 'অ্যাসেট পাওয়া যায়নি' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    // Expiration in seconds: default 24 hours (86400)
    const expiresInSeconds = Number(body.expiresInSeconds) || 86400;

    const signedUrl = storageAdapter.getSignedUrl(asset.storageKey, expiresInSeconds);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresAt,
      expiresInSeconds,
    });
  } catch (err: any) {
    console.error('[Generate Signed URL Error]:', err);
    return NextResponse.json(
      { error: err.message || 'স্বাক্ষরিত লিঙ্ক তৈরি করা যায়নি' },
      { status: 500 }
    );
  }
}
