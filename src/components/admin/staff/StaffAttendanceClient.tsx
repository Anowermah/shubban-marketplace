'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Calendar,
  User,
  Filter,
  X,
  AlertCircle,
  FileCheck2,
  XCircle,
  Briefcase,
  LogIn,
  LogOut,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export default function StaffAttendanceClient() {
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'LEAVE'>('ATTENDANCE');
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [leaveStatus, setLeaveStatus] = useState('ALL');

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'CASUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'ATTENDANCE') {
        const res = await fetch(`/api/admin/staff/attendance?date=${dateFilter}`);
        const data = await res.json();
        if (data.success) setAttendances(data.data);
      } else {
        const res = await fetch(`/api/admin/staff/leave?status=${leaveStatus}`);
        const data = await res.json();
        if (data.success) setLeaves(data.data);
      }
    } catch (err) {
      console.error('Fetch attendance/leave error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, dateFilter, leaveStatus]);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/staff/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'ছুটির আবেদন সফলভাবে দাখিল করা হয়েছে!' });
        setShowLeaveModal(false);
        fetchData();
        setLeaveForm({
          leaveType: 'CASUAL',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          reason: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'আবেদন জমাদানে ত্রুটি।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveDecision = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/leave/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'ত্রুটি হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold border border-shubban-green/20">
              হাজিরা ও ছুটি
            </span>
            <span className="text-xs text-stone-500">দৈনিক ট্র্যাকিং</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-shubban-gold" />
            <span>উপস্থিতি ও ছুটির ব্যবস্থাপনা (Attendance & Leave)</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Clock-in / Clock-out */}
          <button
            onClick={handleClockIn}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-semibold shadow-sm transition"
          >
            <Clock className="w-4 h-4 text-shubban-gold" />
            <span>চেক-ইন / চেক-আউট</span>
          </button>

          <button
            onClick={() => setShowLeaveModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4 text-stone-500" />
            <span>ছুটির আবেদন</span>
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            message.type === 'success'
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'ATTENDANCE'
              ? 'bg-shubban-green text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>দৈনিক হাজিরা খাতা</span>
        </button>

        <button
          onClick={() => setActiveTab('LEAVE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'LEAVE'
              ? 'bg-shubban-green text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>ছুটির আবেদন ও রেকর্ড</span>
        </button>
      </div>

      {/* Tab 1: ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">তারিখ নির্বাচন:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>

            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 hover:bg-stone-50"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-stone-500">
                <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold mx-auto mb-2" />
                <span>হাজিরা লোড হচ্ছে...</span>
              </div>
            ) : attendances.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-500">
                এই তারিখে কোনো উপস্থিতির তথ্য নথিভুক্ত হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-stone-500 font-semibold">
                      <th className="py-3 px-4">আইডি ও কর্মকর্তা</th>
                      <th className="py-3 px-4">বিভাগ ও পদবি</th>
                      <th className="py-3 px-4">চেক-ইন সময়</th>
                      <th className="py-3 px-4">চেক-আউট সময়</th>
                      <th className="py-3 px-4">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {attendances.map((rec) => (
                      <tr key={rec.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900 dark:text-stone-100">
                            {rec.staffProfile?.user?.name}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {rec.staffProfile?.employeeId}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-stone-700 dark:text-stone-300">
                            {rec.staffProfile?.department?.name || 'সাধারণ'}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {rec.staffProfile?.designation?.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600">
                          {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('bn-BD') : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-500">
                          {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString('bn-BD') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : rec.status === 'LATE'
                                ? 'bg-amber-50 text-amber-700 border border-amber-300'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {rec.status === 'PRESENT' ? 'উপস্থিত' : rec.status === 'LATE' ? 'দেরি' : rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: LEAVE */}
      {activeTab === 'LEAVE' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">স্ট্যাটাস:</span>
              <select
                value={leaveStatus}
                onChange={(e) => setLeaveStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              >
                <option value="ALL">সকল আবেদন</option>
                <option value="PENDING">অপেক্ষমান (Pending)</option>
                <option value="APPROVED">অনুমোদিত (Approved)</option>
                <option value="REJECTED">প্রত্যাখ্যাত (Rejected)</option>
              </select>
            </div>

            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-semibold"
            >
              ছুটির আবেদন দাখিল
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-xs text-stone-500 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold mx-auto mb-2" />
                <span>ছুটির আবেদন লোড হচ্ছে...</span>
              </div>
            ) : leaves.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-500 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                বর্তমানে কোনো ছুটির আবেদন নেই।
              </div>
            ) : (
              leaves.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                          {l.staffProfile?.user?.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800">
                          {l.staffProfile?.employeeId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {l.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : l.leaveType === 'SICK' ? 'অসুস্থতাজনিত' : l.leaveType}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">কারণ: {l.reason}</p>
                    </div>

                    <span
                      className={`self-start px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {l.status === 'APPROVED' ? 'অনুমোদিত' : l.status === 'REJECTED' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমান'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                    <div>
                      মেয়াদ: {formatBengaliDate(l.startDate)} হতে {formatBengaliDate(l.endDate)} (মোট {toBengaliNumber(l.daysCount)} দিন)
                    </div>

                    {l.status === 'PENDING' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLeaveDecision(l.id, 'APPROVED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
                        >
                          অনুমোদন
                        </button>
                        <button
                          onClick={() => handleLeaveDecision(l.id, 'REJECTED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs"
                        >
                          প্রত্যাখ্যান
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  ছুটির আবেদন দাখিল করুন
                </h3>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ছুটির ধরন *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  <option value="CASUAL">নৈমিত্তিক ছুটি (Casual Leave)</option>
                  <option value="SICK">অসুস্থতাজনিত ছুটি (Sick Leave)</option>
                  <option value="ANNUAL">বার্ষিক অর্জিত ছুটি (Annual Leave)</option>
                  <option value="MATERNITY">মাতৃত্বকালীন ছুটি (Maternity Leave)</option>
                  <option value="UNPAID">বিনা বেতনে ছুটি (Unpaid Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">শেষ তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ছুটির কারণ ও যৌক্তিকতা *</label>
                <textarea
                  rows={3}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="ছুটির সুনির্দিষ্ট কারণ উল্লেখ করুন..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'দাখিল হচ্ছে...' : 'আবেদন জমা দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

