'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  ExternalLink,
  Sparkles,
  X,
  BookOpen,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminEssaysClientProps {
  initialArticles: any[];
  authors: any[];
  categories: any[];
  issues: any[];
}

export default function AdminEssaysClient({
  initialArticles,
  authors,
  categories,
  issues,
}: AdminEssaysClientProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    excerpt: '',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800',
    type: 'ESSAY',
    status: 'PUBLISHED',
    authorId: authors[0]?.id || '',
    categoryId: categories[0]?.id || '',
    issueId: '',
    readingTime: 6,
    tags: 'সাহিত্য, দর্শন, ইতিহাস',
    arabicContent: '',
    references: '',
  });

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      !search ||
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.author.name.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || art.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenModal = (art?: any) => {
    if (art) {
      setEditingArticle(art);
      setFormData({
        title: art.title,
        subtitle: art.subtitle || '',
        content: art.content,
        excerpt: art.excerpt,
        coverImage: art.coverImage || '',
        type: art.type || 'ESSAY',
        status: art.status || 'PUBLISHED',
        authorId: art.authorId,
        categoryId: art.categoryId,
        issueId: art.issueId || '',
        readingTime: art.readingTime || 6,
        tags: art.tags || '',
        arabicContent: art.arabicContent || '',
        references: art.references || '',
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        subtitle: '',
        content: '',
        excerpt: '',
        coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800',
        type: 'ESSAY',
        status: 'PUBLISHED',
        authorId: authors[0]?.id || '',
        categoryId: categories[0]?.id || '',
        issueId: '',
        readingTime: 6,
        tags: 'সাহিত্য, দর্শন, ইতিহাস',
        arabicContent: '',
        references: '',
      });
    }
    setShowModal(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const url = editingArticle
        ? `/api/publications/articles/${editingArticle.id}`
        : '/api/publications/articles';
      const method = editingArticle ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');

      if (editingArticle) {
        setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? data.article : a)));
        setFeedback({ type: 'success', message: 'প্রবন্ধটি সফলভাবে আপডেট হয়েছে।' });
      } else {
        setArticles((prev) => [data.article, ...prev]);
        setFeedback({ type: 'success', message: 'নতুন প্রবন্ধ সফলভাবে প্রকাশিত হয়েছে।' });
      }

      setShowModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই প্রবন্ধটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/publications/articles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'মুছে ফেলা সম্ভব হয়নি');

      setArticles((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: 'success', message: 'প্রবন্ধটি মুছে ফেলা হয়েছে।' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
              প্রবন্ধ ও গবেষণা প্রশাসন
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            মননশীল প্রবন্ধ, ইসলামী গবেষণা, রিভিউ এবং মাসিক সাময়িকীর লেখার প্রকাশনা
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন প্রবন্ধ লিখুন</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="প্রবন্ধ বা লেখকের নাম খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="py-2 px-3 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full md:w-auto"
        >
          <option value="ALL">সকল ধরন (All Types)</option>
          <option value="ESSAY">প্রবন্ধ (Essay)</option>
          <option value="ISLAMIC_ARTICLE">ইসলামিক প্রবন্ধ</option>
          <option value="RESEARCH_PAPER">গবেষণাপত্র (Research Paper)</option>
          <option value="EDITORIAL">সম্পাদকীয় (Editorial)</option>
          <option value="BOOK_REVIEW">গ্রন্থ সমালোচনা (Book Review)</option>
          <option value="ISLAMIC_HISTORY">ইসলামের ইতিহাস</option>
          <option value="QURAN_HADITH_RESEARCH">কুরআন-হাদিস গবেষণা</option>
        </select>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <th className="py-3 px-4">প্রবন্ধের শিরোনাম</th>
                <th className="py-3 px-4">লেখক</th>
                <th className="py-3 px-4">ক্যাটাগরি ও ধরন</th>
                <th className="py-3 px-4">সংযুক্ত সাময়িকী</th>
                <th className="py-3 px-4">ভিউ</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              {paginatedArticles.map((art) => (
                <tr key={art.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/articles/${art.slug}`}
                      target="_blank"
                      className="font-serif font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 transition block max-w-sm truncate"
                    >
                      {art.title}
                    </Link>
                    <span className="text-[10px] text-stone-400">
                      {formatBengaliDate(art.publishedAt)} • {toBengaliNumber(art.readingTime)} মিনিট পাঠ
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-stone-700 dark:text-stone-300">
                    {art.author.name}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {art.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-stone-500">
                    {art.issue?.issueTitle ? (
                      <span className="truncate block max-w-[150px]">{art.issue.issueTitle}</span>
                    ) : (
                      <span className="text-stone-400 italic">স্বতন্ত্র প্রকাশনা</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-stone-600 dark:text-stone-400">
                    {toBengaliNumber(art.views)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        art.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-stone-500/10 text-stone-500'
                      }`}
                    >
                      {art.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/articles/${art.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                        title="পাবলিক ভিউ"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleOpenModal(art)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                        title="সম্পাদনা"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredArticles.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="টি প্রবন্ধ"
            />
          </div>
        )}
      </div>

      {/* Create / Edit Article Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-6">
              <h2 className="font-serif font-black text-lg sm:text-xl text-stone-900 dark:text-stone-100">
                {editingArticle ? 'প্রবন্ধ সম্পাদনা করুন' : 'নতুন প্রবন্ধ রচনা ও প্রকাশ'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  শিরোনাম *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="প্রবন্ধের মূল শিরোনাম"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-serif font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  উপ-শিরোনাম (Subtitle)
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="প্রবন্ধের উপ-শিরোনাম"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    লেখক / প্রাবন্ধিক *
                  </label>
                  <select
                    value={formData.authorId}
                    onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    required
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ক্যাটাগরি *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রবন্ধের ধরন
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                  >
                    <option value="ESSAY">মননশীল প্রবন্ধ (Essay)</option>
                    <option value="ISLAMIC_ARTICLE">ইসলামিক প্রবন্ধ</option>
                    <option value="RESEARCH_PAPER">গবেষণাপত্র (Research Paper)</option>
                    <option value="EDITORIAL">সম্পাদকীয় (Editorial)</option>
                    <option value="BOOK_REVIEW">গ্রন্থ সমালোচনা (Book Review)</option>
                    <option value="ISLAMIC_HISTORY">ইসলামের ইতিহাস</option>
                    <option value="QURAN_HADITH_RESEARCH">কুরআন-হাদিস গবেষণা</option>
                  </select>
                </div>
              </div>

              {/* Linked Magazine Issue */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  সংযুক্ত সাময়িকী সংখ্যা (ঐচ্ছিক)
                </label>
                <select
                  value={formData.issueId}
                  onChange={(e) => setFormData({ ...formData, issueId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="">স্বতন্ত্র প্রকাশনা (কোনো সংখ্যার অন্তর্ভুক্ত নয়)</option>
                  {issues.map((iss) => (
                    <option key={iss.id} value={iss.id}>
                      {iss.issueTitle} ({iss.volume || ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Excerpt */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  সংক্ষিপ্ত সারাংশ (Excerpt) *
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  required
                />
              </div>

              {/* Arabic Content */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  আরবি উদ্ধৃতি ও নস (Arabic Quran/Hadith Content)
                </label>
                <textarea
                  dir="rtl"
                  rows={3}
                  value={formData.arabicContent}
                  onChange={(e) => setFormData({ ...formData, arabicContent: e.target.value })}
                  placeholder="قال رسول الله صلى الله عليه وسلم..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-serif text-sm"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  মূল প্রবন্ধ ও বিষয়বস্তু *
                </label>
                <textarea
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="প্রবন্ধের বিস্তারিত লেখা এখানে লিখুন..."
                  className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-serif text-sm leading-relaxed"
                  required
                />
              </div>

              {/* References */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  তথ্যসূত্র ও টীকা (Citations & References)
                </label>
                <textarea
                  rows={2}
                  value={formData.references}
                  onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                  placeholder="১. সহীহ বুখারী, হাদিস নং...&#10;২. আল-বিদায়া ওয়ান নিহায়া, খণ্ড..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold shadow-md shadow-amber-900/30 transition disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : editingArticle ? 'আপডেট করুন' : 'প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

