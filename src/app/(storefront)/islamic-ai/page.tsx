import React, { Suspense } from 'react';
import { Metadata } from 'next';
import IslamicAiClient from '@/components/islamic-ai/IslamicAiClient';

export const metadata: Metadata = {
  title: 'ইসলামিক এআই নলেজ অ্যাসিস্ট্যান্ট | শুব্বান লাইব্রেরী',
  description: 'কুরআনুল কারীম, সহিহ হাদিস ও নির্ভরযোগ্য তাফসির ভিত্তিক প্রামাণ্য ইসলামিক নলেজ এআই সহকারী।',
};

export default function IslamicAiPage() {
  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 py-6 sm:py-10">
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 py-16 text-center text-stone-500 font-bengali">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">ইসলামিক এআই লোড হচ্ছে...</p>
          </div>
        }
      >
        <IslamicAiClient />
      </Suspense>
    </div>
  );
}

