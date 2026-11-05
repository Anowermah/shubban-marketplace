'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OnboardingProps {
  defaultEmail: string;
  defaultName: string;
}

export default function AdvertiserOnboardingForm({ defaultEmail, defaultName }: OnboardingProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState(defaultName || '');
  const [email, setEmail] = useState(defaultEmail || '');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/advertiser/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          phone,
          website,
          taxId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        setError(data.error || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      setError(err.message || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 font-bengali">
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            বিজ্ঞাপনদাতা প্রোফাইল তৈরি করুন
          </h2>
          <p className="text-xs text-stone-500">
            শুব্বান লাইব্রেরীতে ক্যাম্পেইন পরিচালনার জন্য আপনার ব্যবসা বা প্রতিষ্ঠানের বিবরণ দিন।
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-stone-300">ব্যবসা বা প্রতিষ্ঠানের নাম *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="যেমন: আল-কাউসার পাবলিকেশন অথবা ইসলামিক বুক শপ"
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-300">যোগাযোগকারী ব্যক্তির নাম *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-300">অফিসিয়াল ইমেইল *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-300">ফোন নম্বর *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801711000000"
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-300">ওয়েবসাইট (যদি থাকে)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-stone-700 dark:text-stone-300">ট্রেড লাইসেন্স বা ট্যাক্স আইডি (ঐচ্ছিক)</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="ট্যাক্স অথবা ট্রেড লাইসেন্স নম্বর"
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>প্রতিষ্ঠান প্রোফাইল সম্পন্ন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

