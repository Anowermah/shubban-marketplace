'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Globe,
  Quote,
  Clock,
  Send,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface AdminArticleCreateClientProps {
  authors: any[];
  categories: any[];
  issues: any[];
  books: any[];
}

const ARTICLE_TYPES = [
  { value: 'ISLAMIC', label: 'ইসলামিক প্রবন্ধ (Islamic Article)' },
  { value: 'RESEARCH', label: 'গবেষণাপত্র (Research Paper)' },
  { value: 'ESSAY', label: 'মননশীল রচনা ও নিবন্ধ (Essay)' },
  { value: 'EDITORIAL', label: 'সম্পাদকীয় (Editorial)' },
  { value: 'HISTORY', label: 'ইসলামের ইতিহাস ও ঐতিহ্য (History)' },
  { value: 'QURAN_HADITH', label: 'কুরআন ও হাদিস গবেষণা (Quran & Hadith)' },
  { value: 'BOOK_REVIEW', label: 'গ্রন্থ সমালোচনা (Book Review)' },
  { value: 'INTERVIEW', label: 'সাক্ষাৎকার (Interview)' },
  { value: 'GENERAL', label: 'সাধারণ নিবন্ধ (General)' },
];

export default function AdminArticleCreateClient({
  authors,
  categories,
  issues,
  books,
}: AdminArticleCreateClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState('ISLAMIC');
  const [authorId, setAuthorId] = useState(authors[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [issueId, setIssueId] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [arabicContent, setArabicContent] = useState('');
  const [references, setReferences] = useState<string[]>(['']);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [tags, setTags] = useState('ইসলাম, গবেষণা, দ্বীনি জ্ঞান');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState('PUBLISHED');

  // Word count & Reading time
  const wordCount = (content.trim().match(/\S+/g) || []).length;
  const autoReadingTime = Math.max(1, Math.ceil(wordCount / 180));

  const addReference = () => setReferences([...references, '']);
  const updateReference = (idx: number, val: string) => {
    const next = [...references];
    next[idx] = val;
    setReferences(next);
  };
  const removeReference = (idx: number) => {
    setReferences(references.filter((_, i) => i !== idx));
  };

  const toggleBookSelection = (bookId: string) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
    } else {
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('প্রবন্ধের শিরোনাম আবশ্যক');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('প্রবন্ধের মূল বক্তব্য বা কনটেন্ট আবশ্যক');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const cleanReferences = references.filter((r) => r.trim().length > 0);

      const res = await fetch('/api/publications/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          type,
          authorId: authorId || null,
          categoryId: categoryId || null,
          issueId: issueId || null,
          featuredImage: featuredImage || null,
          summary: summary || null,
          content,
          arabicContent: arabicContent || null,
          references: cleanReferences.length > 0 ? cleanReferences : null,
          relatedBookIds: selectedBookIds,
          readingTime: autoReadingTime,
          isFeatured,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('প্রবন্ধটি সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে!');
        setTimeout(() => {
          router.push('/admin/articles');
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ত্রুটি ঘটেছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles"
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              <span>নতুন প্রবন্ধ ও গবেষণা নিবন্ধ লিখুন</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              বাংলা টাইপোগ্রাফি, আরবি ইবারত বক্স ও বই সংযোগসহ পূর্ণাঙ্গ আর্টিকেল এডিটর
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Metadata Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                প্রবন্ধের শিরোনাম *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: তাকওয়ার স্বরূপ ও ব্যক্তিজীবনে এর প্রভাব"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-base font-serif font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                উপ-শিরোনাম (Subtitle)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="একটি সংক্ষিপ্ত দ্বিতীয় শিরোনাম"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  প্রবন্ধের ধরন *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {ARTICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  লেখক / গবেষক
                </label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">লেখক নির্ধারণ করুন</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.designation ? `(${a.designation})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                সংক্ষিপ্ত সারসংক্ষেপ (Short Description / Summary)
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="প্রবন্ধের ভূমিকা বা সারাংশ যা তালিকায় এবং সোশ্যাল মিডিয়ায় প্রদর্শিত হবে..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Arabic Text Callout Card */}
          <div className="p-6 rounded-3xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-amber-600" />
                <span>আরবি ইবারত / আয়াত ও হাদিসের টেক্সট (Arabic RTL Support)</span>
              </label>
              <span className="text-[10px] text-stone-400">ঐচ্ছিক</span>
            </div>
            <p className="text-xs text-stone-500">
              প্রবন্ধের সাথে কোনো কুরআনুল কারীমের আয়াত বা সহিহ হাদিসের আরবি টেক্সট যুক্ত করতে এখানে লিখুন। এটি আকর্ষণীয় বক্স আকারে প্রদর্শিত হবে।
            </p>
            <textarea
              dir="rtl"
              rows={3}
              value={arabicContent}
              onChange={(e) => setArabicContent(e.target.value)}
              placeholder="قال الله تعالى: يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ..."
              className="w-full px-4 py-3 rounded-xl border border-amber-500/30 bg-white dark:bg-stone-900 text-base font-serif text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Rich Content Editor */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>প্রবন্ধের মূল বিষয়বস্তু (Rich Article Content) *</span>
              </label>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  পড়ার সময়: ~{toBengaliNumber(autoReadingTime)} মিনিট ({toBengaliNumber(wordCount)} শব্দ)
                </span>
              </div>
            </div>

            <textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="প্রবন্ধের পূর্ণাঙ্গ বক্তব্য লিখুন... (প্যারাগ্রাফ ও শিরোনাম স্পষ্টভাবে উপস্থাপন করুন)"
              required
              className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
            />
          </div>

          {/* References & Citations */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-xs text-stone-700 dark:text-stone-300">
                তথ্যসূত্র ও টীকা (References & Citations)
              </h3>
              <button
                type="button"
                onClick={addReference}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>তথ্যসূত্র যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-2">
              {references.map((ref, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-400 w-6">
                    [{idx + 1}]
                  </span>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => updateReference(idx, e.target.value)}
                    placeholder="যেমন: সহিহ বুখারি, হাদিস নং: ৫০৬৫"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {references.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReference(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Publishing Controls & Cross-linking */}
        <div className="space-y-6">
          {/* Publish Actions Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <span>প্রকাশনা নিয়ন্ত্রণ</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                স্ট্যাটাস
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="PUBLISHED">প্রকাশিত (Published)</option>
                <option value="DRAFT">খসড়া (Draft)</option>
                <option value="REVIEW">পর্যালোচনাধীন (In Review)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                ক্যাটাগরি
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                পত্রিকা সংখ্যার সাথে যুক্ত করুন
              </label>
              <select
                value={issueId}
                onChange={(e) => setIssueId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">স্বতন্ত্র প্রবন্ধ (পত্রিকার অংশ নয়)</option>
                {issues.map((iss) => (
                  <option key={iss.id} value={iss.id}>
                    {iss.magazine?.title} — {iss.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>হোমপেজে ফিচার্ড করুন (Featured Article)</span>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'সংরক্ষণ হচ্ছে...' : 'প্রবন্ধটি প্রকাশ করুন'}</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <ImageIcon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <span>ফিচার্ড ছবি</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                ছবির URL
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="/images/... বা অনলাইন ইমেজ লিংক"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {featuredImage ? (
              <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 aspect-video relative bg-stone-100 dark:bg-stone-800">
                <img
                  src={featuredImage}
                  alt="ফিচার্ড ছবি"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
          </div>

          {/* Related Books Selector */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>সম্পর্কিত বইসমূহ ({toBengaliNumber(selectedBookIds.length)})</span>
              </h3>
            </div>
            <p className="text-[11px] text-stone-500">
              প্রবন্ধের নিচে পাঠকদের ক্রয়ের সুবিধার্থে সংশ্লিষ্ট ইসলামিক বই সংযুক্ত করুন:
            </p>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {books.map((b) => {
                const isSelected = selectedBookIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBookSelection(b.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition border ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold'
                        : 'border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="truncate pr-2">{b.title || b.name}</span>
                    <span className="text-[10px] text-stone-400 flex-shrink-0">
                      ৳{toBengaliNumber(b.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
