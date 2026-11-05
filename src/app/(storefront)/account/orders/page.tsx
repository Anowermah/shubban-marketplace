import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import { ShoppingCart } from 'lucide-react';
import MemberOrdersClient, { MemberOrder } from '@/components/account/MemberOrdersClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'আমার সমস্ত অর্ডার ও চালান | শুব্বান লাইব্রেরী',
  description: 'আপনার অর্ডার, চালান ও কুরিয়ার ট্র্যাকিং বিবরণী।',
};

export default async function MemberOrdersPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: { book: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted: MemberOrder[] = orders.map((ord) => ({
    id: ord.id,
    orderNumber: ord.orderNumber,
    total: ord.total,
    subtotal: ord.subtotal,
    shippingFee: ord.shippingFee,
    orderStatus: ord.orderStatus,
    paymentStatus: ord.paymentStatus,
    paymentMethod: ord.paymentMethod,
    shippingName: ord.shippingName,
    shippingPhone: ord.shippingPhone,
    shippingAddress: ord.shippingAddress,
    trackingNumber: ord.trackingNumber,
    courierName: ord.courierName,
    createdAt: ord.createdAt,
    items: ord.items.map((it) => ({
      id: it.id,
      title: it.book?.title || 'পণ্য',
      quantity: it.quantity,
      totalPrice: it.totalPrice,
      type: it.type,
    })),
  }));

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-shubban-gold" />
          <span>আমার সমস্ত অর্ডার ও চালান</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          আপনার ক্রয়কৃত মুদ্রিত বই ও ডিজিটাল সামগ্রীর চালান, কুরিয়ার ডেলিভারি স্ট্যাটাস ও অর্ডার ব্যবস্থাপনা।
        </p>
      </div>

      <MemberOrdersClient initialOrders={formatted} />
    </div>
  );
}
