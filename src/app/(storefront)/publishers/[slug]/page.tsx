import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/books/BookCard';
import { Building2, BookOpen } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface PublisherPageProps {
  params: {
    slug: string;
  };
}

export default async function PublisherPage({ params }: PublisherPageProps) {
  const { slug } = params;

  const publisher = await prisma.publisher.findUnique({
    where: { slug },
    include: {
      books: {
        include: { author: true, category: true },
      },
    },
  });

  if (!publisher) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center flex-shrink-0">
          <img
            src={publisher.logoUrl || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=200'}
            alt={publisher.name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-xs text-shubban-gold uppercase font-bold tracking-wider">
            প্রকাশনা প্রতিষ্ঠান
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
            {publisher.name}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
            {publisher.description}
          </p>
          <span className="text-xs text-stone-500 block">
            সংরক্ষিত বইয়ের সংখ্যা: {toBengaliNumber(publisher.books.length)}টি
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800">
          {publisher.name}-এর গ্রন্থাবলি
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {publisher.books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </div>
    </div>
  );
}
