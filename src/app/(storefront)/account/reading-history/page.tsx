import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import { Clock, BookOpen } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReadingHistoryPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const progress = await prisma.readingProgress.findMany({
    where: { userId: user.id },
    include: {
      book: { include: { author: true } },
    },
    orderBy: { lastReadAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Clock className="w-6 h-6 text-shubban-gold" />
          <span>পড়ার ইতিহাস ও চলমান পাঠ</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          আপনার ইন-ব্রাউজার পাঠের সমস্ত অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত রয়েছে।
        </p>
      </div>

      {progress.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-xs text-stone-400">
          এখনও কোনো বই পড়া শুরু করা হয়নি।
        </div>
      ) : (
        <div className="space-y-4">
          {progress.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative aspect-[3/4] w-14 rounded-lg overflow-hidden shadow flex-shrink-0 bg-stone-100">
                  <img src={p.book.coverImage} alt={p.book.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {p.book.title}
                  </h3>
                  <span className="text-xs text-stone-500 block">{p.book.author.name}</span>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="font-mono text-shubban-gold font-bold">
                      পৃষ্ঠা {toBengaliNumber(p.currentPage)} / {toBengaliNumber(p.totalPages)}
                    </span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500 font-mono">
                      {toBengaliNumber(Math.round(p.percentage))}% সম্পন্ন
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-stone-400 hidden sm:block">
                  সর্বশেষ পঠিত: {formatBengaliDate(p.lastReadAt)}
                </span>
                <Link
                  href={`/read/${p.book.slug}`}
                  className="px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4 text-shubban-gold" />
                  <span>পড়া চালিয়ে যান</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
