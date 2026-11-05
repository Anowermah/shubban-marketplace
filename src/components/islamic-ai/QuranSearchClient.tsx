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
  Filter,
  Layers,
  HelpCircle,
  FileText,
  Volume2,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function QuranSearchClient() {
  const [query, setQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number | ''>('');
  const [verses, setVerses] = useState<any[]>([]);
  const [surahs, setSurahs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTafsirId, setActiveTafsirId] = useState<string | null>(null);

  const fetchVerses = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedSurah) params.set('surah', selectedSurah.toString());
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/islamic-ai/quran?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVerses(data.verses || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        if (data.surahs && surahs.length === 0) {
          setSurahs(data.surahs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerses(1);
  }, [selectedSurah]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerses(1);
  };

  const copyVerse = (text: string, id: string) => {
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
            <BookOpen className="w-3.5 h-3.5" />
            <span>পবিত্র কুরআনুল কারীম অনুসন্ধান ও তাফসির</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            কুরআনুল কারীম আরবী, বিশুদ্ধ বাংলা অনুবাদ ও তাফসির
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            উসমানী রসমুল খত আরবী বর্ণমালা, তাশকিলসহ বিশুদ্ধ পাঠ, নির্ভরযোগ্য বাংলা ও ইংরেজি তরজমা এবং ইমাম ইবনে কাসীর ও মাআরিফুল কুরআনের প্রামাণ্য ব্যাখ্যা।
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
              href="/islamic-ai/hadith"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>হাদিস অনুসন্ধান &rarr;</span>
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

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="কুরআনের আয়াত, বিষয় (নামাজ, রোজা, তাওহীদ) বা অনুবাদ দিয়ে অনুসন্ধান..."
              className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
            />
          </div>

          <select
            value={selectedSurah}
            onChange={(e) => setSelectedSurah(e.target.value ? parseInt(e.target.value) : '')}
            className="px-4 py-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white sm:w-60"
          >
            <option value="">সকল সূরা (১১৪ সূরা)</option>
            {surahs.map((s) => (
              <option key={s.surahNumber} value={s.surahNumber}>
                {toBengaliNumber(s.surahNumber)}. {s.surahNameBn} ({s.surahNameAr})
              </option>
            ))}
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
          <span>মোট {toBengaliNumber(pagination.total)} টি আয়াত পাওয়া গেছে</span>
          <span>পৃষ্ঠা {toBengaliNumber(pagination.page)} / {toBengaliNumber(pagination.totalPages || 1)}</span>
        </div>
      </div>

      {/* Verses List */}
      <div className="space-y-6">
        {loading && (
          <div className="py-16 text-center text-stone-500 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">কুরআনুল কারীমের আয়াত লোড হচ্ছে...</p>
          </div>
        )}

        {!loading && verses.length === 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-200 dark:border-stone-800 space-y-3">
            <BookOpen className="w-12 h-12 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-200">
              কোনো আয়াত পাওয়া যায়নি
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              অন্য কোনো কীওয়ার্ড দিয়ে অনুসন্ধান করুন অথবা ড্রপডাউন থেকে নির্দিষ্ট সূরা নির্বাচন করুন।
            </p>
          </div>
        )}

        {!loading &&
          verses.map((v) => {
            const bnTranslation = v.translations?.find((t: any) => t.language === 'bn')?.translation || '';
            const enTranslation = v.translations?.find((t: any) => t.language === 'en')?.translation || '';
            const tafsir = v.tafsirEntries?.[0];

            return (
              <div
                key={v.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 transition-all hover:border-emerald-500/40"
              >
                {/* Verse Meta Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center">
                      {toBengaliNumber(v.ayahNumber)}
                    </span>
                    <div>
                      <h4 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                        সূরা {v.surahNameBn} ({v.surahNameAr})
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        সূরা নং {toBengaliNumber(v.surahNumber)} : আয়াত নং {toBengaliNumber(v.ayahNumber)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        copyVerse(
                          `${v.textAr}\n\nঅনুবাদ: ${bnTranslation}\n[সূরা ${v.surahNameBn} ${v.surahNumber}:${v.ayahNumber}]`,
                          v.id
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 text-xs flex items-center gap-1.5 transition-colors"
                      title="আয়াত কপি করুন"
                    >
                      {copiedId === v.id ? (
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

                {/* Arabic Text with Tashkeel */}
                <div
                  dir="rtl"
                  className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-loose text-emerald-950 dark:text-emerald-100 py-3 text-right"
                >
                  {v.textAr}
                </div>

                {/* Bengali Translation */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    বাংলা অনুবাদ (মাওলানা মুহিউদ্দীন খান / ইসলামিক ফাউন্ডেশন):
                  </span>
                  <p className="text-stone-800 dark:text-stone-200 text-sm sm:text-base leading-relaxed">
                    {bnTranslation}
                  </p>
                </div>

                {/* English Translation */}
                {enTranslation && (
                  <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                      English Translation (Sahih International):
                    </span>
                    <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed">
                      {enTranslation}
                    </p>
                  </div>
                )}

                {/* Classical Tafsir Accordion */}
                {tafsir && (
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() =>
                        setActiveTafsirId(activeTafsirId === v.id ? null : v.id)
                      }
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        {activeTafsirId === v.id ? 'তাফসির সংক্ষেপণ লুকান' : `তাফসির দেখুন (${tafsir.source})`}
                      </span>
                    </button>

                    {activeTafsirId === v.id && (
                      <div className="mt-3 p-4 rounded-xl bg-amber-500/5 border border-amber-400/20 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-2">
                        <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                          <span>{tafsir.source}</span>
                          {tafsir.volume && (
                            <span className="text-[11px] text-stone-500">
                              খণ্ড: {toBengaliNumber(tafsir.volume)}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-line">{tafsir.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => fetchVerses(pagination.page - 1)}
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
            onClick={() => fetchVerses(pagination.page + 1)}
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

