import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import QuestionAnswerClient from '@/components/questions/QuestionAnswerClient';
import { HelpCircle, CheckCircle2, ArrowLeft, Eye, MessageSquare, ThumbsUp } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface QuestionDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const { slug } = params;

  const question = await prisma.question.findUnique({
    where: { slug },
    include: {
      category: true,
      user: { select: { name: true, avatarUrl: true } },
      votes: true,
      answers: {
        include: {
          user: { select: { name: true, avatarUrl: true, role: true } },
          votes: true,
        },
        orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!question) {
    notFound();
  }

  // Increment views
  await prisma.question.update({
    where: { id: question.id },
    data: { views: { increment: 1 } },
  });

  const questionVotesCount = question.votes.reduce((acc, v) => acc + v.voteType, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-stone-500 flex items-center gap-2">
        <Link href="/" className="hover:text-shubban-green">হোম</Link>
        <span>/</span>
        <Link href="/questions" className="hover:text-shubban-green">প্রশ্নোত্তর</Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 font-semibold truncate max-w-xs">
          {question.title}
        </span>
      </nav>

      {/* Main Question Card */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-shubban-green text-shubban-gold font-bold">
            {question.category.name}
          </span>
          <span className="text-stone-400">•</span>
          <span className="text-stone-500">জিজ্ঞাসাকারী: {question.user.name}</span>
          <span className="text-stone-400">•</span>
          <span className="text-stone-500">{formatBengaliDate(question.createdAt)}</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
          {question.title}
        </h1>

        <div className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line select-text">
          {question.content}
        </div>

        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {toBengaliNumber(question.views + 1)} বার দেখা হয়েছে
          </span>
          <span className="font-semibold text-shubban-gold">
            {toBengaliNumber(question.answers.length)}টি প্রামাণ্য উত্তর
          </span>
        </div>
      </div>

      {/* Interactive Answers & Submit Answer Client Component */}
      <QuestionAnswerClient
        questionId={question.id}
        initialAnswers={question.answers}
      />
    </div>
  );
}
