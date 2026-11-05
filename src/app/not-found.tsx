import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, Search, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 font-bengali py-16">
      <div className="max-w-md w-full bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 p-8 text-center shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-shubban-gold mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-sm">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-shubban-gold uppercase tracking-wider">
            ৪০৪ • পৃষ্ঠাটি পাওয়া যায়নি
          </span>
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            কাঙ্ক্ষিত পৃষ্ঠাটি বিদ্যমান নেই
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            আপনি যে ঠিকানাটি খুঁজছেন তা মুছে ফেলা হয়ে থাকতে পারে, অথবা এর লিংক পরিবর্তিত হয়েছে।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>হোমপেজে ফিরুন</span>
          </Link>

          <Link
            href="/books"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-stone-200 dark:border-stone-700"
          >
            <BookOpen className="w-4 h-4" />
            <span>বইয়ের ক্যাটালগ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

