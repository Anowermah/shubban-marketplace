'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookMarked,
  Scale,
  RefreshCw,
  Search,
  Layers,
  FileCheck2,
  Database,
  Eye,
  Sliders,
  Save,
  Lock,
  Unlock,
  Radio,
  SlidersHorizontal,
  Phone,
  MessageSquare,
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  UserCheck,
  Calendar,
  Clock,
  X,
  Share2,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import { IslamicAiSettings, DEFAULT_ISLAMIC_AI_SETTINGS } from '@/lib/islamic-ai/types';
import {
  ShaykhHotlineItem,
  IslamicHotlineGlobalConfig,
  DEFAULT_HOTLINE_CONFIG,
} from '@/lib/islamic-ai/hotline';

interface AdminIslamicAiProps {
  stats: {
    metrics: {
      totalVerses: number;
      totalHadiths: number;
      totalCollections: number;
      totalScholarlyTopics: number;
      totalConversations: number;
      totalMessages: number;
      errorReportsCount: number;
    };
    collections: Array<{
      id: string;
      slug: string;
      nameBn: string;
      nameAr: string;
      compiler: string;
      totalHadith: number;
      isCanonical: boolean;
      _count: { entries: number };
    }>;
    recentReports: Array<any>;
  };
}

export default function AdminIslamicAiClient({ stats: initialStats }: AdminIslamicAiProps) {
  const [stats, setStats] = useState(initialStats);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'hotline'>('overview');

  // Governance Settings State
  const [settings, setSettings] = useState<IslamicAiSettings>(DEFAULT_ISLAMIC_AI_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);

  // Hotline & Shaykh Management State
  const [hotlineConfig, setHotlineConfig] = useState<IslamicHotlineGlobalConfig>(DEFAULT_HOTLINE_CONFIG);
  const [roster, setRoster] = useState<ShaykhHotlineItem[]>([]);
  const [loadingHotline, setLoadingHotline] = useState(false);
  const [savingHotline, setSavingHotline] = useState(false);
  const [hotlineFeedback, setHotlineFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Shaykh Modal State
  const [showShaykhModal, setShowShaykhModal] = useState(false);
  const [editingShaykh, setEditingShaykh] = useState<ShaykhHotlineItem | null>(null);
  const [deleteShaykh, setDeleteShaykh] = useState<ShaykhHotlineItem | null>(null);
  const [shaykhForm, setShaykhForm] = useState<Partial<ShaykhHotlineItem>>({
    name: '',
    title: '',
    specialization: '',
    institution: '',
    whatsappNumber: '',
    phone: '',
    dutySchedule: '',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
    isOnDuty: true,
    isLiveChatActive: true,
    status: 'ONLINE',
    bio: '',
  });

  // Load Model & Guardrails Settings
  useEffect(() => {
    async function loadSettings() {
      setLoadingSettings(true);
      try {
        const res = await fetch('/api/admin/islamic-ai/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  // Load Hotline Data
  const loadHotlineData = async () => {
    setLoadingHotline(true);
    try {
      const res = await fetch('/api/admin/islamic-ai/hotline');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setHotlineConfig(data.config);
        if (data.roster) setRoster(data.roster);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHotline(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'hotline') {
      loadHotlineData();
    }
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/islamic-ai/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      if (activeTab === 'hotline') {
        await loadHotlineData();
      }
    } catch {}
    setRefreshing(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/islamic-ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsSavedAlert(true);
        setTimeout(() => setSettingsSavedAlert(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('আপনি কি নিশ্চিত যে ইসলামিক এআই এর সকল কনফিগারেশন ডিফল্ট মানে ফিরিয়ে নিতে চান?')) {
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/islamic-ai/settings', { method: 'DELETE' });
      if (res.ok) {
        setSettings(DEFAULT_ISLAMIC_AI_SETTINGS);
        setSettingsSavedAlert(true);
        setTimeout(() => setSettingsSavedAlert(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  // Hotline Config Submit
  const handleSaveHotlineConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHotline(true);
    setHotlineFeedback(null);
    try {
      const res = await fetch('/api/admin/islamic-ai/hotline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotlineConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHotlineFeedback({ type: 'success', message: 'হটলাইন ও হোয়াটসঅ্যাপ কনফিগারেশন সংরক্ষিত হয়েছে!' });
        setTimeout(() => setHotlineFeedback(null), 3500);
      } else {
        setHotlineFeedback({ type: 'error', message: data.error || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
      }
    } catch {
      setHotlineFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ত্রুটি।' });
    } finally {
      setSavingHotline(false);
    }
  };

  // Toggle Shaykh Duty Status
  const handleToggleDuty = async (shaykh: ShaykhHotlineItem) => {
    try {
      const res = await fetch('/api/admin/islamic-ai/hotline/scholars', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shaykh.id, action: 'TOGGLE_DUTY' }),
      });
      const data = await res.json();
      if (res.ok && data.roster) {
        setRoster(data.roster);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Create Shaykh Modal
  const openCreateShaykhModal = () => {
    setEditingShaykh(null);
    setShaykhForm({
      name: '',
      title: 'সিনিয়র ইফতা ও ফতোয়া গবেষক',
      specialization: 'ইবাদত, লেনদেন ও সমসাময়িক ফিকহ',
      institution: 'মারকাযুল বুহুস আল-ইসলামিয়া',
      whatsappNumber: '8801700000000',
      phone: '+880 1700-000000',
      dutySchedule: 'শনিবার - বৃহস্পতিবার: সকাল ১০:০০ - দুপুর ১:০০',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
      isOnDuty: true,
      isLiveChatActive: true,
      status: 'ONLINE',
      bio: '',
    });
    setShowShaykhModal(true);
  };

  // Open Edit Shaykh Modal
  const openEditShaykhModal = (shaykh: ShaykhHotlineItem) => {
    setEditingShaykh(shaykh);
    setShaykhForm(shaykh);
    setShowShaykhModal(true);
  };

  // Save Shaykh Modal (Create or Edit)
  const handleSaveShaykh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shaykhForm.name || !shaykhForm.whatsappNumber) {
      alert('শাইখের নাম ও হোয়াটসঅ্যাপ নম্বর পূরণ করুন।');
      return;
    }

    try {
      const payload = {
        ...shaykhForm,
        id: editingShaykh ? editingShaykh.id : undefined,
      };

      const res = await fetch('/api/admin/islamic-ai/hotline/scholars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRoster(data.roster);
        setShowShaykhModal(false);
        setEditingShaykh(null);
        setHotlineFeedback({ type: 'success', message: data.message });
        setTimeout(() => setHotlineFeedback(null), 3500);
      } else {
        alert(data.error || 'শাইখের তথ্য সেভ করা যায়নি।');
      }
    } catch {
      alert('সার্ভার যোগাযোগে সমস্যা হয়েছে।');
    }
  };

  // Execute Delete Shaykh
  const handleExecuteDelete = async () => {
    if (!deleteShaykh) return;
    try {
      const res = await fetch(`/api/admin/islamic-ai/hotline/scholars?id=${deleteShaykh.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRoster(data.roster);
        setDeleteShaykh(null);
        setHotlineFeedback({ type: 'success', message: data.message });
        setTimeout(() => setHotlineFeedback(null), 3500);
      } else {
        alert(data.error || 'অপসারণ ব্যর্থ হয়েছে।');
      }
    } catch {
      alert('সার্ভার যোগাযোগে ব্যর্থতা।');
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-shubban-green to-emerald-950 text-white p-6 rounded-2xl shadow-lg border border-shubban-gold/30">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>প্রামাণ্য ইসলামিক জ্ঞান, AI গভর্নেন্স ও শাইখ হটলাইন পোর্টাল</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            ইসলামিক এআই ও শাইখ হটলাইন কন্ট্রোল সেন্টার
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
            কুরআনুল কারীম, সিহাহ সিত্তাহ হাদিস সংকলন, ৪ মাযহাবের শাস্ত্রীয় সনদ এবং অভিজ্ঞ মুফতী/শাইখদের সরাসরি WhatsApp ও লাইভ পরামর্শ দায়িত্ব বণ্টন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/islamic-ai"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 text-xs font-bold flex items-center gap-1.5 shadow transition-transform hover:-translate-y-0.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>পাবলিক এআই খুলুন</span>
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
            title="রিফ্রেশ পরিসংখ্যান"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>নলেজ বেস ও পরিসংখ্যান</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'settings'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>পাবলিক অ্যাক্সেস ও এআই সেটিংস</span>
        </button>

        <button
          onClick={() => setActiveTab('hotline')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'hotline'
              ? 'bg-shubban-green text-shubban-gold shadow'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <Phone className="w-4 h-4 text-amber-400" />
          <span>শাইখ ও ফতোয়া হটলাইন রোস্টার</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
            লাইভ
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & KNOWLEDGE BASE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-bold uppercase tracking-wider">কুরআন আয়াত ইনডেক্স</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
                {toBengaliNumber(stats.metrics.totalVerses)}টি
              </div>
              <span className="text-[11px] text-stone-500 block">উসমানী আরবি ও বাংলা অনুবাদ সহ</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-bold uppercase tracking-wider">হাদিস গ্রন্থাবলী</span>
                <BookMarked className="w-4 h-4 text-amber-600" />
              </div>
              <div className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
                {toBengaliNumber(stats.metrics.totalHadiths)}টি
              </div>
              <span className="text-[11px] text-stone-500 block">সিহাহ সিত্তাহ ও প্রামাণ্য সনদের হাদিস</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-bold uppercase tracking-wider">মোট প্রশ্নোত্তর ও চ্যাট</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
                {toBengaliNumber(stats.metrics.totalMessages)}
              </div>
              <span className="text-[11px] text-stone-500 block">পাঠক ও গবেষকদের প্রশ্নোত্তর রেকর্ড</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-xs font-bold uppercase tracking-wider">শাইখ ও ফতোয়া হটলাইন</span>
                <Phone className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="font-serif text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                সক্রিয়
              </div>
              <span className="text-[11px] text-stone-500 block">সরাসরি WhatsApp ও কল হটলাইন</span>
            </div>
          </div>

          {/* Canonical Hadith Collections Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <span>প্রামাণ্য হাদিস সংকলন ইনভেন্টরি (Canonical Compilations)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3">সংকলন নাম (বাংলা ও আরবি)</th>
                    <th className="p-3">সংকলক ইমাম</th>
                    <th className="p-3">মোট হাদিস</th>
                    <th className="p-3">ইনডেক্সড সনদ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {stats.collections.map((col) => (
                    <tr key={col.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">
                        <div>{col.nameBn}</div>
                        <div className="text-[10px] text-stone-400 font-arabic">{col.nameAr}</div>
                      </td>
                      <td className="p-3 text-stone-600 dark:text-stone-300">{col.compiler}</td>
                      <td className="p-3 font-mono text-stone-800 dark:text-stone-200">{toBengaliNumber(col.totalHadith)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">{toBengaliNumber(col._count.entries)}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ভেরিফায়েড</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS & ACCESS GOVERNANCE */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsSavedAlert && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ইসলামিক এআই সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Access Controls */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>পাবলিক অ্যাক্সেস ও রেট লিমিটেশন</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 block">পাবলিক ইসলামিক AI সার্ভিস</span>
                    <span className="text-[11px] text-stone-500">অনলাইনে সবার জন্য এআই প্রশ্নোত্তর উন্মুক্ত রাখবে</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.publicAiEnabled}
                    onChange={(e) => setSettings({ ...settings, publicAiEnabled: e.target.checked })}
                    className="w-5 h-5 accent-shubban-green rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 block">গেস্ট ইউজার অ্যাক্সেস</span>
                    <span className="text-[11px] text-stone-500">লগইন ছাড়াও সীমিত প্রশ্ন করার সুযোগ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.guestAccessEnabled}
                    onChange={(e) => setSettings({ ...settings, guestAccessEnabled: e.target.checked })}
                    className="w-5 h-5 accent-shubban-green rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">গেস্ট ইউজার দৈনিক প্রশ্ন লিমিট</label>
                  <input
                    type="number"
                    value={settings.guestDailyLimit}
                    onChange={(e) => setSettings({ ...settings, guestDailyLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Model & Shariah Filter */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>মডেল প্যারামিটার ও ফিল্টারিং</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">নির্বাচিত এআই মডেল</label>
                  <select
                    value={settings.selectedModel}
                    onChange={(e) => setSettings({ ...settings, selectedModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold"
                  >
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (প্রামাণ্য হাদিস ও তাফসির অ্যানালাইসিস)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (দ্রুততম রেসপন্স)</option>
                    <option value="gpt-4o">OpenAI GPT-4o (বিকল্প মাল্টি-প্রোভাইডার)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">জিরো হ্যালুসিনেশন ও স্ট্রিক্ট সনদ ফিল্টার</span>
                    <span className="text-[11px] text-stone-500">দলিলহীন উত্তর সম্পূর্ণরূপে ব্লক রাখবে</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.strictDalilOnly}
                    onChange={(e) => setSettings({ ...settings, strictDalilOnly: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Prompt & Guardrails */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ইসলামিক সিস্টেম প্রম্পট ও শরিয়াহ নির্দেশিকা</span>
            </h3>
            <p className="text-xs text-stone-500">
              এআই-কে নির্দেশ দেয়া মূল শরিয়াহ ফ্রেমওয়ার্ক। এটি নিশ্চিত করে যে এআই কোনো ব্যক্তিগত ফতোয়া বা মনগড়া তথ্য দেবে না।
            </p>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              rows={4}
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono text-stone-800 dark:text-stone-200 leading-relaxed"
            />
          </div>

          {/* Save & Reset Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetSettings}
              disabled={savingSettings}
              className="px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs sm:text-sm transition-all disabled:opacity-50"
            >
              <span>ডিফল্ট এআই সেটিংসে রিসেট</span>
            </button>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-gold font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SHAYKH & FATWA HOTLINE ROSTER */}
      {activeTab === 'hotline' && (
        <div className="space-y-6">
          {hotlineFeedback && (
            <div
              className={`p-4 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                hotlineFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {hotlineFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{hotlineFeedback.message}</span>
            </div>
          )}

          {/* Global Hotline Settings Card */}
          <form
            onSubmit={handleSaveHotlineConfig}
            className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  হটলাইন ও সরাসরি WhatsApp পরামর্শ কনফিগারেশন
                </h3>
              </div>
              <button
                type="submit"
                disabled={savingHotline}
                className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-gold font-bold text-xs flex items-center gap-1.5 shadow transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingHotline ? 'সংরক্ষণ হচ্ছে...' : 'হটলাইন কনফিগ সেভ করুন'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">হটলাইন সার্ভিস সক্রিয়</span>
                  <span className="text-[10px] text-stone-500">পাবলিকলি শাইখ হটলাইন প্রদর্শন করবে</span>
                </div>
                <input
                  type="checkbox"
                  checked={hotlineConfig.hotlineEnabled}
                  onChange={(e) => setHotlineConfig({ ...hotlineConfig, hotlineEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">WhatsApp পরামর্শ সক্রিয়</span>
                  <span className="text-[10px] text-stone-500">সরাসরি WhatsApp লিংকিং চালু থাকবে</span>
                </div>
                <input
                  type="checkbox"
                  checked={hotlineConfig.whatsappEnabled}
                  onChange={(e) => setHotlineConfig({ ...hotlineConfig, whatsappEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">প্রধান হটলাইন ফোন নম্বর</label>
                <input
                  type="text"
                  value={hotlineConfig.primaryHotlinePhone}
                  onChange={(e) => setHotlineConfig({ ...hotlineConfig, primaryHotlinePhone: e.target.value })}
                  placeholder="+880 1711-000000"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">সেন্ট্রাল WhatsApp নম্বর (ডিফল্ট)</label>
                <input
                  type="text"
                  value={hotlineConfig.defaultWhatsappNumber}
                  onChange={(e) => setHotlineConfig({ ...hotlineConfig, defaultWhatsappNumber: e.target.value })}
                  placeholder="8801711000000"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">WhatsApp ডিফল্ট সূচনা বার্তা (Pre-fill Text)</label>
                <input
                  type="text"
                  value={hotlineConfig.whatsappDefaultMessage}
                  onChange={(e) => setHotlineConfig({ ...hotlineConfig, whatsappDefaultMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পাবলিক হটলাইন নোটিশ বার্তা</label>
                <input
                  type="text"
                  value={hotlineConfig.noticeBannerText}
                  onChange={(e) => setHotlineConfig({ ...hotlineConfig, noticeBannerText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                />
              </div>
            </div>
          </form>

          {/* Shaykh Roster Table & Management */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>নিবন্ধিত মুফতী ও শাইখ রোস্টার (দায়িত্ব বণ্টন ও লাইভ স্ট্যাটাস)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  যে সকল শাইখ "অন-ডিউটি" থাকবেন তাদের তথ্য ও সরাসরি WhatsApp বাটন পাবলিক এআই চ্যাট এবং হটলাইনে প্রদর্শিত হবে।
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateShaykhModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন শাইখ যুক্ত করুন</span>
              </button>
            </div>

            {loadingHotline ? (
              <div className="p-8 text-center text-xs text-stone-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                <span>রোস্টার ডাটা লোড হচ্ছে...</span>
              </div>
            ) : roster.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                কোনো শাইখ তালিকাভুক্ত নেই। উপরে বোতামে ক্লিক করে নতুন শাইখ যুক্ত করুন।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roster.map((shaykh) => {
                  const whatsappLink = `https://wa.me/${shaykh.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    hotlineConfig.whatsappDefaultMessage
                  )}`;

                  return (
                    <div
                      key={shaykh.id}
                      className={`relative rounded-2xl p-4 border transition-all ${
                        shaykh.isOnDuty
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm'
                          : 'bg-stone-50/50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-80'
                      }`}
                    >
                      {/* Top Header Card */}
                      <div className="flex items-start gap-3">
                        <img
                          src={shaykh.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80'}
                          alt={shaykh.name}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                              {shaykh.name}
                            </h4>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </div>
                          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                            {shaykh.title}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate">
                            {shaykh.institution}
                          </p>
                        </div>
                      </div>

                      {/* Specialization & Schedule */}
                      <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-800 space-y-1.5 text-[11px]">
                        <div className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{shaykh.specialization}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{shaykh.dutySchedule}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-500">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>WhatsApp: +{shaykh.whatsappNumber}</span>
                        </div>
                      </div>

                      {/* On-Duty Toggle & Actions Bar */}
                      <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between gap-2">
                        {/* Duty Status Badge / Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleDuty(shaykh)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                            shaykh.isOnDuty
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-600'
                          }`}
                          title="দায়িত্ব স্ট্যাটাস পরিবর্তন করুন"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${shaykh.isOnDuty ? 'bg-white animate-pulse' : 'bg-stone-400'}`} />
                          <span>{shaykh.isOnDuty ? 'অন-ডিউটি' : 'অফ-ডিউটি'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold transition flex items-center gap-1"
                            title="সরাসরি WhatsApp টেস্ট করুন"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>টেস্ট</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => openEditShaykhModal(shaykh)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteShaykh(shaykh)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT SHAYKH MODAL */}
      {showShaykhModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {editingShaykh ? 'শাইখের তথ্য সম্পাদনা' : 'নতুন শাইখ / মুফতী যুক্ত করুন'}
                </h3>
              </div>
              <button onClick={() => setShowShaykhModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShaykh} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">শাইখের পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={shaykhForm.name}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, name: e.target.value })}
                    placeholder="মুফতী মুহাম্মদ..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পদবি ও ভূমিকা *</label>
                  <input
                    type="text"
                    required
                    value={shaykhForm.title}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, title: e.target.value })}
                    placeholder="সিনিয়র ইফতা গবেষক..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">হোয়াটসঅ্যাপ নম্বর (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    value={shaykhForm.whatsappNumber}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, whatsappNumber: e.target.value })}
                    placeholder="8801711000000"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">হটলাইন ফোন নম্বর</label>
                  <input
                    type="text"
                    value={shaykhForm.phone}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, phone: e.target.value })}
                    placeholder="+880 1711-000000"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিশেষজ্ঞের ক্ষেত্র (Specialization)</label>
                  <input
                    type="text"
                    value={shaykhForm.specialization}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, specialization: e.target.value })}
                    placeholder="আধুনিক আর্থিক লেনদেন, ব্যবসা ও ফিকহ..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">শিক্ষাপ্রতিষ্ঠান ও ডিগ্রি</label>
                  <input
                    type="text"
                    value={shaykhForm.institution}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, institution: e.target.value })}
                    placeholder="মারকাযুল বুহুস আল-ইসলামিয়া / দারুল উলুম..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ডিউটি শিডিউল (Duty Timing)</label>
                  <input
                    type="text"
                    value={shaykhForm.dutySchedule}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, dutySchedule: e.target.value })}
                    placeholder="শনিবার - বৃহস্পতিবার: সকাল ১০:০০ - দুপুর ১:০০"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">অ্যাভাটার / ছবির URL</label>
                  <input
                    type="text"
                    value={shaykhForm.avatarUrl}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shaykhForm.isOnDuty}
                    onChange={(e) => setShaykhForm({ ...shaykhForm, isOnDuty: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">বর্তমানে অন-ডিউটি সক্রিয়</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowShaykhModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {editingShaykh ? 'হালনাগাদ সংরক্ষণ' : 'রোস্টারে যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteShaykh && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <Trash2 className="w-5 h-5" />
                <span>শাইখ অপসারণ নিশ্চিতকরণ</span>
              </div>
              <button onClick={() => setDeleteShaykh(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="text-stone-900 dark:text-stone-100">{deleteShaykh.name}</strong> কে ফতোয়া হটলাইন রোস্টার থেকে মুছে ফেলতে চান?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteShaykh(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
