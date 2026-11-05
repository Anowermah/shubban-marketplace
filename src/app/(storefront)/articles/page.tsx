import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { FileText, Clock, User, ArrowRight, Eye, Calendar } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface ArticlesPageProps {
  searchParams: {
    category?: string;
    type?: string;
    page?: string;
  };
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const { category, type, page } = searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const pageSize = 9;

  const where: any = {
    status: 'PUBLISHED',
  };

  if (category) {
    where.category = { slug: category };
  }

  if (type) {
    where.type = type;
  }

  const [totalArticles, articles, categories] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      include: {
        author: true,
        category: true,
        _count: { select: { comments: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.findMany(),
  ]);

  const totalPages = Math.ceil(totalArticles / pageSize);

  const pageParams = new URLSearchParams();
  if (category) pageParams.set('category', category);
  if (type) pageParams.set('type', type);
  pageParams.set('page', '[page]');
  const pageUrlTemplate = `/articles?${pageParams.toString()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Page Header */}
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
          <FileText className="w-4 h-4" />
          <span>মননশীল প্রবন্ধ ও সাহিত্যতত্ত্ব</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          প্রবন্ধ ও নিবন্ধ সংকলন
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          সাহিত্য সমালোচনা, দর্শনচিন্তা, ইতিহাস গবেষণা ও সমকালীন মননের ওপর দেশবরেণ্য পণ্ডিত ও চিন্তাবিদদের গবেষণাধর্মী লেখালেখি।
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <Link
          href="/articles"
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
            !category && !type
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          সকল প্রবন্ধ ({articles.length})
        </Link>
        <Link
          href="/articles?type=ESSAY"
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
            type === 'ESSAY'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          প্রবন্ধ ও মনন
        </Link>
        <Link
          href="/articles?type=EDITORIAL"
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
            type === 'EDITORIAL'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          সম্পাদকীয় ও দর্শন
        </Link>
        <Link
          href="/articles?type=REVIEW"
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
            type === 'REVIEW'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          বই ও সাহিত্য পর্যালোচনা
        </Link>
      </div>

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((art) => (
          <article
            key={art.id}
            className="group bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            {art.coverImage && (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                <img
                  src={art.coverImage}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-shubban-green text-shubban-gold text-[10px] font-bold px-2.5 py-1 rounded-md shadow">
                  {art.category.name}
                </span>
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatBengaliDate(art.publishedAt)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {toBengaliNumber(art.readingTime)} মিনিট পাঠ
                </span>
              </div>

              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 group-hover:text-shubban-green dark:group-hover:text-shubban-gold transition-colors mb-3 leading-snug">
                <Link href={`/articles/${art.slug}`}>{art.title}</Link>
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed mb-6">
                {art.excerpt}
              </p>

              <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-shubban-green text-shubban-gold text-[10px] font-bold flex items-center justify-center">
                    {art.author.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {art.author.name}
                  </span>
                </div>
                <Link
                  href={`/articles/${art.slug}`}
                  className="font-bold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
                >
                  <span>সম্পূর্ণ পড়ুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Unified Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalArticles}
        itemsPerPage={pageSize}
        itemName="প্রবন্ধ"
        pageUrlTemplate={pageUrlTemplate}
      />
    </div>
  );
}
