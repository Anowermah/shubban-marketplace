'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Send,
  Bell,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Globe,
  Download,
  Info,
  Clock,
  KeyRound,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import { subscribeToPush, isStandalone } from '@/lib/pwa/client-pwa';

export default function AdminPwaSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [vapid, setVapid] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Push Dispatch Form state
  const [dispatchTitle, setDispatchTitle] = useState('শুব্বান লাইব্রেরী টেস্ট নোটিফিকেশন');
  const [dispatchBody, setDispatchBody] = useState('শুভ্বান পিডব্লিউএ সিস্টেম থেকে সফলভাবে পুশ অ্যালার্ট পাঠানো হয়েছে।');
  const [dispatchAppType, setDispatchAppType] = useState<'MAIN' | 'ADMIN'>('ADMIN');
  const [dispatchCategory, setDispatchCategory] = useState('SYSTEM');
  const [dispatchTarget, setDispatchTarget] = useState<'ALL' | 'ME'>('ME');
  const [dispatchUrl, setDispatchUrl] = useState('/admin');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Device subscription state
  const [isSubscribingDevice, setIsSubscribingDevice] = useState(false);
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);
  const [isDeviceStandalone, setIsDeviceStandalone] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/push/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setVapid(data.vapid);
        setRecentLogs(data.recentLogs || []);
      }
    } catch (e) {
      console.error('Error fetching PWA stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    setIsDeviceStandalone(isStandalone());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDeviceSubscribed(Notification.permission === 'granted');
    }
  }, []);

  const handleSubscribeThisDevice = async () => {
    setIsSubscribingDevice(true);
    try {
      if (!('serviceWorker' in navigator)) {
        alert('আপনার ব্রাউজারে Service Worker সাপোর্ট নেই।');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const res = await subscribeToPush(reg, 'ADMIN');
      if (res.success) {
        setDeviceSubscribed(true);
        fetchStats();
      } else {
        alert(res.error || 'পুশ নোটিফিকেশন চালু করা সম্ভব হয়নি।');
      }
    } catch (e: any) {
      alert(e.message || 'সাবস্ক্রিপশন ব্যর্থ হয়েছে।');
    } finally {
      setIsSubscribingDevice(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dispatchTitle,
          body: dispatchBody,
          applicationType: dispatchAppType,
          category: dispatchCategory,
          target: dispatchTarget,
          url: dispatchUrl,
        }),
      });

      const data = await res.json();
      setSendResult({
        success: data.success,
        message: data.message || (data.success ? 'নোটিফিকেশন সফলভাবে পাঠানো হয়েছে।' : data.error),
      });

      if (data.success) {
        fetchStats();
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || 'পুশ প্রেরণে ত্রুটি ঘটেছে।',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali text-stone-900 dark:text-stone-100 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
              PWA ও মোবাইল অ্যাপ সেন্ট্রাল
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-sans font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40">
              Dual PWA Engine
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            স্বতন্ত্র গ্রাহক ওয়েবসাইট PWA ও অ্যাডমিন ম্যানেজমেন্ট PWA কনফিগারেশন, সার্ভিস ওয়ার্কার ও পুশ নোটিফিকেশন কন্ট্রোল
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Section 1: Two Independent PWA Architecture Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PWA 1: Main Customer Website App */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-amber-500/40 p-2 flex items-center justify-center shadow-md">
                <img src="/icons/main/icon-192x192.png" alt="Main PWA" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  PWA ১: শুব্বান লাইব্রেরী (Main Website)
                </h3>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  গ্রাহক ও পাবলিক ভিজিটরদের বুকশপ অ্যাপ্লিকেশন
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>সক্রিয়</span>
            </span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-stone-100 dark:divide-stone-800/80 font-mono">
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Application Name:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">Shubban Libery</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Short Name:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">Shubban</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Start URL & Scope:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">/ (Root)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Manifest:</span>
              <Link href="/manifest.webmanifest" target="_blank" className="text-amber-600 hover:underline flex items-center gap-1">
                <span>/manifest.webmanifest</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Service Worker:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">/sw.js (Scope: /)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Theme & Background:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">#C49A45 / #0E241D</span>
            </div>
          </div>
        </div>

        {/* PWA 2: Admin Management App */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-amber-600/40 p-2 flex items-center justify-center shadow-md">
                <img src="/icons/admin/icon-192x192.png" alt="Admin PWA" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  PWA ২: শুভ্বান অ্যাডমিন (Shubban Admin)
                </h3>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  অনুমোদিত কর্মকর্তা ও অ্যাডমিন ম্যানেজমেন্ট কনসোল
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>আইসোলেটেড</span>
            </span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-stone-100 dark:divide-stone-800/80 font-mono">
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Application Name:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">Shubban Admin</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Short Name:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">Admin</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Start URL & Scope:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">/admin (Restricted)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Manifest:</span>
              <Link href="/admin/manifest.webmanifest" target="_blank" className="text-amber-600 hover:underline flex items-center gap-1">
                <span>/admin/manifest.webmanifest</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Service Worker:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">/admin-sw.js (Scope: /admin)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-400">Theme & Background:</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">#D97706 / #0C0A09</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: VAPID Status & Real-time Subscriber Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* VAPID Configuration */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>VAPID পুশ কনফিগারেশন</span>
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                vapid?.isConfigured
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {vapid?.isConfigured ? 'কনফিগারড' : 'পেন্ডিং ক্রেডেনশিয়াল'}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            {vapid?.isConfigured
              ? 'প্রোডাকশন VAPID কি সক্রিয় রয়েছে। ব্রাউজার পুশ সফলভাবে প্রেরিত হচ্ছে।'
              : 'এনভায়রনমেন্ট ভেরিয়েবলে NEXT_PUBLIC_VAPID_PUBLIC_KEY এবং VAPID_PRIVATE_KEY সেট করতে হবে।'}
          </p>

          <div className="pt-2 text-[11px] font-mono space-y-1">
            <div className="text-stone-400">Public Key (Safe):</div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 truncate">
              {vapid?.publicKey || 'Pending NEXT_PUBLIC_VAPID_PUBLIC_KEY'}
            </div>
            <div className="text-stone-400 pt-1">Subject: {vapid?.subject || 'support@atrbd.com'}</div>
          </div>
        </div>

        {/* Subscriber Metrics */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>পুশ সাবস্ক্রাইবার মেট্রিক্স</span>
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">ডাটাবেজ রেকর্ড</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-center">
              <span className="text-[10px] text-stone-400 block">গ্রাহক সাবস্ক্রিপশন</span>
              <span className="text-xl font-bold font-mono text-emerald-600">
                {toBengaliNumber(stats?.activeMainSubs || 0)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-center">
              <span className="text-[10px] text-stone-400 block">অ্যাডমিন সাবস্ক্রিপশন</span>
              <span className="text-xl font-bold font-mono text-amber-600">
                {toBengaliNumber(stats?.activeAdminSubs || 0)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-center">
              <span className="text-[10px] text-stone-400 block">সফল ডেলিভারি</span>
              <span className="text-xl font-bold font-mono text-sky-600">
                {toBengaliNumber(stats?.sentCount || 0)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-center">
              <span className="text-[10px] text-stone-400 block">ব্যর্থ লগ</span>
              <span className="text-xl font-bold font-mono text-rose-500">
                {toBengaliNumber(stats?.failedCount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Admin Device Subscription & Install */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>আপনার বর্তমান ডিভাইস</span>
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isDeviceStandalone ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {isDeviceStandalone ? 'স্ট্যান্ডঅ্যালোন অ্যাপ' : 'ব্রাউজার ট্যাব'}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            এই ডিভাইসে অ্যাডমিন ইনস্টলেশন ও পুশ অ্যালার্ট পারমিশন ব্যবস্থাপনা করুন।
          </p>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleSubscribeThisDevice}
              disabled={isSubscribingDevice}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 transition flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span>
                {isSubscribingDevice
                  ? 'সংযোগ স্থাপন হচ্ছে...'
                  : deviceSubscribed
                  ? 'ডিভাইসে পুশ পারমিশন সক্রিয়'
                  : 'এই ডিভাইসে পুশ নোটিফিকেশন চালু করুন'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Interactive Push Dispatcher Tool */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <h2 className="font-serif font-bold text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-amber-600" />
            <span>অ্যাডমিন পুশ নোটিফিকেশন ডিসপ্যাচার (Live Dispatcher)</span>
          </h2>
          <span className="text-xs text-stone-400">রিয়েল-টাইম Web Push পরীক্ষা</span>
        </div>

        {sendResult && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
              sendResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-800 dark:text-amber-300'
            }`}
          >
            {sendResult.success ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">ডিসপ্যাচ ফলাফল:</span>
              <span>{sendResult.message}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSendNotification} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                নোটিফিকেশন শিরোনাম (Title)
              </label>
              <input
                type="text"
                value={dispatchTitle}
                onChange={(e) => setDispatchTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                টার্গেট অ্যাপ্লিকেশন (App Scope)
              </label>
              <select
                value={dispatchAppType}
                onChange={(e: any) => setDispatchAppType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
              >
                <option value="ADMIN">Shubban Admin (অ্যাডমিন অ্যাপ — /admin)</option>
                <option value="MAIN">Shubban Libery (গ্রাহক ওয়েবসাইট — /)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                ক্যাটাগরি
              </label>
              <select
                value={dispatchCategory}
                onChange={(e) => setDispatchCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
              >
                <option value="SYSTEM">সিস্টেম নোটিশ (SYSTEM)</option>
                <option value="ORDERS">অর্ডার অ্যালার্ট (ORDERS)</option>
                <option value="INVENTORY">ইনভেন্টরি ও স্টক (INVENTORY)</option>
                <option value="SHIPMENT">কুরিয়ার ও ডেলিভারি (SHIPMENT)</option>
                <option value="SECURITY">নিরাপত্তা ও অডিট (SECURITY)</option>
                <option value="PROMOTIONS">অফার ও ডিসকাউন্ট (PROMOTIONS)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                টার্গেট অডিয়েন্স
              </label>
              <select
                value={dispatchTarget}
                onChange={(e: any) => setDispatchTarget(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
              >
                <option value="ME">শুধুমাত্র আমার ডিভাইসে (Test to Me)</option>
                <option value="ALL">সকল সক্রিয় গ্রাহক / অ্যাডমিন (Broadcast)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                ক্লিক লিংক (Target URL)
              </label>
              <input
                type="text"
                value={dispatchUrl}
                onChange={(e) => setDispatchUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
              নোটিফিকেশন মেসেজ বডি (Body)
            </label>
            <textarea
              rows={2}
              value={dispatchBody}
              onChange={(e) => setDispatchBody(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-amber-800 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'পাঠানো হচ্ছে...' : 'পুশ নোটিফিকেশন প্রেরণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 4: Recent Push Logs Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <h2 className="font-serif font-bold text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>সাম্প্রতিক পুশ নোটিফিকেশন ডিসপ্যাচ লগ</span>
          </h2>
          <span className="text-xs text-stone-400">সর্বশেষ ২০টি রেকর্ড</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-800/80 text-stone-500 uppercase text-[10px] font-semibold border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="p-3">অ্যাপ</th>
                <th className="p-3">ক্যাটাগরি</th>
                <th className="p-3">শিরোনাম ও বার্তা</th>
                <th className="p-3">প্রাপক</th>
                <th className="p-3">স্ট্যাটাস</th>
                <th className="p-3 text-right">সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-stone-400 font-sans">
                    এখনো কোনো পুশ নোটিফিকেশন লগ জমা পড়েনি।
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/20 dark:hover:bg-stone-800/30 transition">
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.applicationType === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {log.applicationType}
                      </span>
                    </td>
                    <td className="p-3 text-stone-500 font-sans text-[11px]">{log.notificationCategory}</td>
                    <td className="p-3 font-sans">
                      <span className="font-bold text-stone-800 dark:text-stone-200 block truncate max-w-xs">
                        {log.title}
                      </span>
                      <span className="text-[11px] text-stone-400 line-clamp-1">{log.body}</span>
                    </td>
                    <td className="p-3 font-sans text-[11px]">
                      {log.recipient ? log.recipient.name : 'গেস্ট ব্রাউজার'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.deliveryStatus === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {log.deliveryStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right text-stone-400 text-[10px]" suppressHydrationWarning>
                      {new Date(log.createdAt).toLocaleTimeString('bn-BD')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

