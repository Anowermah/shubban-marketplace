import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ArticleDetailClient from '@/components/articles/ArticleDetailClient';
import ArticleShareButtons from '@/components/articles/ArticleShareButtons';
import { Clock, Calendar, Bookmark, ArrowLeft, MessageSquare, BookOpen, Quote, Sparkles } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import { generateArticleJsonLd, getCanonicalUrl } from '@/lib/seo';
import AdSlot from '@/components/ads/AdSlot';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    include: { author: true, category: true },
  });

  if (!article) {
    return {
      title: 'প্রবন্ধ পাওয়া যায়নি | শুব্বান লাইব্রেরি',
      description: 'কাঙ্ক্ষিত গবেষণা প্রবন্ধটি পাওয়া যায়নি।',
    };
  }

  const title = `${article.title} — ${article.author.name} | শুব্বান লাইব্রেরি`;
  const description = article.metaDescription || article.excerpt;
  const canonical = article.canonicalUrl || getCanonicalUrl(`/articles/${article.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      publishedTime: new Date(article.publishedAt).toISOString(),
      authors: [article.author.name],
      images: article.coverImage ? [{ url: article.coverImage, alt: article.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      issue: {
        include: { magazine: true },
      },
      comments: {
        where: { isApproved: true },
        include: {
          user: {
            select: { name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!article) {
    notFound();
  }

  // Increment views
  await prisma.article.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  });

  // Related articles
  const relatedArticles = await prisma.article.findMany({
    where: {
      categoryId: article.categoryId,
      id: { not: article.id },
      status: 'PUBLISHED',
    },
    include: { author: true },
    take: 3,
  });

  // Parse related books if available
  let relatedBooks: any[] = [];
  if (article.relatedBookIds) {
    try {
      const bookIds = JSON.parse(article.relatedBookIds);
      if (Array.isArray(bookIds) && bookIds.length > 0) {
        relatedBooks = await prisma.book.findMany({
          where: { id: { in: bookIds } },
          include: { author: true },
          take: 4,
        });
      }
    } catch (e) {}
  }

  const jsonLd = generateArticleJsonLd(article);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-stone-500 flex items-center gap-2 no-print flex-wrap">
        <Link href="/" className="hover:text-amber-600 transition">হোম</Link>
        <span>/</span>
        <Link href="/magazine" className="hover:text-amber-600 transition">মাসিক সাময়িকী</Link>
        <span>/</span>
        <Link href="/articles" className="hover:text-amber-600 transition">প্রবন্ধ ও গবেষণা</Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 font-semibold truncate max-w-xs">
          {article.title}
        </span>
      </nav>

      {/* Main Article Container */}
      <article className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-12 shadow-sm space-y-8">
        {/* Header Metadata */}
        <header className="space-y-4 border-b border-stone-100 dark:border-stone-800 pb-8 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white shadow-sm">
              {article.category.name}
            </span>

            {article.issue && (
              <Link
                href={`/magazine/${article.issue.magazine.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-amber-600 border border-stone-200 dark:border-stone-700 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>{article.issue.magazine.title} ({article.issue.volume || article.issue.issueTitle})</span>
              </Link>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-stone-900 dark:text-stone-100 leading-tight tracking-tight">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="font-serif text-sm sm:text-lg text-stone-600 dark:text-stone-400 italic">
              {article.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-stone-500 pt-2">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              লেখক: {article.author.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              {formatBengaliDate(article.publishedAt)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              পাঠের আনুমানিক সময়: {toBengaliNumber(article.readingTime)} মিনিট
            </span>
          </div>

          {/* Social share & print actions */}
          <div className="pt-4 flex items-center justify-between no-print">
            <div className="text-xs text-stone-400">
              {toBengaliNumber(article.views + 1)} বার পঠিত হয়েছে
            </div>
            <ArticleShareButtons title={article.title} />
          </div>
        </header>

        {/* Featured Image */}
        {article.coverImage && (
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-md">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Arabic Typography Box (if provided) */}
        {article.arabicContent && (
          <div className="p-6 rounded-2xl bg-amber-50/60 dark:bg-stone-800/60 border-l-4 border-amber-500 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>মূল আরবি নস ও উদ্ধৃতি (Arabic Text & Citations)</span>
            </div>
            <p
              dir="rtl"
              lang="ar"
              className="font-serif text-lg sm:text-xl text-stone-900 dark:text-stone-100 leading-loose text-right"
              style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
            >
              {article.arabicContent}
            </p>
          </div>
        )}

        {/* Article Body Content */}
        <div className="text-base sm:text-lg text-stone-800 dark:text-stone-200 leading-relaxed font-serif space-y-6 select-text whitespace-pre-line">
          {article.content}
        </div>

        {/* References and Citations Section */}
        {article.references && (
          <div className="pt-6 border-t border-stone-100 dark:border-stone-800 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-200 flex items-center gap-1.5 mb-2">
              <Quote className="w-4 h-4 text-amber-500" />
              তথ্যসূত্র ও টীকা (References & Citations)
            </h4>
            <div className="whitespace-pre-line leading-relaxed italic bg-stone-50 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
              {article.references}
            </div>
          </div>
        )}

        {/* Author Bio Card */}
        <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-amber-500">
            <img
              src={article.author.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={article.author.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wide text-stone-400">প্রাবন্ধিক ও গবেষক পরিচিতি</span>
            <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              {article.author.name}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
              {article.author.bio}
            </p>
          </div>
        </div>

        {/* Safe Sponsored Placement Below Article (Outside sacred text) */}
        <div className="my-6">
          <AdSlot placementKey="article_bottom" />
        </div>

        {/* Interactive Comments & Discussion */}
        <ArticleDetailClient
          articleId={article.id}
          initialComments={article.comments}
        />
      </article>

      {/* Related Books Section */}
      {relatedBooks.length > 0 && (
        <section className="space-y-4 no-print">
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            সম্পর্কিত নির্বাচিত গ্রন্থ
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedBooks.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-3 hover:shadow-lg transition"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-stone-100 dark:bg-stone-800">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-amber-600">
                  {book.title}
                </h4>
                <p className="text-[10px] text-stone-500 mt-0.5">{book.author.name}</p>
                <p className="text-xs font-bold text-amber-600 mt-1">৳{toBengaliNumber(book.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4 no-print">
          <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-200 dark:border-stone-800">
            সম্পর্কিত অন্যান্য প্রবন্ধ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/40 transition-all"
              >
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-amber-600 line-clamp-2">
                  <Link href={`/articles/${rel.slug}`}>{rel.title}</Link>
                </h4>
                <p className="text-xs text-stone-500 mt-2 line-clamp-2">{rel.excerpt}</p>
                <span className="text-[11px] text-stone-400 mt-2 block">{rel.author.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
