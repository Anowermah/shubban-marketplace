'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  Printer,
  ArrowUpDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  Filter,
  Sparkles,
  ExternalLink,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Save,
  Check,
  Calendar,
  FileText,
  BookOpen,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Share2,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  Clock,
  Layers,
  HelpCircle,
  Upload,
  UserCheck,
  UserX,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';
import MediaPickerInput from '@/components/media/MediaPickerInput';

export interface AuthorArticleItem {
  id: string;
  title: string;
  slug: string;
  type?: string;
  status: string;
  readingTime?: number;
  views?: number;
  isFeatured?: boolean;
  publishedAt?: string | Date | null;
  createdAt: string | Date;
  category?: { id: string; name: string; slug: string } | null;
}

export interface AuthorItem {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  bio?: string | null;
  bioDetails?: string | null;
  photoUrl?: string | null;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  expertise?: string | null;
  workplace?: string | null;
  education?: string | null;
  experience?: string | null;
  awards?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  website?: string | null;
  status: string; // ACTIVE, INACTIVE, DRAFT, PENDING_REVIEW
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count: {
    books: number;
    articles: number;
    papers: number;
  };
  latestArticle?: AuthorArticleItem | null;
  profileCompletion?: number;
}

export interface AuthorStats {
  totalAuthors: number;
  activeAuthors: number;
  inactiveAuthors: number;
  totalPublishedArticles: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminAuthorsManagerProps {
  initialAuthors: AuthorItem[];
  initialStats: AuthorStats;
  initialPagination: PaginationInfo;
}

export default function AdminAuthorsManager({
  initialAuthors,
  initialStats,
  initialPagination,
}: AdminAuthorsManagerProps) {
  // State
  const [authors, setAuthors] = useState<AuthorItem[]>(initialAuthors);
  const [stats, setStats] = useState<AuthorStats>(initialStats);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, ACTIVE, INACTIVE, DRAFT, PENDING_REVIEW
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all');
  const [contentFilter, setContentFilter] = useState<string>('all'); // all, hasArticles, hasBooks, noContent
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, 7days, 30days, thisYear
  const [sortBy, setSortBy] = useState<string>('createdAt'); // createdAt, name, articles, books, updatedAt
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [limitPerPage, setLimitPerPage] = useState<string>('25');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalAuthor, setEditModalAuthor] = useState<AuthorItem | null>(null);
  const [viewModalAuthor, setViewModalAuthor] = useState<AuthorItem | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AuthorItem | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState<boolean>(false);
  const [articleManageAuthor, setArticleManageAuthor] = useState<AuthorItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Authors from API
  const fetchAuthors = useCallback(
    async (pageToLoad = currentPage, overrideLimit = limitPerPage) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageToLoad),
          limit: overrideLimit,
          search: searchQuery,
          status: statusFilter,
          expertise: expertiseFilter,
          contentFilter: contentFilter,
          dateFilter: dateFilter,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });

        const res = await fetch(`/api/admin/authors?${params.toString()}`);
        if (!res.ok) throw new Error('লেখক তালিকা লোড করতে সমস্যা হয়েছে।');
        const data = await res.json();

        if (data.success) {
          setAuthors(data.authors);
          setStats(data.stats);
          setPagination(data.pagination);
          setCurrentPage(data.pagination.page);
        }
      } catch (err: any) {
        showToast(err.message || 'ডেটা রিফ্রেশ করতে সমস্যা হয়েছে।', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, limitPerPage, searchQuery, statusFilter, expertiseFilter, contentFilter, dateFilter, sortBy, sortOrder]
  );

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchAuthors(1);
    }, 350);
  };

  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchAuthors(currentPage);
  }, [statusFilter, expertiseFilter, contentFilter, dateFilter, sortBy, sortOrder, limitPerPage, currentPage]);

  // Selection
  const allCurrentIds = useMemo(() => authors.map((a) => a.id), [authors]);
  const isAllSelected = selectedIds.length > 0 && allCurrentIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allCurrentIds);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Instant Toggle Status / Active
  const handleToggleActive = async (author: AuthorItem) => {
    const newActive = !author.isActive;
    const newStatus = newActive ? 'ACTIVE' : 'INACTIVE';

    // Optimistic UI
    setAuthors((prev) =>
      prev.map((a) => (a.id === author.id ? { ...a, isActive: newActive, status: newStatus } : a))
    );

    try {
      const res = await fetch(`/api/admin/authors/${author.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive, status: newStatus }),
      });
      if (!res.ok) throw new Error('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
      showToast(
        `"${author.name}"-এর প্রোফাইল ${newActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'} করা হয়েছে।`
      );
      setStats((prev) => ({
        ...prev,
        activeAuthors: newActive ? prev.activeAuthors + 1 : prev.activeAuthors - 1,
        inactiveAuthors: newActive ? prev.inactiveAuthors - 1 : prev.inactiveAuthors + 1,
      }));
    } catch (err: any) {
      fetchAuthors();
      showToast(err.message, 'error');
    }
  };

  // Single Delete
  const handleDeleteAuthor = async () => {
    if (!deleteConfirmTarget) return;
    try {
      const res = await fetch(`/api/admin/authors/${deleteConfirmTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'লেখক মুছতে সমস্যা হয়েছে।');

      showToast(data.message || 'লেখক সফলভাবে মুছে ফেলা হয়েছে।');
      setDeleteConfirmTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmTarget.id));
      fetchAuthors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      setBulkDeleteModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/admin/authors/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, authorIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'বাল্ক একশন সম্পন্ন হয়নি।');

      showToast(data.message);
      setSelectedIds([]);
      fetchAuthors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExecuteBulkDelete = async () => {
    try {
      const res = await fetch('/api/admin/authors/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', authorIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'বাল্ক ডিলিট ব্যর্থ হয়েছে।');

      showToast(data.message);
      setBulkDeleteModalOpen(false);
      setSelectedIds([]);
      fetchAuthors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Export CSV with UTF-8 BOM
  const handleExportCSV = (onlySelected = false) => {
    const listToExport = onlySelected
      ? authors.filter((a) => selectedIds.includes(a.id))
      : authors;

    if (listToExport.length === 0) {
      showToast('এক্সপোর্ট করার জন্য কোনো লেখক নেই।', 'error');
      return;
    }

    const headers = [
      'ID',
      'Name (নাম)',
      'English Name',
      'Slug',
      'Designation',
      'Email',
      'Phone',
      'Expertise',
      'Workplace',
      'Education',
      'Total Books',
      'Total Articles',
      'Status',
      'Joined Date',
      'Updated Date',
    ];

    const rows = listToExport.map((auth) => [
      auth.id,
      `"${(auth.name || '').replace(/"/g, '""')}"`,
      `"${(auth.nameEn || '').replace(/"/g, '""')}"`,
      auth.slug,
      `"${(auth.designation || '').replace(/"/g, '""')}"`,
      auth.email || '',
      auth.phone || '',
      `"${(auth.expertise || '').replace(/"/g, '""')}"`,
      `"${(auth.workplace || '').replace(/"/g, '""')}"`,
      `"${(auth.education || '').replace(/"/g, '""')}"`,
      auth._count?.books || 0,
      auth._count?.articles || 0,
      auth.status,
      formatBengaliDate(auth.createdAt),
      formatBengaliDate(auth.updatedAt),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shubban_authors_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('লেখক তালিকা সিএসভি ফরম্যাটে সফলভাবে ডাউনলোড হয়েছে।');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setExpertiseFilter('all');
    setContentFilter('all');
    setDateFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    fetchAuthors(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    expertiseFilter !== 'all' ||
    contentFilter !== 'all' ||
    dateFilter !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  return (
    <div className="space-y-6 font-bengali pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-shubban-gold/10 text-shubban-gold dark:bg-shubban-gold/20">
              <Users className="w-6 h-6 text-shubban-gold" />
            </span>
            <span>লেখক পরিচিতি ও প্রোফাইল সেন্ট্রাল কন্ট্রোল (Author Profiles)</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            নিবন্ধিত লেখক, গবেষক ও কন্ট্রিবিউটরদের প্রোফাইল, প্রবন্ধ সম্পর্ক, সোশ্যাল মিডিয়া এবং প্রকাশনা নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchAuthors()}
            disabled={isLoading}
            title="তথ্য রিফ্রেশ করুন"
            className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-shubban-gold' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => handleExportCSV(false)}
            title="সিএসভি এক্সপোর্ট"
            className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>এক্সপোর্ট</span>
          </button>

          <button
            onClick={() => window.print()}
            title="প্রিন্ট করুন"
            className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            <span>প্রিন্ট</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-shubban-green hover:bg-shubban-green/90 text-white shadow-sm flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন লেখক যোগ</span>
          </button>
        </div>
      </div>

      {/* 2. Dashboard Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Authors */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'all'
              ? 'border-shubban-gold ring-2 ring-shubban-gold/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-shubban-gold/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">মোট লেখক</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {toBengaliNumber(stats.totalAuthors)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">জন নিবন্ধিত</span>
          </div>
        </div>

        {/* Active Authors */}
        <div
          onClick={() => {
            setStatusFilter('ACTIVE');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'ACTIVE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">সক্রিয় লেখক</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
              {toBengaliNumber(stats.activeAuthors)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">জন লাইভ প্রোফাইল</span>
          </div>
        </div>

        {/* Inactive Authors */}
        <div
          onClick={() => {
            setStatusFilter('INACTIVE');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'INACTIVE'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">নিষ্ক্রিয় / স্থগিত</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-rose-600 dark:text-rose-400">
              {toBengaliNumber(stats.inactiveAuthors)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">জন অপ্রকাশিত</span>
          </div>
        </div>

        {/* Published Articles */}
        <div
          onClick={() => {
            setContentFilter('hasArticles');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all cursor-pointer shadow-sm hover:shadow-md ${
            contentFilter === 'hasArticles'
              ? 'border-sky-500 ring-2 ring-sky-500/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">প্রকাশিত প্রবন্ধ</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-sky-600 dark:text-sky-400">
              {toBengaliNumber(stats.totalPublishedArticles)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">টি নিবন্ধিত প্রবন্ধ</span>
          </div>
        </div>
      </div>

      {/* 6. Advanced Search & Multi-Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="লেখকের নাম, ইমেইল, পদবী বা বিবরণ দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30 focus:border-shubban-gold transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="ACTIVE">সক্রিয় (Active)</option>
              <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
              <option value="DRAFT">খসড়া (Draft)</option>
              <option value="PENDING_REVIEW">পর্যালোচনাধীন (Pending)</option>
            </select>

            {/* Content Filter */}
            <select
              value={contentFilter}
              onChange={(e) => handleFilterChange(setContentFilter, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
            >
              <option value="all">সকল কন্টেন্ট</option>
              <option value="hasArticles">প্রবন্ধ প্রকাশিত আছে</option>
              <option value="hasBooks">বই প্রকাশিত আছে</option>
              <option value="noContent">কোনো প্রকাশনা নেই</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
            >
              <option value="all">সকল তারিখ</option>
              <option value="7days">গত ৭ দিন</option>
              <option value="30days">গত ৩০ দিন</option>
              <option value="thisYear">চলতি বছর</option>
            </select>

            {/* Sort By Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
            >
              <option value="createdAt">নতুন নিবন্ধিত (Newest)</option>
              <option value="name">নাম অনুযায়ী (A-Z)</option>
              <option value="articles">সর্বাধিক প্রবন্ধ (Most Articles)</option>
              <option value="books">সর্বাধিক বই (Most Books)</option>
              <option value="updatedAt">সম্প্রতি সংশোধিত (Updated)</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                setCurrentPage(1);
              }}
              title={sortOrder === 'asc' ? 'উর্ধ্বমুখী (Ascending)' : 'নিম্নমুখী (Descending)'}
              className="p-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 8. Modern 11-Column Authors Data Table */}
      <div className="rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/80 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold select-none">
                {/* 1. Checkbox */}
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold cursor-pointer"
                  />
                </th>

                {/* 2. Profile Picture */}
                <th className="py-3 px-2 w-12 text-center">ছবি</th>

                {/* 3. Author Name */}
                <th className="py-3 px-4 min-w-[200px]">লেখকের নাম ও স্লাগ</th>

                {/* 4. Designation */}
                <th className="py-3 px-3 min-w-[130px]">পদবী / প্রতিষ্ঠান</th>

                {/* 5. Email */}
                <th className="py-3 px-3 hidden md:table-cell min-w-[140px]">ইমেইল</th>

                {/* 6. Expertise */}
                <th className="py-3 px-3 hidden lg:table-cell">বিশেষজ্ঞতা</th>

                {/* 7. Total Articles / Books */}
                <th className="py-3 px-3 text-center">প্রকাশনা</th>

                {/* 8. Status */}
                <th className="py-3 px-3 text-center">স্ট্যাটাস</th>

                {/* 9. Joined Date */}
                <th className="py-3 px-3 text-stone-500 hidden xl:table-cell">যোগদান</th>

                {/* 10. Last Updated */}
                <th className="py-3 px-3 text-stone-500 hidden xl:table-cell">হালনাগাদ</th>

                {/* 11. Actions */}
                <th className="py-3 px-4 text-right min-w-[150px]">কার্যক্রম</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-3.5 text-center">
                      <div className="w-4 h-4 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="w-9 h-9 bg-stone-200 dark:bg-stone-800 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-36 bg-stone-200 dark:bg-stone-800 rounded mb-1.5" />
                      <div className="h-3 w-20 bg-stone-100 dark:bg-stone-900 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
                    </td>
                    <td className="py-4 px-3 hidden md:table-cell">
                      <div className="h-3 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
                    </td>
                    <td className="py-4 px-3 hidden lg:table-cell">
                      <div className="h-4 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="h-4 w-12 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="h-5 w-16 bg-stone-200 dark:bg-stone-800 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-3 hidden xl:table-cell">
                      <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
                    </td>
                    <td className="py-4 px-3 hidden xl:table-cell">
                      <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 w-20 bg-stone-200 dark:bg-stone-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : authors.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-shubban-gold flex items-center justify-center mx-auto">
                        <Users className="w-7 h-7" />
                      </div>
                      <h4 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
                        কোনো লেখক প্রোফাইল পাওয়া যায়নি
                      </h4>
                      <p className="text-xs text-stone-500">
                        অনুসন্ধানের সাথে মিল রয়েছে এমন কোনো লেখক নেই। আপনি নতুন লেখক যোগ করতে পারেন।
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-shubban-gold/10 text-shubban-gold hover:bg-shubban-gold/20"
                        >
                          ফিল্টার রিসেট করুন
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                authors.map((auth) => {
                  const isSelected = selectedIds.includes(auth.id);

                  return (
                    <tr
                      key={auth.id}
                      className={`hover:bg-stone-50/70 dark:hover:bg-stone-900/50 transition-colors ${
                        isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(auth.id)}
                          className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold cursor-pointer"
                        />
                      </td>

                      {/* 2. Profile Picture */}
                      <td className="py-3 px-2 text-center">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 mx-auto">
                          <img
                            src={
                              auth.photoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
                            }
                            alt={auth.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* 3. Name & Slug */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-shubban-gold transition-colors">
                            {auth.name}
                          </span>
                          {auth.isVerified && (
                            <span title="ভেরিফাইড লেখক">
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            </span>
                          )}
                          {auth.isFeatured && (
                            <span title="ফিচার্ড লেখক">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-stone-400">/{auth.slug}</span>
                          <Link
                            href={`/authors/${auth.slug}`}
                            target="_blank"
                            title="পাবলিক পেজ ভিজিট করুন"
                            className="text-stone-400 hover:text-shubban-gold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>

                      {/* 4. Designation */}
                      <td className="py-3 px-3">
                        <span className="text-xs text-stone-700 dark:text-stone-300 block truncate max-w-[140px]">
                          {auth.designation || auth.workplace || '—'}
                        </span>
                      </td>

                      {/* 5. Email */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-xs font-mono text-stone-500 dark:text-stone-400 block truncate max-w-[150px]">
                          {auth.email || '—'}
                        </span>
                      </td>

                      {/* 6. Expertise */}
                      <td className="py-3 px-3 hidden lg:table-cell">
                        {auth.expertise ? (
                          <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium border border-stone-200 dark:border-stone-700">
                            {auth.expertise}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      {/* 7. Total Articles / Books */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            title="মোট প্রকাশিত প্রবন্ধ"
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60"
                          >
                            {toBengaliNumber(auth._count?.articles || 0)}টি প্রবন্ধ
                          </span>
                          <span
                            title="মোট বই"
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60"
                          >
                            {toBengaliNumber(auth._count?.books || 0)} বই
                          </span>
                        </div>
                      </td>

                      {/* 8. Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(auth)}
                          title={auth.isActive ? 'ক্লিক করে নিষ্ক্রিয় করুন' : 'ক্লিক করে সক্রিয় করুন'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            auth.status === 'ACTIVE' || auth.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100'
                              : auth.status === 'PENDING_REVIEW'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200'
                              : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              auth.status === 'ACTIVE' || auth.isActive
                                ? 'bg-emerald-500 animate-pulse'
                                : 'bg-stone-400'
                            }`}
                          />
                          <span>
                            {auth.status === 'ACTIVE' || auth.isActive
                              ? 'সক্রিয়'
                              : auth.status === 'PENDING_REVIEW'
                              ? 'পর্যালোচনাধীন'
                              : auth.status === 'DRAFT'
                              ? 'খসড়া'
                              : 'নিষ্ক্রিয়'}
                          </span>
                        </button>
                      </td>

                      {/* 9. Joined Date */}
                      <td suppressHydrationWarning className="py-3 px-3 text-stone-500 text-[11px] hidden xl:table-cell">
                        {formatBengaliDate(auth.createdAt)}
                      </td>

                      {/* 10. Last Updated */}
                      <td suppressHydrationWarning className="py-3 px-3 text-stone-400 text-[11px] hidden xl:table-cell">
                        {formatBengaliDate(auth.updatedAt)}
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setArticleManageAuthor(auth)}
                            title="প্রবন্ধ ব্যবস্থাপনা ও রি-অ্যাসাইন"
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewModalAuthor(auth)}
                            title="প্রোফাইল বিবরণ দেখুন"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditModalAuthor(auth)}
                            title="প্রোফাইল সম্পাদনা করুন"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmTarget(auth)}
                            title="মুছে ফেলুন"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* 3. Unified Pagination Bar */}
        <div className="p-4 bg-stone-50/50 dark:bg-stone-900/50 border-t border-stone-200 dark:border-stone-800">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={typeof limitPerPage === 'string' && limitPerPage !== 'all' ? parseInt(limitPerPage, 10) : pagination.limit}
            itemName="লেখক"
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setLimitPerPage(s.toString());
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      </div>

      {/* 9. Floating Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 dark:bg-stone-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700/80 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2 pr-3 border-r border-stone-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-shubban-gold animate-ping" />
            <span>
              <strong className="text-shubban-gold font-bold">{toBengaliNumber(selectedIds.length)}</strong> জন
              লেখক নির্বাচিত
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>সক্রিয় করুন</span>
            </button>

            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>নিষ্ক্রিয় করুন</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>এক্সপোর্ট</span>
            </button>

            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>বাল্ক ডিলিট</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors"
            title="নির্বাচন বাতিল করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CREATE AUTHOR MODAL */}
      {createModalOpen && (
        <AuthorFormModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(msg) => {
            showToast(msg);
            setCreateModalOpen(false);
            fetchAuthors();
          }}
        />
      )}

      {/* EDIT AUTHOR MODAL */}
      {editModalAuthor && (
        <AuthorFormModal
          isOpen={!!editModalAuthor}
          author={editModalAuthor}
          onClose={() => setEditModalAuthor(null)}
          onSuccess={(msg) => {
            showToast(msg);
            setEditModalAuthor(null);
            fetchAuthors();
          }}
        />
      )}

      {/* VIEW AUTHOR PROFILE DRAWER / MODAL */}
      {viewModalAuthor && (
        <AuthorProfileModal
          author={viewModalAuthor}
          onClose={() => setViewModalAuthor(null)}
          onEdit={() => {
            setEditModalAuthor(viewModalAuthor);
            setViewModalAuthor(null);
          }}
          onManageArticles={() => {
            setArticleManageAuthor(viewModalAuthor);
            setViewModalAuthor(null);
          }}
        />
      )}

      {/* AUTHOR ARTICLES MANAGEMENT MODAL */}
      {articleManageAuthor && (
        <AuthorArticlesModal
          author={articleManageAuthor}
          allAuthors={authors}
          onClose={() => setArticleManageAuthor(null)}
          onSuccess={(msg) => {
            showToast(msg);
            fetchAuthors();
          }}
        />
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                লেখক প্রোফাইল মুছে ফেলার নিশ্চয়তা
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                আপনি কি নিশ্চিত যে আপনি{' '}
                <strong className="text-stone-800 dark:text-stone-200">&quot;{deleteConfirmTarget.name}&quot;</strong>-এর
                প্রোফাইলটি মুছে ফেলতে চান?
              </p>
              {deleteConfirmTarget._count &&
                deleteConfirmTarget._count.articles + deleteConfirmTarget._count.books > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                    ⚠️ সতর্কতা: এই লেখকের অধীনে {toBengaliNumber(deleteConfirmTarget._count.articles)}টি প্রবন্ধ ও{' '}
                    {toBengaliNumber(deleteConfirmTarget._count.books)}টি বই রয়েছে। কন্টেন্ট সংযুক্ত থাকলে সিস্টেম ডিলিট প্রতিরোধ করবে।
                  </div>
                )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleDeleteAuthor}
                className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              >
                হ্যাঁ, নিশ্চিত মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                বাল্ক ডিলিট নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                নির্বাচিত <strong className="text-stone-800 dark:text-stone-200">{toBengaliNumber(selectedIds.length)}</strong> জন
                লেখক প্রোফাইল মুছে ফেলার অনুরোধ করা হয়েছে।
              </p>
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 text-xs text-left">
                ℹ️ <strong>নিরাপত্তা গার্ড:</strong> যে সকল লেখকের অধীনে বই বা প্রবন্ধ প্রকাশিত রয়েছে, ডাটাবেস অখণ্ডতা বজায় রাখতে তাদের প্রোফাইল সুরক্ষিত রাখা হবে।
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              >
                বাল্ক ডিলিট সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 11. ADD / EDIT AUTHOR FORM MODAL COMPONENT
// -------------------------------------------------------------
interface AuthorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  author?: AuthorItem | null;
  onSuccess: (message: string) => void;
}

function AuthorFormModal({ isOpen, onClose, author, onSuccess }: AuthorFormModalProps) {
  const isEditing = !!(author && author.id);
  const [activeTab, setActiveTab] = useState<'basic' | 'professional' | 'bio' | 'social' | 'seo'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(author?.name || '');
  const [nameEn, setNameEn] = useState(author?.nameEn || '');
  const [slug, setSlug] = useState(author?.slug || '');
  const [photoUrl, setPhotoUrl] = useState(author?.photoUrl || '');
  const [designation, setDesignation] = useState(author?.designation || '');
  const [email, setEmail] = useState(author?.email || '');
  const [phone, setPhone] = useState(author?.phone || '');
  const [bio, setBio] = useState(author?.bio || '');
  const [bioDetails, setBioDetails] = useState(author?.bioDetails || '');
  const [expertise, setExpertise] = useState(author?.expertise || '');
  const [workplace, setWorkplace] = useState(author?.workplace || '');
  const [education, setEducation] = useState(author?.education || '');
  const [experience, setExperience] = useState(author?.experience || '');
  const [awards, setAwards] = useState(author?.awards || '');
  const [facebook, setFacebook] = useState(author?.facebook || '');
  const [linkedin, setLinkedin] = useState(author?.linkedin || '');
  const [twitter, setTwitter] = useState(author?.twitter || '');
  const [instagram, setInstagram] = useState(author?.instagram || '');
  const [youtube, setYoutube] = useState(author?.youtube || '');
  const [website, setWebsite] = useState(author?.website || '');
  const [status, setStatus] = useState(author?.status || 'ACTIVE');
  const [isActive, setIsActive] = useState<boolean>(author?.isActive !== false);
  const [isFeatured, setIsFeatured] = useState<boolean>(!!author?.isFeatured);
  const [isVerified, setIsVerified] = useState<boolean>(!!author?.isVerified);
  const [seoTitle, setSeoTitle] = useState(author?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(author?.seoDescription || '');
  const [ogImage, setOgImage] = useState(author?.ogImage || '');

  // Auto-slug generator
  const handleNameBlur = () => {
    if (!slug) {
      const generated = (nameEn || name)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s\u0980-\u09FF-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  // Profile completion indicator
  const completionPercentage = useMemo(() => {
    let score = 0;
    const total = 10;
    if (name) score++;
    if (photoUrl) score++;
    if (designation) score++;
    if (email) score++;
    if (bio) score++;
    if (bioDetails) score++;
    if (expertise) score++;
    if (workplace || education) score++;
    if (website || facebook || linkedin) score++;
    if (seoTitle || seoDescription) score++;
    return Math.round((score / total) * 100);
  }, [name, photoUrl, designation, email, bio, bioDetails, expertise, workplace, education, website, facebook, linkedin, seoTitle, seoDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('লেখকের নাম দেওয়া আবশ্যক।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      nameEn: nameEn.trim() || null,
      slug: slug.trim() || undefined,
      photoUrl: photoUrl.trim() || null,
      designation: designation.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      bioDetails: bioDetails.trim() || null,
      expertise: expertise.trim() || null,
      workplace: workplace.trim() || null,
      education: education.trim() || null,
      experience: experience.trim() || null,
      awards: awards.trim() || null,
      facebook: facebook.trim() || null,
      linkedin: linkedin.trim() || null,
      twitter: twitter.trim() || null,
      instagram: instagram.trim() || null,
      youtube: youtube.trim() || null,
      website: website.trim() || null,
      status: status || 'ACTIVE',
      isActive: Boolean(isActive),
      isFeatured: Boolean(isFeatured),
      isVerified: Boolean(isVerified),
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      ogImage: ogImage.trim() || photoUrl.trim() || null,
    };

    try {
      const url = isEditing ? `/api/admin/authors/${author.id}` : '/api/admin/authors';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');

      onSuccess(data.message || 'লেখক সফলভাবে সংরক্ষিত হয়েছে।');
    } catch (err: any) {
      setErrorMessage(err.message || 'ত্রুটি ঘটেছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-shubban-gold/10 text-shubban-gold flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                {isEditing ? 'লেখক প্রোফাইল সম্পাদনা' : 'নতুন লেখক প্রোফাইল যোগ'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-stone-400">
                  প্রোফাইল পূর্ণতা: <strong className="text-shubban-gold">{toBengaliNumber(completionPercentage)}%</strong>
                </span>
                <div className="w-20 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-shubban-gold transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 text-xs font-semibold">
          {[
            { id: 'basic', label: 'প্রাথমিক তথ্য' },
            { id: 'professional', label: 'পেশাগত তথ্য' },
            { id: 'bio', label: 'জীবনী' },
            { id: 'social', label: 'সোশ্যাল মিডিয়া' },
            { id: 'seo', label: 'এসইও ও স্ট্যাটাস' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    লেখকের পূর্ণ নাম (বাংলা) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="যেমন: ড. মাহফুজুর রহমান"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ইংরেজি নাম (English Name)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Dr. Mahfuzur Rahman"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    স্লাগ (Profile URL Slug) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mahfuzur-rahman"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    পেশাগত পদবী (Designation)
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="যেমন: অধ্যাপক ও গবেষক"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>
              </div>

              {/* Profile Photo / Avatar URL with Preview */}
              {/* Author Photo with Central DAM Media Picker */}
              <MediaPickerInput
                label="প্রোফাইল ছবি (Avatar / Photo)"
                value={photoUrl}
                onChange={setPhotoUrl}
                folderSlug="authors-publishers"
                allowedTypes={['IMAGE']}
                placeholder="মিডিয়া লাইব্রেরি থেকে লেখকের ছবি নির্বাচন করুন..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ইমেইল ঠিকানা (Email Address)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="author@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ফোন নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  সংক্ষিপ্ত পরিচিতি (Short Bio)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="লেখকের সংক্ষিপ্ত ২-৩ লাইনের পরিচিতি..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFESSIONAL INFORMATION */}
          {activeTab === 'professional' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    বিশেষজ্ঞতা / ক্ষেত্র (Expertise)
                  </label>
                  <input
                    type="text"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="যেমন: তাফসির, আরবি ব্যাকরণ, ইতিহাস"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    প্রতিষ্ঠান / কর্মস্থল (Workplace / Org)
                  </label>
                  <input
                    type="text"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  শিক্ষাগত যোগ্যতা (Educational Qualification)
                </label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="যেমন: পিএইচডি (ইসলামিক স্টাডিজ), এম.এ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  পেশাগত অভিজ্ঞতা (Experience)
                </label>
                <textarea
                  rows={2}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="গবেষণা ও শিক্ষকতায় দীর্ঘ ১৫ বছরের অভিজ্ঞতা..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  পুরস্কার ও সম্মাননা (Awards & Achievements)
                </label>
                <input
                  type="text"
                  value={awards}
                  onChange={(e) => setAwards(e.target.value)}
                  placeholder="যেমন: জাতীয় সাহিত্য পুরস্কার, সেরা গবেষক সম্মাননা"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DETAILED BIOGRAPHY */}
          {activeTab === 'bio' && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  বিস্তারিত জীবনী ও অবদান (Detailed Biography)
                </label>
                <textarea
                  rows={8}
                  value={bioDetails}
                  onChange={(e) => setBioDetails(e.target.value)}
                  placeholder="লেখকের সম্পূর্ণ জীবনী, শিক্ষাজীবন, সাহিত্যকর্ম, ধর্মীয় গবেষণা এবং আন্তর্জাতিক অবদানের বিস্তারিত লিখুন..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30 leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ফেসবুক প্রোফাইল URL
                  </label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/username"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    লিঙ্কডইন প্রোফাইল URL
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    এক্স (টুইটার) URL
                  </label>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="https://x.com/username"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ইনস্টাগ্রাম URL
                  </label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/username"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ইউটিউব চ্যানেল URL
                  </label>
                  <input
                    type="url"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@channel"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ব্যক্তিগত ওয়েবসাইট URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SEO & STATUS */}
          {activeTab === 'seo' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    প্রোফাইল স্ট্যাটাস (Account Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setIsActive(e.target.value === 'ACTIVE');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  >
                    <option value="ACTIVE">সক্রিয় (Active)</option>
                    <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                    <option value="DRAFT">খসড়া (Draft)</option>
                    <option value="PENDING_REVIEW">পর্যালোচনাধীন (Pending Review)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">ভেরিফাইড ব্যাজ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">ফিচার্ড লেখক</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  এসইও মেটা শিরোনাম (SEO Title)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="যেমন: ড. মাহফুজুর রহমান | লেখক ও গবেষক প্রোফাইল - শুব্বান লাইব্রেরি"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  এসইও মেটা বিবরণ (Meta Description)
                </label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="গুগল সার্চ ফলাফলের জন্য আকর্ষণীয় ১৬০ অক্ষরের বিবরণ..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-shubban-green hover:bg-shubban-green/90 text-white shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : isEditing ? 'আপডেট করুন' : 'তৈরি করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 10. AUTHOR PROFILE DETAILS VIEW MODAL / DRAWER
// -------------------------------------------------------------
interface AuthorProfileModalProps {
  author: AuthorItem;
  onClose: () => void;
  onEdit: () => void;
  onManageArticles: () => void;
}

function AuthorProfileModal({
  author,
  onClose,
  onEdit,
  onManageArticles,
}: AuthorProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header Profile Hero */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-shubban-gold/50 flex-shrink-0">
              <img
                src={author.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                  {author.name}
                </h3>
                {author.isVerified && (
                  <span title="ভেরিফাইড লেখক">
                    <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </span>
                )}
                {author.isFeatured && (
                  <span title="ফিচার্ড লেখক">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {author.designation || 'নিবন্ধিত লেখক ও গবেষক'}
              </p>
              <span className="text-[11px] font-mono text-stone-400 block mt-0.5">/{author.slug}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">প্রকাশিত প্রবন্ধ</span>
            <span className="text-base font-serif font-bold text-sky-600 dark:text-sky-400">
              {toBengaliNumber(author._count?.articles || 0)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">প্রকাশিত বই</span>
            <span className="text-base font-serif font-bold text-amber-600 dark:text-amber-400">
              {toBengaliNumber(author._count?.books || 0)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">প্রোফাইল স্কোর</span>
            <span className="text-base font-serif font-bold text-emerald-600 dark:text-emerald-400">
              {toBengaliNumber(author.profileCompletion || 80)}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">স্ট্যাটাস</span>
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-1 block">
              {author.status}
            </span>
          </div>
        </div>

        {/* Biography & Professional Info */}
        <div className="space-y-3 text-xs">
          {author.bio && (
            <div>
              <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">পরিচিতি:</span>
              <p className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-400 leading-relaxed border border-stone-200/60 dark:border-stone-800">
                {author.bio}
              </p>
            </div>
          )}

          {author.expertise && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700 dark:text-stone-300">বিশেষজ্ঞতা:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                {author.expertise}
              </span>
            </div>
          )}

          {/* Social Links */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-400">যোগাযোগ ও লিঙ্ক:</span>
            <div className="flex items-center gap-2">
              {author.email && (
                <a
                  href={`mailto:${author.email}`}
                  title={author.email}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  title="ওয়েবসাইট"
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {author.facebook && (
                <a
                  href={author.facebook}
                  target="_blank"
                  title="ফেসবুক"
                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Link
              href={`/authors/${author.slug}`}
              target="_blank"
              className="text-xs font-semibold text-shubban-gold hover:underline flex items-center gap-1"
            >
              <span>পাবলিক পেজ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <span className="text-stone-300">|</span>
            <Link
              href={`/admin/authors/${author.id}`}
              className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
            >
              <span>পূর্ণাঙ্গ প্রোফাইল পেজ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onManageArticles}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>প্রবন্ধসমূহ ({toBengaliNumber(author._count?.articles || 0)})</span>
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-shubban-green text-white hover:bg-shubban-green/90 flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. AUTHOR ARTICLES MANAGEMENT & REASSIGN MODAL
// -------------------------------------------------------------
interface AuthorArticlesModalProps {
  author: AuthorItem;
  allAuthors: AuthorItem[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function AuthorArticlesModal({
  author,
  allAuthors,
  onClose,
  onSuccess,
}: AuthorArticlesModalProps) {
  const [articles, setArticles] = useState<AuthorArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [targetAuthorId, setTargetAuthorId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/authors/${author.id}/articles?status=${statusFilter}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.articles);
        }
      } catch (err) {
        console.error('Failed to load articles:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
  }, [author.id, statusFilter]);

  const toggleSelectArticle = (id: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleReassign = async () => {
    if (selectedArticleIds.length === 0 || !targetAuthorId) return;
    setIsReassigning(true);
    try {
      const res = await fetch(`/api/admin/authors/${author.id}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reassign',
          articleIds: selectedArticleIds,
          newAuthorId: targetAuthorId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'স্থানান্তর ব্যর্থ হয়েছে।');
      onSuccess(data.message);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              &quot;{author.name}&quot;-এর প্রবন্ধ ও প্রকাশনা ব্যবস্থাপনা
            </h3>
            <p className="text-[11px] text-stone-400">
              প্রবন্ধের তালিকা দেখুন অথবা অন্য লেখকের নামে স্থানান্তর (Reassign) করুন।
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span>স্ট্যাটাস ফিল্টার:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
            >
              <option value="all">সকল প্রবন্ধ</option>
              <option value="PUBLISHED">প্রকাশিত (Published)</option>
              <option value="DRAFT">খসড়া (Draft)</option>
              <option value="REVIEW">পর্যালোচনাধীন (Review)</option>
            </select>
          </div>
          <span className="text-stone-400">মোট {toBengaliNumber(articles.length)}টি প্রবন্ধ</span>
        </div>

        {/* Articles List */}
        <div className="max-h-72 overflow-y-auto border border-stone-200 dark:border-stone-800 rounded-xl divide-y divide-stone-100 dark:divide-stone-800">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-stone-400">প্রবন্ধ লোড হচ্ছে...</div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">কোনো প্রবন্ধ পাওয়া যায়নি।</div>
          ) : (
            articles.map((art) => (
              <div
                key={art.id}
                className="p-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-900/50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedArticleIds.includes(art.id)}
                    onChange={() => toggleSelectArticle(art.id)}
                    className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold cursor-pointer"
                  />
                  <div>
                    <h5 className="font-semibold text-stone-900 dark:text-stone-100">{art.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                      <span>/{art.slug}</span>
                      {art.category && <span>• {art.category.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      art.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {art.status}
                  </span>
                  <Link
                    href={`/articles/${art.slug}`}
                    target="_blank"
                    className="text-stone-400 hover:text-shubban-gold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reassign Toolbar */}
        {selectedArticleIds.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in">
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              {toBengaliNumber(selectedArticleIds.length)}টি প্রবন্ধ অন্য লেখকের নামে স্থানান্তর:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={targetAuthorId}
                onChange={(e) => setTargetAuthorId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex-1 sm:w-48"
              >
                <option value="">— লেখক নির্বাচন করুন —</option>
                {allAuthors
                  .filter((a) => a.id !== author.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleReassign}
                disabled={isReassigning || !targetAuthorId}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold disabled:opacity-50 whitespace-nowrap"
              >
                {isReassigning ? 'স্থানান্তর হচ্ছে...' : 'স্থানান্তর করুন'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

