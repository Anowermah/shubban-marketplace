'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Filter,
  X,
  AlertCircle,
  MessageSquare,
  FileText,
  DollarSign,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export default function StaffApprovalsClient() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeApproval, setActiveApproval] = useState<any>(null);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [formData, setFormData] = useState({
    title: '',
    type: 'GENERAL',
    details: '',
  });

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: selectedStatus,
        type: selectedType,
      });

      const res = await fetch(`/api/admin/staff/approvals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Fetch approvals error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [page, selectedStatus, selectedType]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/staff/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'অনুরোধ অনুমোদনের জন্য সফলভাবে প্রেরণ করা হয়েছে!' });
        setShowCreateModal(false);
        fetchApprovals();
        setFormData({ title: '', type: 'GENERAL', details: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks: decisionRemarks }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setDecisionRemarks('');
        setActiveApproval(null);
        fetchApprovals();
      } else {
        setMessage({ type: 'error', text: data.error || 'সিদ্ধান্ত গ্রহণে ত্রুটি হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CONTENT_PUBLISH':
        return { label: 'কনটেন্ট প্রকাশনা', bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'EXPENSE':
        return { label: 'ব্যয় / অর্থছাড়', bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'LEAVE':
        return { label: 'ছুটির আবেদন', bg: 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'PRODUCT_APPROVAL':
        return { label: 'পণ্য অনুমোদন', bg: 'bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      default:
        return { label: 'সাধারণ অনুমোদন', bg: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' };
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold border border-shubban-green/20">
              ওয়ার্কফ্লো কিউ
            </span>
            <span className="text-xs text-stone-500">মোট {toBengaliNumber(totalCount)} টি অনুরোধ</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-shubban-gold" />
            <span>প্রশাসনিক অনুমোদন ও ওয়ার্কফ্লো (Approval Queue)</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApprovals}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-shubban-gold' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-shubban-gold" />
            <span>নতুন অনুমোদন অনুরোধ</span>
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
            }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { label: 'সকল', value: 'ALL' },
            { label: 'অপেক্ষমান (Pending)', value: 'PENDING' },
            { label: 'অনুমোদিত (Approved)', value: 'APPROVED' },
            { label: 'প্রত্যাখ্যাত (Rejected)', value: 'REJECTED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${selectedStatus === tab.value
                  ? 'bg-shubban-green text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-full md:w-auto"
        >
          <option value="ALL">সকল বিষয়</option>
          <option value="CONTENT_PUBLISH">কনটেন্ট প্রকাশনা</option>
          <option value="EXPENSE">ব্যয় ও অর্থছাড়</option>
          <option value="LEAVE">ছুটি</option>
          <option value="PRODUCT_APPROVAL">পণ্য অনুমোদন</option>
          <option value="GENERAL">সাধারণ অনুরোধ</option>
        </select>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold mx-auto mb-2" />
            <span>অনুমোদন কিউ লোড হচ্ছে...</span>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            বর্তমানে এই বিভাগে কোনো অনুরোধ নেই।
          </div>
        ) : (
          approvals.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                        {item.title}
                      </h3>
                    </div>

                    {item.details && (
                      <p className="text-xs text-stone-500 whitespace-pre-wrap leading-relaxed max-w-2xl">
                        {item.details}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${item.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : item.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                        }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>
                        {item.status === 'APPROVED' ? 'অনুমোদিত' : item.status === 'REJECTED' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমান'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Requester & Reviewer metadata */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-[11px] text-stone-500 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span>অনুরোধকারী: {item.requestedBy?.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>তারিখ: {formatBengaliDate(item.createdAt)}</span>
                    </div>

                    {item.reviewer && (
                      <span className="text-stone-400">
                        পর্যালোচক: {item.reviewer.name}
                      </span>
                    )}
                  </div>

                  {/* Approve / Reject buttons if PENDING */}
                  {item.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision(item.id, 'APPROVED')}
                        disabled={actionLoading}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>অনুমোদন</span>
                      </button>

                      <button
                        onClick={() => handleDecision(item.id, 'REJECTED')}
                        disabled={actionLoading}
                        className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>বাতিল</span>
                      </button>
                    </div>
                  )}
                </div>

                {item.remarks && (
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 text-[11px] text-stone-600 dark:text-stone-300">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">পর্যালোচনা নোট: </span>
                    <span>{item.remarks}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE APPROVAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন অনুমোদন অনুরোধ পাঠান
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">অনুরোধের বিষয় / শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="উদাঃ মার্চ ২০২৬ ম্যাগাজিনের প্রচ্ছদ অনুমোদন"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">অনুরোধের ধরন (Type) *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  <option value="CONTENT_PUBLISH">কনটেন্ট প্রকাশনা অনুমোদন</option>
                  <option value="EXPENSE">ব্যয় ও বাজেট অনুমোদন</option>
                  <option value="LEAVE">ছুটি আবেদন</option>
                  <option value="PRODUCT_APPROVAL">পণ্য / ক্যাটালগ অনুমোদন</option>
                  <option value="GENERAL">সাধারণ প্রশাসনিক অনুমোদন</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিস্তারিত বিবরণ ও যৌক্তিকতা</label>
                <textarea
                  rows={4}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="অনুরোধের কারণ ও প্রয়োজনীয় বিস্তারিত তথ্য..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'প্রেরণ হচ্ছে...' : 'অনুরোধ পাঠান'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

