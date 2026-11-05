'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  CreditCard,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface SubItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  durationMonths: number;
  magazineTitle: string;
  magazineColor: string;
  status: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentMethod: string | null;
  transactionId: string | null;
  autoRenew: boolean;
  createdAt: string;
}

interface Props {
  initialSubscriptions: SubItem[];
  magazines: { id: string; title: string }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'সক্রিয় (Active)', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  EXPIRED: { label: 'মেয়াদোত্তীর্ণ (Expired)', color: 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300' },
  CANCELLED: { label: 'বাতিল (Cancelled)', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  PENDING_PAYMENT: { label: 'পেমেন্ট অপেক্ষমাণ', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  GRACE_PERIOD: { label: 'গ্রেস পিরিয়ড', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
};

export default function CentralSubscriptionsClient({ initialSubscriptions, magazines }: Props) {
  const [subscriptions, setSubscriptions] = useState<SubItem[]>(initialSubscriptions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMagazine, setFilterMagazine] = useState('');

  const [savingId, setSavingId] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubItem | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchSearch =
        !searchTerm ||
        sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.transactionId && sub.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = !filterStatus || sub.status === filterStatus;
      const matchMag = !filterMagazine || sub.magazineTitle.includes(filterMagazine);

      return matchSearch && matchStatus && matchMag;
    });
  }, [subscriptions, searchTerm, filterStatus, filterMagazine]);

  const totalActive = useMemo(
    () => subscriptions.filter((s) => s.status === 'ACTIVE').length,
    [subscriptions]
  );
  const totalRevenue = useMemo(
    () => subscriptions.reduce((sum, s) => sum + s.amountPaid, 0),
    [subscriptions]
  );
  const totalExpired = useMemo(
    () => subscriptions.filter((s) => s.status === 'EXPIRED').length,
    [subscriptions]
  );

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setSavingId(id);
      const res = await fetch('/api/publishing/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'হালনাগাদ ব্যর্থ হয়েছে');

      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmExtend = async () => {
    if (!selectedSub) return;
    try {
      setSavingId(selectedSub.id);
      const res = await fetch('/api/publishing/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSub.id, extendMonths, status: 'ACTIVE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'মেয়াদ বৃদ্ধি ব্যর্থ হয়েছে');

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === selectedSub.id
            ? { ...s, status: 'ACTIVE', endDate: data.subscription.endDate }
            : s
        )
      );
      setShowExtendModal(false);
      setSelectedSub(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

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
            <span className="text-stone-800 dark:text-stone-200 font-medium">সাবস্ক্রিপশন ও রেভিনিউ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <DollarSign className="w-5 h-5" />
            </div>
            সেন্ট্রাল প্রকাশনা সাবস্ক্রিপশন ও রেভিনিউ
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            সকল সাময়িকী ও জার্নালের কেন্দ্রীয় পাঠক সাবস্ক্রিপশন, মেয়াদ ও পেমেন্ট মনিটরিং
          </p>
        </div>

        <Link
          href="/admin/publishing"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition self-start"
        >
          কন্ট্রোল সেন্টারে ফিরে যান
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">মোট সাবস্ক্রাইবার</span>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{subscriptions.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">গ্রাহক হিস্ট্রি</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">সক্রিয় সাবস্ক্রিপশন</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalActive}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">বর্তমান সক্রিয় পাঠক</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">মোট সংগৃহীত আয়</span>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">৳{totalRevenue}</p>
          <span className="text-[10px] text-amber-600 font-semibold">সাবস্ক্রিপশন ফান্ড</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">মেয়াদোত্তীর্ণ</span>
          <p className="text-2xl font-bold text-stone-400">{totalExpired}</p>
          <span className="text-[10px] text-stone-400 font-medium">রিনিউয়াল অপেক্ষমাণ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="গ্রাহকের নাম, ইমেইল বা ট্রানজেকশন আইডি দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterMagazine}
            onChange={(e) => setFilterMagazine(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল সাময়িকী</option>
            {magazines.map((m) => (
              <option key={m.id} value={m.title}>
                {m.title}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল স্ট্যাটাস</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-semibold">
                <th className="py-3.5 px-4">গ্রাহক ও একাউন্ট</th>
                <th className="py-3.5 px-4">সাময়িকী ও প্ল্যান</th>
                <th className="py-3.5 px-4">মেয়াদ ও তারিখ</th>
                <th className="py-3.5 px-4 text-center">মূল্য ও পেমেন্ট</th>
                <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">ম্যানেজমেন্ট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    কোনো সাবস্ক্রিপশন রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const statusInfo = STATUS_LABELS[sub.status] || {
                    label: sub.status,
                    color: 'bg-stone-100 text-stone-600',
                  };

                  return (
                    <tr key={sub.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                      <td className="py-4 px-4">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          {sub.userName}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          {sub.userEmail}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sub.magazineColor }}
                          />
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {sub.magazineTitle}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {sub.planName} ({sub.durationMonths} মাস)
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-medium text-stone-700 dark:text-stone-300 block">
                          {new Date(sub.startDate).toLocaleDateString('bn-BD')} —{' '}
                          {new Date(sub.endDate).toLocaleDateString('bn-BD')}
                        </span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          অটোরিনিউ: {sub.autoRenew ? 'হ্যাঁ' : 'না'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          ৳{sub.amountPaid}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          {sub.paymentMethod || 'MANUAL'}{' '}
                          {sub.transactionId ? `• ${sub.transactionId}` : ''}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSub(sub);
                              setExtendMonths(1);
                              setShowExtendModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-300 transition"
                          >
                            মেয়াদ বৃদ্ধি
                          </button>

                          {sub.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'CANCELLED')}
                              disabled={savingId === sub.id}
                              className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold transition"
                            >
                              বাতিল
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'ACTIVE')}
                              disabled={savingId === sub.id}
                              className="px-2 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[11px] font-semibold transition"
                            >
                              সক্রিয়
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend Modal */}
      {showExtendModal && selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
              সাবস্ক্রিপশনের মেয়াদ বৃদ্ধি করুন
            </h3>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              গ্রাহক <strong>{selectedSub.userName}</strong> ({selectedSub.userEmail})-এর জন্য{' '}
              <strong>&quot;{selectedSub.magazineTitle}&quot;</strong> সাময়িকীর সাবস্ক্রিপশন মেয়াদ বাড়ান।
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                কত মাস বাড়াতে চান?
              </label>
              <select
                value={extendMonths}
                onChange={(e) => setExtendMonths(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              >
                <option value={1}>১ মাস</option>
                <option value={3}>৩ মাস (ত্রৈমাসিক)</option>
                <option value={6}>৬ মাস (ষাণ্মাসিক)</option>
                <option value={12}>১২ মাস (১ বছর)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExtendModal(false);
                  setSelectedSub(null);
                }}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 text-xs font-semibold"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleConfirmExtend}
                disabled={savingId === selectedSub.id}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                {savingId === selectedSub.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                মেয়াদ নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

