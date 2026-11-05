'use client';

import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  X,
  Calendar,
  Percent,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate, formatTaka } from '@/lib/utils';

export interface CouponItem {
  id: string;
  code: string;
  discountPct: number | null;
  discountAmt: number | null;
  minAmount: number | null;
  maxUsage: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AdminCouponsManagerProps {
  initialCoupons: CouponItem[];
  initialTotal: number;
}

export default function AdminCouponsManager({
  initialCoupons,
  initialTotal,
}: AdminCouponsManagerProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<CouponItem | null>(null);
  const [deleteCoupon, setDeleteCoupon] = useState<CouponItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Add / Edit
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'pct' | 'amt'>('pct');
  const [formDiscountPct, setFormDiscountPct] = useState('');
  const [formDiscountAmt, setFormDiscountAmt] = useState('');
  const [formMinAmount, setFormMinAmount] = useState('');
  const [formMaxUsage, setFormMaxUsage] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const resetForm = () => {
    setFormCode('');
    setFormDiscountType('pct');
    setFormDiscountPct('');
    setFormDiscountAmt('');
    setFormMinAmount('');
    setFormMaxUsage('');
    setFormExpiresAt('');
    setFormIsActive(true);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (c: CouponItem) => {
    setEditCoupon(c);
    setFormCode(c.code);
    if (c.discountPct) {
      setFormDiscountType('pct');
      setFormDiscountPct(String(c.discountPct));
      setFormDiscountAmt('');
    } else {
      setFormDiscountType('amt');
      setFormDiscountAmt(String(c.discountAmt || ''));
      setFormDiscountPct('');
    }
    setFormMinAmount(c.minAmount ? String(c.minAmount) : '');
    setFormMaxUsage(c.maxUsage ? String(c.maxUsage) : '');
    setFormExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 10) : '');
    setFormIsActive(c.isActive);
  };

  const handleToggleStatus = async (c: CouponItem) => {
    try {
      const newStatus = !c.isActive;
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCoupons((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, isActive: newStatus } : item))
        );
        setFeedback({
          type: 'success',
          message: `কুপন "${c.code}" ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে!`,
        });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload: any = {
        code: formCode,
        discountPct: formDiscountType === 'pct' ? formDiscountPct : '',
        discountAmt: formDiscountType === 'amt' ? formDiscountAmt : '',
        minAmount: formMinAmount,
        maxUsage: formMaxUsage,
        expiresAt: formExpiresAt || null,
        isActive: formIsActive,
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCoupons((prev) => [data.coupon, ...prev]);
        setIsAddOpen(false);
        resetForm();
        setFeedback({ type: 'success', message: data.message || 'কুপন সফলভাবে যোগ করা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'কুপন তৈরিতে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCoupon) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload: any = {
        code: formCode,
        discountPct: formDiscountType === 'pct' ? formDiscountPct : '',
        discountAmt: formDiscountType === 'amt' ? formDiscountAmt : '',
        minAmount: formMinAmount,
        maxUsage: formMaxUsage,
        expiresAt: formExpiresAt || null,
        isActive: formIsActive,
      };

      const res = await fetch(`/api/admin/coupons/${editCoupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === editCoupon.id ? data.coupon : c))
        );
        setEditCoupon(null);
        resetForm();
        setFeedback({ type: 'success', message: data.message || 'কুপন সফলভাবে হালনাগাদ করা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'কুপন হালনাগাদ ব্যর্থ হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteCoupon) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/coupons/${deleteCoupon.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== deleteCoupon.id));
        setDeleteCoupon(null);
        setFeedback({ type: 'success', message: data.message || 'কুপন মুছে ফেলা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: data.error || 'কুপন মুছতে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? c.isActive
        : !c.isActive;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-bengali">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-shubban-gold" />
            <span>কুপন ও প্রমোশনাল ডিসকাউন্ট কোড (Coupons)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট <strong className="text-shubban-green dark:text-shubban-gold font-mono">{toBengaliNumber(coupons.length)}</strong>টি প্রমোশনাল ডিসকাউন্ট কুপন সংরক্ষিত রয়েছে।
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-2xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold text-xs shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন কুপন যোগ করুন</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-shubban-darkCard p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="কুপন কোড দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white dark:bg-shubban-green dark:text-shubban-gold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            সকল ({toBengaliNumber(coupons.length)})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            সক্রিয় ({toBengaliNumber(coupons.filter((c) => c.isActive).length)})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-rose-600 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            নিষ্ক্রিয় ({toBengaliNumber(coupons.filter((c) => !c.isActive).length)})
          </button>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.length === 0 ? (
          <div className="col-span-full p-12 text-center text-stone-400 bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800">
            কোন কুপন পাওয়া যায়নি।
          </div>
        ) : (
          filteredCoupons.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 hover:border-shubban-gold/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-base text-shubban-green dark:text-shubban-gold bg-shubban-green/10 dark:bg-shubban-gold/10 px-3 py-1 rounded-xl border border-shubban-green/30 dark:border-shubban-gold/30 tracking-wider">
                    {c.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      c.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40 hover:bg-emerald-200'
                        : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-300'
                    }`}
                  >
                    {c.isActive ? '● সক্রিয়' : '○ নিষ্ক্রিয়'}
                  </button>
                </div>

                <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 dark:border-stone-800/80">
                    <span className="text-stone-400">ছাড়ে পরিমাণ:</span>
                    <strong className="text-stone-900 dark:text-stone-100 font-bold text-sm">
                      {c.discountPct ? `${toBengaliNumber(c.discountPct)}% ছাড়` : formatTaka(c.discountAmt || 0)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">সর্বনিম্ন ক্রয়:</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {c.minAmount ? formatTaka(c.minAmount) : 'প্রযোজ্য নয়'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">ব্যবহার সংখ্যা:</span>
                    <span>
                      {toBengaliNumber(c.usedCount)} বার{' '}
                      {c.maxUsage ? `/ সর্বোচ্চ ${toBengaliNumber(c.maxUsage)}` : ''}
                    </span>
                  </div>

                  {c.expiresAt && (
                    <div className="flex items-center justify-between text-stone-400 text-[11px]">
                      <span>মেয়াদ শেষ:</span>
                      <span className="font-mono">{formatBengaliDate(c.expiresAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(c)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>সংশোধন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteCoupon(c)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছুন</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Create Coupon Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন প্রমোশনাল কুপন তৈরি
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  কুপন কোড (ইংরেজি বড়হাতের অক্ষর)*
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="যেমন: EID2026, SHUBBAN15"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  ডিসকাউন্টের ধরন*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('pct')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-colors ${
                      formDiscountType === 'pct'
                        ? 'bg-shubban-green text-shubban-gold border-shubban-green'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    শতাংশ ছাড় (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('amt')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-colors ${
                      formDiscountType === 'amt'
                        ? 'bg-shubban-green text-shubban-gold border-shubban-green'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    ফিক্সড ছাড় (৳ টাকা)
                  </button>
                </div>
              </div>

              {formDiscountType === 'pct' ? (
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ডিসকাউন্ট শতকরা (%)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    required
                    value={formDiscountPct}
                    onChange={(e) => setFormDiscountPct(e.target.value)}
                    placeholder="যেমন: 10 বা 15"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ডিসকাউন্ট নির্দিষ্ট টাকা (৳)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formDiscountAmt}
                    onChange={(e) => setFormDiscountAmt(e.target.value)}
                    placeholder="যেমন: 50 বা 100"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সর্বনিম্ন অর্ডার মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={formMinAmount}
                    onChange={(e) => setFormMinAmount(e.target.value)}
                    placeholder="ঐচ্ছিক (যেমন: 500)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সর্বোচ্চ মোট ব্যবহার সীমা
                  </label>
                  <input
                    type="number"
                    value={formMaxUsage}
                    onChange={(e) => setFormMaxUsage(e.target.value)}
                    placeholder="ঐচ্ছিক (যেমন: 100)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    মেয়াদ উত্তীর্ণের তারিখ
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="accent-shubban-green"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      কুপন সক্রিয় রাখুন
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>কুপন যোগ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {editCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  কুপন তথ্য সংশোধন — {editCoupon.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditCoupon(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  কুপন কোড (ইংরেজি বড়হাতের অক্ষর)*
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  ডিসকাউন্টের ধরন*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('pct')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-colors ${
                      formDiscountType === 'pct'
                        ? 'bg-shubban-green text-shubban-gold border-shubban-green'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    শতাংশ ছাড় (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('amt')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-colors ${
                      formDiscountType === 'amt'
                        ? 'bg-shubban-green text-shubban-gold border-shubban-green'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    ফিক্সড ছাড় (৳ টাকা)
                  </button>
                </div>
              </div>

              {formDiscountType === 'pct' ? (
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ডিসকাউন্ট শতকরা (%)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    required
                    value={formDiscountPct}
                    onChange={(e) => setFormDiscountPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ডিসকাউন্ট নির্দিষ্ট টাকা (৳)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formDiscountAmt}
                    onChange={(e) => setFormDiscountAmt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সর্বনিম্ন অর্ডার মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={formMinAmount}
                    onChange={(e) => setFormMinAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    সর্বোচ্চ মোট ব্যবহার সীমা
                  </label>
                  <input
                    type="number"
                    value={formMaxUsage}
                    onChange={(e) => setFormMaxUsage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    মেয়াদ উত্তীর্ণের তারিখ
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="accent-shubban-green"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      কুপন সক্রিয় রাখুন
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditCoupon(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>হালনাগাদ সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                কুপন মুছে ফেলতে চান?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে কুপন <strong className="font-mono text-rose-600 font-bold">{deleteCoupon.code}</strong> স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলতে চান?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteCoupon(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteCoupon}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>হ্যাঁ, কুপন মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

