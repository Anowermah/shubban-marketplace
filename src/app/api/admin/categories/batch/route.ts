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
    const { action, categoryIds, displayOrders } = body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'কমপক্ষে একটি ক্যাটাগরি নির্বাচন করুন।' }, { status: 400 });
    }

    let message = '';
    let updatedCount = 0;

    switch (action) {
      case 'activate': {
        const res = await prisma.category.updateMany({
          where: { id: { in: categoryIds } },
          data: { isActive: true },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি ক্যাটাগরি সফলভাবে সক্রিয় (Active) করা হয়েছে।`;
        break;
      }

      case 'deactivate': {
        const res = await prisma.category.updateMany({
          where: { id: { in: categoryIds } },
          data: { isActive: false },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি ক্যাটাগরি সফলভাবে নিষ্ক্রিয় (Inactive) করা হয়েছে।`;
        break;
      }

      case 'reorder': {
        if (!displayOrders || typeof displayOrders !== 'object') {
          return NextResponse.json({ error: 'সঠিক ডিসপ্লে অর্ডার ডেটা প্রদান করুন।' }, { status: 400 });
        }
        const updates = Object.entries(displayOrders).map(([id, order]) =>
          prisma.category.update({
            where: { id },
            data: { displayOrder: Number(order) || 0 },
          })
        );
        await prisma.$transaction(updates);
        updatedCount = updates.length;
        message = `${updatedCount}টি ক্যাটাগরির প্রদর্শন ক্রম সফলভাবে আপডেট করা হয়েছে।`;
        break;
      }

      case 'delete': {
        // Safe batch delete: inspect each category
        const categories = await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          include: {
            _count: {
              select: {
                books: true,
                articles: true,
                magazines: true,
                questions: true,
              },
            },
          },
        });

        // Find which ones have subcategories
        const parentsWithChildren = await prisma.category.findMany({
          where: {
            parentId: { in: categoryIds },
          },
          select: { parentId: true },
        });
        const parentIdSet = new Set(parentsWithChildren.map((p) => p.parentId));

        const blockedDueToChildren: string[] = [];
        const blockedDueToBooks: string[] = [];
        const safeToDeleteIds: string[] = [];

        categories.forEach((cat) => {
          if (parentIdSet.has(cat.id)) {
            blockedDueToChildren.push(cat.name);
          } else if (
            cat._count.books > 0 ||
            cat._count.articles > 0 ||
            cat._count.magazines > 0 ||
            cat._count.questions > 0
          ) {
            blockedDueToBooks.push(cat.name);
          } else {
            safeToDeleteIds.push(cat.id);
          }
        });

        if (safeToDeleteIds.length === 0) {
          const reasons = [];
          if (blockedDueToChildren.length > 0) {
            reasons.push(`উপ-বিভাগ থাকায় ডিলিট করা যায়নি: ${blockedDueToChildren.join(', ')}`);
          }
          if (blockedDueToBooks.length > 0) {
            reasons.push(`বই/পণ্য যুক্ত থাকায় ডিলিট করা যায়নি: ${blockedDueToBooks.join(', ')}`);
          }
          return NextResponse.json(
            { error: `কোনো ক্যাটাগরি ডিলিট করা সম্ভব হয়নি। কারণ: ${reasons.join(' | ')}` },
            { status: 400 }
          );
        }

        const deleteRes = await prisma.category.deleteMany({
          where: { id: { in: safeToDeleteIds } },
        });
        updatedCount = deleteRes.count;

        let note = `${updatedCount}টি ক্যাটাগরি সফলভাবে ডিলিট করা হয়েছে।`;
        if (blockedDueToChildren.length > 0 || blockedDueToBooks.length > 0) {
          note += ` (সতর্কতা: পণ্য বা উপ-বিভাগ সংযুক্ত থাকায় ${blockedDueToChildren.length + blockedDueToBooks.length}টি ক্যাটাগরি ডিলিট করা থেকে বিরত রাখা হয়েছে)`;
        }
        message = note;
        break;
      }

      default:
        return NextResponse.json({ error: 'অবৈধ বাল্ক অ্যাকশন অনুরোধ।' }, { status: 400 });
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'BATCH_UPDATE_CATEGORIES',
          entity: 'Category',
          details: JSON.stringify({
            action,
            targetCount: categoryIds.length,
            affectedCount: updatedCount,
            categoryIds,
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
    console.error('Error in POST /api/admin/categories/batch:', error);
    return NextResponse.json(
      { error: 'বাল্ক অপারেশন সম্পন্ন করতে ত্রুটি ঘটেছে।', details: error.message },
      { status: 500 }
    );
  }
}

