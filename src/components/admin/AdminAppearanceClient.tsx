'use client';

import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Type,
  Image as ImageIcon,
  Megaphone,
  Share2,
  Check,
  Eye,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { DEFAULT_APPEARANCE } from '@/lib/appearance-constants';

interface AdminAppearanceClientProps {
  initialSettings: Record<string, string>;
}

const PALETTE_PRESETS = [
  {
    name: 'শুব্বান গোল্ড ও রয়েল গ্রিন (অফিসিয়াল)',
    primary: '#D4AF37',
    secondary: '#0d3824',
    accent: '#F59E0B',
  },
  {
    name: 'মারকাজুল কুরআন এমারেল্ড',
    primary: '#059669',
    secondary: '#064e3b',
    accent: '#10B981',
  },
  {
    name: 'চিরায়ত লাইব্রেরি মিডনাইট ব্লু',
    primary: '#38BDF8',
    secondary: '#0F172A',
    accent: '#0284C7',
  },
  {
    name: 'মদিনা কাফেলা সানসেট অ্যাম্বার',
    primary: '#F59E0B',
    secondary: '#451A03',
    accent: '#D97706',
  },
];

const BANGLA_FONTS = [
  { key: 'Sharif Shishir', label: 'শরিফ শিশির (Shubban Signature Modern)', preview: 'জ্ঞান অন্বেষণে শুব্বান লাইব্রেরী' },
  { key: 'Kalpurush', label: 'কালপুরুষ (Classic Editorial Serif)', preview: 'জ্ঞান অন্বেষণে শুব্বান লাইব্রেরী' },
  { key: 'SolaimanLipi', label: 'সোলায়মান লিপি (Standard Bengali Sans)', preview: 'জ্ঞান অন্বেষণে শুব্বান লাইব্রেরী' },
  { key: 'Hind Siliguri', label: 'হিন্ড শিলিগুড়ি (Crisp Clean Sans-serif)', preview: 'জ্ঞান অন্বেষণে শুব্বান লাইব্রেরী' },
];

const ARABIC_FONTS = [
  { key: 'Uthmanic Hafs', label: 'উসমানী হাফস (Quranic Mushaf Script)', preview: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
  { key: 'Amiri', label: 'আমীরী (Naskh Classical Type)', preview: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
  { key: 'Scheherazade New', label: 'শাহরাযাদ (Traditional Book Script)', preview: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
];

export default function AdminAppearanceClient({ initialSettings }: AdminAppearanceClientProps) {
  const [form, setForm] = useState<Record<string, string>>({
    ...DEFAULT_APPEARANCE,
    ...initialSettings,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const applyPreset = (preset: (typeof PALETTE_PRESETS)[0]) => {
    setForm((prev) => ({
      ...prev,
      brand_primary_color: preset.primary,
      brand_secondary_color: preset.secondary,
      brand_accent_color: preset.accent,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message || 'থিম সেটিংস সফলভাবে প্রয়োগ করা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', message: data.error || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('আপনি কি নিশ্চিত যে সম্পূর্ণ থিম ও রূপসজ্জা ফ্যাক্টরি ডিফল্টে রিসেট করতে চান?')) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/appearance', { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setForm({ ...DEFAULT_APPEARANCE });
        setFeedback({ type: 'success', message: data.message || 'থিম সফলভাবে ডিফল্টে রিসেট করা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', message: data.error || 'রিসেট করতে ব্যর্থ হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-bengali">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Palette className="w-6 h-6 text-shubban-gold" />
            <span>ওয়েবসাইট অ্যাপিয়ারেন্স ও থিম কাস্টমাইজেশন</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মার্কেটপ্লেসের ব্র্যান্ড কালার, ইসলামিক ক্যালিগ্রাফি ফন্ট, ব্যানার নোটিশ ও সোশ্যাল লিংকসমূহ কেন্দ্রীয়ভাবে নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>ডিফল্ট থিমে রিসেট</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
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

      {/* Live Preview Card */}
      <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-shubban-gold" />
            <span>লাইভ প্রিভিউ (Live Appearance Preview)</span>
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            {form.theme_default_mode} MODE
          </span>
        </div>

        {/* Live Top Notice Bar */}
        {form.top_notice_bar_enabled === 'true' && (
          <div
            className="p-2.5 rounded-xl text-center text-xs font-semibold text-white transition-all shadow-xs"
            style={{ backgroundColor: form.brand_secondary_color }}
          >
            <span>{form.top_notice_bar_text}</span>
          </div>
        )}

        {/* Live Mock Header / Hero */}
        <div
          className="p-6 rounded-2xl text-white transition-all space-y-3 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${form.brand_secondary_color} 0%, #081a11 100%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold font-serif"
                style={{ backgroundColor: form.brand_primary_color, color: form.brand_secondary_color }}
              >
                শু
              </div>
              <span className="font-serif font-bold text-base" style={{ color: form.brand_primary_color }}>
                শুব্বান লাইব্রেরী
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: `${form.brand_primary_color}33`, color: form.brand_primary_color }}
              >
                {form.font_family_bangla}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <h2 className="text-xl font-bold font-serif">জ্ঞান, মনন ও ইসলামিক ঐতিহ্যের সমৃদ্ধ ঠিকানা</h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xl">
              প্রামাণ্য হাদিস, তাফসীর ও সমকালীন চিন্তাশীল প্রকাশনার নির্ভরযোগ্য প্ল্যাটফর্ম।
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-transform shadow"
              style={{ backgroundColor: form.brand_primary_color, color: '#092115' }}
            >
              বই কালেকশন ব্রাউজ করুন
            </button>
            <span className="text-xs text-stone-300 font-mono">
              আরবি ক্যালিগ্রাফি: {form.font_family_arabic}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Color Themes & Presets */}
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <Palette className="w-5 h-5 text-shubban-gold" />
            <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              ব্র্যান্ড কালার প্যালেট ও প্রিসেট
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PALETTE_PRESETS.map((p) => {
              const isSelected =
                form.brand_primary_color === p.primary && form.brand_secondary_color === p.secondary;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-shubban-gold bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-shubban-gold/40'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full border shadow-xs shrink-0" style={{ backgroundColor: p.primary }} />
                    <span className="w-6 h-6 rounded-full border shadow-xs shrink-0" style={{ backgroundColor: p.secondary }} />
                    <span className="w-6 h-6 rounded-full border shadow-xs shrink-0" style={{ backgroundColor: p.accent }} />
                  </div>
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Hex Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                প্রাইমারি গোল্ড / ব্র্যান্ড রঙ (Hex)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="brand_primary_color"
                  value={form.brand_primary_color}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5"
                />
                <input
                  type="text"
                  name="brand_primary_color"
                  value={form.brand_primary_color}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono uppercase font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                সেকেন্ডারি রয়েল গ্রিন / ব্যাকগ্রাউন্ড রঙ (Hex)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="brand_secondary_color"
                  value={form.brand_secondary_color}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5"
                />
                <input
                  type="text"
                  name="brand_secondary_color"
                  value={form.brand_secondary_color}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono uppercase font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                অ্যাকসেন্ট হাইলাইট রঙ (Hex)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="brand_accent_color"
                  value={form.brand_accent_color}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5"
                />
                <input
                  type="text"
                  name="brand_accent_color"
                  value={form.brand_accent_color}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono uppercase font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Typography & Calligraphy */}
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <Type className="w-5 h-5 text-shubban-gold" />
            <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              টাইপোগ্রাফি ও ফন্ট ক্যালিগ্রাফি স্টুডিও
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block">
                বাংলা প্রধান ফন্ট নির্বাচন
              </label>
              <div className="space-y-2">
                {BANGLA_FONTS.map((font) => (
                  <label
                    key={font.key}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-colors ${
                      form.font_family_bangla === font.key
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-shubban-gold'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="font_family_bangla"
                        value={font.key}
                        checked={form.font_family_bangla === font.key}
                        onChange={handleChange}
                        className="accent-shubban-green"
                      />
                      <span className="font-bold text-stone-900 dark:text-stone-100">{font.label}</span>
                    </div>
                    <span className="text-stone-400 text-[11px]">{font.preview}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block">
                আরবি কুরআন ও হাদিস ফন্ট নির্বাচন
              </label>
              <div className="space-y-2">
                {ARABIC_FONTS.map((font) => (
                  <label
                    key={font.key}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-colors ${
                      form.font_family_arabic === font.key
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-shubban-gold'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="font_family_arabic"
                        value={font.key}
                        checked={form.font_family_arabic === font.key}
                        onChange={handleChange}
                        className="accent-shubban-green"
                      />
                      <span className="font-bold text-stone-900 dark:text-stone-100">{font.label}</span>
                    </div>
                    <span className="text-stone-400 font-serif text-sm dir-rtl">{font.preview}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Top Announcement & Notice Bar */}
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-shubban-gold" />
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                হেডার নোটিশ ও অফার অ্যানাউন্সমেন্ট বার
              </h2>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                name="top_notice_bar_enabled"
                checked={form.top_notice_bar_enabled === 'true'}
                onChange={(e) =>
                  setForm({ ...form, top_notice_bar_enabled: e.target.checked ? 'true' : 'false' })
                }
                className="accent-shubban-green"
              />
              <span>নোটিশ বার চালু রাখুন</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                নোটিশ বার টেক্সট
              </label>
              <input
                type="text"
                name="top_notice_bar_text"
                value={form.top_notice_bar_text}
                onChange={handleChange}
                placeholder="যেমন: বিশেষ অফার বা দেশব্যাপী ডেলিভারি ঘোষণা..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ক্লিক লিংক (URL)
              </label>
              <input
                type="text"
                name="top_notice_bar_link"
                value={form.top_notice_bar_link}
                onChange={handleChange}
                placeholder="যেমন: /books বা /promotions"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Logos and Assets */}
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <ImageIcon className="w-5 h-5 text-shubban-gold" />
            <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              ব্র্যান্ড লোগো ও আইকন অ্যাসেট
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                প্রধান লোগো URL (লাইট মোড)
              </label>
              <input
                type="text"
                name="brand_logo_url"
                value={form.brand_logo_url}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ডার্ক মোড লোগো URL
              </label>
              <input
                type="text"
                name="brand_logo_dark_url"
                value={form.brand_logo_dark_url}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ফেভিকন (Favicon) URL
              </label>
              <input
                type="text"
                name="brand_favicon_url"
                value={form.brand_favicon_url}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: Footer & Social Links */}
        <div className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <Share2 className="w-5 h-5 text-shubban-gold" />
            <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              ফুটার তথ্য ও সোশ্যাল মিডিয়া সংযোগ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ফুটার কপিরাইট বার্তা
              </label>
              <input
                type="text"
                name="footer_copyright_text"
                value={form.footer_copyright_text}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ইসলামিক ট্রাস্ট ব্যাজ লেখা
              </label>
              <input
                type="text"
                name="footer_trust_badge_text"
                value={form.footer_trust_badge_text}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ফেসবুক পেজ লিংক
              </label>
              <input
                type="text"
                name="social_facebook"
                value={form.social_facebook}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ইউটিউব চ্যানেল লিংক
              </label>
              <input
                type="text"
                name="social_youtube"
                value={form.social_youtube}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                টেলিগ্রাম চ্যানেল লিংক
              </label>
              <input
                type="text"
                name="social_telegram"
                value={form.social_telegram}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                হোয়াটসঅ্যাপ সাপোর্ট নম্বর
              </label>
              <input
                type="text"
                name="social_whatsapp"
                value={form.social_whatsapp}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>থিম ও রূপসজ্জা সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>
    </div>
  );
}

