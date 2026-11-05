import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'অর্ডার নম্বর প্রদান করুন।' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: q.trim() },
          { shippingPhone: q.trim() },
        ],
      },
      include: {
        items: {
          include: { book: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'এই নম্বর দিয়ে কোনো অর্ডার পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি।' }, { status: 500 });
  }
}
