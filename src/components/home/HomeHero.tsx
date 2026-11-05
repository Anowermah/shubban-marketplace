'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Sparkles, ShieldCheck, ArrowRight, Library } from 'lucide-react';
import { HERO_HEADLINE, HERO_SUBHEAD } from '@/lib/constants';

export default function HomeHero() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-shubban-green via-shubban-green-900 to-shubban-green text-shubban-ivory py-16 lg:py-24 font-bengali">
      {/* Background Decorative Islamic/Literary Geometry Motif */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C49A45_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-shubban-gold/40 text-shubban-gold text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>বাংলা সাহিত্যের সমন্বিত ডিজিটাল আর্কাইভ ও পুস্তকপীঠ</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight sm:leading-tight">
            {HERO_HEADLINE}
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-lg text-shubban-ivory/80 leading-relaxed font-normal max-w-2xl mx-auto">
            {HERO_SUBHEAD}
          </p>

          {/* Prominent Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative flex items-center shadow-2xl rounded-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="বইয়ের নাম, লেখক, সাময়িকী বা গবেষণার বিষয় খুঁজুন..."
                className="w-full pl-12 pr-28 sm:pr-32 py-3.5 sm:py-4 rounded-full bg-white text-stone-900 placeholder-stone-500 text-sm sm:text-base font-bengali focus:outline-none focus:ring-4 focus:ring-shubban-gold/50 shadow-inner"
              />
              <Search className="absolute left-4 w-5 h-5 text-stone-400" />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 sm:py-3 rounded-full bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
              >
                <span>অনুসন্ধান</span>
                <ArrowRight className="w-4 h-4 hidden sm:inline" />
              </button>
            </form>
          </div>

          {/* Quick Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/digital-library"
              className="px-6 py-3 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-sm shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>ডিজিটাল লাইব্রেরীতে পড়ুন</span>
            </Link>

            <Link
              href="/books"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-sm border border-white/20 transition-transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Library className="w-4 h-4 text-shubban-gold" />
              <span>মুদ্রিত বইয়ের ক্যাটালগ</span>
            </Link>
          </div>

          {/* Feature Highlights Trust Grid */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="block text-shubban-gold font-bold text-base sm:text-lg">ইন-ব্রাউজার রিডার</span>
              <span className="text-xs text-shubban-ivory/70">ডাউনলোড ছাড়াই উচ্চমানের সরাসরি পাঠ</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="block text-shubban-gold font-bold text-base sm:text-lg">চিরায়ত ও আধুনিক</span>
              <span className="text-xs text-shubban-ivory/70">হাজারো দুর্লভ ক্লাসিক ও সমকালীন প্রকাশনা</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="block text-shubban-gold font-bold text-base sm:text-lg">দেশব্যাপী ডেলিভারি</span>
              <span className="text-xs text-shubban-ivory/70">ক্যাশ অন ডেলিভারি ও দ্রুত পার্সেল সুবিধা</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="block text-shubban-gold font-bold text-base sm:text-lg">গবেষণা ও সাময়িকী</span>
              <span className="text-xs text-shubban-ivory/70">জার্নাল, আর্কাইভ ও উন্মুক্ত প্রশ্নোত্তর</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
