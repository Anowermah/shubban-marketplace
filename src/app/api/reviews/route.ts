import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { bookId, rating, comment } = await req.json();

    if (!bookId || !rating) {
      return NextResponse.json({ error: 'বইয়ের আইডি এবং রেটিং আবশ্যক।' }, { status: 400 });
    }

    const session = await getSessionUser();
    let userId = session?.id;

    if (!userId) {
      const guest = await prisma.user.upsert({
        where: { email: 'guest_reviewer@shubban.com' },
        update: {},
        create: {
          email: 'guest_reviewer@shubban.com',
          name: 'সম্মানিত পাঠক',
          passwordHash: 'guest_hash',
          role: 'GUEST',
          membershipTier: 'FREE',
        },
      });
      userId = guest.id;
    }

    // Check if user purchased the book to set isVerified
    const purchase = await prisma.orderItem.findFirst({
      where: {
        bookId,
        order: { userId, paymentStatus: 'PAID' },
      },
    });

    const review = await prisma.review.create({
      data: {
        bookId,
        userId,
        rating: Math.max(1, Math.min(5, parseInt(rating, 10))),
        comment: comment?.trim() || null,
        isVerified: !!purchase,
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'রিভিউ প্রকাশ করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

