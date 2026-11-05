'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  BookOpen,
  Send,
  Copy,
  Check,
  RefreshCw,
  Download,
  Share2,
  Sliders,
  Type,
  BookMarked,
  ArrowRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function AiStudioContentStudioClient() {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<'ARTICLE' | 'ESSAY' | 'EDITORIAL' | 'SUMMARY'>('ARTICLE');
  const [tone, setTone] = useState<'SCHOLARLY' | 'EDITORIAL' | 'EDUCATIONAL' | 'LITERARY'>('SCHOLARLY');
  const [wordLength, setWordLength] = useState<'SHORT' | 'MEDIUM' | 'DETAILED'>('MEDIUM');
  const [includeCitations, setIncludeCitations] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || generating) return;

    setGenerating(true);
    setGeneratedContent('');

    try {
      const res = await fetch('/api/admin/ai-studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `নিম্নোক্ত বিষয়ের ওপর একটি সুসংগঠিত ${
            contentType === 'ARTICLE'
              ? 'গবেষণাধর্মী প্রবন্ধ'
              : contentType === 'ESSAY'
              ? 'ইসলামিক রচনা'
              : contentType === 'EDITORIAL'
              ? 'সম্পাদকীয় নিবন্ধ'
              : 'সারসংক্ষেপ'
          } তৈরি করুন:\nবিষয়: "${topic}"\nশৈলী: ${tone}\nদৈর্ঘ্য: ${wordLength}\nতথ্যসূত্র সংযোজন: ${
            includeCitations ? 'হ্যাঁ' : 'না'
          }\nঅনুগ্রহ করে উপযুক্ত শিরোনাম, ভূমিকা, মূল বিশ্লেষণ, প্রাসঙ্গিক কুরআন ও হাদিসের দলিল এবং উপসংহার সহ প্রস্তুত করুন।`,
          mode: 'MANUAL',
          agentKey: 'editorial-ai',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTitle(topic);
        setGeneratedContent(data.content);
      } else {
        alert(data.error || 'কনটেন্ট প্রস্তুত করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার সংযোগ ত্রুটি');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = generatedContent ? generatedContent.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 120);

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                এআই কনটেন্ট স্টুডিও ও দীর্ঘ প্রবন্ধ রচনা
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                EDITORIAL ENGINE
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              মাসিক ম্যাগাজিন, সাময়িকী, প্রবন্ধ ও ইসলামিক জার্নালের জন্য উচ্চমানের বিশ্লেষণধর্মী লেখা প্রস্তুত করুন। স্বয়ংক্রিয়ভাবে শিরোনাম, সাব-হেডিং এবং তথ্যসূত্রের কাঠামো তৈরি হবে।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/publishing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs text-stone-700 dark:text-stone-200 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>প্রকাশনা ড্যাশবোর্ড</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>কনটেন্ট কনফিগারেশন</span>
            </h2>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                প্রবন্ধ বা বিষয়ের নাম:
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: 'সমকালীন অর্থনীতিতে ইসলামী ব্যাংকিং ব্যবস্থার প্রাসঙ্গিকতা' বা 'রমজানের সামাজিক ও আত্মশুদ্ধিমূলক তাৎপর্য'..."
                className="w-full p-3 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Content Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                কনটেন্টের ধরন:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'ARTICLE', label: 'গবেষণাধর্মী প্রবন্ধ' },
                  { id: 'ESSAY', label: 'ইসলামিক রচনা' },
                  { id: 'EDITORIAL', label: 'সম্পাদকীয় নিবন্ধ' },
                  { id: 'SUMMARY', label: 'সারসংক্ষেপ ও রূপরেখা' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContentType(item.id as any)}
                    className={`py-2 px-3 rounded-xl border text-center transition font-medium ${
                      contentType === item.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone & Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                ভাষারীতি ও শৈলী:
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="SCHOLARLY">দ্বীনি ও গবেষণাধর্মী (Scholarly & Rigorous)</option>
                <option value="EDITORIAL">সম্পাদকীয় ও প্রাতিষ্ঠানিক (Formal & Editorial)</option>
                <option value="EDUCATIONAL">সহজবোধ্য ও শিক্ষামূলক (Accessible & Instructive)</option>
                <option value="LITERARY">সৃজনশীল ও মননশীল (Literary & Thoughtful)</option>
              </select>
            </div>

            {/* Target Length */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                দৈর্ঘ্য পরিসর:
              </label>
              <div className="flex gap-2 text-xs">
                {[
                  { id: 'SHORT', label: 'সংক্ষিপ্ত (৩০০-৫০০ শব্দ)' },
                  { id: 'MEDIUM', label: 'মাঝারি (৬০০-১০০০ শব্দ)' },
                  { id: 'DETAILED', label: 'বিস্তারিত (১২০০+ শব্দ)' },
                ].map((len) => (
                  <button
                    key={len.id}
                    type="button"
                    onClick={() => setWordLength(len.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-center transition font-medium text-[11px] ${
                      wordLength === len.id
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {len.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Citations */}
            <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 text-xs">
              <span className="text-stone-700 dark:text-stone-300">কুরআন ও হাদিসের দলিল সংযোজন</span>
              <button
                type="button"
                onClick={() => setIncludeCitations(!includeCitations)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  includeCitations ? 'bg-emerald-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Generate Trigger */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!topic.trim() || generating}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition active:scale-95"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>লেখা প্রস্তুত হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>প্রবন্ধ প্রস্তুত করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Content Workbench (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm flex flex-col min-h-[560px]">
            {/* Workbench Top Bar */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span>প্রিভিউ ও এডিটর</span>
                </span>
                {generatedContent && (
                  <span className="text-[11px] text-stone-400">
                    {toBengaliNumber(wordCount)} শব্দ • আনুমানিক পাঠের সময়: {toBengaliNumber(readingTime)} মিনিট
                  </span>
                )}
              </div>

              {generatedContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs text-stone-700 dark:text-stone-200 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span>কপি</span>
                      </>
                    )}
                  </button>
                  <Link
                    href={`/admin/magazines/create?prefillTitle=${encodeURIComponent(title)}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <span>প্রকাশনায় পাঠান</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Content Preview Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              {!generatedContent ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-3 py-16">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                      কোনো কনটেন্ট এখনও তৈরি হয়নি
                    </p>
                    <p className="text-xs text-stone-400 max-w-sm">
                      বামে বিষয় ও পছন্দের কনফিগারেশন নির্ধারণ করে &apos;প্রবন্ধ প্রস্তুত করুন&apos; বাটনে ক্লিক করুন।
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-stone-900 dark:text-stone-100">
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={20}
                    className="w-full p-4 rounded-xl bg-transparent border border-stone-100 dark:border-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans resize-y"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

