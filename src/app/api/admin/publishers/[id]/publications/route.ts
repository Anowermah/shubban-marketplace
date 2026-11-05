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

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type') || 'all'; // all, book, magazine

    const publisher = await prisma.publisher.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!publisher) {
      return NextResponse.json({ error: 'প্রকাশনী সংস্থা পাওয়া যায়নি।' }, { status: 404 });
    }

    let books: any[] = [];
    let magazines: any[] = [];

    if (type === 'all' || type === 'book') {
      const bookWhere: any = { publisherId: id };
      if (search) {
        bookWhere.title = { contains: search };
      }
      books = await prisma.book.findMany({
        where: bookWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          price: true,
          discountPrice: true,
          stockQuantity: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });
    }

    if (type === 'all' || type === 'magazine') {
      const magWhere: any = { publisherId: id };
      if (search) {
        magWhere.title = { contains: search };
      }
      magazines = await prisma.magazine.findMany({
        where: magWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
        },
      });
    }

    return NextResponse.json({
      success: true,
      publisher,
      books,
      magazines,
      totalCount: books.length + magazines.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/publishers/[id]/publications:', error);
    return NextResponse.json(
      { error: 'প্রকাশনাসমূহ লোড করতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const sourcePublisherId = params.id;
    const body = await req.json();
    const { targetPublisherId, reassignAll = false, bookIds = [], magazineIds = [] } = body;

    if (!targetPublisherId) {
      return NextResponse.json({ error: 'লক্ষ্য প্রকাশনী (Target Publisher) নির্বাচন করুন।' }, { status: 400 });
    }

    if (targetPublisherId === sourcePublisherId) {
      return NextResponse.json({ error: 'উৎস ও লক্ষ্য প্রকাশনী একই হতে পারে না।' }, { status: 400 });
    }

    // Verify source and target publishers
    const [sourcePub, targetPub] = await Promise.all([
      prisma.publisher.findUnique({ where: { id: sourcePublisherId } }),
      prisma.publisher.findUnique({ where: { id: targetPublisherId } }),
    ]);

    if (!sourcePub) {
      return NextResponse.json({ error: 'উৎস প্রকাশনী পাওয়া যায়নি।' }, { status: 404 });
    }
    if (!targetPub) {
      return NextResponse.json({ error: 'লক্ষ্য প্রকাশনী পাওয়া যায়নি।' }, { status: 404 });
    }

    let reassignedBooksCount = 0;
    let reassignedMagazinesCount = 0;

    if (reassignAll) {
      const bookResult = await prisma.book.updateMany({
        where: { publisherId: sourcePublisherId },
        data: { publisherId: targetPublisherId },
      });
      reassignedBooksCount = bookResult.count;

      const magResult = await prisma.magazine.updateMany({
        where: { publisherId: sourcePublisherId },
        data: { publisherId: targetPublisherId },
      });
      reassignedMagazinesCount = magResult.count;
    } else {
      if (Array.isArray(bookIds) && bookIds.length > 0) {
        const bookResult = await prisma.book.updateMany({
          where: { id: { in: bookIds }, publisherId: sourcePublisherId },
          data: { publisherId: targetPublisherId },
        });
        reassignedBooksCount = bookResult.count;
      }

      if (Array.isArray(magazineIds) && magazineIds.length > 0) {
        const magResult = await prisma.magazine.updateMany({
          where: { id: { in: magazineIds }, publisherId: sourcePublisherId },
          data: { publisherId: targetPublisherId },
        });
        reassignedMagazinesCount = magResult.count;
      }
    }

    const totalReassigned = reassignedBooksCount + reassignedMagazinesCount;

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REASSIGN_PUBLICATIONS',
          entity: 'Publisher',
          entityId: sourcePublisherId,
          details: JSON.stringify({
            sourcePublisher: { id: sourcePub.id, name: sourcePub.name },
            targetPublisher: { id: targetPub.id, name: targetPub.name },
            reassignedBooksCount,
            reassignedMagazinesCount,
            totalReassigned,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record reassign audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: `${totalReassigned}টি প্রকাশনা (বই: ${reassignedBooksCount}, সাময়িকী: ${reassignedMagazinesCount}) সফলভাবে "${targetPub.name}" প্রকাশনীতে স্থানান্তর করা হয়েছে।`,
      totalReassigned,
      reassignedBooksCount,
      reassignedMagazinesCount,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/publishers/[id]/publications:', error);
    return NextResponse.json(
      { error: 'প্রকাশনা স্থানান্তর করতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

