'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  Calendar,
  Tag,
  Search,
  Filter,
  X,
  AlertCircle,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminArticlesClientProps {
  initialArticles: any[];
  authors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  currentStatus: string;
}

export default function AdminArticlesClient({
  initialArticles,
  authors,
  categories,
  currentStatus,
}: AdminArticlesClientProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Form states
  const [title, setTitle] = useState('');
  const [authorId, setAuthorId] = useState(authors[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('আকীদা, তাহকীক, ইতিহাস');
  const [status, setStatus] = useState('PUBLISHED');
  const [scheduledAt, setScheduledAt] = useState('');

  const filteredArticles = articles.filter((art) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      art.title.toLowerCase().includes(term) ||
      art.author.name.toLowerCase().includes(term) ||
      art.category.name.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleApprove = async (articleId: string) => {
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/approve`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, status: 'PUBLISHED' } : a))
        );
        setFeedback({ type: 'success', message: 'প্রবন্ধটি সফলভাবে অনুমোদিত ও প্রকাশিত হয়েছে!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'অনুমোদনে সমস্যা হয়েছে।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ব্যর্থতা।' });
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          authorId,
          categoryId,
          excerpt,
          content,
          tags: parsedTags,
          status,
          scheduledAt: status === 'SCHEDULED' ? scheduledAt : undefined,
          metaTitle: title,
          metaDescription: excerpt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setArticles([data.article, ...articles]);
        setShowCreateModal(false);
        setTitle('');
        setExcerpt('');
        setContent('');
        setFeedback({ type: 'success', message: 'নতুন প্রবন্ধ সফলভাবে সংরক্ষিত হয়েছে!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'প্রবন্ধ সংরক্ষণে সমস্যা হয়েছে।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ত্রুটি।' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (artStatus: string) => {
    switch (artStatus) {
      case 'PUBLISHED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            প্রকাশিত
          </span>
        );
      case 'REVIEW':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            পর্যালোচনায়
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            শিডিউলড
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            খসড়া
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {['ALL', 'PUBLISHED', 'REVIEW', 'SCHEDULED', 'DRAFT'].map((st) => (
            <Link
              key={st}
              href={st === 'ALL' ? '/admin/articles' : `/admin/articles?status=${st}`}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                currentStatus === st
                  ? 'bg-shubban-green text-shubban-gold shadow'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
              }`}
            >
              {st === 'ALL'
                ? 'সকল প্রবন্ধ'
                : st === 'PUBLISHED'
                ? 'প্রকাশিত'
                : st === 'REVIEW'
                ? 'পর্যালোচনাধীন'
                : st === 'SCHEDULED'
                ? 'শিডিউলড'
                : 'খসড়া'}
            </Link>
          ))}
        </div>

        {/* Search & New Article Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="প্রবন্ধ খুঁজুন..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-shubban-gold/50"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-shubban-gold" />
            <span>নতুন প্রবন্ধ লিখুন</span>
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4">প্রবন্ধের শিরোনাম</th>
                <th className="p-4">লেখক</th>
                <th className="p-4">বিভাগ</th>
                <th className="p-4">ট্যাগসমূহ</th>
                <th className="p-4">স্ট্যাটাস</th>
                <th className="p-4 text-right">তারিখ ও অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">
                    কোনো প্রবন্ধ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                paginatedArticles.map((art) => {
                  let parsedTags: string[] = [];
                  try {
                    if (art.tags) parsedTags = JSON.parse(art.tags);
                  } catch (e) {
                    parsedTags = [];
                  }

                  return (
                    <tr key={art.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-4 font-bold font-serif text-stone-900 dark:text-stone-100 max-w-xs">
                        <Link
                          href={`/articles/${art.slug}`}
                          target="_blank"
                          className="hover:text-shubban-gold line-clamp-1"
                        >
                          {art.title}
                        </Link>
                        {art.scheduledAt && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-sans">
                            শিডিউল: {formatBengaliDate(art.scheduledAt)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap">
                        {art.author.name}
                      </td>
                      <td className="p-4 text-stone-500 whitespace-nowrap">{art.category.name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {parsedTags.slice(0, 3).map((tg, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(art.status)}</td>
                      <td className="p-4 text-right space-y-1">
                        <div className="text-[11px] text-stone-400">
                          {formatBengaliDate(art.publishedAt || art.createdAt)}
                        </div>

                        {art.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleApprove(art.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>অনুমোদন</span>
                          </button>
                        )}
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
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredArticles.length}
        itemsPerPage={pageSize}
        itemName="প্রবন্ধ"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
      />

      {/* Create Article Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-shubban-gold" />
                <span>নতুন প্রবন্ধ বা সম্পাদকীয় রচনা</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">প্রবন্ধের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: সমকালীন চিন্তায় সালাফের মূলনীতি ও তাহকীক"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-shubban-gold/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">লেখক *</label>
                  <select
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {authors.map((au) => (
                      <option key={au.id} value={au.id}>
                        {au.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">ক্যাটাগরি *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">সংক্ষিপ্ত সারসংক্ষেপ (Excerpt) *</label>
                <textarea
                  rows={2}
                  required
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="প্রবন্ধের প্রথম দুই বা তিন লাইনের সংক্ষিপ্ত সারসংক্ষেপ..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-shubban-gold/50"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">সম্পূর্ণ মূল বিষয়বস্তু (Content) *</label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="বিস্তারিত গবেষণা প্রবন্ধ বা বিশ্লেষণ..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-shubban-gold/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">ট্যাগসমূহ (কমা দিয়ে পৃথক)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="আকীদা, ইতিহাস, গবেষণা"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">স্ট্যাটাস</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="PUBLISHED">সরাসরি প্রকাশ (Published)</option>
                    <option value="REVIEW">সম্পাদকীয় পর্যালোচনা (Review)</option>
                    <option value="SCHEDULED">শিডিউল প্রকাশ (Scheduled)</option>
                    <option value="DRAFT">খসড়া (Draft)</option>
                  </select>
                </div>

                {status === 'SCHEDULED' && (
                  <div>
                    <label className="block font-semibold mb-1">প্রকাশের শিডিউল তারিখ</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'প্রবন্ধ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

