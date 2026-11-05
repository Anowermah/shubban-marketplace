import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        author: true,
        category: true,
        issue: {
          include: { magazine: true },
        },
        comments: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'প্রবন্ধটি পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      type,
      status,
      authorId,
      categoryId,
      issueId,
      readingTime,
      isFeatured,
      tags,
      arabicContent,
      references,
      relatedBookIds,
      relatedArticleIds,
      metaTitle,
      metaDescription,
    } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (slug !== undefined) data.slug = slug;
    if (content !== undefined) data.content = content;
    if (excerpt !== undefined) data.excerpt = excerpt;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (authorId !== undefined) data.authorId = authorId;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (issueId !== undefined) data.issueId = issueId || null;
    if (readingTime !== undefined) data.readingTime = parseInt(readingTime) || 5;
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);
    if (tags !== undefined) data.tags = tags;
    if (arabicContent !== undefined) data.arabicContent = arabicContent;
    if (references !== undefined) data.references = references;
    if (relatedBookIds !== undefined) data.relatedBookIds = JSON.stringify(relatedBookIds);
    if (relatedArticleIds !== undefined) data.relatedArticleIds = JSON.stringify(relatedArticleIds);
    if (metaTitle !== undefined) data.metaTitle = metaTitle;
    if (metaDescription !== undefined) data.metaDescription = metaDescription;

    const updated = await prisma.article.update({
      where: { id: params.id },
      data,
      include: { author: true, category: true },
    });

    return NextResponse.json({ success: true, article: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন ও সম্পাদক মুছে ফেলতে পারেন' }, { status: 403 });
    }

    await prisma.article.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'প্রবন্ধটি সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

