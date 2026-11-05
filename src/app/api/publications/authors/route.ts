import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { designation: { contains: search } },
      ];
    }

    const [authors, total] = await Promise.all([
      prisma.author.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              articles: true,
              books: true,
            },
          },
        },
      }),
      prisma.author.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      authors: authors.map((a) => ({
        ...a,
        articleCount: a._count?.articles || 0,
        bookCount: a._count?.books || 0,
        image: a.photoUrl,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching publication authors:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch authors' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, bio, image, designation, featured } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'লেখকের নাম আবশ্যক' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `author-${Date.now()}`;

    let author;
    if (id) {
      author = await prisma.author.update({
        where: { id },
        data: {
          name,
          bio: bio || null,
          photoUrl: image || null,
          designation: designation || null,
        },
      });
    } else {
      author = await prisma.author.create({
        data: {
          name,
          slug,
          bio: bio || null,
          photoUrl: image || null,
          designation: designation || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: id ? 'লেখক আপডেট হয়েছে' : 'নতুন লেখক যুক্ত হয়েছে',
      author: { ...author, image: author.photoUrl },
    });
  } catch (error: any) {
    console.error('Error saving author:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save author' },
      { status: 500 }
    );
  }
}
