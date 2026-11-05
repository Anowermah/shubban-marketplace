import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVerifiedSessionUser, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageAdapter } from '@/lib/media/storage-adapter';
import { validateUploadFile, formatFileSize } from '@/lib/media/mime-validator';
import { processImageVariants } from '@/lib/media/image-processor';

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
      include: { variants: true, references: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'অ্যাসেট পাওয়া যায়নি' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'নতুন ফাইল নির্বাচন করুন' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate with magic bytes
    const validation = validateUploadFile(file.name, buffer, file.type);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'ফাইলটি অনুমোদিত নয়' },
        { status: 400 }
      );
    }

    // Overwrite the primary file on disk
    await storageAdapter.overwrite(asset.storageKey, buffer, asset.visibility);

    let width: number | null = null;
    let height: number | null = null;
    let aspectRatio: string | null = null;

    // If image, regenerate variants and overwrite them
    if (validation.category === 'IMAGE') {
      const processed = await processImageVariants(buffer);
      width = processed.width || null;
      height = processed.height || null;
      aspectRatio = processed.aspectRatio || null;

      if (processed.thumbnailBuffer && asset.variants) {
        const thumb = asset.variants.find((v: any) => v.variantName === 'THUMBNAIL');
        if (thumb) {
          await storageAdapter.overwrite(thumb.storageKey, processed.thumbnailBuffer, asset.visibility);
        }
      }

      if (processed.mediumBuffer && asset.variants) {
        const med = asset.variants.find((v: any) => v.variantName === 'MEDIUM');
        if (med) {
          await storageAdapter.overwrite(med.storageKey, processed.mediumBuffer, asset.visibility);
        }
      }
    }

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeFormatted = formatFileSize(buffer.length);

    // Update database record while keeping references intact
    const updated = await (prisma as any).mediaAsset.update({
      where: { id },
      data: {
        originalName: file.name,
        mimeType: validation.detectedMime || file.type,
        fileSizeBytes: buffer.length,
        fileSizeFormatted: sizeFormatted,
        width,
        height,
        aspectRatio,
        checksum,
        updatedAt: new Date(),
      },
      include: {
        folder: true,
        variants: true,
        references: true,
      },
    });

    // Create audit log
    try {
      await (prisma as any).mediaAuditLog.create({
        data: {
          assetId: id,
          action: 'REPLACE_FILE',
          performedBy: user.id,
          details: JSON.stringify({
            newFileName: file.name,
            newSize: sizeFormatted,
            newChecksum: checksum,
            referenceCount: asset.references.length,
          }),
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'ফাইল সফলভাবে প্রতিস্থাপন করা হয়েছে (রেফারেন্স অপরিবর্তিত)',
      asset: updated,
    });
  } catch (err: any) {
    console.error('[File Replace API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'ফাইল প্রতিস্থাপন ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}
