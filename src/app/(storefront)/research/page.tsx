import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { GraduationCap, Download, FileText, ExternalLink, Presentation as PresIcon } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export default async function ResearchPage() {
  const [papers, presentations] = await Promise.all([
    prisma.researchPaper.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.presentation.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-12">
      {/* Page Title */}
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
          <GraduationCap className="w-4 h-4" />
          <span>একাডেমিক জ্ঞানপীঠ ও থিসিস</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          গবেষণাপত্র ও একাডেমিয়া আর্কাইভ
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          বাংলা ভাষাতত্ত্ব, পাণ্ডুলিপিশাস্ত্র, সাহিত্যের ইতিহাস, দর্শন ও সমাজতত্ত্বের ওপর প্রামাণ্য গবেষণাপত্র, কনফারেন্স স্লাইড ও লেকচার নোটস।
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <Link
          href="/research"
          className="px-4 py-2 rounded-xl bg-shubban-green text-shubban-gold font-bold text-xs shadow"
        >
          গবেষণাপত্র ({toBengaliNumber(papers.length)})
        </Link>
        <Link
          href="/presentations"
          className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-200"
        >
          সেমিনার স্লাইড ও প্রেজেন্টেশন ({toBengaliNumber(presentations.length)})
        </Link>
      </div>

      {/* Research Papers Grid */}
      <div className="space-y-6">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="p-6 sm:p-8 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-shubban-gold/50 transition-all flex flex-col md:flex-row gap-6 justify-between"
          >
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="font-mono text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded">
                  DOI: {paper.doi || '10.5281/zenodo.shubban.2026.01'}
                </span>
                <span>•</span>
                <span>{paper.institution}</span>
                <span>•</span>
                <span className="text-shubban-gold font-semibold">{paper.field}</span>
              </div>

              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100 hover:text-shubban-green dark:hover:text-shubban-gold transition-colors">
                <Link href={`/research/${paper.slug}`}>{paper.title}</Link>
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-3xl">
                {paper.abstract}
              </p>

              {paper.citationText && (
                <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 font-mono text-[11px] text-stone-600 dark:text-stone-400 select-all">
                  সাইটেশন (APA): {paper.citationText}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-stone-500 pt-2">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  লেখক: {paper.author.name}
                </span>
                <span>•</span>
                <span>প্রকাশ: {formatBengaliDate(paper.publishedDate)}</span>
                <span>•</span>
                <span>ডাউনলোড: {toBengaliNumber(paper.downloads)} বার</span>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
              <Link
                href={`/research/${paper.slug}`}
                className="px-5 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow flex items-center gap-1.5 transition-all whitespace-nowrap"
              >
                <FileText className="w-4 h-4" />
                <span>বিস্তারিত ও পিডিএফ</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
