import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminSellerApplicationsClient from '@/components/admin/AdminSellerApplicationsClient';
import { Store } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export const metadata = {
  title: 'বিক্রেতা আবেদনসমূহ — অ্যাডমিন প্যানেল',
};

export default async function AdminSellerApplicationsPage() {
  const applications = await prisma.vendorApplication.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Store className="w-6 h-6 text-shubban-gold" />
          <span>বিক্রেতা অনবোর্ডিং ও শপ আবেদনসমূহ</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          মোট {toBengaliNumber(applications.length)}টি আবেদন জমা রয়েছে।
        </p>
      </div>

      <AdminSellerApplicationsClient
        initialApplications={applications.map((a) => ({
          id: a.id,
          shopName: a.shopName,
          ownerName: a.ownerName,
          email: a.email,
          phone: a.phone,
          businessAddress: a.businessAddress,
          city: a.city,
          businessType: a.businessType,
          tradeLicense: a.tradeLicense,
          status: a.status,
          createdAt: a.createdAt,
        }))}
      />
    </div>
  );
}

