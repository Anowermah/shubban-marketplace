import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: {
        author: true,
        category: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'প্রবন্ধ পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      type,
      status,
      authorId,
      categoryId,
      tags,
      readingTime,
      isFeatured,
      metaTitle,
      metaDescription,
      canonicalUrl,
      scheduledAt,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const article = await tx.article.update({
        where: { id: params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(slug !== undefined && { slug }),
          ...(content !== undefined && { content }),
          ...(excerpt !== undefined && { excerpt }),
          ...(coverImage !== undefined && { coverImage }),
          ...(type !== undefined && { type }),
          ...(status !== undefined && { status }),
          ...(authorId !== undefined && { authorId }),
          ...(categoryId !== undefined && { categoryId }),
          ...(tags !== undefined && { tags: JSON.stringify(tags) }),
          ...(readingTime !== undefined && { readingTime: Number(readingTime) }),
          ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
          ...(canonicalUrl !== undefined && { canonicalUrl }),
          ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: 'ARTICLE_UPDATED',
          entity: 'Article',
          entityId: article.id,
          details: JSON.stringify({ title: article.title, status: article.status }),
        },
      });

      return article;
    });

    return NextResponse.json({ success: true, article: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন প্রবন্ধ মুছে ফেলতে পারেন।' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.article.delete({
        where: { id: params.id },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          action: 'ARTICLE_DELETED',
          entity: 'Article',
          entityId: params.id,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'প্রবন্ধ সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

