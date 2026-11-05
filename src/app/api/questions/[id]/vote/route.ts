import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const { answerId, voteType } = await req.json();

    const session = await getSessionUser();
    let userId = session?.id;

    if (!userId) {
      const guest = await prisma.user.upsert({
        where: { email: 'guest_voter@shubban.com' },
        update: {},
        create: {
          email: 'guest_voter@shubban.com',
          name: 'পাঠক ভোটার',
          passwordHash: 'guest_hash',
          role: 'GUEST',
          membershipTier: 'FREE',
        },
      });
      userId = guest.id;
    }

    const type = voteType === -1 ? -1 : 1;

    // Check existing vote
    const existing = await prisma.vote.findFirst({
      where: {
        userId,
        questionId: answerId ? null : questionId,
        answerId: answerId || null,
      },
    });

    if (existing) {
      if (existing.voteType === type) {
        // Remove vote if clicked same
        await prisma.vote.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, vote: null, message: 'ভোট প্রত্যাহার করা হয়েছে।' });
      } else {
        // Update vote
        const updated = await prisma.vote.update({
          where: { id: existing.id },
          data: { voteType: type },
        });
        return NextResponse.json({ success: true, vote: updated, message: 'ভোট পরিবর্তিত হয়েছে।' });
      }
    }

    const vote = await prisma.vote.create({
      data: {
        userId,
        questionId: answerId ? null : questionId,
        answerId: answerId || null,
        voteType: type,
      },
    });

    return NextResponse.json({ success: true, vote, message: 'ভোট সফলভাবে গৃহীত হয়েছে!' });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'ভোট গ্রহণে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

