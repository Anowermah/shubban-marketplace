import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            articles: true,
            books: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        ...c,
        articleCount: c._count?.articles || 0,
        bookCount: c._count?.books || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching publication categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
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
    const { id, name, slug, description, image } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'ক্যাটাগরির নাম আবশ্যক' }, { status: 400 });
    }

    const generatedSlug = slug?.trim() || name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

    let category;
    if (id) {
      category = await prisma.category.update({
        where: { id },
        data: {
          name,
          slug: generatedSlug,
          description: description || null,
          image: image || null,
        },
      });
    } else {
      category = await prisma.category.create({
        data: {
          name,
          slug: generatedSlug,
          description: description || null,
          image: image || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: id ? 'ক্যাটাগরি আপডেট হয়েছে' : 'নতুন ক্যাটাগরি তৈরি হয়েছে',
      category,
    });
  } catch (error: any) {
    console.error('Error saving publication category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save category' },
      { status: 500 }
    );
  }
}
