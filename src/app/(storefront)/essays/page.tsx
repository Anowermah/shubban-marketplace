import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { BookOpen, Calendar, Clock, User, ArrowLeft, Search } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export const metadata = {
  title: 'মননশীল সাহিত্য ও দর্শন প্রবন্ধসমূহ — শুব্বান লাইব্রেরি',
  description: 'মননশীল সাহিত্য, দর্শন, গভীর সমাজতাত্ত্বিক আলোচনা ও সমালোচনাধর্মী প্রবন্ধের সমৃদ্ধ সম্ভার।',
};

interface EssaysPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function EssaysPage({ searchParams }: EssaysPageProps) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const pageSize = 12;

  const where: any = {
    type: 'ESSAY',
    status: 'PUBLISHED',
  };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { subtitle: { contains: search } },
      { excerpt: { contains: search } },
    ];
  }

  const [totalCount, essays] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      include: {
        author: true,
        category: true,
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20">
      <header className="bg-stone-900 text-white border-b border-stone-800 pt-10 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> সকল প্রবন্ধে ফিরে যান
          </Link>
          <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-100 tracking-tight mb-2">
            মননশীল প্রবন্ধ ও সাহিত্যতত্ত্ব
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            চিন্তাশীল সাহিত্য, দর্শন, সমাজ ও ইতিহাসের নিবিড় পাঠ নিয়ে বরেণ্য প্রাবন্ধিকদের রচনার সংকলন।
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Search Bar */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 shadow-xl mb-8">
          <form method="GET" action="/essays" className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="প্রবন্ধ বা প্রাবন্ধিকের নাম খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </form>
        </div>

        {essays.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200 mb-1">
              কোনো প্রবন্ধ পাওয়া যায়নি
            </h3>
            <p className="text-xs text-stone-500 mb-4">অনুসন্ধানের শব্দ পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
            <Link
              href="/essays"
              className="inline-flex px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              সকল প্রবন্ধ দেখুন
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {essays.map((art) => (
              <article
                key={art.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {art.coverImage && (
                    <div className="relative aspect-[16/9] w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-2">
                      {art.category.name}
                    </span>

                    <Link
                      href={`/essays/${art.slug}`}
                      className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 hover:text-amber-600 transition line-clamp-2 mb-2 block"
                    >
                      {art.title}
                    </Link>

                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3 mb-4">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300 truncate">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    {art.author.name}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {toBengaliNumber(art.readingTime)} মিনিট
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={pageSize}
              itemName="টি প্রবন্ধ"
              pageUrlTemplate="/essays?page=[page]"
            />
          </div>
        )}
      </main>
    </div>
  );
}

