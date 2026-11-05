import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AskQuestionButton from '@/components/questions/AskQuestionButton';
import { HelpCircle, MessageSquare, ThumbsUp, Eye, CheckCircle2, User } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface QuestionsPageProps {
  searchParams: {
    category?: string;
    filter?: string;
  };
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const { category, filter } = searchParams;

  const where: any = {};
  if (category) {
    where.category = { slug: category };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (filter === 'popular') {
    orderBy = { views: 'desc' };
  }

  const [questions, categories] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy,
      include: {
        category: true,
        user: { select: { name: true, avatarUrl: true } },
        answers: {
          include: {
            user: { select: { name: true } },
          },
        },
        votes: true,
      },
    }),
    prisma.category.findMany(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>জ্ঞান জিজ্ঞাসা ও বিদগ্ধ কমিউনিটি</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
            প্রশ্নোত্তর ফোরাম
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
            সাহিত্য, ভাষা, ইতিহাস, দর্শন এবং গবেষকদের জ্ঞানভিত্তিক জিজ্ঞাসা ও সমাধান।
          </p>
        </div>

        <AskQuestionButton categories={categories} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-2 scrollbar-none">
        <Link
          href="/questions"
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
            !filter
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          সর্বশেষ প্রশ্ন ({questions.length})
        </Link>
        <Link
          href="/questions?filter=popular"
          className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
            filter === 'popular'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          }`}
        >
          সর্বাধিক আলোচিত ও পঠিত
        </Link>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 space-y-3">
            <HelpCircle className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold">এখনও কোনো প্রশ্ন করা হয়নি</h3>
            <p className="text-xs text-stone-500">আপনার মনে কোনো জিজ্ঞাসা থাকলে প্রথম প্রশ্নটি আপনিই করুন।</p>
          </div>
        ) : (
          questions.map((q) => {
            const hasAccepted = q.answers.some((a) => a.isAccepted);
            const totalVotes = q.votes.reduce((acc, v) => acc + v.voteType, 0);

            return (
              <div
                key={q.id}
                className="p-6 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-shubban-gold/40 transition-all flex flex-col sm:flex-row items-start gap-5"
              >
                {/* Stats badge */}
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2 text-center text-xs flex-shrink-0 text-stone-500 font-mono">
                  <div className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800">
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {toBengaliNumber(totalVotes)}
                    </span>
                    <span className="text-[10px] text-stone-400">ভোট</span>
                  </div>

                  <div
                    className={`px-2.5 py-1 rounded-lg ${
                      hasAccepted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="font-bold block">{toBengaliNumber(q.answers.length)}</span>
                    <span className="text-[10px]">উত্তর</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-shubban-gold bg-shubban-gold/10 px-2 py-0.5 rounded">
                      {q.category.name}
                    </span>
                    {hasAccepted && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        গৃহীত উত্তর রয়েছে
                      </span>
                    )}
                  </div>

                  <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 hover:text-shubban-green dark:hover:text-shubban-gold transition-colors">
                    <Link href={`/questions/${q.slug}`}>{q.title}</Link>
                  </h2>

                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                    {q.content}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-stone-400 border-t border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Eye className="w-3.5 h-3.5" />
                      {toBengaliNumber(q.views)} বার দেখা হয়েছে
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {q.user.name}
                      </span>
                      <span>•</span>
                      <span>{formatBengaliDate(q.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
