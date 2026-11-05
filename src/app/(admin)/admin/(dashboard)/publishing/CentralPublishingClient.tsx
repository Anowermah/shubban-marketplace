'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  Newspaper,
  Building2,
  BookOpen,
  FileText,
  Plus,
  Layers,
  ArrowRight,
  ExternalLink,
  Users,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ticket,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import WorkspaceSwitcher from '@/components/admin/publishing/WorkspaceSwitcher';

interface CentralPublishingClientProps {
  stats: {
    publisherCount: number;
    magazineCount: number;
    issueCount: number;
    articleCount: number;
    readingSessionCount: number;
    meaningfulReadersCount: number;
    downloadCount: number;
    shareCount: number;
    subscriptionCount: number;
  };
  magazines: any[];
  publishers: any[];
}

export default function CentralPublishingClient({
  stats,
  magazines,
  publishers,
}: CentralPublishingClientProps) {
  const [search, setSearch] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');

  const filteredMagazines = useMemo(() => {
    return magazines.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        m.title.toLowerCase().includes(q) ||
        (m.publisher?.name && m.publisher.name.toLowerCase().includes(q));
      const matchesFrequency = frequencyFilter ? m.frequency === frequencyFilter : true;
      return matchesSearch && matchesFrequency;
    });
  }, [magazines, search, frequencyFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header with Workspace Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
              Central Super Admin Authority
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>সেন্ট্রাল প্রকাশনা কন্ট্রোল সেন্টার (Central Publishing Platform)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            একাধিক স্বাধীন ইসলামিক প্রকাশনী ও সাময়িকীর মাল্টি-টেন্যান্ট কেন্দ্রীয় প্রশাসন
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <WorkspaceSwitcher />
          <Link
            href="/admin/publishing/magazines/create"
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সাময়িকী তৈরি</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold mb-2">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">প্রকাশক সংস্থা</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.publisherCount)}টি
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-2">
            <Newspaper className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">মোট সাময়িকী</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.magazineCount)}টি
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">প্রকাশিত সংখ্যা</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.issueCount)}টি
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">প্রবন্ধ ও গবেষণা</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.articleCount)}টি
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">সার্থক পাঠক</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.meaningfulReadersCount)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-2">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">PDF ডাউনলোড</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.downloadCount)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold mb-2">
            <Ticket className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-stone-500 block">সক্রিয় গ্রাহক</span>
          <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.subscriptionCount)}
          </span>
        </div>
      </div>

      {/* Central Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/publishing/publishers"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500 transition group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
              প্রকাশক ও সংস্থা পরিচালনা
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              সংস্থা নিবন্ধন, যাচাই ও অনুমোদন
            </span>
          </div>
        </Link>

        <Link
          href="/admin/publishing/magazines/create"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500 transition group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
              অটো-ওয়ার্কস্পেস জেনারেটর
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              নতুন সাময়িকী ও স্বয়ংক্রিয় সেটআপ
            </span>
          </div>
        </Link>

        <Link
          href="/admin/publishing/rights"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500 transition group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
              কপিরাইট ও লাইসেন্সিং
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              স্বত্বাধিকারী ও অনুমতি ট্র্যাকিং
            </span>
          </div>
        </Link>

        <Link
          href="/admin/publications/analytics"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500 transition group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
              সেন্ট্রাল রিডার অডিট
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              প্ল্যাটফর্ম-ওয়াইড পাঠ রিপোর্ট
            </span>
          </div>
        </Link>
      </div>

      {/* All Magazines Multi-Tenant Workspace Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>নিবন্ধিত সকল সাময়িকী ও স্বতন্ত্র ওয়ার্কস্পেস ({toBengaliNumber(filteredMagazines.length)})</span>
            </h2>
            <p className="text-xs text-stone-500">
              যেকোনো সাময়িকীর স্বতন্ত্র ব্যবস্থাপনা প্যানেলে প্রবেশ করতে &quot;ওয়ার্কস্পেস খুলুন&quot; চাপুন
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="সাময়িকী বা প্রকাশক খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              <option value="">সকল ফ্রিকোয়েন্সি</option>
              <option value="DAILY">দৈনিক (Daily)</option>
              <option value="WEEKLY">সাপ্তাহিক (Weekly)</option>
              <option value="FORTNIGHTLY">পাক্ষিক (Fortnightly)</option>
              <option value="MONTHLY">মাসিক (Monthly)</option>
              <option value="BIMONTHLY">দ্বিমাসিক (Bimonthly)</option>
              <option value="QUARTERLY">ত্রৈমাসিক (Quarterly)</option>
              <option value="ANNUAL">বার্ষিক (Annual)</option>
            </select>
          </div>
        </div>

        {/* Magazines Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMagazines.map((mag) => {
            const workspaceUrl = `/admin/publishing/workspaces/${mag.id}`;
            return (
              <div
                key={mag.id}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:border-amber-400/50 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={mag.coverImage || '/images/hero-1.jpg'}
                      alt=""
                      className="w-14 h-18 rounded-xl object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 uppercase">
                          {mag.frequency}
                        </span>
                        {mag.publisher ? (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 truncate max-w-[120px]">
                            {mag.publisher.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">
                            স্বতন্ত্র প্রকাশনা
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {mag.title}
                      </h3>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                        {mag.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block">সংখ্যা</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {toBengaliNumber(mag._count?.issues || 0)}টি
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">আর্টিকেল</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {toBengaliNumber(mag._count?.articles || 0)}টি
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">টিম মেম্বার</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {toBengaliNumber(mag._count?.members || 0)}জন
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <Link
                    href={workspaceUrl}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>ওয়ার্কস্পেস খুলুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/magazine/${mag.slug}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                    title="লাইভ পোর্টাল দেখুন"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

