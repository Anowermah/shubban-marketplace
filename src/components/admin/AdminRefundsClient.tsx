'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { formatBengaliDate, formatTaka, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface AdminRefundItem {
  id: string;
  orderId: string;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    orderStatus: string;
    shippingName: string;
    shippingPhone: string;
  };
  amount: number;
  reason: string;
  status: string;
  refundTxnId: string;
  adminNote?: string | null;
  processedAt?: string | Date | null;
  createdAt: string | Date;
}

export default function AdminRefundsClient({
  initialRefunds,
}: {
  initialRefunds: AdminRefundItem[];
}) {
  const [refunds, setRefunds] = useState<AdminRefundItem[]>(initialRefunds);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formOrderId, setFormOrderId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formReason, setFormReason] = useState('অর্ডার বাতিল বা কাস্টমার ক্যাশব্যাক');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ message: string; isError?: boolean } | null>(null);

  const showBanner = (message: string, isError = false) => {
    setBanner({ message, isError });
    setTimeout(() => setBanner(null), 4000);
  };

  const filtered = refunds.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.order.orderNumber.toLowerCase().includes(q) ||
      (r.refundTxnId && r.refundTxnId.toLowerCase().includes(q)) ||
      r.reason.toLowerCase().includes(q) ||
      r.order.shippingName.toLowerCase().includes(q) ||
      r.order.shippingPhone.includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedRefunds = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrderId.trim()) {
      showBanner('অর্ডার আইডি দিন', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: formOrderId.trim(),
          amount: formAmount ? parseFloat(formAmount) : undefined,
          reason: formReason.trim(),
          status: 'PROCESSED',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'রিফান্ড প্রক্রিয়াকরণে সমস্যা হয়েছে।');
      }

      showBanner(data.message || 'রিফান্ড সফলভাবে তৈরি হয়েছে!');
      setIsModalOpen(false);
      setFormOrderId('');
      setFormAmount('');

      // Refresh list
      const listRes = await fetch('/api/admin/refunds');
      const listData = await listRes.json();
      if (listData.refunds) {
        setRefunds(listData.refunds);
      }
    } catch (err: any) {
      showBanner(err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRefundedSum = refunds
    .filter((r) => r.status === 'PROCESSED')
    .reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            banner.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}
        >
          {banner.isError ? <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          <span>{banner.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs text-stone-500 block">মোট রিফান্ড পরিমাণ</span>
          <span className="font-bold text-xl text-rose-600 font-mono mt-1 block">
            {formatTaka(totalRefundedSum)}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs text-stone-500 block">মোট রিফান্ড কেস</span>
          <span className="font-bold text-xl text-stone-900 dark:text-stone-100 font-mono mt-1 block">
            {toBengaliNumber(refunds.length)} টি
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block">ক্যাশব্যাক স্ট্যাটাস</span>
            <span className="font-bold text-sm text-emerald-600 mt-1 block flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> শতভাগ নিষ্পন্ন
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-shubban-gold" />
            <span>নতুন রিফান্ড ইস্যু</span>
          </button>
        </div>
      </div>

      {/* Table & Filter */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="অর্ডার নম্বর, ট্রানজেকশন বা কারণ খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>
          <span className="text-xs text-stone-400">{toBengaliNumber(filtered.length)}টি রিফান্ড</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-400">
            কোনো রিফান্ড রেকর্ড মেলেনি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">রিফান্ড রেফারেন্স</th>
                  <th className="p-4">অর্ডার নম্বর ও গ্রাহক</th>
                  <th className="p-4">পরিমাণ (টাকা)</th>
                  <th className="p-4">কারণ</th>
                  <th className="p-4">স্ট্যাটাস</th>
                  <th className="p-4 text-right">তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {paginatedRefunds.map((rf) => (
                  <tr key={rf.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                      {rf.refundTxnId || rf.id.slice(-8)}
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100 block">
                        #{rf.order.orderNumber}
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        {rf.order.shippingName} ({rf.order.shippingPhone})
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-600">
                      {formatTaka(rf.amount)}
                    </td>
                    <td className="p-4 max-w-xs text-stone-700 dark:text-stone-300">
                      <p className="line-clamp-2">{rf.reason}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {rf.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-stone-400">
                      {formatBengaliDate(rf.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={pageSize}
        itemName="রিফান্ড"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
      />

      {/* New Refund Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-shubban-gold" />
                <span>নতুন রিফান্ড ইস্যু করুন</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  অর্ডারের ডাটাবেজ আইডি (বা Order ID) *
                </label>
                <input
                  type="text"
                  required
                  value={formOrderId}
                  onChange={(e) => setFormOrderId(e.target.value)}
                  placeholder="যেমন: cmvrc... বা Order ID"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  রিফান্ড পরিমাণ (টাকা) [খালি রাখলে পুরো অর্ডার রিফান্ড হবে]
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="যেমন: 500"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  রিফান্ডের কারণ *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
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
                  className="px-4 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {isSubmitting ? 'প্রক্রিয়াধীন...' : 'রিফান্ড অনুমোদন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

