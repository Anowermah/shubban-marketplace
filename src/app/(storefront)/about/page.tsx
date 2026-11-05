import React from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, ShieldCheck, Heart, Award, Users } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Logo size="lg" showTagline={false} />
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100">
          আমাদের পরিচিতি ও লক্ষ্য
        </h1>
        <p className="text-base text-shubban-gold font-semibold">
          “{SITE_TAGLINE}”
        </p>
      </div>

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 shadow-sm space-y-8 text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
        <section className="space-y-3">
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            শুব্বান লাইব্রেরীর সূচনা
          </h2>
          <p>
            শুব্বান লাইব্রেরী (Shubban Library) একটি আধুনিক, পূর্ণাঙ্গ ও সমন্বিত বাংলা ডিজিটাল লাইব্রেরী এবং অনলাইন বুকস্টোর। হাজার বছরের ঐতিহ্যবাহী বাংলা সাহিত্য, প্রাচীন পাণ্ডুলিপি, দর্শন, ইতিহাস এবং মননশীল চিন্তার উত্তরাধিকারকে আধুনিক তথ্যপ্রযুক্তির সহায়তায় বিশ্বজুড়ে বাংলা ভাষাভাষীদের নিকট সহজে পৌঁছে দেওয়ার অঙ্গীকার নিয়ে আমাদের এই যাত্রা।
          </p>
        </section>

        <section className="space-y-3" id="vision">
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            আমাদের লক্ষ্য ও দর্শন
          </h2>
          <p>
            আমরা বিশ্বাস করি—একটি চিন্তাশীল, প্রজ্ঞাবান ও মননশীল জাতি গঠনে মানসম্মত বইয়ের কোনো বিকল্প নেই। তথ্যবিস্ফোরণের যুগে অগভীর পাঠের ভিড়ে গভীর চিন্তাচর্চা, সাহিত্য সমালোচনা এবং একাডেমিক গবেষণাকে উৎসাহিত করা শুব্বান লাইব্রেরীর মূল অভীষ্ট।
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 font-sans not-prose">
          <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 space-y-2">
            <BookOpen className="w-6 h-6 text-shubban-gold" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">মুক্ত ডিজিটাল পাঠকক্ষ</h3>
            <p className="text-xs text-stone-500">কোনো খরচ ছাড়াই চিরায়ত বই ও সাময়িকী সরাসরি ইন-ব্রাউজারে পড়ার সুযোগ।</p>
          </div>

          <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 space-y-2">
            <ShieldCheck className="w-6 h-6 text-shubban-gold" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">প্রামাণ্য প্রকাশনা</h3>
            <p className="text-xs text-stone-500">১০০% আসল ও নির্ভুল মুদ্রিত সংস্করণ এবং অনুমোদিত ডিজিটাল কপিরাইট ডেলিভারি।</p>
          </div>

          <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 space-y-2">
            <Users className="w-6 h-6 text-shubban-gold" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">জ্ঞানভিত্তিক ফোরাম</h3>
            <p className="text-xs text-stone-500">লেখক, গবেষক ও পাঠকদের মাঝে উন্মুক্ত আলোচনা ও প্রশ্নোত্তর কমিউনিটি।</p>
          </div>
        </div>
      </div>
    </div>
  );
}

