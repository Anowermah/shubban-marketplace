import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { FileText, Plus, Eye, Clock, CheckCircle2, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import AdminArticlesClient from './AdminArticlesClient';

export const revalidate = 0;

interface AdminArticlesPageProps {
  searchParams: {
    status?: string;
    search?: string;
  };
}

export default async function AdminArticlesPage({ searchParams }: AdminArticlesPageProps) {
  const { status, search } = searchParams;

  const where: any = {};
  if (status && status !== 'ALL') {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
    ];
  }

  const [articles, totalCount, draftCount, reviewCount, publishedCount] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        author: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.article.count(),
    prisma.article.count({ where: { status: 'DRAFT' } }),
    prisma.article.count({ where: { status: 'REVIEW' } }),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
  ]);

  const authors = await prisma.author.findMany({ select: { id: true, name: true } });
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });

  return (
    <div className="space-y-6 font-bengali">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-shubban-gold" />
            <span>প্রবন্ধ ও সম্পাদকীয় প্রকাশনা ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট {toBengaliNumber(totalCount)}টি প্রবন্ধ • প্রকাশিত: {toBengaliNumber(publishedCount)} • পর্যালোচনায়: {toBengaliNumber(reviewCount)} • খসড়া: {toBengaliNumber(draftCount)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/articles"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all"
          >
            লাইভ পেজ দেখুন &rarr;
          </Link>
        </div>
      </div>

      {/* Client Table with Filters & Approve & Create Modal */}
      <AdminArticlesClient
        initialArticles={articles}
        authors={authors}
        categories={categories}
        currentStatus={status || 'ALL'}
      />
    </div>
  );
}
