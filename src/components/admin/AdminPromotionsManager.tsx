'use client';

import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber, formatTaka } from '@/lib/utils';

export interface PromotedBook {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  coverImage: string;
  author: {
    id: string;
    name: string;
  };
}

interface AdminPromotionsManagerProps {
  initialBooks: PromotedBook[];
}

export default function AdminPromotionsManager({ initialBooks }: AdminPromotionsManagerProps) {
  const [books, setBooks] = useState<PromotedBook[]>(initialBooks);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBook, setEditBook] = useState<PromotedBook | null>(null);
  const [deleteBook, setDeleteBook] = useState<PromotedBook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add promotion search candidates state
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [addDiscountPrice, setAddDiscountPrice] = useState('');

  // Edit discount price state
  const [editDiscountPrice, setEditDiscountPrice] = useState('');

  const searchCandidateBooks = async (query: string) => {
    setCandidateQuery(query);
    if (!query || query.length < 2) {
      setCandidates([]);
      return;
    }

    setIsSearchingCandidates(true);
    try {
      const res = await fetch(`/api/admin/promotions?searchCandidates=true&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidates(data.candidates || []);
      }
    } catch {
      // ignore error
    } finally {
      setIsSearchingCandidates(false);
    }
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedCandidate.id,
          discountPrice: addDiscountPrice,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBooks((prev) => {
          const exists = prev.find((b) => b.id === data.book.id);
          if (exists) {
            return prev.map((b) => (b.id === data.book.id ? data.book : b));
          }
          return [data.book, ...prev];
        });
        setIsAddOpen(false);
        setSelectedCandidate(null);
        setCandidateQuery('');
        setAddDiscountPrice('');
        setFeedback({ type: 'success', message: data.message || 'বই প্রমোশনে যোগ করা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'প্রমোশন যোগ ব্যর্থ হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBook) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: editBook.id,
          discountPrice: editDiscountPrice,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBooks((prev) =>
          prev.map((b) => (b.id === editBook.id ? data.book : b))
        );
        setEditBook(null);
        setFeedback({ type: 'success', message: data.message || 'ডিসকাউন্ট মূল্য সংরক্ষিত হয়েছে!' });
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

  const handleRemovePromotion = async () => {
    if (!deleteBook) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/promotions?bookId=${deleteBook.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBooks((prev) => prev.filter((b) => b.id !== deleteBook.id));
        setDeleteBook(null);
        setFeedback({ type: 'success', message: data.message || 'বই প্রমোশন থেকে বাদ দেওয়া হয়েছে!' });
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

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-bengali">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Flame className="w-6 h-6 text-shubban-gold" />
            <span>প্রমোশন ও ফ্ল্যাশ সেল অফার (Promotions & Flash Sale)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট <strong className="text-shubban-green dark:text-shubban-gold font-mono">{toBengaliNumber(books.length)}</strong>টি বই বিশেষ ফ্ল্যাশ সেল ও ছাড় ক্যাম্পেইনে সক্রিয় রয়েছে।
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCandidate(null);
            setCandidateQuery('');
            setAddDiscountPrice('');
            setIsAddOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold text-xs shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন বই প্রমোশনে যোগ করুন</span>
        </button>
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="বইয়ের নাম বা লেখক দিয়ে ফিল্টার করুন..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-shubban-darkCard focus:outline-none focus:ring-1 focus:ring-shubban-gold"
        />
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
      </div>

      {/* Grid of Promoted Books */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.length === 0 ? (
          <div className="col-span-full p-12 text-center text-stone-400 bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800">
            কোন প্রমোশনাল বই পাওয়া যায়নি।
          </div>
        ) : (
          filteredBooks.map((b) => {
            const discountPct = b.discountPrice
              ? Math.round(((b.price - b.discountPrice) / b.price) * 100)
              : 0;

            return (
              <div
                key={b.id}
                className="p-4 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-3 hover:border-shubban-gold/40 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-700">
                    <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                      {b.title}
                    </h4>
                    <span className="text-[11px] text-stone-400 block truncate">{b.author.name}</span>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-base text-shubban-green dark:text-shubban-gold font-mono">
                        ৳{b.discountPrice}
                      </span>
                      <span className="text-xs text-stone-400 line-through font-mono">
                        ৳{b.price}
                      </span>
                      {discountPct > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          {toBengaliNumber(discountPct)}% ছাড়
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditBook(b);
                      setEditDiscountPrice(String(b.discountPrice || ''));
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>মূল্য পরিবর্তন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteBook(b)}
                    className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সরান</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Book to Promotion Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন বই প্রমোশনে যোগ করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromotion} className="space-y-4 text-xs">
              {!selectedCandidate ? (
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    বই খুঁজুন (ক্যাটালগ থেকে নাম লিখুন)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={candidateQuery}
                      onChange={(e) => searchCandidateBooks(e.target.value)}
                      placeholder="বইয়ের নাম অনুসন্ধান করুন..."
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  </div>

                  {isSearchingCandidates && (
                    <div className="p-3 text-center text-xs text-stone-400">খোঁজা হচ্ছে...</div>
                  )}

                  {candidates.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 border border-stone-200 dark:border-stone-800 rounded-2xl p-2 bg-stone-50 dark:bg-stone-900">
                      {candidates.map((cand) => (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setAddDiscountPrice(String(Math.round(cand.price * 0.85)));
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-stone-800 dark:text-stone-200 block truncate">
                              {cand.title}
                            </span>
                            <span className="text-[10px] text-stone-400">{cand.author?.name}</span>
                          </div>
                          <span className="font-mono font-bold text-stone-600 dark:text-stone-300 shrink-0 ml-2">
                            ৳{cand.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-shubban-gold font-bold uppercase block">নির্বাচিত বই:</span>
                    <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100">{selectedCandidate.title}</h4>
                    <span className="text-xs text-stone-400">মূল দাম: ৳{selectedCandidate.price}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
                  >
                    বদলান
                  </button>
                </div>
              )}

              {selectedCandidate && (
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রমোশনাল ছাড়কৃত মূল্য (৳ টাকা)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedCandidate.price - 1}
                    required
                    value={addDiscountPrice}
                    onChange={(e) => setAddDiscountPrice(e.target.value)}
                    placeholder={`মূল্য (১ থেকে ${selectedCandidate.price - 1} এর মধ্যে)`}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                  {addDiscountPrice && parseFloat(addDiscountPrice) < selectedCandidate.price && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-semibold">
                      গ্রাহক সাশ্রয় করবেন: ৳{selectedCandidate.price - parseFloat(addDiscountPrice)} (
                      {toBengaliNumber(
                        Math.round(((selectedCandidate.price - parseFloat(addDiscountPrice)) / selectedCandidate.price) * 100)
                      )}
                      % ছাড়)
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedCandidate}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>প্রমোশনে যোগ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Discount Price Modal */}
      {editBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  ডিসকাউন্ট মূল্য সংশোধন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditBook(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePromotion} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100">{editBook.title}</h4>
                <div className="text-stone-400 mt-0.5">মূল দাম: ৳{editBook.price}</div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  নতুন প্রমোশনাল ছাড়কৃত মূল্য (৳ টাকা)*
                </label>
                <input
                  type="number"
                  min="1"
                  max={editBook.price - 1}
                  required
                  value={editDiscountPrice}
                  onChange={(e) => setEditDiscountPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditBook(null)}
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
                  <span>মূল্য হালনাগাদ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Remove Confirmation Modal */}
      {deleteBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                প্রমোশন থেকে সরাতে চান?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="font-bold text-stone-900 dark:text-stone-100">"{deleteBook.title}"</strong> বইটির প্রমোশনাল ছাড় মুছে ফেলে মূল মূল্যে (৳{deleteBook.price}) ফিরিয়ে নিতে চান?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteBook(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleRemovePromotion}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>হ্যাঁ, প্রমোশন থেকে সরান</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

