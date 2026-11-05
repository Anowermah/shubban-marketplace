'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import Logo from '@/components/brand/Logo';
import { User, Mail, Lock, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      setErrorMsg('অনুগ্রহ করে সেবা নীতিমালা ও শর্তাবলিতে সম্মতি দিন।');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await register(name, email, password, phone);
    if (res.success) {
      router.push('/account');
    } else {
      setErrorMsg(res.error || 'নিবন্ধন সম্পন্ন হতে সমস্যা হয়েছে।');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-bengali">
      <div className="w-full max-w-md bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            নতুন সদস্য হিসেবে নিবন্ধন করুন
          </h1>
          <p className="text-xs text-stone-500">
            বিনামূল্যে অ্যাকাউন্ট তৈরি করে পুরো মুক্ত ডিজিটাল লাইব্রেরীর অংশ হোন।
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              আপনার পূর্ণ নাম *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: আহমদ শফিক"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              ইমেইল ঠিকানা *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@domain.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              মোবাইল নম্বর (ঐচ্ছিক)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১৭১১-০০০০০০"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="rounded text-shubban-gold focus:ring-shubban-gold"
            />
            <label htmlFor="agree" className="text-xs text-stone-600 dark:text-stone-400">
              আমি শুব্বান লাইব্রেরীর{' '}
              <Link href="/terms" className="text-shubban-gold hover:underline">
                ব্যবহারের শর্তাবলি
              </Link>{' '}
              ও{' '}
              <Link href="/privacy-policy" className="text-shubban-gold hover:underline">
                গোপনীয়তা নীতি
              </Link>{' '}
              মেনে নিচ্ছি।
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'নিবন্ধন করা হচ্ছে...' : 'অ্যাকাউন্ট খুলুন'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-500">
          <span>ইতোমধ্যে অ্যাকাউন্ট আছে? </span>
          <Link href="/login" className="font-bold text-shubban-gold hover:underline">
            লগইন করুন
          </Link>
        </div>
      </div>
    </div>
  );
}

