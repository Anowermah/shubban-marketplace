'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  Palette,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
} from 'lucide-react';

interface Publisher {
  id: string;
  name: string;
  nameEn: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface Props {
  publishers: Publisher[];
  categories: Category[];
  users: User[];
}

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'দৈনিক (Daily)', desc: 'প্রতিদিন প্রকাশিত হবে' },
  { value: 'WEEKLY', label: 'সাপ্তাহিক (Weekly)', desc: 'সপ্তাহে নির্দিষ্ট দিনে প্রকাশিত হবে' },
  { value: 'FORTNIGHTLY', label: 'পাক্ষিক (Fortnightly)', desc: 'মাসে দুইবার (১৫ দিন অন্তর)' },
  { value: 'MONTHLY', label: 'মাসিক (Monthly)', desc: 'মাসের শুরুতে বা নির্দিষ্ট দিনে' },
  { value: 'BIMONTHLY', label: 'দ্বিমাসিক (Bimonthly)', desc: 'প্রতি দুই মাসে এক সংখ্যা' },
  { value: 'QUARTERLY', label: 'ত্রৈমাসিক (Quarterly)', desc: 'বছরে ৪টি সংখ্যা (প্রতি ৩ মাসে)' },
  { value: 'HALF_YEARLY', label: 'ষাণ্মাসিক (Half-Yearly)', desc: 'বছরে ২টি সংখ্যা (প্রতি ৬ মাসে)' },
  { value: 'ANNUAL', label: 'বার্ষিক (Annual)', desc: 'বছরে একবার প্রকাশিত স্মারক বা বিশেষ সংখ্যা' },
  { value: 'SPECIAL_EDITION', label: 'বিশেষ সংখ্যা (Special Edition)', desc: 'উপলক্ষে বা বিশেষ আয়োজনে' },
  { value: 'IRREGULAR', label: 'অনিয়মিত (Irregular)', desc: 'নির্দিষ্ট বিরতি ছাড়া' },
];

const THEME_COLORS = [
  { name: 'শুব্বান এমারেল্ড', hex: '#0f3e2e' },
  { name: 'রয়াল গোল্ড', hex: '#c59b27' },
  { name: 'ডিপ নেভি', hex: '#1e3a8a' },
  { name: 'ক্লাসিক বুরগুন্ডি', hex: '#831843' },
  { name: 'ট্যুরকোয়েজ গ্রিন', hex: '#0d9488' },
  { name: 'পার্পল ভায়োলেট', hex: '#7c3aed' },
  { name: 'চারকোল গ্রে', hex: '#334155' },
];

export default function CentralMagazineCreateClient({ publishers, categories, users }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    slug: '',
    publisherId: publishers[0]?.id || '',
    categoryId: categories[0]?.id || '',
    frequency: 'MONTHLY',
    description: '',
    coverImage: '',
    editor: '',
    editorialMessage: '',
    language: 'bn',
    themeColor: '#0f3e2e',
    adminUserId: '',
    isSubscribable: true,
    singleIssuePrice: 50,
    monthlySubscriptionPrice: 40,
    annualSubscriptionPrice: 400,
    tags: '',
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u0980-\u09FF-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug === '' || prev.slug.startsWith('mag-') ? generatedSlug : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('সাময়িকীর নাম আবশ্যক');
      return;
    }
    if (!formData.categoryId) {
      setError('একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/publishing/magazines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          singleIssuePrice: Number(formData.singleIssuePrice) || 0,
          monthlySubscriptionPrice: Number(formData.monthlySubscriptionPrice) || 0,
          annualSubscriptionPrice: Number(formData.annualSubscriptionPrice) || 0,
          adminUserId: formData.adminUserId || undefined,
          publisherId: formData.publisherId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'সাময়িকী তৈরি করতে সমস্যা হয়েছে');
      }

      setSuccess(`অভিনন্দন! "${data.magazine.title}"-এর স্বয়ংক্রিয় ওয়ার্কস্পেস তৈরি সম্পন্ন হয়েছে। স্থানান্তর করা হচ্ছে...`);
      setTimeout(() => {
        router.push(`/admin/publishing/workspaces/${data.magazine.id}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'একটি ত্রুটি ঘটেছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <Link href="/admin/publishing" className="hover:text-emerald-700 transition">
              সেন্ট্রাল প্রকাশনা
            </Link>
            <span>/</span>
            <Link href="/admin/publishing/magazines" className="hover:text-emerald-700 transition">
              সকল সাময়িকী
            </Link>
            <span>/</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">নতুন প্রকাশনা তৈরি</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Sparkles className="w-5 h-5" />
            </div>
            নতুন ডিজিটাল সাময়িকী বা জার্নাল নিবন্ধন
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            স্বয়ংক্রিয় ওয়ার্কস্পেস জেনারেশন ইঞ্জিন দ্বারা স্বতন্ত্র শিডিউল, সেটিংস ও টিম স্পেস তৈরি করুন
          </p>
        </div>

        <Link
          href="/admin/publishing/magazines"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          তালিকায় ফিরে যান
        </Link>
      </div>

      {/* Engine Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border border-emerald-500/20 flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-emerald-900 dark:text-emerald-300">
            অটোমেটেড ওয়ার্কস্পেস ইনিশিয়ালাইজেশন
          </p>
          <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
            এই ফর্মটি পূরণ করে সাবমিট করলেই ডাটাবেজ ট্রানজেকশনের মাধ্যমে সাময়িকীর স্বতন্ত্র প্রকাশনা শিডিউল, সম্পাদকীয় টিম রোল, ওয়াটারমার্ক সেটিংস, কপিরাইট পলিসি এবং ডিফল্ট সাবস্ক্রিপশন প্ল্যান স্বয়ংক্রিয়ভাবে জেনারেট হয়ে যাবে।
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                ১. সাধারণ ও প্রাতিষ্ঠানিক তথ্য
              </h2>
              <p className="text-xs text-stone-500">সাময়িকীর নাম, স্ল্যাগ ও প্রকাশক প্রতিষ্ঠান</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                সাময়িকী বা জার্নালের নাম (বাংলা) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="যেমন: মাসিক আত-তাহরীক, শুব্বান দর্শন সাময়িকী, নবচেতনা..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                ইংরেজি নাম (Title in English)
              </label>
              <input
                type="text"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder="e.g. Monthly At-Tahreek, Shubban Philosophy Journal"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                ইউনিক স্ল্যাগ (URL Identifier) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="at-tahreek-monthly"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-xs"
              />
              <p className="text-[10px] text-stone-400 mt-1">পাবলিক লিঙ্ক: /magazine/{formData.slug || 'your-slug'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                প্রকাশক প্রতিষ্ঠান (Publisher Organization)
              </label>
              <select
                value={formData.publisherId}
                onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">স্বতন্ত্র প্রকাশনা (কোনো প্রকাশক নেই)</option>
                {publishers.map((pub) => (
                  <option key={pub.id} value={pub.id}>
                    {pub.name} {pub.nameEn ? `(${pub.nameEn})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                ক্যাটাগরি <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                সংক্ষিপ্ত পরিচিতি ও উদ্দেশ্য
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="এই সাময়িকী বা জার্নালের লক্ষ্য, বিষয়বস্তু এবং আদর্শিক দৃষ্টিভঙ্গি সম্পর্কে বিস্তারিত লিখুন..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Frequency & Scheduling */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                ২. প্রকাশনা ফ্রিকোয়েন্সি ও শিডিউল ইঞ্জিন
              </h2>
              <p className="text-xs text-stone-500">কতদিন পরপর প্রকাশনাটি প্রকাশিত হবে</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREQUENCY_OPTIONS.map((freq) => {
              const selected = formData.frequency === freq.value;
              return (
                <div
                  key={freq.value}
                  onClick={() => setFormData({ ...formData, frequency: freq.value })}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${selected
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {freq.label}
                    </span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  </div>
                  <span className="text-[11px] text-stone-500 leading-snug">{freq.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Editorial & Branding */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                ৩. সম্পাদকীয় টিম ও ব্র্যান্ডিং
              </h2>
              <p className="text-xs text-stone-500">প্রধান সম্পাদক, ভাষা ও থিম রঙ নির্ধারণ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                প্রধান সম্পাদকের নাম
              </label>
              <input
                type="text"
                value={formData.editor}
                onChange={(e) => setFormData({ ...formData, editor: e.target.value })}
                placeholder="যেমন: ড. আসাদুল্লাহ আল-গালিব"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                কভার বা লোগো ইমেজ URL
              </label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                সম্পাদকীয় বার্তা বা মূলমন্ত্র (Editorial Policy / Motto)
              </label>
              <textarea
                rows={2}
                value={formData.editorialMessage}
                onChange={(e) => setFormData({ ...formData, editorialMessage: e.target.value })}
                placeholder="কুরআন ও সহীহ সুন্নাহর ভিত্তিতে জীবন গঠনের প্রত্যয়ে..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Theme Color Selector */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                ওয়ার্কস্পেস ব্র্যান্ড কালার (Theme Accent)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {THEME_COLORS.map((color) => {
                  const isSelected = formData.themeColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={color.hex}
                      onClick={() => setFormData({ ...formData, themeColor: color.hex })}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition ${isSelected
                        ? 'border-emerald-600 bg-stone-100 dark:bg-stone-800 ring-2 ring-emerald-500/40'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                        }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Workspace Admin Assignment */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                ৪. ওয়ার্কস্পেস এডমিন অ্যাসাইনমেন্ট
              </h2>
              <p className="text-xs text-stone-500">এই প্রকাশনা পরিচালনার জন্য নির্দিষ্ট দায়িত্বপ্রাপ্ত এডমিন</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                ওয়ার্কস্পেস প্রধান এডমিন (Publication Admin)
              </label>
              <select
                value={formData.adminUserId}
                onChange={(e) => setFormData({ ...formData, adminUserId: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">বর্তমান সেন্ট্রাল এডমিন (নিজেই হবেন)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.role})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-stone-400 mt-1">
                নির্বাচিত ইউজারকে সরাসরি এই প্রকাশনার &apos;PUBLICATION_ADMIN&apos; ক্ষমতা প্রদান করা হবে
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                ভাষা (Primary Language)
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Subscription & Monetization */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  ৫. সাবস্ক্রিপশন ও রিডিং মনিটাইজেশন
                </h2>
                <p className="text-xs text-stone-500">একক সংখ্যা ও প্রিমিয়াম সাবস্ক্রিপশন মূল্য</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSubscribable}
                onChange={(e) => setFormData({ ...formData, isSubscribable: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                সাবস্ক্রিপশন সক্রিয় করুন
              </span>
            </label>
          </div>

          {formData.isSubscribable && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                  একক সংখ্যার মূল্য (Single Issue ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.singleIssuePrice}
                  onChange={(e) => setFormData({ ...formData, singleIssuePrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                  মাসিক সাবস্ক্রিপশন (Monthly ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlySubscriptionPrice}
                  onChange={(e) => setFormData({ ...formData, monthlySubscriptionPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                  বার্ষিক সাবস্ক্রিপশন (Annual ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.annualSubscriptionPrice}
                  onChange={(e) => setFormData({ ...formData, annualSubscriptionPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/publishing/magazines"
            className="px-6 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 transition"
          >
            বাতিল করুন
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-bold text-sm shadow-lg shadow-emerald-700/20 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ওয়ার্কস্পেস ইনিশিয়ালাইজ হচ্ছে...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                ওয়ার্কস্পেস তৈরি করুন ও কনফিগারেশনে যান
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

