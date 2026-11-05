import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '15', 10), 50);

    const products = await prisma.book.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query } },
              { titleEn: { contains: query } },
              { slug: { contains: query } },
              { author: { name: { contains: query } } },
            ],
          }
        : undefined,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        titleEn: true,
        slug: true,
        coverImage: true,
        price: true,
        discountPrice: true,
        stockQuantity: true,
        author: { select: { name: true } },
        category: { select: { name: true } },
        _count: {
          select: {
            variants: true,
            attributeAssignments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error('Admin Products Search GET error:', error);
    return NextResponse.json({ error: error.message || 'পণ্য সার্চ করতে ব্যর্থ।' }, { status: 500 });
  }
}

