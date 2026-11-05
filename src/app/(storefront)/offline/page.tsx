'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WifiOff, Wifi, RefreshCw, BookOpen, ArrowLeft, Home, Sparkles, AlertCircle } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      // Ping a lightweight static endpoint
      const res = await fetch('/favicon.ico', { cache: 'no-store' });
      if (res.ok) {
        setIsOnline(true);
        window.location.href = '/';
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 font-bengali">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Brand Crest + Offline Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            {isOnline ? (
              <Wifi className="w-10 h-10 text-emerald-500 animate-pulse" />
            ) : (
              <WifiOff className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-bounce" />
            )}
          </div>
          <span
            className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md ${
              isOnline ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {isOnline ? 'অনলাইন' : 'অফলাইন'}
          </span>
        </div>

        {/* Content Heading */}
        <div className="space-y-2">
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            {isOnline ? 'ইন্টারনেট পুনঃসংযোগ স্থাপিত হয়েছে!' : 'ইন্টারনেট সংযোগ বিচ্ছিন্ন রয়েছে'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {isOnline
              ? 'আপনার ইন্টারনেট সংযোগ সক্রিয়। হোমপেজে ফিরে যেতে পারেন।'
              : 'আপনি বর্তমানে অফলাইনে রয়েছেন। আগে ভিজিট করা নির্বাচিত পৃষ্ঠাগুলো ক্যাশ থেকে পড়তে পারবেন। তবে নতুন বই অর্ডার বা পেমেন্ট সম্পন্ন করতে ইন্টারনেট সংযোগ প্রয়োজন।'}
          </p>
        </div>

        {/* Informational Alert Box */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 text-left flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-stone-800 dark:text-stone-200">
              অফলাইন ক্যাশিং সুরক্ষা নীতি:
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
              নিরাপত্তার স্বার্থে কার্ট, চেকআউট ও পেমেন্টের ব্যক্তিগত তথ্য অফলাইনে ক্যাশ করা হয় না।
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/20 hover:from-amber-700 hover:to-amber-800 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'সংযোগ পরীক্ষা করা হচ্ছে...' : 'পুনরায় সংযোগ পরীক্ষা করুন'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/"
              className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>হোমপেজ</span>
            </Link>
            <Link
              href="/books"
              className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 transition flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>বই সম্ভার</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

