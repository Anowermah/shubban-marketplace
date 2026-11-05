import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/books/BookCard';
import Pagination from '@/components/ui/Pagination';
import {
  Filter,
  SlidersHorizontal,
  Search,
  BookOpen,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Store,
  Users,
  Building2,
  Tag,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber, formatTaka } from '@/lib/utils';
import AdSlot from '@/components/ads/AdSlot';

export const revalidate = 60; // ISR

interface BooksPageProps {
  searchParams: {
    category?: string;
    author?: string;
    publisher?: string;
    vendor?: string;
    sort?: string;
    format?: string;
    free?: string;
    in_stock?: string;
    discount?: string;
    min_price?: string;
    max_price?: string;
    page?: string;
    q?: string;
  };
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const {
    category,
    author,
    publisher,
    vendor,
    sort,
    format,
    free,
    in_stock,
    discount,
    min_price,
    max_price,
    page = '1',
    q,
  } = searchParams;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 8;
  const skip = (currentPage - 1) * pageSize;

  // 1. Fetch all categories to build nested hierarchy
  const allCategories = await prisma.category.findMany({
    include: {
      _count: { select: { books: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Separate parent and child categories
  const parentCategories = allCategories.filter((c) => !c.parentId);
  const childCategoriesMap: Record<string, typeof allCategories> = {};

  allCategories.forEach((cat) => {
    if (cat.parentId) {
      if (!childCategoriesMap[cat.parentId]) {
        childCategoriesMap[cat.parentId] = [];
      }
      childCategoriesMap[cat.parentId].push(cat);
    }
  });

  // 2. Build Category Filtering Clause (Parent expands to include all children)
  const where: any = {};

  if (category) {
    const selectedCat = allCategories.find((c) => c.slug === category);
    if (selectedCat) {
      const childCategories = childCategoriesMap[selectedCat.id] || [];
      const relevantCategoryIds = [selectedCat.id, ...childCategories.map((c) => c.id)];
      where.categoryId = { in: relevantCategoryIds };
    } else {
      where.category = { slug: category };
    }
  }

  // 3. Author Filtering
  if (author) {
    where.author = { slug: author };
  }

  // 4. Publisher Filtering
  if (publisher) {
    where.publisher = { slug: publisher };
  }

  // 5. Vendor / Seller Filtering
  if (vendor) {
    where.vendor = { slug: vendor };
  }

  // 6. Keyword Search
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { titleEn: { contains: q } },
      { description: { contains: q } },
      { synopsis: { contains: q } },
      { isbn: { contains: q } },
      { author: { name: { contains: q } } },
      { publisher: { name: { contains: q } } },
    ];
  }

  // 7. Free / Digital / Physical format
  if (free === 'true') {
    where.isFree = true;
  }

  if (format === 'digital') {
    where.isDigitalAvailable = true;
  } else if (format === 'physical') {
    where.isPhysicalAvailable = true;
  }

  // 8. In-stock availability
  if (in_stock === 'true') {
    where.stockQuantity = { gt: 0 };
  }

  // 9. Discount Filtering
  if (discount === 'true') {
    where.discountPrice = { not: null };
  }

  // 10. Price range filtering
  const minP = min_price ? parseFloat(min_price) : undefined;
  const maxP = max_price ? parseFloat(max_price) : undefined;
  if (minP !== undefined || maxP !== undefined) {
    where.price = {};
    if (minP !== undefined) where.price.gte = minP;
    if (maxP !== undefined) where.price.lte = maxP;
  }

  // 11. Sorting logic
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'bestseller') {
    orderBy = { isBestSeller: 'desc' };
  } else if (sort === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (sort === 'price_desc') {
    orderBy = { price: 'desc' };
  } else if (sort === 'title_asc') {
    orderBy = { title: 'asc' };
  }

  // 12. Concurrently fetch products, total count, authors, publishers, vendors
  const [books, totalBooksCount, activeAuthors, activePublishers, activeVendors] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        titleEn: true,
        slug: true,
        price: true,
        discountPrice: true,
        stockQuantity: true,
        coverImage: true,
        isFree: true,
        isDigitalAvailable: true,
        isPhysicalAvailable: true,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true,
        author: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        publisher: { select: { id: true, name: true, slug: true } },
        vendor: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.book.count({ where }),
    prisma.author.findMany({
      where: { books: { some: {} } },
      select: { id: true, name: true, slug: true, _count: { select: { books: true } } },
      take: 8,
    }),
    prisma.publisher.findMany({
      where: { books: { some: {} } },
      select: { id: true, name: true, slug: true, _count: { select: { books: true } } },
      take: 6,
    }),
    prisma.vendor.findMany({
      where: { status: 'APPROVED', books: { some: {} } },
      select: { id: true, name: true, slug: true, _count: { select: { books: true } } },
      take: 5,
    }),
  ]);

  const totalPages = Math.ceil(totalBooksCount / pageSize);

  // Helper to build URL with query params
  const createFilterUrl = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const current = {
      category,
      author,
      publisher,
      vendor,
      sort,
      format,
      free,
      in_stock,
      discount,
      min_price,
      max_price,
      q,
      ...newParams,
    };

    Object.entries(current).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        params.set(k, v);
      }
    });

    return `/books?${params.toString()}`;
  };

  const hasActiveFilters = Boolean(
    category || author || publisher || vendor || format || free || in_stock || discount || min_price || max_price || q
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 font-bengali">
      {/* Header Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-shubban-green/10 via-stone-50 to-shubban-green/10 dark:from-stone-900 dark:via-stone-900/60 dark:to-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-shubban-gold uppercase tracking-wider">
            শুব্বান ডিজিটাল বুকস্টোর ও মার্কেটপ্লেস
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            সকল বই ও পণ্য ক্যাটালগ
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
            চিরায়ত সাহিত্য, ইসলামিক তাফসীর ও হাদিস, সুন্নাহ লাইফস্টাইল পণ্য এবং শিক্ষামূলক মননশীল প্রকাশনা সম্ভার।
          </p>
        </div>

        {/* Global Catalog Search Box */}
        <form action="/books" method="GET" className="w-full md:w-80">
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="ক্যাটালগে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold shadow-sm"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            {category && <input type="hidden" name="category" value={category} />}
            {author && <input type="hidden" name="author" value={author} />}
            {publisher && <input type="hidden" name="publisher" value={publisher} />}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-shubban-gold" />
                ফিল্টারসমূহ
              </span>
              {hasActiveFilters && (
                <Link
                  href="/books"
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>রিসেট করুন</span>
                </Link>
              )}
            </div>

            {/* 1. Nested Categories Tree */}
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-2.5">
                বিভাগ ও উপ-বিভাগ (Nested Categories)
              </h4>
              <div className="space-y-1 text-xs max-h-80 overflow-y-auto pr-1">
                <Link
                  href={createFilterUrl({ category: undefined, page: '1' })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                    !category
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>সকল বিভাগ</span>
                </Link>

                {parentCategories.map((pCat) => {
                  const children = childCategoriesMap[pCat.id] || [];
                  const isParentActive = category === pCat.slug;
                  const isAnyChildActive = children.some((c) => c.slug === category);

                  // Calculate aggregate parent count
                  const totalInTree = pCat._count.books + children.reduce((sum, c) => sum + c._count.books, 0);

                  return (
                    <div key={pCat.id} className="space-y-1">
                      <Link
                        href={createFilterUrl({ category: pCat.slug, page: '1' })}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                          isParentActive
                            ? 'bg-shubban-green text-shubban-gold font-bold'
                            : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="font-semibold">{pCat.name}</span>
                        <span className="text-[10px] text-stone-400">({toBengaliNumber(totalInTree)})</span>
                      </Link>

                      {/* Subcategories (Indented Tree) */}
                      {children.length > 0 && (
                        <div className="pl-4 space-y-1 border-l-2 border-stone-200 dark:border-stone-700/60 ml-2 my-1">
                          {children.map((cCat) => {
                            const isChildActive = category === cCat.slug;
                            return (
                              <Link
                                key={cCat.id}
                                href={createFilterUrl({ category: cCat.slug, page: '1' })}
                                className={`flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors ${
                                  isChildActive
                                    ? 'bg-shubban-gold/20 text-shubban-green dark:text-shubban-gold font-bold'
                                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                                }`}
                              >
                                <span>{cCat.name}</span>
                                <span className="text-[10px] text-stone-400">
                                  ({toBengaliNumber(cCat._count.books)})
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Availability & Format */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-2">
                উপলব্ধতা ও সংস্করণ
              </h4>
              <div className="space-y-1.5 text-xs">
                <Link
                  href={createFilterUrl({
                    in_stock: in_stock === 'true' ? undefined : 'true',
                    page: '1',
                  })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                    in_stock === 'true'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>ইন-স্টক পণ্য</span>
                  {in_stock === 'true' && <Check className="w-3.5 h-3.5" />}
                </Link>

                <Link
                  href={createFilterUrl({
                    discount: discount === 'true' ? undefined : 'true',
                    page: '1',
                  })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                    discount === 'true'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>বিশেষ ছাড়ে (Discounts)</span>
                  {discount === 'true' && <Check className="w-3.5 h-3.5" />}
                </Link>

                <Link
                  href={createFilterUrl({
                    format: format === 'physical' ? undefined : 'physical',
                    page: '1',
                  })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                    format === 'physical'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>মুদ্রিত কপি (ডেলিভারি)</span>
                  {format === 'physical' && <Check className="w-3.5 h-3.5" />}
                </Link>

                <Link
                  href={createFilterUrl({
                    format: format === 'digital' ? undefined : 'digital',
                    page: '1',
                  })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                    format === 'digital'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>ডিজিটাল ই-বুক</span>
                  {format === 'digital' && <Check className="w-3.5 h-3.5" />}
                </Link>

                <Link
                  href={createFilterUrl({
                    free: free === 'true' ? undefined : 'true',
                    page: '1',
                  })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                    free === 'true'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>ফ্রি ও উন্মুক্ত পাঠ (PDF)</span>
                  {free === 'true' && <Check className="w-3.5 h-3.5" />}
                </Link>
              </div>
            </div>

            {/* 3. Price Range Filter */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-2.5">
                মূল্য সীমা (Price Range)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <Link
                  href={createFilterUrl({ min_price: '0', max_price: '300', page: '1' })}
                  className="p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center hover:border-shubban-gold"
                >
                  ৳০ - ৳৩০০
                </Link>
                <Link
                  href={createFilterUrl({ min_price: '300', max_price: '700', page: '1' })}
                  className="p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center hover:border-shubban-gold"
                >
                  ৳৩০০ - ৳৭০০
                </Link>
                <Link
                  href={createFilterUrl({ min_price: '700', max_price: '1500', page: '1' })}
                  className="p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center hover:border-shubban-gold"
                >
                  ৳৭০০ - ৳১৫০০
                </Link>
                <Link
                  href={createFilterUrl({ min_price: '1500', max_price: undefined, page: '1' })}
                  className="p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center hover:border-shubban-gold"
                >
                  ৳১৫০০+
                </Link>
              </div>

              {/* Custom Min-Max Form */}
              <form action="/books" method="GET" className="flex items-center gap-2 text-xs">
                <input
                  type="number"
                  name="min_price"
                  placeholder="শুরু"
                  defaultValue={min_price || ''}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                />
                <span className="text-stone-400">-</span>
                <input
                  type="number"
                  name="max_price"
                  placeholder="শেষ"
                  defaultValue={max_price || ''}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                />
                {category && <input type="hidden" name="category" value={category} />}
                {author && <input type="hidden" name="author" value={author} />}
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold rounded-lg"
                >
                  প্রয়োগ
                </button>
              </form>
            </div>

            {/* 4. Author Filter */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-2">
                লেখক (Authors)
              </h4>
              <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
                {activeAuthors.map((auth) => {
                  const isActive = author === auth.slug;
                  return (
                    <Link
                      key={auth.id}
                      href={createFilterUrl({
                        author: isActive ? undefined : auth.slug,
                        page: '1',
                      })}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-shubban-green text-shubban-gold font-bold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="truncate">{auth.name}</span>
                      <span className="text-[10px] text-stone-400">({toBengaliNumber(auth._count.books)})</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 5. Publisher Filter */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-2">
                প্রকাশনী (Publishers)
              </h4>
              <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
                {activePublishers.map((pub) => {
                  const isActive = publisher === pub.slug;
                  return (
                    <Link
                      key={pub.id}
                      href={createFilterUrl({
                        publisher: isActive ? undefined : pub.slug,
                        page: '1',
                      })}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-shubban-green text-shubban-gold font-bold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="truncate">{pub.name}</span>
                      <span className="text-[10px] text-stone-400">({toBengaliNumber(pub._count.books)})</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 6. Marketplace Seller Filter */}
            {activeVendors.length > 0 && (
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-2">
                  মার্কেটপ্লেস বিক্রেতা (Sellers)
                </h4>
                <div className="space-y-1 text-xs">
                  {activeVendors.map((ven) => {
                    const isActive = vendor === ven.slug;
                    return (
                      <Link
                        key={ven.id}
                        href={createFilterUrl({
                          vendor: isActive ? undefined : ven.slug,
                          page: '1',
                        })}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-shubban-green text-shubban-gold font-bold'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="truncate">{ven.name}</span>
                        <span className="text-[10px] text-stone-400">({toBengaliNumber(ven._count.books)})</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Products Grid & Sort/Pagination Bar */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Sort & Count Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm text-xs">
            <span className="text-stone-600 dark:text-stone-400">
              মোট <strong className="text-stone-900 dark:text-stone-100 font-bold">{toBengaliNumber(totalBooksCount)}</strong>টি পণ্য (পৃষ্ঠা {toBengaliNumber(currentPage)} / {toBengaliNumber(Math.max(1, totalPages))})
            </span>

            {/* Sort Dropdown / Links */}
            <div className="flex items-center gap-2">
              <span className="text-stone-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                সাজান:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <Link
                  href={createFilterUrl({ sort: 'newest', page: '1' })}
                  className={`px-2.5 py-1 rounded-lg ${
                    sort === 'newest' || !sort
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  সর্বশেষ
                </Link>
                <Link
                  href={createFilterUrl({ sort: 'bestseller', page: '1' })}
                  className={`px-2.5 py-1 rounded-lg ${
                    sort === 'bestseller'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  জনপ্রিয়
                </Link>
                <Link
                  href={createFilterUrl({ sort: 'price_asc', page: '1' })}
                  className={`px-2.5 py-1 rounded-lg ${
                    sort === 'price_asc'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  মূল্য: কম &rarr; বেশি
                </Link>
                <Link
                  href={createFilterUrl({ sort: 'price_desc', page: '1' })}
                  className={`px-2.5 py-1 rounded-lg ${
                    sort === 'price_desc'
                      ? 'bg-shubban-green text-shubban-gold font-bold'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  মূল্য: বেশি &rarr; কম
                </Link>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-400 font-semibold">সক্রিয় ফিল্টার:</span>
              {category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  বিভাগ: {category}
                  <Link href={createFilterUrl({ category: undefined, page: '1' })} className="text-stone-400 hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
              {author && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  লেখক: {author}
                  <Link href={createFilterUrl({ author: undefined, page: '1' })} className="text-stone-400 hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
              {publisher && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  প্রকাশক: {publisher}
                  <Link href={createFilterUrl({ publisher: undefined, page: '1' })} className="text-stone-400 hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
              {vendor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  সেলার: {vendor}
                  <Link href={createFilterUrl({ vendor: undefined, page: '1' })} className="text-stone-400 hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
              {q && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  কীওয়ার্ড: “{q}”
                  <Link href={createFilterUrl({ q: undefined, page: '1' })} className="text-stone-400 hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </Link>
                </span>
              )}
            </div>
          )}

          {/* Book / Product Grid */}
          {books.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-shubban-darkCard rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 p-8 space-y-4">
              <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-700 dark:text-stone-300">
                কোনো বই বা পণ্য পাওয়া যায়নি
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                আপনার নির্বাচিত ফিল্টারে কোনো ফলাফল পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার শিথিল করুন অথবা অন্য কীওয়ার্ড ব্যবহার করুন।
              </p>
              <Link
                href="/books"
                className="inline-block px-5 py-2.5 rounded-xl bg-shubban-green text-shubban-ivory text-xs font-semibold shadow hover:bg-shubban-green-700 transition-colors"
              >
                সব ফিল্টার মুছে ফেলুন
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {/* Native Marketplace Ad Slot */}
          <div className="my-6">
            <AdSlot placementKey="marketplace_feed_native" />
          </div>

          {/* 12. Standard Unified Pagination Bar */}
          <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalBooksCount}
              itemsPerPage={pageSize}
              itemName="পণ্য"
              pageUrlTemplate={createFilterUrl({ page: '[page]' })}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
