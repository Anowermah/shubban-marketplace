import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/books/BookCard';
import {
  Search,
  BookOpen,
  FileText,
  Newspaper,
  HelpCircle,
  GraduationCap,
  Users,
  Building2,
  Filter,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toBengaliNumber, formatTaka } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface SearchPageProps {
  searchParams: {
    q?: string;
    tab?: string;
    sort?: string;
    format?: string;
    min_price?: string;
    max_price?: string;
    page?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() || '';
  const tab = searchParams.tab || 'all';
  const sort = searchParams.sort || 'relevance';
  const format = searchParams.format;
  const minPrice = searchParams.min_price ? parseFloat(searchParams.min_price) : undefined;
  const maxPrice = searchParams.max_price ? parseFloat(searchParams.max_price) : undefined;

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-bengali space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold mx-auto flex items-center justify-center">
          <Search className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
          শুব্বান লাইব্রেরীতে অনুসন্ধান করুন
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          বইয়ের শিরোনাম, ইংরেজি নাম, লেখক, প্রকাশক, আইএসবিএন কিংবা যেকোনো বিষয় লিখে খুঁজুন।
        </p>

        {/* Popular Search Suggestions */}
        <div className="pt-6">
          <span className="text-xs font-semibold text-stone-400 block mb-2">জনপ্রিয় অনুসন্ধান:</span>
          <div className="flex flex-wrap justify-center gap-2">
            {['গীতাঞ্জলি', 'তাফসীর ইবনে কাসীর', 'সহীহ বুখারী', 'মদিনা রয়েল উদ', 'সীরাত', 'রবীন্দ্রনাথ ঠাকুর', 'ইসলামিক ফাউন্ডেশন'].map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs hover:bg-shubban-green hover:text-shubban-gold transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Construct Book search where clause supporting Bengali & English fields
  const bookWhere: any = {
    OR: [
      { title: { contains: query } },
      { titleEn: { contains: query } },
      { description: { contains: query } },
      { synopsis: { contains: query } },
      { isbn: { contains: query } },
      { author: { name: { contains: query } } },
      { author: { nameEn: { contains: query } } },
      { publisher: { name: { contains: query } } },
      { publisher: { nameEn: { contains: query } } },
      { category: { name: { contains: query } } },
      { category: { nameEn: { contains: query } } },
    ],
  };

  if (format === 'digital') {
    bookWhere.isDigitalAvailable = true;
  } else if (format === 'physical') {
    bookWhere.isPhysicalAvailable = true;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    bookWhere.price = {};
    if (minPrice !== undefined) bookWhere.price.gte = minPrice;
    if (maxPrice !== undefined) bookWhere.price.lte = maxPrice;
  }

  // Book sorting
  let bookOrderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') bookOrderBy = { price: 'asc' };
  else if (sort === 'price_desc') bookOrderBy = { price: 'desc' };
  else if (sort === 'bestseller') bookOrderBy = { isBestSeller: 'desc' };
  else if (sort === 'title') bookOrderBy = { title: 'asc' };

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 12;

  // Multi-entity search queries
  const [totalBooks, books, authors, publishers, articles, researchPapers, questions] = await Promise.all([
    prisma.book.count({ where: bookWhere }),
    prisma.book.findMany({
      where: bookWhere,
      orderBy: bookOrderBy,
      include: { author: true, category: true, publisher: true },
      skip: tab === 'books' ? (currentPage - 1) * pageSize : 0,
      take: tab === 'books' ? pageSize : 12,
    }),
    prisma.author.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { nameEn: { contains: query } },
          { bio: { contains: query } },
        ],
      },
      include: {
        books: { take: 2 },
        _count: { select: { books: true } },
      },
      take: 8,
    }),
    prisma.publisher.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { nameEn: { contains: query } },
          { description: { contains: query } },
        ],
      },
      include: {
        _count: { select: { books: true } },
      },
      take: 6,
    }),
    prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { excerpt: { contains: query } },
          { author: { name: { contains: query } } },
        ],
      },
      include: { author: true, category: true },
      take: 6,
    }),
    prisma.researchPaper.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { abstract: { contains: query } },
          { field: { contains: query } },
          { author: { name: { contains: query } } },
        ],
      },
      include: { author: true },
      take: 4,
    }),
    prisma.question.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      include: { category: true, answers: true },
      take: 4,
    }),
  ]);

  const totalResults =
    totalBooks + authors.length + publishers.length + articles.length + researchPapers.length + questions.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 font-bengali space-y-8">
      {/* Search Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-shubban-green/10 via-stone-50 to-shubban-green/10 dark:from-stone-900 dark:via-stone-900/60 dark:to-stone-900 border border-stone-200 dark:border-stone-800">
        <span className="text-xs font-semibold text-shubban-green dark:text-shubban-gold uppercase tracking-wider">
          অনুসন্ধানের ফলাফল
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          “{query}”-এর জন্য মোট {toBengaliNumber(totalResults)}টি ফলাফল পাওয়া গেছে
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          বাংলা ও ইংরেজি শব্দবিন্যাস মিলিয়ে স্বয়ংক্রিয়ভাবে প্রামাণ্য অনুসন্ধান ফলাফল প্রদর্শিত হচ্ছে।
        </p>
      </div>

      {/* Search Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold">
        <Link
          href={`/search?q=${encodeURIComponent(query)}&tab=all`}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            tab === 'all'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          সকল ফলাফল ({toBengaliNumber(totalResults)})
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(query)}&tab=books`}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            tab === 'books'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          বই ও পণ্যসম্ভার ({toBengaliNumber(totalBooks)})
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(query)}&tab=authors`}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            tab === 'authors'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          লেখকবৃন্দ ({toBengaliNumber(authors.length)})
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(query)}&tab=publishers`}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            tab === 'publishers'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          প্রকাশনী সংস্থা ({toBengaliNumber(publishers.length)})
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(query)}&tab=articles`}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            tab === 'articles'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          প্রবন্ধ ও সাময়িকী ({toBengaliNumber(articles.length)})
        </Link>
      </div>

      {totalResults === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-shubban-darkCard rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 p-8 space-y-3">
          <p className="text-base font-bold text-stone-700 dark:text-stone-300">
            দুঃখিত, “{query}” দিয়ে কোনো সঠিক তথ্য পাওয়া যায়নি।
          </p>
          <span className="text-xs text-stone-400 block max-w-sm mx-auto">
            বানান সঠিক কিনা যাচাই করুন অথবা অন্য কোনো প্রাসঙ্গিক কীওয়ার্ড বা লেখকের নাম দিয়ে অনুসন্ধান করুন।
          </span>
          <div className="pt-4">
            <Link
              href="/books"
              className="px-5 py-2.5 rounded-xl bg-shubban-green text-shubban-ivory text-xs font-bold shadow hover:bg-shubban-green-700 transition-colors inline-block"
            >
              সকল পণ্য ও বই ক্যাটালগ দেখুন
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* 1. Books & Products Section */}
          {(tab === 'all' || tab === 'books') && books.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-shubban-gold" />
                  বই ও পণ্যসম্ভার ({toBengaliNumber(totalBooks)})
                </h2>
                <Link
                  href={`/books?q=${encodeURIComponent(query)}`}
                  className="text-xs text-shubban-green dark:text-shubban-gold font-semibold hover:underline flex items-center gap-1"
                >
                  <span>ক্যাটালগে ফিল্টার করুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {books.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>

              {tab === 'books' && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalBooks / pageSize)}
                  totalItems={totalBooks}
                  itemsPerPage={pageSize}
                  itemName="বই"
                  pageUrlTemplate={`/search?${new URLSearchParams({
                    q: query,
                    tab: 'books',
                    ...(sort !== 'relevance' ? { sort } : {}),
                    ...(format ? { format } : {}),
                    page: '[page]',
                  }).toString()}`}
                />
              )}
            </div>
          )}

          {/* 2. Authors Section */}
          {(tab === 'all' || tab === 'authors') && authors.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
                <Users className="w-5 h-5 text-shubban-gold" />
                লেখক পরিচিতি ({toBengaliNumber(authors.length)})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {authors.map((auth) => (
                  <Link
                    key={auth.id}
                    href={`/authors/${auth.slug}`}
                    className="p-4 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-shubban-gold/50 shadow-sm flex items-center gap-3.5 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-shubban-gold/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={auth.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                        alt={auth.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors truncate">
                        {auth.name}
                      </h3>
                      <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{auth.bio}</p>
                      <span className="text-[10px] text-shubban-green dark:text-shubban-gold font-semibold block mt-1">
                        {toBengaliNumber(auth._count.books)}টি বই সংরক্ষিত
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 3. Publishers Section */}
          {(tab === 'all' || tab === 'publishers') && publishers.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
                <Building2 className="w-5 h-5 text-shubban-gold" />
                প্রকাশনী সংস্থা ({toBengaliNumber(publishers.length)})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishers.map((pub) => (
                  <Link
                    key={pub.id}
                    href={`/books?publisher=${pub.slug}`}
                    className="p-4 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-shubban-gold/50 shadow-sm flex items-start gap-3.5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center flex-shrink-0 border border-shubban-green/20">
                      {pub.logoUrl ? (
                        <img src={pub.logoUrl} alt={pub.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors truncate">
                        {pub.name}
                      </h3>
                      <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                        {pub.description || 'বাংলাদেশের ঐতিহ্যবাহী প্রকাশনী প্রতিষ্ঠান'}
                      </p>
                      <span className="text-[10px] text-shubban-green dark:text-shubban-gold font-semibold block mt-1">
                        {toBengaliNumber(pub._count.books)}টি প্রকাশিত বই
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 4. Articles Section */}
          {(tab === 'all' || tab === 'articles') && articles.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
                <FileText className="w-5 h-5 text-shubban-gold" />
                প্রবন্ধ ও নিবন্ধ ({toBengaliNumber(articles.length)})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles.map((art) => (
                  <article
                    key={art.id}
                    className="p-5 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col hover:border-shubban-gold/40 transition-all"
                  >
                    <span className="text-[11px] font-semibold text-shubban-gold">{art.category.name}</span>
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-shubban-green dark:hover:text-shubban-gold transition-colors mt-1 mb-2">
                      <Link href={`/articles/${art.slug}`}>{art.title}</Link>
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">{art.excerpt}</p>
                    <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <span className="text-stone-600 dark:text-stone-400">{art.author.name}</span>
                      <Link href={`/articles/${art.slug}`} className="text-shubban-green dark:text-shubban-gold font-semibold hover:underline">
                        পড়ুন &rarr;
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* 5. Research Papers Section */}
          {(tab === 'all' || tab === 'articles') && researchPapers.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
                <GraduationCap className="w-5 h-5 text-shubban-gold" />
                গবেষণাপত্র ({toBengaliNumber(researchPapers.length)})
              </h2>

              <div className="space-y-3">
                {researchPapers.map((rp) => (
                  <div
                    key={rp.id}
                    className="p-4 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm"
                  >
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-shubban-gold">
                      <Link href={`/research/${rp.slug}`}>{rp.title}</Link>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">{rp.abstract}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
