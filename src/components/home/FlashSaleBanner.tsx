'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function FlashSaleBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 35,
    seconds: 48,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-bengali">
      <div className="rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Headline */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md hidden sm:block">
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 text-yellow-200 text-xs font-bold uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>লিমিটেড টাইম মেগা অফার</span>
            </div>
            <h3 className="font-serif text-lg sm:text-2xl font-bold">
              আজকের নির্বাচিত বই ও ইসলামিক লাইফস্টাইলে বিশেষ ছাড়!
            </h3>
            <p className="text-xs text-white/90">
              কুপন কোড <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">SHUBBAN10</span> ব্যবহারে পান অতিরিক্ত ১০% তাৎক্ষণিক ডিসকাউন্ট।
            </p>
          </div>
        </div>

        {/* Right Countdown & Action */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Clock className="w-4 h-4 text-yellow-300" />
            <span className="text-white/80">অফার শেষ হতে বাকি:</span>
            <div className="flex items-center gap-1 font-mono text-sm sm:text-base" suppressHydrationWarning>
              <span className="px-2 py-1 rounded bg-black/40 text-yellow-300">
                {toBengaliNumber(String(timeLeft.hours).padStart(2, '0'))}
              </span>
              <span>:</span>
              <span className="px-2 py-1 rounded bg-black/40 text-yellow-300">
                {toBengaliNumber(String(timeLeft.minutes).padStart(2, '0'))}
              </span>
              <span>:</span>
              <span className="px-2 py-1 rounded bg-black/40 text-yellow-300">
                {toBengaliNumber(String(timeLeft.seconds).padStart(2, '0'))}
              </span>
            </div>
          </div>

          <Link
            href="/books?discount=true"
            className="px-5 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-yellow-300 hover:text-rose-900 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>অফার লুফে নিন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

