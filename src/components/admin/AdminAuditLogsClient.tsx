'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  ShieldAlert,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
}

interface AdminAuditLogsClientProps {
  initialLogs: AuditLogItem[];
  initialTotal: number;
  initialPage: number;
  initialLimit: number;
  availableActions: string[];
  availableEntities: string[];
  operatorRole: string;
}

export default function AdminAuditLogsClient({
  initialLogs,
  initialTotal,
  initialPage,
  initialLimit,
  availableActions: initActions,
  availableEntities: initEntities,
  operatorRole,
}: AdminAuditLogsClientProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [availableActions, setAvailableActions] = useState<string[]>(initActions);
  const [availableEntities, setAvailableEntities] = useState<string[]>(initEntities);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [viewLog, setViewLog] = useState<AuditLogItem | null>(null);
  const [deleteLog, setDeleteLog] = useState<AuditLogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeOption, setPurgeOption] = useState<'30' | '60' | '90' | 'all'>('30');
  const [isPurging, setIsPurging] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSuperAdmin = operatorRole === 'SUPER_ADMIN';

  const fetchLogs = useCallback(
    async (targetPage = page, query = search, act = selectedAction, ent = selectedEntity) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(limit),
        });
        if (query) params.set('q', query);
        if (act) params.set('action', act);
        if (ent) params.set('entity', ent);

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setLogs(data.logs);
          setTotal(data.total);
          setPage(data.page);
          if (data.availableActions) setAvailableActions(data.availableActions);
          if (data.availableEntities) setAvailableEntities(data.availableEntities);
          setSelectedIds([]);
        } else {
          setFeedback({ type: 'error', message: data.error || 'অডিট লগ লোড করা যায়নি।' });
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
      } finally {
        setIsLoading(false);
      }
    },
    [limit, page, search, selectedAction, selectedEntity]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1, search, selectedAction, selectedEntity);
  };

  const handleActionFilterChange = (act: string) => {
    setSelectedAction(act);
    setPage(1);
    fetchLogs(1, search, act, selectedEntity);
  };

  const handleEntityFilterChange = (ent: string) => {
    setSelectedEntity(ent);
    setPage(1);
    fetchLogs(1, search, selectedAction, ent);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map((l) => l.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete single log
  const handleConfirmDeleteSingle = async () => {
    if (!deleteLog) return;
    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/audit-logs?id=${deleteLog.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message || 'লগ সফলভাবে মুছে ফেলা হয়েছে!' });
        setDeleteLog(null);
        fetchLogs(page);
      } else {
        setFeedback({ type: 'error', message: data.error || 'মুছে ফেলতে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Bulk delete selected logs
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`আপনি কি নিশ্চিত যে নির্বাচিত ${toBengaliNumber(selectedIds.length)}টি অডিট লগ মুছে ফেলতে চান?`)) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message || 'নির্বাচিত লগ সফলভাবে মুছে ফেলা হয়েছে!' });
        setSelectedIds([]);
        fetchLogs(page);
      } else {
        setFeedback({ type: 'error', message: data.error || 'মুছে ফেলতে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Purge logs
  const handleConfirmPurge = async () => {
    setIsPurging(true);
    setFeedback(null);

    try {
      const body: any = {};
      if (purgeOption === 'all') {
        body.purgeAll = true;
      } else {
        body.purgeOlderThanDays = parseInt(purgeOption, 10);
      }

      const res = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message || 'অডিট লগ ক্লিনআপ সম্পন্ন হয়েছে!' });
        setShowPurgeModal(false);
        setPage(1);
        fetchLogs(1);
      } else {
        setFeedback({ type: 'error', message: data.error || 'ছাঁটাই করতে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsPurging(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const copyDetailsToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-shubban-gold" />
            <span>সিস্টেম অডিট লগ ও ট্রেইল ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট <strong className="text-shubban-green dark:text-shubban-gold font-mono">{toBengaliNumber(total)}</strong>টি নিরাপত্তা রেকর্ড সংরক্ষিত রয়েছে। অনুসন্ধান, ফিল্টারিং ও ব্যবস্থাপনা করুন।
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>নির্বাচিত {toBengaliNumber(selectedIds.length)}টি মুছুন</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-500" />
              <span>পুরনো লগ ছাঁটাই / ক্লিনআপ</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="অ্যাকশন, এনটিটি, এডমিন বা বিবরণ খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedAction}
              onChange={(e) => handleActionFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            >
              <option value="">সকল অ্যাকশন (All Actions)</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedEntity}
              onChange={(e) => handleEntityFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            >
              <option value="">সকল এনটিটি (All Entities)</option>
              {availableEntities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold text-xs flex items-center justify-center transition-colors"
            >
              খুঁজুন
            </button>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {selectedIds.length > 0 && selectedIds.length === logs.length ? (
                      <CheckSquare className="w-4 h-4 text-shubban-green dark:text-shubban-gold" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">অ্যাকশন</th>
                <th className="p-4">অপারেটর (এডমিন)</th>
                <th className="p-4">এনটিটি</th>
                <th className="p-4">বিস্তারিত তথ্য</th>
                <th className="p-4">আইপি ও তারিখ</th>
                <th className="p-4 text-right">ম্যানেজমেন্ট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    কোন অডিট লগ রেকর্ড খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isChecked = selectedIds.includes(log.id);
                  const isDanger = log.action.includes('DELETE') || log.action.includes('PURGE');
                  const isUpdate = log.action.includes('UPDATE') || log.action.includes('EDIT') || log.action.includes('STATUS');

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors ${
                        isChecked ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(log.id)}
                          className="text-stone-400 hover:text-stone-600 transition-colors"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-shubban-green dark:text-shubban-gold" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                            isDanger
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/40'
                              : isUpdate
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-stone-700 dark:text-stone-300">
                        <span className="font-semibold block">{log.user?.name || 'সিস্টেম অটোমেশন'}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {log.user?.email || log.user?.role || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-stone-600 dark:text-stone-400">
                        <span className="font-semibold">{log.entity}</span>
                        {log.entityId && (
                          <span className="block text-[10px] text-stone-400 opacity-80">
                            #{log.entityId.slice(-8)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-stone-600 dark:text-stone-300 max-w-xs">
                        <p className="truncate text-xs font-sans">{log.details || 'সফল অ্যাকশন সম্পন্ন'}</p>
                      </td>
                      <td className="p-4 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1 text-stone-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatBengaliDate(log.createdAt)}</span>
                        </div>
                        {log.ipAddress && (
                          <span className="text-[10px] opacity-70 block">IP: {log.ipAddress}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewLog(log)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteLog(log)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                            title="লগ মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
          <div>
            মোট {toBengaliNumber(total)}টির মধ্যে পৃষ্ঠা {toBengaliNumber(page)} (সর্বমোট {toBengaliNumber(totalPages || 1)} পৃষ্ঠা)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => {
                const nextP = page - 1;
                setPage(nextP);
                fetchLogs(nextP);
              }}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>পূর্ববর্তী</span>
            </button>

            <span className="font-mono font-bold text-stone-800 dark:text-stone-200 px-2">
              {toBengaliNumber(page)}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => {
                const nextP = page + 1;
                setPage(nextP);
                fetchLogs(nextP);
              }}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              <span>পরবর্তী</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* View Log Details Modal */}
      {viewLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  অডিট লগ বিস্তারিত বিবরণ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewLog(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">অ্যাকশন</span>
                <span className="font-mono font-bold text-shubban-green dark:text-shubban-gold">
                  {viewLog.action}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">অপারেটর</span>
                <span className="font-semibold block">{viewLog.user?.name || 'সিস্টেম'}</span>
                <span className="text-[10px] text-stone-500 font-mono">{viewLog.user?.email || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">টার্গেট এনটিটি</span>
                <span className="font-mono font-bold">{viewLog.entity}</span>
                {viewLog.entityId && (
                  <span className="block text-[10px] text-stone-500 font-mono">ID: {viewLog.entityId}</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">তারিখ ও আইপি</span>
                <span className="font-mono block">{formatBengaliDate(viewLog.createdAt)}</span>
                <span className="text-[10px] text-stone-500 font-mono">IP: {viewLog.ipAddress || 'Unknown'}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase">
                  সম্পূর্ণ ডাটা পে-লোড (Payload Details):
                </span>
                {viewLog.details && (
                  <button
                    type="button"
                    onClick={() => copyDetailsToClipboard(viewLog.details || '')}
                    className="text-[10px] font-semibold text-shubban-gold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                  </button>
                )}
              </div>
              <pre className="p-3.5 rounded-xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-60 border border-stone-800">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(viewLog.details || '{}'), null, 2);
                  } catch {
                    return viewLog.details || 'কোন অতিরিক্ত তথ্য নেই।';
                  }
                })()}
              </pre>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewLog(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Log Modal */}
      {deleteLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                অডিট লগ মুছতে চান?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে নিচের অডিট লগ রেকর্ডটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান? এই অ্যাকশন অপরিবর্তনীয়।
            </p>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
              <div><strong>অ্যাকশন:</strong> <span className="font-mono text-rose-600">{deleteLog.action}</span></div>
              <div><strong>এনটিটি:</strong> <span className="font-mono">{deleteLog.entity}</span></div>
              <div><strong>তারিখ:</strong> {formatBengaliDate(deleteLog.createdAt)}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteLog(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>হ্যাঁ, লগ মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge / Retention Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                পুরনো অডিট লগ ছাঁটাই / ক্লিনআপ
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              সিস্টেম ডাটাবেজের পারফরম্যান্স ও স্পেস বাঁচাতে নির্দিষ্ট মেয়াদের পুরনো অডিট লগ ছাঁটাই করুন। ছাঁটাইকরণের তথ্য অপরিবর্তনীয় ট্রেইলে সংরক্ষিত হবে।
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer">
                <input
                  type="radio"
                  name="purgeOption"
                  value="30"
                  checked={purgeOption === '30'}
                  onChange={() => setPurgeOption('30')}
                  className="accent-shubban-green"
                />
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  ৩০ দিনের পূর্বের সকল পুরনো লগ মুছুন (প্রস্তাবিত)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer">
                <input
                  type="radio"
                  name="purgeOption"
                  value="60"
                  checked={purgeOption === '60'}
                  onChange={() => setPurgeOption('60')}
                  className="accent-shubban-green"
                />
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  ৬০ দিনের পূর্বের সকল পুরনো লগ মুছুন
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer">
                <input
                  type="radio"
                  name="purgeOption"
                  value="90"
                  checked={purgeOption === '90'}
                  onChange={() => setPurgeOption('90')}
                  className="accent-shubban-green"
                />
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  ৯০ দিনের পূর্বের সকল পুরনো লগ মুছুন
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 cursor-pointer">
                <input
                  type="radio"
                  name="purgeOption"
                  value="all"
                  checked={purgeOption === 'all'}
                  onChange={() => setPurgeOption('all')}
                  className="accent-rose-600"
                />
                <span className="font-semibold text-rose-700 dark:text-rose-300">
                  ডাটাবেজের সমস্ত অডিট লগ মুছে সম্পূর্ণ ফ্রেশ শুরু করুন
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isPurging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>ছাঁটাই নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
