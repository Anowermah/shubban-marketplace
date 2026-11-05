import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import { Library, BookOpen, Download, ShieldCheck } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PersonalLibraryPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  // Fetch all books the user has entitlement to, plus all free books if they are registered
  const entitlements = await prisma.digitalEntitlement.findMany({
    where: { userId: user.id },
    include: {
      book: {
        include: { author: true, category: true },
      },
    },
  });

  // Also include books if user has subscription
  let subscriptionBooks: any[] = [];
  if (['DIGITAL', 'PREMIUM', 'INSTITUTIONAL'].includes(user.membershipTier)) {
    subscriptionBooks = await prisma.book.findMany({
      where: { isDigitalAvailable: true },
      include: { author: true, category: true },
      take: 12,
    });
  }

  // Combine and deduplicate
  const allBooksMap = new Map();
  entitlements.forEach((e) => {
    if (e.book) allBooksMap.set(e.book.id, { ...e.book, accessType: 'একক মালিকানা' });
  });
  subscriptionBooks.forEach((b) => {
    if (!allBooksMap.has(b.id)) {
      allBooksMap.set(b.id, { ...b, accessType: 'মেম্বারশিপ সুবিধা' });
    }
  });

  const libraryBooks = Array.from(allBooksMap.values());

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Library className="w-6 h-6 text-shubban-gold" />
            <span>আমার ব্যক্তিগত লাইব্রেরী</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            আপনার ক্রয়কৃত এবং মেম্বারশিপের আওতাধীন সমস্ত ডিজিটাল বই ও প্রকাশনার সরাসরি অ্যাক্সেস।
          </p>
        </div>
        <span className="text-xs font-bold text-shubban-gold">
          {toBengaliNumber(libraryBooks.length)}টি সংরক্ষিত বই
        </span>
      </div>

      {libraryBooks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-shubban-darkCard rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 space-y-4">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h2 className="font-serif text-lg font-bold">লাইব্রেরী এখনও খালি</h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            ডিজিটাল বই সংগ্রহ করুন অথবা মেম্বারশিপ নিয়ে শত শত প্রিমিয়াম বই আপনার লাইব্রেরীতে যুক্ত করুন।
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/digital-library"
              className="px-5 py-2.5 rounded-xl bg-shubban-green text-shubban-ivory font-bold text-xs"
            >
              ডিজিটাল লাইব্রেরী দেখুন
            </Link>
            <Link
              href="/membership"
              className="px-5 py-2.5 rounded-xl bg-shubban-gold text-shubban-green-950 font-bold text-xs"
            >
              মেম্বারশিপ প্ল্যান
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {libraryBooks.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-shubban-darkCard rounded-xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex gap-4">
                <div className="relative aspect-[3/4] w-20 rounded-lg overflow-hidden shadow flex-shrink-0 bg-stone-100">
                  <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    {b.accessType}
                  </span>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mt-1 line-clamp-1">
                    {b.title}
                  </h3>
                  <span className="text-xs text-stone-500 block">{b.author.name}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                <Link
                  href={`/read/${b.slug}`}
                  className="flex-1 py-2 rounded-lg bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5 text-shubban-gold" />
                  <span>এখনই পড়ুন</span>
                </Link>
                {b.fullPdfUrl && (
                  <a
                    href={b.fullPdfUrl}
                    download
                    className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                    title="ডাউনলোড"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
