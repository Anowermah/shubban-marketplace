import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const publisher = searchParams.get('publisher');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) {
      where.category = { slug: category };
    }
    if (author) {
      where.author = { slug: author };
    }
    if (publisher) {
      where.publisher = { slug: publisher };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleEn: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          titleEn: true,
          slug: true,
          price: true,
          discountPrice: true,
          stockQuantity: true,
          coverImage: true,
          isFree: true,
          isDigitalAvailable: true,
          isPhysicalAvailable: true,
          isFeatured: true,
          isNewArrival: true,
          isBestSeller: true,
          createdAt: true,
          author: { select: { id: true, name: true, slug: true } },
          publisher: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          vendor: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching public books:', error);
    return NextResponse.json({ error: 'বইয়ের তালিকা লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

