import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { Building2, BookOpen, Newspaper, Plus, TrendingUp } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export default async function PublisherDashboardPage() {
  const session = await getSessionUser();

  const [books, magazines] = await Promise.all([
    prisma.book.findMany({
      take: 10,
      include: { author: true, category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.magazine.findMany({
      include: { issues: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-shubban-gold" />
            <span>প্রকাশক কনসোল ও ক্যাটালগ পোর্টাল</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            আপনার প্রকাশনা সংস্থার বই, সাময়িকী এবং ডিজিটাল সংস্করণ ব্যবস্থাপনা।
          </p>
        </div>

        <Link
          href="/submit"
          className="px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-shubban-gold" />
          <span>নতুন বই ক্যাটালগে যুক্ত করুন</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <BookOpen className="w-6 h-6 text-shubban-gold mb-2" />
          <span className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(books.length)}
          </span>
          <span className="text-xs text-stone-500 block mt-1">ক্যাটালগভুক্ত গ্রন্থাবলি</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <Newspaper className="w-6 h-6 text-shubban-gold mb-2" />
          <span className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(magazines.length)}
          </span>
          <span className="text-xs text-stone-500 block mt-1">নিয়মিত সাময়িকী ও জার্নাল</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <TrendingUp className="w-6 h-6 text-emerald-600 mb-2" />
          <span className="text-3xl font-bold font-mono text-emerald-600">
            ১০০%
          </span>
          <span className="text-xs text-stone-500 block mt-1">ডিজিটাল স্বত্বাধিকার নিশ্চিত</span>
        </div>
      </div>

      {/* Published Catalog Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800">
          প্রকাশনা ক্যাটালগ
        </h2>

        <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
          {books.map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  {b.title}
                </h3>
                <span className="text-stone-400 text-[11px]">
                  লেখক: {b.author.name} • বিভাগ: {b.category.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-shubban-green dark:text-shubban-gold font-mono">
                  স্টক: {toBengaliNumber(b.stockQuantity)}
                </span>
                <Link
                  href={`/books/${b.slug}`}
                  className="px-3 py-1 rounded bg-stone-100 dark:bg-stone-800 font-bold hover:bg-shubban-green hover:text-white transition-colors"
                >
                  পৃষ্ঠা দেখুন
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

