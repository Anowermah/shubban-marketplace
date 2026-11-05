'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Database,
  Sparkles,
  BookOpen,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  BookMarked,
  Filter,
  X,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface KnowledgeSource {
  id: string;
  title: string;
  sourceType: string;
  description?: string | null;
  tenantScope?: string | null;
  isPublic: boolean;
  status: string;
  documentCount: number;
  chunkCount: number;
  lastIndexedAt?: string | null;
}

interface CorpusStats {
  versesCount: number;
  hadithsCount: number;
  tafsirCount: number;
  booksCount: number;
  articlesCount: number;
  magsCount: number;
}

interface AiStudioKnowledgeBaseClientProps {
  initialSources: KnowledgeSource[];
  initialStats: CorpusStats;
}

export default function AiStudioKnowledgeBaseClient({
  initialSources,
  initialStats,
}: AiStudioKnowledgeBaseClientProps) {
  const [sources, setSources] = useState<KnowledgeSource[]>(initialSources);
  const [stats, setStats] = useState<CorpusStats>(initialStats);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSourceType, setFormSourceType] = useState('DOCUMENT');
  const [formDescription, setFormDescription] = useState('');

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/ai-studio/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          sourceType: formSourceType,
          description: formDescription.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.source) {
        setSources((prev) => [data.source, ...prev]);
        setModalOpen(false);
        setFormTitle('');
        setFormDescription('');
      } else {
        alert(data.error || 'উৎস যুক্ত করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার সংযোগে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSources = sources.filter((s) => {
    if (filterType !== 'ALL' && s.sourceType !== filterType) return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                নলেজ বেস ও আরএজি (RAG) ইনজেশন হাব
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                GROUNDED REPOSITORIES
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              কুরআন কারীম, সহীহ হাদিস ভাণ্ডার, ক্লাসিক্যাল তাফসীর, সাময়িকী এবং ক্যাটালগের বইসমূহ ভেক্টর ইনডেক্সিং এর মাধ্যমে এআই এজেন্টগুলোর সত্যতা ও নির্ভরযোগ্য রেফারেন্স নিশ্চিত করে।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন নলেজ ডক যুক্ত করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Corpus Statistical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <span className="text-[11px] text-stone-500 block truncate">কুরআনিক আয়াত</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {toBengaliNumber(stats.versesCount)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <span className="text-[11px] text-stone-500 block truncate">সহীহ হাদিস</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {toBengaliNumber(stats.hadithsCount)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <span className="text-[11px] text-stone-500 block truncate">তাফসীর এন্ট্রি</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {toBengaliNumber(stats.tafsirCount)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <span className="text-[11px] text-stone-500 block truncate">মার্কেটপ্লেস বই</span>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {toBengaliNumber(stats.booksCount)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <span className="text-[11px] text-stone-500 block truncate">ম্যাগাজিন সংখ্যা</span>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {toBengaliNumber(stats.magsCount)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <span className="text-[11px] text-stone-500 block truncate">নিবন্ধ ও প্রবন্ধ</span>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">
            {toBengaliNumber(stats.articlesCount)}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'সব উৎস' },
            { id: 'QURAN', label: 'কুরআন' },
            { id: 'HADITH', label: 'হাদিস' },
            { id: 'TAFSIR', label: 'তাফসীর' },
            { id: 'BOOK', label: 'বই' },
            { id: 'MAGAZINE', label: 'ম্যাগাজিন' },
            { id: 'DOCUMENT', label: 'ডকুমেন্টস' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${filterType === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নলেজ উৎস খুঁজুন..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            কোনো নলেজ উৎস পাওয়া যায়নি
          </div>
        ) : (
          filteredSources.map((source) => (
            <div
              key={source.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {source.sourceType}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${source.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                      }`}
                  >
                    ✓ {source.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                  {source.title}
                </h3>

                {source.description && (
                  <p className="text-xs text-stone-500 line-clamp-2">{source.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                <span>{toBengaliNumber(source.documentCount)} টি ডকুমেন্ট</span>
                <span>স্কোপ: {source.tenantScope || 'GLOBAL'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Knowledge Source Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-bengali">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                নতুন নলেজ উৎস ইনজেস্ট করুন
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  উৎসের নাম / কিতাবের শিরোনাম:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="যেমন: 'ফিকহুস সুন্নাহ — সাইয়্যেদ সাবেক'..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  ক্যাটাগরি / ধরন:
                </label>
                <select
                  value={formSourceType}
                  onChange={(e) => setFormSourceType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="DOCUMENT">ডকুমেন্টস / গাইডলাইন</option>
                  <option value="TAFSIR">তাফসীর গ্রন্থ</option>
                  <option value="HADITH">হাদিস গ্রন্থ</option>
                  <option value="BOOK">বই / পুস্তক</option>
                  <option value="ARTICLE">প্রবন্ধ / গবেষণা</option>
                  <option value="POLICY">প্ল্যাটফর্ম পলিসি</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  বিবরণ / সারসংক্ষেপ:
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="সংক্ষিপ্ত ভূমিকা বা বিষয়বস্তুর সারসংক্ষেপ লিখুন..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                >
                  {isSubmitting ? 'যুক্ত হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

