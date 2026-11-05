'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WifiOff, Wifi, RefreshCw, ShieldAlert, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function AdminOfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/icons/admin/favicon-32x32.png', { cache: 'no-store' });
      if (res.ok) {
        setIsOnline(true);
        window.location.href = '/admin';
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4 font-bengali">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Admin Shield Crest */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-amber-500 shadow-inner">
            {isOnline ? (
              <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-amber-500 animate-bounce" />
            )}
          </div>
          <span
            className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md ${
              isOnline ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {isOnline ? 'কানেক্টেড' : 'অফলাইন'}
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h1 className="font-serif font-bold text-2xl text-stone-100">
            {isOnline ? 'সার্ভার সংযোগ পুনঃস্থাপিত হয়েছে' : 'অ্যাডমিন কনসোল অফলাইনে রয়েছে'}
          </h1>
          <span className="text-xs text-amber-500 font-mono tracking-wider uppercase block">
            Enterprise Security Notice
          </span>
          <p className="text-xs text-stone-400 leading-relaxed pt-1">
            {isOnline
              ? 'নিরাপদ এনক্রিপ্টেড সংযোগ পুনরুদ্ধার হয়েছে। ড্যাশবোর্ডে প্রবেশ করুন।'
              : 'ডাটাবেজ সুরক্ষা ও আর্থিক নির্ভুলতার স্বার্থে অফলাইনে কোনো অর্ডার পরিবর্তন, রিফান্ড অনুমোদন বা সিস্টেম কনফিগারেশন সম্পাদন করা যাবে না।'}
          </p>
        </div>

        {/* Security Rule Box */}
        <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 text-left flex items-start gap-3 text-xs text-stone-400">
          <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-stone-200 block">
              জিরো-ট্রাস্ট ক্যাশিং নীতি (Zero-Trust):
            </span>
            <span className="text-[11px] text-stone-400 block leading-normal">
              সংবেদনশীল অ্যাডমিন ডাটা, গ্রাহক তালিকা, অর্ডার রেকর্ড ও রাজস্ব তথ্য কখনোই ব্রাউজার ক্যাশে সংরক্ষিত হয় না।
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/30 hover:from-amber-700 hover:to-amber-800 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'সার্ভার যাচাই করা হচ্ছে...' : 'পুনরায় সার্ভার সংযোগ পরীক্ষা'}</span>
          </button>

          <Link
            href="/admin/login"
            className="w-full py-2.5 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-200 transition flex items-center justify-center gap-1.5"
          >
            <span>লগইন স্ক্রিনে যান</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

