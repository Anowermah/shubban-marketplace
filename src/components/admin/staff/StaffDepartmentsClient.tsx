'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Award,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Briefcase,
  Layers,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function StaffDepartmentsClient() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDesModal, setShowDesModal] = useState(false);
  const [selectedDeptForDes, setSelectedDeptForDes] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Department Form
  const [deptForm, setDeptForm] = useState({
    name: '',
    nameEn: '',
    code: '',
    slug: '',
    description: '',
    status: 'ACTIVE',
  });

  // Designation Form
  const [desForm, setDesForm] = useState({
    name: '',
    nameEn: '',
    departmentId: '',
    level: 1,
    description: '',
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
        if (data.data.length > 0 && !expandedDeptId) {
          setExpandedDeptId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch departments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/staff/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'নতুন ডিপার্টমেন্ট সফলভাবে যুক্ত হয়েছে!' });
        setShowDeptModal(false);
        fetchDepartments();
        setDeptForm({ name: '', nameEn: '', code: '', slug: '', description: '', status: 'ACTIVE' });
      } else {
        setMessage({ type: 'error', text: data.error || 'ডিপার্টমেন্ট তৈরিতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/staff/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desForm),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'নতুন পদবি সফলভাবে যুক্ত হয়েছে!' });
        setShowDesModal(false);
        fetchDepartments();
        setDesForm({ name: '', nameEn: '', departmentId: '', level: 1, description: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'পদবি তৈরিতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${name}' ডিপার্টমেন্ট মুছতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/staff/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'ডিপার্টমেন্ট সফলভাবে মুছে ফেলা হয়েছে।' });
        fetchDepartments();
      } else {
        setMessage({ type: 'error', text: data.error || 'মুছতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    }
  };

  const handleDeleteDes = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${name}' পদবি মুছতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/staff/designations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'পদবি মুছে ফেলা হয়েছে।' });
        fetchDepartments();
      } else {
        setMessage({ type: 'error', text: data.error || 'মুছতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold border border-shubban-green/20">
              অর্গানাইজেশন চার্ট
            </span>
            <span className="text-xs text-stone-500">মোট {toBengaliNumber(departments.length)} টি বিভাগ</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-shubban-gold" />
            <span>ডিপার্টমেন্ট ও পদবি কাঠামো (Departments & Designations)</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDepartments}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-shubban-gold' : ''}`} />
          </button>

          <button
            onClick={() => setShowDeptModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-shubban-gold" />
            <span>নতুন ডিপার্টমেন্ট</span>
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

      {/* Departments Accordion List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold mx-auto mb-2" />
            <span>ডিপার্টমেন্ট ও পদবি লোড হচ্ছে...</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            কোনো ডিপার্টমেন্ট বিদ্যমান নেই।
          </div>
        ) : (
          departments.map((dept) => {
            const isExpanded = expandedDeptId === dept.id;
            return (
              <div
                key={dept.id}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden"
              >
                {/* Department Header Row */}
                <div
                  onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center font-bold text-sm border border-shubban-green/20 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                          {dept.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200">
                          {dept.code}
                        </span>
                      </div>
                      {dept.description && (
                        <p className="text-xs text-stone-500 truncate mt-0.5 max-w-xl">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        <Users className="w-3.5 h-3.5 text-shubban-gold" />
                        <span>{toBengaliNumber(dept._count?.staffMembers || 0)} কর্মী</span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        <Award className="w-3.5 h-3.5 text-blue-500" />
                        <span>{toBengaliNumber(dept.designations?.length || 0)} পদবি</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeptForDes(dept);
                          setDesForm({ ...desForm, departmentId: dept.id });
                          setShowDesModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-shubban-green flex items-center gap-1"
                        title="এই ডিপার্টমেন্টে পদবি যোগ করুন"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">পদবি যোগ</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDept(dept.id, dept.name);
                        }}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
                        title="ডিপার্টমেন্ট মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="p-1 text-stone-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Designations Sub-table */}
                {isExpanded && (
                  <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-shubban-gold" />
                        <span>অন্তর্ভুক্ত পদবি ও সাংগঠনিক স্তর (Hierarchy)</span>
                      </span>

                      <button
                        onClick={() => {
                          setSelectedDeptForDes(dept);
                          setDesForm({ ...desForm, departmentId: dept.id });
                          setShowDesModal(true);
                        }}
                        className="text-xs text-shubban-green hover:underline font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>নতুন পদবি</span>
                      </button>
                    </div>

                    {dept.designations?.length === 0 ? (
                      <p className="text-xs text-stone-400 py-3 text-center">
                        এই বিভাগে এখনো কোনো পদবি যোগ করা হয়নি।
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {dept.designations.map((des: any) => (
                          <div
                            key={des.id}
                            className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 shadow-2xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  L-{toBengaliNumber(des.level)}
                                </span>
                                <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                                  {des.name}
                                </h4>
                              </div>
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                নিয়োজিত: {toBengaliNumber(des._count?.staffMembers || 0)} জন
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteDes(des.id, des.name)}
                              className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                              title="পদবি মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE DEPT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন বিভাগ (Department) তৈরি করুন
                </h3>
              </div>
              <button onClick={() => setShowDeptModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিভাগের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="উদাঃ গবেষণা ও উন্নয়ন"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">Department Name (English)</label>
                <input
                  type="text"
                  value={deptForm.nameEn}
                  onChange={(e) => setDeptForm({ ...deptForm, nameEn: e.target.value })}
                  placeholder="e.g. Research & Development"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিভাগ কোড (Unique Code) *</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. RND, ADMIN, SALES"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 uppercase"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিবরণ / দায়িত্ব পরিধি</label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="বিভাগের কর্মপরিধি ও লক্ষ্য..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'তৈরি হচ্ছে...' : 'বিভাগ তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DESIGNATION MODAL */}
      {showDesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন পদবি (Designation) যুক্ত করুন
                </h3>
              </div>
              <button onClick={() => setShowDesModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDesSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিভাগ নির্বাচন *</label>
                <select
                  required
                  value={desForm.departmentId}
                  onChange={(e) => setDesForm({ ...desForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  <option value="">বিভাগ সিলেক্ট করুন</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পদবির নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={desForm.name}
                  onChange={(e) => setDesForm({ ...desForm, name: e.target.value })}
                  placeholder="উদাঃ সহকারী সম্পাদক"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পদবি (English)</label>
                <input
                  type="text"
                  value={desForm.nameEn}
                  onChange={(e) => setDesForm({ ...desForm, nameEn: e.target.value })}
                  placeholder="e.g. Associate Editor"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">সাংগঠনিক স্তর / লেভেল (১ থেকে ১০) *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={desForm.level}
                  onChange={(e) => setDesForm({ ...desForm, level: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">১০ = শীর্ষ নির্বাহী (CEO), ১ = প্রারম্ভিক লেভেল</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowDesModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'যুক্ত হচ্ছে...' : 'পদবি যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

