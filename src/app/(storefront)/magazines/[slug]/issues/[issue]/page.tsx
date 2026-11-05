import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { BookOpen, Calendar, Download, Layers, ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface IssuePageProps {
  params: {
    slug: string;
    issue: string;
  };
}

export default async function IssuePage({ params }: IssuePageProps) {
  const { slug, issue: issueId } = params;

  const currentIssue = await prisma.publicationIssue.findUnique({
    where: { id: issueId },
    include: {
      magazine: {
        include: {
          issues: {
            orderBy: { publicationDate: 'desc' },
          },
        },
      },
    },
  });

  if (!currentIssue) {
    notFound();
  }

  const allIssues = currentIssue.magazine.issues;
  const currentIndex = allIssues.findIndex((i) => i.id === currentIssue.id);
  const prevIssue = currentIndex < allIssues.length - 1 ? allIssues[currentIndex + 1] : null;
  const nextIssue = currentIndex > 0 ? allIssues[currentIndex - 1] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Navigation Breadcrumb */}
      <nav className="text-xs text-stone-500 flex items-center gap-2">
        <Link href="/" className="hover:text-shubban-green">হোম</Link>
        <span>/</span>
        <Link href="/magazines" className="hover:text-shubban-green">পত্রিকা ও সাময়িকী</Link>
        <span>/</span>
        <Link href={`/magazines/${currentIssue.magazine.slug}`} className="hover:text-shubban-green">
          {currentIssue.magazine.title}
        </Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 font-semibold truncate max-w-xs">
          {currentIssue.issueTitle}
        </span>
      </nav>

      {/* Main Issue Card */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative aspect-[3/4] w-full max-w-xs rounded-xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
            <img
              src={currentIssue.coverImage}
              alt={currentIssue.issueTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-full max-w-xs mt-4 space-y-2">
            <a
              href={currentIssue.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen className="w-4 h-4 text-shubban-gold" />
              <span>ইন-ব্রাউজার রিডারে পড়ুন</span>
            </a>
            <a
              href={currentIssue.pdfUrl}
              download
              className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অনুমোদিত PDF ডাউনলোড ({currentIssue.fileSize || '৫.৫ MB'})</span>
            </a>
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-shubban-gold uppercase">
                {currentIssue.magazine.title}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-mono">
                {currentIssue.volume} {currentIssue.issueNumber}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3">
              {currentIssue.issueTitle}
            </h1>
            <div className="flex items-center gap-4 text-xs text-stone-500 mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                প্রকাশনার তারিখ: {formatBengaliDate(currentIssue.publicationDate)}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                  সংখ্যার সারসংক্ষেপ ও ভূমিকা
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {currentIssue.summary}
                </p>
              </div>

              {currentIssue.toc && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                  <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-shubban-gold" />
                    সূচিপত্র ও বিষয়বস্তু
                  </h4>
                  <pre className="text-xs text-stone-600 dark:text-stone-300 font-bengali whitespace-pre-wrap leading-relaxed">
                    {currentIssue.toc}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Previous / Next Issue Links */}
          <div className="mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
            {prevIssue ? (
              <Link
                href={`/magazines/${slug}/issues/${prevIssue.id}`}
                className="text-stone-600 dark:text-stone-400 hover:text-shubban-gold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>পূর্ববর্তী সংখ্যা ({prevIssue.issueNumber})</span>
              </Link>
            ) : <span />}

            {nextIssue && (
              <Link
                href={`/magazines/${slug}/issues/${nextIssue.id}`}
                className="text-stone-600 dark:text-stone-400 hover:text-shubban-gold flex items-center gap-1"
              >
                <span>পরবর্তী সংখ্যা ({nextIssue.issueNumber})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
