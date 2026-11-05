import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVerifiedSessionUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageAdapter } from '@/lib/media/storage-adapter';
import { transformImage } from '@/lib/media/image-processor';
import { formatFileSize } from '@/lib/media/mime-validator';

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
      include: { variants: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'অ্যাসেট পাওয়া যায়নি' }, { status: 404 });
    }

    if (asset.mediaType !== 'IMAGE') {
      return NextResponse.json(
        { error: 'শুধুমাত্র ইমেজ অ্যাসেট এডিট বা রূপান্তর করা যাবে' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rotate, flip, flop, resize, crop } = body;

    if (!rotate && !flip && !flop && !resize && !crop) {
      return NextResponse.json(
        { error: 'কোনো এডিট বা রূপান্তর কমান্ড প্রদান করা হয়নি' },
        { status: 400 }
      );
    }

    // Read original buffer from disk
    const originalBuffer = await storageAdapter.read(asset.storageKey, asset.visibility);

    // Perform transformation with Sharp
    const result = await transformImage(originalBuffer, {
      rotate: typeof rotate === 'number' ? rotate : undefined,
      flip: Boolean(flip),
      flop: Boolean(flop),
      resize,
      crop,
    });

    // Overwrite the main image file
    await storageAdapter.overwrite(asset.storageKey, result.transformedBuffer, asset.visibility);

    // Overwrite thumbnail variant if exists
    if (result.thumbnailBuffer && asset.variants) {
      const thumb = asset.variants.find((v: any) => v.variantName === 'THUMBNAIL');
      if (thumb) {
        await storageAdapter.overwrite(thumb.storageKey, result.thumbnailBuffer, asset.visibility);
      }
    }

    // Overwrite medium variant if exists
    if (result.mediumBuffer && asset.variants) {
      const med = asset.variants.find((v: any) => v.variantName === 'MEDIUM');
      if (med) {
        await storageAdapter.overwrite(med.storageKey, result.mediumBuffer, asset.visibility);
      }
    }

    // Calculate new checksum & formatted size
    const newChecksum = crypto.createHash('sha256').update(result.transformedBuffer).digest('hex');
    const newSizeFormatted = formatFileSize(result.transformedBuffer.length);

    // Update database record
    const updated = await (prisma as any).mediaAsset.update({
      where: { id },
      data: {
        fileSizeBytes: result.transformedBuffer.length,
        fileSizeFormatted: newSizeFormatted,
        width: result.width,
        height: result.height,
        aspectRatio: result.aspectRatio,
        checksum: newChecksum,
        updatedAt: new Date(),
      },
      include: {
        folder: true,
        variants: true,
        references: true,
      },
    });

    // Audit log
    try {
      await (prisma as any).mediaAuditLog.create({
        data: {
          assetId: id,
          action: 'TRANSFORM',
          performedBy: user.id,
          details: JSON.stringify({
            rotate,
            flip,
            flop,
            dimensions: `${result.width}x${result.height}`,
            newSize: newSizeFormatted,
          }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'ছবি সফলভাবে এডিট ও আপডেট করা হয়েছে',
      asset: updated,
    });
  } catch (err: any) {
    console.error('[Image Transform API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'ইমেজ রূপান্তর ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}
