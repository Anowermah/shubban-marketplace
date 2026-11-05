import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { action, authorIds, targetAuthorId } = body;

    if (!Array.isArray(authorIds) || authorIds.length === 0) {
      return NextResponse.json({ error: 'কমপক্ষে একজন লেখক নির্বাচন করুন।' }, { status: 400 });
    }

    let message = '';
    let updatedCount = 0;

    switch (action) {
      case 'activate': {
        const res = await prisma.author.updateMany({
          where: { id: { in: authorIds } },
          data: {
            isActive: true,
            status: 'ACTIVE',
          },
        });
        updatedCount = res.count;
        message = `${updatedCount} জন লেখক প্রোফাইল সফলভাবে সক্রিয় (Active) করা হয়েছে।`;
        break;
      }

      case 'deactivate': {
        const res = await prisma.author.updateMany({
          where: { id: { in: authorIds } },
          data: {
            isActive: false,
            status: 'INACTIVE',
          },
        });
        updatedCount = res.count;
        message = `${updatedCount} জন লেখক প্রোফাইল সফলভাবে নিষ্ক্রিয় (Inactive) করা হয়েছে।`;
        break;
      }

      case 'delete': {
        // Safe delete: check which authors have books/articles
        const authors = await prisma.author.findMany({
          where: { id: { in: authorIds } },
          include: {
            _count: {
              select: {
                books: true,
                articles: true,
                papers: true,
              },
            },
          },
        });

        const blockedDueToContent: string[] = [];
        const safeToDeleteIds: string[] = [];

        authors.forEach((auth) => {
          const total = auth._count.books + auth._count.articles + auth._count.papers;
          if (total > 0) {
            blockedDueToContent.push(`${auth.name} (${total}টি কন্টেন্ট)`);
          } else {
            safeToDeleteIds.push(auth.id);
          }
        });

        if (safeToDeleteIds.length === 0) {
          return NextResponse.json(
            {
              error: `কোনো লেখক প্রোফাইল ডিলিট করা যায়নি। কারণ তাদের বই বা প্রবন্ধ প্রকাশিত রয়েছে: ${blockedDueToContent.join(', ')}`,
            },
            { status: 400 }
          );
        }

        const delRes = await prisma.author.deleteMany({
          where: { id: { in: safeToDeleteIds } },
        });
        updatedCount = delRes.count;

        let note = `${updatedCount} জন লেখক সফলভাবে ডিলিট করা হয়েছে।`;
        if (blockedDueToContent.length > 0) {
          note += ` (সতর্কতা: প্রবন্ধ/বই যুক্ত থাকায় ${blockedDueToContent.length} জনের প্রোফাইল সুরক্ষিত রাখা হয়েছে)`;
        }
        message = note;
        break;
      }

      case 'reassign': {
        if (!targetAuthorId) {
          return NextResponse.json({ error: 'পুনর্নির্ধারণের জন্য লক্ষ্য লেখক নির্বাচন করুন।' }, { status: 400 });
        }

        // Verify target author exists
        const target = await prisma.author.findUnique({
          where: { id: targetAuthorId },
        });
        if (!target) {
          return NextResponse.json({ error: 'লক্ষ্য লেখক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
        }

        // Reassign all articles from selected authors to target author
        const articleRes = await prisma.article.updateMany({
          where: { authorId: { in: authorIds } },
          data: { authorId: targetAuthorId },
        });

        // Also reassign books if needed
        const bookRes = await prisma.book.updateMany({
          where: { authorId: { in: authorIds } },
          data: { authorId: targetAuthorId },
        });

        updatedCount = articleRes.count + bookRes.count;
        message = `মোট ${articleRes.count}টি প্রবন্ধ ও ${bookRes.count}টি বই সফলভাবে "${target.name}"-এর নামে পুনর্নির্ধারণ করা হয়েছে।`;
        break;
      }

      default:
        return NextResponse.json({ error: 'অবৈধ বাল্ক অ্যাকশন অনুরোধ।' }, { status: 400 });
    }

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'BATCH_UPDATE_AUTHORS',
          entity: 'Author',
          details: JSON.stringify({
            action,
            targetCount: authorIds.length,
            affectedCount: updatedCount,
            authorIds,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      action,
      updatedCount,
      message,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/authors/batch:', error);
    return NextResponse.json(
      { error: 'বাল্ক অপারেশন সম্পন্ন করতে ত্রুটি ঘটেছে।', details: error.message },
      { status: 500 }
    );
  }
}

