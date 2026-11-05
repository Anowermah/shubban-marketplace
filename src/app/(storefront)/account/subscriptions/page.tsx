import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import { Award, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { formatBengaliDate, formatTaka } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SubscriptionsPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-shubban-gold" />
            <span>সদস্যপদ ও সাবস্ক্রিপশন ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            আপনার বর্তমান মেম্বারশিপ স্ট্যাটাস, মেয়াদ এবং সাবস্ক্রিপশন ইতিহাস।
          </p>
        </div>
        <Link
          href="/membership"
          className="px-4 py-2 rounded-xl bg-shubban-gold text-shubban-green-950 font-bold text-xs shadow"
        >
          আপগ্রেড করুন
        </Link>
      </div>

      {/* Current Active Plan Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-shubban-green to-shubban-green-900 text-shubban-ivory shadow-lg border border-shubban-gold/40 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-[11px] font-bold text-shubban-gold uppercase">বর্তমান সক্রিয় মেম্বারশিপ</span>
          <h2 className="font-serif font-bold text-2xl text-white">
            {user.membershipTier === 'DIGITAL'
              ? 'ডিজিটাল সদস্য (Digital Member)'
              : user.membershipTier === 'PREMIUM'
              ? 'প্রিমিয়াম স্কলার (Premium Member)'
              : 'বিনামূল্যে মুক্ত সদস্য (Free Member)'}
          </h2>
          <p className="text-xs text-shubban-ivory/80 max-w-md leading-relaxed">
            ডিজিটাল লাইব্রেরী ও সাময়িকীর সমস্ত ক্যাটালগে আপনার নির্ধারিত অ্যাক্সেস সক্রিয় রয়েছে।
          </p>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-shubban-gold text-shubban-green-950">
            <CheckCircle2 className="w-4 h-4" />
            <span>সক্রিয় (Active)</span>
          </div>
          {user.membershipExpiry && (
            <span className="block text-xs text-shubban-ivory/70 mt-2">
              মেয়াদ উত্তীর্ণের তারিখ: {formatBengaliDate(user.membershipExpiry)}
            </span>
          )}
        </div>
      </div>

      {/* Subscription History Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800">
          সাবস্ক্রিপশন পেমেন্ট ইতিহাস
        </h3>

        {subscriptions.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">এখনও কোনো পেইড সাবস্ক্রিপশন লেনদেন নেই।</p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
            {subscriptions.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">{s.plan.name}</span>
                  <span className="text-stone-400 text-[11px]">মেয়াদ: {formatBengaliDate(s.endDate)} পর্যন্ত</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100 block">
                    {formatTaka(s.plan.priceMonthly)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
