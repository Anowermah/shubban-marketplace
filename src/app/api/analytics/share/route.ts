import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { issueId, articleId, platform = 'COPY_LINK' } = body;

    if (!issueId && !articleId) {
      return NextResponse.json({ error: 'issueId অথবা articleId আবশ্যক' }, { status: 400 });
    }

    const sessionUser = await getSessionUser();

    const share = await prisma.publicationShare.create({
      data: {
        issueId: issueId || null,
        articleId: articleId || null,
        userId: sessionUser?.id || null,
        platform: platform.toUpperCase(),
      },
    });

    return NextResponse.json({ success: true, shareId: share.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

