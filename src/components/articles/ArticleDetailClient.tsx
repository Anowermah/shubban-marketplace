'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthContext';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  user: {
    name: string;
    avatarUrl?: string | null;
  };
}

interface ArticleDetailClientProps {
  articleId: string;
  initialComments: Comment[];
}

export default function ArticleDetailClient({
  articleId,
  initialComments,
}: ArticleDetailClientProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'মন্তব্য পাঠাতে সমস্যা হয়েছে।');
      }

      setComments([data.comment, ...comments]);
      setNewComment('');
      setFeedback('আপনার গঠনমূলক মন্তব্য সফলভাবে প্রকাশিত হয়েছে!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(err.message || 'মন্তব্য জমা দিতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-8 border-t border-stone-200 dark:border-stone-800 space-y-6 no-print">
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-shubban-gold" />
          <span>পাঠক মতামত ও আলোচনা ({toBengaliNumber(comments.length)})</span>
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            user
              ? 'প্রবন্ধ সম্পর্কে আপনার প্রাসঙ্গিক ও জ্ঞানগর্ভ মতামত লিখুন...'
              : 'মন্তব্য করতে অনুগ্রহ করে আপনার মতামত লিখুন (অতিথি হিসেবে প্রকাশিত হবে)...'
          }
          required
          className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-shubban-gold leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            মার্জিত ভাষা ও গঠনমূলক সাহিত্যের আলোচনার জন্য শুব্বান নীতিমালা প্রযোজ্য।
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'পাঠানো হচ্ছে...' : 'মন্তব্য প্রকাশ করুন'}</span>
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-4">
        {comments.length === 0 ? (
          <p className="text-xs text-stone-400 italic">এখনও কোনো পাঠক মন্তব্য করেননি। প্রথম মন্তব্যটি আপনি করুন।</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200">{c.user.name}</span>
                <span className="text-[11px] text-stone-400">{formatBengaliDate(c.createdAt)}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {c.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
