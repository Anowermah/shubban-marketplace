import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Newspaper, Calendar, BookOpen, ArrowRight, Layers } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export default async function MagazinesPage() {
  const [magazines, recentIssues] = await Promise.all([
    prisma.magazine.findMany({
      include: {
        category: true,
        issues: {
          orderBy: { publicationDate: 'desc' },
          take: 1,
        },
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.publicationIssue.findMany({
      include: {
        magazine: true,
      },
      orderBy: { publicationDate: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-12">
      {/* Page Title Banner */}
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
          <Newspaper className="w-4 h-4" />
          <span>ঐতিহাসিক ও সমকালীন সংগ্রহ</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          পত্রিকা ও সাময়িকী আর্কাইভ
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          সাপ্তাহিক পত্রিকা, মাসিক সাহিত্য ও দর্শন সাময়িকী, ত্রৈমাসিক গবেষণা জার্নাল এবং শতবর্ষের ঐতিহাসিক পত্রিকার সমৃদ্ধ ডিজিটাল সংগ্রহশালা।
        </p>
      </div>

      {/* 1. All Publication Brands / Series */}
      <div className="space-y-6">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
          প্রধান প্রকাশনা ও জার্নালসমূহ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {magazines.map((mag) => {
            const latest = mag.issues[0];
            return (
              <div
                key={mag.id}
                className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex gap-5">
                  <div className="relative aspect-[3/4] w-24 rounded-xl overflow-hidden shadow bg-stone-100 dark:bg-stone-800 flex-shrink-0">
                    <img src={mag.coverImage} alt={mag.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-shubban-gold uppercase">
                      {mag.frequency === 'WEEKLY' ? 'সাপ্তাহিক প্রকাশনা' : 'মাসিক সাহিত্য সাময়িকী'}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 mt-0.5 mb-2">
                      <Link href={`/magazines/${mag.slug}`}>{mag.title}</Link>
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {mag.description}
                    </p>
                    <span className="inline-block mt-3 text-xs font-semibold text-stone-500">
                      সংরক্ষিত সংখ্যা: {toBengaliNumber(mag._count.issues)}টি
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  {latest ? (
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      সর্বশেষ সংখ্যা: {formatBengaliDate(latest.publicationDate)}
                    </span>
                  ) : <span />}
                  <Link
                    href={`/magazines/${mag.slug}`}
                    className="text-xs font-bold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
                  >
                    <span>সকল সংখ্যা দেখুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Recent Issues Grid */}
      <div className="space-y-6">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
          সাম্প্রতিক প্রকাশিত সংখ্যাসমূহ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white dark:bg-shubban-darkCard rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                <img
                  src={issue.coverImage}
                  alt={issue.issueTitle}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-shubban-green text-shubban-gold text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  {issue.volume} {issue.issueNumber}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-xs font-semibold text-shubban-gold">{issue.magazine.title}</span>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mt-1 mb-2 line-clamp-1">
                  {issue.issueTitle}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-4">
                  {issue.summary}
                </p>

                <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    {formatBengaliDate(issue.publicationDate)}
                  </span>
                  <Link
                    href={`/magazines/${issue.magazine.slug}/issues/${issue.id}`}
                    className="text-xs font-bold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
                  >
                    <span>অনলাইনে পড়ুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
