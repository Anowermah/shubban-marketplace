import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductImageGallery from '@/components/books/ProductImageGallery';
import BookDetailClient from '@/components/books/BookDetailClient';
import BookReviewsClient from '@/components/books/BookReviewsClient';
import BookCard from '@/components/books/BookCard';
import { toBengaliNumber, formatTaka } from '@/lib/utils';
import {
  BookOpen,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  Layers,
  Store,
  PackageCheck,
  Calendar,
  CheckCircle2,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface BookPageProps {
  params: {
    slug: string;
  };
}

// 1. Dynamic SEO-friendly Product Metadata
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const book = await prisma.book.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      synopsis: true,
      description: true,
      coverImage: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
      publisher: { select: { name: true } },
    },
  });

  if (!book) {
    return {
      title: 'বইটি পাওয়া যায়নি | শুব্বান লাইব্রেরী',
      description: 'কাঙ্ক্ষিত বইটি শুব্বান লাইব্রেরী ক্যাটালগে বিদ্যমান নেই।',
    };
  }

  const title = `${book.title} — ${book.author.name} | শুব্বান লাইব্রেরী`;
  const description = book.synopsis || book.description.substring(0, 160);

  return {
    title,
    description,
    keywords: [
      book.title,
      book.author.name,
      book.category.name,
      book.publisher?.name || '',
      'শুব্বান লাইব্রেরী',
      'বাংলা বই',
      'অনলাইন বুকশপ',
      'ইসলামিক বই',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      images: [{ url: book.coverImage, alt: book.title }],
      type: 'book',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [book.coverImage],
    },
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = params;

  const book = await prisma.book.findUnique({
    where: { slug },
    include: {
      author: true,
      publisher: true,
      category: true,
      vendor: true,
      variants: true,
      reviews: {
        include: {
          user: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!book) {
    notFound();
  }

  // Related products query (same category or authored by the same writer)
  const relatedBooks = await prisma.book.findMany({
    where: {
      OR: [
        { categoryId: book.categoryId },
        { authorId: book.authorId },
      ],
      id: { not: book.id },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      discountPrice: true,
      coverImage: true,
      isFree: true,
      isDigitalAvailable: true,
      isPhysicalAvailable: true,
      author: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    take: 4,
  });

  const avgRating =
    book.reviews.length > 0
      ? (book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length).toFixed(1)
      : '৫.০';

  const discountPercent =
    book.discountPrice && book.discountPrice < book.price
      ? Math.round(((book.price - book.discountPrice) / book.price) * 100)
      : null;

  const sku = `SHB-${book.slug.substring(0, 6).toUpperCase()}-${toBengaliNumber(book.id.substring(book.id.length - 4))}`;

  // JSON-LD Schema.org Product structured data for Google SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: book.title,
    image: book.coverImage,
    description: book.synopsis || book.description,
    sku: sku,
    brand: {
      '@type': 'Brand',
      name: book.publisher?.name || 'শুব্বান লাইব্রেরী',
    },
    offers: {
      '@type': 'Offer',
      price: book.discountPrice || book.price,
      priceCurrency: 'BDT',
      availability: book.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://shubbanlibrary.com/books/${book.slug}`,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 font-bengali space-y-10 sm:space-y-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="text-xs text-stone-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-shubban-green">হোম</Link>
        <span>/</span>
        <Link href="/books" className="hover:text-shubban-green">বই ও পণ্যসম্ভার</Link>
        <span>/</span>
        <Link href={`/books?category=${book.category.slug}`} className="hover:text-shubban-green">
          {book.category.name}
        </Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 font-semibold truncate max-w-xs">
          {book.title}
        </span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 bg-white dark:bg-shubban-darkCard p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Left Column: Product Images & Gallery */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center">
          <ProductImageGallery
            title={book.title}
            coverImage={book.coverImage}
            isFree={book.isFree}
            discountPercent={discountPercent}
            stockQuantity={book.stockQuantity}
          />

          {/* In-Browser Digital PDF Reader Link */}
          {book.isDigitalAvailable && (
            <div className="w-full max-w-sm mt-4">
              <Link
                href={`/read/${book.slug}`}
                className="w-full py-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4 text-shubban-gold" />
                <span>ইন-ব্রাউজার ডিজিটাল রিডারে পড়ুন</span>
              </Link>
            </div>
          )}

          {/* Trust & Guarantee Badges */}
          <div className="w-full max-w-sm mt-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-shubban-gold flex-shrink-0" />
              <span>সারাদেশে ২-৩ দিনে দ্রুত হোম ডেলিভারি</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-shubban-gold flex-shrink-0" />
              <span>৭ দিনের সহজ রিটার্ন ও পরিবর্তন পলিসি</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-shubban-gold flex-shrink-0" />
              <span>১০০% আসল ও প্রামাণ্য মুদ্রিত সংস্করণ</span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Metadata, Purchasing & Seller Box */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col">
          {/* Header & Meta */}
          <div className="pb-5 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/books?category=${book.category.slug}`}
                className="text-xs font-semibold text-shubban-green dark:text-shubban-gold tracking-wide hover:underline"
              >
                {book.category.name}
              </Link>
              {book.titleEn && (
                <>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <span className="text-xs text-stone-400 font-sans italic">{book.titleEn}</span>
                </>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-2 leading-snug">
              {book.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <span>
                লেখক:{' '}
                <Link
                  href={`/authors/${book.author.slug}`}
                  className="font-semibold text-shubban-green dark:text-shubban-gold hover:underline"
                >
                  {book.author.name}
                </Link>
              </span>

              {book.publisher && (
                <>
                  <span>•</span>
                  <span>
                    প্রকাশক:{' '}
                    <Link
                      href={`/books?publisher=${book.publisher.slug}`}
                      className="font-medium text-stone-800 dark:text-stone-200 hover:underline"
                    >
                      {book.publisher.name}
                    </Link>
                  </span>
                </>
              )}

              <span>•</span>
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-4 h-4 fill-current" />
                <span>{toBengaliNumber(avgRating)} ({toBengaliNumber(book.reviews.length)}টি পর্যালোচনা)</span>
              </div>
            </div>
          </div>

          {/* Pricing, Variants & Cart/Buy Actions */}
          <BookDetailClient
            book={{
              id: book.id,
              title: book.title,
              slug: book.slug,
              price: book.price,
              discountPrice: book.discountPrice,
              stockQuantity: book.stockQuantity,
              coverImage: book.coverImage,
              authorName: book.author.name,
              isPhysicalAvailable: book.isPhysicalAvailable,
              isDigitalAvailable: book.isDigitalAvailable,
              isFree: book.isFree,
              sku: sku,
              variants: book.variants.map((v) => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
                price: v.price,
                stockQuantity: v.stockQuantity,
                attributes: v.attributes,
              })),
            }}
          />

          {/* Seller / Vendor Information Box */}
          {book.vendor && (
            <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center flex-shrink-0 border border-shubban-green/20">
                  {book.vendor.logoUrl ? (
                    <img src={book.vendor.logoUrl} alt={book.vendor.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Store className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                      {book.vendor.name}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.2 rounded-full flex items-center gap-1">
                      <PackageCheck className="w-3 h-3" /> ভেরিফায়েড
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {book.vendor.city || 'ঢাকা'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-current" /> ৫.০ রেটিং
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/sellers/${book.vendor.slug}`}
                className="px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-shubban-green text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-1 self-start sm:self-auto"
              >
                <span>দোকান ভিজিট করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Delivery & Shipping Information Card */}
          <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300 block">
                ডেলিভারি চার্জ ও সময়:
              </span>
              <p className="text-stone-500 dark:text-stone-400">
                ঢাকা সিটি: <strong>৳৬০</strong> (২-৩ কার্যদিবস)<br />
                সারাদেশ: <strong>৳১১০</strong> (৩-৫ কার্যদিবস)
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300 block">
                পেমেন্ট ও রিটার্ন সুবিধা:
              </span>
              <p className="text-stone-500 dark:text-stone-400">
                ✓ ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য<br />
                ✓ বিকাশ, নগদ ও ভিসা/মাস্টারকার্ড পেমেন্ট
              </p>
            </div>
          </div>

          {/* Full Specifications Table */}
          <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-4">
              বইয়ের স্পেসিফিকেশন ও বিবরণ
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
              <div>
                <span className="text-stone-400 block">আইএসবিএন (ISBN)</span>
                <span className="font-medium text-stone-800 dark:text-stone-200 font-mono">
                  {book.isbn || 'প্রযোজ্য নয়'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">সংস্করণ</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {book.edition || '১ম সংস্করণ'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">পৃষ্ঠা সংখ্যা</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {book.pages ? `${toBengaliNumber(book.pages)} পৃষ্ঠা` : 'উল্লেখ নেই'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">বাঁধাই ধরন</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {book.bindingType || 'হার্ডকভার'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">ভাষা</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {book.language === 'bn' ? 'বাংলা' : 'ইংরেজি'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">মূল প্রকাশনা সাল</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {book.publishedYear || '২০২৪'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">পণ্য কোড (SKU)</span>
                <span className="font-medium text-stone-800 dark:text-stone-200 font-mono">
                  {sku}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">বর্তমান স্টক</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 font-bold">
                  {toBengaliNumber(book.stockQuantity)} কপি উপলব্ধ
                </span>
              </div>
            </div>
          </div>

          {/* Synopsis & Table of Contents */}
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-2">
                সারসংক্ষেপ ও ভূমিকা
              </h3>
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {book.synopsis || book.description}
              </p>
            </div>

            {book.toc && (
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-shubban-gold" />
                  সূচিপত্র (Table of Contents)
                </h4>
                <pre className="text-xs text-stone-600 dark:text-stone-300 font-bengali whitespace-pre-wrap leading-relaxed">
                  {book.toc}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Author Bio Section */}
      <div className="bg-white dark:bg-shubban-darkCard p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-shubban-gold shadow-md">
          <img
            src={book.author.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
            alt={book.author.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <span className="text-xs text-stone-400 uppercase tracking-wide">লেখক পরিচিতি</span>
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 mt-0.5">
            {book.author.name}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
            {book.author.bio}
          </p>
          <Link
            href={`/authors/${book.author.slug}`}
            className="inline-block mt-3 text-xs font-semibold text-shubban-green dark:text-shubban-gold hover:underline"
          >
            লেখকের সকল বই দেখুন &rarr;
          </Link>
        </div>
      </div>

      {/* Customer Reviews & Rating Breakdown Section */}
      <BookReviewsClient bookId={book.id} initialReviews={book.reviews} />

      {/* Related Products Showcase */}
      {relatedBooks.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
              সম্পর্কিত ও একই বিভাগের অন্যান্য বই
            </h3>
            <Link
              href={`/books?category=${book.category.slug}`}
              className="text-xs text-shubban-green dark:text-shubban-gold hover:underline font-semibold"
            >
              আরও দেখুন &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedBooks.map((rel) => (
              <BookCard key={rel.id} book={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
