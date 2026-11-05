import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import { Star, ShieldCheck, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'আমার রিভিউ ও মতামত | শুব্বান লাইব্রেরী',
  description: 'আপনার দেওয়া বই ও প্রকাশনা সম্পর্কিত রিভিউ ও রেটিং।',
};

export default async function AccountReviewsPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: {
      book: {
        include: {
          author: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <span>আমার মতামত ও রিভিউ ({toBengaliNumber(reviews.length)})</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          আপনার কেনা ও পড়া বই সম্পর্কে আপনার মতামত অন্যান্য পাঠকদের জন্য সহায়ক।
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-xs text-stone-400 space-y-3">
          <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-serif font-bold text-base text-stone-700 dark:text-stone-300">
            আপনি এখনও কোনো রিভিউ প্রদান করেননি
          </h3>
          <p className="max-w-sm mx-auto text-stone-500">
            বই পড়ার পর আপনার মূল্যবান অভিজ্ঞতা ও রেটিং প্রকাশ করুন।
          </p>
          <div className="pt-2">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4 text-shubban-gold" />
              <span>আমার অর্ডারকৃত বই দেখুন</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-16 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                    <Image
                      src={rev.book.coverImage || '/placeholder.jpg'}
                      alt={rev.book.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/books/${rev.book.slug}`}
                      className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-shubban-gold transition-colors line-clamp-1"
                    >
                      {rev.book.title}
                    </Link>
                    <span className="text-xs text-stone-500 block">
                      লেখক: {rev.book.author?.name || 'অজ্ঞাত'}
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      {formatBengaliDate(rev.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  {rev.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      ভেরিফাইড ক্রেতা
                    </span>
                  )}
                </div>
              </div>

              {rev.comment ? (
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                  “{rev.comment}”
                </p>
              ) : (
                <p className="text-xs text-stone-400 italic">কোনো মন্তব্য যোগ করা হয়নি (শুধুমাত্র রেটিং)।</p>
              )}

              <div className="flex justify-end pt-1">
                <Link
                  href={`/books/${rev.book.slug}`}
                  className="text-xs font-semibold text-shubban-gold hover:underline inline-flex items-center gap-1"
                >
                  <span>বইটির পাতায় রিভিউ দেখুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

