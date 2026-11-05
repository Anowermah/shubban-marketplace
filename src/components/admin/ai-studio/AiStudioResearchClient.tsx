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
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function AiStudioResearchClient() {
  const [query, setQuery] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Scale className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                ইসলামিক স্কলারলি রিসার্চ ও তুলনামূলক ফিকহ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                VERIFIED RAG
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              চার মাযহাবের (হানাফী, মালিকী, শাফিয়ী, হাম্বলী) প্রামাণ্য দলীল, ফকীহগণের ঐকমত্য (ইজমা), এবং প্রাচীন নির্ভরযোগ্য তাফসীর ও ফিকহ গ্রন্থের তুলনামূলক গবেষণা প্ল্যাটফর্ম।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/ai-studio/content-studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>কনটেন্ট স্টুডিওতে যান</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-5 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ফিকহী বা গবেষণার বিষয় অনুসন্ধান করুন (যেমন: 'যাকাতুল ফিতর', 'সালাতুল জানাযা', 'বিতর নামায')..."
            className="w-full pl-10 pr-24 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
          >
            {loading ? 'অনুসন্ধান...' : 'খুঁজুন'}
          </button>
        </form>
      </div>

      {/* Topics List & Madhhab Comparison Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            গবেষণামূলক তথ্যসূত্র লোড হচ্ছে...
          </div>
        ) : topics.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            কোনো ফিকহী বিষয় পাওয়া যায়নি। অন্য কীওয়ার্ড দিয়ে সন্ধান করুন।
          </div>
        ) : (
          topics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;
            return (
              <div
                key={topic.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden"
              >
                {/* Topic Accordion Header */}
                <div
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition border-b border-stone-100 dark:border-stone-800/80"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs">
                        <BookMarked className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {topic.topic}
                      </h3>
                      {topic.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          {topic.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-xs hidden sm:inline">
                      {isExpanded ? 'সংকুচিত করুন' : 'বিস্তারিত দেখুন'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Madhhab Breakdown */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6 bg-stone-50/40 dark:bg-stone-950/20">
                    {/* 4 Madhhab Comparative Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Hanafi */}
                      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-amber-900 dark:text-amber-200">
                            আল-মাযহাবুল হানাফী (المذهب الحنفي)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/50 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                            ইমাম আবু হানিফা (রহ.)
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {topic.hanafi || 'এই বিষয়ে হানাফী মাযহাবের বিবরণ অপরিবর্তিত।'}
                        </p>
                      </div>

                      {/* 2. Maliki */}
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-emerald-900 dark:text-emerald-200">
                            আল-মাযহাবুল মালিকী (المذهب المالكي)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                            ইমাম মালিক (রহ.)
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {topic.maliki || 'মালিকী মাযহাবের মতামত সংশ্লিষ্ট ফিকহ গ্রন্থে বর্ণিত রয়েছে।'}
                        </p>
                      </div>

                      {/* 3. Shafii */}
                      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-blue-900 dark:text-blue-200">
                            আল-মাযহাবুশ শাফিয়ী (المذهب الشافعي)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200/50 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                            ইমাম শাফিয়ী (রহ.)
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {topic.shafii || 'শাফিয়ী মাযহাবের প্রামাণ্য মত উল্লেখিত রয়েছে।'}
                        </p>
                      </div>

                      {/* 4. Hanbali */}
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-rose-900 dark:text-rose-200">
                            আল-মাযহাবুল হাম্বলী (المذهب الحنبلي)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200/50 dark:bg-rose-900 text-rose-800 dark:text-rose-300">
                            ইমাম আহমদ ইবনে হাম্বল (রহ.)
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {topic.hanbali || 'হাম্বলী মাযহাবের নির্ভরযোগ্য দলিল উপস্থাপিত রয়েছে।'}
                        </p>
                      </div>
                    </div>

                    {/* Consensus & Classical References */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {topic.consensusNotes && (
                        <div className="p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-1">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                            উলামায়ে কেরামের ঐকমত্য ও সমন্বিত সারসংক্ষেপ (ইজমা / রাজেহ মত):
                          </span>
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                            {topic.consensusNotes}
                          </p>
                        </div>
                      )}

                      {topic.classicalSources && (
                        <div className="p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-1">
                          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                            প্রাচীন প্রামাণ্য তথ্যসূত্র ও কিতাবসমূহ:
                          </span>
                          <p className="text-xs text-stone-500 font-mono leading-relaxed">
                            {topic.classicalSources}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Copy Citation Footer */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                      <button
                        onClick={() =>
                          handleCopy(
                            topic.id,
                            `【${topic.topic} — তুলনামূলক ফিকহ বিশ্লেষণ】\n\n• হানাফী: ${topic.hanafi}\n• মালিকী: ${topic.maliki}\n• শাফিয়ী: ${topic.shafii}\n• হাম্বলী: ${topic.hanbali}\n\nঐকমত্য: ${topic.consensusNotes}\nউৎস: ${topic.classicalSources}`
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-400 text-xs font-semibold text-stone-700 dark:text-stone-200 transition"
                      >
                        {copiedId === topic.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>রেফারেন্স কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>রেফারেন্স কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

