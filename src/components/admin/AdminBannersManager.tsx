'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MediaPickerInput from '@/components/media/MediaPickerInput';
import {
  ImageIcon,
  Plus,
  Edit,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  ExternalLink,
  Flame,
  Sparkles,
  BookOpen,
  Gift,
  HeartHandshake,
  Store,
  Tag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export interface HeroSlideItem {
  id: string;
  badge: string;
  badgeIcon: string;
  headline: string;
  subhead: string;
  couponCode?: string | null;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
  bgGradient: string;
  imageUrl: string;
  displayOrder: number;
  isPublished: boolean;
}

interface AdminBannersManagerProps {
  initialSlides: HeroSlideItem[];
}

const GRADIENT_OPTIONS = [
  { label: 'মরু শুব্বান সবুজ (Emerald/Green)', value: 'from-shubban-green via-emerald-950 to-shubban-green' },
  { label: 'আতর ও সুন্নাহ অ্যাম্বার (Amber/Gold)', value: 'from-amber-950 via-stone-900 to-amber-950' },
  { label: 'চ্যারিটি টিল ও নেভি (Teal/Navy)', value: 'from-emerald-950 via-teal-950 to-emerald-950' },
  { label: 'কালো ও চারকোল লাক্সারি (Dark Charcoal)', value: 'from-stone-900 via-stone-950 to-stone-900' },
  { label: 'রয়েল ইন্ডিগো (Royal Indigo)', value: 'from-indigo-950 via-slate-900 to-indigo-950' },
];

const ICON_OPTIONS = [
  { label: 'অগ্নিশিখা (Flame)', value: 'Flame', icon: Flame },
  { label: 'তারকারাজি (Sparkles)', value: 'Sparkles', icon: Sparkles },
  { label: 'খোলা বই (BookOpen)', value: 'BookOpen', icon: BookOpen },
  { label: 'উপহার (Gift)', value: 'Gift', icon: Gift },
  { label: 'দান ও করমর্দন (HeartHandshake)', value: 'HeartHandshake', icon: HeartHandshake },
  { label: 'দোকান (Store)', value: 'Store', icon: Store },
];

export default function AdminBannersManager({ initialSlides }: AdminBannersManagerProps) {
  const [slides, setSlides] = useState<HeroSlideItem[]>(initialSlides);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [newSlide, setNewSlide] = useState({
    badge: 'শুব্বান নতুন আকর্ষণ',
    badgeIcon: 'Sparkles',
    headline: '',
    subhead: '',
    couponCode: '',
    primaryCtaText: 'সকল বই দেখুন',
    primaryCtaLink: '/books',
    secondaryCtaText: '',
    secondaryCtaLink: '',
    bgGradient: GRADIENT_OPTIONS[0].value,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
    isPublished: true,
  });

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-amber-300" />;
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Gift':
        return <Gift className="w-3.5 h-3.5 text-rose-400" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-3.5 h-3.5 text-teal-300" />;
      case 'Store':
        return <Store className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-300" />;
    }
  };

  // Move Slide Up
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newArr = [...slides];
    const temp = newArr[index];
    newArr[index] = newArr[index - 1];
    newArr[index - 1] = temp;

    const updated = newArr.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    setSlides(updated);
    await syncOrders(updated);
  };

  // Move Slide Down
  const handleMoveDown = async (index: number) => {
    if (index === slides.length - 1) return;
    const newArr = [...slides];
    const temp = newArr[index];
    newArr[index] = newArr[index + 1];
    newArr[index + 1] = temp;

    const updated = newArr.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    setSlides(updated);
    await syncOrders(updated);
  };

  const syncOrders = async (items: HeroSlideItem[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/homepage/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: items.map((i) => ({ id: i.id, displayOrder: i.displayOrder })),
        }),
      });
      if (!res.ok) throw new Error('স্লাইডার ক্রম সংরক্ষণ ব্যর্থ হয়েছে।');
      showNotification('স্লাইডারের ক্রমানুসার সংরক্ষিত হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Publish
  const handleTogglePublished = async (slide: HeroSlideItem) => {
    const newStatus = !slide.isPublished;
    const updated = slides.map((s) => (s.id === slide.id ? { ...s, isPublished: newStatus } : s));
    setSlides(updated);

    try {
      const res = await fetch(`/api/admin/homepage/banners/${slide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      if (!res.ok) throw new Error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।');
      showNotification(`স্লাইডটি ${newStatus ? 'প্রকাশিত' : 'অপ্রকাশিত'} করা হয়েছে।`);
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/homepage/banners/${editingSlide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSlide),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'স্লাইড আপডেট ব্যর্থ হয়েছে।');

      setSlides(slides.map((s) => (s.id === editingSlide.id ? data.slide : s)));
      setEditingSlide(null);
      showNotification('ব্যানার স্লাইডার সফলভাবে হালনাগাদ করা হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Create Slide
  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.headline || !newSlide.imageUrl) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/homepage/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlide),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'নতুন স্লাইড তৈরি ব্যর্থ হয়েছে।');

      setSlides([...slides, data.slide]);
      setIsCreating(false);
      showNotification('নতুন ব্যানার স্লাইড সফলভাবে যুক্ত হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Slide
  const handleDeleteSlide = async (id: string, headline: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে এই স্লাইডটি মুছে ফেলতে চান?\n"${headline}"`)) return;
    try {
      const res = await fetch(`/api/admin/homepage/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('স্লাইড মুছতে সমস্যা হয়েছে।');
      setSlides(slides.filter((s) => s.id !== id));
      showNotification('ব্যানার স্লাইডটি মুছে ফেলা হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-shubban-gold" />
            <span>হিরো ব্যানার ও প্রমোশনাল স্লাইডার (Hero Banners Manager)</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            হোমপেজের মূল প্রমোশনাল হিরো স্লাইডার, হেডলাইন, ব্যানার ইমেজ, কুপন কোড ও সিটিএ বাটন পরিচালনা করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-shubban-gold" />
            <span>ওয়েবসাইটে প্রিভিউ</span>
          </Link>

          <Link
            href="/admin/homepage"
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>হোমপেজ সেকশন বিল্ডার</span>
          </Link>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold flex items-center gap-1.5 shadow transition-all"
          >
            <Plus className="w-4 h-4 text-shubban-gold" />
            <span>নতুন ব্যানার স্লাইড যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border transition-all ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid of Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`rounded-3xl border overflow-hidden transition-all shadow-md flex flex-col justify-between ${
              slide.isPublished
                ? 'border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard'
                : 'border-dashed border-stone-300 dark:border-stone-800 opacity-60 bg-stone-50 dark:bg-stone-900/40'
            }`}
          >
            {/* Visual Simulated Banner Header */}
            <div className={`p-6 bg-gradient-to-br ${slide.bgGradient} text-white relative overflow-hidden`}>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
                    {renderBadgeIcon(slide.badgeIcon)}
                    <span>{slide.badge}</span>
                  </div>

                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                    স্লাইড #{toBengaliNumber(slide.displayOrder)}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-xl leading-snug">{slide.headline}</h3>
                <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">{slide.subhead}</p>

                {slide.couponCode && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 text-xs font-bold font-mono">
                    <Tag className="w-3.5 h-3.5" />
                    <span>কুপন: {slide.couponCode}</span>
                  </div>
                )}
              </div>

              {/* Image thumbnail background overlay */}
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-25 overflow-hidden">
                <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Banner Details & Action Controls */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <span className="text-stone-500 block">
                    প্রাইমারি বাটন: <strong className="text-stone-800 dark:text-stone-200">{slide.primaryCtaText}</strong> ({slide.primaryCtaLink})
                  </span>
                  {slide.secondaryCtaText && (
                    <span className="text-stone-500 block">
                      সেকেন্ডারি বাটন: <strong className="text-stone-800 dark:text-stone-200">{slide.secondaryCtaText}</strong> ({slide.secondaryCtaLink})
                    </span>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    slide.isPublished
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  {slide.isPublished ? 'ওয়েবসাইটে সক্রিয়' : 'অপ্রকাশিত / খসড়া'}
                </span>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 disabled:opacity-20"
                    title="আগে নিন"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === slides.length - 1}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 disabled:opacity-20"
                    title="পরে নিন"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublished(slide)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                      slide.isPublished
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {slide.isPublished ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>সক্রিয়</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>নিষ্ক্রিয়</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingSlide(slide)}
                    className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
                    title="সম্পাদনা করুন"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteSlide(slide.id, slide.headline)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Slide Modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  ব্যানার স্লাইডার সম্পাদনা
                </h3>
              </div>
              <button
                onClick={() => setEditingSlide(null)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাজ শিরোনাম
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.badge}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাজ আইকন
                  </label>
                  <select
                    value={editingSlide.badgeIcon}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badgeIcon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  প্রধান আকর্ষণ / হেডলাইন (বাংলা)
                </label>
                <input
                  type="text"
                  required
                  value={editingSlide.headline}
                  onChange={(e) => setEditingSlide({ ...editingSlide, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  উপশিরোনাম / আকর্ষণীয় অফারের বর্ণনা
                </label>
                <textarea
                  rows={3}
                  value={editingSlide.subhead}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subhead: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    কুপন কোড (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="উদা: SHUBBAN10"
                    value={editingSlide.couponCode || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, couponCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট থিম
                  </label>
                  <select
                    value={editingSlide.bgGradient}
                    onChange={(e) => setEditingSlide({ ...editingSlide, bgGradient: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    {GRADIENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <MediaPickerInput
                label="ব্যানার ছবি (Banner Image)"
                required
                value={editingSlide.imageUrl}
                onChange={(url) => setEditingSlide({ ...editingSlide, imageUrl: url })}
                allowedTypes={['IMAGE']}
                placeholder="ছবির লিঙ্ক লিখুন বা মিডিয়া লাইব্রেরি থেকে সিলেক্ট করুন"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রাইমারি বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={editingSlide.primaryCtaText}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রাইমারি বাটন লিংক
                  </label>
                  <input
                    type="text"
                    value={editingSlide.primaryCtaLink}
                    onChange={(e) => setEditingSlide({ ...editingSlide, primaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সেকেন্ডারি বাটন টেক্সট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.secondaryCtaText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সেকেন্ডারি বাটন লিংক (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.secondaryCtaLink || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secondaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slide-published-edit"
                  checked={editingSlide.isPublished}
                  onChange={(e) => setEditingSlide({ ...editingSlide, isPublished: e.target.checked })}
                  className="rounded text-shubban-green focus:ring-shubban-gold"
                />
                <label htmlFor="slide-published-edit" className="text-stone-700 dark:text-stone-300 font-semibold cursor-pointer">
                  এই স্লাইডটি ওয়েবসাইটে সক্রিয় (Published) রাখুন
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-shubban-gold" />
                  <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Slide Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  নতুন ব্যানার স্লাইড তৈরি করুন
                </h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSlide} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাজ শিরোনাম
                  </label>
                  <input
                    type="text"
                    required
                    value={newSlide.badge}
                    onChange={(e) => setNewSlide({ ...newSlide, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাজ আইকন
                  </label>
                  <select
                    value={newSlide.badgeIcon}
                    onChange={(e) => setNewSlide({ ...newSlide, badgeIcon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  প্রধান আকর্ষণ / হেডলাইন (বাংলা)
                </label>
                <input
                  type="text"
                  required
                  placeholder="চিরায়ত ও আধুনিক শ্রেষ্ঠ গ্রন্থসম্ভারে ৩০% পর্যন্ত বিশেষ ছাড়!"
                  value={newSlide.headline}
                  onChange={(e) => setNewSlide({ ...newSlide, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  উপশিরোনাম / অফারের বিস্তারিত বর্ণনা
                </label>
                <textarea
                  rows={3}
                  placeholder="বইপ্রেমী পাঠকদের জন্য বিশেষ মেলা ও উপহার প্যাকেজ..."
                  value={newSlide.subhead}
                  onChange={(e) => setNewSlide({ ...newSlide, subhead: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    কুপন কোড (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="SHUBBAN10"
                    value={newSlide.couponCode}
                    onChange={(e) => setNewSlide({ ...newSlide, couponCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট
                  </label>
                  <select
                    value={newSlide.bgGradient}
                    onChange={(e) => setNewSlide({ ...newSlide, bgGradient: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    {GRADIENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <MediaPickerInput
                label="ব্যানার ছবি (Banner Image)"
                required
                value={newSlide.imageUrl}
                onChange={(url) => setNewSlide({ ...newSlide, imageUrl: url })}
                allowedTypes={['IMAGE']}
                placeholder="ছবির লিঙ্ক লিখুন বা মিডিয়া লাইব্রেরি থেকে সিলেক্ট করুন"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রাইমারি বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={newSlide.primaryCtaText}
                    onChange={(e) => setNewSlide({ ...newSlide, primaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রাইমারি বাটন লিংক
                  </label>
                  <input
                    type="text"
                    value={newSlide.primaryCtaLink}
                    onChange={(e) => setNewSlide({ ...newSlide, primaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সেকেন্ডারি বাটন টেক্সট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="ডিজিটাল লাইব্রেরী"
                    value={newSlide.secondaryCtaText}
                    onChange={(e) => setNewSlide({ ...newSlide, secondaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সেকেন্ডারি বাটন লিংক (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="/digital-library"
                    value={newSlide.secondaryCtaLink}
                    onChange={(e) => setNewSlide({ ...newSlide, secondaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="slide-published-new"
                  checked={newSlide.isPublished}
                  onChange={(e) => setNewSlide({ ...newSlide, isPublished: e.target.checked })}
                  className="rounded text-shubban-green focus:ring-shubban-gold"
                />
                <label htmlFor="slide-published-new" className="text-stone-700 dark:text-stone-300 font-semibold cursor-pointer">
                  তৈরি হওয়ার সাথে সাথে ওয়েবসাইটে সক্রিয় (Published) রাখুন
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-shubban-gold" />
                  <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'স্লাইড যুক্ত করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

