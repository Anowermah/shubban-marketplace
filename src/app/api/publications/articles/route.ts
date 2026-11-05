import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const authorId = searchParams.get('authorId');
    const issueId = searchParams.get('issueId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: any = {};
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (authorId) where.authorId = authorId;
    if (issueId) where.issueId = issueId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { subtitle: { contains: search } },
        { excerpt: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const [total, articles] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        include: {
          author: true,
          category: true,
          issue: {
            include: { magazine: true },
          },
          _count: {
            select: { comments: true, readingSessions: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      articles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      subtitle,
      slug,
      content,
      excerpt,
      coverImage,
      type = 'ESSAY',
      status = 'PUBLISHED',
      authorId,
      categoryId,
      issueId,
      readingTime = 5,
      isFeatured = false,
      tags,
      arabicContent,
      references,
      relatedBookIds,
      relatedArticleIds,
      metaTitle,
      metaDescription,
    } = body;

    if (!title || !content || !excerpt || !authorId || !categoryId) {
      return NextResponse.json(
        { error: 'শিরোনাম, মূল লেখা, সারাংশ, লেখক এবং ক্যাটাগরি আবশ্যক।' },
        { status: 400 }
      );
    }

    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^\w\u0980-\u09FF]+/g, '-')
        .slice(0, 60) + `-${Date.now().toString().slice(-4)}`;

    const article = await prisma.article.create({
      data: {
        title,
        subtitle: subtitle || null,
        slug: generatedSlug,
        content,
        excerpt,
        coverImage: coverImage || null,
        type,
        status,
        authorId,
        categoryId,
        issueId: issueId || null,
        readingTime: parseInt(readingTime) || 5,
        isFeatured: Boolean(isFeatured),
        tags: tags || null,
        arabicContent: arabicContent || null,
        references: references || null,
        relatedBookIds: relatedBookIds ? JSON.stringify(relatedBookIds) : null,
        relatedArticleIds: relatedArticleIds ? JSON.stringify(relatedArticleIds) : null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        approvedBy: session.id,
        approvedAt: new Date(),
      },
      include: {
        author: true,
        category: true,
      },
    });

    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

