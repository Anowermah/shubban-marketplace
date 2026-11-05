import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Newspaper,
  User,
} from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export const metadata = {
  title: 'মাসিক সাময়িকী ও প্রকাশনা আর্কাইভ — শুব্বান ডিজিটাল লাইব্রেরি',
  description:
    'শুব্বান সাহিত্য ও দর্শন সাময়িকী, নবচেতনা এবং সমকালীন চিন্তাশীল ইসলামী গবেষণা সাময়িকীর সমৃদ্ধ ডিজিটাল আর্কাইভ। ঘরে বসেই পড়ুন ও সংগ্রহ করুন।',
};

interface MagazinePageProps {
  searchParams: {
    magazine?: string;
    search?: string;
    year?: string;
    category?: string;
    page?: string;
  };
}

export default async function MagazinePage({ searchParams }: MagazinePageProps) {
  const { magazine, search, year, category, page = '1' } = searchParams;
  const currentPage = parseInt(page) || 1;
  const pageSize = 12;

  // Filter conditions
  const where: any = {
    status: 'PUBLISHED',
  };

  if (magazine) {
    where.magazine = { slug: magazine };
  }
  if (category) {
    where.magazine = { ...where.magazine, categoryId: category };
  }
  if (year) {
    const yr = parseInt(year);
    if (!isNaN(yr)) {
      where.publicationDate = {
        gte: new Date(`${yr}-01-01`),
        lte: new Date(`${yr}-12-31`),
      };
    }
  }
  if (search) {
    where.OR = [
      { issueTitle: { contains: search } },
      { summary: { contains: search } },
      { volume: { contains: search } },
      { issueNumber: { contains: search } },
      { toc: { contains: search } },
    ];
  }

  // Fetch data
  const [
    latestHeroIssue,
    totalCount,
    issues,
    magazinesList,
    categoriesList,
    featuredArticles,
  ] = await Promise.all([
    // Latest Hero Issue
    prisma.publicationIssue.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { publicationDate: 'desc' },
      include: {
        magazine: { include: { category: true } },
      },
    }),
    // Total count for pagination
    prisma.publicationIssue.count({ where }),
    // Paginated issues
    prisma.publicationIssue.findMany({
      where,
      include: {
        magazine: { include: { category: true } },
        _count: { select: { articles: true, readingSessions: true } },
      },
      orderBy: { publicationDate: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    // Magazines for tab filtering
    prisma.magazine.findMany({
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { title: 'asc' },
    }),
    // Categories
    prisma.category.findMany({
      where: { isActive: true },
      take: 10,
    }),
    // Featured articles for sidebar/section
    prisma.article.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      take: 4,
      include: { author: true, category: true },
      orderBy: { publishedAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Available publication years
  const availableYears = [2026, 2025, 2024, 2023];

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20">
      {/* 1. Hero Showcase of Latest Monthly Issue */}
      {latestHeroIssue && (
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-950/20 via-stone-900 to-stone-950 text-white border-b border-stone-800 pt-10 pb-16 sm:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(#c59b27_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
              {/* Cover Card with 3D Luxury Lighting */}
              <div className="w-56 sm:w-64 md:w-72 lg:w-80 flex-shrink-0 group perspective">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-amber-500/30 group-hover:border-amber-400 transition-all duration-300 group-hover:-translate-y-2">
                  <Image
                    src={latestHeroIssue.coverImage}
                    alt={latestHeroIssue.issueTitle}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-600/90 text-white text-[11px] font-bold shadow-md uppercase tracking-wider backdrop-blur-sm">
                    সর্বশেষ সংখ্যা
                  </div>
                </div>
              </div>

              {/* Issue Details & Action CTAs */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{latestHeroIssue.magazine.title}</span>
                  {latestHeroIssue.volume && <span>• {latestHeroIssue.volume}</span>}
                  {latestHeroIssue.issueNumber && <span>• {latestHeroIssue.issueNumber}</span>}
                </div>

                <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-stone-100 tracking-tight leading-snug mb-4">
                  {latestHeroIssue.issueTitle}
                </h1>

                <p className="text-sm sm:text-base text-stone-300/90 leading-relaxed max-w-2xl mb-6">
                  {latestHeroIssue.summary ||
                    latestHeroIssue.magazine.description ||
                    'মননশীল সাহিত্য, দর্শন, সমাজ ও ইসলামী চিন্তা-গবেষণার প্রামাণ্য মাসিক প্রকাশনা।'}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-stone-400 mb-8">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    {formatBengaliDate(latestHeroIssue.publicationDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    {toBengaliNumber(latestHeroIssue.pageCount || 48)} পৃষ্ঠা
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-500" />
                    {toBengaliNumber(latestHeroIssue.views)} পাঠক
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                  <Link
                    href={`/magazine/read/${latestHeroIssue.id}`}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold text-sm shadow-xl shadow-amber-900/40 flex items-center gap-2 transition hover:scale-[1.02]"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>অনলাইনে পড়ুন (Direct PDF)</span>
                  </Link>

                  <Link
                    href={`/magazine/${latestHeroIssue.magazine.slug}`}
                    className="px-5 py-3 rounded-2xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-semibold text-sm border border-stone-700 flex items-center gap-2 transition"
                  >
                    <span>সূচিপত্র ও প্রবন্ধসমূহ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {latestHeroIssue.allowDownload && (
                    <a
                      href={`/api/publications/${latestHeroIssue.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
                      title="PDF ডাউনলোড করুন"
                    >
                      <Download className="w-5 h-5 text-amber-400" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Filter & Navigation Toolbar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xl">
          <form method="GET" action="/magazine" className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="সাময়িকী, প্রবন্ধ বা বিষয়বস্তু খুঁজুন..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Magazine Series Filter */}
            <select
              name="magazine"
              defaultValue={magazine || ''}
              className="py-2.5 px-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">সকল সাময়িকী</option>
              {magazinesList.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.title} ({toBengaliNumber(m._count.issues)})
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              name="year"
              defaultValue={year || ''}
              className="py-2.5 px-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">সকল বছর</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {toBengaliNumber(yr)} সাল
                </option>
              ))}
            </select>

            {/* Submit Button */}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>ফিল্টার করুন</span>
            </button>
          </form>
        </div>
      </section>

      {/* 3. Main Publication Issues Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
              সাময়িকী সংখ্যা আর্কাইভ
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              মোট {toBengaliNumber(totalCount)}টি ডিজিটাল সংখ্যা উপলব্ধ রয়েছে
            </p>
          </div>

          <Link
            href="/articles"
            className="text-xs sm:text-sm font-semibold text-amber-600 hover:text-amber-500 flex items-center gap-1"
          >
            <span>সকল প্রবন্ধ দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {issues.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8">
            <Newspaper className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200 mb-1">
              কোনো সংখ্যা পাওয়া যায়নি
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              আপনার অনুসন্ধান অনুযায়ী কোনো প্রকাশনা পাওয়া যায়নি। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
            </p>
            <Link
              href="/magazine"
              className="inline-flex px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              সকল সাময়িকী দেখুন
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {issues.map((iss) => (
              <div
                key={iss.id}
                className="group flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Issue Cover */}
                <Link
                  href={`/magazine/read/${iss.id}`}
                  className="relative aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-800"
                >
                  <Image
                    src={iss.coverImage}
                    alt={iss.issueTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-bold shadow-lg flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> পড়ুন
                    </span>
                  </div>
                </Link>

                {/* Details */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block truncate">
                      {iss.magazine.title}
                    </span>
                    <Link
                      href={`/magazine/read/${iss.id}`}
                      className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 line-clamp-2 mt-1 hover:text-amber-600 dark:hover:text-amber-400 transition"
                      title={iss.issueTitle}
                    >
                      {iss.issueTitle}
                    </Link>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 truncate">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {formatBengaliDate(iss.publicationDate)}
                    </span>
                    <Link
                      href={`/magazine/read/${iss.id}`}
                      className="text-amber-600 hover:text-amber-500 font-bold"
                      title="অনলাইনে পড়ুন"
                    >
                      পড়ুন →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unified Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={pageSize}
              itemName="টি সংখ্যা"
              pageUrlTemplate="/magazine?page=[page]"
            />
          </div>
        )}
      </section>

      {/* 4. Featured Articles Section */}
      {featuredArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
                নির্বাচিত গবেষণা ও প্রবন্ধ
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                মাসিক সাময়িকী ও গবেষকদের শ্রেষ্ঠ মননশীল রচনা
              </p>
            </div>
            <Link
              href="/articles"
              className="text-xs sm:text-sm font-semibold text-amber-600 hover:text-amber-500 flex items-center gap-1"
            >
              <span>সকল প্রবন্ধ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-2">
                    {art.category.name}
                  </span>
                  <Link
                    href={`/articles/${art.slug}`}
                    className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 hover:text-amber-600 transition line-clamp-2 mb-2"
                  >
                    {art.title}
                  </Link>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed mb-4">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1 truncate font-medium">
                    <User className="w-3 h-3 text-stone-400" />
                    {art.author.name}
                  </span>
                  <Link
                    href={`/articles/${art.slug}`}
                    className="text-amber-600 hover:underline font-bold text-xs"
                  >
                    পড়ুন
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

