import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Users, BookOpen, ArrowRight } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AuthorsPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 12;

  const [totalAuthors, authors] = await Promise.all([
    prisma.author.count(),
    prisma.author.findMany({
      include: {
        books: true,
        articles: true,
      },
      orderBy: { name: 'asc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalAuthors / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
          <Users className="w-4 h-4" />
          <span>বাঙালি মনীষা ও সাহিত্য সাধক</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          লেখক ও গবেষকবৃন্দ
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          চিরায়ত সাহিত্যের দিকপাল থেকে শুরু করে আধুনিক গবেষক ও চিন্তাবিদদের জীবন, পরিচিতি এবং সংরক্ষিত রচনাবলি।
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {authors.map((author) => (
          <Link
            key={author.id}
            href={`/authors/${author.slug}`}
            className="group bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-md hover:border-shubban-gold/50 transition-all text-center flex flex-col items-center"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-md mb-4 border-2 border-shubban-gold/30 group-hover:scale-105 transition-transform">
              <img
                src={author.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors">
              {author.name}
            </h2>
            <span className="text-[11px] text-stone-400 font-sans">{author.nameEn}</span>
            <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
              {author.bio}
            </p>
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 w-full flex items-center justify-around text-xs text-stone-500">
              <span>{toBengaliNumber(author.books.length)}টি বই</span>
              <span>{toBengaliNumber(author.articles.length)}টি প্রবন্ধ</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Unified Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalAuthors}
        itemsPerPage={pageSize}
        itemName="লেখক"
        pageUrlTemplate="/authors?page=[page]"
      />
    </div>
  );
}
