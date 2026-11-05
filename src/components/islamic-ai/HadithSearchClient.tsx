'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Filter,
  Layers,
  Scale,
  Award,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function HadithSearchClient() {
  const [query, setQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedGrading, setSelectedGrading] = useState('');
  const [hadiths, setHadiths] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHadiths = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedCollection) params.set('collection', selectedCollection);
      if (selectedGrading) params.set('authenticity', selectedGrading);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/islamic-ai/hadith?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHadiths(data.hadiths || []);
        setCollections(data.collections || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHadiths(1);
  }, [selectedCollection, selectedGrading]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHadiths(1);
  };

  const copyHadith = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-bengali">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-950 text-white p-8 sm:p-10 border border-emerald-800/40 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>সিহাহ সিত্তাহ ও প্রামাণ্য হাদিস সংকলন</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            বিশুদ্ধ হাদিস সম্ভার ও সনদ-মান যাচাই
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            সহীহুল বুখারী, সহীহ মুসলিম, সুনানে আবু দাউদ ও জামে আত-তিরমিযী সহ প্রামাণ্য হাদিসগ্রন্থের মূল আরবী মতন, বাংলা অর্থ ও মুহাদ্দিসগণের তাহকীক।
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link
              href="/islamic-ai"
              className="px-4 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-emerald-950 font-bold text-xs shadow transition-transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-কে প্রশ্ন করুন</span>
            </Link>
            <Link
              href="/islamic-ai/quran"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>কুরআন অনুসন্ধান &rarr;</span>
            </Link>
            <Link
              href="/islamic-ai/research"
              className="px-4 py-2 rounded-xl bg-emerald-800/40 hover:bg-emerald-800/60 text-emerald-200 font-medium text-xs border border-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <span>মাযহাবীয় গবেষণা &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Collection Quick Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCollection('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCollection === ''
              ? 'bg-emerald-700 text-white border-emerald-700 shadow'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-600'
          }`}
        >
          সকল সংকলন
        </button>
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => setSelectedCollection(col.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCollection === col.slug
                ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-600'
            }`}
          >
            {col.nameBn} ({col.nameAr})
          </button>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="হাদিসের মূল পাঠ, বিষয় (ঈমান, নামাজ, দান, ইলম) বা রাবী দিয়ে খুঁজুন..."
              className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
            />
          </div>

          <select
            value={selectedGrading}
            onChange={(e) => setSelectedGrading(e.target.value)}
            className="px-4 py-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white sm:w-48"
          >
            <option value="">সকল মানদণ্ড</option>
            <option value="SAHIH">সহীহ (Authentic)</option>
            <option value="HASAN">হাসান (Good)</option>
            <option value="MUTAWATIR">মুতাওয়াতির (Continuous)</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-colors shadow flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>খুঁজুন</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
          <span>মোট {toBengaliNumber(pagination.total)} টি বিশুদ্ধ হাদিস পাওয়া গেছে</span>
          <span>পৃষ্ঠা {toBengaliNumber(pagination.page)} / {toBengaliNumber(pagination.totalPages || 1)}</span>
        </div>
      </div>

      {/* Hadith Entries List */}
      <div className="space-y-6">
        {loading && (
          <div className="py-16 text-center text-stone-500 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">বিশুদ্ধ হাদিস তালিকা লোড হচ্ছে...</p>
          </div>
        )}

        {!loading && hadiths.length === 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-200 dark:border-stone-800 space-y-3">
            <BookOpen className="w-12 h-12 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-200">
              কোনো হাদিস পাওয়া যায়নি
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              ভিন্ন কোনো বিষয় বা শব্দ দিয়ে অনুসন্ধান করুন।
            </p>
          </div>
        )}

        {!loading &&
          hadiths.map((h) => (
            <div
              key={h.id}
              className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 transition-all hover:border-emerald-500/40"
            >
              {/* Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center">
                    #{toBengaliNumber(h.hadithNumber)}
                  </span>
                  <div>
                    <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                      <span>{h.collection?.nameBn || 'হাদিস সংকলন'}</span>
                      <span className="text-xs text-stone-500">({h.collection?.nameAr})</span>
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {h.chapterNameBn || 'সাধারণ পরিচ্ছেদ'} &bull; হাদিস নং {toBengaliNumber(h.hadithNumber)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      h.authenticity === 'SAHIH'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    }`}
                  >
                    মান: {h.authenticity === 'SAHIH' ? 'সহীহ (বিশুদ্ধ)' : 'হাসান (উত্তম)'}
                  </span>

                  <button
                    onClick={() =>
                      copyHadith(
                        `${h.textAr}\n\n${h.textBn}\n[${h.collection?.nameBn}, হাদিস নং: ${h.hadithNumber}]`,
                        h.id
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 text-xs flex items-center gap-1.5 transition-colors"
                    title="হাদিস কপি করুন"
                  >
                    {copiedId === h.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Narrator */}
              {h.narrator && (
                <div className="text-xs font-semibold text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40 px-3 py-1.5 rounded-lg inline-block">
                  বর্ণনাকারী: {h.narrator}
                </div>
              )}

              {/* Arabic Matn */}
              <div
                dir="rtl"
                className="font-serif text-2xl sm:text-3xl leading-loose text-emerald-950 dark:text-emerald-100 py-3 text-right"
              >
                {h.textAr}
              </div>

              {/* Bengali Translation */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  হাদিসের বাংলা অর্থ:
                </span>
                <p className="text-stone-800 dark:text-stone-200 text-sm sm:text-base leading-relaxed">
                  {h.textBn}
                </p>
              </div>

              {/* English Translation */}
              {h.textEn && (
                <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                    English Matn:
                  </span>
                  <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed">
                    {h.textEn}
                  </p>
                </div>
              )}

              {/* Tahqiq & Grading Authority Footer */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>তাহকীক ও সনদ মানদণ্ড: {h.gradingAuthority}</span>
                </span>
                <span className="text-stone-400">বিষয়: {h.topicTag}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => fetchHadiths(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 flex items-center gap-1 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>পূর্ববর্তী</span>
          </button>
          <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
            {toBengaliNumber(pagination.page)} / {toBengaliNumber(pagination.totalPages)}
          </span>
          <button
            onClick={() => fetchHadiths(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 flex items-center gap-1 text-xs font-bold"
          >
            <span>পরবর্তী</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

