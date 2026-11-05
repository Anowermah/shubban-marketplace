import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Building2, ArrowRight } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface PublishersPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function PublishersPage({ searchParams }: PublishersPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 12;

  const [totalPublishers, publishers] = await Promise.all([
    prisma.publisher.count(),
    prisma.publisher.findMany({
      include: {
        books: true,
        magazines: true,
      },
      orderBy: { name: 'asc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalPublishers / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      <div className="pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
          <Building2 className="w-4 h-4" />
          <span>প্রকাশনা প্রতিষ্ঠান ও জাতীয় একাডেমি</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          প্রকাশনা সংস্থাসমূহ
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          বাংলাদেশের শীর্ষস্থানীয় জ্ঞান ও সাহিত্য প্রকাশনা সংস্থা, জাতীয় একাডেমি ও প্রাতিষ্ঠানিক ক্যাটালগ।
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {publishers.map((pub) => (
          <Link
            key={pub.id}
            href={`/publishers/${pub.slug}`}
            className="group bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-md hover:border-shubban-gold/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow mb-4 bg-stone-100 dark:bg-stone-800 p-1 flex items-center justify-center">
                <img
                  src={pub.logoUrl || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=150'}
                  alt={pub.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors">
                {pub.name}
              </h2>
              <span className="text-[11px] text-stone-400 font-sans">{pub.nameEn}</span>
              <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                {pub.description}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
              <span>{toBengaliNumber(pub.books.length)}টি বই</span>
              <span className="text-shubban-gold font-bold">ক্যাটালগ দেখুন &rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalPublishers}
        itemsPerPage={pageSize}
        itemName="প্রকাশনী"
        pageUrlTemplate="/publishers?page=[page]"
      />
    </div>
  );
}
