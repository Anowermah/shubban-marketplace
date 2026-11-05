'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Settings,
  X,
  Calendar,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  triggerType: string;
  cronExpression?: string | null;
  actionType: string;
  agentKey?: string;
  status: string;
  isEnabled: boolean;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  executionCount: number;
}

interface AiStudioAutomationsClientProps {
  initialWorkflows: Workflow[];
}

export default function AiStudioAutomationsClient({
  initialWorkflows,
}: AiStudioAutomationsClientProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // New Workflow form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronSchedule, setCronSchedule] = useState('0 9 * * *');
  const [actionIntent, setActionIntent] = useState('CUSTOM_TASK');
  const [safetyMode, setSafetyMode] = useState('MODE_B');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/ai-studio/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isEnabled: !current }),
      });
      if (res.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isEnabled: !current } : w))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunNow = async (id: string) => {
    setRunningId(id);
    try {
      const res = await fetch('/api/admin/ai-studio/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RUN_NOW', id }),
      });
      const data = await res.json();
      if (data.success && data.workflow) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ...data.workflow } : w))
        );
      }
    } catch (e) {
      alert('অটোমেশন রান করতে সমস্যা হয়েছে');
    } finally {
      setRunningId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/ai-studio/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          cronSchedule,
          actionIntent,
          safetyMode,
          triggerType: 'SCHEDULE',
        }),
      });
      const data = await res.json();
      if (data.success && data.workflow) {
        setWorkflows((prev) => [data.workflow, ...prev]);
        setModalOpen(false);
        setName('');
        setDescription('');
      } else {
        alert(data.error || 'অটোমেশন তৈরি করা যায়নি');
      }
    } catch (e) {
      alert('সার্ভার সংযোগ ত্রুটি');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Zap className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                স্বয়ংক্রিয় শিডিউলার ও এআই ওয়ার্কফ্লো হাব
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                CRON & TRIGGERS
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              দৈনিক ইনভেন্টরি রিপোর্ট, প্রকাশনা ডেডলাইন রিমাইন্ডার এবং এসইও অপ্টিমাইজেশনের মতো পুনরাবৃত্তিমূলক কাজগুলো নির্ধারিত ক্রন শিডিউলে স্বয়ংক্রিয়ভাবে সম্পাদিত হয়।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ওয়ার্কফ্লো তৈরি করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1.5 rounded-lg ${
                      wf.isEnabled
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {wf.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wf.status === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    {wf.status === 'ACTIVE' ? 'সক্রিয়' : 'স্থগিত'}
                  </span>
                  {/* Switch */}
                  <button
                    onClick={() => handleToggle(wf.id, wf.isEnabled)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                      wf.isEnabled ? 'bg-purple-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </div>

              {wf.description && (
                <p className="text-xs text-stone-500 leading-relaxed">{wf.description}</p>
              )}

              {wf.cronExpression && (
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  <span>শিডিউল: {wf.cronExpression}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-400">
                মোট এক্সিকিউশন: <strong>{toBengaliNumber(wf.executionCount)}</strong> বার
              </span>

              <button
                disabled={runningId === wf.id}
                onClick={() => handleRunNow(wf.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-purple-400 text-purple-700 dark:text-purple-300 text-xs font-semibold transition active:scale-95"
              >
                {runningId === wf.id ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                <span>এখনই চালান</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for creating custom workflow */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-bengali">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                নতুন শিডিউলার তৈরি করুন
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  ওয়ার্কফ্লোর নাম:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: 'সাপ্তাহিক টপ সেলার তালিকা'..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  ক্রন শিডিউল (Cron Expression):
                </label>
                <input
                  type="text"
                  required
                  value={cronSchedule}
                  onChange={(e) => setCronSchedule(e.target.value)}
                  placeholder="যেমন: 0 9 * * * (প্রতিদিন সকাল ৯টা)"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  অ্যাকশন ইনটেন্ট:
                </label>
                <select
                  value={actionIntent}
                  onChange={(e) => setActionIntent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="SALES_DIGEST">বিক্রয় ডাইজেস্ট (Sales Digest)</option>
                  <option value="STOCK_CHECK">স্বল্প স্টক সতর্কবার্তা (Stock Alert)</option>
                  <option value="SEO_AUDIT">এসইও অডিট (SEO Audit)</option>
                  <option value="MAGAZINE_DEADLINE_ALERT">ম্যাগাজিন ডেডলাইন (Deadline Alert)</option>
                  <option value="CUSTOM_TASK">কাস্টম টাস্ক (Custom Task)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  নিরাপত্তা মোড:
                </label>
                <select
                  value={safetyMode}
                  onChange={(e) => setSafetyMode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="MODE_A">মোড A: তাৎক্ষণিক স্বয়ংক্রিয় সম্পাদন</option>
                  <option value="MODE_B">মোড B: প্রিভিউ তৈরি ও অনুমোদন আবশ্যক</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800 dark:text-stone-200">
                  বিবরণ:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="কাজের বিবরণ..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
                >
                  {isSubmitting ? 'তৈরি হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
