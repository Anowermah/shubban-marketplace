'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { Building2, BookOpen, Lock, Mail, ArrowRight, ArrowLeft, Sparkles, Newspaper, ShieldCheck } from 'lucide-react';

function PublisherLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/publisher/dashboard';
  const urlError = searchParams.get('error');

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    urlError === 'unauthorized_publisher'
      ? 'আপনার অ্যাকাউন্টে প্রকাশক বা সাময়িকী সম্পাদনা দলের অধিকার নেই। অনুমোদিত অ্যাকাউন্ট দিয়ে লগইন করুন।'
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Call unified login with 'publisher' portal context
    const res = await login(email, password, 'publisher', redirectUrl);
    if (res.success && res.user) {
      router.push(res.redirectTo || '/publisher/dashboard');
    } else {
      setErrorMsg(res.error || 'ভুল প্রকাশক ইমেইল বা পাসওয়ার্ড।');
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-8 space-y-6 font-bengali">
      {/* Publisher Branding Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-amber-300 shadow-md mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 inline-block mb-1">
            প্রকাশনা ও সাময়িকী সম্পাদনা গেটওয়ে
          </span>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            শুব্বান প্রকাশক পোর্টাল
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            স্বীকৃত প্রকাশনা সংস্থা, মাসিক সাময়িকী ও ডিজিটাল জার্নাল সম্পাদনা দলের জন্য নির্ধারিত।
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs font-semibold text-center border border-red-200 dark:border-red-900">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
            প্রকাশক / সম্পাদক ইমেইল
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="publisher@domain.com"
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              পাসওয়ার্ড
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-emerald-600 hover:underline"
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
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'প্রকাশনা পোর্টালে প্রবেশ করুন'}</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>
      </form>

      {/* Demo Publisher Account Quick-Fill */}
      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>ডেমো প্রকাশক অ্যাকাউন্ট (এক ক্লিকে টেস্ট করুন):</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleFillDemo('maktaba_salaf_seller@test.com', 'seller123')}
            className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-left transition-colors"
          >
            <span className="font-bold block text-emerald-600">মাকতাবাতুস সালাফ</span>
            <span className="text-stone-400 text-[10px]">maktaba_salaf_seller@test.com</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('darul_ilm_seller@test.com', 'seller123')}
            className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-left transition-colors"
          >
            <span className="font-bold block text-emerald-600">দারুল ইলম প্রকাশনী</span>
            <span className="text-stone-400 text-[10px]">darul_ilm_seller@test.com</span>
          </button>
        </div>
      </div>

      {/* Links & Navigation */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2 text-center text-xs">
        <div className="flex items-center justify-center gap-3 text-stone-500 text-[11px]">
          <span>নতুন প্রকাশক হতে চান?</span>
          <Link href="/seller/apply" className="font-bold text-emerald-600 hover:underline">
            প্রকাশক আবেদনপত্র
          </Link>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মূল ওয়েবসাইটে ফিরে যান</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PublisherLoginPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-stone-500 text-sm">লোড হচ্ছে...</div>}>
        <PublisherLoginForm />
      </Suspense>
    </div>
  );
}

