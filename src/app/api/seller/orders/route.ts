import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // STRICT ISOLATION: Query sub-orders belonging strictly to authenticated vendor
    const subOrders = await prisma.subOrder.findMany({
      where: {
        vendorId: vendorAuth.vendor.id,
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      include: {
        items: true,
        order: {
          select: {
            orderNumber: true,
            shippingName: true,
            shippingPhone: true,
            shippingAddress: true,
            shippingCity: true,
            paymentStatus: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const grossSales = subOrders.reduce((acc, o) => acc + o.subtotal, 0);
    const totalCommission = subOrders.reduce((acc, o) => acc + o.commissionAmt, 0);
    const netPayout = subOrders.reduce((acc, o) => acc + o.payoutAmt, 0);

    return NextResponse.json({
      success: true,
      count: subOrders.length,
      metrics: {
        grossSales,
        totalCommission,
        netPayout,
      },
      subOrders,
    });
  } catch (error: any) {
    console.error('Fetch seller orders error:', error);
    return NextResponse.json({ error: 'অর্ডার তালিকা লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

