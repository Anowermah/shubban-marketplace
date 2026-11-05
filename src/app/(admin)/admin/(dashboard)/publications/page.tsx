import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Newspaper,
  BookOpen,
  Plus,
  Download,
  Eye,
  FileText,
  Boxes,
  Users,
  BarChart3,
  Share2,
  FolderTree,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import AdminPublicationsClient from './AdminPublicationsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationsPage() {
  const [
    magazineCount,
    issueCount,
    articleCount,
    fileCount,
    downloadCount,
    shareCount,
    readingSessionsCount,
    meaningfulReadersCount,
    magazines,
    issues,
  ] = await Promise.all([
    prisma.magazine.count(),
    prisma.publicationIssue.count(),
    prisma.article.count(),
    prisma.publicationFile.count(),
    prisma.publicationDownload.count(),
    prisma.publicationShare.count(),
    prisma.readingSession.count(),
    prisma.readingSession.count({ where: { isMeaningfulReader: true } }),
    prisma.magazine.findMany({
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.publicationIssue.findMany({
      include: {
        magazine: true,
      },
      orderBy: { publicationDate: 'desc' },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6 font-bengali">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>প্রকাশনা ব্যবস্থাপনা ড্যাশবোর্ড (Publications Dashboard)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            ডিজিটাল পত্রিকা, প্রবন্ধ, ইসলামিক গবেষণাপত্র ও অনলাইন রিডার মনিটরিং
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/magazines/create"
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সংখ্যা</span>
          </Link>
          <Link
            href="/admin/articles/create"
            className="px-3.5 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>নতুন প্রবন্ধ</span>
          </Link>
          <Link
            href="/magazine"
            target="_blank"
            className="px-3 py-2 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition"
          >
            লাইভ পোর্টাল &rarr;
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Link
          href="/admin/magazines"
          className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-2">
            <Newspaper className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">মাসিক পত্রিকা</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition">
            {toBengaliNumber(magazineCount)}টি
          </span>
        </Link>

        <Link
          href="/admin/magazines"
          className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">মোট সংখ্যা</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-blue-600 transition">
            {toBengaliNumber(issueCount)}টি
          </span>
        </Link>

        <Link
          href="/admin/articles"
          className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">প্রবন্ধ ও গবেষণা</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 transition">
            {toBengaliNumber(articleCount)}টি
          </span>
        </Link>

        <Link
          href="/admin/publications/files"
          className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold mb-2">
            <Boxes className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">PDF ফাইল</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-purple-600 transition">
            {toBengaliNumber(fileCount)}টি
          </span>
        </Link>

        <Link
          href="/admin/publications/analytics"
          className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">সার্থক পাঠক</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-rose-600 transition">
            {toBengaliNumber(meaningfulReadersCount)}
          </span>
        </Link>

        <Link
          href="/admin/publications/downloads"
          className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-2">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">ডাউনলোড</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition">
            {toBengaliNumber(downloadCount)}
          </span>
        </Link>

        <Link
          href="/admin/publications/shares"
          className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:border-amber-500/50 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold mb-2">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">সোশ্যাল শেয়ার</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 group-hover:text-teal-600 transition">
            {toBengaliNumber(shareCount)}
          </span>
        </Link>
      </div>

      {/* Main Content: Publication Issues Management */}
      <AdminPublicationsClient initialIssues={issues} magazines={magazines} />
    </div>
  );
}
