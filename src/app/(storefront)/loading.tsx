import React from 'react';

export default function StorefrontLoading() {
  return (
    <div className="space-y-12 sm:space-y-16 pb-16 font-bengali animate-pulse max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. Hero Promo Slider Skeleton */}
      <div className="w-full h-64 sm:h-96 md:h-[420px] rounded-3xl bg-stone-200 dark:bg-stone-800/60 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer" />
        <div className="p-8 sm:p-12 space-y-4 max-w-lg">
          <div className="w-24 h-5 rounded-full bg-stone-300 dark:bg-stone-700" />
          <div className="w-3/4 h-10 rounded-xl bg-stone-300 dark:bg-stone-700" />
          <div className="w-1/2 h-6 rounded-lg bg-stone-300 dark:bg-stone-700" />
          <div className="w-36 h-11 rounded-xl bg-stone-300 dark:bg-stone-700 mt-4" />
        </div>
      </div>

      {/* 2. Featured Category Icons Skeleton */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/50 space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-stone-300 dark:bg-stone-700" />
            <div className="w-16 h-3 rounded bg-stone-300 dark:bg-stone-700" />
          </div>
        ))}
      </div>

      {/* 3. Flash Sale Banner Skeleton */}
      <div className="h-16 rounded-2xl bg-stone-200 dark:bg-stone-800/80 border border-stone-300/40 dark:border-stone-700 flex items-center justify-between px-6">
        <div className="w-48 h-5 rounded bg-stone-300 dark:bg-stone-700" />
        <div className="w-32 h-8 rounded-xl bg-stone-300 dark:bg-stone-700" />
      </div>

      {/* 4. Book Grid Showcase Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="space-y-2">
            <div className="w-28 h-4 rounded bg-stone-300 dark:bg-stone-700" />
            <div className="w-48 h-7 rounded bg-stone-300 dark:bg-stone-700" />
          </div>
          <div className="w-20 h-5 rounded bg-stone-300 dark:bg-stone-700" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/40 overflow-hidden space-y-3 p-3 flex flex-col"
            >
              <div className="w-full aspect-[2/3] rounded-xl bg-stone-300 dark:bg-stone-700" />
              <div className="w-3/4 h-4 rounded bg-stone-300 dark:bg-stone-700" />
              <div className="w-1/2 h-3 rounded bg-stone-300 dark:bg-stone-700" />
              <div className="pt-2 flex items-center justify-between mt-auto">
                <div className="w-16 h-5 rounded bg-stone-300 dark:bg-stone-700" />
                <div className="w-10 h-7 rounded-lg bg-stone-300 dark:bg-stone-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
