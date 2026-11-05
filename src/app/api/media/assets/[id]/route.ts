import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';
import { mediaService } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: params.id },
      include: {
        folder: true,
        variants: true,
        references: true,
        tags: { include: { tag: true } },
      },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: 'মিডিয়া ফাইল পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      asset: {
        ...asset,
        usageCount: asset.references.length,
        tags: asset.tags.map((t) => t.tag.name),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || (!isAdmin(user.role) && !isStaff(user.role))) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 });
    }

    const body = await req.json();
    const { title, altText, caption, description, folderId, visibility, tags } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (altText !== undefined) data.altText = altText;
    if (caption !== undefined) data.caption = caption;
    if (description !== undefined) data.description = description;
    if (folderId !== undefined) data.folderId = folderId || null;
    if (visibility !== undefined) data.visibility = visibility;

    const updated = await prisma.mediaAsset.update({
      where: { id: params.id },
      data,
      include: {
        folder: true,
        variants: true,
        references: true,
      },
    });

    // Update tags if provided
    if (Array.isArray(tags)) {
      await prisma.mediaAssetTag.deleteMany({ where: { assetId: params.id } });
      for (const t of tags) {
        const slug = t.trim().toLowerCase().replace(/[\s_]+/g, '-');
        if (!slug) continue;
        const tag = await prisma.mediaTag.upsert({
          where: { slug },
          update: {},
          create: { name: t.trim(), slug },
        });
        await prisma.mediaAssetTag.create({
          data: { assetId: params.id, tagId: tag.id },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: 'মিডিয়া তথ্য সফলভাবে হালনাগাদ করা হয়েছে।',
      asset: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || (!isAdmin(user.role) && !isStaff(user.role))) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      await mediaService.permanentDeleteAsset(params.id, user.name || user.email);
      return NextResponse.json({
        success: true,
        message: 'মিডিয়া ফাইলটি স্থায়ীভাবে মুছে ফেলা হয়েছে।',
      });
    } else {
      const trashed = await mediaService.trashAsset(params.id, user.name || user.email);
      return NextResponse.json({
        success: true,
        message: 'মিডিয়া ফাইলটি ট্র্যাশে সরানো হয়েছে।',
        asset: trashed,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

