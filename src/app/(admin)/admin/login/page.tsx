'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, Sparkles, Building2, UserCircle } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';

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

    // Call unified central login with 'admin' portal context
    const res = await login(email, password, 'admin', redirectUrl);
    if (res.success && res.user) {
      router.push(res.redirectTo || '/admin');
    } else {
      setErrorMsg(res.error || 'ভুল অ্যাডমিন ইমেইল বা পাসওয়ার্ড।');
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-8 space-y-6 font-bengali">
      {/* Admin Branding Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-shubban-green flex items-center justify-center text-shubban-gold shadow-md mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] bg-shubban-gold/20 text-shubban-gold px-2.5 py-0.5 rounded-full font-bold border border-shubban-gold/40 inline-block mb-1">
            RBAC সুরক্ষিত প্রশাসন ও স্টাফ গেটওয়ে
          </span>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            শুব্বান প্রশাসন কনসোল
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            শুধুমাত্র অনুমোদিত সিস্টেম অ্যাডমিন, বিভাগীয় প্রধান ও অপারেশনাল স্টাফদের জন্য সংরক্ষিত।
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
            অ্যাডমিন / স্টাফ ইমেইল
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shubban.com"
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold"
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
            অ্যাডমিন পাসওয়ার্ড
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4 text-shubban-gold" />
          <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'প্রশাসন কনসোলে প্রবেশ করুন'}</span>
          <ArrowRight className="w-4 h-4 text-shubban-gold" />
        </button>
      </form>

      {/* Demo Admin Accounts Quick-Fill */}
      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-shubban-gold" />
          <span>ডেমো অ্যাডমিন অ্যাকাউন্ট (এক ক্লিকে টেস্ট করুন):</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleFillDemo('admin@shubban.com', 'admin123')}
            className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-shubban-gold text-left transition-colors"
          >
            <span className="font-bold block text-shubban-gold">সুপার অ্যাডমিন</span>
            <span className="text-stone-400 text-[10px]">admin@shubban.com</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('checker_admin@shubban.com', 'admin123')}
            className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-shubban-gold text-left transition-colors"
          >
            <span className="font-bold block text-emerald-600">চেকার ম্যানেজার</span>
            <span className="text-stone-400 text-[10px]">checker_admin@shubban.com</span>
          </button>
        </div>
      </div>

      {/* Alternative Portal Navigation */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2 text-center text-xs">
        <p className="text-stone-500 text-[11px]">অন্যান্য পোর্টালে প্রবেশ করতে চান?</p>
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-400">
          <Link href="/login" className="hover:text-shubban-green flex items-center gap-1">
            <UserCircle className="w-3.5 h-3.5" />
            <span>গ্রাহক লগইন</span>
          </Link>
          <span>•</span>
          <Link href="/publisher/login" className="hover:text-shubban-green flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>প্রকাশক লগইন</span>
          </Link>
          <span>•</span>
          <Link href="/advertiser/login" className="hover:text-shubban-green flex items-center gap-1">
            <span>বিজ্ঞাপনদাতা</span>
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

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-stone-500 text-sm">লোড হচ্ছে...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
