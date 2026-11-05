import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'উত্তরের বিবরণ প্রদান করুন।' }, { status: 400 });
    }

    const session = await getSessionUser();
    let userId = session?.id;

    if (!userId) {
      const guest = await prisma.user.upsert({
        where: { email: 'guest_answerer@shubban.com' },
        update: {},
        create: {
          email: 'guest_answerer@shubban.com',
          name: 'জ্ঞানান্বেষী পাঠক',
          passwordHash: 'guest_hash',
          role: 'GUEST',
          membershipTier: 'FREE',
        },
      });
      userId = guest.id;
    }

    const answer = await prisma.answer.create({
      data: {
        questionId,
        userId,
        content: content.trim(),
      },
      include: {
        user: { select: { name: true, avatarUrl: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error('Answer post error:', error);
    return NextResponse.json({ error: 'উত্তর সংরক্ষণে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
