import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Newspaper, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface MagazineBrandPageProps {
  params: {
    slug: string;
  };
}

export default async function MagazineBrandPage({ params }: MagazineBrandPageProps) {
  const { slug } = params;

  const magazine = await prisma.magazine.findUnique({
    where: { slug },
    include: {
      publisher: true,
      category: true,
      issues: {
        orderBy: { publicationDate: 'desc' },
      },
    },
  });

  if (!magazine) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Magazine Hero */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative aspect-[3/4] w-28 sm:w-36 rounded-xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-700 flex-shrink-0 bg-stone-100">
          <img src={magazine.coverImage} alt={magazine.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <span className="text-xs font-bold text-shubban-gold uppercase">
            {magazine.frequency === 'WEEKLY' ? 'সাপ্তাহিক প্রকাশনা' : 'মাসিক সাহিত্য সাময়িকী'}
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1 mb-2">
            {magazine.title}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
            {magazine.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-stone-500">
            <span>বিভাগ: {magazine.category.name}</span>
            {magazine.publisher && <span>প্রকাশক: {magazine.publisher.name}</span>}
            <span>মোট সংরক্ষিত সংখ্যা: {toBengaliNumber(magazine.issues.length)}টি</span>
          </div>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="space-y-6">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800">
          সংরক্ষিত সংখ্যাসমূহের আর্কাইভ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {magazine.issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white dark:bg-shubban-darkCard rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                <img
                  src={issue.coverImage}
                  alt={issue.issueTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-shubban-green text-shubban-gold text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  {issue.volume} {issue.issueNumber}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-2 line-clamp-1">
                  {issue.issueTitle}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-4">
                  {issue.summary}
                </p>
                <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatBengaliDate(issue.publicationDate)}
                  </span>
                  <Link
                    href={`/magazines/${magazine.slug}/issues/${issue.id}`}
                    className="text-xs font-bold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
                  >
                    <span>সংখ্যাটি পড়ুন</span>
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
