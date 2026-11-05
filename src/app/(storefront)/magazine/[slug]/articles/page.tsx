import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, BookOpen, Calendar, Clock, User, Sparkles } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface MagazineArticlesProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: MagazineArticlesProps) {
  const magazine = await prisma.magazine.findUnique({
    where: { slug: params.slug },
  });

  return {
    title: `${magazine ? magazine.title : 'সাময়িকী'}-এর প্রবন্ধসমূহ | শুব্বান ডিজিটাল লাইব্রেরি`,
  };
}

export default async function MagazineArticlesPage({ params }: MagazineArticlesProps) {
  const { slug } = params;

  const magazine = await prisma.magazine.findUnique({
    where: { slug },
    include: {
      issues: {
        where: { status: 'PUBLISHED' },
        include: {
          articles: {
            where: { status: 'PUBLISHED' },
            include: { author: true, category: true },
            orderBy: { publishedAt: 'desc' },
          },
        },
      },
    },
  });

  if (!magazine) {
    notFound();
  }

  // Flatten all articles belonging to this magazine's issues
  const allArticles: any[] = [];
  magazine.issues.forEach((iss) => {
    iss.articles.forEach((art) => {
      allArticles.push({
        ...art,
        issueTitle: iss.issueTitle,
        issueNumber: iss.issueNumber,
      });
    });
  });

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20">
      <header className="bg-stone-900 text-white border-b border-stone-800 pt-8 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Link
            href={`/magazine/${magazine.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {magazine.title}-এ ফিরে যান
          </Link>

          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-100 mb-2">
            {magazine.title}: সকল প্রবন্ধ ও গবেষণা
          </h1>
          <p className="text-xs sm:text-sm text-stone-400">
            এই সাময়িকীতে প্রকাশিত মননশীল প্রবন্ধ, সাহিত্য সমালোচনা ও গবেষণাপত্র
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {allArticles.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200 mb-1">
              কোনো পৃথক প্রবন্ধ তালিকাভুক্ত নেই
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              এই সাময়িকীর সকল বিষয়বস্তু সরাসরি সম্পূর্ণ PDF সংখ্যায় সন্নিবেশিত রয়েছে।
            </p>
            <Link
              href={`/magazine/${magazine.slug}`}
              className="inline-flex px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              সাময়িকী সংখ্যা দেখুন
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {allArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-600 mb-2">
                  <span>{art.category.name}</span>
                  {art.issueTitle && <span>• {art.issueTitle}</span>}
                </div>

                <Link
                  href={`/articles/${art.slug}`}
                  className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 hover:text-amber-600 transition block mb-2"
                >
                  {art.title}
                </Link>

                {art.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-500 italic mb-3">{art.subtitle}</p>
                )}

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3 mb-4">
                  {art.excerpt}
                </p>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {art.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {formatBengaliDate(art.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {toBengaliNumber(art.readingTime)} মিনিট পাঠ
                    </span>
                  </div>

                  <Link
                    href={`/articles/${art.slug}`}
                    className="text-amber-600 hover:text-amber-500 font-bold"
                  >
                    সম্পূর্ণ পড়ুন →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

