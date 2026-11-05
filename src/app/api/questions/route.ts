import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { title, content, categoryId } = await req.json();

    if (!title || !content || !categoryId) {
      return NextResponse.json({ error: 'আবশ্যক তথ্যসমূহ প্রদান করুন।' }, { status: 400 });
    }

    const session = await getSessionUser();
    let userId = session?.id;

    if (!userId) {
      const guest = await prisma.user.upsert({
        where: { email: 'guest_asker@shubban.com' },
        update: {},
        create: {
          email: 'guest_asker@shubban.com',
          name: 'পাঠক জিজ্ঞাসা',
          passwordHash: 'guest_hash',
          role: 'GUEST',
          membershipTier: 'FREE',
        },
      });
      userId = guest.id;
    }

    // Slug generation
    const slug = `${title
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .slice(0, 50)}-${Date.now()}`;

    const question = await prisma.question.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        userId,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Question post error:', error);
    return NextResponse.json({ error: 'প্রশ্ন প্রকাশে ত্রুটি হয়েছে।' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const questions = await prisma.question.findMany({
      include: {
        category: true,
        user: { select: { name: true } },
        answers: true,
        votes: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ success: true, questions });
  } catch (error) {
    return NextResponse.json({ error: 'প্রশ্ন লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}
