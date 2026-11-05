'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  Layers,
  FileText,
  Users,
  DollarSign,
  Shield,
  FileCheck,
  Settings,
  History,
  ExternalLink,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  Lock,
  Download,
  Trash2,
  Loader2,
  Eye,
  Edit,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import WorkspaceSwitcher from '@/components/admin/publishing/WorkspaceSwitcher';

interface Props {
  magazine: any;
  issues: any[];
  articles: any[];
  files: any[];
  members: any[];
  settings: Record<string, string>;
  plans: any[];
  rights: any | null;
  schedule: any | null;
  allUsers: { id: string; name: string | null; email: string | null; role: string }[];
  userRole: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'দৈনিক (Daily)',
  WEEKLY: 'সাপ্তাহিক (Weekly)',
  FORTNIGHTLY: 'পাক্ষিক (Fortnightly)',
  MONTHLY: 'মাসিক (Monthly)',
  BIMONTHLY: 'দ্বিমাসিক (Bimonthly)',
  QUARTERLY: 'ত্রৈমাসিক (Quarterly)',
  HALF_YEARLY: 'ষাণ্মাসিক (Half-Yearly)',
  ANNUAL: 'বার্ষিক (Annual)',
  SPECIAL_EDITION: 'বিশেষ সংখ্যা',
  IRREGULAR: 'অনিয়মিত',
};

const ROLE_LABELS: Record<string, string> = {
  PUBLICATION_ADMIN: 'প্রকাশনা এডমিন',
  EDITOR_IN_CHIEF: 'প্রধান সম্পাদক',
  MANAGING_EDITOR: 'ব্যবস্থাপনা সম্পাদক',
  SECTION_EDITOR: 'বিভাগীয় সম্পাদক',
  AUTHOR: 'লেখক / গবেষক',
  REVIEWER: 'পর্যালোচক (Reviewer)',
  PROOFREADER: 'প্রুফরিডার',
  TRANSLATOR: 'অনুবাদক',
  DESIGNER: 'ডিজাইনার',
  CONTRIBUTOR: 'কন্ট্রিবিউটর',
  ANALYST: 'এনালিস্ট',
};

export default function MagazineWorkspaceClient({
  magazine,
  issues: initialIssues,
  articles: initialArticles,
  files: initialFiles,
  members: initialMembers,
  settings: initialSettings,
  plans: initialPlans,
  rights: initialRights,
  schedule: initialSchedule,
  allUsers,
  userRole,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'issues' | 'articles' | 'schedule' | 'team' | 'pricing' | 'rights' | 'files' | 'settings' | 'audit'
  >('overview');

  const [issues, setIssues] = useState(initialIssues);
  const [articles, setArticles] = useState(initialArticles);
  const [files, setFiles] = useState(initialFiles);
  const [members, setMembers] = useState(initialMembers);
  const [plans, setPlans] = useState(initialPlans);
  const [rights, setRights] = useState(initialRights);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [settings, setSettings] = useState(initialSettings);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('AUTHOR');

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: 'মাসিক আনলিমিটেড এক্সেস',
    durationMonths: 1,
    price: 50,
    features: 'অনলাইন সম্পূর্ণ পাঠ\nসব আর্কাইভ এক্সেস\nPDF ডাউনলোড সুবিধা',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}/audit-logs`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Schedule Save
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'শিডিউল সংরক্ষণে সমস্যা হয়েছে');
      setSchedule(data.schedule);
      showToast('প্রকাশনা শিডিউল সফলভাবে সংরক্ষিত হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Settings Save
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'সেটিংস সংরক্ষণে সমস্যা হয়েছে');
      showToast('ওয়ার্কস্পেস সেটিংস সংরক্ষিত হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Rights Save
  const handleSaveRights = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}/rights`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rights),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'কপিরাইট তথ্য সংরক্ষণে সমস্যা হয়েছে');
      setRights(data.rights);
      showToast('কপিরাইট ও লাইসেন্স তথ্য হালনাগাদ করা হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUserId) {
      showToast('ব্যবহারকারী নির্বাচন করুন', 'error');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newMemberUserId,
          role: newMemberRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'টিম সদস্য যুক্ত করতে সমস্যা হয়েছে');
      setMembers(data.members);
      setShowAddMemberModal(false);
      setNewMemberUserId('');
      showToast('টিম সদস্য সফলভাবে যুক্ত হয়েছেন');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই সদস্যকে অপসারণ করতে চান?')) return;
    try {
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}/team?memberId=${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'সদস্য অপসারণে সমস্যা হয়েছে');
      setMembers(data.members);
      showToast('টিম সদস্যকে অপসারণ করা হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Add Plan
  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'প্ল্যান তৈরিতে সমস্যা হয়েছে');
      setPlans(data.plans);
      setShowAddPlanModal(false);
      showToast('নতুন সাবস্ক্রিপশন প্ল্যান তৈরি হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm('আপনি কি এই সাবস্ক্রিপশন প্ল্যানটি ডিলিট করতে চান?')) return;
    try {
      const res = await fetch(`/api/publishing/workspaces/${magazine.id}/pricing?planId=${planId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'প্ল্যান ডিলিট করতে সমস্যা হয়েছে');
      setPlans(data.plans);
      showToast('প্ল্যান সফলভাবে মুছে ফেলা হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const themeHex = magazine.themeColor || '#0f3e2e';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600 text-white'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Workspace Banner & Top Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        {/* Color accent header strip */}
        <div className="h-3 w-full" style={{ backgroundColor: themeHex }} />

        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0 border-2 border-white/20"
              style={{ backgroundColor: themeHex }}
            >
              {magazine.title.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {FREQUENCY_LABELS[magazine.frequency] || magazine.frequency}
                </span>

                {magazine.publisher && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {magazine.publisher.name}
                  </span>
                )}

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  রোল: {ROLE_LABELS[userRole] || userRole}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                {magazine.title}
              </h1>

              {magazine.titleEn && (
                <p className="text-xs text-stone-400 mt-0.5">{magazine.titleEn}</p>
              )}

              {magazine.editor && (
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  প্রধান সম্পাদক: <span className="font-semibold">{magazine.editor}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Controls & Workspace Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceSwitcher currentMagazineId={magazine.id} />

            <Link
              href={`/magazine/${magazine.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 text-xs font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              পাবলিক ভিউ
            </Link>

            <Link
              href={`/admin/magazines/create?magazineId=${magazine.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন সংখ্যা
            </Link>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex items-center gap-1 px-6 border-t border-stone-100 dark:border-stone-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'ওভারভিউ', icon: BookOpen },
            { id: 'issues', label: `সংখ্যা (${issues.length})`, icon: Layers },
            { id: 'articles', label: `প্রবন্ধ (${articles.length})`, icon: FileText },
            { id: 'schedule', label: 'শিডিউল ও ডেডলাইন', icon: Calendar },
            { id: 'team', label: `টিম (${members.length})`, icon: Users },
            { id: 'pricing', label: `সাবস্ক্রিপশন (${plans.length})`, icon: DollarSign },
            { id: 'rights', label: 'কপিরাইট ও লাইসেন্স', icon: Shield },
            { id: 'files', label: `PDF লাইব্রেরি (${files.length})`, icon: FileCheck },
            { id: 'settings', label: 'সেটিংস', icon: Settings },
            { id: 'audit', label: 'অডিট ইতিহাস', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'audit' && auditLogs.length === 0) loadAuditLogs();
                }}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${active
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
              <span className="text-xs font-medium text-stone-500 block mb-1">মোট সংখ্যা</span>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{issues.length}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">আর্কাইভ ভলিউম</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
              <span className="text-xs font-medium text-stone-500 block mb-1">মোট প্রবন্ধ</span>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{articles.length}</p>
              <span className="text-[10px] text-blue-600 font-semibold">প্রকাশিত আর্টিকেল</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
              <span className="text-xs font-medium text-stone-500 block mb-1">গ্রাহক / সাবস্ক্রাইবার</span>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {magazine.totalSubscribers || 0}
              </p>
              <span className="text-[10px] text-purple-600 font-semibold">সক্রিয় পাঠক</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
              <span className="text-xs font-medium text-stone-500 block mb-1">মোট আয়</span>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                ৳{magazine.totalRevenue || 0}
              </p>
              <span className="text-[10px] text-amber-600 font-semibold">সাবস্ক্রিপশন ও সেলস</span>
            </div>
          </div>

          {/* Schedule Status & Editorial Deadline Banner */}
          {schedule && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                      পরবর্তী প্রকাশনা শিডিউল: {FREQUENCY_LABELS[schedule.frequency] || schedule.frequency}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    পরবর্তী সংখ্যার প্রত্যাশিত তারিখ:{' '}
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {schedule.nextExpectedDate
                        ? new Date(schedule.nextExpectedDate).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                        : 'নির্ধারিত হয়নি'}
                    </span>
                    {' • '}
                    সম্পাদকীয় ডেডলাইন: সংখ্যা প্রকাশের {schedule.editorialDeadlineDays || 5} দিন পূর্বে
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('schedule')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition self-start"
              >
                শিডিউল কনফিগার করুন
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Recent Issues Overview */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                সাম্প্রতিক প্রকাশিত সংখ্যাসমূহ
              </h3>
              <button
                onClick={() => setActiveTab('issues')}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                সব সংখ্যা দেখুন ({issues.length}) →
              </button>
            </div>

            {issues.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                এখনো কোনো সংখ্যা তৈরি করা হয়নি।
                <Link
                  href={`/admin/magazines/create?magazineId=${magazine.id}`}
                  className="text-emerald-600 font-bold ml-1 hover:underline"
                >
                  প্রথম সংখ্যা যোগ করুন
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {issues.slice(0, 6).map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-emerald-500/40 transition flex items-start gap-3 bg-stone-50/40 dark:bg-stone-800/20"
                  >
                    <div className="w-12 h-16 rounded-lg bg-stone-200 dark:bg-stone-700 flex-shrink-0 overflow-hidden relative shadow-sm">
                      {issue.coverImage ? (
                        <img
                          src={issue.coverImage}
                          alt={issue.issueTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400 text-center font-bold">
                          PDF
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-stone-400 block font-mono">
                        বর্ষ {issue.volumeNumber} • সংখ্যা {issue.issueNumber}
                      </span>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs truncate">
                        {issue.issueTitle}
                      </h4>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {issue.publicationMonth} {issue.publicationYear}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${issue.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-stone-200 text-stone-600'
                            }`}
                        >
                          {issue.status}
                        </span>
                        {issue.pageCount && (
                          <span className="text-[9px] text-stone-400 font-medium">
                            {issue.pageCount} পৃষ্ঠা
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ISSUES */}
      {activeTab === 'issues' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                সংখ্যা তালিকা ({issues.length}টি সংখ্যা)
              </h3>
              <p className="text-xs text-stone-500">এই প্রকাশনার সকল ভলিউম ও প্রকাশিত সংখ্যা</p>
            </div>

            <Link
              href={`/admin/magazines/create?magazineId=${magazine.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন সংখ্যা তৈরি করুন
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-semibold">
                  <th className="py-3 px-3">সংখ্যা / কভার</th>
                  <th className="py-3 px-3">ভলিউম ও সংখ্যা</th>
                  <th className="py-3 px-3">মাস ও বছর</th>
                  <th className="py-3 px-3">পৃষ্ঠা ও সাইজ</th>
                  <th className="py-3 px-3 text-center">মূল্য</th>
                  <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      কোনো সংখ্যা পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-10 rounded bg-stone-100 dark:bg-stone-800 overflow-hidden flex-shrink-0">
                            {iss.coverImage && (
                              <img
                                src={iss.coverImage}
                                alt={iss.issueTitle}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 dark:text-stone-100 block">
                              {iss.issueTitle}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              /magazine/read/{iss.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-stone-600 dark:text-stone-300">
                          ভলিউম {iss.volumeNumber || '১'}, সংখ্যা {iss.issueNumber || '১'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span>
                          {iss.publicationMonth} {iss.publicationYear}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-stone-500">
                          {iss.pageCount || 0} পৃষ্ঠা {iss.pdfFileSize ? `• ${iss.pdfFileSize}` : ''}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          ৳{iss.singlePrice || 0}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${iss.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-stone-100 text-stone-600'
                            }`}
                        >
                          {iss.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/magazine/read/${iss.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                            title="রিডার প্রিভিউ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/admin/magazines/edit/${iss.id}`}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600"
                            title="সম্পাদনা করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. ARTICLES */}
      {activeTab === 'articles' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                প্রবন্ধ ও সম্পাদকীয় ভাণ্ডার ({articles.length}টি)
              </h3>
              <p className="text-xs text-stone-500">এই সাময়িকীর অধীনে নিবন্ধিত সকল রিসার্চ ও আর্টিকেল</p>
            </div>

            <Link
              href={`/admin/articles/create?magazineId=${magazine.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন প্রবন্ধ লিখুন
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-semibold">
                  <th className="py-3 px-3">প্রবন্ধের শিরোনাম</th>
                  <th className="py-3 px-3">লেখক</th>
                  <th className="py-3 px-3">ক্যাটাগরি</th>
                  <th className="py-3 px-3 text-center">পাঠের সময়</th>
                  <th className="py-3 px-3 text-center">সম্পাদকীয় স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      কোনো প্রবন্ধ পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  articles.map((art) => (
                    <tr key={art.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                      <td className="py-3 px-3">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          {art.title}
                        </span>
                        {art.subtitle && (
                          <span className="text-[10px] text-stone-400 block truncate max-w-xs">
                            {art.subtitle}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-stone-700 dark:text-stone-300">
                          {art.author?.name || art.authorName || 'অজ্ঞাত'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-stone-500">
                          {art.category?.name || 'সাধারণ'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-stone-500">{art.readingTimeMinutes || 5} মি.</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${art.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-amber-500/10 text-amber-700'
                            }`}
                        >
                          {art.editorialStatus || art.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/articles/edit/${art.id}`}
                          className="p-1.5 inline-flex rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. SCHEDULE */}
      {activeTab === 'schedule' && schedule && (
        <form
          onSubmit={handleSaveSchedule}
          className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                প্রকাশনা শিডিউল ও ডেডলাইন কনফিগারেশন
              </h3>
              <p className="text-xs text-stone-500">
                ফ্রিকোয়েন্সি, পরবর্তী সংখ্যার প্রত্যাশিত তারিখ ও অটোমেটেড রিমাইন্ডার ইঞ্জিন
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              শিডিউল সংরক্ষণ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                প্রকাশনা ফ্রিকোয়েন্সি
              </label>
              <select
                value={schedule.frequency}
                onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              >
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                সংখ্যা গণনা স্কিম (Numbering Scheme)
              </label>
              <select
                value={schedule.numberingScheme || 'VOL_ISSUE'}
                onChange={(e) => setSchedule({ ...schedule, numberingScheme: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              >
                <option value="VOL_ISSUE">ভলিউম ও সংখ্যা (বর্ষ X, সংখ্যা Y)</option>
                <option value="CONTINUOUS_ISSUE">ধারাবাহিক সংখ্যা (সংখ্যা ১, ২, ৩...)</option>
                <option value="YEAR_MONTH">বছর ও মাস (২০২৬, জানুয়ারি)</option>
                <option value="HIJRI_YEAR">হিজরি সন ভিত্তিক</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                পরবর্তী সংখ্যার প্রত্যাশিত প্রকাশের তারিখ
              </label>
              <input
                type="date"
                value={
                  schedule.nextExpectedDate
                    ? new Date(schedule.nextExpectedDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => setSchedule({ ...schedule, nextExpectedDate: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                সম্পাদকীয় ডেডলাইন (কত দিন পূর্বে পাণ্ডুলিপি জমা)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={schedule.editorialDeadlineDays || 5}
                onChange={(e) =>
                  setSchedule({ ...schedule, editorialDeadlineDays: Number(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedule.autoReminders}
                  onChange={(e) =>
                    setSchedule({ ...schedule, autoReminders: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="font-bold text-stone-700 dark:text-stone-300">
                  ডেডলাইনের আগে লেখকদের ও সম্পাদকদের স্বয়ংক্রিয় রিমাইন্ডার ইমেইল পাঠানো হোক
                </span>
              </label>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: 5. TEAM */}
      {activeTab === 'team' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                টিম ও সম্পাদকীয় ভূমিকা ({members.length} জন)
              </h3>
              <p className="text-xs text-stone-500">
                এই স্বতন্ত্র ওয়ার্কস্পেসের জন্য নির্ধারিত ইউজার রোল ও অ্যাক্সেস পারমিশন
              </p>
            </div>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন টিম মেম্বার যুক্ত করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/30 dark:bg-stone-800/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                      {mem.user.name || mem.user.email}
                    </h4>
                    <span className="text-[10px] text-stone-400 block">{mem.user.email}</span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-700">
                      {ROLE_LABELS[mem.role] || mem.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveMember(mem.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 transition"
                  title="অপসারণ করুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Member Modal */}
          {showAddMemberModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  নতুন টিম সদস্য যুক্ত করুন
                </h3>

                <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      ব্যবহারকারী নির্বাচন করুন
                    </label>
                    <select
                      value={newMemberUserId}
                      onChange={(e) => setNewMemberUserId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                    >
                      <option value="">নির্বাচন করুন...</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      ওয়ার্কস্পেস পদবি / রোল
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                    >
                      যুক্ত করুন
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 6. PRICING & SUBSCRIPTION PLANS */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                সাবস্ক্রিপশন প্ল্যান ও প্রাইসিং স্কিম
              </h3>
              <p className="text-xs text-stone-500">
                পাঠকদের জন্য তৈরি বিভিন্ন মেয়াদের আনলিমিটেড ডিজিটাল এক্সেস প্ল্যান
              </p>
            </div>

            <button
              onClick={() => setShowAddPlanModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন সাবস্ক্রিপশন প্ল্যান
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((pl) => (
              <div
                key={pl.id}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col justify-between relative bg-stone-50/30 dark:bg-stone-800/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {pl.name}
                    </span>
                    <button
                      onClick={() => handleDeletePlan(pl.id)}
                      className="text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    ৳{pl.price}
                    <span className="text-xs font-normal text-stone-400">
                      {' '}
                      / {pl.durationMonths} মাস
                    </span>
                  </p>
                  <p className="text-xs text-stone-500 mt-2 whitespace-pre-line leading-relaxed">
                    {pl.features || 'অনলাইন সকল সংখ্যা পড়ার সুবিধা'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>আর্কাইভ এক্সেস: {pl.includesArchive ? 'হ্যাঁ' : 'না'}</span>
                  <span>PDF ডাউনলোড: {pl.allowPdfDownload ? 'হ্যাঁ' : 'না'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Plan Modal */}
          {showAddPlanModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  নতুন সাবস্ক্রিপশন প্ল্যান তৈরি করুন
                </h3>

                <form onSubmit={handleAddPlan} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      প্ল্যানের নাম
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        মেয়াদ (মাস)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newPlan.durationMonths}
                        onChange={(e) =>
                          setNewPlan({ ...newPlan, durationMonths: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        মূল্য (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      ফিচার তালিকা (লাইন ভিত্তিক)
                    </label>
                    <textarea
                      rows={3}
                      value={newPlan.features}
                      onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPlanModal(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                    >
                      তৈরি করুন
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 7. RIGHTS & LICENSING */}
      {activeTab === 'rights' && rights && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                কপিরাইট, ইন্টেলেকচুয়াল প্রপার্টি ও লাইসেন্স
              </h3>
              <p className="text-xs text-stone-500">
                স্বত্বাধিকারী প্রতিষ্ঠান, লাইসেন্স টাইপ ও লিগ্যাল পারমিশন
              </p>
            </div>

            <button
              onClick={handleSaveRights}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              কপিরাইট সংরক্ষণ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                কপিরাইট স্বত্বাধিকারী (Rights Holder)
              </label>
              <input
                type="text"
                value={rights.rightsHolder || ''}
                onChange={(e) => setRights({ ...rights, rightsHolder: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                লাইসেন্স ধরন (License Type)
              </label>
              <select
                value={rights.licenseType || 'ALL_RIGHTS_RESERVED'}
                onChange={(e) => setRights({ ...rights, licenseType: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              >
                <option value="ALL_RIGHTS_RESERVED">সর্বস্বত্ব সংরক্ষিত (All Rights Reserved)</option>
                <option value="CREATIVE_COMMONS">ক্রিয়েটিভ কমন্স (Creative Commons CC BY-NC)</option>
                <option value="OPEN_ACCESS">ওপেন এক্সেস অ্যাকাডেমিক (Open Access)</option>
                <option value="PUBLIC_DOMAIN">পাবলিক ডোমেইন (Public Domain)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                কপিরাইট বার্তা / ফুটনোট
              </label>
              <input
                type="text"
                value={rights.copyrightNotice || ''}
                onChange={(e) => setRights({ ...rights, copyrightNotice: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rights.allowPdfHosting}
                  onChange={(e) => setRights({ ...rights, allowPdfHosting: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="font-bold text-stone-700 dark:text-stone-300">
                  ক্লাউড সার্ভারে মূল PDF সংরক্ষণ ও অনলাইন রেন্ডারিং অনুমোদিত
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rights.attributionRequired}
                  onChange={(e) => setRights({ ...rights, attributionRequired: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="font-bold text-stone-700 dark:text-stone-300">
                  উদ্ধৃতি বা শেয়ার করার ক্ষেত্রে মূল সাময়িকীর নাম উল্লেখ বাধ্যতামূলক
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. FILES */}
      {activeTab === 'files' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                PDF ও ডিজিটাল ফাইল ভাণ্ডার ({files.length}টি ফাইল)
              </h3>
              <p className="text-xs text-stone-500">এই সাময়িকীর সংরক্ষিত সকল মূল ও কমপ্রেসড PDF ফাইল</p>
            </div>

            <Link
              href="/admin/publications/files"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition self-start"
            >
              সেন্ট্রাল ফাইল লাইব্রেরি খুলুন
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-semibold">
                  <th className="py-3 px-3">ফাইলের নাম</th>
                  <th className="py-3 px-3">সাইজ ও ধরন</th>
                  <th className="py-3 px-3">সংরক্ষিত সময়</th>
                  <th className="py-3 px-3 text-right">ডাউনলোড / লিঙ্ক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">
                      কোনো আপলোডকৃত ফাইল পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                      <td className="py-3 px-3">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          {file.fileName}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">{file.fileUrl}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-stone-600 dark:text-stone-300">
                          {file.fileSize ? `${(file.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'অজ্ঞাত'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-stone-400">
                          {new Date(file.createdAt).toLocaleDateString('bn-BD')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 text-xs font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          ডাউনলোড
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                ওয়ার্কস্পেস সিকিউরিটি ও পাঠক পারমিশন সেটিংস
              </h3>
              <p className="text-xs text-stone-500">
                এই নির্দিষ্ট সাময়িকীর জন্য প্রযোজ্য পাঠক ও ডাউনলোড নীতিমালা
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              সেটিংস সংরক্ষণ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                অনলাইন রিডারে ওয়াটারমার্ক টেক্সট
              </label>
              <input
                type="text"
                value={settings['watermark_text'] || ''}
                onChange={(e) => setSettings({ ...settings, watermark_text: e.target.value })}
                placeholder="যেমন: Shubban Library Copy Protection"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                অনলাইন ফ্লিপবুক ও রিডারে পৃষ্ঠার উপর স্বচ্ছভাবে প্রদর্শিত হবে
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                অফিসিয়াল যোগাযোগ ইমেইল
              </label>
              <input
                type="email"
                value={settings['contact_email'] || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                placeholder="editor@example.com"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="md:col-span-2 space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['allow_pdf_download'] === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allow_pdf_download: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">
                    সরাসরি মূল PDF ডাউনলোড সক্রিয় রাখুন
                  </span>
                  <span className="text-[11px] text-stone-500">
                    বন্ধ থাকলে পাঠকরা শুধুমাত্র ব্রাউজারে অনলাইন ফ্লিপবুক ভিউতে পড়তে পারবে
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['require_login_to_read'] === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      require_login_to_read: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">
                    পড়ার পূর্বে লগইন বাধ্যতামূলক করুন
                  </span>
                  <span className="text-[11px] text-stone-500">
                    পাঠককে নিবন্ধিত ইউজার একাউন্ট দিয়ে সাইন-ইন করে পড়তে হবে
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['enable_search_indexing'] === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enable_search_indexing: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">
                    সার্চ ইঞ্জিন ইনডেক্সিং (SEO Indexing) সক্রিয় রাখুন
                  </span>
                  <span className="text-[11px] text-stone-500">
                    গুগল এবং অন্যান্য সার্চ ইঞ্জিনে আর্টিকেল ও সংখ্যা ইনডেক্স হবে
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 10. AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-stone-600" />
                অডিট হিস্ট্রি ও ইভেন্ট লগ
              </h3>
              <p className="text-xs text-stone-500">
                এই ওয়ার্কস্পেসে সংঘটিত সকল কার্যক্রম ও পরিবর্তনের রেকর্ড
              </p>
            </div>

            <button
              onClick={loadAuditLogs}
              disabled={loadingAudit}
              className="text-xs text-emerald-600 hover:underline font-semibold"
            >
              {loadingAudit ? 'লোড হচ্ছে...' : 'রিফ্রেশ করুন'}
            </button>
          </div>

          {loadingAudit ? (
            <div className="py-12 text-center text-stone-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>অডিট লগ লোড হচ্ছে...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              এখনো কোনো অডিট রেকর্ড নেই
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-start justify-between bg-stone-50/40 dark:bg-stone-800/20 text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {log.action}
                    </span>
                    <span className="text-stone-600 dark:text-stone-400 text-[11px] block mt-0.5">
                      {log.description}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                      আইডি: {log.id} • ব্যবহারকারী: {log.performedBy || 'System'}
                    </span>
                  </div>

                  <span className="text-[10px] text-stone-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
