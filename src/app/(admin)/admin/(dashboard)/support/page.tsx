import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminSupportClient from '@/components/admin/AdminSupportClient';
import { LifeBuoy } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default async function AdminSupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      responses: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-shubban-gold" />
          <span>সাপোর্ট টিকিট ও কাস্টমার কেয়ার ডেস্ক</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          গ্রাহক ও পাঠকদের অভিযোগ, জিজ্ঞাসা ও অর্ডার সম্পর্কিত সমস্যার দ্রুত সমাধান প্রদান করুন। মোট {toBengaliNumber(tickets.length)}টি টিকিট সংরক্ষিত।
        </p>
      </div>

      <AdminSupportClient
        initialTickets={tickets.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          responses: t.responses.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          })),
        }))}
      />
    </div>
  );
}

