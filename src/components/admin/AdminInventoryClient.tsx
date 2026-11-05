'use client';

import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Plus,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate, formatTaka } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface LowStockBook {
  id: string;
  title: string;
  slug: string;
  stockQuantity: number;
  author: { name: string };
  category: { name: string };
}

export interface InventoryLogItem {
  id: string;
  bookId: string;
  bookTitle?: string;
  variantId?: string | null;
  changeType: string;
  quantityChange: number;
  balanceAfter: number;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: string | Date;
}

export default function AdminInventoryClient({
  initialLowStock,
  initialLogs,
  totalStock,
}: {
  initialLowStock: LowStockBook[];
  initialLogs: InventoryLogItem[];
  totalStock: number;
}) {
  const [lowStock, setLowStock] = useState<LowStockBook[]>(initialLowStock);
  const [logs, setLogs] = useState<InventoryLogItem[]>(initialLogs);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [qtyChange, setQtyChange] = useState('');
  const [changeType, setChangeType] = useState<'RESTOCK' | 'DAMAGE_WRITE_OFF' | 'MANUAL_ADJUSTMENT'>('RESTOCK');
  const [reason, setReason] = useState('নতুন প্রিন্ট সংস্করণ স্টক সংযোজন');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !qtyChange) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBookId,
          quantityChange: parseInt(qtyChange, 10),
          changeType,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'স্টক সমন্বয় ব্যর্থ হয়েছে।');
      }

      showFeedback(data.message || 'স্টক সফলভাবে সমন্বয় করা হয়েছে!');
      setIsModalOpen(false);
      setQtyChange('');

      // Refresh low stock
      const lowRes = await fetch('/api/admin/inventory/low-stock');
      const lowData = await lowRes.json();
      if (lowData.items) {
        setLowStock(lowData.items);
      }
    } catch (err: any) {
      showFeedback(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLogPages = Math.ceil(logs.length / pageSize);
  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <span className="text-xs text-stone-500 block">ক্যাটালগে সর্বমোট মুদ্রিত স্টক</span>
          <span className="font-bold text-2xl text-stone-900 dark:text-stone-100 font-mono mt-0.5 block">
            {toBengaliNumber(totalStock)} কপি
          </span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-sm flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4 text-shubban-gold" />
          <span>ম্যানুয়াল স্টক সমন্বয় ও রিস্টক (Adjust Stock)</span>
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>স্বল্প স্টক সতর্কতা (Low-Stock Alert: {toBengaliNumber(lowStock.length)}টি পণ্য)</span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              জরুরি ভিত্তিতে রি-অর্ডার বা রিস্টক করুন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-stone-400">{p.author?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap">
                    {toBengaliNumber(p.stockQuantity)} অবশিষ্ট
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBookId(p.id);
                      setChangeType('RESTOCK');
                      setQtyChange('20');
                      setReason(`স্বল্প স্টক দূরীকরণে রিস্টক`);
                      setIsModalOpen(true);
                    }}
                    className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-shubban-gold"
                    title="রিস্টক করুন"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Inventory Audit Logs */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <History className="w-4 h-4 text-shubban-gold" />
            <span>সাম্প্রতিক স্টক পরিবর্তনের অডিট লগ (Inventory Logs)</span>
          </h3>
          <span className="text-xs text-stone-400">সর্বশেষ {toBengaliNumber(logs.length)}টি রেকর্ড</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">পণ্য / বই</th>
                <th className="p-3.5">পরিবর্তন (Change)</th>
                <th className="p-3.5">ব্যালেন্স</th>
                <th className="p-3.5">ধরণ</th>
                <th className="p-3.5">কারণ ও রেফারেন্স</th>
                <th className="p-3.5 text-right">তারিখ ও সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                  <td className="p-3.5 font-bold font-serif text-stone-900 dark:text-stone-100">
                    {log.bookTitle || log.bookId.slice(-6)}
                  </td>
                  <td className="p-3.5 font-mono font-bold">
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        log.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {log.quantityChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                    {toBengaliNumber(log.balanceAfter)}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {log.changeType}
                    </span>
                  </td>
                  <td className="p-3.5 text-stone-600 dark:text-stone-300">
                    <p className="line-clamp-1">{log.reason || log.referenceId || 'সাধারণ স্টক পরিবর্তন'}</p>
                  </td>
                  <td className="p-3.5 text-right text-stone-400">
                    {formatBengaliDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalLogPages}
        totalItems={logs.length}
        itemsPerPage={pageSize}
        itemName="লগ"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 15, 25, 50]}
      />

      {/* Adjust Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-shubban-gold" />
                <span>ইনভেন্টরি স্টক সমন্বয় ফর্ম</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  বই আইডি (Book ID) *
                </label>
                <input
                  type="text"
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  placeholder="যেমন: cmvrc..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  পরিবর্তনের ধরণ (Change Type) *
                </label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                >
                  <option value="RESTOCK">নতুন স্টক সংযোজন (RESTOCK)</option>
                  <option value="MANUAL_ADJUSTMENT">ম্যানুয়াল গণনা সংশোধন (MANUAL_ADJUSTMENT)</option>
                  <option value="DAMAGE_WRITE_OFF">ক্ষতিগ্রস্ত পণ্য বাতিল (DAMAGE_WRITE_OFF)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  পরিমাণ (বৃদ্ধির জন্য ধনাত্মক, হ্রাসের জন্য ঋণাত্মক) *
                </label>
                <input
                  type="number"
                  required
                  value={qtyChange}
                  onChange={(e) => setQtyChange(e.target.value)}
                  placeholder="যেমন: 25 বা -5"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  সমন্বয়ের কারণ ও রেফারেন্স নোট *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'স্টক আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

