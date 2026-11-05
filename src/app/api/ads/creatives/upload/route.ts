import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { validateAndProcessAdCreative } from '@/lib/ads/creative-validator';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const limitCheck = rateLimit(clientIp, { limit: 15, windowMs: 60 * 1000, prefix: 'ad_upload' });
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত ফাইল আপলোডের অনুরোধ। কিছুক্ষণ পর চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'বিজ্ঞাপনের ফাইল আপলোড করতে লগইন করা আবশ্যক।' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'LEADERBOARD_BANNER';

    if (!file) {
      return NextResponse.json({ error: 'কোনো ফাইল নির্বাচন করা হয়নি।' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // Validate and process with Sharp
    const result = await validateAndProcessAdCreative(file.name, rawBuffer, { format });
    if (!result.valid || !result.sanitizedFilename || !result.optimizedBuffer) {
      return NextResponse.json({ error: result.error || 'অবৈধ ব্যানার ফাইল।' }, { status: 400 });
    }

    // Save to centralized Media DAM under 'ads-campaigns' folder
    const { mediaService } = await import('@/lib/media/media-service');
    const { prisma } = await import('@/lib/prisma');

    let folderId: string | undefined;
    try {
      const folder = await (prisma as any).mediaFolder.findUnique({
        where: { slug: 'ads-campaigns' },
      });
      folderId = folder?.id;
    } catch { }

    const asset = await mediaService.uploadAsset({
      filename: result.sanitizedFilename,
      buffer: result.optimizedBuffer,
      title: file.name,
      folderId,
      visibility: 'PUBLIC',
      uploadedBy: (session.user as any)?.id || 'Advertiser',
    });

    return NextResponse.json({
      success: true,
      url: asset.publicUrl,
      assetId: asset.id,
      width: asset.width || result.width,
      height: asset.height || result.height,
      mimeType: asset.mimeType || result.detectedMime,
      size: asset.fileSizeBytes || result.optimizedBuffer.length,
    });
  } catch (err: any) {
    console.error('Ad creative upload error:', err);
    return NextResponse.json(
      { error: 'বিজ্ঞাপন আপলোড প্রসেস করার সময় একটি কারিগরি সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

