import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminOrdersClient, { AdminOrder } from '@/components/admin/AdminOrdersClient';
import { ShoppingCart } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          book: { select: { id: true, title: true } },
        },
      },
      subOrders: {
        include: {
          vendor: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedOrders: AdminOrder[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.shippingName || o.user?.name || 'সম্মানিত গ্রাহক',
    phone: o.shippingPhone,
    address: o.shippingAddress,
    city: o.shippingCity,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    discount: o.discount,
    total: o.total,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    paymentMethod: o.paymentMethod,
    trackingNumber: o.trackingNumber,
    createdAt: o.createdAt,
    items: o.items.map((item) => ({
      id: item.id,
      bookTitle: item.book?.title || 'পণ্য',
      quantity: item.quantity,
      price: item.unitPrice,
      format: item.type,
    })),
    subOrders: o.subOrders.map((so) => ({
      id: so.id,
      subOrderNumber: so.subOrderNumber,
      vendorName: so.vendor?.name || 'সেলার',
      payoutAmt: so.payoutAmt,
      commissionAmt: so.commissionAmt,
      status: so.status,
      courierName: so.courierName,
      trackingNumber: so.trackingNumber,
    })),
  }));

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-shubban-gold" />
          <span>অর্ডার ও শিপিং ডেলিভারি ব্যবস্থাপনা</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          মোট {toBengaliNumber(orders.length)}টি গ্রাহক অর্ডার তালিকাভুক্ত। ডেলিভারি স্ট্যাটাস পরিবর্তন, ট্র্যাকিং কোড সংযোজন ও মাল্টি-ভেন্ডর অর্ডার ট্র্যাকিং করুন।
        </p>
      </div>

      <AdminOrdersClient initialOrders={formattedOrders} />
    </div>
  );
}
