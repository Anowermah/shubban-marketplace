'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Scale,
  MessageCircle,
} from 'lucide-react';

const SUGGESTED_TOPICS = [
  {
    title: 'নামাজের শর্ত ও আরকানসমূহ',
    query: 'নামাজের শর্তাবলী ও রুকনসমূহ কুরআন ও হাদিসের আলোকে বুঝিয়ে দিন',
    tag: 'ইবাদত',
  },
  {
    title: 'রোজা ভঙ্গের কারণ ও রোজা রক্ষার নিয়ম',
    query: 'রোজা ভঙ্গের কারণ ও রোজা রক্ষার মাসআলা কি?',
    tag: 'সিয়াম',
  },
  {
    title: 'যাকাতের নিসাব ও বণ্টনের খাত',
    query: 'যাকাত কাদের উপর ফরজ এবং নিসাবের পরিমাণ কত?',
    tag: 'যাকাত',
  },
  {
    title: 'সকল কাজের ভিত্তি নিয়তের উপর',
    query: 'সকল কাজের প্রতিদান নিয়তের উপর নির্ভর করে — হাদিসটির ব্যাখ্যা',
    tag: 'হাদিস',
  },
  {
    title: 'তারাভীহর রাকাত সংখ্যা ও মাযহাবীয় পর্যালোচনা',
    query: 'তারাভীহর রাকাত সংখ্যা নিয়ে চার মাযহাবের অভিমত ও শাস্ত্রীয় দলিল',
    tag: 'গবেষণা',
  },
];

export default function HomeIslamicAiSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 text-white shadow-2xl border border-emerald-800/40 p-8 sm:p-12">
        {/* Subtle decorative background Islamic pattern elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-shubban-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>প্রামাণ্য ইসলামিক এআই নলেজ অ্যাসিস্ট্যান্ট</span>
          </div>

          {/* Heading */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            আপনার ইসলামিক প্রশ্নের উত্তর খুঁজুন
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            পবিত্র কুরআন, নির্ভরযোগ্য তাফসির ও যাচাইকৃত হাদিসের আলোকে ইসলামিক বিষয়ে জানুন ও শিখুন। কৃত্রিম অনুমান নয়—বিশুদ্ধ দলিলের ভিত্তিতে বিশ্বস্ত সমাধান।
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              href="/islamic-ai"
              className="px-6 py-3.5 rounded-2xl bg-shubban-gold hover:bg-shubban-gold-hover text-emerald-950 font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>AI-কে প্রশ্ন করুন</span>
            </Link>

            <Link
              href="/islamic-ai/quran"
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base border border-white/20 backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>কুরআন অনুসন্ধান</span>
            </Link>

            <Link
              href="/islamic-ai/hadith"
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base border border-white/20 backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-emerald-300" />
              <span>হাদিস অনুসন্ধান</span>
            </Link>

            <Link
              href="/islamic-ai/research"
              className="px-5 py-3.5 rounded-2xl bg-emerald-800/40 hover:bg-emerald-800/60 text-emerald-200 font-medium text-sm sm:text-base border border-emerald-600/30 backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>মাযহাব ভিত্তিক গবেষণা</span>
            </Link>
          </div>

          {/* Suggested Topic Cards */}
          <div className="pt-6 border-t border-emerald-800/60">
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-3">
              জনপ্রিয় ইসলামিক জিজ্ঞাসা — সরাসরি প্রশ্ন করুন:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SUGGESTED_TOPICS.map((topic, i) => (
                <Link
                  key={i}
                  href={`/islamic-ai?q=${encodeURIComponent(topic.query)}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-amber-400/40 text-xs sm:text-sm text-emerald-50 transition-all duration-150 group"
                >
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900 text-amber-300 font-semibold">
                    {topic.tag}
                  </span>
                  <span>{topic.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left max-w-3xl mx-auto">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/20 border border-emerald-800/40">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">১০০% বিশুদ্ধ সনদ ও দলিল</span>
                <span className="text-emerald-200/80">কুরআনুল কারীম ও সহীহ হাদিস</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/20 border border-emerald-800/40">
              <Scale className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">৪ মাযহাবের ভারসাম্য</span>
                <span className="text-emerald-200/80">হানাফী, মালিকী, শাফেয়ী, হাম্বলী</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/20 border border-emerald-800/40">
              <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">জিরো হ্যালুসিনেশন ফিল্টার</span>
                <span className="text-emerald-200/80">বানোয়াট বা জাল উক্তি নিষিদ্ধ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

