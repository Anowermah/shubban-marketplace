import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'মন্তব্যের বিবরণ দিন।' }, { status: 400 });
    }

    const session = await getSessionUser();
    let userId = session?.id;

    if (!userId) {
      // Find default reader or create guest
      const guest = await prisma.user.upsert({
        where: { email: 'guest_commenter@shubban.com' },
        update: {},
        create: {
          email: 'guest_commenter@shubban.com',
          name: 'সম্মানিত পাঠক',
          passwordHash: 'guest_hash',
          role: 'GUEST',
          membershipTier: 'FREE',
        },
      });
      userId = guest.id;
    }

    const comment = await prisma.comment.create({
      data: {
        articleId,
        userId,
        content: content.trim(),
        isApproved: true,
      },
      include: {
        user: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json({ error: 'মন্তব্য সংরক্ষণে ত্রুটি।' }, { status: 500 });
  }
}
