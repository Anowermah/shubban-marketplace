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
    const { action, productIds, value } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'কমপক্ষে একটি পণ্য নির্বাচন করুন।' }, { status: 400 });
    }

    let message = '';
    let updatedCount = 0;

    switch (action) {
      case 'publish': {
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { isPhysicalAvailable: true },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্য সফলভাবে প্রকাশিত (Live) করা হয়েছে।`;
        break;
      }

      case 'draft': {
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { isPhysicalAvailable: false },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্য অপ্রকাশিত (Draft) করা হয়েছে।`;
        break;
      }

      case 'feature': {
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { isFeatured: true },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্যকে ফিচার্ড (Featured) তালিকায় যুক্ত করা হয়েছে।`;
        break;
      }

      case 'unfeature': {
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { isFeatured: false },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্যকে ফিচার্ড তালিকা থেকে বাদ দেওয়া হয়েছে।`;
        break;
      }

      case 'bestseller': {
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { isBestSeller: true },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্যকে বেস্টসেলার হিসেবে চিহ্নিত করা হয়েছে।`;
        break;
      }

      case 'unbestseller': {
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { isBestSeller: false },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্য থেকে বেস্টসেলার ট্যাগ অপসারণ করা হয়েছে।`;
        break;
      }

      case 'stock_add': {
        const delta = parseInt(value, 10);
        if (isNaN(delta)) {
          return NextResponse.json({ error: 'সঠিক স্টক পরিমাণ দিন।' }, { status: 400 });
        }
        // Increment stock
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { stockQuantity: { increment: delta } },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্যের স্টক ${delta > 0 ? '+' : ''}${delta} পরিবর্তন করা হয়েছে।`;
        break;
      }

      case 'stock_set': {
        const exact = Math.max(0, parseInt(value, 10));
        if (isNaN(exact)) {
          return NextResponse.json({ error: 'সঠিক স্টক পরিমাণ দিন।' }, { status: 400 });
        }
        const res = await prisma.book.updateMany({
          where: { id: { in: productIds } },
          data: { stockQuantity: exact },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্যের স্টক সরাসরি ${exact} নির্ধারণ করা হয়েছে।`;
        break;
      }

      case 'delete': {
        // Safe delete: delete related variants & bookmarks, then delete books
        await prisma.productVariant.deleteMany({
          where: { bookId: { in: productIds } },
        });
        await prisma.bookmark.deleteMany({
          where: { bookId: { in: productIds } },
        });
        const res = await prisma.book.deleteMany({
          where: { id: { in: productIds } },
        });
        updatedCount = res.count;
        message = `${updatedCount}টি পণ্য সফলভাবে ডাটাবেস থেকে মুছে ফেলা হয়েছে।`;
        break;
      }

      default:
        return NextResponse.json({ error: 'অজ্ঞাত বাল্ক অ্যাকশন।' }, { status: 400 });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BATCH_UPDATE_PRODUCTS',
        entity: 'Book',
        details: JSON.stringify({
          action,
          affectedCount: updatedCount,
          productIds,
          updatedBy: user.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Batch product action error:', error);
    return NextResponse.json(
      { error: error.message || 'বাল্ক অপারেশন সম্পন্ন করতে ত্রুটি হয়েছে।' },
      { status: 500 }
    );
  }
}

