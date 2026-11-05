import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { Feather, FileText, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export default async function AuthorDashboardPage() {
  const session = await getSessionUser();

  const submissions = session
    ? await prisma.submission.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const statusBadges: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'খসড়া', color: 'bg-stone-100 text-stone-600' },
    SUBMITTED: { label: 'দাখিলকৃত', color: 'bg-blue-100 text-blue-800' },
    UNDER_REVIEW: { label: 'পর্যালোচনাধীন', color: 'bg-amber-100 text-amber-800' },
    REVISION_REQUESTED: { label: 'সংশোধন প্রয়োজন', color: 'bg-orange-100 text-orange-800' },
    APPROVED: { label: 'অনুমোদিত', color: 'bg-emerald-100 text-emerald-800' },
    PUBLISHED: { label: 'প্রকাশিত', color: 'bg-emerald-600 text-white' },
    REJECTED: { label: 'অননুমোদিত', color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Feather className="w-6 h-6 text-shubban-gold" />
            <span>লেখক ও অবদানকারী ড্যাশবোর্ড</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            আপনার দাখিলকৃত রচনা, রিভিউ স্ট্যাটাস ও প্রকাশনা ট্র্যাকিং।
          </p>
        </div>

        <Link
          href="/submit"
          className="px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-shubban-gold" />
          <span>নতুন লেখা জমা দিন</span>
        </Link>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800">
          আমার দাখিলকৃত পাণ্ডুলিপিসমূহ ({toBengaliNumber(submissions.length)})
        </h2>

        {submissions.length === 0 ? (
          <div className="text-center py-12 text-xs text-stone-400 space-y-3">
            <p>আপনি এখনও কোনো পাণ্ডুলিপি জমা দেননি।</p>
            <Link href="/submit" className="inline-block text-shubban-gold font-bold underline">
              এখনই আপনার লেখা বা বই জমা দিন &rarr;
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
            {submissions.map((sub) => {
              const badge = statusBadges[sub.status] || {
                label: sub.status,
                color: 'bg-stone-100 text-stone-700',
              };
              return (
                <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] text-stone-400 uppercase">
                      {sub.type} • {sub.category}
                    </span>
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mt-0.5">
                      {sub.title}
                    </h3>
                    <span className="text-[11px] text-stone-400">
                      দাখিলের তারিখ: {formatBengaliDate(sub.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

