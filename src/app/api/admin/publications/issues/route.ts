import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createMagazineIssue } from '@/lib/cms';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const magazineId = searchParams.get('magazineId');
    const search = searchParams.get('search');

    const where: any = {};
    if (magazineId) where.magazineId = magazineId;
    if (search) {
      where.OR = [
        { issueTitle: { contains: search } },
        { summary: { contains: search } },
        { volume: { contains: search } },
      ];
    }

    const issues = await prisma.publicationIssue.findMany({
      where,
      include: {
        magazine: true,
      },
      orderBy: { publicationDate: 'desc' },
    });

    return NextResponse.json({ success: true, issues });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json(
        { error: 'সাময়িকী সংখ্যা প্রকাশের জন্য উপযুক্ত অনুমোদন আবশ্যক।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const issue = await createMagazineIssue(body, session.id);

    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

