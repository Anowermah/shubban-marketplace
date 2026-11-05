'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  History,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface TaskLogItem {
  id: string;
  intent: string;
  command: string;
  status: string;
  safetyMode: string;
  planSummary: string;
  executedAt?: string | null;
  createdAt: string;
  steps: Array<{
    id: string;
    stepOrder: number;
    title: string;
    toolName: string;
    status: string;
  }>;
  toolExecutions: Array<{
    id: string;
    toolName: string;
    isSuccess: boolean;
    durationMs: number;
    createdAt: string;
  }>;
}

interface AiStudioAuditLogsClientProps {
  initialLogs: TaskLogItem[];
}

export default function AiStudioAuditLogsClient({
  initialLogs,
}: AiStudioAuditLogsClientProps) {
  const [logs] = useState<TaskLogItem[]>(initialLogs);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    if (
      searchQuery &&
      !log.command.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.intent.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-stone-500/10 text-stone-700 dark:text-stone-300">
                <History className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                এআই অডিট লগ ও অটোনোমাস অ্যাকশন ট্র্যাকার
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700">
                IMMUTABLE AUDIT TRAIL
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              এআই সিস্টেম কর্তৃক কার্যকর হওয়া প্রতিটি কমান্ড, টুল এক্সিকিউশন, সেফটি মোড মূল্যায়ন ও রোলব্যাক ইভেন্টের অপরিবর্তনীয় প্রমাণ ও নিরীক্ষা রেকর্ড।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/ai-studio/command-center"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs text-stone-700 dark:text-stone-200 transition"
            >
              <Bot className="w-3.5 h-3.5 text-amber-500" />
              <span>কমান্ড সেন্টারে যান</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: `সব লগ (${toBengaliNumber(logs.length)})` },
            { id: 'COMPLETED', label: 'বাস্তবায়িত' },
            { id: 'PENDING_APPROVAL', label: 'অপেক্ষমাণ' },
            { id: 'ROLLED_BACK', label: 'রোলড ব্যাক' },
            { id: 'FAILED', label: 'ব্যর্থ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="কমান্ড বা ইনটেন্ট খুঁজুন..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 uppercase tracking-wider text-[10px] font-bold border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4">ইনটেন্ট ও কমান্ড</th>
                <th className="p-4">সেফটি মোড</th>
                <th className="p-4">স্ট্যাটাস</th>
                <th className="p-4">টুলস ব্যবহৃত</th>
                <th className="p-4">সময়কাল</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-stone-400">
                    কোনো অডিট লগ রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                        <td className="p-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100">
                            {log.intent}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate max-w-sm">
                            {log.command}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.safetyMode === 'MODE_A'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                                : log.safetyMode === 'MODE_C'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                            }`}
                          >
                            {log.safetyMode}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              log.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-600'
                                : log.status === 'ROLLED_BACK'
                                ? 'bg-purple-50 text-purple-600'
                                : log.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-stone-50 text-stone-600'
                            }`}
                          >
                            {log.status === 'COMPLETED'
                              ? '✓ বাস্তবায়িত'
                              : log.status === 'ROLLED_BACK'
                              ? 'রোলড ব্যাক'
                              : log.status === 'PENDING_APPROVAL'
                              ? 'অপেক্ষমাণ'
                              : log.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-stone-500">
                          {toBengaliNumber(log.steps?.length || 0)} টি ধাপ
                        </td>
                        <td className="p-4 text-stone-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString('bn-BD')}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Steps & Tool Executions Detail */}
                      {isExpanded && (
                        <tr className="bg-stone-50/50 dark:bg-stone-950/40">
                          <td colSpan={6} className="p-4 sm:p-6 space-y-3">
                            <div className="text-xs space-y-1">
                              <span className="font-bold text-stone-700 dark:text-stone-300">
                                পরিকল্পনা সারসংক্ষেপ:
                              </span>
                              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                                {log.planSummary}
                              </p>
                            </div>

                            {log.steps && log.steps.length > 0 && (
                              <div className="space-y-1.5 pt-2">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                                  ধাপসমূহের বিবরণ:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {log.steps.map((st) => (
                                    <div
                                      key={st.id}
                                      className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between"
                                    >
                                      <span>
                                        <strong>ধাপ {toBengaliNumber(st.stepOrder)}:</strong>{' '}
                                        {st.title}
                                      </span>
                                      <span className="text-[10px] font-mono text-stone-400">
                                        {st.toolName}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

