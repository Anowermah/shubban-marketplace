'use client';

import React, { useState } from 'react';
import {
  Star,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ShieldCheck,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  book: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
  };
}

interface AdminReviewsClientProps {
  initialReviews: ReviewItem[];
  initialTotal: number;
  initialPage: number;
  initialLimit: number;
}

export default function AdminReviewsClient({
  initialReviews,
  initialTotal,
  initialPage,
  initialLimit,
}: AdminReviewsClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [editReview, setEditReview] = useState<ReviewItem | null>(null);
  const [deleteReview, setDeleteReview] = useState<ReviewItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editIsVerified, setEditIsVerified] = useState(false);

  const fetchReviews = async (targetPage = page, query = search, rating = ratingFilter) => {
    setIsSubmitting(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(initialLimit),
      });
      if (query) params.set('q', query);
      if (rating) params.set('rating', rating);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews(data.reviews);
        setTotal(data.total);
        setPage(data.page);
        setSelectedIds([]);
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews(1, search, ratingFilter);
  };

  const handleRatingFilterChange = (val: string) => {
    setRatingFilter(val);
    fetchReviews(1, search, val);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openEditModal = (r: ReviewItem) => {
    setEditReview(r);
    setEditRating(r.rating);
    setEditComment(r.comment || '');
    setEditIsVerified(r.isVerified);
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReview) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/reviews/${editReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment,
          isVerified: editIsVerified,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === editReview.id ? data.review : r))
        );
        setEditReview(null);
        setFeedback({ type: 'success', message: data.message || 'রিভিউ মডারেশন সম্পন্ন হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'হালনাগাদ ব্যর্থ হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deleteReview) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/reviews/${deleteReview.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== deleteReview.id));
        setTotal((prev) => Math.max(0, prev - 1));
        setDeleteReview(null);
        setFeedback({ type: 'success', message: data.message || 'রিভিউ মুছে ফেলা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'মুছতে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`আপনি কি নিশ্চিত যে নির্বাচিত ${toBengaliNumber(selectedIds.length)}টি রিভিউ মুছে ফেলতে চান?`)) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
        setTotal((prev) => Math.max(0, prev - selectedIds.length));
        setSelectedIds([]);
        setFeedback({ type: 'success', message: data.message || 'নির্বাচিত রিভিউ মুছে ফেলা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'মুছতে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Star className="w-6 h-6 text-shubban-gold" />
            <span>গ্রাহক পর্যালোচনা ও রেটিং মডারেশন (Reviews & Moderation)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট <strong className="text-shubban-green dark:text-shubban-gold font-mono">{toBengaliNumber(total)}</strong>টি পাঠক রিভিউ সংরক্ষিত রয়েছে।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>নির্বাচিত {toBengaliNumber(selectedIds.length)}টি মুছুন</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchReviews()}
            disabled={isSubmitting}
            className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-shubban-darkCard p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="বই, পাঠক বা মন্তব্য দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={ratingFilter}
            onChange={(e) => handleRatingFilterChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="">সকল রেটিং (All Stars)</option>
            <option value="5">⭐⭐⭐⭐⭐ (৫ স্টার)</option>
            <option value="4">⭐⭐⭐⭐ (৪ স্টার)</option>
            <option value="3">⭐⭐⭐ (৩ স্টার)</option>
            <option value="2">⭐⭐ (২ স্টার)</option>
            <option value="1">⭐ (১ স্টার)</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {selectedIds.length > 0 && selectedIds.length === reviews.length ? (
                      <CheckSquare className="w-4 h-4 text-shubban-green dark:text-shubban-gold" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">বইয়ের শিরোনাম</th>
                <th className="p-4">পাঠকের নাম ও ইমেইল</th>
                <th className="p-4">রেটিং</th>
                <th className="p-4">মন্তব্য (Comment)</th>
                <th className="p-4">তারিখ</th>
                <th className="p-4 text-right">মডারেশন অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    কোন রিভিউ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const isChecked = selectedIds.includes(rev.id);
                  return (
                    <tr
                      key={rev.id}
                      className={`hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors ${
                        isChecked ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(rev.id)}
                          className="text-stone-400 hover:text-stone-600 transition-colors"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-shubban-green dark:text-shubban-gold" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 font-bold font-serif text-stone-900 dark:text-stone-100 max-w-xs">
                        <div className="flex items-center gap-2">
                          {rev.book.coverImage && (
                            <img
                              src={rev.book.coverImage}
                              alt={rev.book.title}
                              className="w-7 h-9 rounded object-cover border shrink-0"
                            />
                          )}
                          <span className="truncate">{rev.book.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-stone-700 dark:text-stone-300">
                        <span className="font-semibold block">{rev.user.name}</span>
                        <span className="text-[10px] text-stone-400">{rev.user.email}</span>
                        {rev.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>যাচাইকৃত ক্রেতা</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{toBengaliNumber(rev.rating)}</span>
                        </span>
                      </td>
                      <td className="p-4 text-stone-600 dark:text-stone-300 max-w-sm">
                        <p className="line-clamp-2">{rev.comment || 'কোনো লিখিত মন্তব্য নেই।'}</p>
                      </td>
                      <td className="p-4 text-stone-400 whitespace-nowrap text-[11px]">
                        {formatBengaliDate(rev.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(rev)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                            title="মডারেশন / এডিট"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteReview(rev)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                            title="রিভিউ মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / initialLimit)}
        totalItems={total}
        itemsPerPage={initialLimit}
        itemName="রিভিউ"
        pageUrlTemplate="/admin/reviews?page=[page]"
      />

      {/* Edit / Moderate Review Modal */}
      {editReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  রিভিউ মডারেশন ও সংশোধন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditReview(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReview} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">বই ও পাঠক:</span>
                <div className="font-serif font-bold text-stone-900 dark:text-stone-100">{editReview.book.title}</div>
                <div className="text-stone-400 mt-0.5">পাঠক: {editReview.user.name} ({editReview.user.email})</div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  রেটিং স্টার (১ থেকে ৫)*
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className={`p-2 rounded-xl border flex items-center gap-1 transition-colors ${
                        editRating >= star
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-stone-300 dark:border-stone-700 text-stone-400'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span>{toBengaliNumber(star)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  পাঠকের লিখিত মন্তব্য (Comment)
                </label>
                <textarea
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="মন্তব্য সংশোধন বা পরিমার্জন করুন..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsVerified}
                    onChange={(e) => setEditIsVerified(e.target.checked)}
                    className="accent-shubban-green"
                  />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    যাচাইকৃত ক্রেতা ব্যাজ (Verified Purchase Badge)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditReview(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>মডারেশন সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Review Modal */}
      {deleteReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                রিভিউ মুছে ফেলতে চান?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="font-bold text-stone-900 dark:text-stone-100">"{deleteReview.book.title}"</strong> বইয়ের জন্য <strong className="font-bold">{deleteReview.user.name}</strong>-এর এই রিভিউটি স্থায়ীভাবে মুছে ফেলতে চান?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteReview(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteSingle}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>হ্যাঁ, রিভিউ মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

