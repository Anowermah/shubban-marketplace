import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleEn: { contains: search } },
        { description: { contains: search } },
        { editor: { contains: search } },
      ];
    }
    if (category) {
      where.categoryId = category;
    }
    if (status) {
      where.status = status;
    }

    const magazines = await prisma.magazine.findMany({
      where,
      include: {
        category: true,
        publisher: true,
        issues: {
          orderBy: { publicationDate: 'desc' },
          take: 5,
        },
        _count: {
          select: { issues: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, magazines });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      titleEn,
      slug,
      frequency = 'MONTHLY',
      description,
      coverImage,
      editor,
      editorialMessage,
      month,
      year,
      volume,
      issueNumber,
      language = 'bn',
      tags,
      seoTitle,
      metaDescription,
      status = 'PUBLISHED',
      publisherId,
      categoryId,
      isFeatured = false,
    } = body;

    if (!title || !description || !coverImage || !categoryId) {
      return NextResponse.json(
        { error: 'শিরোনাম, বিবরণ, প্রচ্ছদ ছবি ও ক্যাটাগরি আবশ্যক।' },
        { status: 400 }
      );
    }

    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^\w\u0980-\u09FF]+/g, '-')
        .slice(0, 60) + `-${Date.now().toString().slice(-4)}`;

    const magazine = await prisma.magazine.create({
      data: {
        title,
        titleEn,
        slug: generatedSlug,
        frequency,
        description,
        coverImage,
        editor,
        editorialMessage,
        month,
        year: year ? parseInt(year) : new Date().getFullYear(),
        volume,
        issueNumber,
        language,
        tags,
        seoTitle,
        metaDescription,
        status,
        publisherId: publisherId || null,
        categoryId,
        isFeatured: Boolean(isFeatured),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, magazine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

