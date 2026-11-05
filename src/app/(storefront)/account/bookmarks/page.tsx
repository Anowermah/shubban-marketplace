import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import { Bookmark, BookOpen } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BookmarksPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: {
      book: true,
      article: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-shubban-gold" />
          <span>বুকমার্ক ও সংরক্ষিত উদ্ধৃতি</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          পড়ার সময় আপনার সংরক্ষিত গুরুত্বপূর্ণ পৃষ্ঠা ও ব্যক্তিগত নোটস।
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-xs text-stone-400">
          কোনো বুকমার্ক সংরক্ষিত নেই। পড়ার সময় বুকমার্ক আইকনে ক্লিক করে সংরক্ষণ করতে পারেন।
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="p-5 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-base text-stone-900 dark:text-stone-100 block">
                  {bm.book?.title || bm.article?.title}
                </span>
                {bm.page && (
                  <span className="text-xs font-mono font-bold text-shubban-gold mt-0.5 block">
                    পৃষ্ঠা: {toBengaliNumber(bm.page)}
                  </span>
                )}
                {bm.note && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 italic">
                    “{bm.note}”
                  </p>
                )}
              </div>

              {bm.book && (
                <Link
                  href={`/read/${bm.book.slug}`}
                  className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow"
                >
                  পৃষ্ঠায় যান
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
