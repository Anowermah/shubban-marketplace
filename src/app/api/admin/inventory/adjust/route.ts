import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { adjustInventory } from '@/lib/inventory/service';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      bookId,
      variantId,
      quantityChange,
      changeType = 'MANUAL_ADJUSTMENT',
      reason = 'ইনভেন্টরি অডিট সমন্বয়',
    } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'বইয়ের আইডি আবশ্যক।' }, { status: 400 });
    }

    const qtyNumber = parseInt(quantityChange, 10);
    if (isNaN(qtyNumber) || qtyNumber === 0) {
      return NextResponse.json({ error: 'সঠিক পরিবর্তন পরিমাণ দিন (পজিটিভ বা নেগেটিভ সংখ্যা)।' }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { variants: true },
    });

    if (!book) {
      return NextResponse.json({ error: 'বইটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // Check underflow
    if (book.stockQuantity + qtyNumber < 0) {
      return NextResponse.json(
        { error: `স্টক শূন্যের নিচে নামানো সম্ভব নয়। বর্তমান স্টক: ${book.stockQuantity}` },
        { status: 400 }
      );
    }

    const { updatedBook, log } = await adjustInventory(
      bookId,
      variantId,
      qtyNumber,
      changeType,
      reason
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVENTORY_ADJUSTMENT',
        entity: 'Book',
        entityId: bookId,
        details: JSON.stringify({
          bookTitle: book.title,
          quantityChange: qtyNumber,
          changeType,
          newBalance: updatedBook.stockQuantity,
          reason,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `স্টক সফলভাবে সমন্বয় করা হয়েছে। নতুন ব্যালেন্স: ${updatedBook.stockQuantity}`,
      stockQuantity: updatedBook.stockQuantity,
      log,
    });
  } catch (error: any) {
    console.error('Inventory adjust error:', error);
    return NextResponse.json(
      { error: error.message || 'ইনভেন্টরি আপডেট করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

