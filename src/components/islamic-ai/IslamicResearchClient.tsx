'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  BookOpen,
  Search,
  BookMarked,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function IslamicResearchClient() {
  const [query, setQuery] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const url = query.trim()
        ? `/api/islamic-ai/research?q=${encodeURIComponent(query.trim())}`
        : '/api/islamic-ai/research';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        if (data.topics?.length > 0 && !expandedTopicId) {
          setExpandedTopicId(data.topics[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTopics();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-bengali">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-950 text-white p-8 sm:p-10 border border-emerald-800/40 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <Scale className="w-3.5 h-3.5" />
            <span>উচ্চতর ইসলামিক ফিকহ ও চার মাযহাবের তুলনামূলক গবেষণা</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            চার মাযহাবের ফিকহী দৃষ্টিভঙ্গি ও শাস্ত্রীয় সনদ পর্যালোচনা
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            হানাফী, মালিকী, শাফেয়ী ও হাম্বলী—চার প্রধান সুন্নী মাযহাবের ফিকহী সিদ্ধান্ত, ইজমা ও ইখতিলাফের কারণ এবং প্রাচীন মূল শাস্ত্রগ্রন্থের দলিলের নিরপেক্ষ উপস্থাপন।
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link
              href="/islamic-ai"
              className="px-4 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-emerald-950 font-bold text-xs shadow transition-transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-কে সরাসরি প্রশ্ন করুন</span>
            </Link>
            <Link
              href="/islamic-ai/quran"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>কুরআন অনুসন্ধান &rarr;</span>
            </Link>
            <Link
              href="/islamic-ai/hadith"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>হাদিস অনুসন্ধান &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ফিকহী বিষয় বা মাসআলা দিয়ে অনুসন্ধান (যেমন: তারাভীহর রাকাত, সদকাতুল ফিতর, রাফউল ইয়াদাইন)..."
              className="w-full pl-11 pr-4 py-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-colors shadow flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>গবেষণা অনুসন্ধান</span>
          </button>
        </form>
      </div>

      {/* Comparative Topics Accordion List */}
      <div className="space-y-6">
        {loading && (
          <div className="py-16 text-center text-stone-500 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">তুলনামূলক গবেষণা উপাত্ত লোড হচ্ছে...</p>
          </div>
        )}

        {!loading && topics.length === 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-200 dark:border-stone-800 space-y-3">
            <Scale className="w-12 h-12 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-200">
              কোনো গবেষণা বিষয় পাওয়া যায়নি
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              অন্য কোনো ফিকহী শব্দ ব্যবহার করে পুনরায় অনুসন্ধান করুন।
            </p>
          </div>
        )}

        {!loading &&
          topics.map((t) => {
            const isExpanded = expandedTopicId === t.id;
            return (
              <div
                key={t.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm transition-all"
              >
                {/* Topic Header Toggle */}
                <button
                  onClick={() => setExpandedTopicId(isExpanded ? null : t.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <span className="space-y-1 block">
                    <span className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        তুলনামূলক ফিকহ
                      </span>
                      {t.topicEn && (
                        <span className="text-xs text-stone-400">({t.topicEn})</span>
                      )}
                    </span>
                    <span className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-white block mt-1">
                      {t.topic}
                    </span>
                  </span>

                  <span className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 inline-flex items-center justify-center">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </span>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t border-stone-100 dark:border-stone-800 space-y-6">
                    {/* 4 Madhhab Views Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                      {/* Hanafi */}
                      <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                        <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                          <span>হানাফী মাযহাব (Hanafi)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 font-normal">
                            ইমাম আবু হানিফা (রহ.)
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t.madhhabViewHanafi || 'তথ্য প্রক্রিয়াধীন'}
                        </p>
                      </div>

                      {/* Maliki */}
                      <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
                        <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold text-sm">
                          <span>মালিকী মাযহাব (Maliki)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 font-normal">
                            ইমাম মালিক (রহ.)
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t.madhhabViewMaliki || 'তথ্য প্রক্রিয়াধীন'}
                        </p>
                      </div>

                      {/* Shafi'i */}
                      <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-2">
                        <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 font-bold text-sm">
                          <span>শাফেয়ী মাযহাব (Shafi&apos;i)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 font-normal">
                            ইমাম শাফেয়ী (রহ.)
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t.madhhabViewShafii || 'তথ্য প্রক্রিয়াধীন'}
                        </p>
                      </div>

                      {/* Hanbali */}
                      <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-2">
                        <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 font-bold text-sm">
                          <span>হাম্বলী মাযহাব (Hanbali)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 font-normal">
                            ইমাম আহমাদ ইবনে হাম্বল (রহ.)
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t.madhhabViewHanbali || 'তথ্য প্রক্রিয়াধীন'}
                        </p>
                      </div>
                    </div>

                    {/* Consensus or Ikhtilaf Notes */}
                    {t.consensusNotes && (
                      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 space-y-1.5">
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                          ইজমা ও মতপার্থক্যের শাস্ত্রীয় পটভূমি:
                        </span>
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                          {t.consensusNotes}
                        </p>
                      </div>
                    )}

                    {/* Classical References */}
                    {t.classicalSources && (
                      <div className="flex items-center gap-2 text-xs text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-800">
                        <BookMarked className="w-4 h-4 text-amber-500" />
                        <span>মূল শাস্ত্রীয় গ্রন্থসূত্র: {t.classicalSources}</span>
                      </div>
                    )}

                    {/* Quick Ask AI CTA */}
                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/islamic-ai?q=${encodeURIComponent(t.topic + ' সম্পর্কিত বিস্তারিত ফিকহী দলিল')}&mode=RESEARCH`}
                        className="px-4 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>এই বিষয়ে AI-তে বিস্তারিত তাহকীক দেখুন</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

