import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q) {
      return NextResponse.json({
        books: [],
        authors: [],
        publishers: [],
        categories: [],
        articles: [],
      });
    }

    const [books, authors, publishers, categories, articles] = await Promise.all([
      prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { titleEn: { contains: q } },
            { description: { contains: q } },
            { synopsis: { contains: q } },
            { isbn: { contains: q } },
            { author: { name: { contains: q } } },
            { author: { nameEn: { contains: q } } },
            { publisher: { name: { contains: q } } },
            { publisher: { nameEn: { contains: q } } },
            { category: { name: { contains: q } } },
          ],
        },
        select: {
          id: true,
          title: true,
          titleEn: true,
          slug: true,
          price: true,
          discountPrice: true,
          coverImage: true,
          author: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          vendor: { select: { name: true, slug: true } },
        },
        take: 6,
      }),
      prisma.author.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { nameEn: { contains: q } },
            { bio: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          photoUrl: true,
          _count: { select: { books: true } },
        },
        take: 4,
      }),
      prisma.publisher.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { nameEn: { contains: q } },
            { description: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          logoUrl: true,
          _count: { select: { books: true } },
        },
        take: 4,
      }),
      prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { nameEn: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { books: true } },
        },
        take: 4,
      }),
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
            { author: { name: { contains: q } } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          author: { select: { name: true } },
        },
        take: 3,
      }),
    ]);

    return NextResponse.json({
      books,
      authors,
      publishers,
      categories,
      articles,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      books: [],
      authors: [],
      publishers: [],
      categories: [],
      articles: [],
    });
  }
}
