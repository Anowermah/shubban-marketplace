'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Layers,
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
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  Filter,
  Sparkles,
  MoveUp,
  MoveDown,
  ExternalLink,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Save,
  Check,
  CheckSquare,
  Square,
  Calendar,
  Hash,
  Info,
  FolderPlus,
  BookOpen,
  SlidersHorizontal,
  Compass,
  Bookmark,
  Heart,
  Shield,
  Award,
  GraduationCap,
  Flame,
  Globe,
  Tag,
  Clock,
  HelpCircle,
  HelpCircle as QuestionIcon,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface CategorySubItem {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  type: string;
  parentId?: string | null;
  isActive: boolean;
  displayOrder: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count: {
    books: number;
    articles: number;
    magazines: number;
    questions: number;
  };
}

export interface CategoryItem extends CategorySubItem {
  subcategories: CategorySubItem[];
  subcategoryCount: number;
  totalProducts: number;
}

export interface CategoryStats {
  totalCategories: number;
  totalSubcategories: number;
  activeCategories: number;
  inactiveCategories: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParentOption {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
}

interface AdminCategoriesManagerProps {
  initialCategories: CategoryItem[];
  initialAllParents: ParentOption[];
  initialStats: CategoryStats;
  initialPagination: PaginationInfo;
}

// Available Lucide icon previews for selection
const POPULAR_ICONS = [
  'FolderTree',
  'Layers',
  'BookOpen',
  'Compass',
  'Bookmark',
  'Sparkles',
  'Heart',
  'Shield',
  'Award',
  'GraduationCap',
  'Flame',
  'Globe',
  'Tag',
  'HelpCircle',
];

export default function AdminCategoriesManager({
  initialCategories,
  initialAllParents,
  initialStats,
  initialPagination,
}: AdminCategoriesManagerProps) {
  // State
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [allParents, setAllParents] = useState<ParentOption[]>(initialAllParents);
  const [stats, setStats] = useState<CategoryStats>(initialStats);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, inactive
  const [parentFilter, setParentFilter] = useState<string>('all'); // all, root, or specific parent id
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, 7days, 30days, thisYear
  const [sortBy, setSortBy] = useState<string>('displayOrder'); // displayOrder, name, createdAt, updatedAt
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [limitPerPage, setLimitPerPage] = useState<string>('25');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Expanded subcategories map (key: categoryId -> boolean)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalCategory, setEditModalCategory] = useState<CategorySubItem | null>(null);
  const [viewModalCategory, setViewModalCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<CategorySubItem | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch categories from API
  const fetchCategories = useCallback(
    async (pageToLoad = currentPage, overrideLimit = limitPerPage) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageToLoad),
          limit: overrideLimit,
          search: searchQuery,
          status: statusFilter,
          parentId: parentFilter,
          dateFilter: dateFilter,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });

        const res = await fetch(`/api/admin/categories?${params.toString()}`);
        if (!res.ok) throw new Error('ক্যাটাগরি ডেটা লোড করতে ব্যর্থ হয়েছে।');
        const data = await res.json();

        if (data.success) {
          setCategories(data.categories);
          setAllParents(data.allParents);
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
    [currentPage, limitPerPage, searchQuery, statusFilter, parentFilter, dateFilter, sortBy, sortOrder]
  );

  // Debounced search trigger
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchCategories(1);
    }, 350);
  };

  // Re-fetch when filters/sorting/pagination change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchCategories(currentPage);
  }, [statusFilter, parentFilter, dateFilter, sortBy, sortOrder, limitPerPage, currentPage]);

  // Expand / Collapse all
  const toggleAllExpanded = () => {
    const anyCollapsed = categories.some((c) => c.subcategories.length > 0 && !expandedRows[c.id]);
    const nextState: Record<string, boolean> = {};
    categories.forEach((c) => {
      if (c.subcategories.length > 0) {
        nextState[c.id] = anyCollapsed;
      }
    });
    setExpandedRows(nextState);
  };

  const toggleRow = (catId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Selection
  const allCurrentIds = useMemo(() => {
    const ids: string[] = [];
    categories.forEach((c) => {
      ids.push(c.id);
      c.subcategories.forEach((s) => ids.push(s.id));
    });
    return ids;
  }, [categories]);

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

  // Instant Active Toggle
  const handleToggleActive = async (cat: CategorySubItem) => {
    const newStatus = !cat.isActive;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === cat.id) {
          return { ...c, isActive: newStatus };
        }
        return {
          ...c,
          subcategories: c.subcategories.map((sub) =>
            sub.id === cat.id ? { ...sub, isActive: newStatus } : sub
          ),
        };
      })
    );

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error('স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।');
      showToast(
        `"${cat.name}" সফলভাবে ${newStatus ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'} করা হয়েছে।`
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        activeCategories: newStatus ? prev.activeCategories + 1 : prev.activeCategories - 1,
        inactiveCategories: newStatus ? prev.inactiveCategories - 1 : prev.inactiveCategories + 1,
      }));
    } catch (err: any) {
      // Revert optimistic
      fetchCategories();
      showToast(err.message, 'error');
    }
  };

  // Instant In-line Display Order Update
  const handleDisplayOrderChange = async (catId: string, newOrder: number) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === catId) return { ...c, displayOrder: newOrder };
        return {
          ...c,
          subcategories: c.subcategories.map((s) =>
            s.id === catId ? { ...s, displayOrder: newOrder } : s
          ),
        };
      })
    );

    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: newOrder }),
      });
      if (!res.ok) throw new Error('ক্রম সংখ্যা আপডেট ব্যর্থ হয়েছে।');
    } catch (err: any) {
      showToast(err.message, 'error');
      fetchCategories();
    }
  };

  // Single Delete
  const handleDeleteCategory = async () => {
    if (!deleteConfirmTarget) return;
    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirmTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ক্যাটাগরি মুছতে ব্যর্থ হয়েছে।');
      }

      showToast(data.message || 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।');
      setDeleteConfirmTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmTarget.id));
      fetchCategories();
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
      const res = await fetch('/api/admin/categories/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, categoryIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'বাল্ক একশন সম্পন্ন করা যায়নি।');

      showToast(data.message);
      setSelectedIds([]);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExecuteBulkDelete = async () => {
    try {
      const res = await fetch('/api/admin/categories/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', categoryIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'বাল্ক ডিলিট ব্যর্থ হয়েছে।');

      showToast(data.message);
      setBulkDeleteModalOpen(false);
      setSelectedIds([]);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCSV = (onlySelected = false) => {
    const listToExport = onlySelected
      ? categories
          .flatMap((c) => [c, ...c.subcategories])
          .filter((item) => selectedIds.includes(item.id))
      : categories.flatMap((c) => [c, ...c.subcategories]);

    if (listToExport.length === 0) {
      showToast('এক্সপোর্ট করার জন্য কোনো ক্যাটাগরি পাওয়া যায়নি।', 'error');
      return;
    }

    const headers = [
      'ID',
      'Name (বাংলা নাম)',
      'English Name',
      'Slug',
      'Parent ID',
      'Type',
      'Display Order',
      'Status',
      'Books Count',
      'Created At',
      'Updated At',
    ];

    const rows = listToExport.map((cat) => [
      cat.id,
      `"${(cat.name || '').replace(/"/g, '""')}"`,
      `"${(cat.nameEn || '').replace(/"/g, '""')}"`,
      cat.slug,
      cat.parentId || 'ROOT',
      cat.type,
      cat.displayOrder,
      cat.isActive ? 'ACTIVE' : 'INACTIVE',
      cat._count?.books || 0,
      formatBengaliDate(cat.createdAt),
      formatBengaliDate(cat.updatedAt),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shubban_categories_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('ক্যাটাগরি রিপোর্ট সিএসভি ফরম্যাটে সফলভাবে ডাউনলোড হয়েছে।');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setParentFilter('all');
    setDateFilter('all');
    setSortBy('displayOrder');
    setSortOrder('asc');
    setCurrentPage(1);
    fetchCategories(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    parentFilter !== 'all' ||
    dateFilter !== 'all' ||
    sortBy !== 'displayOrder' ||
    sortOrder !== 'asc';

  // Helper for Render Icons
  const renderCategoryIcon = (iconName?: string | null, size = 18) => {
    const cls = `w-[${size}px] h-[${size}px]`;
    switch (iconName) {
      case 'FolderTree':
        return <FolderTree className="w-4 h-4 text-amber-500" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-emerald-500" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-indigo-500" />;
      case 'Bookmark':
        return <Bookmark className="w-4 h-4 text-rose-500" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'Heart':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-teal-500" />;
      case 'Award':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-sky-500" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'Globe':
        return <Globe className="w-4 h-4 text-cyan-500" />;
      case 'Tag':
        return <Tag className="w-4 h-4 text-purple-500" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4 text-green-500" />;
      default:
        return <FolderTree className="w-4 h-4 text-stone-400" />;
    }
  };

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
              <FolderTree className="w-6 h-6 text-shubban-gold" />
            </span>
            <span>ক্যাটাগরি ও উপ-বিভাগ ব্যবস্থাপনা (Categories & Subcategories)</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            শুব্বান লাইব্রেরির সকল বিভাগ, উপ-বিভাগ, ক্রমবিন্যাস ও ক্যাটালগ স্তর সেন্ট্রাল ড্যাশবোর্ড থেকে নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchCategories()}
            disabled={isLoading}
            title="তথ্য রিফ্রেশ করুন"
            className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-shubban-gold' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => handleExportCSV(false)}
            title="সম্পূর্ণ ক্যাটালগ সিএসভি এক্সপোর্ট"
            className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>সিএসভি এক্সপোর্ট</span>
          </button>

          <button
            onClick={() => window.print()}
            title="ক্যাটাগরি তালিকা প্রিন্ট করুন"
            className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            <span>প্রিন্ট</span>
          </button>

          <button
            onClick={() => {
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-shubban-green hover:bg-shubban-green/90 text-white shadow-sm flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ক্যাটাগরি তৈরি</span>
          </button>
        </div>
      </div>

      {/* 2. Dashboard Summary Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Categories */}
        <div
          onClick={() => {
            setParentFilter('root');
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all cursor-pointer shadow-sm hover:shadow-md ${
            parentFilter === 'root'
              ? 'border-shubban-gold ring-2 ring-shubban-gold/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-shubban-gold/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">মূল ক্যাটাগরি</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {toBengaliNumber(stats.totalCategories)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">টি প্রধান বিভাগ</span>
          </div>
        </div>

        {/* Total Subcategories */}
        <div
          onClick={() => {
            setParentFilter('all');
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">উপ-বিভাগসমূহ</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {toBengaliNumber(stats.totalSubcategories)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">টি সাব-ক্যাটাগরি</span>
          </div>
        </div>

        {/* Active Categories */}
        <div
          onClick={() => {
            setStatusFilter('active');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">সক্রিয় বিভাগ</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
              {toBengaliNumber(stats.activeCategories)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">টি লাইভ প্রদর্শন</span>
          </div>
        </div>

        {/* Inactive Categories */}
        <div
          onClick={() => {
            setStatusFilter('inactive');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'inactive'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-stone-200 dark:border-stone-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">নিষ্ক্রিয় / খসড়া</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-serif font-bold text-rose-600 dark:text-rose-400">
              {toBengaliNumber(stats.inactiveCategories)}
            </span>
            <span className="text-xs text-stone-400 ml-1.5">টি বন্ধ বা অপ্রকাশিত</span>
          </div>
        </div>
      </div>

      {/* 4. Advanced Search & Multi-Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ক্যাটাগরি বা উপ-বিভাগের নাম, স্লাগ বা বিবরণ দিয়ে খুঁজুন..."
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

          {/* Quick Filters Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="active">সক্রিয় (Active)</option>
              <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>

            {/* Parent Hierarchy Filter */}
            <select
              value={parentFilter}
              onChange={(e) => handleFilterChange(setParentFilter, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30 max-w-[160px] truncate"
            >
              <option value="all">সকল স্তর (Root & Sub)</option>
              <option value="root">কেবল প্রধান বিভাগ (Root)</option>
              {allParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
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
              <option value="displayOrder">ক্রমবিন্যাস (Order)</option>
              <option value="name">নাম অনুযায়ী (Name)</option>
              <option value="createdAt">নতুন সংযোজিত (Newest)</option>
              <option value="updatedAt">সম্প্রতি সংশোধিত (Updated)</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                setCurrentPage(1);
              }}
              title={sortOrder === 'asc' ? 'ছোট থেকে বড়' : 'বড় থেকে ছোট'}
              className="p-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Expand / Collapse All Subcategories */}
            <button
              onClick={toggleAllExpanded}
              title="সব উপ-বিভাগ সম্প্রসারণ / সংক্ষেপণ"
              className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-shubban-gold" />
              <span>উপ-বিভাগ ভিউ</span>
            </button>

            {/* Reset Filters Button */}
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

      {/* 10. Modern Table View */}
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

                {/* 2. Image / Icon */}
                <th className="py-3 px-2 w-12 text-center">আইকন</th>

                {/* 3. Name & Slug */}
                <th className="py-3 px-4 min-w-[220px]">ক্যাটাগরির নাম ও স্লাগ</th>

                {/* 4. Subcategory Count */}
                <th className="py-3 px-3 text-center">উপ-বিভাগ</th>

                {/* 5. Products Count */}
                <th className="py-3 px-3 text-center">মোট পণ্য</th>

                {/* 6. Display Order */}
                <th className="py-3 px-3 w-28 text-center">প্রদর্শন ক্রম</th>

                {/* 7. Status */}
                <th className="py-3 px-3 text-center">স্ট্যাটাস</th>

                {/* 8. Created Date */}
                <th className="py-3 px-3 text-stone-500 hidden md:table-cell">তৈরি</th>

                {/* 9. Updated Date */}
                <th className="py-3 px-3 text-stone-500 hidden lg:table-cell">হালনাগাদ</th>

                {/* 10. Actions */}
                <th className="py-3 px-4 text-right min-w-[150px]">কার্যক্রম</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-3.5 text-center">
                      <div className="w-4 h-4 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="w-8 h-8 bg-stone-200 dark:bg-stone-800 rounded-lg mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-40 bg-stone-200 dark:bg-stone-800 rounded mb-1.5" />
                      <div className="h-3 w-24 bg-stone-100 dark:bg-stone-900 rounded" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="h-4 w-8 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="h-4 w-10 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="h-6 w-16 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="h-5 w-14 bg-stone-200 dark:bg-stone-800 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-3 hidden md:table-cell">
                      <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
                    </td>
                    <td className="py-4 px-3 hidden lg:table-cell">
                      <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 w-20 bg-stone-200 dark:bg-stone-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-shubban-gold flex items-center justify-center mx-auto">
                        <FolderTree className="w-7 h-7" />
                      </div>
                      <h4 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
                        কোনো ক্যাটাগরি পাওয়া যায়নি
                      </h4>
                      <p className="text-xs text-stone-500">
                        অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো বিভাগ বা উপ-বিভাগ নেই। নতুন ক্যাটাগরি তৈরি করতে পারেন।
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-shubban-gold/10 text-shubban-gold hover:bg-shubban-gold/20 transition-colors"
                        >
                          ফিল্টার রিসেট করুন
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const isExpanded = !!expandedRows[cat.id];
                  const isSelected = selectedIds.includes(cat.id);
                  const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Main Category Row */}
                      <tr
                        className={`hover:bg-stone-50/70 dark:hover:bg-stone-900/50 transition-colors ${
                          isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        {/* 1. Checkbox */}
                        <td className="py-3.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(cat.id)}
                            className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold cursor-pointer"
                          />
                        </td>

                        {/* 2. Image / Icon */}
                        <td className="py-3.5 px-2 text-center">
                          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto overflow-hidden border border-stone-200/60 dark:border-stone-700/60">
                            {cat.image ? (
                              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              renderCategoryIcon(cat.icon, 16)
                            )}
                          </div>
                        </td>

                        {/* 3. Name & Slug */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {hasSubcategories && (
                              <button
                                onClick={() => toggleRow(cat.id)}
                                title={isExpanded ? 'সংক্ষেপণ করুন' : 'উপ-বিভাগগুলো দেখুন'}
                                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-shubban-gold" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-shubban-gold transition-colors">
                                  {cat.name}
                                </span>
                                {cat.nameEn && (
                                  <span className="text-[11px] text-stone-400 font-sans hidden sm:inline">
                                    ({cat.nameEn})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono text-stone-400">/{cat.slug}</span>
                                <Link
                                  href={`/categories/${cat.slug}`}
                                  target="_blank"
                                  title="স্টোরফ্রন্টে সরাসরি দেখুন"
                                  className="text-stone-400 hover:text-shubban-gold transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Subcategory Count */}
                        <td className="py-3.5 px-3 text-center">
                          {hasSubcategories ? (
                            <button
                              onClick={() => toggleRow(cat.id)}
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 hover:bg-amber-100 transition-colors"
                            >
                              {toBengaliNumber(cat.subcategoryCount)}টি সাব
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400">—</span>
                          )}
                        </td>

                        {/* 5. Products Count */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {toBengaliNumber(cat.totalProducts || cat._count.books)}টি
                          </span>
                        </td>

                        {/* 6. Display Order */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="number"
                            defaultValue={cat.displayOrder}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val !== cat.displayOrder) {
                                handleDisplayOrderChange(cat.id, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                if (!isNaN(val)) {
                                  handleDisplayOrderChange(cat.id, val);
                                  (e.target as HTMLInputElement).blur();
                                }
                              }
                            }}
                            className="w-14 text-center py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                          />
                        </td>

                        {/* 7. Status */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleActive(cat)}
                            title={cat.isActive ? 'ক্লিক করে নিষ্ক্রিয় করুন' : 'ক্লিক করে সক্রিয় করুন'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                              cat.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cat.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                              }`}
                            />
                            <span>{cat.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                          </button>
                        </td>

                        {/* 8. Created Date */}
                        <td suppressHydrationWarning className="py-3.5 px-3 text-stone-500 text-[11px] hidden md:table-cell">
                          {formatBengaliDate(cat.createdAt)}
                        </td>

                        {/* 9. Updated Date */}
                        <td suppressHydrationWarning className="py-3.5 px-3 text-stone-400 text-[11px] hidden lg:table-cell">
                          {formatBengaliDate(cat.updatedAt)}
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditModalCategory({
                                  ...cat,
                                  parentId: cat.id,
                                  name: '',
                                  nameEn: '',
                                  slug: '',
                                  description: '',
                                  icon: 'FolderTree',
                                  image: '',
                                  type: 'BOOK',
                                  isActive: true,
                                  displayOrder: (cat.subcategories?.length || 0) + 1,
                                  seoTitle: '',
                                  seoDescription: '',
                                  createdAt: new Date(),
                                  updatedAt: new Date(),
                                  _count: { books: 0, articles: 0, magazines: 0, questions: 0 },
                                });
                              }}
                              title="উপ-বিভাগ যোগ করুন"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            >
                              <FolderPlus className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setViewModalCategory(cat)}
                              title="বিস্তারিত দেখুন"
                              className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditModalCategory(cat)}
                              title="সম্পাদনা করুন"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmTarget(cat)}
                              title="মুছে ফেলুন"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* 6. Nested Subcategories Rows (Smooth Expand/Collapse) */}
                      {isExpanded &&
                        hasSubcategories &&
                        cat.subcategories.map((sub, sIdx) => {
                          const isSubSelected = selectedIds.includes(sub.id);
                          const isLastSub = sIdx === cat.subcategories.length - 1;

                          return (
                            <tr
                              key={sub.id}
                              className={`bg-stone-50/40 dark:bg-stone-900/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors ${
                                isSubSelected ? 'bg-amber-50/50 dark:bg-amber-950/30' : ''
                              }`}
                            >
                              {/* 1. Sub Checkbox */}
                              <td className="py-2.5 px-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSubSelected}
                                  onChange={() => toggleSelectOne(sub.id)}
                                  className="w-3.5 h-3.5 rounded text-shubban-green focus:ring-shubban-gold cursor-pointer"
                                />
                              </td>

                              {/* 2. Sub Icon */}
                              <td className="py-2.5 px-2 text-center">
                                <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-500">
                                  {renderCategoryIcon(sub.icon, 14)}
                                </div>
                              </td>

                              {/* 3. Sub Name with Tree Connector */}
                              <td className="py-2.5 px-4 pl-10">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-stone-300 dark:text-stone-600 select-none">
                                    {isLastSub ? '└─ ' : '├─ '}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-xs text-stone-800 dark:text-stone-200">
                                        {sub.name}
                                      </span>
                                      {sub.nameEn && (
                                        <span className="text-[10px] text-stone-400">({sub.nameEn})</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono text-stone-400 block">/{sub.slug}</span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. Sub Subcategory Count (none) */}
                              <td className="py-2.5 px-3 text-center text-stone-300 text-[10px]">—</td>

                              {/* 5. Sub Products Count */}
                              <td className="py-2.5 px-3 text-center">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                  {toBengaliNumber(sub._count.books)}টি
                                </span>
                              </td>

                              {/* 6. Sub Display Order */}
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  defaultValue={sub.displayOrder}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val !== sub.displayOrder) {
                                      handleDisplayOrderChange(sub.id, val);
                                    }
                                  }}
                                  className="w-12 text-center py-0.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300"
                                />
                              </td>

                              {/* 7. Sub Status */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => handleToggleActive(sub)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    sub.isActive
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800'
                                  }`}
                                >
                                  <span
                                    className={`w-1 h-1 rounded-full ${
                                      sub.isActive ? 'bg-emerald-500' : 'bg-stone-400'
                                    }`}
                                  />
                                  <span>{sub.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                                </button>
                              </td>

                              {/* 8. Sub Created Date */}
                              <td suppressHydrationWarning className="py-2.5 px-3 text-stone-400 text-[10px] hidden md:table-cell">
                                {formatBengaliDate(sub.createdAt)}
                              </td>

                              {/* 9. Sub Updated Date */}
                              <td suppressHydrationWarning className="py-2.5 px-3 text-stone-400 text-[10px] hidden lg:table-cell">
                                {formatBengaliDate(sub.updatedAt)}
                              </td>

                              {/* 10. Sub Actions */}
                              <td className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() =>
                                      setViewModalCategory({
                                        ...sub,
                                        subcategories: [],
                                        subcategoryCount: 0,
                                        totalProducts: sub._count.books,
                                      })
                                    }
                                    title="বিস্তারিত দেখুন"
                                    className="p-1 rounded text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditModalCategory(sub)}
                                    title="উপ-বিভাগ সম্পাদনা"
                                    className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmTarget(sub)}
                                    title="উপ-বিভাগ ডিলিট"
                                    className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
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
            itemName="ক্যাটাগরি"
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setLimitPerPage(s.toString());
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      </div>

      {/* 7. Floating Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 dark:bg-stone-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700/80 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2 pr-3 border-r border-stone-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-shubban-gold animate-ping" />
            <span>
              <strong className="text-shubban-gold font-bold">{toBengaliNumber(selectedIds.length)}</strong>টি
              ক্যাটাগরি নির্বাচিত
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>সক্রিয় করুন</span>
            </button>

            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
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

      {/* CREATE CATEGORY MODAL */}
      {createModalOpen && (
        <CategoryFormModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          allParents={allParents}
          onSuccess={(msg) => {
            showToast(msg);
            setCreateModalOpen(false);
            fetchCategories();
          }}
        />
      )}

      {/* EDIT CATEGORY MODAL */}
      {editModalCategory && (
        <CategoryFormModal
          isOpen={!!editModalCategory}
          category={editModalCategory}
          onClose={() => setEditModalCategory(null)}
          allParents={allParents}
          onSuccess={(msg) => {
            showToast(msg);
            setEditModalCategory(null);
            fetchCategories();
          }}
        />
      )}

      {/* VIEW CATEGORY DETAILS MODAL */}
      {viewModalCategory && (
        <CategoryDetailsModal
          category={viewModalCategory}
          onClose={() => setViewModalCategory(null)}
          onEdit={() => {
            setEditModalCategory(viewModalCategory);
            setViewModalCategory(null);
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
                ক্যাটাগরি মুছে ফেলার নিশ্চয়তা
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                আপনি কি নিশ্চিত যে আপনি{' '}
                <strong className="text-stone-800 dark:text-stone-200">&quot;{deleteConfirmTarget.name}&quot;</strong>{' '}
                ক্যাটাগরিটি মুছে ফেলতে চান?
              </p>
              {deleteConfirmTarget._count && deleteConfirmTarget._count.books > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  ⚠️ সতর্কতা: এই ক্যাটাগরিতে {toBengaliNumber(deleteConfirmTarget._count.books)}টি পণ্য সংযুক্ত রয়েছে। পণ্য সংযুক্ত থাকলে সিস্টেম ক্যাটাগরি ডিলিট প্রতিরোধ করবে।
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
                onClick={handleDeleteCategory}
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
                নির্বাচিত <strong className="text-stone-800 dark:text-stone-200">{toBengaliNumber(selectedIds.length)}</strong>টি
                ক্যাটাগরি মুছে ফেলা হবে।
              </p>
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 text-xs text-left">
                ℹ️ <strong>নিরাপত্তা গার্ড:</strong> যে সকল ক্যাটাগরিতে বই/পণ্য বা সক্রিয় উপ-বিভাগ সংযুক্ত রয়েছে, ডাটাবেস অখণ্ডতা বজায় রাখতে সেগুলো সুরক্ষিত রাখা হবে।
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
// CATEGORY CREATE / EDIT FORM MODAL COMPONENT
// -------------------------------------------------------------
interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategorySubItem | null;
  allParents: ParentOption[];
  onSuccess: (message: string) => void;
}

function CategoryFormModal({
  isOpen,
  onClose,
  category,
  allParents,
  onSuccess,
}: CategoryFormModalProps) {
  const isEditing = !!(category && category.id && category.name);
  const [activeTab, setActiveTab] = useState<'basic' | 'seo'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(category?.name || '');
  const [nameEn, setNameEn] = useState(category?.nameEn || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [parentId, setParentId] = useState(category?.parentId || '');
  const [description, setDescription] = useState(category?.description || '');
  const [icon, setIcon] = useState(category?.icon || 'FolderTree');
  const [image, setImage] = useState(category?.image || '');
  const [displayOrder, setDisplayOrder] = useState<number>(category?.displayOrder || 0);
  const [isActive, setIsActive] = useState<boolean>(category?.isActive !== false);
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(category?.seoDescription || '');

  // Auto slug generation helper
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('ক্যাটাগরির বাংলা নাম দেওয়া আবশ্যক।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      nameEn: nameEn.trim() || null,
      slug: slug.trim() || undefined,
      parentId: parentId || null,
      description: description.trim() || null,
      icon: icon || null,
      image: image.trim() || null,
      displayOrder: Number(displayOrder) || 0,
      isActive: Boolean(isActive),
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
    };

    try {
      const url = isEditing
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }

      onSuccess(data.message || 'ক্যাটাগরি সফলভাবে সংরক্ষিত হয়েছে।');
    } catch (err: any) {
      setErrorMessage(err.message || 'অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-shubban-gold/10 text-shubban-gold flex items-center justify-center">
              {isEditing ? <Edit className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                {isEditing ? 'ক্যাটাগরি সম্পাদনা করুন' : 'নতুন ক্যাটাগরি তৈরি'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isEditing
                  ? 'বিদ্যমান ক্যাটাগরি বা উপ-বিভাগের তথ্য পরিবর্তন করুন'
                  : 'শপে নতুন বিভাগ বা উপ-বিভাগ সংযুক্ত করুন'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'basic'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            সাধারণ তথ্য (General)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'seo'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            এসইও ও মেটাডাটা (SEO)
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {activeTab === 'basic' && (
            <div className="space-y-3.5">
              {/* Category Name (Bangla) */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ক্যাটাগরির নাম (বাংলা) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="যেমন: তাফসির ও কুরআন অধ্যয়ন"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>

              {/* Name En & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ইংরেজি নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Quran & Tafsir"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    স্লাগ (URL Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="quran-tafsir"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>
              </div>

              {/* Parent Category & Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    মূল ক্যাটাগরি (Parent Category)
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  >
                    <option value="">— প্রধান বিভাগ (Root Level) —</option>
                    {allParents
                      .filter((p) => !category || p.id !== category.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.slug})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    প্রদর্শন ক্রম (Display Order)
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>
              </div>

              {/* Icon Picker & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    আইকন নির্বাচন (Icon)
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  >
                    {POPULAR_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    কভার ছবি URL (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ক্যাটাগরির সংক্ষিপ্ত বিবরণ লিখুন..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                    সক্রিয় স্ট্যাটাস (Active Status)
                  </span>
                  <span className="text-[11px] text-stone-400">
                    সক্রিয় থাকলে শপ ও সার্চ ফলাফলে ব্যবহারকারীরা এই ক্যাটাগরি দেখতে পারবেন।
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded text-shubban-green focus:ring-shubban-gold cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  এসইও মেটা শিরোনাম (SEO Meta Title)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="যেমন: তাফসির ও কুরআন অধ্যয়ন বিষয়ক সেরা বইসমূহ | শুব্বান লাইব্রেরি"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  এসইও মেটা বিবরণ (SEO Meta Description)
                </label>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="গুগল সার্চ ফলাফলের জন্য ১৬০ অক্ষরের আকর্ষণীয় বিবরণ লিখুন..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold/30"
                />
              </div>

              {/* SERP Preview Simulation */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                  গুগল সার্চ প্রিভিউ (Google Search Preview)
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block truncate">
                  {seoTitle || `${name || 'ক্যাটাগরির নাম'} | শুব্বান লাইব্রেরি`}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-mono">
                  https://atrbd.com/categories/{slug || 'category-slug'}
                </span>
                <p className="text-[11px] text-stone-500 line-clamp-2">
                  {seoDescription ||
                    description ||
                    'পবিত্র কুরআন, হাদিস ও নির্ভরযোগ্য ইসলামিক বই সংগ্রহ করুন শুব্বান লাইব্রেরি থেকে।'}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
// CATEGORY DETAILS VIEW MODAL COMPONENT
// -------------------------------------------------------------
interface CategoryDetailsModalProps {
  category: CategoryItem;
  onClose: () => void;
  onEdit: () => void;
}

function CategoryDetailsModal({ category, onClose, onEdit }: CategoryDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {category.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    category.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                  }`}
                >
                  {category.isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                </span>
              </div>
              <span className="text-xs font-mono text-stone-400">/{category.slug}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">সংযুক্ত বই</span>
            <span className="text-base font-serif font-bold text-stone-800 dark:text-stone-200">
              {toBengaliNumber(category._count?.books || 0)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">উপ-বিভাগ</span>
            <span className="text-base font-serif font-bold text-stone-800 dark:text-stone-200">
              {toBengaliNumber(category.subcategories?.length || 0)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">প্রদর্শন ক্রম</span>
            <span className="text-base font-serif font-bold text-stone-800 dark:text-stone-200">
              {toBengaliNumber(category.displayOrder)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
            <span className="text-[10px] text-stone-400 block font-semibold">ক্যাটাগরি টাইপ</span>
            <span className="text-xs font-mono font-bold text-shubban-gold mt-1 block">
              {category.type}
            </span>
          </div>
        </div>

        {/* Description & Metadata */}
        <div className="space-y-3 text-xs">
          {category.description && (
            <div>
              <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">বিবরণ:</span>
              <p className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-400 leading-relaxed border border-stone-200/60 dark:border-stone-800">
                {category.description}
              </p>
            </div>
          )}

          {category.subcategories && category.subcategories.length > 0 && (
            <div>
              <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                উপ-বিভাগসমূহ ({toBengaliNumber(category.subcategories.length)}টি):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {category.subcategories.map((sub) => (
                  <span
                    key={sub.id}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs border border-stone-200 dark:border-stone-700 flex items-center gap-1.5"
                  >
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-stone-400">
                      ({toBengaliNumber(sub._count?.books || 0)} বই)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div suppressHydrationWarning className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex flex-wrap justify-between gap-2">
            <span>তৈরি: {formatBengaliDate(category.createdAt)}</span>
            <span>সর্বশেষ পরিবর্তন: {formatBengaliDate(category.updatedAt)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
          <Link
            href={`/categories/${category.slug}`}
            target="_blank"
            className="text-xs font-semibold text-shubban-gold hover:underline flex items-center gap-1"
          >
            <span>স্টোরফ্রন্ট ভিজিট</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
            >
              বন্ধ করুন
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-shubban-green text-white hover:bg-shubban-green/90 flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>সম্পাদনা করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

