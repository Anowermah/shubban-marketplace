import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/books/BookCard';
import { Library, BookOpen, Sparkles, Shield, Bookmark, CheckCircle2 } from 'lucide-react';

interface DigitalLibraryProps {
  searchParams: {
    free?: string;
    category?: string;
  };
}

export default async function DigitalLibraryPage({ searchParams }: DigitalLibraryProps) {
  const { free, category } = searchParams;

  const where: any = {
    isDigitalAvailable: true,
  };

  if (free === 'true') {
    where.isFree = true;
  }

  if (category) {
    where.category = { slug: category };
  }

  const [digitalBooks, categories] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        author: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Hero Banner for Digital Library */}
      <div className="rounded-2xl bg-gradient-to-r from-shubban-green via-shubban-green-900 to-shubban-green p-8 sm:p-12 text-shubban-ivory shadow-lg border border-shubban-gold/40 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-shubban-gold text-shubban-green-950">
            <Library className="w-4 h-4" />
            <span>শুব্বান অনলাইন পাঠকক্ষ ও ডিজিটাল সংগ্রহশালা</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
            ইন-ব্রাউজার ডিজিটাল রিডিং প্ল্যাটফর্ম
          </h1>
          <p className="text-sm sm:text-base text-shubban-ivory/80 leading-relaxed">
            কোনো অ্যাপ ডাউনলোড ছাড়াই যেকোনো ডিভাইসে সরাসরি পড়ুন দুর্লভ বাংলা ক্লাসিক, পাণ্ডুলিপি, গবেষণা প্রবন্ধ এবং সাময়িকী। বুকমার্ক, নাইট মোড ও রিডিং প্রগ্রেস সিঙ্ক সুবিধা সহ।
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/digital-library?free=true"
              className="px-5 py-2.5 rounded-xl bg-shubban-gold text-shubban-green-950 font-bold text-xs shadow hover:bg-shubban-gold-hover transition-all"
            >
              উন্মুক্ত ও ফ্রি বইসমূহ
            </Link>
            <Link
              href="/membership"
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium text-xs border border-white/20 hover:bg-white/20 transition-all"
            >
              সদস্যপদ নিয়ে প্রিমিয়াম বই আনলক করুন
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
          <Link
            href="/digital-library"
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
              !free
                ? 'bg-shubban-green text-shubban-gold shadow'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            সকল ডিজিটাল বই ({digitalBooks.length})
          </Link>
          <Link
            href="/digital-library?free=true"
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
              free === 'true'
                ? 'bg-shubban-green text-shubban-gold shadow'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            সম্পূর্ণ উন্মুক্ত ও মুক্ত PDF
          </Link>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
        {digitalBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
