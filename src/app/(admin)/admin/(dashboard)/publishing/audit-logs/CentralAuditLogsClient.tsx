'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AuditItem {
  id: string;
  magazineId: string | null;
  magazineTitle: string;
  magazineColor: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  userName: string;
  ipHash: string | null;
  createdAt: string;
}

interface Props {
  initialLogs: AuditItem[];
  magazines: { id: string; title: string }[];
}

export default function CentralAuditLogsClient({ initialLogs, magazines }: Props) {
  const [logs, setLogs] = useState<AuditItem[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMag, setSelectedMag] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const actionList = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !searchTerm ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMag = !selectedMag || log.magazineId === selectedMag;
      const matchAction = !selectedAction || log.action === selectedAction;

      return matchSearch && matchMag && matchAction;
    });
  }, [logs, searchTerm, selectedMag, selectedAction]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <Link href="/admin/publishing" className="hover:text-emerald-700 transition">
              সেন্ট্রাল প্রকাশনা
            </Link>
            <span>/</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">অডিট লগ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-stone-700 to-stone-900 text-white flex items-center justify-center shadow-md">
              <History className="w-5 h-5" />
            </div>
            সেন্ট্রাল প্রকাশনা অডিট হিস্ট্রি ও ইভেন্ট লগ
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            প্ল্যাটফর্মের সকল ওয়ার্কস্পেস ইনিশিয়ালাইজেশন, পলিসি পরিবর্তন ও অ্যাক্টিভিটির অপরিবর্তনযোগ্য রেকর্ড
          </p>
        </div>

        <Link
          href="/admin/publishing"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition self-start"
        >
          কন্ট্রোল সেন্টারে ফিরে যান
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="অ্যাকশন, ইউজার আইডি বা বিবরণ দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMag}
            onChange={(e) => setSelectedMag(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল সাময়িকী</option>
            {magazines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল অ্যাকশন</option>
            {actionList.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-semibold">
                <th className="py-3.5 px-4">অ্যাকশন ও ধরন</th>
                <th className="py-3.5 px-4">সাময়িকী / স্কোপ</th>
                <th className="py-3.5 px-4">সম্পাদনকারী</th>
                <th className="py-3.5 px-4">তারিখ ও সময়</th>
                <th className="py-3.5 px-4 text-right">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    কোনো অডিট লগ রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                        <td className="py-4 px-4">
                          <span className="font-bold text-stone-900 dark:text-stone-100 block font-mono">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            টার্গেট: {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {log.magazineId ? (
                            <Link
                              href={`/admin/publishing/workspaces/${log.magazineId}`}
                              className="flex items-center gap-2 hover:underline text-stone-800 dark:text-stone-200"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: log.magazineColor }}
                              />
                              <span className="font-semibold">{log.magazineTitle}</span>
                            </Link>
                          ) : (
                            <span className="text-stone-400 italic">প্ল্যাটফর্ম-ব্যাপী</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-medium text-stone-800 dark:text-stone-200 block">
                            {log.userName}
                          </span>
                          {log.ipHash && (
                            <span className="text-[10px] text-stone-400 block font-mono">
                              IP Hash: {log.ipHash}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="text-stone-600 dark:text-stone-400 block">
                            {new Date(log.createdAt).toLocaleString('bn-BD')}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                            {log.id}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {log.details ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-300"
                            >
                              <span>{isExpanded ? 'লুকান' : 'পেলোড'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-400">—</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && log.details && (
                        <tr className="bg-stone-50/90 dark:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800">
                          <td colSpan={5} className="py-3 px-6">
                            <div className="p-3 rounded-xl bg-stone-900 text-stone-100 font-mono text-[11px] overflow-x-auto">
                              <pre>{log.details}</pre>
                            </div>
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
