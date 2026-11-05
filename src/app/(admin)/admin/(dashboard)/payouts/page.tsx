import React from 'react';
import { prisma } from '@/lib/prisma';
import { Banknote, CheckCircle2, ArrowUpRight, Store } from 'lucide-react';
import { toBengaliNumber, formatTaka, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export const revalidate = 0;

interface AdminPayoutsPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function AdminPayoutsPage({ searchParams }: AdminPayoutsPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 15;

  const [totalLedgers, ledgers, payouts, totalPayoutsAgg] = await Promise.all([
    prisma.sellerLedgerEntry.count(),
    prisma.sellerLedgerEntry.findMany({
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { name: true } },
      },
    }),
    prisma.sellerPayout.findMany({
      take: 10,
      orderBy: { requestedAt: 'desc' },
      include: {
        vendor: { select: { name: true } },
      },
    }),
    prisma.sellerPayout.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
  ]);

  const totalPages = Math.ceil(totalLedgers / pageSize);

  return (
    <div className="space-y-6 font-bengali">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-shubban-gold" />
            <span>বিক্রেতা পে-আউট ও সেটেলমেন্ট লেজার (Seller Payouts)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট পরিশোধিত সেটেলমেন্ট: {formatTaka(totalPayoutsAgg._sum.amount || 0)}।
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
            বিক্রেতাদের সাম্প্রতিক ক্রেডিট/ডেবিট লেজার
          </h3>
          <span className="text-xs text-stone-400">সর্বমোট {toBengaliNumber(totalLedgers)}টি এন্ট্রি</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">বিক্রেতা</th>
                <th className="p-3.5">ধরণ (Type)</th>
                <th className="p-3.5">পরিমাণ (টাকা)</th>
                <th className="p-3.5">অবশিষ্ট ব্যালেন্স</th>
                <th className="p-3.5">বিবরণ</th>
                <th className="p-3.5 text-right">তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {ledgers.map((l) => (
                <tr key={l.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                  <td className="p-3.5 font-bold text-stone-900 dark:text-stone-100">
                    {l.vendor.name}
                  </td>
                  <td className="p-3.5 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${l.type === 'CREDIT'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                    >
                      {l.type === 'CREDIT' ? 'ক্রেডিট (বিক্রয়)' : 'ডেবিট'}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                    {formatTaka(l.amount)}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-shubban-green dark:text-shubban-gold">
                    {formatTaka(l.balanceAfter)}
                  </td>
                  <td className="p-3.5 text-stone-500 max-w-xs truncate">
                    {l.description}
                  </td>
                  <td className="p-3.5 text-right text-stone-400">
                    {formatBengaliDate(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalLedgers}
        itemsPerPage={pageSize}
        itemName="লেজার এন্ট্রি"
        pageUrlTemplate="/admin/payouts?page=[page]"
      />
    </div>
  );
}
