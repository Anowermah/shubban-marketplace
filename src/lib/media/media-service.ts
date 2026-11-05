import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import path from 'path';
import { storageAdapter } from './storage-adapter';
import { validateUploadFile, formatFileSize, MediaTypeCategory } from './mime-validator';
import { processImageVariants } from './image-processor';

export interface UploadAssetParams {
  filename: string;
  buffer: Buffer;
  declaredType?: string;
  title?: string;
  altText?: string;
  caption?: string;
  description?: string;
  folderId?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  uploadedBy?: string;
  publisherId?: string;
  magazineId?: string;
  tags?: string[];
  checkDuplicate?: boolean;
}

export class MediaService {
  /**
   * Upload and process a new media asset
   */
  public async uploadAsset(params: UploadAssetParams) {
    const {
      filename,
      buffer,
      declaredType,
      title,
      altText,
      caption,
      description,
      folderId,
      visibility = 'PUBLIC',
      uploadedBy = 'Admin',
      publisherId,
      magazineId,
      tags = [],
      checkDuplicate = true,
    } = params;

    // 1. Validate file format, magic bytes, and size limits
    const validation = validateUploadFile(filename, buffer, declaredType);
    if (!validation.valid || !validation.category || !validation.detectedMime) {
      throw new Error(validation.error || 'অবৈধ ফাইল ফরম্যাট');
    }

    // 2. Compute SHA-256 Checksum for duplicate detection & data integrity
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    if (checkDuplicate) {
      const existing = await prisma.mediaAsset.findFirst({
        where: { checksum, isTrash: false },
        include: { folder: true, variants: true },
      });
      if (existing) {
        return {
          asset: existing,
          isDuplicate: true,
          message: 'একই ফাইলটি ইতিমধ্যেই মিডিয়া লাইব্রেরিতে সংরক্ষিত আছে।',
        };
      }
    }

    // 3. Write original asset to storage
    const writeResult = await storageAdapter.write(filename, buffer, {
      visibility,
      mimeType: validation.detectedMime,
      subfolder: validation.category.toLowerCase(),
    });

    let width: number | undefined;
    let height: number | undefined;
    let aspectRatio: string | undefined;
    let thumbnailUrl: string | undefined;
    let mediumUrl: string | undefined;

    // 4. If Image, process thumbnails and optimized variants using Sharp
    const variantsToCreate: Array<{
      variantName: string;
      storageKey: string;
      publicUrl: string;
      width?: number;
      height?: number;
      fileSizeBytes: number;
      mimeType: string;
    }> = [];

    if (validation.category === 'IMAGE' && validation.detectedMime !== 'image/svg+xml') {
      const imgResult = await processImageVariants(buffer);
      width = imgResult.width;
      height = imgResult.height;
      aspectRatio = imgResult.aspectRatio;

      const baseExtless = path.basename(filename, path.extname(filename));

      // Thumbnail variant
      if (imgResult.thumbnailBuffer) {
        const thumbWrite = await storageAdapter.write(
          `${baseExtless}_thumb.webp`,
          imgResult.thumbnailBuffer,
          { visibility, mimeType: 'image/webp', subfolder: 'variants' }
        );
        thumbnailUrl = thumbWrite.publicUrl;
        variantsToCreate.push({
          variantName: 'THUMBNAIL',
          storageKey: thumbWrite.storageKey,
          publicUrl: thumbWrite.publicUrl,
          width: 240,
          fileSizeBytes: imgResult.thumbnailBuffer.length,
          mimeType: 'image/webp',
        });
      }

      // Medium variant
      if (imgResult.mediumBuffer) {
        const medWrite = await storageAdapter.write(
          `${baseExtless}_medium.webp`,
          imgResult.mediumBuffer,
          { visibility, mimeType: 'image/webp', subfolder: 'variants' }
        );
        mediumUrl = medWrite.publicUrl;
        variantsToCreate.push({
          variantName: 'MEDIUM',
          storageKey: medWrite.storageKey,
          publicUrl: medWrite.publicUrl,
          width: 800,
          fileSizeBytes: imgResult.mediumBuffer.length,
          mimeType: 'image/webp',
        });
      }

      // Optimized WebP variant
      if (imgResult.optimizedBuffer) {
        const optWrite = await storageAdapter.write(
          `${baseExtless}_opt.webp`,
          imgResult.optimizedBuffer,
          { visibility, mimeType: 'image/webp', subfolder: 'variants' }
        );
        variantsToCreate.push({
          variantName: 'WEBP',
          storageKey: optWrite.storageKey,
          publicUrl: optWrite.publicUrl,
          width,
          height,
          fileSizeBytes: imgResult.optimizedBuffer.length,
          mimeType: 'image/webp',
        });
      }
    }

    const fileSizeBytes = buffer.length;
    const fileSizeFormatted = formatFileSize(fileSizeBytes);

    // 5. Create database record
    const asset = await prisma.mediaAsset.create({
      data: {
        title: title || validation.sanitizedName || filename,
        altText: altText || title || filename,
        caption,
        description,
        fileName: validation.sanitizedName || filename,
        originalName: filename,
        storageKey: writeResult.storageKey,
        storageType: writeResult.storageType,
        publicUrl: writeResult.publicUrl,
        thumbnailUrl: thumbnailUrl || (validation.category === 'IMAGE' ? writeResult.publicUrl : null),
        mediumUrl: mediumUrl || (validation.category === 'IMAGE' ? writeResult.publicUrl : null),
        mimeType: validation.detectedMime,
        extension: validation.extension || path.extname(filename),
        mediaType: validation.category,
        fileSizeBytes,
        fileSizeFormatted,
        width,
        height,
        aspectRatio,
        checksum,
        visibility,
        folderId: folderId || null,
        uploadedBy,
        publisherId,
        magazineId,
        variants: {
          create: variantsToCreate,
        },
      },
      include: {
        variants: true,
        folder: true,
      },
    });

    // 6. Connect tags
    if (tags.length > 0) {
      for (const t of tags) {
        const tagSlug = t.trim().toLowerCase().replace(/[\s_]+/g, '-');
        if (!tagSlug) continue;
        const tagRecord = await prisma.mediaTag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: t.trim(), slug: tagSlug },
        });

        await prisma.mediaAssetTag.create({
          data: {
            assetId: asset.id,
            tagId: tagRecord.id,
          },
        }).catch(() => {});
      }
    }

    // 7. Audit log
    await prisma.mediaAuditLog.create({
      data: {
        assetId: asset.id,
        action: 'UPLOAD',
        actorName: uploadedBy,
        details: JSON.stringify({
          fileName: asset.fileName,
          size: fileSizeBytes,
          mediaType: asset.mediaType,
        }),
      },
    }).catch(() => {});

    return {
      asset,
      isDuplicate: false,
      message: 'ফাইল সফলভাবে মিডিয়া লাইব্রেরিতে আপলোড ও প্রসেস হয়েছে।',
    };
  }

  /**
   * Track media asset reference/usage across platform modules
   */
  public async trackReference(params: {
    assetId: string;
    module: string;
    entityId: string;
    entityTitle?: string;
    field?: string;
  }) {
    const { assetId, module, entityId, entityTitle, field = 'mediaUrl' } = params;

    return await prisma.mediaReference.upsert({
      where: {
        assetId_module_entityId_field: {
          assetId,
          module,
          entityId,
          field,
        },
      },
      update: {
        entityTitle,
      },
      create: {
        assetId,
        module,
        entityId,
        entityTitle,
        field,
      },
    });
  }

  /**
   * Remove reference
   */
  public async removeReference(assetId: string, module: string, entityId: string, field = 'mediaUrl') {
    return await prisma.mediaReference.deleteMany({
      where: {
        assetId,
        module,
        entityId,
        field,
      },
    });
  }

  /**
   * Soft delete (Move to Trash)
   */
  public async trashAsset(id: string, actorName = 'Admin') {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      include: { references: true },
    });

    if (!asset) {
      throw new Error('মিডিয়া ফাইলটি পাওয়া যায়নি।');
    }

    // Check if referenced
    if (asset.references.length > 0) {
      throw new Error(
        `এই ফাইলটি ${asset.references.length}টি স্থানে ব্যবহৃত হচ্ছে (${asset.references.map((r) => r.module).join(', ')})। সরাসরি ট্র্যাশে পাঠানো সম্ভব নয়।`
      );
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: {
        isTrash: true,
        trashedAt: new Date(),
      },
    });

    await prisma.mediaAuditLog.create({
      data: {
        assetId: id,
        action: 'TRASH',
        actorName,
        details: JSON.stringify({ fileName: asset.fileName }),
      },
    }).catch(() => {});

    return updated;
  }

  /**
   * Restore from Trash
   */
  public async restoreAsset(id: string, actorName = 'Admin') {
    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: {
        isTrash: false,
        trashedAt: null,
      },
    });

    await prisma.mediaAuditLog.create({
      data: {
        assetId: id,
        action: 'RESTORE',
        actorName,
      },
    }).catch(() => {});

    return updated;
  }

  /**
   * Permanent Delete with disk cleanup
   */
  public async permanentDeleteAsset(id: string, actorName = 'Admin') {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      include: { variants: true, references: true },
    });

    if (!asset) {
      throw new Error('মিডিয়া ফাইলটি পাওয়া যায়নি।');
    }

    if (asset.references.length > 0) {
      throw new Error(
        `এই ফাইলটি এখনো ${asset.references.length}টি স্থানে সক্রিয়ভাবে ব্যবহৃত হচ্ছে। মুছে ফেলা সম্ভব নয়।`
      );
    }

    // 1. Delete physical original file from disk
    await storageAdapter.delete(asset.storageKey, asset.visibility);

    // 2. Delete physical variant files
    for (const v of asset.variants) {
      await storageAdapter.delete(v.storageKey, asset.visibility);
    }

    // 3. Delete database record (cascades variants, tags, references)
    await prisma.mediaAsset.delete({
      where: { id },
    });

    await prisma.mediaAuditLog.create({
      data: {
        assetId: id,
        action: 'PERMANENT_DELETE',
        actorName,
        details: JSON.stringify({ fileName: asset.fileName, storageKey: asset.storageKey }),
      },
    }).catch(() => {});

    return true;
  }

  /**
   * Real database & storage stats for Media Dashboard
   */
  public async getDashboardStats() {
    const [
      totalFiles,
      trashCount,
      publicCount,
      privateCount,
      imageCount,
      pdfCount,
      documentCount,
      audioCount,
      videoCount,
      archiveCount,
      recentUploads,
      largestFiles,
      folderCount,
    ] = await Promise.all([
      prisma.mediaAsset.count({ where: { isTrash: false } }),
      prisma.mediaAsset.count({ where: { isTrash: true } }),
      prisma.mediaAsset.count({ where: { visibility: 'PUBLIC', isTrash: false } }),
      prisma.mediaAsset.count({ where: { visibility: { in: ['PRIVATE', 'RESTRICTED'] }, isTrash: false } }),
      prisma.mediaAsset.count({ where: { mediaType: 'IMAGE', isTrash: false } }),
      prisma.mediaAsset.count({ where: { mediaType: 'PDF', isTrash: false } }),
      prisma.mediaAsset.count({ where: { mediaType: 'DOCUMENT', isTrash: false } }),
      prisma.mediaAsset.count({ where: { mediaType: 'AUDIO', isTrash: false } }),
      prisma.mediaAsset.count({ where: { mediaType: 'VIDEO', isTrash: false } }),
      prisma.mediaAsset.count({ where: { mediaType: 'ARCHIVE', isTrash: false } }),
      prisma.mediaAsset.findMany({
        where: { isTrash: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { folder: true },
      }),
      prisma.mediaAsset.findMany({
        where: { isTrash: false },
        orderBy: { fileSizeBytes: 'desc' },
        take: 6,
      }),
      prisma.mediaFolder.count(),
    ]);

    // Aggregate storage bytes
    const sizeAgg = await prisma.mediaAsset.aggregate({
      where: { isTrash: false },
      _sum: { fileSizeBytes: true },
    });
    const totalBytes = sizeAgg._sum.fileSizeBytes || 0;

    // Actual disk stats
    const diskStats = await storageAdapter.getStorageStats();

    // Module usage counts
    const moduleUsage = await prisma.mediaReference.groupBy({
      by: ['module'],
      _count: { assetId: true },
    });

    return {
      totalFiles,
      trashCount,
      publicCount,
      privateCount,
      folderCount,
      totalBytes,
      totalFormatted: formatFileSize(totalBytes),
      diskStats: {
        totalBytes: diskStats.totalBytes,
        formatted: formatFileSize(diskStats.totalBytes),
        fileCount: diskStats.fileCount,
      },
      countsByType: {
        IMAGE: imageCount,
        PDF: pdfCount,
        DOCUMENT: documentCount,
        AUDIO: audioCount,
        VIDEO: videoCount,
        ARCHIVE: archiveCount,
      },
      recentUploads,
      largestFiles,
      moduleUsage: moduleUsage.map((m) => ({
        module: m.module,
        count: m._count.assetId,
      })),
      storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB quota default
      storageUsagePercentage: Math.min(100, Math.round((totalBytes / (10 * 1024 * 1024 * 1024)) * 100)),
    };
  }
}

export const mediaService = new MediaService();

