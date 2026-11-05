'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserX,
  UserCheck,
  Clock,
  ShieldAlert,
  X,
  HelpCircle,
  Edit2,
  Trash2,
  Plus,
  KeyRound,
  Eye,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface AdminUser {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  membershipTier: string;
  avatarUrl?: string | null;
  createdAt: Date | string;
  lastLoginAt?: Date | string | null;
}

const ALL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE_MANAGER',
  'STORE_MANAGER',
  'MAGAZINE_ADMIN',
  'EDITOR',
  'MODERATOR',
  'CUSTOMER_SUPPORT',
  'REVIEWER',
  'SELLER',
  'PUBLISHER',
  'AUTHOR',
  'CONTRIBUTOR',
  'PAID_MEMBER',
  'CUSTOMER',
  'REGISTERED_MEMBER',
  'GUEST',
];

const ALL_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED'];
const ALL_TIERS = ['FREE', 'DIGITAL', 'PREMIUM', 'INSTITUTIONAL'];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'সুপার অ্যাডমিন (Super Admin)',
  ADMIN: 'অ্যাডমিন (Admin)',
  FINANCE_MANAGER: 'ফাইন্যান্স ম্যানেজার',
  STORE_MANAGER: 'স্টোর ম্যানেজার',
  MAGAZINE_ADMIN: 'সাময়িকী অ্যাডমিন (Magazine Admin)',
  EDITOR: 'সম্পাদক (Editor)',
  MODERATOR: 'মডারেটর (Moderator)',
  CUSTOMER_SUPPORT: 'কাস্টমার সাপোর্ট',
  REVIEWER: 'পর্যালোচক (Reviewer)',
  SELLER: 'বিক্রেতা / সেলার (Seller)',
  PUBLISHER: 'প্রকাশক (Publisher Admin)',
  AUTHOR: 'লেখক (Author)',
  CONTRIBUTOR: 'লেখক/কন্ট্রিবিউটর',
  PAID_MEMBER: 'পেইড সদস্য (Paid Member)',
  CUSTOMER: 'ক্রেতা সদস্য (Customer)',
  REGISTERED_MEMBER: 'সাধারণ নিবন্ধিত সদস্য',
  GUEST: 'অতিথি (Guest)',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: {
    label: 'সক্রিয় (Active)',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  SUSPENDED: {
    label: 'সাময়িক স্থগিত (Suspended)',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
  },
  INACTIVE: {
    label: 'নিষ্ক্রিয় (Inactive)',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
  },
  BLOCKED: {
    label: 'স্থায়ী ব্লক (Blocked)',
    color: 'text-stone-700 dark:text-stone-300',
    bg: 'bg-stone-100 dark:bg-stone-800',
    border: 'border-stone-300 dark:border-stone-700',
  },
};

export default function AdminUsersClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalUser, setEditModalUser] = useState<AdminUser | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'REGISTERED_MEMBER',
    status: 'ACTIVE',
    membershipTier: 'FREE',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'REGISTERED_MEMBER',
    status: 'ACTIVE',
    membershipTier: 'FREE',
  });

  // Fast confirmation modal state for role / status dropdowns
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    actionType: 'ROLE' | 'STATUS';
    targetValue: string;
    label: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q));

      const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
      const matchStatus = selectedStatus === 'ALL' || u.status === selectedStatus;
      const matchTier = selectedTier === 'ALL' || u.membershipTier === selectedTier;

      return matchSearch && matchRole && matchStatus && matchTier;
    });
  }, [users, search, selectedRole, selectedStatus, selectedTier]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      suspended: users.filter((u) => u.status === 'SUSPENDED' || u.status === 'BLOCKED').length,
      admins: users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length,
    };
  }, [users]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRoleSelection = (userId: string, userName: string, role: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.role === role) return;

    setConfirmModal({
      isOpen: true,
      userId,
      userName,
      actionType: 'ROLE',
      targetValue: role,
      label: `ব্যবহারকারী "${userName}" এর রোল পরিবর্তন করে "${ROLE_LABELS[role] || role}" করতে চান?`,
    });
  };

  const handleStatusSelection = (userId: string, userName: string, status: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.status === status) return;

    setConfirmModal({
      isOpen: true,
      userId,
      userName,
      actionType: 'STATUS',
      targetValue: status,
      label: `ব্যবহারকারী "${userName}" এর অ্যাকাউন্ট স্ট্যাটাস "${STATUS_LABELS[status]?.label || status}" এ রূপান্তর করতে চান?`,
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmModal) return;
    const { userId, actionType, targetValue } = confirmModal;
    setConfirmModal(null);
    setLoadingId(userId);

    try {
      const payload = actionType === 'ROLE' ? { role: targetValue } : { status: targetValue };

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  ...(actionType === 'ROLE' ? { role: targetValue } : { status: targetValue }),
                }
              : u
          )
        );
        showFeedback('success', data.message || 'সফলভাবে হালনাগাদ করা হয়েছে!');
      } else {
        showFeedback('error', data.error || 'হালনাগাদ করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      showFeedback('error', 'সার্ভারে সংযোগে ত্রুটি ঘটেছে।');
    } finally {
      setLoadingId(null);
    }
  };

  const handleTierChange = async (id: string, membershipTier: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipTier }),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, membershipTier } : u)));
        showFeedback('success', 'মেম্বারশিপ টিয়ার সফলভাবে হালনাগাদ করা হয়েছে!');
      } else {
        showFeedback('error', data.error || 'টিয়ার পরিবর্তন ব্যর্থ হয়েছে।');
      }
    } catch (e) {
      showFeedback('error', 'সার্ভারে সংযোগে ত্রুটি।');
    } finally {
      setLoadingId(null);
    }
  };

  // Open Edit User Modal
  const openEditModal = (u: AdminUser) => {
    setEditModalUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      username: u.username || '',
      password: '',
      role: u.role,
      status: u.status,
      membershipTier: u.membershipTier,
    });
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setActionLoading(true);

    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        username: editForm.username,
        role: editForm.role,
        status: editForm.status,
        membershipTier: editForm.membershipTier,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch(`/api/admin/users/${editModalUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editModalUser.id ? { ...u, ...data.user } : u))
        );
        showFeedback('success', 'ব্যবহারকারীর তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
        setEditModalUser(null);
      } else {
        showFeedback('error', data.error || 'আপডেট ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'ত্রুটি ঘটেছে।');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Create Form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => [data.user, ...prev]);
        showFeedback('success', 'নতুন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে!');
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          email: '',
          phone: '',
          username: '',
          password: '',
          role: 'REGISTERED_MEMBER',
          status: 'ACTIVE',
          membershipTier: 'FREE',
        });
      } else {
        showFeedback('error', data.error || 'তৈরি করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'ত্রুটি ঘটেছে।');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Delete User
  const executeDeleteUser = async () => {
    if (!deleteModalUser) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${deleteModalUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
        showFeedback('success', data.message || 'ব্যবহারকারী সফলভাবে অপসারিত হয়েছে!');
        setDeleteModalUser(null);
      } else {
        showFeedback('error', data.error || 'মুছতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'সার্ভার ত্রুটি।');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar & Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* KPI Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
          <div className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard">
            <span className="text-[11px] text-stone-500 block">মোট সদস্য</span>
            <span className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {toBengaliNumber(stats.total)}
            </span>
          </div>

          <div className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard">
            <span className="text-[11px] text-emerald-600 block">সক্রিয় অ্যাকাউন্ট</span>
            <span className="text-xl font-bold font-serif text-emerald-600">
              {toBengaliNumber(stats.active)}
            </span>
          </div>

          <div className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard">
            <span className="text-[11px] text-rose-600 block">স্থগিত / ব্লকড</span>
            <span className="text-xl font-bold font-serif text-rose-600">
              {toBengaliNumber(stats.suspended)}
            </span>
          </div>

          <div className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard">
            <span className="text-[11px] text-amber-600 block">অ্যাডমিন দল</span>
            <span className="text-xl font-bold font-serif text-amber-600">
              {toBengaliNumber(stats.admins)}
            </span>
          </div>
        </div>

        {/* Add User Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-semibold shadow-sm transition"
        >
          <UserPlus className="w-4 h-4 text-shubban-gold" />
          <span>নতুন ব্যবহারকারী যোগ</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-shubban-darkCard shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="নাম, ইমেইল, ইউজারনেম বা ফোন..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-medium"
            >
              <option value="ALL">সকল ভূমিকা (All Roles)</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r} — {ROLE_LABELS[r] || r}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-medium"
            >
              <option value="ALL">সকল স্ট্যাটাস (All Statuses)</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]?.label || s}
                </option>
              ))}
            </select>
          </div>

          {/* Membership Tier Filter */}
          <div>
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-medium"
            >
              <option value="ALL">সকল মেম্বারশিপ (All Tiers)</option>
              {ALL_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">ব্যবহারকারীর তথ্য</th>
                <th className="p-3.5">ইমেইল ও যোগাযোগ</th>
                <th className="p-3.5">রোল (RBAC Role)</th>
                <th className="p-3.5">অ্যাকাউন্ট স্ট্যাটাস</th>
                <th className="p-3.5">মেম্বারশিপ টিয়ার</th>
                <th className="p-3.5">নিবন্ধন তারিখ</th>
                <th className="p-3.5 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    কোনো ব্যবহারকারী পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const statusInfo = STATUS_LABELS[u.status] || STATUS_LABELS.ACTIVE;
                  const isBusy = loadingId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors ${
                        isBusy ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {/* Identity: Avatar + Name + Username */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-shubban-green text-shubban-gold font-bold flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
                            {u.avatarUrl ? (
                              <Image
                                src={u.avatarUrl}
                                alt={u.name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : (
                              <span>{u.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.role === 'SUPER_ADMIN' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                  SUPER
                                </span>
                              )}
                            </div>
                            {u.username && (
                              <span className="text-[10px] text-stone-400 block font-mono">
                                @{u.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact: Email + Phone */}
                      <td className="p-3.5 text-stone-600 dark:text-stone-400">
                        <span className="block font-mono text-[11px] select-all">{u.email}</span>
                        <span className="text-[10px] text-stone-400">{u.phone || 'ফোন নম্বর নেই'}</span>
                      </td>

                      {/* Role selection */}
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleSelection(u.id, u.name, e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold text-shubban-green dark:text-shubban-gold focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status selection */}
                      <td className="p-3.5">
                        <select
                          value={u.status}
                          onChange={(e) => handleStatusSelection(u.id, u.name, e.target.value)}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-shubban-gold ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]?.label || s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Membership tier */}
                      <td className="p-3.5">
                        <select
                          value={u.membershipTier}
                          onChange={(e) => handleTierChange(u.id, e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                        >
                          {ALL_TIERS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-stone-400">
                        <span className="block">{formatBengaliDate(u.createdAt)}</span>
                        {u.lastLoginAt && (
                          <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>লগইন: {formatBengaliDate(u.lastLoginAt)}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteModalUser(u)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 transition"
                            title="মুছে ফেলুন"
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
      </div>

      {/* Pagination component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={pageSize}
        itemName="ব্যবহারকারী"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 15, 25, 50, 100]}
      />

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-shubban-green" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  নতুন ব্যবহারকারী অ্যাকাউন্ট তৈরি করুন
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="উদাঃ মোঃ আব্দুল্লাহ"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ফোন নম্বর</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ইউজারনেম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="username"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">লগইন পাসওয়ার্ড *</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ভূমিকা (Role)</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">স্ট্যাটাস</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">মেম্বারশিপ টিয়ার</label>
                  <select
                    value={createForm.membershipTier}
                    onChange={(e) => setCreateForm({ ...createForm, membershipTier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {ALL_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {actionLoading ? 'তৈরি হচ্ছে...' : 'তৈরি সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  ব্যবহারকারী তথ্য সম্পাদনা (Edit User)
                </h3>
              </div>
              <button onClick={() => setEditModalUser(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ফোন নম্বর</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ইউজারনেম</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">ভূমিকা (Role)</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">স্ট্যাটাস</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">মেম্বারশিপ টিয়ার</label>
                  <select
                    value={editForm.membershipTier}
                    onChange={(e) => setEditForm({ ...editForm, membershipTier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {ALL_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">নতুন পাসওয়ার্ড (ঐচ্ছিক রিসেট)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="অপরিবর্তিত রাখতে ফাঁকা রাখুন"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <Trash2 className="w-5 h-5" />
                <span>ব্যবহারকারী অপসারণ নিশ্চিতকরণ</span>
              </div>
              <button onClick={() => setDeleteModalUser(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="text-stone-900 dark:text-stone-100">{deleteModalUser.name}</strong> ({deleteModalUser.email}) কে স্থায়ীভাবে মুছে ফেলতে চান?
            </p>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-300">
              ব্যবহারকারীর সংশ্লিষ্ট অর্ডার রেকর্ড থাকলে সিস্টেম অ্যাকাউন্টটি স্থায়ীভাবে ব্লক ও নিষ্ক্রিয় করবে, অন্যথায় সম্পূর্ণ ডাটাবেজ থেকে মুছে দেওয়া হবে।
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={executeDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {actionLoading ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Inline Selects */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-bengali">
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>নিশ্চিতকরণ প্রয়োজন</span>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {confirmModal.label}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-bold shadow transition-colors"
              >
                হ্যাঁ, নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
