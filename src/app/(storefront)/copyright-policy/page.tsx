import React from 'react';

export default function CopyrightPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-8">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          কপিরাইট ও ডিজিটাল কনটেন্ট নীতিমালা
        </h1>
        <p className="text-xs text-stone-500 mt-1">সর্বশেষ পরিমার্জন: অক্টোবর ২০২৬</p>
      </div>

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">১. স্বত্বাধিকার ও উন্মুক্ত ক্ষেত্র (Public Domain)</h2>
        <p>
          শুব্বান লাইব্রেরীতে প্রদর্শিত বইসমূহ দুটি মূল ভাগে বিভক্ত: (ক) যেসব সাহিত্যকর্ম কপিরাইট আইন অনুযায়ী উন্মুক্ত ক্ষেত্রে (Public Domain) প্রবেশ করেছে এবং (খ) যেসব বই ও সাময়িকী সংশ্লিষ্ট লেখক, উত্তরাধিকারী বা প্রকাশনা সংস্থার বৈধ অনুমতি ও চুক্তির ভিত্তিতে ডিজিটাল সংস্করণে প্রকাশিত হয়েছে।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">২. কপিরাইট অভিযোগ ও অপসারণ (Takedown Workflow)</h2>
        <p>
          যদি কোনো স্বত্বাধিকারী মনে করেন তাঁর কোনো সাহিত্যকর্ম অননুমোদিতভাবে প্রদর্শিত হচ্ছে, তবে উপযুক্ত প্রমাণসহ আমাদের লিগ্যাল সেলে (legal@shubbanlibrary.com) লিখিতভাবে অবহিত করা মাত্রই তা ৪৮ ঘণ্টার মধ্যে পর্যালোচনা করে অপসারণ করা হবে।
        </p>
      </div>
    </div>
  );
}

