'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import Logo from '@/components/brand/Logo';
import { Lock, Mail, ArrowRight, Sparkles, Shield, Building2, Megaphone } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Call unified login with 'customer' portal
    const res = await login(email, password, 'customer', redirectUrl);
    if (res.success && res.user) {
      router.push(res.redirectTo || '/account');
    } else {
      setErrorMsg(res.error || 'ভুল ইমেইল বা পাসওয়ার্ড।');
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
          গ্রাহক ও পাঠক একাউন্টে প্রবেশ
        </h1>
        <p className="text-xs text-stone-500">
          শুব্বান ডিজিটাল লাইব্রেরী ও অনলাইন বুকশপে আপনাকে স্বাগতম।
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
            ইমেইল ঠিকানা
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reader@shubban.com"
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              পাসওয়ার্ড
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-shubban-gold hover:underline"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </Link>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>{isLoading ? 'প্রবেশ করা হচ্ছে...' : 'লগইন করুন'}</span>
          <ArrowRight className="w-4 h-4 text-shubban-gold" />
        </button>
      </form>

      {/* Demo Accounts Quick-Fill Box for testing */}
      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300">
          <Sparkles className="w-3.5 h-3.5 text-shubban-gold" />
          <span>ডেমো লগইন অ্যাকাউন্ট (এক ক্লিকে পরীক্ষা করুন):</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleFillDemo('subscriber@shubban.com', 'sub123')}
            className="p-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-shubban-gold text-left transition-colors"
          >
            <span className="font-bold block text-blue-600 truncate">ডিজিটাল মেম্বার</span>
            <span className="text-stone-400 text-[9px] truncate block">subscriber@...</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('reader@shubban.com', 'reader123')}
            className="p-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-shubban-gold text-left transition-colors"
          >
            <span className="font-bold block text-emerald-600 truncate">সাধারণ পাঠক</span>
            <span className="text-stone-400 text-[9px] truncate block">reader@...</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('author@shubban.com', 'author123')}
            className="p-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-shubban-gold text-left transition-colors"
          >
            <span className="font-bold block text-purple-600 truncate">লেখক ও গবেষক</span>
            <span className="text-stone-400 text-[9px] truncate block">author@...</span>
          </button>
        </div>
      </div>

      <div className="text-center pt-2 text-xs text-stone-500">
        <span>এখনও অ্যাকাউন্ট নেই? </span>
        <Link href="/register" className="font-bold text-shubban-gold hover:underline">
          নতুন অ্যাকাউন্ট খুলুন
        </Link>
      </div>

      {/* Role-Specific Portal Links */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-center text-xs">
        <p className="text-stone-400 text-[11px]">অন্যান্য অফিশিয়াল ও ব্যবসায়িক পোর্টাল:</p>
        <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-stone-600 dark:text-stone-400">
          <Link href="/admin/login" className="hover:text-amber-600 flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-600" />
            <span>প্রশাসন কনসোল</span>
          </Link>
          <span>•</span>
          <Link href="/publisher/login" className="hover:text-emerald-600 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-emerald-600" />
            <span>প্রকাশক লগইন</span>
          </Link>
          <span>•</span>
          <Link href="/advertiser/login" className="hover:text-amber-500 flex items-center gap-1">
            <Megaphone className="w-3 h-3 text-amber-500" />
            <span>বিজ্ঞাপনদাতা</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-bengali">
      <Suspense fallback={<div className="text-center text-xs text-stone-500">লোড হচ্ছে...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
