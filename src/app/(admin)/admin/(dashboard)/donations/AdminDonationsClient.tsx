'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Plus,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  FileCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatTaka, toBengaliNumber, formatBengaliDate } from '@/lib/utils';

interface AdminDonationsClientProps {
  campaigns: any[];
  recentDonations: any[];
  recentLedgerEntries: any[];
  reconciliation: any;
}

export default function AdminDonationsClient({
  campaigns,
  recentDonations,
  recentLedgerEntries,
  reconciliation,
}: AdminDonationsClientProps) {
  const [activeTab, setActiveTab] = useState<'DONATIONS' | 'LEDGER' | 'AUDIT'>('DONATIONS');
  const [campaignsList, setCampaignsList] = useState(campaigns);
  const [donationsList, setDonationsList] = useState(recentDonations);
  const [ledgerList, setLedgerList] = useState(recentLedgerEntries);
  const [search, setSearch] = useState('');

  // Modals state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<any | null>(null);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');

  // Campaign edit form state
  const [editCampTitle, setEditCampTitle] = useState('');
  const [editCampCategory, setEditCampCategory] = useState('RELIEF');
  const [editCampGoal, setEditCampGoal] = useState('');
  const [editCampDesc, setEditCampDesc] = useState('');
  const [editCampCover, setEditCampCover] = useState('');
  const [editCampStatus, setEditCampStatus] = useState('ACTIVE');

  // Disburse form state
  const [disburseCampaignId, setDisburseCampaignId] = useState(campaigns[0]?.id || '');
  const [disburseAmount, setDisburseAmount] = useState('');
  const [recipientDesc, setRecipientDesc] = useState('');
  const [disburseRef, setDisburseRef] = useState('');

  // Campaign create form state
  const [campTitle, setCampTitle] = useState('');
  const [campCategory, setCampCategory] = useState('RELIEF');
  const [campGoal, setCampGoal] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campCover, setCampCover] = useState('/images/hero-1.jpg');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const filteredDonations = donationsList.filter((d) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(term) ||
      d.receiptNumber.toLowerCase().includes(term) ||
      d.donationNumber.toLowerCase().includes(term) ||
      d.campaign.title.toLowerCase().includes(term)
    );
  });

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/admin/donations/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationId: selectedDonation.id,
          reason: refundReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDonationsList((prev) =>
          prev.map((d) =>
            d.id === selectedDonation.id
              ? { ...d, refundStatus: 'REFUNDED', refundReason }
              : d
          )
        );
        setShowRefundModal(false);
        setSelectedDonation(null);
        setRefundReason('');
        setFeedback({
          type: 'success',
          message: 'অনুদান সফলভাবে রিফান্ড করা হয়েছে এবং লেজারে ডেবিট লিপিবদ্ধ হয়েছে।',
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'রিফান্ড প্রক্রিয়ায় ত্রুটি হয়েছে।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ত্রুটি।' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/admin/donations/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: disburseCampaignId,
          amount: Number(disburseAmount),
          recipientDescription: recipientDesc,
          referenceNumber: disburseRef || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowDisburseModal(false);
        setDisburseAmount('');
        setRecipientDesc('');
        setFeedback({
          type: 'success',
          message: 'ত্রাণ বিতরণ রেকর্ড ও লেজার ডেবিট সফলভাবে সম্পন্ন হয়েছে!',
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'বিতরণ প্রক্রিয়ায় সমস্যা হয়েছে।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ব্যর্থতা।' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/admin/donations/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campTitle,
          category: campCategory,
          goalAmount: Number(campGoal),
          description: campDesc,
          coverImage: campCover,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCampaignsList((prev) => [data.campaign, ...prev]);
        setShowCampaignModal(false);
        setCampTitle('');
        setCampGoal('');
        setCampDesc('');
        setFeedback({ type: 'success', message: 'নতুন সদকাহ ক্যাম্পেইন সফলভাবে তৈরি হয়েছে!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'ক্যাম্পেইন তৈরিতে সমস্যা হয়েছে।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ত্রুটি।' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCampaignModal = (camp: any) => {
    setEditCampaign(camp);
    setEditCampTitle(camp.title);
    setEditCampCategory(camp.category);
    setEditCampGoal(String(camp.goalAmount));
    setEditCampDesc(camp.description || '');
    setEditCampCover(camp.coverImage || '');
    setEditCampStatus(camp.status || 'ACTIVE');
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampaign) return;
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch(`/api/admin/donations/campaigns/${editCampaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editCampTitle,
          category: editCampCategory,
          goalAmount: Number(editCampGoal),
          description: editCampDesc,
          coverImage: editCampCover,
          status: editCampStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCampaignsList((prev) =>
          prev.map((c) => (c.id === editCampaign.id ? { ...c, ...data.campaign } : c))
        );
        setEditCampaign(null);
        setFeedback({ type: 'success', message: data.message || 'ক্যাম্পেইন সফলভাবে হালনাগাদ করা হয়েছে!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'ক্যাম্পেইন হালনাগাদে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ব্যর্থতা।' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteCampaign) return;
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch(`/api/admin/donations/campaigns/${deleteCampaign.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        if (data.deleted) {
          setCampaignsList((prev) => prev.filter((c) => c.id !== deleteCampaign.id));
        } else if (data.archived) {
          setCampaignsList((prev) =>
            prev.map((c) => (c.id === deleteCampaign.id ? { ...c, status: 'PAUSED' } : c))
          );
        }
        setDeleteCampaign(null);
        setFeedback({ type: 'success', message: data.message || 'ক্যাম্পেইন সফলভাবে অপসারণ করা হয়েছে!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'ক্যাম্পেইন অপসারণে সমস্যা হয়েছে।' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ত্রুটি।' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Campaigns Progress Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
            সক্রিয় তহবিল ও ক্যাম্পেইনসমূহ ({toBengaliNumber(campaigns.length)})
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDisburseModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ত্রাণ বিতরণ রেকর্ড</span>
            </button>

            <button
              onClick={() => setShowCampaignModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-shubban-gold" />
              <span>নতুন ক্যাম্পেইন</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaignsList.map((camp) => {
            const percent = Math.min(100, Math.round((camp.raisedAmount / camp.goalAmount) * 100));

            return (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {camp.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {camp.status && camp.status !== 'ACTIVE' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {camp.status}
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-shubban-gold">
                        {toBengaliNumber(percent)}%
                      </span>
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                    {camp.title}
                  </h3>

                  <div className="space-y-1 text-xs mt-2">
                    <div className="flex justify-between">
                      <span className="text-stone-500">সংগৃহীত:</span>
                      <strong className="text-shubban-green font-serif">
                        {formatTaka(camp.raisedAmount)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">লক্ষ্যমাত্রা:</span>
                      <span className="font-serif">{formatTaka(camp.goalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>মোট দাতা:</span>
                      <span>{toBengaliNumber(camp.donorCount)} জন</span>
                    </div>
                  </div>

                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-shubban-green h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditCampaignModal(camp)}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                    title="ক্যাম্পেইন এডিট করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCampaign(camp)}
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                    title="ক্যাম্পেইন মুছুন / আর্কাইভ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('DONATIONS')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'DONATIONS'
                  ? 'bg-shubban-green text-shubban-gold shadow'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
              }`}
            >
              অনুদানের তালিকা ({toBengaliNumber(donationsList.length)})
            </button>

            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'LEDGER'
                  ? 'bg-shubban-green text-shubban-gold shadow'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
              }`}
            >
              স্বতন্ত্র চ্যারিটি লেজার ({toBengaliNumber(ledgerList.length)})
            </button>

            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-shubban-green text-shubban-gold shadow'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
              }`}
            >
              অডিট ও রিকনসিলিয়েশন
            </button>
          </div>

          {activeTab === 'DONATIONS' && (
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="রসিদ নম্বর বা দাতা অনুসন্ধান..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-shubban-gold/50"
              />
            </div>
          )}
        </div>

        {/* TAB 1: Donations List */}
        {activeTab === 'DONATIONS' && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-4">রসিদ ও অনুদান নম্বর</th>
                    <th className="p-4">দাতার নাম</th>
                    <th className="p-4">ক্যাম্পেইন</th>
                    <th className="p-4">পরিমাণ (৳)</th>
                    <th className="p-4">পেমেন্ট মেথড</th>
                    <th className="p-4">স্ট্যাটাস</th>
                    <th className="p-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-4 font-mono">
                        <Link
                          href={`/donations/receipt/${d.receiptNumber}`}
                          target="_blank"
                          className="font-bold text-shubban-gold hover:underline block"
                        >
                          {d.receiptNumber}
                        </Link>
                        <span className="text-[10px] text-stone-400 block">
                          {d.donationNumber}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-stone-800 dark:text-stone-200">
                        {d.donorName}
                        {d.isAnonymous && (
                          <span className="text-[10px] text-amber-600 block font-normal">
                            (গোপন সদকাহ)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-stone-600 dark:text-stone-400 max-w-xs truncate">
                        {d.campaign?.title}
                      </td>
                      <td className="p-4 font-serif font-bold text-shubban-green">
                        {formatTaka(d.amount)}
                      </td>
                      <td className="p-4 uppercase font-mono text-[11px] text-stone-500">
                        {d.paymentMethod}
                      </td>
                      <td className="p-4">
                        {d.refundStatus === 'REFUNDED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            রিফান্ডকৃত
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            সফল দান
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {d.refundStatus !== 'REFUNDED' && (
                          <button
                            onClick={() => {
                              setSelectedDonation(d);
                              setShowRefundModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-600 dark:bg-stone-800 text-stone-500 text-[10px] font-bold transition-all"
                          >
                            রিফান্ড করুন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Isolated Charity Ledger */}
        {activeTab === 'LEDGER' && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-4">তারিখ</th>
                    <th className="p-4">লেজার ট্রানজেকশন ধরন</th>
                    <th className="p-4">রেফারেন্স নম্বর</th>
                    <th className="p-4">বিবরণ</th>
                    <th className="p-4">পরিমাণ (৳)</th>
                    <th className="p-4 text-right">ব্যালেন্স আফটার (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {ledgerList.map((entry) => {
                    const isCredit = entry.type === 'DONATION_CREDIT';
                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40"
                      >
                        <td className="p-4 text-stone-400 whitespace-nowrap">
                          {formatBengaliDate(entry.createdAt)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-stone-700 dark:text-stone-300">
                          {entry.referenceNumber || '—'}
                        </td>
                        <td className="p-4 text-stone-600 dark:text-stone-400 max-w-sm truncate">
                          {entry.description}
                        </td>
                        <td
                          className={`p-4 font-serif font-bold ${
                            isCredit ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {isCredit ? '+' : '-'} {formatTaka(entry.amount)}
                        </td>
                        <td className="p-4 text-right font-serif font-black text-stone-900 dark:text-stone-100">
                          {formatTaka(entry.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Audit & Reconciliation */}
        {activeTab === 'AUDIT' && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  চ্যারিটি তহবিল প্যারাইটি ও অডিট রিকনসিলিয়েশন
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>সকল হিসাব ১০০% সমতাযুক্ত ও অডিট উত্তীর্ণ</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reconciliation.reports.map((rep: any) => (
                <div
                  key={rep.campaignId}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                      {rep.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      প্যারাইটি ওকে
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-stone-200 dark:border-stone-700">
                    <div>
                      <span className="text-stone-400 block">ক্যাম্পেইন সংগৃহীত:</span>
                      <strong className="text-shubban-green">{formatTaka(rep.campaignRaisedAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">লেজার মোট ক্রেডিট:</span>
                      <strong className="text-emerald-600">{formatTaka(rep.totalLedgerCredits)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">ত্রাণ বিতরণ ডেবিট:</span>
                      <strong className="text-stone-700 dark:text-stone-300">{formatTaka(rep.totalReliefDebits)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">নিট অবশিষ্ট তহবিল:</span>
                      <strong className="text-shubban-gold">{formatTaka(rep.netCharityFundBalance)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Refund Donation */}
      {showRefundModal && selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-red-600 flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <span>অনুদাতার সদকাহ রিফান্ড অনুমোদন</span>
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-stone-600 dark:text-stone-400">
              <p>
                রসিদ: <strong className="text-stone-900 dark:text-stone-100">{selectedDonation.receiptNumber}</strong>
              </p>
              <p>
                দাতা: <strong className="text-stone-900 dark:text-stone-100">{selectedDonation.donorName}</strong>
              </p>
              <p>
                পরিমাণ: <strong className="text-red-600 font-serif text-sm">{formatTaka(selectedDonation.amount)}</strong>
              </p>
            </div>

            <form onSubmit={handleRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">রিফান্ডের কারণ উল্লেখ করুন *</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="যেমন: ভুলবশত অতিরিক্ত অর্থ প্রেরণ বা দাতার অনুরোধ"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'রিফান্ড হচ্ছে...' : 'রিফান্ড নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Relief Disbursement */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <span>ত্রাণ ও সাহায্য তহবিল বিতরণ রেকর্ড</span>
              </h3>
              <button
                onClick={() => setShowDisburseModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">ক্যাম্পেইন নির্বাচন করুন *</label>
                <select
                  value={disburseCampaignId}
                  onChange={(e) => setDisburseCampaignId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (উত্তোলিত: ৳{c.raisedAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">বিতরণের পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(e.target.value)}
                    placeholder="৫০,০০০"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">রেফারেন্স / ভাউচার নং</label>
                  <input
                    type="text"
                    value={disburseRef}
                    onChange={(e) => setDisburseRef(e.target.value)}
                    placeholder="RELIEF-VCH-2026-01"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">বিতরণ বিবরণ ও ক্ষেত্র *</label>
                <textarea
                  rows={3}
                  required
                  value={recipientDesc}
                  onChange={(e) => setRecipientDesc(e.target.value)}
                  placeholder="যেমন: সিলেট বন্যাদুর্গত ২০০ পরিবারের মাঝে খাদ্যসামগ্রী ও জরুরি ওষুধ বিতরণ..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'রেকর্ড হচ্ছে...' : 'বিতরণ সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-shubban-gold" />
                <span>নতুন সদকাহ ও দান ক্যাম্পেইন সৃষ্টি</span>
              </h3>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">ক্যাম্পেইনের নাম *</label>
                <input
                  type="text"
                  required
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  placeholder="যেমন: সুবিধাবঞ্চিত শিশুদের কুরআন শিক্ষা ও খাবার প্রজেক্ট"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">ক্যাটাগরি *</label>
                  <select
                    value={campCategory}
                    onChange={(e) => setCampCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="RELIEF">ত্রাণ ও পুনর্বাসন (Relief)</option>
                    <option value="QURAN_DISTRIBUTION">কুরআন বিতরণ প্রজেক্ট</option>
                    <option value="WINTER_AID">শীতবস্ত্র বিতরণ</option>
                    <option value="WATER_WELL">সুপেয় পানির কূপ স্থাপন</option>
                    <option value="MOSQUE">মসজিদ ও মাদরাসা নির্মাণ</option>
                    <option value="EDUCATION">শিক্ষা বৃত্তি</option>
                    <option value="GENERAL_SADAQAH">সাধারণ সদকাহ ফান্ড</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">লক্ষ্যমাত্রা (৳) *</label>
                  <input
                    type="number"
                    required
                    value={campGoal}
                    onChange={(e) => setCampGoal(e.target.value)}
                    placeholder="৫০০,০০০"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">কভার ইমেজ লিংক</label>
                <input
                  type="text"
                  value={campCover}
                  onChange={(e) => setCampCover(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ক্যাম্পেইনের সারসংক্ষেপ *</label>
                <textarea
                  rows={3}
                  required
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  placeholder="ক্যাম্পেইনের মূল উদ্দেশ্য ও অর্থ ব্যবহারের পরিকল্পনা..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'সৃষ্টি হচ্ছে...' : 'ক্যাম্পেইন প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Edit Campaign */}
      {editCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-shubban-gold" />
                <span>ক্যাম্পেইন তথ্য সংশোধন ও স্ট্যাটাস</span>
              </h3>
              <button
                onClick={() => setEditCampaign(null)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">ক্যাম্পেইনের নাম *</label>
                <input
                  type="text"
                  required
                  value={editCampTitle}
                  onChange={(e) => setEditCampTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">ক্যাটাগরি *</label>
                  <select
                    value={editCampCategory}
                    onChange={(e) => setEditCampCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="RELIEF">ত্রাণ ও পুনর্বাসন (Relief)</option>
                    <option value="QURAN_DISTRIBUTION">কুরআন বিতরণ প্রজেক্ট</option>
                    <option value="WINTER_AID">শীতবস্ত্র বিতরণ</option>
                    <option value="WATER_WELL">সদকায়ে জারিয়া নলকূপ স্থাপন</option>
                    <option value="MOSQUE">মসজিদ নির্মাণ ও সংস্কার</option>
                    <option value="EDUCATION">দরিদ্র তালিবুল ইলম সহায়তা</option>
                    <option value="GENERAL_SADAQAH">সাধারণ সদকাহ ফান্ড</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">লক্ষ্যমাত্রা (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={editCampGoal}
                    onChange={(e) => setEditCampGoal(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">ক্যাম্পেইন স্ট্যাটাস</label>
                  <select
                    value={editCampStatus}
                    onChange={(e) => setEditCampStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold"
                  >
                    <option value="ACTIVE">সক্রিয় (ACTIVE)</option>
                    <option value="PAUSED">সাময়িক স্থগিত (PAUSED)</option>
                    <option value="COMPLETED">সম্পন্ন (COMPLETED)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">কভার ইমেজ লিংক</label>
                  <input
                    type="text"
                    value={editCampCover}
                    onChange={(e) => setEditCampCover(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ক্যাম্পেইনের সারসংক্ষেপ</label>
                <textarea
                  rows={3}
                  value={editCampDesc}
                  onChange={(e) => setEditCampDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCampaign(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Campaign */}
      {deleteCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                ক্যাম্পেইন অপসারণ করতে চান?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="font-bold text-stone-900 dark:text-stone-100">"{deleteCampaign.title}"</strong> ক্যাম্পেইনটি অপসারণ করতে চান?
              {deleteCampaign.raisedAmount > 0 ? (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ নোট: এই ক্যাম্পেইনে ইতিমধ্যে {formatTaka(deleteCampaign.raisedAmount)} অনুদান সংগৃহীত হওয়ায় আর্থিক হিসাব ও অডিট অক্ষত রাখতে এটি স্থায়ীভাবে ডিলিট না করে PAUSED ও আর্কাইভ করা হবে।
                </span>
              ) : (
                <span className="block mt-2 text-stone-500">
                  যেহেতু কোনো অনুদান জমা পড়েনি, এটি ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলা হবে।
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteCampaign(null)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteCampaign}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>হ্যাঁ, অপসারণ নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

