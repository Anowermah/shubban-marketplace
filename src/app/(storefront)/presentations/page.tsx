import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Presentation as PresIcon, Download, Layers, Calendar, ArrowLeft } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export default async function PresentationsPage() {
  const presentations = await prisma.presentation.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Title */}
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
          <PresIcon className="w-4 h-4" />
          <span>সেমিনার ও কনফারেন্স স্লাইড</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          প্রেজেন্টেশন ও স্লাইড ডেক সংকলন
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          জাতীয় ও আন্তর্জাতিক কনফারেন্স, সাহিত্য সেমিনার এবং গবেষকদের প্রস্তুতকৃত সচিত্র প্রেজেন্টেশন ও লেকচার ডেক।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presentations.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-mono bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  {p.fileType} • {toBengaliNumber(p.slidesCount)} স্লাইড
                </span>
                <span className="text-[11px]">{formatBengaliDate(p.eventDate)}</span>
              </div>

              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mb-2">
                {p.title}
              </h2>

              <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed mb-4">
                {p.description}
              </p>

              <div className="text-xs text-stone-500 space-y-0.5">
                <span className="block font-semibold text-stone-800 dark:text-stone-200">
                  উপস্থাপক: {p.presenter}
                </span>
                <span className="block text-stone-400">{p.institution}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
              <a
                href={p.fileUrl}
                download
                className="w-full py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-shubban-gold" />
                <span>স্লাইড ডাউনলোড করুন</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
