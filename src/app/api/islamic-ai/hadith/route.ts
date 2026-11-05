import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const collectionSlug = searchParams.get('collection')?.trim() || '';
    const authenticity = searchParams.get('authenticity')?.trim()?.toUpperCase() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (collectionSlug) {
      where.collection = {
        slug: collectionSlug,
      };
    }

    if (authenticity) {
      where.authenticity = authenticity;
    }

    if (q) {
      where.OR = [
        { textBn: { contains: q } },
        { textAr: { contains: q } },
        { narrator: { contains: q } },
        { chapterNameBn: { contains: q } },
        { topicTag: { contains: q } },
      ];
    }

    const [total, hadiths, collections] = await Promise.all([
      prisma.hadithEntry.count({ where }),
      prisma.hadithEntry.findMany({
        where,
        include: {
          collection: true,
        },
        orderBy: [{ collectionId: 'asc' }, { hadithNumber: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.hadithCollection.findMany({
        orderBy: { slug: 'asc' },
      }),
    ]);

    return NextResponse.json({
      hadiths,
      collections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Hadith Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

