import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminSellersClient from '@/components/admin/AdminSellersClient';
import { Store } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export const metadata = {
  title: 'মার্কেটপ্লেস বিক্রেতা ব্যবস্থাপনা — অ্যাডমিন প্যানেল',
};

export default async function AdminSellersPage() {
  const vendors = await prisma.vendor.findMany({
    include: {
      books: { select: { id: true } },
      subOrders: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Store className="w-6 h-6 text-shubban-gold" />
          <span>মার্কেটপ্লেস বিক্রেতা ও স্টোর ব্যবস্থাপনা</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          মোট {toBengaliNumber(vendors.length)}টি নিবন্ধিত বিক্রেতা স্টোর তালিকাভুক্ত।
        </p>
      </div>

      <AdminSellersClient
        initialVendors={vendors.map((v) => ({
          id: v.id,
          name: v.name,
          slug: v.slug,
          email: v.email,
          phone: v.phone,
          city: v.city,
          rating: v.rating,
          commissionRate: v.commissionRate,
          status: v.status,
          booksCount: v.books.length,
          subOrdersCount: v.subOrders.length,
        }))}
      />
    </div>
  );
}

