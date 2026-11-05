'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface ApprovalItem {
  id: string;
  taskId: string;
  requestedBy: string;
  approvedBy?: string | null;
  decision: string;
  comment?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  task: {
    id: string;
    intent: string;
    command: string;
    status: string;
    safetyMode: string;
    planSummary: string;
    diffPreview?: any;
    steps?: Array<{
      id: string;
      stepOrder: number;
      title: string;
      status: string;
    }>;
  };
}

interface AiStudioApprovalsClientProps {
  initialApprovals: ApprovalItem[];
}

export default function AiStudioApprovalsClient({
  initialApprovals,
}: AiStudioApprovalsClientProps) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null);

  const handleApprove = async (taskId: string) => {
    setActionInProgress(taskId);
    try {
      const res = await fetch('/api/admin/ai/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE', taskId }),
      });
      if (res.ok) {
        setApprovals((prev) =>
          prev.map((a) =>
            a.taskId === taskId
              ? {
                  ...a,
                  decision: 'APPROVED',
                  decidedAt: new Date().toISOString(),
                  task: { ...a.task, status: 'COMPLETED' },
                }
              : a
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || 'অনুমোদন ব্যর্থ হয়েছে');
      }
    } catch (e) {
      alert('সার্ভার সংযোগ ত্রুটি');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (taskId: string) => {
    setActionInProgress(taskId);
    try {
      const res = await fetch('/api/admin/ai/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', taskId }),
      });
      if (res.ok) {
        setApprovals((prev) =>
          prev.map((a) =>
            a.taskId === taskId
              ? {
                  ...a,
                  decision: 'REJECTED',
                  decidedAt: new Date().toISOString(),
                  task: { ...a.task, status: 'REJECTED' },
                }
              : a
          )
        );
      }
    } catch (e) {
      alert('সার্ভার সংযোগ ত্রুটি');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRollback = async (taskId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই টাস্কের পরিবর্তন রোলব্যাক করতে চান?')) return;
    setActionInProgress(taskId);
    try {
      const res = await fetch('/api/admin/ai/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ROLLBACK', taskId }),
      });
      if (res.ok) {
        setApprovals((prev) =>
          prev.map((a) =>
            a.taskId === taskId
              ? {
                  ...a,
                  task: { ...a.task, status: 'ROLLED_BACK' },
                }
              : a
          )
        );
      }
    } catch (e) {
      alert('রোলব্যাক ব্যর্থ হয়েছে');
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = approvals.filter((a) => {
    if (filterDecision === 'ALL') return true;
    return a.decision === filterDecision;
  });

  const pendingCount = approvals.filter((a) => a.decision === 'PENDING').length;

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                হিউম্যান-ইন-দ্য-লুপ (HITL) অনুমোদন কেন্দ্র
              </h1>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                  {toBengaliNumber(pendingCount)} টি অপেক্ষমাণ
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              Mode B (প্রিভিউ আবশ্যক) ও Mode C (স্পর্শকাতর অপারেশন) টাস্কসমূহ মানুষের সরাসরি যাচাই এবং অনুমোদন ছাড়া ডেটাবেজে প্রয়োগ হয় না।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/ai-studio/command-center"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs text-stone-700 dark:text-stone-200 transition"
            >
              <span>কমান্ড সেন্টারে যান</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'ALL', label: `সব অনুরোধ (${toBengaliNumber(approvals.length)})` },
          { id: 'PENDING', label: `অপেক্ষমাণ (${toBengaliNumber(pendingCount)})` },
          { id: 'APPROVED', label: 'অনুমোদিত' },
          { id: 'REJECTED', label: 'প্রত্যাখ্যাত' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterDecision(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterDecision === tab.id
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approvals Table / Card Stream */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            এই ক্যাটাগরিতে কোনো অনুমোদনের অনুরোধ নেই
          </div>
        ) : (
          filtered.map((item) => {
            const isDiffOpen = expandedDiffId === item.id;
            const diffData = item.task.diffPreview
              ? typeof item.task.diffPreview === 'string'
                ? JSON.parse(item.task.diffPreview)
                : item.task.diffPreview
              : null;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {item.task.intent}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.task.safetyMode === 'MODE_C'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.task.safetyMode}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.decision === 'APPROVED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                          : item.decision === 'REJECTED'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 animate-pulse'
                      }`}
                    >
                      {item.decision === 'APPROVED'
                        ? '✓ অনুমোদিত'
                        : item.decision === 'REJECTED'
                        ? '✗ প্রত্যাখ্যাত'
                        : 'অপেক্ষমাণ সিদ্ধান্ত'}
                    </span>
                  </div>

                  <span className="text-[11px] text-stone-400">
                    আবেদনের সময়: {new Date(item.createdAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>

                {/* Plan Summary */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-stone-500 block">কমান্ড ও পরিকল্পনা:</span>
                  <p className="text-xs text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    &quot;{item.task.command}&quot; — {item.task.planSummary}
                  </p>
                </div>

                {/* Steps Checklist */}
                {item.task.steps && item.task.steps.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      প্রস্তাবিত ধাপসমূহ:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {item.task.steps.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 text-[10px] flex items-center justify-center font-bold">
                              {toBengaliNumber(st.stepOrder)}
                            </span>
                            <span className="truncate">{st.title}</span>
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">{st.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diff Viewer Accordion */}
                {diffData && (
                  <div>
                    <button
                      onClick={() => setExpandedDiffId(isDiffOpen ? null : item.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isDiffOpen ? 'ডিফ লুকান' : 'পরিবর্তন নিরীক্ষা (Diff Viewer) দেখুন'}</span>
                    </button>

                    {isDiffOpen && (
                      <div className="mt-2 p-3 rounded-xl bg-stone-900 text-stone-100 text-[11px] font-mono overflow-x-auto space-y-1">
                        <pre className="text-amber-300">
                          {JSON.stringify(diffData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  {item.decision === 'PENDING' && (
                    <>
                      <button
                        disabled={actionInProgress === item.taskId}
                        onClick={() => handleReject(item.taskId)}
                        className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 text-xs font-semibold transition"
                      >
                        প্রত্যাখ্যান করুন
                      </button>
                      <button
                        disabled={actionInProgress === item.taskId}
                        onClick={() => handleApprove(item.taskId)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                      >
                        {actionInProgress === item.taskId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>অনুমোদন ও বাস্তবায়ন করুন</span>
                      </button>
                    </>
                  )}

                  {item.decision === 'APPROVED' && item.task.status === 'COMPLETED' && (
                    <button
                      disabled={actionInProgress === item.taskId}
                      onClick={() => handleRollback(item.taskId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>রোলব্যাক (আগের অবস্থায় ফেরত)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

