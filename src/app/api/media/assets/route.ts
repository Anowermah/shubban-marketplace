import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const mediaType = searchParams.get('mediaType') || 'ALL';
    const folderId = searchParams.get('folderId') || '';
    const visibility = searchParams.get('visibility') || 'ALL';
    const tag = searchParams.get('tag') || '';
    const isTrash = searchParams.get('trash') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      isTrash,
    };

    if (search.trim()) {
      where.OR = [
        { title: { contains: search } },
        { fileName: { contains: search } },
        { altText: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (mediaType !== 'ALL') {
      where.mediaType = mediaType;
    }

    if (folderId === 'ROOT') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }

    if (visibility !== 'ALL') {
      where.visibility = visibility;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag.toLowerCase(),
          },
        },
      };
    }

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          folder: { select: { id: true, name: true, slug: true, color: true } },
          variants: true,
          references: {
            select: { id: true, module: true, entityId: true, entityTitle: true, field: true },
          },
          tags: {
            include: { tag: true },
          },
        },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      assets: assets.map((a) => ({
        ...a,
        usageCount: a.references.length,
        tags: a.tags.map((t) => t.tag.name),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('List media assets error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'মিডিয়া ফাইল লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

