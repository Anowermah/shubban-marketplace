import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminRefundsClient, { AdminRefundItem } from '@/components/admin/AdminRefundsClient';
import { RotateCcw } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export const revalidate = 0;

export default async function AdminRefundsPage() {
  const refunds = await prisma.refund.findMany({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          orderStatus: true,
          shippingName: true,
          shippingPhone: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted: AdminRefundItem[] = refunds.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    order: {
      id: r.order.id,
      orderNumber: r.order.orderNumber,
      total: r.order.total,
      paymentStatus: r.order.paymentStatus,
      orderStatus: r.order.orderStatus,
      shippingName: r.order.shippingName,
      shippingPhone: r.order.shippingPhone,
    },
    amount: r.amount,
    reason: r.reason,
    status: r.status,
    refundTxnId: r.refundTxnId || `RFD-${r.id.slice(-6)}`,
    adminNote: r.adminNote,
    processedAt: r.processedAt,
    createdAt: r.createdAt,
  }));

  return (
    <div className="space-y-6 font-bengali">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-shubban-gold" />
            <span>রিফান্ড ও রিটার্ন ব্যবস্থাপনা (Refunds & Returns)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            অর্ডার বাতিল, রিটার্ন ও ক্যাশব্যাক অনুরোধ নিষ্পত্তি এবং আর্থিক অডিট ট্রেইল।
          </p>
        </div>
      </div>

      <AdminRefundsClient initialRefunds={formatted} />
    </div>
  );
}
