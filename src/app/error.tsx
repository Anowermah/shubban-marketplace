'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);

    // If chunk loading, factory execution, or hydration failed due to stale cache/service worker, flush CacheStorage
    const isCacheOrHydrationErr =
      error?.message?.includes('reading \'call\'') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('factory') ||
      error?.message?.includes('Hydration') ||
      error?.message?.includes('hydration') ||
      error?.message?.includes('initial UI does not match');

    if (isCacheOrHydrationErr && typeof window !== 'undefined') {
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
      if ('serviceWorker' in navigator && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
        });
      }
    }
  }, [error]);

  const handleReset = async () => {
    try {
      if (typeof reset === 'function') {
        reset();
      }
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            await reg.unregister();
          } else {
            await reg.update();
          }
        }
      }
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 font-bengali py-16">
      <div className="max-w-md w-full bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 p-8 text-center shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800/60 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            সাময়িক সমস্যা দেখা দিয়েছে
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            দুঃখিত, তথ্য লোড করতে একটি অপ্রত্যাশিত কারিগরি ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা আমাদের গ্রাহক সেবায় যোগাযোগ করুন।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>পুনরায় লোড করুন</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-stone-200 dark:border-stone-700"
          >
            <Home className="w-4 h-4" />
            <span>হোমপেজে ফিরুন</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex items-center justify-between px-2">
          <span>হেল্পলাইন: +৮৮০ ১৭১১-০০০০০০</span>
          <Link href="/login" className="text-shubban-gold hover:underline">
            লগইন পেজ
          </Link>
        </div>
      </div>
    </div>
  );
}

