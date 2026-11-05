import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/books/BookCard';
import { Users, BookOpen, FileText, ArrowLeft } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface AuthorPageProps {
  params: {
    slug: string;
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = params;

  const author = await prisma.author.findUnique({
    where: { slug },
    include: {
      books: {
        include: { author: true, category: true },
      },
      articles: {
        include: { author: true, category: true },
      },
    },
  });

  if (!author) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-12">
      {/* Author Bio Banner */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl border-4 border-shubban-gold/40 flex-shrink-0">
          <img
            src={author.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
            alt={author.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-xs text-shubban-gold uppercase font-bold tracking-wider">
            লেখক ও গবেষক প্রোফাইল
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
            {author.name}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
            {author.bio}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-stone-500">
            <span>সংরক্ষিত বই: {toBengaliNumber(author.books.length)}টি</span>
            <span>•</span>
            <span>প্রবন্ধ: {toBengaliNumber(author.articles.length)}টি</span>
          </div>
        </div>
      </div>

      {/* Author Books */}
      <div className="space-y-6">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800">
          {author.name}-এর গ্রন্থসমূহ
        </h2>
        {author.books.length === 0 ? (
          <p className="text-xs text-stone-500 italic">এই লেখকের কোনো বই এখনও যুক্ত হয়নি।</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {author.books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>

      {/* Author Articles */}
      {author.articles.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800">
            {author.name}-এর প্রকাশিত প্রবন্ধ ও গবেষণামূলক লেখা
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {author.articles.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm"
              >
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-shubban-gold mb-2">
                  <Link href={`/articles/${art.slug}`}>{art.title}</Link>
                </h3>
                <p className="text-xs text-stone-500 line-clamp-2">{art.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
