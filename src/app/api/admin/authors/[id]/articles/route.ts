import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all'; // all, PUBLISHED, DRAFT, REVIEW
    const search = searchParams.get('search')?.trim() || '';

    const where: any = { authorId: params.id };
    if (status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const statusCounts = {
      all: articles.length,
      published: articles.filter((a) => a.status === 'PUBLISHED').length,
      draft: articles.filter((a) => a.status === 'DRAFT').length,
      review: articles.filter((a) => a.status === 'REVIEW' || a.status === 'PENDING').length,
    };

    return NextResponse.json({
      success: true,
      articles,
      statusCounts,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/authors/[id]/articles:', error);
    return NextResponse.json(
      { error: 'প্রবন্ধ তালিকা লোড করতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Assign or Reassign articles
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { articleIds, action = 'assign', newAuthorId } = body;

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: 'কমপক্ষে একটি প্রবন্ধ নির্বাচন করুন।' }, { status: 400 });
    }

    if (action === 'assign') {
      // Assign these articles to params.id
      const res = await prisma.article.updateMany({
        where: { id: { in: articleIds } },
        data: { authorId: params.id },
      });

      return NextResponse.json({
        success: true,
        updatedCount: res.count,
        message: `${res.count}টি প্রবন্ধ সফলভাবে এই লেখকের সাথে সংযুক্ত করা হয়েছে।`,
      });
    } else if (action === 'reassign') {
      if (!newAuthorId) {
        return NextResponse.json({ error: 'নতুন লেখক নির্বাচন করুন।' }, { status: 400 });
      }

      const target = await prisma.author.findUnique({
        where: { id: newAuthorId },
      });
      if (!target) {
        return NextResponse.json({ error: 'নির্দিষ্ট নতুন লেখক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
      }

      const res = await prisma.article.updateMany({
        where: { id: { in: articleIds } },
        data: { authorId: newAuthorId },
      });

      return NextResponse.json({
        success: true,
        updatedCount: res.count,
        message: `${res.count}টি প্রবন্ধ সফলভাবে "${target.name}"-এর নামে স্থানান্তর করা হয়েছে।`,
      });
    }

    return NextResponse.json({ error: 'অবৈধ একশন অনুরোধ।' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/authors/[id]/articles:', error);
    return NextResponse.json(
      { error: 'প্রবন্ধ পরিচালনা করতে ব্যর্থ হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

