'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send, ThumbsUp, ThumbsDown, MessageSquare, Award, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthContext';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface Answer {
  id: string;
  content: string;
  isAccepted: boolean;
  createdAt: Date | string;
  user: {
    name: string;
    avatarUrl?: string | null;
    role?: string;
  };
  votes?: Array<{ voteType: number; userId?: string }>;
}

interface QuestionAnswerClientProps {
  questionId: string;
  initialAnswers: Answer[];
}

export default function QuestionAnswerClient({
  questionId,
  initialAnswers,
}: QuestionAnswerClientProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [voteLoadingId, setVoteLoadingId] = useState<string | null>(null);

  const handleVote = async (answerId: string, voteType: 1 | -1) => {
    setVoteLoadingId(answerId);
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, voteType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ভোট গ্রহণে সমস্যা হয়েছে।');
      }

      // Update answer vote count locally
      setAnswers((prev) =>
        prev.map((ans) => {
          if (ans.id === answerId) {
            const currentVotes = ans.votes || [];
            // Optimistic update
            const newVotes = [...currentVotes, { voteType }];
            return { ...ans, votes: newVotes };
          }
          return ans;
        })
      );

      setFeedback(data.message || 'আপনার ভোট সফলভাবে নিবন্ধিত হয়েছে!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(err.message || 'ভোট দিতে সমস্যা হয়েছে।');
    } finally {
      setVoteLoadingId(null);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newAnswer.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'উত্তর প্রকাশ ব্যর্থ হয়েছে।');
      }

      setAnswers([...answers, data.answer]);
      setNewAnswer('');
      setFeedback('আপনার উত্তরটি সফলভাবে প্রকাশিত হয়েছে!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(err.message || 'উত্তর প্রকাশে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Feedback banner */}
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Answers Section */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-shubban-gold" />
          <span>উত্তরসমূহ ({toBengaliNumber(answers.length)})</span>
        </h2>

        {answers.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            এই প্রশ্নে এখনও কোনো উত্তর দেওয়া হয়নি। নিচে আপনার তথ্যভিত্তিক উত্তর লিখুন।
          </div>
        ) : (
          answers.map((ans) => {
            const voteScore = (ans.votes || []).reduce((acc, v) => acc + v.voteType, 0);

            return (
              <div
                key={ans.id}
                className={`p-6 bg-white dark:bg-shubban-darkCard rounded-2xl border shadow-sm space-y-4 transition-all ${
                  ans.isAccepted
                    ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/20'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {ans.isAccepted && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>প্রশ্নকর্তা কর্তৃক গৃহীত প্রামাণ্য উত্তর</span>
                  </div>
                )}

                <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line select-text">
                  {ans.content}
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-shubban-green text-shubban-gold font-bold flex items-center justify-center text-xs">
                      {ans.user.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        {ans.user.name}
                      </span>
                      {ans.user.role === 'AUTHOR' && (
                        <span className="text-[10px] text-shubban-gold font-semibold">
                          লেখক ও গবেষক
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
                      <button
                        onClick={() => handleVote(ans.id, 1)}
                        disabled={voteLoadingId === ans.id}
                        className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                        title="উপকারী উত্তর হিসেবে ভোট দিন"
                        aria-label="Upvote"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-xs px-1 text-stone-800 dark:text-stone-200">
                        {toBengaliNumber(voteScore)}
                      </span>
                      <button
                        onClick={() => handleVote(ans.id, -1)}
                        disabled={voteLoadingId === ans.id}
                        className="p-1 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="অনুপযুক্ত উত্তর"
                        aria-label="Downvote"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span>{formatBengaliDate(ans.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Answer Box */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
          আপনার উত্তর দিন
        </h3>
        <form onSubmit={handleAnswerSubmit} className="space-y-3">
          <textarea
            rows={5}
            required
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="প্রশ্নটির প্রেক্ষাপটে সুস্পষ্ট, তথ্যনির্ভর ও তথ্যসূত্রী সমাধান লিখুন..."
            className="w-full p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-shubban-gold leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              সঠিক ও তথ্যবহুল উত্তর অন্য পাঠকদের জ্ঞানপিপাসা মেটাতে সহায়তা করে।
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'জমা হচ্ছে...' : 'উত্তর পোস্ট করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
