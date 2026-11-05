import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const body = await req.json();
    const { messageId, isHelpful, reportedError, comment } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'মেসেজ আইডি আবশ্যক' }, { status: 400 });
    }

    const feedback = await prisma.islamicAiFeedback.create({
      data: {
        messageId,
        userId: session?.id || null,
        isHelpful: !!isHelpful,
        reportedError: !!reportedError,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

