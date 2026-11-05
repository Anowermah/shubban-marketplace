import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    const where: any = {};
    if (q) {
      where.OR = [
        { topic: { contains: q } },
        { topicEn: { contains: q } },
        { madhhabViewHanafi: { contains: q } },
        { madhhabViewMaliki: { contains: q } },
        { madhhabViewShafii: { contains: q } },
        { madhhabViewHanbali: { contains: q } },
        { classicalSources: { contains: q } },
      ];
    }

    const topics = await prisma.scholarlyReference.findMany({
      where,
      orderBy: { topic: 'asc' },
    });

    return NextResponse.json({
      topics,
      total: topics.length,
    });
  } catch (error: any) {
    console.error('Islamic Research API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

