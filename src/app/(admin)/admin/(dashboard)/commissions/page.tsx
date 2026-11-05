import React from 'react';
import { prisma } from '@/lib/prisma';
import { Percent, Store, TrendingUp } from 'lucide-react';
import { toBengaliNumber, formatTaka } from '@/lib/utils';

export const revalidate = 0;

export default async function AdminCommissionsPage() {
  const [rules, vendors, totalCommissionAgg] = await Promise.all([
    prisma.commissionRule.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vendor.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, name: true, commissionRate: true, city: true },
    }),
    prisma.subOrder.aggregate({
      _sum: { commissionAmt: true },
    }),
  ]);

  return (
    <div className="space-y-6 font-bengali">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Percent className="w-6 h-6 text-shubban-gold" />
            <span>মার্কেটপ্লেস কমিশন ও রাজস্ব নীতি (Commission Rules)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট সংগৃহীত মার্কেটপ্লেস কমিশন: {formatTaka(totalCommissionAgg._sum.commissionAmt || 0)}।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Commission Rules */}
        <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <TrendingUp className="w-4 h-4 text-shubban-gold" />
            <span>ক্যাটাগরিভিত্তিক ডিফল্ট কমিশন রেট</span>
          </h3>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    {rule.name}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {rule.description || rule.categorySlug || 'সার্বিক প্ল্যাটফর্ম নীতি'}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold text-sm">
                  {toBengaliNumber(rule.percentage)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendors Specific Commission */}
        <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <Store className="w-4 h-4 text-shubban-gold" />
            <span>অনুমোদিত বিক্রেতাদের সক্রিয় কমিশন রেট</span>
          </h3>
          <div className="space-y-3">
            {vendors.map((ven) => (
              <div
                key={ven.id}
                className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    {ven.name}
                  </span>
                  <span className="text-[11px] text-stone-400">{ven.city || 'ঢাকা'}</span>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs border border-amber-300/40">
                  {toBengaliNumber(ven.commissionRate || 10)}% কমিশন
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
