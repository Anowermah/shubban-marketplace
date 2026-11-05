import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { BookOpen, Calendar, Clock, User, ArrowLeft, Search, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export const metadata = {
  title: 'ইসলামিক জার্নাল ও গবেষণা সাময়িকী — শুব্বান লাইব্রেরি',
  description: 'কুরআন, সুন্নাহ, ইসলামী ফিকহ ও ইতিহাসের প্রামাণ্য গবেষণা প্রবন্ধ এবং ইসলামিক জার্নাল প্রকাশনা।',
};

interface JournalsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
  };
}

export default async function IslamicJournalsPage({ searchParams }: JournalsPageProps) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const pageSize = 12;

  const where: any = {
    status: 'PUBLISHED',
    OR: [
      { type: 'RESEARCH_PAPER' },
      { type: 'ISLAMIC_ARTICLE' },
      { type: 'QURAN_HADITH_RESEARCH' },
      { type: 'ISLAMIC_HISTORY' },
    ],
  };

  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search } },
          { subtitle: { contains: search } },
          { excerpt: { contains: search } },
          { tags: { contains: search } },
        ],
      },
    ];
  }

  const [totalCount, papers] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      include: {
        author: true,
        category: true,
        issue: {
          include: { magazine: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20">
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 text-white border-b border-stone-800 pt-10 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link
            href="/magazine"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> সাময়িকী আর্কাইভে ফিরে যান
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>প্রামাণ্য ইসলামিক অ্যাকাডেমিক জার্নাল</span>
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-100 tracking-tight mb-2">
            ইসলামিক জার্নাল ও গবেষণা প্রকাশনা
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            কুরআন-সুন্নাহ, উসূলুল ফিকহ, ইসলামী অর্থনীতি ও মুসলিম সভ্যতার ইতিহাস বিষয়ে আন্তর্জাতিক মানসম্পন্ন প্রামাণ্য গবেষণা।
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Search Bar */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 shadow-xl mb-8">
          <form method="GET" action="/islamic-journals" className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="গবেষণা প্রবন্ধ, মূল বিষয় বা গবেষকের নাম খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </form>
        </div>

        {papers.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <FileText className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200 mb-1">
              কোনো জার্নাল প্রবন্ধ পাওয়া যায়নি
            </h3>
            <p className="text-xs text-stone-500 mb-4">অনুসন্ধানের শব্দ পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
            <Link
              href="/islamic-journals"
              className="inline-flex px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              সকল জার্নাল দেখুন
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <article
                key={paper.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-600 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                      {paper.category.name}
                    </span>
                    {paper.issue && (
                      <span className="text-stone-500">
                        • {paper.issue.magazine.title} ({paper.issue.issueTitle})
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/islamic-journals/${paper.slug}`}
                    className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 hover:text-amber-600 transition block mb-2"
                  >
                    {paper.title}
                  </Link>

                  {paper.subtitle && (
                    <p className="text-xs text-stone-500 italic mb-2">{paper.subtitle}</p>
                  )}

                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2 mb-4">
                    {paper.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                    <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {paper.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {formatBengaliDate(paper.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {toBengaliNumber(paper.readingTime)} মিনিট পাঠ
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 flex-shrink-0">
                  <Link
                    href={`/islamic-journals/${paper.slug}`}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>গবেষণা পড়ুন</span>
                  </Link>
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
              itemName="টি গবেষণা"
              pageUrlTemplate="/islamic-journals?page=[page]"
            />
          </div>
        )}
      </main>
    </div>
  );
}

