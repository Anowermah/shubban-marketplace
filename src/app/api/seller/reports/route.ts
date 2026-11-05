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

    const vendorId = vendorAuth.vendor.id;

    const [subOrders, ledgerEntries, topProducts] = await Promise.all([
      prisma.subOrder.findMany({
        where: { vendorId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sellerLedgerEntry.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.subOrderItem.groupBy({
        by: ['bookId', 'title'],
        where: {
          subOrder: { vendorId },
        },
        _sum: {
          quantity: true,
          total: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const grossSales = subOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalCommission = subOrders.reduce((sum, o) => sum + o.commissionAmt, 0);
    const netEarnings = subOrders.reduce((sum, o) => sum + o.payoutAmt, 0);

    const statusCounts = subOrders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      summary: {
        totalOrders: subOrders.length,
        grossSales,
        totalCommission,
        netEarnings,
        averageOrderValue: subOrders.length > 0 ? Math.round(grossSales / subOrders.length) : 0,
        statusCounts,
      },
      topProducts: topProducts.map((p) => ({
        bookId: p.bookId,
        title: p.title,
        totalSold: p._sum.quantity || 0,
        totalRevenue: p._sum.total || 0,
      })),
      recentLedger: ledgerEntries,
      vendor: {
        id: vendorAuth.vendor.id,
        name: vendorAuth.vendor.name,
        commissionRate: vendorAuth.vendor.commissionRate ?? 10,
      },
    });
  } catch (error: any) {
    console.error('Fetch seller reports error:', error);
    return NextResponse.json({ error: 'বিক্রি রিপোর্ট লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

