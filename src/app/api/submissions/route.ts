import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { type, title, category, description, fileUrl } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'শিরোনাম ও বিবরণ আবশ্যক।' }, { status: 400 });
    }

    const session = await getSessionUser();
    let userId = session?.id;

    if (!userId) {
      const guest = await prisma.user.upsert({
        where: { email: 'author_submission@shubban.com' },
        update: {},
        create: {
          email: 'author_submission@shubban.com',
          name: 'লেখক ও গবেষক',
          passwordHash: 'guest_author_hash',
          role: 'AUTHOR',
          membershipTier: 'FREE',
        },
      });
      userId = guest.id;
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        type: type || 'ARTICLE',
        title,
        category: category || 'সাহিত্য',
        description,
        fileUrl: fileUrl || null,
        status: 'SUBMITTED', // SUBMITTED -> UNDER_REVIEW -> APPROVED -> PUBLISHED
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'পাণ্ডুলিপি দাখিল করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

