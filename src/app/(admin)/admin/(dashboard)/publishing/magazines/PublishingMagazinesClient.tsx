'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import WorkspaceSwitcher from '@/components/admin/publishing/WorkspaceSwitcher';

interface Publisher {
  id: string;
  name: string;
  nameEn: string | null;
  isVerified?: boolean;
  logoUrl?: string | null;
}

interface MagazineItem {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string | null;
  coverImage: string | null;
  frequency: string;
  status: string;
  themeColor: string;
  editor: string | null;
  isSubscribable: boolean;
  singleIssuePrice: number;
  monthlySubscriptionPrice: number;
  annualSubscriptionPrice: number;
  totalSubscribers: number;
  totalRevenue: number;
  createdAt: string;
  publisher: Publisher | null;
  category: { id: string; name: string } | null;
  schedule: {
    frequency: string;
    nextExpectedDate: string | null;
    numberingScheme: string;
    autoReminders: boolean;
  } | null;
  issueCount: number;
  articleCount: number;
  memberCount: number;
  subscriptionCount: number;
}

interface Props {
  initialMagazines: MagazineItem[];
  publishers: { id: string; name: string; nameEn: string | null }[];
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'দৈনিক',
  WEEKLY: 'সাপ্তাহিক',
  FORTNIGHTLY: 'পাক্ষিক',
  MONTHLY: 'মাসিক',
  BIMONTHLY: 'দ্বিমাসিক',
  QUARTERLY: 'ত্রৈমাসিক',
  HALF_YEARLY: 'ষাণ্মাসিক',
  ANNUAL: 'বার্ষিক',
  SPECIAL_EDITION: 'বিশেষ সংখ্যা',
  IRREGULAR: 'অনিয়মিত',
};

export default function PublishingMagazinesClient({ initialMagazines, publishers }: Props) {
  const [magazines, setMagazines] = useState<MagazineItem[]>(initialMagazines);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const filteredMagazines = useMemo(() => {
    return magazines.filter((m) => {
      const matchSearch =
        !searchTerm ||
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.titleEn && m.titleEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.editor && m.editor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPub = !selectedPublisher || m.publisher?.id === selectedPublisher;
      const matchFreq = !selectedFrequency || m.frequency === selectedFrequency;
      const matchStatus = !selectedStatus || m.status === selectedStatus;

      return matchSearch && matchPub && matchFreq && matchStatus;
    });
  }, [magazines, searchTerm, selectedPublisher, selectedFrequency, selectedStatus]);

  const totalIssues = useMemo(() => magazines.reduce((acc, m) => acc + m.issueCount, 0), [magazines]);
  const totalArticles = useMemo(() => magazines.reduce((acc, m) => acc + m.articleCount, 0), [magazines]);
  const totalSubs = useMemo(() => magazines.reduce((acc, m) => acc + m.totalSubscribers, 0), [magazines]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <Link href="/admin/publishing" className="hover:text-emerald-700 transition">
              সেন্ট্রাল প্রকাশনা
            </Link>
            <span>/</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">সকল সাময়িকী ও জার্নাল</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <BookOpen className="w-5 h-5" />
            </div>
            সকল প্রকাশনা ও সাময়িকী ডিরেক্টরি
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            সেন্ট্রাল প্ল্যাটফর্মে নিবন্ধিত সকল সাময়িকী ও তাদের স্বাধীন ওয়ার্কস্পেস পরিচালনা
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <WorkspaceSwitcher currentMagazineId="" />

          <Link
            href="/admin/publishing/magazines/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition"
          >
            <Plus className="w-4 h-4" />
            নতুন সাময়িকী তৈরি করুন
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">মোট সাময়িকী</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{magazines.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">স্বাধীন ওয়ার্কস্পেস</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">মোট সংখ্যা (Issues)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalIssues}</p>
          <span className="text-[10px] text-stone-500 font-medium">ডিজিটাল সংখ্যা প্রকাশিত</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">মোট প্রবন্ধ ও রচনা</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalArticles}</p>
          <span className="text-[10px] text-blue-600 font-semibold">আর্টিকেল ভাণ্ডার</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">পাঠক ও গ্রাহক</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalSubs}</p>
          <span className="text-[10px] text-purple-600 font-semibold">সক্রিয় সাবস্ক্রাইবার</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সাময়িকীর নাম, সম্পাদক বা স্ল্যাগ দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Publisher Filter */}
          <select
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল প্রকাশক</option>
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Frequency Filter */}
          <select
            value={selectedFrequency}
            onChange={(e) => setSelectedFrequency(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল ফ্রিকোয়েন্সি</option>
            {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="ACTIVE">সক্রিয় (Active)</option>
            <option value="DRAFT">ড্রাফট (Draft)</option>
            <option value="ARCHIVED">আর্কাইভড (Archived)</option>
          </select>
        </div>
      </div>

      {/* Magazines Directory Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-semibold">
                <th className="py-3.5 px-4">সাময়িকী / জার্নাল</th>
                <th className="py-3.5 px-4">প্রকাশক প্রতিষ্ঠান</th>
                <th className="py-3.5 px-4">ফ্রিকোয়েন্সি</th>
                <th className="py-3.5 px-4 text-center">সংখ্যা ও প্রবন্ধ</th>
                <th className="py-3.5 px-4 text-center">পরবর্তী সংখ্যা</th>
                <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">ওয়ার্কস্পেস অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filteredMagazines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    কোনো প্রকাশনা বা সাময়িকী খুঁজে পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredMagazines.map((mag) => {
                  const freqLabel = FREQUENCY_LABELS[mag.frequency] || mag.frequency;
                  const nextDateStr = mag.schedule?.nextExpectedDate
                    ? new Date(mag.schedule.nextExpectedDate).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : null;

                  return (
                    <tr
                      key={mag.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition group"
                    >
                      {/* Title & Accent */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                            style={{ backgroundColor: mag.themeColor || '#0f3e2e' }}
                          >
                            {mag.title.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/publishing/workspaces/${mag.id}`}
                              className="font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition truncate block text-sm"
                            >
                              {mag.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                              {mag.editor && <span>সম্পাদক: {mag.editor}</span>}
                              {mag.titleEn && <span>• {mag.titleEn}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Publisher */}
                      <td className="py-4 px-4">
                        {mag.publisher ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {mag.publisher.name}
                            </span>
                            {mag.publisher.isVerified && (
                              <span title="ভেরিফাইড প্রতিষ্ঠান" className="inline-flex">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">স্বতন্ত্র প্রকাশনা</span>
                        )}
                        {mag.category && (
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            {mag.category.name}
                          </span>
                        )}
                      </td>

                      {/* Frequency */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <Calendar className="w-3 h-3" />
                          {freqLabel}
                        </span>
                      </td>

                      {/* Issue and Article count */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-bold text-stone-800 dark:text-stone-200">
                            {mag.issueCount} সংখ্যা
                          </span>
                          <span className="text-stone-400">/</span>
                          <span className="text-stone-500 font-medium">
                            {mag.articleCount} প্রবন্ধ
                          </span>
                        </div>
                      </td>

                      {/* Next Issue Date */}
                      <td className="py-4 px-4 text-center">
                        {nextDateStr ? (
                          <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
                            {nextDateStr}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">অপেক্ষমাণ</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            mag.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {mag.status === 'ACTIVE' ? 'সক্রিয়' : mag.status}
                        </span>
                      </td>

                      {/* Workspace Action */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/magazine/${mag.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
                            title="পাবলিক ভিউ দেখুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/admin/publishing/workspaces/${mag.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-emerald-800 text-white dark:text-stone-900 text-xs font-bold transition shadow-sm"
                          >
                            <span>ওয়ার্কস্পেস</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
