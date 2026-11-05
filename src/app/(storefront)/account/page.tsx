import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import { BookOpen, Clock, ShoppingCart, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatBengaliDate, formatTaka, toBengaliNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountOverviewPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const [readingProgress, orders, entitlements, activeSub] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId: user.id },
      include: { book: { include: { author: true } } },
      orderBy: { lastReadAt: 'desc' },
      take: 3,
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { book: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.digitalEntitlement.count({
      where: { userId: user.id },
    }),
    prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-8 font-bengali">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <BookOpen className="w-5 h-5 text-shubban-gold mb-2" />
          <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(readingProgress.length)}
          </span>
          <span className="text-xs text-stone-500 block mt-0.5">চলমান পাঠ</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <Award className="w-5 h-5 text-shubban-gold mb-2" />
          <span className="text-sm font-bold text-stone-900 dark:text-stone-100 block">
            {user.membershipTier}
          </span>
          <span className="text-xs text-stone-500 block mt-0.5">মেম্বারশিপ স্ট্যাটাস</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <ShoppingCart className="w-5 h-5 text-shubban-gold mb-2" />
          <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(orders.length)}
          </span>
          <span className="text-xs text-stone-500 block mt-0.5">মোট অর্ডার</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <Clock className="w-5 h-5 text-shubban-gold mb-2" />
          <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(entitlements)}
          </span>
          <span className="text-xs text-stone-500 block mt-0.5">ডিজিটাল লাইসেন্স</span>
        </div>
      </div>

      {/* Continue Reading Section */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-shubban-gold" />
            <span>যেখান থেকে পড়া ছেড়েছিলেন (Continue Reading)</span>
          </h2>
          <Link href="/account/reading-history" className="text-xs text-shubban-gold hover:underline">
            সকল ইতিহাস &rarr;
          </Link>
        </div>

        {readingProgress.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-400">
            <p>এখনও কোনো বই পড়া শুরু করেননি।</p>
            <Link href="/digital-library" className="mt-2 inline-block font-bold text-shubban-gold underline">
              ডিজিটাল লাইব্রেরী থেকে পড়া শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {readingProgress.map((prog) => (
              <div
                key={prog.id}
                className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative aspect-[3/4] w-12 rounded overflow-hidden shadow flex-shrink-0">
                    <img src={prog.book.coverImage} alt={prog.book.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                      {prog.book.title}
                    </h3>
                    <span className="text-[11px] text-stone-500">{prog.book.author.name}</span>
                    <span className="block text-[11px] text-shubban-gold font-mono mt-0.5">
                      পৃষ্ঠা {toBengaliNumber(prog.currentPage)} / {toBengaliNumber(prog.totalPages)} ({toBengaliNumber(Math.round(prog.percentage))}%)
                    </span>
                  </div>
                </div>

                <Link
                  href={`/read/${prog.book.slug}`}
                  className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5 text-shubban-gold" />
                  <span>পড়া চালিয়ে যান</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-shubban-gold" />
            <span>সাম্প্রতিক অর্ডার ও চালান</span>
          </h2>
          <Link href="/account/orders" className="text-xs text-shubban-gold hover:underline">
            সকল অর্ডার &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">এখনও কোনো অর্ডার সম্পন্ন করা হয়নি।</p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
            {orders.map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100 block">
                    #{ord.orderNumber}
                  </span>
                  <span className="text-stone-400 text-[11px]">{formatBengaliDate(ord.createdAt)}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    {formatTaka(ord.total)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">
                    {ord.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
