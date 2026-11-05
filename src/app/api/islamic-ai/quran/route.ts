import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const surahNumber = searchParams.get('surah') ? parseInt(searchParams.get('surah')!) : null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (surahNumber) {
      where.surahNumber = surahNumber;
    }

    if (q) {
      where.OR = [
        { surahNameBn: { contains: q } },
        { surahNameEn: { contains: q } },
        { textAr: { contains: q } },
        {
          translations: {
            some: {
              translation: { contains: q },
            },
          },
        },
        {
          tafsirEntries: {
            some: {
              content: { contains: q },
            },
          },
        },
      ];
    }

    const [total, verses] = await Promise.all([
      prisma.quranVerse.count({ where }),
      prisma.quranVerse.findMany({
        where,
        include: {
          translations: true,
          tafsirEntries: true,
        },
        orderBy: [{ surahNumber: 'asc' }, { ayahNumber: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    // Available Surahs list for quick selector
    const surahSummaries = await prisma.quranVerse.findMany({
      distinct: ['surahNumber'],
      select: {
        surahNumber: true,
        surahNameAr: true,
        surahNameEn: true,
        surahNameBn: true,
      },
      orderBy: { surahNumber: 'asc' },
    });

    return NextResponse.json({
      verses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      surahs: surahSummaries,
    });
  } catch (error: any) {
    console.error('Quran Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

