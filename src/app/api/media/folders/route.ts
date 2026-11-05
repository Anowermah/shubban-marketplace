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

    const folders = await prisma.mediaFolder.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { assets: { where: { isTrash: false } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      folders: folders.map((f) => ({
        ...f,
        assetCount: f._count.assets,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || (!isAdmin(user.role) && !isStaff(user.role))) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 });
    }

    const { name, parentId, color, icon } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'ফোল্ডারের নাম আবশ্যক' }, { status: 400 });
    }

    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const folder = await prisma.mediaFolder.create({
      data: {
        name: name.trim(),
        slug,
        parentId: parentId || null,
        color: color || '#C49A45',
        icon: icon || 'folder',
        createdBy: user.name || user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ফোল্ডার সফলভাবে তৈরি হয়েছে।',
      folder,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

