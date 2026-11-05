'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  Users,
  Eye,
  Clock,
  BookOpen,
  Download,
  Share2,
  Calendar,
  Filter,
  FileSpreadsheet,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface AdminPublicationAnalyticsClientProps {
  initialSessions: any[];
  initialDownloads: any[];
  initialShares: any[];
  publications: any[];
}

export default function AdminPublicationAnalyticsClient({
  initialSessions,
  initialDownloads,
  initialShares,
  publications,
}: AdminPublicationAnalyticsClientProps) {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'month' | 'all'>('30d');
  const [selectedPubId, setSelectedPubId] = useState<string>('ALL');

  // Filter sessions based on publication
  const filteredSessions = initialSessions.filter((s) => {
    if (selectedPubId !== 'ALL' && s.issueId !== selectedPubId) return false;
    return true;
  });

  const filteredDownloads = initialDownloads.filter((d) => {
    if (selectedPubId !== 'ALL' && d.issueId !== selectedPubId) return false;
    return true;
  });

  const filteredShares = initialShares.filter((sh) => {
    if (selectedPubId !== 'ALL' && sh.issueId !== selectedPubId) return false;
    return true;
  });

  // KPI Calculations
  const totalSessions = filteredSessions.length;
  const uniqueReadersSet = new Set(filteredSessions.map((s) => s.ipHash || s.sessionId));
  const uniqueReaders = uniqueReadersSet.size;

  let totalDuration = 0;
  let totalPages = 0;
  let meaningfulReaders = 0;
  let totalCompletion = 0;

  const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
  const dailyCounts: Record<string, number> = {};

  filteredSessions.forEach((s) => {
    totalDuration += s.durationSeconds;
    totalPages += s.totalPagesViewed;
    if (s.isMeaningfulReader) meaningfulReaders++;
    totalCompletion += s.completionRate;

    const dev = (s.deviceType || 'desktop').toLowerCase();
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

    const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
  });

  const avgDurationMinutes =
    totalSessions > 0 ? (totalDuration / totalSessions / 60).toFixed(1) : '0';
  const avgPages = totalSessions > 0 ? (totalPages / totalSessions).toFixed(1) : '0';
  const meaningfulRate =
    uniqueReaders > 0 ? Math.round((meaningfulReaders / uniqueReaders) * 100) : 0;
  const avgCompletionRate = totalSessions > 0 ? Math.round(totalCompletion / totalSessions) : 0;

  const totalDownloads = filteredDownloads.length;
  const totalShares = filteredShares.length;

  // Platform share counts
  const sharePlatformCounts: Record<string, number> = {};
  filteredShares.forEach((sh) => {
    sharePlatformCounts[sh.platform] = (sharePlatformCounts[sh.platform] || 0) + 1;
  });

  // Calculate percentages for device breakdown
  const totalDevices = (deviceCounts.desktop || 0) + (deviceCounts.mobile || 0) + (deviceCounts.tablet || 0);
  const desktopPct = totalDevices > 0 ? Math.round((deviceCounts.desktop / totalDevices) * 100) : 65;
  const mobilePct = totalDevices > 0 ? Math.round((deviceCounts.mobile / totalDevices) * 100) : 30;
  const tabletPct = totalDevices > 0 ? Math.round((deviceCounts.tablet / totalDevices) * 100) : 5;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
              ডিজিটাল প্রকাশনা ও পাঠক অ্যানালিটিক্স
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            মাসিক সাময়িকী, নিবন্ধ ও ডিজিটাল বইয়ের নিখুঁত পাঠক পরিসংখ্যান ও এনগেজমেন্ট রিপোর্ট
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* CSV Export Button */}
          <a
            href={`/api/admin/publications/analytics?format=csv&period=${period}`}
            className="px-4 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition border border-stone-200 dark:border-stone-700 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CSV রিপোর্ট এক্সপোর্ট</span>
          </a>

          <Link
            href="/admin/magazines"
            className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm"
          >
            সাময়িকী পরিচালনা
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Date Period Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 w-full md:w-auto">
          {(
            [
              { key: 'today', label: 'আজকে' },
              { key: '7d', label: '৭ দিন' },
              { key: '30d', label: '৩০ দিন' },
              { key: 'month', label: 'এই মাস' },
              { key: 'all', label: 'সর্বমোট' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key)}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${period === item.key
                  ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Publication Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedPubId}
            onChange={(e) => setSelectedPubId(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">সকল সাময়িকী ও প্রকাশনা</option>
            {publications.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Total Readers & Sessions */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400">মোট রিডিং সেশন</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            {toBengaliNumber(totalSessions)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            স্বতন্ত্র পাঠক: {toBengaliNumber(uniqueReaders)} জন
          </p>
        </div>

        {/* 2. Meaningful Readers */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400">অর্থবহ পাঠক (≥৩০ সে./৩ পৃ.)</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-serif font-black text-2xl text-emerald-600 dark:text-emerald-400">
            {toBengaliNumber(meaningfulReaders)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            মোট পাঠকের {toBengaliNumber(meaningfulRate)}%
          </p>
        </div>

        {/* 3. Average Reading Duration */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400">গড় পাঠের সময়</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            {toBengaliNumber(avgDurationMinutes)} মি.
          </div>
          <p className="text-[10px] text-stone-400 mt-1">সেশন প্রতি সক্রিয় সময়</p>
        </div>

        {/* 4. Total Pages Read */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400">পৃষ্ঠা পাঠ সংখ্যা</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            {toBengaliNumber(totalPages)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">গড়ে {toBengaliNumber(avgPages)} পৃষ্ঠা/সেশন</p>
        </div>

        {/* 5. Downloads */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400">PDF ডাউনলোড</span>
            <Download className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            {toBengaliNumber(totalDownloads)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">অনুমোদিত অফলাইন কপি</p>
        </div>

        {/* 6. Shares */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400">সোশ্যাল শেয়ার</span>
            <Share2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            {toBengaliNumber(totalShares)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">ফেসবুক ও হোয়াটসঅ্যাপ</p>
        </div>
      </div>

      {/* Visual Analytics: Devices & Platform Shares */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-amber-500" />
            ডিভাইস ব্রেকডাউন (Device Distribution)
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-500" /> ডেস্কটপ (Desktop)
                </span>
                <span>{toBengaliNumber(desktopPct)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${desktopPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> মোবাইল (Mobile)
                </span>
                <span>{toBengaliNumber(mobilePct)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${mobilePct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Tablet className="w-3.5 h-3.5 text-purple-500" /> ট্যাবলেট (Tablet)
                </span>
                <span>{toBengaliNumber(tabletPct)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${tabletPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Share Platforms */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            শেয়ার মাধ্যম বিশ্লেষণ (Platforms)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] font-bold text-blue-600 block mb-1">ফেসবুক</span>
              <span className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
                {toBengaliNumber(sharePlatformCounts.FACEBOOK || 0)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] font-bold text-emerald-600 block mb-1">হোয়াটসঅ্যাপ</span>
              <span className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
                {toBengaliNumber(sharePlatformCounts.WHATSAPP || 0)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] font-bold text-amber-600 block mb-1">লিঙ্ক কপি</span>
              <span className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
                {toBengaliNumber(sharePlatformCounts.COPY_LINK || 0)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-[11px] font-bold text-purple-600 block mb-1">নেটিভ / অন্যান্য</span>
              <span className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
                {toBengaliNumber(sharePlatformCounts.NATIVE || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Publications Breakdown Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            প্রকাশনাভিত্তিক বিস্তারিত পরিসংখ্যান
          </h3>
          <span className="text-xs text-stone-400">সর্বাধিক পঠিত সংখ্যাসমূহ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <th className="py-3 px-4">সাময়িকী সংখ্যা</th>
                <th className="py-3 px-4">মূল সাময়িকী</th>
                <th className="py-3 px-4">মোট ভিউ</th>
                <th className="py-3 px-4">সেশন</th>
                <th className="py-3 px-4">ডাউনলোড</th>
                <th className="py-3 px-4">শেয়ার</th>
                <th className="py-3 px-4 text-right">প্রিভিউ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              {publications.map((pub) => (
                <tr key={pub.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition">
                  <td className="py-3.5 px-4 font-serif font-bold text-stone-900 dark:text-stone-100">
                    {pub.title}
                  </td>
                  <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400">
                    {pub.magazine}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                    {toBengaliNumber(pub.views)}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {toBengaliNumber(pub.sessions)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-600 dark:text-stone-300">
                    {toBengaliNumber(pub.downloads)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-600 dark:text-stone-300">
                    {toBengaliNumber(pub.shares)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/magazine/read/${pub.id}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition inline-block"
                      title="অনলাইনে পড়ুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

