'use client';

import React, { useState } from 'react';
import { Star, ShieldCheck, Send, MessageSquarePlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthContext';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  isVerified: boolean;
  user: {
    name: string;
    avatarUrl?: string | null;
  };
}

interface BookReviewsClientProps {
  bookId: string;
  initialReviews: ReviewItem[];
}

export default function BookReviewsClient({ bookId, initialReviews }: BookReviewsClientProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে আপনার মতামত বা পর্যালোচনা লিখুন।' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'পর্যালোচনা জমা হতে ব্যর্থ হয়েছে।');
      }

      setReviews([data.review, ...reviews]);
      setComment('');
      setIsOpen(false);
      setStatusMessage({ type: 'success', text: 'আপনার মূল্যবান পর্যালোচনা সফলভাবে প্রকাশিত হয়েছে!' });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'পর্যালোচনা জমা দিতে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '৫.০';

  return (
    <div className="bg-white dark:bg-shubban-darkCard p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
      {/* Reviews Header with Summary & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              পাঠক পর্যালোচনা ও রেটিং ({toBengaliNumber(reviews.length)})
            </h3>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
              <Star className="w-4 h-4 fill-current" />
              <span>{toBengaliNumber(avgRating)}</span>
            </div>
          </div>
          <span className="text-xs text-stone-500 mt-1 block">
            যাচাইকৃত পাঠকদের সত্যিকারের গঠনমূলক মতামত
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <MessageSquarePlus className="w-4 h-4 text-shubban-gold" />
          <span>{isOpen ? 'ফর্ম বন্ধ করুন' : 'পর্যালোচনা লিখুন'}</span>
        </button>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Review Submission Form */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              আপনার রেটিং নির্বাচন করুন:
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300 dark:text-stone-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-stone-600 dark:text-stone-400 ml-2">
                {rating === 5 && 'অসাধারণ (৫/৫)'}
                {rating === 4 && 'খুব ভালো (৪/৫)'}
                {rating === 3 && 'মোটামুটি (৩/৫)'}
                {rating === 2 && 'চলনসই (২/৫)'}
                {rating === 1 && 'সন্তোষজনক নয় (১/৫)'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              আপনার পর্যালোচনা লিখুন:
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="বইটির ভাষা, বিষয়বস্তু, প্রকাশনা মান ও আপনার সামগ্রিক অনুভূতি সংক্ষেপে লিখুন..."
              className="w-full p-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-shubban-gold leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-stone-500">
              {user ? `লগইনকৃত: ${user.name}` : 'গেস্ট হিসেবে পর্যালোচনা জমা হবে'}
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'জমা হচ্ছে...' : 'পর্যালোচনা জমা দিন'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 dark:bg-stone-800/20 rounded-xl border border-stone-100 dark:border-stone-800 text-xs text-stone-500 italic">
            এখনও কোনো পর্যালোচনা জমা পড়েনি। উপরের বাটনে ক্লিক করে আপনি প্রথম পাঠক হিসেবে মতামত দিন।
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-shubban-green text-shubban-gold font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {rev.user.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 block">
                      {rev.user.name}
                    </span>
                  </div>
                  {rev.isVerified && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      যাচাইকৃত ক্রেতা
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line pl-9">
                {rev.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

