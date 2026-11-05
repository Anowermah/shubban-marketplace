import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  Share2,
  Sparkles,
  ArrowLeft,
  User,
  CheckCircle2,
  List,
} from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface MagazineSlugProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: MagazineSlugProps) {
  const magazine = await prisma.magazine.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

  if (!magazine) {
    return { title: 'সাময়িকী পাওয়া যায়নি | শুব্বান ডিজিটাল লাইব্রেরি' };
  }

  return {
    title: `${magazine.title} — সকল সংখ্যা ও আর্কাইভ | শুব্বান লাইব্রেরি`,
    description: magazine.description,
  };
}

export default async function MagazineDetailPage({ params }: MagazineSlugProps) {
  const { slug } = params;

  const magazine = await prisma.magazine.findUnique({
    where: { slug },
    include: {
      category: true,
      publisher: true,
      issues: {
        where: { status: 'PUBLISHED' },
        orderBy: { publicationDate: 'desc' },
        include: {
          articles: {
            where: { status: 'PUBLISHED' },
            include: { author: true },
            take: 4,
          },
        },
      },
    },
  });

  if (!magazine) {
    notFound();
  }

  const latestIssue = magazine.issues[0];

  return (
    <div className="min-h-screen bg-stone-50/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20">
      {/* Magazine Series Header */}
      <section className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white border-b border-stone-800 pt-8 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/magazine"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 mb-6 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> সকল সাময়িকী তালিকায় ফিরে যান
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-48 sm:w-56 md:w-64 flex-shrink-0">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/30">
                <Image
                  src={magazine.coverImage}
                  alt={magazine.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{magazine.frequency === 'MONTHLY' ? 'মাসিক সাময়িকী' : 'ত্রৈমাসিক প্রকাশনা'}</span>
                <span>• {magazine.category.name}</span>
              </div>

              <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-stone-100 mb-3 tracking-tight">
                {magazine.title}
              </h1>

              {magazine.titleEn && (
                <p className="text-sm font-sans text-stone-400 mb-4">{magazine.titleEn}</p>
              )}

              <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-3xl mb-6">
                {magazine.description}
              </p>

              {/* Editor Details */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs text-stone-400 border-t border-stone-800 pt-4">
                {magazine.editor && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>সম্পাদক: <strong>{magazine.editor}</strong></span>
                  </span>
                )}
                {magazine.publisher && (
                  <span>প্রকাশক: <strong>{magazine.publisher.name}</strong></span>
                )}
                <span>মোট প্রকাশিত সংখ্যা: <strong>{toBengaliNumber(magazine.issues.length)}টি</strong></span>
              </div>

              {latestIssue && (
                <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Link
                    href={`/magazine/read/${latestIssue.id}`}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-amber-900/40 flex items-center gap-2 transition"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>সর্বশেষ সংখ্যা পড়ুন</span>
                  </Link>
                  <Link
                    href={`/magazine/${magazine.slug}/articles`}
                    className="px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-sm border border-stone-700 transition"
                  >
                    সকল প্রবন্ধসমূহ দেখুন
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Message (if present) */}
      {magazine.editorialMessage && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
          <div className="bg-amber-50 dark:bg-stone-900/90 border border-amber-200 dark:border-amber-900/40 rounded-3xl p-6 sm:p-8 shadow-lg">
            <h3 className="font-serif font-bold text-base sm:text-lg text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              সম্পাদকীয় বার্তা
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic whitespace-pre-line">
              &quot;{magazine.editorialMessage}&quot;
            </p>
          </div>
        </section>
      )}

      {/* Published Issues List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100 mb-8">
          প্রকাশিত সংখ্যাসমূহ
        </h2>

        <div className="space-y-6">
          {magazine.issues.map((iss) => (
            <div
              key={iss.id}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-6 items-center md:items-start"
            >
              <div className="w-32 sm:w-36 flex-shrink-0">
                <Link
                  href={`/magazine/read/${iss.id}`}
                  className="relative block aspect-[3/4] rounded-xl overflow-hidden shadow-md group"
                >
                  <Image
                    src={iss.coverImage}
                    alt={iss.issueTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </Link>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1.5">
                  {iss.volume && <span>{iss.volume}</span>}
                  {iss.issueNumber && <span>• {iss.issueNumber}</span>}
                  <span>• {formatBengaliDate(iss.publicationDate)}</span>
                </div>

                <Link
                  href={`/magazine/read/${iss.id}`}
                  className="font-serif font-bold text-base sm:text-xl text-stone-900 dark:text-stone-100 hover:text-amber-600 transition block mb-2"
                >
                  {iss.issueTitle}
                </Link>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-4">
                  {iss.summary || 'এই সংখ্যাটিতে মননশীল প্রবন্ধ ও গবেষণা প্রকাশিত হয়েছে।'}
                </p>

                {/* Table of contents snippet */}
                {iss.toc && (
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-2xl border border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 mb-4 whitespace-pre-line line-clamp-3">
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                      সংখ্যার সূচিপত্র:
                    </span>
                    {iss.toc}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Link
                    href={`/magazine/read/${iss.id}`}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>অনলাইনে পড়ুন</span>
                  </Link>

                  {iss.allowDownload && (
                    <a
                      href={`/api/publications/${iss.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 border border-stone-200 dark:border-stone-700 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span>PDF ডাউনলোড</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

