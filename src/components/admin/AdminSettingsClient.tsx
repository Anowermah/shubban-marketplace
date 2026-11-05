'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, LayoutTemplate, Layers, CheckSquare, Square } from 'lucide-react';

interface SettingsProps {
  initialSettings: Record<string, string>;
}

export default function AdminSettingsClient({ initialSettings }: SettingsProps) {
  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: initialSettings.site_title || 'শুব্বান লাইব্রেরী — বই, জ্ঞান ও মননশীলতার এক সমৃদ্ধ ঠিকানা',
    site_tagline: initialSettings.site_tagline || 'জ্ঞানচর্চার নতুন ঠিকানা — শুব্বান লাইব্রেরী',
    contact_email: initialSettings.contact_email || 'info@shubbanlibrary.com',
    contact_phone: initialSettings.contact_phone || '+880 1711-000000',
    contact_address: initialSettings.contact_address || 'বাংলাবাজার ও কাঁটাবন জ্ঞান চত্বর, ঢাকা, বাংলাদেশ',
    delivery_fee_inside_dhaka: initialSettings.delivery_fee_inside_dhaka || '60',
    delivery_fee_outside_dhaka: initialSettings.delivery_fee_outside_dhaka || '110',
    // Homepage Section CMS Toggles (Default to true if not explicitly set to 'false')
    home_show_slider: initialSettings.home_show_slider ?? 'true',
    home_show_categories: initialSettings.home_show_categories ?? 'true',
    home_show_flash_sale: initialSettings.home_show_flash_sale ?? 'true',
    home_show_featured_books: initialSettings.home_show_featured_books ?? 'true',
    home_show_digital_library: initialSettings.home_show_digital_library ?? 'true',
    home_show_new_and_bestsellers: initialSettings.home_show_new_and_bestsellers ?? 'true',
    home_show_islamic_books: initialSettings.home_show_islamic_books ?? 'true',
    home_show_lifestyle: initialSettings.home_show_lifestyle ?? 'true',
    home_show_donations: initialSettings.home_show_donations ?? 'true',
    home_show_magazines: initialSettings.home_show_magazines ?? 'true',
    home_show_articles: initialSettings.home_show_articles ?? 'true',
    home_show_research_qa: initialSettings.home_show_research_qa ?? 'true',
    home_show_vendors: initialSettings.home_show_vendors ?? 'true',
    home_show_authors: initialSettings.home_show_authors ?? 'true',
    home_show_publishers: initialSettings.home_show_publishers ?? 'true',
    home_show_membership: initialSettings.home_show_membership ?? 'true',
    home_show_newsletter: initialSettings.home_show_newsletter ?? 'true',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === 'false' ? 'true' : 'false',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setFeedback('সমস্ত সেটিংস সফলভাবে সংরক্ষিত ও সক্রিয় হয়েছে!');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('আপনি কি নিশ্চিত যে সমস্ত সেটিংস সিস্টেমের ডিফল্ট মানে ফিরিয়ে নিতে চান?')) {
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings?resetAll=true', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(data.message || 'সেটিংস সফলভাবে রিসেট করা হয়েছে!');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setFeedback(data.error || 'রিসেট করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setFeedback('সার্ভারে সংযোগে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const homepageSections = [
    { key: 'home_show_slider', label: 'প্রমোশনাল হিরো স্লাইডার (Hero Slider & Trust Bar)', desc: 'ব্যানার ও দেশব্যাপী দ্রুত ডেলিভারি গ্যারান্টি বার' },
    { key: 'home_show_categories', label: 'ফিচার্ড ক্যাটাগরি আইকন গ্রিড (Category Icons)', desc: '৮টি প্রধান বিভাগের বৃত্তাকার আইকন কার্ড' },
    { key: 'home_show_flash_sale', label: 'ফ্ল্যাশ সেল ও স্পেশাল অফার বার (Flash Sale Countdown)', desc: 'লাইভ কাউন্টডাউন টাইমার ও স্পেশাল কুপন কোড বার' },
    { key: 'home_show_featured_books', label: 'বিশেষ নির্বাচিত বইসমূহ (Featured Books)', desc: 'সম্পাদকের পছন্দের নির্বাচিত বইয়ের গ্রিড' },
    { key: 'home_show_digital_library', label: 'মুক্ত পাঠাগার / ফ্রি ডিজিটাল বই (Free PDF Library)', desc: 'ব্রাউজারে সরাসরি পড়ার মুক্ত বই' },
    { key: 'home_show_new_and_bestsellers', label: 'নতুন বই ও সর্বাধিক বিক্রীত বই (New & Best-sellers)', desc: 'নতুন রিলিজ ও পাঠকদের সর্বাধিক পছন্দের বই' },
    { key: 'home_show_islamic_books', label: 'ইসলামিক বই কালেকশন (Islamic Books Showcase)', desc: 'কুরআন, হাদিস, সীরাত ও ফিকহের প্রামাণিক সংগ্রহ' },
    { key: 'home_show_lifestyle', label: 'ইসলামিক লাইফস্টাইল ও আতর কালেকশন (Sunnah Essentials)', desc: 'সুন্নাহসম্মত লাইফস্টাইল পণ্য ও প্রিমিয়াম আতর' },
    { key: 'home_show_donations', label: 'আস-সুন্নাহ ও শুব্বান সদকাহ ফান্ড (Donation Campaigns)', desc: 'লাইভ প্রগ্রেস বার সহ ইসলামিক মানবসেবা ক্যাম্পেইন' },
    { key: 'home_show_magazines', label: 'সাপ্তাহিক ও মাসিক পত্রিকা (Magazines & Periodicals)', desc: 'নিয়মিত সাময়িকী ও আর্কাইভ সংখ্যা' },
    { key: 'home_show_articles', label: 'সাম্প্রতিক প্রবন্ধ ও চিন্তাশীল নিবন্ধ (Editorial Articles)', desc: 'গবেষণামূলক ও মননশীল সম্পাদকীয় রচনা' },
    { key: 'home_show_research_qa', label: 'একাডেমিক গবেষণা ও প্রশ্নোত্তর (Research & Community Q&A)', desc: 'পিয়ার-রিভিউড গবেষণাপত্র ও প্রশ্নোত্তরের ফোরাম' },
    { key: 'home_show_vendors', label: 'শীর্ষ মার্কেটপ্লেস বিক্রেতা (Multi-Vendor Marketplace)', desc: 'দারাজ ও রকমারি স্টাইলে অনুমোদিত সেলারদের দোকান' },
    { key: 'home_show_authors', label: 'বরেণ্য লেখক পরিচিতি (Featured Authors)', desc: 'জনপ্রিয় ও চিরায়ত লেখকদের কার্ড' },
    { key: 'home_show_publishers', label: 'শীর্ষ প্রকাশনী সংস্থা (Featured Publishers)', desc: 'সম্মানিত প্রকাশনা প্রতিষ্ঠানের তালিকা ও বই সংখ্যা' },
    { key: 'home_show_membership', label: 'শুব্বান জ্ঞান সাধক মেম্বারশিপ ব্যানার (Membership Banner)', desc: 'ডিজিটাল সদস্যপদ ও সাবস্ক্রিপশন প্ল্যানের কল-টু-অ্যাকশন' },
    { key: 'home_show_newsletter', label: 'নিউজলেটার ও পাঠক সংযোগ (Newsletter & Community)', desc: 'হোমপেজে সরাসরি ইমেইল সাবস্ক্রিপশন বক্স' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. General Brand Information */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800">
          সাধারণ ব্র্যান্ড ও যোগাযোগ তথ্য
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              ওয়েবসাইট শিরোনাম (SEO Title)
            </label>
            <input
              type="text"
              name="site_title"
              value={settings.site_title}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              মূল স্লোগান / ট্যাগলাইন
            </label>
            <input
              type="text"
              name="site_tagline"
              value={settings.site_tagline}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              অফিসিয়াল সাপোর্ট ইমেইল
            </label>
            <input
              type="email"
              name="contact_email"
              value={settings.contact_email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              গ্রাহক সেবা হেল্পলাইন ফোন
            </label>
            <input
              type="text"
              name="contact_phone"
              value={settings.contact_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              প্রধান কার্যালয় ও পাঠাগার ঠিকানা
            </label>
            <textarea
              name="contact_address"
              rows={2}
              value={settings.contact_address}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>
        </div>
      </div>

      {/* 2. Shipping Fees Configuration */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800">
          ডেলিভারি ও কুরিয়ার ফি কনফিগারেশন
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              ঢাকা মেট্রোপলিটন ডেলিভারি ফি (টাকা)
            </label>
            <input
              type="number"
              name="delivery_fee_inside_dhaka"
              value={settings.delivery_fee_inside_dhaka}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              ঢাকার বাইরে সারাদেশে ডেলিভারি ফি (টাকা)
            </label>
            <input
              type="number"
              name="delivery_fee_outside_dhaka"
              value={settings.delivery_fee_outside_dhaka}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>
        </div>
      </div>

      {/* 3. Homepage Section CMS Controls (Dynamic Section Visibility) */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-shubban-gold" />
              <span>হোমপেজ সেকশন সিএমএস ও দৃশ্যমানতা (Homepage CMS)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              প্রয়োজন অনুযায়ী যেকোনো সেকশন হোমপেজ থেকে চালু বা বন্ধ করুন।
            </p>
          </div>
          <span className="text-xs bg-shubban-green/10 text-shubban-green dark:text-shubban-gold font-bold px-3 py-1 rounded-full">
            ডাইনামিক সিএমএস
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {homepageSections.map((sec) => {
            const isActive = settings[sec.key] !== 'false';
            return (
              <div
                key={sec.key}
                onClick={() => handleToggle(sec.key)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isActive
                    ? 'bg-shubban-green-50/60 dark:bg-shubban-green/10 border-shubban-green/30 dark:border-shubban-green/40'
                    : 'bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 opacity-60'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isActive ? (
                    <CheckSquare className="w-5 h-5 text-shubban-green dark:text-shubban-gold" />
                  ) : (
                    <Square className="w-5 h-5 text-stone-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                    {sec.label}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {sec.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
        </button>

        <button
          type="button"
          onClick={handleResetDefaults}
          disabled={isSaving}
          className="px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <span>ডিফল্ট সেটিংসে ফিরিয়ে নিন</span>
        </button>
      </div>
    </form>
  );
}
