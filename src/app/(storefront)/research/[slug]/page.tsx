import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { GraduationCap, Download, ExternalLink, ArrowLeft, Bookmark, FileText } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface ResearchDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function ResearchDetailPage({ params }: ResearchDetailPageProps) {
  const { slug } = params;

  const paper = await prisma.researchPaper.findUnique({
    where: { slug },
    include: { author: true },
  });

  if (!paper) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-stone-500 flex items-center gap-2">
        <Link href="/" className="hover:text-shubban-green">হোম</Link>
        <span>/</span>
        <Link href="/research" className="hover:text-shubban-green">গবেষণাপত্র</Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 font-semibold truncate max-w-xs">
          {paper.title}
        </span>
      </nav>

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Header */}
        <header className="space-y-3 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded bg-shubban-green text-shubban-gold font-bold">
              {paper.field}
            </span>
            <span className="font-mono text-stone-500">DOI: {paper.doi}</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
            {paper.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              প্রধান গবেষক: {paper.author.name}
            </span>
            <span>•</span>
            <span>প্রতিষ্ঠান: {paper.institution}</span>
            <span>•</span>
            <span>প্রকাশ: {formatBengaliDate(paper.publishedDate)}</span>
          </div>
        </header>

        {/* Abstract */}
        <div className="space-y-3">
          <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
            গবেষণার সারসংক্ষেপ (Abstract)
          </h2>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
            {paper.abstract}
          </p>
        </div>

        {/* Citation Box */}
        {paper.citationText && (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              সাইটেশন উদ্ধৃতি নির্দেশিকা (APA Citation):
            </span>
            <div className="p-2.5 rounded bg-white dark:bg-stone-900 font-mono text-xs text-stone-600 dark:text-stone-300 select-all border border-stone-200 dark:border-stone-800">
              {paper.citationText}
            </div>
          </div>
        )}

        {/* Download & Read PDF buttons */}
        <div className="pt-4 flex flex-wrap items-center gap-4">
          <a
            href={paper.pdfUrl || '/samples/research-charyapada.pdf'}
            download
            className="px-6 py-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-shubban-gold" />
            <span>সম্পূর্ণ গবেষণাপত্র ডাউনলোড (PDF)</span>
          </a>
          <a
            href={paper.pdfUrl || '/samples/research-charyapada.pdf'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>ব্রাউজারে সরাসরি ভিউ করুন</span>
          </a>
        </div>
      </div>
    </div>
  );
}
