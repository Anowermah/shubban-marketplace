'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { Mail, ArrowLeft, CheckCircle2, Lock, KeyRound, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>('REQUEST');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'অনুরোধ ব্যর্থ হয়েছে।');
      }

      if (data.demoToken) {
        setDemoToken(data.demoToken);
        setToken(data.demoToken);
      }
      setStep('RESET');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setError('পাসওয়ার্ড দুটি হুবহু মিলছে না।');
      return;
    }

    if (newPassword.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।');
      }

      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-bengali">
      <div className="w-full max-w-md bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            পাসওয়ার্ড পুনরুদ্ধার
          </h1>
          <p className="text-xs text-stone-500">
            {step === 'REQUEST'
              ? 'আপনার নিবন্ধিত ইমেইল দিলে আমরা ৬-সংখ্যার ভেরিফিকেশন কোড পাঠাবো।'
              : step === 'RESET'
              ? 'ইমেইলে প্রাপ্ত ভেরিফিকেশন কোড ও নতুন পাসওয়ার্ড লিখুন।'
              : 'আপনার পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'REQUEST' && (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                নিবন্ধিত ইমেইল ঠিকানা *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'রিসেট কোড পাঠান'}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-stone-500 hover:text-shubban-gold inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>লগইনে ফিরে যান</span>
              </Link>
            </div>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {demoToken && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-800 dark:text-amber-300">
                <span>টেস্টিং কোড: <strong>{demoToken}</strong> (নিচে স্বয়ংক্রিয়ভাবে ইনপুট করা হয়েছে)</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                ভেরিফিকেশন কোড *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="৬-সংখ্যার কোড লিখুন"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                নতুন পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড নিশ্চিত করুন'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="text-xs font-semibold text-stone-500 hover:text-shubban-gold"
              >
                আবার কোড পাঠান
              </button>
            </div>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs space-y-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm">পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!</p>
            <p>আপনার অ্যাকাউন্ট এখন নতুন পাসওয়ার্ড দ্বারা সুরক্ষিত।</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block px-6 py-2 rounded-xl bg-shubban-green text-shubban-ivory font-bold text-xs shadow-sm hover:bg-shubban-darkGreen transition-colors"
              >
                এখন লগইন করুন
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
