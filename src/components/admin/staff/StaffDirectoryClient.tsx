'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Shield,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export default function StaffDirectoryClient() {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeStaff, setActiveStaff] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADMIN',
    departmentId: '',
    designationId: '',
    supervisorId: '',
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    salaryGrade: 'Grade-A',
    workResponsibilities: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    professionalBio: '',
    internalNotes: '',
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        search,
        departmentId: selectedDept,
        status: selectedStatus,
        employmentType: selectedType,
      });

      const res = await fetch(`/api/admin/staff?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStaff(data.data);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const [deptRes, desRes] = await Promise.all([
        fetch('/api/admin/staff/departments'),
        fetch('/api/admin/staff/designations'),
      ]);
      const deptData = await deptRes.json();
      const desData = await desRes.json();
      if (deptData.success) setDepartments(deptData.data);
      if (desData.success) setDesignations(desData.data);
    } catch (err) {
      console.error('Fetch filters error:', err);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [page, search, selectedDept, selectedStatus, selectedType]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone,
        },
      };

      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'নতুন স্টাফ সফলভাবে অনবোর্ড করা হয়েছে!' });
        setShowCreateModal(false);
        fetchStaff();
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'ADMIN',
          departmentId: '',
          designationId: '',
          supervisorId: '',
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          salaryGrade: 'Grade-A',
          workResponsibilities: '',
          emergencyName: '',
          emergencyRelation: '',
          emergencyPhone: '',
          professionalBio: '',
          internalNotes: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'স্টাফ অনবোর্ডিং ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        departmentId: formData.departmentId,
        designationId: formData.designationId,
        supervisorId: formData.supervisorId,
        employmentType: formData.employmentType,
        employmentStatus: formData.employmentStatus,
        salaryGrade: formData.salaryGrade,
        workResponsibilities: formData.workResponsibilities,
        professionalBio: formData.professionalBio,
        internalNotes: formData.internalNotes,
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone,
        },
      };

      const res = await fetch(`/api/admin/staff/${activeStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'স্টাফ প্রোফাইল সফলভাবে আপডেট করা হয়েছে।' });
        setShowEditModal(false);
        fetchStaff();
      } else {
        setMessage({ type: 'error', text: data.error || 'আপডেট ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ত্রুটি ঘটেছে।' });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (member: any) => {
    setActiveStaff(member);
    let emergency = { name: '', relation: '', phone: '' };
    try {
      if (member.emergencyContact) {
        emergency = typeof member.emergencyContact === 'string' ? JSON.parse(member.emergencyContact) : member.emergencyContact;
      }
    } catch (e) {}

    setFormData({
      name: member.user?.name || '',
      email: member.user?.email || '',
      phone: member.user?.phone || '',
      password: '',
      role: member.user?.role || 'ADMIN',
      departmentId: member.departmentId || '',
      designationId: member.designationId || '',
      supervisorId: member.supervisorId || '',
      employmentType: member.employmentType || 'FULL_TIME',
      employmentStatus: member.employmentStatus || 'ACTIVE',
      salaryGrade: member.salaryGrade || 'Grade-A',
      workResponsibilities: member.workResponsibilities || '',
      emergencyName: emergency.name || '',
      emergencyRelation: emergency.relation || '',
      emergencyPhone: emergency.phone || '',
      professionalBio: member.professionalBio || '',
      internalNotes: member.internalNotes || '',
    });
    setShowEditModal(true);
  };

  const handleTerminate = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে '${name}' কে অব্যাহতি / আর্কাইভ করতে চান?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('স্টাফ অব্যাহতি সফল হয়েছে।');
        fetchStaff();
      } else {
        alert(data.error || 'ব্যর্থ হয়েছে।');
      }
    } catch (e: any) {
      alert(e.message || 'ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold border border-shubban-green/20">
              স্টাফ ডিরেক্টরি
            </span>
            <span className="text-xs text-stone-500">মোট {toBengaliNumber(totalCount)} জন কর্মকর্তা</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-shubban-gold" />
            <span>প্রশাসনিক কর্মকর্তাদের প্রোফাইল ও ডিরেক্টরি</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStaff}
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
            <UserPlus className="w-4 h-4 text-shubban-gold" />
            <span>নতুন স্টাফ অনবোর্ড</span>
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

      {/* Search & Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="নাম, ইমেইল, আইডি (SL-EMP-...) অথবা ফোন দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-52">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="ALL">সকল বিভাগ</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="ACTIVE">সক্রিয় (Active)</option>
            <option value="ON_LEAVE">ছুটিতে (On Leave)</option>
            <option value="PROBATION">প্রবেশন (Probation)</option>
            <option value="TERMINATED">টার্মিনেট / প্রাক্তন</option>
          </select>
        </div>

        {/* Employment Type */}
        <div className="w-full md:w-40">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="ALL">সকল চাকুরির ধরন</option>
            <option value="FULL_TIME">ফুল-টাইম</option>
            <option value="PART_TIME">পার্ট-টাইম</option>
            <option value="CONTRACT">চুক্তিবদ্ধ</option>
            <option value="INTERN">ইন্টার্ন</option>
          </select>
        </div>
      </div>

      {/* Staff Table / Cards */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold mx-auto mb-2" />
            <span>স্টাফ তালিকা লোড হচ্ছে...</span>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            কোনো কর্মকর্তা খুঁজে পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-stone-500 font-semibold">
                  <th className="py-3 px-4">আইডি ও কর্মকর্তা</th>
                  <th className="py-3 px-4">বিভাগ ও পদবি</th>
                  <th className="py-3 px-4">যোগাযোগ</th>
                  <th className="py-3 px-4">ভূমিকা (Role)</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition group"
                  >
                    {/* User & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center font-bold text-sm border border-shubban-green/20 shrink-0">
                          {member.user?.name?.charAt(0) || 'ক'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                              {member.user?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/60">
                              {member.employeeId}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {member.employmentType === 'FULL_TIME'
                                ? 'ফুল-টাইম'
                                : member.employmentType === 'PART_TIME'
                                ? 'পার্ট-টাইম'
                                : member.employmentType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Designation */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-800 dark:text-stone-200">
                        {member.designation?.name || 'অফিসার'}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {member.department?.name || 'সাধারণ বিভাগ'}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                        <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{member.user?.email}</span>
                      </div>
                      {member.user?.phone && (
                        <div className="flex items-center gap-1.5 text-stone-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{member.user.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40">
                        {member.user?.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          member.employmentStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40'
                            : member.employmentStatus === 'ON_LEAVE'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/40'
                            : member.employmentStatus === 'PROBATION'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/40'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {member.employmentStatus === 'ACTIVE'
                            ? 'সক্রিয়'
                            : member.employmentStatus === 'ON_LEAVE'
                            ? 'ছুটিতে'
                            : member.employmentStatus === 'PROBATION'
                            ? 'প্রবেশন'
                            : 'টার্মিনেটেড'}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveStaff(member);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(member)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleTerminate(member.id, member.user?.name || '')}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 transition"
                          title="অব্যাহতি / টার্মিনেট"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
            <span>
              পৃষ্ঠা {toBengaliNumber(page)} এর {toBengaliNumber(totalPages)}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন প্রশাসনিক স্টাফ অনবোর্ড করুন
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="উদাঃ মাওলানা আব্দুল্লাহ"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">মোবাইল ফোন নম্বর</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">লগইন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="ডিফল্ট: Shubban@123456"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিভাগ (Department)</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পদবি (Designation)</label>
                  <select
                    value={formData.designationId}
                    onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="">পদবি নির্বাচন করুন</option>
                    {designations
                      .filter((des) => !formData.departmentId || des.departmentId === formData.departmentId)
                      .map((des) => (
                        <option key={des.id} value={des.id}>
                          {des.name} (লেভেল {toBengaliNumber(des.level)})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">প্রশাসনিক রোল (RBAC Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="ADMIN">ADMIN (সাধারণ প্রশাসন)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (সর্বোচ্চ ক্ষমতা)</option>
                    <option value="EDITOR">EDITOR (সম্পাদকীয়)</option>
                    <option value="FINANCE_MANAGER">FINANCE_MANAGER (আর্থিক)</option>
                    <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT (সহায়তা)</option>
                    <option value="STORE_MANAGER">STORE_MANAGER (স্টোর)</option>
                    <option value="MODERATOR">MODERATOR (মডারেশন)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">চাকুরির ধরন</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="FULL_TIME">ফুল-টাইম (Full Time)</option>
                    <option value="PART_TIME">পার্ট-টাইম (Part Time)</option>
                    <option value="CONTRACT">চুক্তিবদ্ধ (Contract)</option>
                    <option value="INTERN">ইন্টার্ন (Intern)</option>
                    <option value="VOLUNTEER">স্বেচ্ছাসেবী (Volunteer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">দায়িত্ব ও কার্যপরিধি (Work Responsibilities)</label>
                <textarea
                  rows={2}
                  value={formData.workResponsibilities}
                  onChange={(e) => setFormData({ ...formData, workResponsibilities: e.target.value })}
                  placeholder="দৈনন্দিন করণীয় এবং মূল দায়িত্বসমূহ..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              {/* Emergency Contact */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
                <span className="font-semibold text-stone-700 dark:text-stone-300">জরুরি যোগাযোগ (Emergency Contact)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="ব্যক্তির নাম"
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                  <input
                    type="text"
                    value={formData.emergencyRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                    placeholder="সম্পর্ক (পিতা/ভাই/স্বামী)"
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="ফোন নম্বর"
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">অভ্যন্তরীণ গোপনীয় নোট (Internal Admin Notes)</label>
                <textarea
                  rows={2}
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  placeholder="শুধুমাত্র অ্যাডমিন দেখতে পাবেন..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'অনবোর্ডিং হচ্ছে...' : 'অনবোর্ড সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && activeStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  স্টাফ প্রোফাইল সম্পাদনা: {activeStaff.user?.name} ({activeStaff.employeeId})
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পূর্ণ নাম</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ফোন নম্বর</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">বিভাগ</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="">বিভাগ নির্ধারণ করুন</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পদবি</label>
                  <select
                    value={formData.designationId}
                    onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="">পদবি নির্ধারণ করুন</option>
                    {designations.map((des) => (
                      <option key={des.id} value={des.id}>
                        {des.name} (লেভেল {toBengaliNumber(des.level)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">কর্মসংস্থান স্ট্যাটাস</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="ACTIVE">সক্রিয় (Active)</option>
                    <option value="ON_LEAVE">ছুটিতে (On Leave)</option>
                    <option value="PROBATION">প্রবেশন (Probation)</option>
                    <option value="SUSPENDED">সাময়িক বরখাস্ত (Suspended)</option>
                    <option value="TERMINATED">টার্মিনেট / প্রাক্তন (Terminated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">চাকুরির ধরন</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="FULL_TIME">ফুল-টাইম</option>
                    <option value="PART_TIME">পার্ট-টাইম</option>
                    <option value="CONTRACT">চুক্তিবদ্ধ</option>
                    <option value="INTERN">ইন্টার্ন</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">দায়িত্ব ও কার্যপরিধি</label>
                <textarea
                  rows={2}
                  value={formData.workResponsibilities}
                  onChange={(e) => setFormData({ ...formData, workResponsibilities: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">অভ্যন্তরীণ গোপনীয় নোট</label>
                <textarea
                  rows={2}
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'আপডেট হচ্ছে...' : 'আপডেট সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && activeStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  কর্মকর্তা প্রোফাইল বিবরণ
                </h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                <div className="w-12 h-12 rounded-xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center font-bold text-lg border border-shubban-green/20">
                  {activeStaff.user?.name?.charAt(0) || 'ক'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{activeStaff.user?.name}</h4>
                  <p className="text-stone-500">{activeStaff.user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700">
                    {activeStaff.employeeId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">বিভাগ</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {activeStaff.department?.name || 'অনির্ধারিত'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">পদবি</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {activeStaff.designation?.name || 'অনির্ধারিত'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">চাকুরির ধরন</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {activeStaff.employmentType}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">স্ট্যাটাস</span>
                  <span className="font-semibold text-emerald-600">
                    {activeStaff.employmentStatus}
                  </span>
                </div>
              </div>

              {activeStaff.workResponsibilities && (
                <div className="p-3 rounded-lg border border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block mb-1">দায়িত্ব ও পরিধি</span>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {activeStaff.workResponsibilities}
                  </p>
                </div>
              )}

              {activeStaff.internalNotes && (
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 text-amber-900 dark:text-amber-200">
                  <span className="text-[10px] font-bold block mb-1">অভ্যন্তরীণ নোট (Confidential)</span>
                  <p className="leading-relaxed">{activeStaff.internalNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

