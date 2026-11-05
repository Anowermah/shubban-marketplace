import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    // Strictly fetch reviews of books belonging to this vendor
    const reviews = await prisma.review.findMany({
      where: {
        book: {
          vendorId: vendorAuth.vendor.id,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 5.0;

    return NextResponse.json({
      success: true,
      count: reviews.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error: any) {
    console.error('Fetch seller reviews error:', error);
    return NextResponse.json({ error: 'গ্রাহক রিভিউ লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
