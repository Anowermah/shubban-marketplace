import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const tags = await prisma.publicationTag.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tags,
    });
  } catch (error: any) {
    console.error('Error fetching publication tags:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, slug, description, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'ট্যাগের নাম আবশ্যক' }, { status: 400 });
    }

    const generatedSlug = slug?.trim() || name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `tag-${Date.now()}`;

    let tag;
    if (id) {
      tag = await prisma.publicationTag.update({
        where: { id },
        data: {
          name,
          slug: generatedSlug,
          description: description || null,
          color: color || '#c59b27',
        },
      });
    } else {
      tag = await prisma.publicationTag.create({
        data: {
          name,
          slug: generatedSlug,
          description: description || null,
          color: color || '#c59b27',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: id ? 'ট্যাগ আপডেট হয়েছে' : 'নতুন ট্যাগ তৈরি হয়েছে',
      tag,
    });
  } catch (error: any) {
    console.error('Error saving publication tag:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save tag' },
      { status: 500 }
    );
  }
}
