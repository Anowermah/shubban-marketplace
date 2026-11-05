import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminReportsClient, {
  MonthlySalesData,
  CategorySalesData,
  ProductSalesData,
  PaymentGatewayData,
} from '@/components/admin/AdminReportsClient';
import { BarChart3 } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default async function AdminReportsPage() {
  // 1. Fetch Orders with Items & SubOrders
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              categoryId: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
      subOrders: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalGross = orders.reduce((sum, o) => sum + o.total, 0);
  const totalShipping = orders.reduce((sum, o) => sum + o.shippingFee, 0);
  const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);

  // 2. Fetch SubOrders for Commission & Vendor Payouts
  const subOrders = await prisma.subOrder.findMany();
  const totalCommission = subOrders.reduce((sum, s) => sum + s.commissionAmt, 0);
  const totalPayout = subOrders.reduce((sum, s) => sum + s.payoutAmt, 0);

  // 3. Fetch Donations
  const donationAggregate = await prisma.donation.aggregate({
    _sum: { amount: true },
  });
  const totalDonations = donationAggregate._sum.amount || 0;

  // 4. Fetch Payment Transactions
  const transactions = await prisma.paymentTransaction.findMany();
  const onlineTxs = transactions.filter((t) => t.gateway !== 'COD' && t.status === 'SUCCESS');
  const onlinePaymentVolume = onlineTxs.reduce((sum, t) => sum + t.amount, 0);

  // 5. Monthly Sales Trend (Last 6 Months)
  const monthNames = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const currentYear = new Date().getFullYear();
  const monthlyMap = new Map<number, { revenue: number; orders: number }>();

  for (let m = 0; m < 12; m++) {
    monthlyMap.set(m, { revenue: 0, orders: 0 });
  }

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (d.getFullYear() === currentYear) {
      const monthIdx = d.getMonth();
      const current = monthlyMap.get(monthIdx) || { revenue: 0, orders: 0 };
      monthlyMap.set(monthIdx, {
        revenue: current.revenue + o.total,
        orders: current.orders + 1,
      });
    }
  });

  // Take the relevant months (e.g. up to current month)
  const currentMonthIdx = new Date().getMonth();
  const monthlySales: MonthlySalesData[] = [];
  const startIdx = Math.max(0, currentMonthIdx - 5);
  for (let i = startIdx; i <= currentMonthIdx; i++) {
    const val = monthlyMap.get(i) || { revenue: 0, orders: 0 };
    monthlySales.push({
      month: monthNames[i],
      revenue: val.revenue,
      orders: val.orders,
    });
  }

  // 6. Category Sales Breakdown
  const categoryMap = new Map<string, { id: string; name: string; itemsSold: number; totalRevenue: number }>();
  let totalCatalogItemRevenue = 0;

  orders.forEach((o) => {
    o.items.forEach((item) => {
      const cat = item.book?.category;
      const catId = cat?.id || 'other';
      const catName = cat?.name || 'অন্যান্য সাহিত্য';
      const itemRev = item.unitPrice * item.quantity;
      totalCatalogItemRevenue += itemRev;

      const existing = categoryMap.get(catId) || {
        id: catId,
        name: catName,
        itemsSold: 0,
        totalRevenue: 0,
      };
      categoryMap.set(catId, {
        id: catId,
        name: catName,
        itemsSold: existing.itemsSold + item.quantity,
        totalRevenue: existing.totalRevenue + itemRev,
      });
    });
  });

  const categorySales: CategorySalesData[] = Array.from(categoryMap.values()).map((c) => ({
    ...c,
    percentage:
      totalCatalogItemRevenue > 0
        ? Math.round((c.totalRevenue / totalCatalogItemRevenue) * 100)
        : 0,
  }));

  // 7. Top Selling Products
  const productMap = new Map<string, { id: string; title: string; coverImage?: string | null; unitsSold: number; revenue: number }>();

  orders.forEach((o) => {
    o.items.forEach((item) => {
      const book = item.book;
      if (!book) return;
      const existing = productMap.get(book.id) || {
        id: book.id,
        title: book.title,
        coverImage: book.coverImage,
        unitsSold: 0,
        revenue: 0,
      };
      productMap.set(book.id, {
        id: book.id,
        title: book.title,
        coverImage: book.coverImage,
        unitsSold: existing.unitsSold + item.quantity,
        revenue: existing.revenue + item.unitPrice * item.quantity,
      });
    });
  });

  const topProducts: ProductSalesData[] = Array.from(productMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  // 8. Payment Breakdown
  const gatewayGroups = new Map<string, { totalAmount: number; count: number; successCount: number }>();

  transactions.forEach((tx) => {
    const gw = tx.gateway.toUpperCase();
    const curr = gatewayGroups.get(gw) || { totalAmount: 0, count: 0, successCount: 0 };
    gatewayGroups.set(gw, {
      totalAmount: curr.totalAmount + tx.amount,
      count: curr.count + 1,
      successCount: curr.successCount + (tx.status === 'SUCCESS' ? 1 : 0),
    });
  });

  const paymentBreakdown: PaymentGatewayData[] = Array.from(gatewayGroups.entries()).map(
    ([gw, data]) => ({
      gateway: gw,
      count: data.count,
      totalAmount: data.totalAmount,
      successRate: data.count > 0 ? Math.round((data.successCount / data.count) * 100) : 100,
    })
  );

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-shubban-gold" />
          <span>আর্থিক ও বিক্রয় অ্যানালিটিক্স রিপোর্ট</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          রিয়েল-টাইম ডাটাবেজ তথ্য অনুসারে রাজস্ব, বিক্রেতা কমিশন, গেটওয়ে ভলিউম ও ক্যাটাগরি বিক্রয় পারফরম্যান্স।
        </p>
      </div>

      <AdminReportsClient
        summary={{
          totalGross,
          totalCommission,
          totalPayout,
          totalShipping,
          totalDiscount,
          orderCount: orders.length,
          totalDonations,
          onlinePaymentVolume,
        }}
        monthlySales={monthlySales}
        categorySales={categorySales}
        topProducts={topProducts}
        paymentBreakdown={paymentBreakdown}
      />
    </div>
  );
}
