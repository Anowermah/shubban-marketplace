import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Compass,
  Feather,
  Landmark,
  Newspaper,
  GraduationCap,
  HeartHandshake,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  href: string;
  icon: React.ReactNode;
  bgLight: string;
  countText: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: '1',
    name: 'সাহিত্য ও গল্প',
    slug: 'literature',
    href: '/books?category=literature',
    icon: <BookOpen className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />,
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/40',
    countText: 'চিরায়ত ও সমকালীন',
  },
  {
    id: '2',
    name: 'ইসলামিক বই ও তাফসীর',
    slug: 'islamic',
    href: '/books?category=islamic',
    icon: <Compass className="w-6 h-6 text-teal-700 dark:text-teal-300" />,
    bgLight: 'bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-800/40',
    countText: 'কুরআন, হাদিস ও ফিকহ',
  },
  {
    id: '3',
    name: 'আতর ও লাইফস্টাইল',
    slug: 'islamic-lifestyle',
    href: '/books?category=islamic-lifestyle',
    icon: <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    bgLight: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-800/40',
    countText: 'খাঁটি আতর ও জায়নামাজ',
  },
  {
    id: '4',
    name: 'উপন্যাস ও ফিকশন',
    slug: 'novel',
    href: '/books?category=novel',
    icon: <Feather className="w-6 h-6 text-blue-700 dark:text-blue-300" />,
    bgLight: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-800/40',
    countText: 'জনপ্রিয় ক্লাসিক উপন্যাস',
  },
  {
    id: '5',
    name: 'ইতিহাস ও ঐতিহ্য',
    slug: 'history',
    href: '/books?category=history',
    icon: <Landmark className="w-6 h-6 text-purple-700 dark:text-purple-300" />,
    bgLight: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-800/40',
    countText: 'বাংলার ইতিহাস ও বিশ্ব ঐতিহ্য',
  },
  {
    id: '6',
    name: 'সাময়িকী ও জার্নাল',
    slug: 'magazines',
    href: '/magazines',
    icon: <Newspaper className="w-6 h-6 text-orange-700 dark:text-orange-300" />,
    bgLight: 'bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-800/40',
    countText: 'মাসিক ও সাপ্তাহিক সংখ্যা',
  },
  {
    id: '7',
    name: 'ডিজিটাল লাইব্রেরী (PDF)',
    slug: 'digital-library',
    href: '/digital-library',
    icon: <GraduationCap className="w-6 h-6 text-rose-700 dark:text-rose-300" />,
    bgLight: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-800/40',
    countText: 'সরাসরি ইন-ব্রাউজার রিডার',
  },
  {
    id: '8',
    name: 'আস-সুন্নাহ সদকাহ ফান্ড',
    slug: 'donations',
    href: '/donations',
    icon: <HeartHandshake className="w-6 h-6 text-green-700 dark:text-green-300" />,
    bgLight: 'bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-800/40',
    countText: '১০০% আমানতদারিতা ও রসিদ',
  },
];

export default function CategoryIconGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-bengali">
      <div className="flex items-end justify-between mb-6 pb-3 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
            <Layers className="w-4 h-4" />
            <span>বিষয়ভিত্তিক ক্যাটালগ</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            জনপ্রিয় ক্যাটাগরি ও বিভাগসমূহ
          </h2>
        </div>
        <Link
          href="/books"
          className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
        >
          <span>সকল ক্যাটাগরি</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className={`group p-4 rounded-2xl border text-center flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${cat.bgLight}`}
          >
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200/50 dark:border-stone-700 group-hover:scale-110 transition-transform mb-2.5">
              {cat.icon}
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors line-clamp-1">
              {cat.name}
            </h3>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
              {cat.countText}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

