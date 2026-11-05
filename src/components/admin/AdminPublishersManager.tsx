'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
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
  AlertTriangle,
  X,
  Save,
  Check,
  Calendar,
  FileText,
  BookOpen,
  Briefcase,
  Globe,
  Share2,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  Clock,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  MapPin,
  MoveRight,
  ArrowRightLeft,
  CheckSquare,
  Square,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import MediaPickerInput from '@/components/media/MediaPickerInput';

export interface PublisherItem {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  logoUrl?: string | null;
  publisherType?: string | null;
  description?: string | null;
  descriptionDetails?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  website?: string | null;
  country?: string | null;
  division?: string | null;
  city?: string | null;
  postalCode?: string | null;
  address?: string | null;
  regNumber?: string | null;
  binNumber?: string | null;
  establishedYear?: number | null;
  organizationType?: string | null;
  mainCategory?: string | null;
  specialization?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  totalPublications?: number;
  profileCompletion?: number;
  _count: {
    books: number;
    magazines: number;
  };
}

export interface PublisherStats {
  totalPublishers: number;
  activePublishers: number;
  inactivePublishers: number;
  totalPublishedContent: number;
}

interface AdminPublishersManagerProps {
  initialPublishers: PublisherItem[];
  initialStats: PublisherStats;
  initialTotalCount: number;
}

const PUBLISHER_TYPES: { [key: string]: { label: string; bg: string; text: string } } = {
  COMMERCIAL: { label: 'বাণিজ্যিক প্রকাশনী', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' },
  ISLAMIC_FOUNDATION: { label: 'ইসলামিক ফাউন্ডেশন', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
  ACADEMIC_PRESS: { label: 'প্রাতিষ্ঠানিক প্রেস', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300' },
  GOVERNMENT: { label: 'সরকারি প্রকাশনা', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
  INDEPENDENT: { label: 'স্বাধীন / স্বতন্ত্র', bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-700 dark:text-stone-300' },
};

const ORG_TYPES: { [key: string]: string } = {
  LIMITED: 'লিমিটেড কোম্পানি',
  PROPRIETORSHIP: 'একমালিকানা (Proprietorship)',
  TRUST: 'ট্রাস্ট ও ওয়াকফ',
  SOCIETY: 'সোসাইটি / সমিতি',
  NGO: 'এনজিও / অলাভজনক সংস্থা',
};

export default function AdminPublishersManager({
  initialPublishers,
  initialStats,
  initialTotalCount,
}: AdminPublishersManagerProps) {
  // Main Data States
  const [publishers, setPublishers] = useState<PublisherItem[]>(initialPublishers);
  const [stats, setStats] = useState<PublisherStats>(initialStats);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<string>('25');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawers States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<PublisherItem | null>(null);
  const [viewingPublisher, setViewingPublisher] = useState<PublisherItem | null>(null);
  const [reassignModalPublisher, setReassignModalPublisher] = useState<PublisherItem | null>(null);
  const [deletingPublisher, setDeletingPublisher] = useState<PublisherItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Form State for Create / Edit Modal (Tabs A-F)
  const [formTab, setFormTab] = useState<'basic' | 'contact' | 'address' | 'business' | 'social' | 'seo'>('basic');
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    slug: '',
    logoUrl: '',
    publisherType: 'COMMERCIAL',
    description: '',
    descriptionDetails: '',
    contactPerson: '',
    email: '',
    phone: '',
    altPhone: '',
    website: '',
    country: 'বাংলাদেশ',
    division: '',
    city: '',
    postalCode: '',
    address: '',
    regNumber: '',
    binNumber: '',
    establishedYear: '',
    organizationType: 'LIMITED',
    mainCategory: '',
    specialization: '',
    facebook: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    youtube: '',
    status: 'ACTIVE',
    isActive: true,
    isVerified: false,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
  });

  // Calculate dynamic Profile Completion Score for the current form
  const formCompletionScore = useMemo(() => {
    let score = 0;
    const totalCriteria = 10;
    if (formData.name.trim()) score++;
    if (formData.logoUrl.trim()) score++;
    if (formData.description.trim()) score++;
    if (formData.contactPerson.trim()) score++;
    if (formData.email.trim() || formData.phone.trim()) score++;
    if (formData.address.trim() || formData.city.trim()) score++;
    if (formData.website.trim()) score++;
    if (formData.regNumber.trim() || formData.establishedYear) score++;
    if (formData.facebook.trim() || formData.linkedin.trim() || formData.youtube.trim()) score++;
    if (formData.seoTitle.trim() || formData.seoDescription.trim()) score++;
    return Math.round((score / totalCriteria) * 100);
  }, [formData]);

  // Publications Reassignment Modal State
  const [reassignTargetId, setReassignTargetId] = useState('');
  const [reassignAll, setReassignAll] = useState(true);
  const [reassigning, setReassigning] = useState(false);
  const [publisherPublications, setPublisherPublications] = useState<{
    books: any[];
    magazines: any[];
  }>({ books: [], magazines: [] });
  const [loadingPubs, setLoadingPubs] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Publishers Data from API
  const fetchPublishers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('publisherType', typeFilter);
      if (verificationFilter !== 'all') params.set('verification', verificationFilter);
      if (featuredFilter !== 'all') params.set('isFeatured', featuredFilter === 'featured' ? 'true' : 'false');
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', page.toString());
      params.set('limit', limit);

      const res = await fetch(`/api/admin/publishers?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPublishers(data.publishers);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setTotalCount(data.pagination.total);
      } else {
        showToast(data.error || 'প্রকাশক তালিকা লোড করতে ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter, verificationFilter, featuredFilter, dateFilter, sortBy, sortOrder, page, limit, showToast]);

  // Trigger fetch when query params change
  useEffect(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setVerificationFilter('all');
    setFeaturedFilter('all');
    setDateFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  // Row selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(publishers.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle quick status
  const handleToggleStatus = async (pub: PublisherItem) => {
    const nextStatus = pub.status === 'ACTIVE' || pub.isActive ? 'INACTIVE' : 'ACTIVE';
    const nextIsActive = nextStatus === 'ACTIVE';

    // Optimistic UI update
    setPublishers((prev) =>
      prev.map((item) =>
        item.id === pub.id ? { ...item, status: nextStatus, isActive: nextIsActive } : item
      )
    );

    try {
      const res = await fetch(`/api/admin/publishers/${pub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, isActive: nextIsActive }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে', 'error');
        fetchPublishers();
      } else {
        showToast(`"${pub.name}" প্রকাশনীর স্ট্যাটাস পরিবর্তিত হয়েছে।`);
        // update stats
        setStats((prev) => ({
          ...prev,
          activePublishers: nextIsActive ? prev.activePublishers + 1 : prev.activePublishers - 1,
          inactivePublishers: nextIsActive ? prev.inactivePublishers - 1 : prev.inactivePublishers + 1,
        }));
      }
    } catch {
      showToast('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে', 'error');
      fetchPublishers();
    }
  };

  // Toggle quick verification
  const handleToggleVerification = async (pub: PublisherItem) => {
    const nextVerified = !pub.isVerified;

    setPublishers((prev) =>
      prev.map((item) => (item.id === pub.id ? { ...item, isVerified: nextVerified } : item))
    );

    try {
      const res = await fetch(`/api/admin/publishers/${pub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: nextVerified }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'ভেরিফিকেশন আপডেট ব্যর্থ হয়েছে', 'error');
        fetchPublishers();
      } else {
        showToast(`ভেরিফিকেশন স্ট্যাটাস ${nextVerified ? 'অনুমোদিত' : 'প্রত্যাহার'} হয়েছে।`);
      }
    } catch {
      showToast('ভেরিফিকেশন আপডেট করতে সমস্যা হয়েছে', 'error');
      fetchPublishers();
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      setIsBulkDeleteModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/admin/publishers/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'ব্যাচ অপারেশন সফল হয়েছে');
        setSelectedIds([]);
        fetchPublishers();
      } else {
        showToast(data.error || 'ব্যাচ অপারেশন সম্পন্ন করা যায়নি', 'error');
      }
    } catch {
      showToast('সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে', 'error');
    }
  };

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = async () => {
    try {
      const res = await fetch('/api/admin/publishers/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
        fetchPublishers();
      } else {
        showToast(data.error || 'ডিলিট অপারেশন ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      showToast('সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে', 'error');
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPublisher(null);
    setFormTab('basic');
    setFormData({
      name: '',
      nameEn: '',
      slug: '',
      logoUrl: '',
      publisherType: 'COMMERCIAL',
      description: '',
      descriptionDetails: '',
      contactPerson: '',
      email: '',
      phone: '',
      altPhone: '',
      website: '',
      country: 'বাংলাদেশ',
      division: '',
      city: '',
      postalCode: '',
      address: '',
      regNumber: '',
      binNumber: '',
      establishedYear: '',
      organizationType: 'LIMITED',
      mainCategory: '',
      specialization: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      youtube: '',
      status: 'ACTIVE',
      isActive: true,
      isVerified: false,
      isFeatured: false,
      seoTitle: '',
      seoDescription: '',
      ogImage: '',
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (pub: PublisherItem) => {
    setEditingPublisher(pub);
    setFormTab('basic');
    setFormData({
      name: pub.name || '',
      nameEn: pub.nameEn || '',
      slug: pub.slug || '',
      logoUrl: pub.logoUrl || '',
      publisherType: pub.publisherType || 'COMMERCIAL',
      description: pub.description || '',
      descriptionDetails: pub.descriptionDetails || '',
      contactPerson: pub.contactPerson || '',
      email: pub.email || '',
      phone: pub.phone || '',
      altPhone: pub.altPhone || '',
      website: pub.website || '',
      country: pub.country || 'বাংলাদেশ',
      division: pub.division || '',
      city: pub.city || '',
      postalCode: pub.postalCode || '',
      address: pub.address || '',
      regNumber: pub.regNumber || '',
      binNumber: pub.binNumber || '',
      establishedYear: pub.establishedYear ? pub.establishedYear.toString() : '',
      organizationType: pub.organizationType || 'LIMITED',
      mainCategory: pub.mainCategory || '',
      specialization: pub.specialization || '',
      facebook: pub.facebook || '',
      linkedin: pub.linkedin || '',
      twitter: pub.twitter || '',
      instagram: pub.instagram || '',
      youtube: pub.youtube || '',
      status: pub.status || 'ACTIVE',
      isActive: pub.isActive ?? true,
      isVerified: pub.isVerified ?? false,
      isFeatured: pub.isFeatured ?? false,
      seoTitle: pub.seoTitle || '',
      seoDescription: pub.seoDescription || '',
      ogImage: pub.ogImage || '',
    });
    setIsCreateModalOpen(true);
  };

  // Auto-generate slug from name if creating
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, name: val };
      if (!editingPublisher && (!prev.slug || prev.slug.startsWith('publisher-'))) {
        const generated = val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s\u0980-\u09FF-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        updated.slug = generated;
      }
      return updated;
    });
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('প্রকাশনীর নাম প্রদান করা বাধ্যতামূলক', 'error');
      setFormTab('basic');
      return;
    }

    try {
      const url = editingPublisher
        ? `/api/admin/publishers/${editingPublisher.id}`
        : '/api/admin/publishers';
      const method = editingPublisher ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear, 10) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || (editingPublisher ? 'প্রকাশনী আপডেট হয়েছে' : 'নতুন প্রকাশনী তৈরি হয়েছে'));
        setIsCreateModalOpen(false);
        setEditingPublisher(null);
        fetchPublishers();
      } else {
        showToast(data.error || 'অপারেশন সম্পন্ন করা যায়নি', 'error');
      }
    } catch {
      showToast('সংরক্ষণে ত্রুটি দেখা দিয়েছে', 'error');
    }
  };

  // Single Delete Handler
  const handleDeleteClick = (pub: PublisherItem) => {
    setDeletingPublisher(pub);
  };

  const handleConfirmSingleDelete = async () => {
    if (!deletingPublisher) return;

    try {
      const res = await fetch(`/api/admin/publishers/${deletingPublisher.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'প্রকাশনী সফলভাবে মুছে ফেলা হয়েছে।');
        setDeletingPublisher(null);
        fetchPublishers();
      } else {
        showToast(data.error || 'প্রকাশনী মুছে ফেলা যায়নি।', 'error');
      }
    } catch {
      showToast('মুছে ফেলতে সমস্যা হয়েছে।', 'error');
    }
  };

  // Publications Reassignment Modal Handlers
  const handleOpenReassignModal = async (pub: PublisherItem) => {
    setReassignModalPublisher(pub);
    setReassignTargetId('');
    setReassignAll(true);
    setLoadingPubs(true);

    try {
      const res = await fetch(`/api/admin/publishers/${pub.id}/publications`);
      const data = await res.json();
      if (data.success) {
        setPublisherPublications({
          books: data.books || [],
          magazines: data.magazines || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPubs(false);
    }
  };

  const handleExecuteReassignment = async () => {
    if (!reassignModalPublisher || !reassignTargetId) {
      showToast('লক্ষ্য প্রকাশনী নির্বাচন করুন', 'error');
      return;
    }

    setReassigning(true);
    try {
      const res = await fetch(`/api/admin/publishers/${reassignModalPublisher.id}/publications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPublisherId: reassignTargetId,
          reassignAll: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setReassignModalPublisher(null);
        fetchPublishers();
      } else {
        showToast(data.error || 'প্রকাশনা স্থানান্তর করতে সমস্যা হয়েছে', 'error');
      }
    } catch {
      showToast('সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে', 'error');
    } finally {
      setReassigning(false);
    }
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    if (publishers.length === 0) {
      showToast('এক্সপোর্ট করার মতো কোনো তথ্য নেই', 'info');
      return;
    }

    const headers = [
      'আইডি',
      'প্রকাশনীর নাম',
      'ইংরেজি নাম',
      'স্লাগ',
      'ধরণ',
      'যোগাযোগকারী',
      'ইমেইল',
      'ফোন',
      'শহর / জেলা',
      'দেশ',
      'বইয়ের সংখ্যা',
      'ম্যাগাজিনের সংখ্যা',
      'মোট প্রকাশনা',
      'ভেরিফিকেশন স্ট্যাটাস',
      'স্ট্যাটাস',
      'যুক্ত করার তারিখ',
    ];

    const rows = publishers.map((p) => [
      `"${p.id}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.nameEn || '').replace(/"/g, '""')}"`,
      `"${p.slug}"`,
      `"${PUBLISHER_TYPES[p.publisherType || 'COMMERCIAL']?.label || p.publisherType || ''}"`,
      `"${(p.contactPerson || '').replace(/"/g, '""')}"`,
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.city || ''}"`,
      `"${p.country || ''}"`,
      p._count?.books || 0,
      p._count?.magazines || 0,
      (p._count?.books || 0) + (p._count?.magazines || 0),
      p.isVerified ? 'ভেরিফাইড' : 'আনভেরিফাইড',
      p.isActive || p.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়',
      formatBengaliDate(p.createdAt),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shubban-publishers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('প্রকাশক তালিকা CSV ফরম্যাটে ডাউনলোড হয়েছে।');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Total pages calculation
  const totalPages = Math.ceil(totalCount / (limit === 'all' ? totalCount || 1 : parseInt(limit, 10))) || 1;
  const startItem = totalCount === 0 ? 0 : (page - 1) * (limit === 'all' ? totalCount : parseInt(limit, 10)) + 1;
  const endItem = limit === 'all' ? totalCount : Math.min(page * parseInt(limit, 10), totalCount);

  return (
    <div className="space-y-6 font-bengali pb-20">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-stone-800 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <HelpCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-shubban-gold/15 text-shubban-gold flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>প্রকাশনী সংস্থা ও প্রেস ব্যবস্থাপনা</span>
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-shubban-gold/15 text-shubban-gold font-semibold">
                  Publishers Central
                </span>
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                মোট {toBengaliNumber(stats.totalPublishers)}টি অনুমোদিত প্রকাশনা প্রতিষ্ঠান ও তাদের সংযুক্ত গ্রন্থ সম্ভার পরিচালনা করুন।
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchPublishers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-shubban-gold' : ''}`} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="CSV এক্সপোর্ট"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">প্রিন্ট</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold/90 text-stone-900 font-semibold shadow-md shadow-shubban-gold/20 flex items-center gap-2 text-xs transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন প্রকাশনী যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Publishers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">মোট প্রকাশনী সংস্থা</p>
            <h3 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
              {toBengaliNumber(stats.totalPublishers)}
            </h3>
            <span className="text-[11px] text-stone-400 mt-1 inline-block">তালিকাভুক্ত সকল প্রতিষ্ঠান</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Publishers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">সক্রিয় প্রকাশনী</p>
            <h3 className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-1">
              {toBengaliNumber(stats.activePublishers)}
            </h3>
            <span className="text-[11px] text-emerald-600/80 mt-1 inline-block">লাইভ ক্যাটালগে দৃশ্যমান</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Inactive Publishers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">নিষ্ক্রিয় / স্থগিত প্রকাশনী</p>
            <h3 className="text-2xl font-bold font-serif text-rose-600 dark:text-rose-400 mt-1">
              {toBengaliNumber(stats.inactivePublishers)}
            </h3>
            <span className="text-[11px] text-rose-500/80 mt-1 inline-block">স্থগিত বা অপ্রকাশিত</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Published Content */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">মোট প্রকাশিত কনটেন্ট</p>
            <h3 className="text-2xl font-bold font-serif text-shubban-gold mt-1">
              {toBengaliNumber(stats.totalPublishedContent)}
            </h3>
            <span className="text-[11px] text-stone-400 mt-1 inline-block">বই ও সাময়িকী সংযুক্ত</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-shubban-gold/15 text-shubban-gold flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Advanced Filter, Search & Display Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        {/* Row 1: Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Live Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, স্লাগ, যোগাযোগকারী বা শহর দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold transition-colors"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="ACTIVE">সক্রিয় (Active)</option>
              <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
              <option value="PENDING_VERIFICATION">অপেক্ষমাণ ভেরিফিকেশন</option>
              <option value="SUSPENDED">স্থগিত (Suspended)</option>
            </select>
          </div>

          {/* Publisher Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold transition-colors"
            >
              <option value="all">সব ধরণ (Type)</option>
              <option value="COMMERCIAL">বাণিজ্যিক প্রকাশনী</option>
              <option value="ISLAMIC_FOUNDATION">ইসলামিক ফাউন্ডেশন</option>
              <option value="ACADEMIC_PRESS">প্রাতিষ্ঠানিক প্রেস</option>
              <option value="GOVERNMENT">সরকারি প্রকাশনা</option>
              <option value="INDEPENDENT">স্বাধীন / স্বতন্ত্র</option>
            </select>
          </div>

          {/* Verification Filter */}
          <div>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold transition-colors"
            >
              <option value="all">ভেরিফিকেশন: সব</option>
              <option value="verified">ভেরিফাইড (Verified)</option>
              <option value="unverified">আনভেরিফাইড (Unverified)</option>
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <select
              value={featuredFilter}
              onChange={(e) => {
                setFeaturedFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold transition-colors"
            >
              <option value="all">ফিচার্ড: সব</option>
              <option value="featured">ফিচার্ড প্রকাশনী</option>
              <option value="regular">সাধারণ প্রকাশনী</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date, Sort, Limit & Reset Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5 text-stone-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>তারিখ:</span>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none"
              >
                <option value="all">সব সময়</option>
                <option value="7days">গত ৭ দিন</option>
                <option value="30days">গত ৩০ দিন</option>
                <option value="thisYear">এই বছর</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 text-stone-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>সাজান:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none"
              >
                <option value="createdAt">তৈরির তারিখ</option>
                <option value="name">নামানুসারে (A-Z)</option>
                <option value="updatedAt">সর্বশেষ আপডেট</option>
                <option value="publications">প্রকাশনার সংখ্যা</option>
              </select>
              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1 rounded border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono"
                title={sortOrder === 'asc' ? 'আরোহী ক্রম (Ascending)' : 'অবরোহী ক্রম (Descending)'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Items Per Page */}
            <div className="flex items-center gap-1.5 text-stone-500">
              <span>প্রতি পাতায়:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none"
              >
                <option value="10">১০টি</option>
                <option value="25">২৫টি</option>
                <option value="50">৫০টি</option>
                <option value="100">১০০টি</option>
                <option value="all">সব</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Button */}
          <button
            onClick={handleResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ফিল্টার রিসেট</span>
          </button>
        </div>
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 p-3.5 rounded-2xl bg-stone-900 text-white shadow-2xl flex flex-wrap items-center justify-between gap-3 border border-stone-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-shubban-gold text-stone-900 flex items-center justify-center font-bold text-xs">
              {toBengaliNumber(selectedIds.length)}
            </span>
            <span className="text-xs text-stone-200 font-medium">
              টি প্রকাশনী নির্বাচিত হয়েছে
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>সক্রিয় করুন</span>
            </button>

            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>নিষ্ক্রিয় করুন</span>
            </button>

            <button
              onClick={() => handleBulkAction('verify')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ভেরিফাই করুন</span>
            </button>

            <button
              onClick={() => handleBulkAction('feature')}
              className="px-3 py-1.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold/90 text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              <span>ফিচার্ড করুন</span>
            </button>

            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছে ফেলুন</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Main 12-Column Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold select-none">
                {/* 1. Selection Checkbox */}
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={publishers.length > 0 && selectedIds.length === publishers.length}
                    onChange={handleSelectAll}
                    className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold cursor-pointer"
                  />
                </th>

                {/* 2. Logo */}
                <th className="py-3.5 px-3 w-14 text-center">লোগো</th>

                {/* 3. Name & Slug */}
                <th className="py-3.5 px-4 min-w-[200px]">প্রকাশনীর নাম ও স্লাগ</th>

                {/* 4. Type */}
                <th className="py-3.5 px-3 min-w-[130px]">ধরণ (Type)</th>

                {/* 5. Contact Person */}
                <th className="py-3.5 px-3 min-w-[130px]">যোগাযোগকারী</th>

                {/* 6. Contact Details */}
                <th className="py-3.5 px-3 min-w-[160px]">যোগাযোগ মাধ্যম</th>

                {/* 7. Location */}
                <th className="py-3.5 px-3 min-w-[120px]">অবস্থান</th>

                {/* 8. Publications Count */}
                <th className="py-3.5 px-3 text-center min-w-[110px]">প্রকাশনা</th>

                {/* 9. Verification Badge */}
                <th className="py-3.5 px-3 text-center min-w-[110px]">ভেরিফিকেশন</th>

                {/* 10. Status Switch */}
                <th className="py-3.5 px-3 text-center min-w-[90px]">স্ট্যাটাস</th>

                {/* 11. Created Date */}
                <th className="py-3.5 px-4 min-w-[120px]">যুক্তের তারিখ</th>

                {/* 12. Actions */}
                <th className="py-3.5 px-4 text-right min-w-[150px]">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {loading && publishers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-stone-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-shubban-gold mb-2" />
                    <span>প্রকাশক তালিকা লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : publishers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-stone-500">
                    <Building2 className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700 dark:text-stone-300">কোনো প্রকাশনী সংস্থা পাওয়া যায়নি।</p>
                    <p className="text-xs text-stone-400 mt-1">অনুসন্ধান বা ফিল্টার শর্ত পরিবর্তন করে চেষ্টা করুন।</p>
                  </td>
                </tr>
              ) : (
                publishers.map((pub) => {
                  const isSelected = selectedIds.includes(pub.id);
                  const typeMeta = PUBLISHER_TYPES[pub.publisherType || 'COMMERCIAL'] || {
                    label: pub.publisherType || 'বাণিজ্যিক',
                    bg: 'bg-stone-100 dark:bg-stone-800',
                    text: 'text-stone-700 dark:text-stone-300',
                  };
                  const totalPubs = (pub._count?.books || 0) + (pub._count?.magazines || 0);

                  return (
                    <tr
                      key={pub.id}
                      className={`hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors ${
                        isSelected ? 'bg-shubban-gold/5 dark:bg-shubban-gold/10' : ''
                      }`}
                    >
                      {/* 1. Selection Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(pub.id)}
                          className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold cursor-pointer"
                        />
                      </td>

                      {/* 2. Logo */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center mx-auto shadow-sm">
                          {pub.logoUrl ? (
                            <img src={pub.logoUrl} alt={pub.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                      </td>

                      {/* 3. Name & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm">
                              {pub.name}
                            </span>
                            {pub.isFeatured && (
                              <span
                                title="ফিচার্ড প্রকাশনী"
                                className="inline-flex items-center text-amber-500"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              </span>
                            )}
                          </div>
                          {pub.nameEn && (
                            <p className="text-[11px] text-stone-400 font-sans">{pub.nameEn}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                              /{pub.slug}
                            </span>
                            {pub.profileCompletion !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  pub.profileCompletion >= 80
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : pub.profileCompletion >= 50
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                }`}
                                title="প্রোফাইল সম্পূর্ণতা"
                              >
                                {toBengaliNumber(pub.profileCompletion)}% তথ্য
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Type */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${typeMeta.bg} ${typeMeta.text}`}>
                          {typeMeta.label}
                        </span>
                      </td>

                      {/* 5. Contact Person */}
                      <td className="py-3.5 px-3 text-stone-700 dark:text-stone-300">
                        {pub.contactPerson ? (
                          <div className="font-medium text-xs">
                            <p className="truncate max-w-[120px]">{pub.contactPerson}</p>
                            {pub.establishedYear && (
                              <span className="text-[10px] text-stone-400">
                                স্থা: {toBengaliNumber(pub.establishedYear)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px] italic">নির্ধারিত নয়</span>
                        )}
                      </td>

                      {/* 6. Contact Details */}
                      <td className="py-3.5 px-3 text-stone-600 dark:text-stone-400">
                        <div className="space-y-0.5 text-[11px]">
                          {pub.email && (
                            <a
                              href={`mailto:${pub.email}`}
                              className="flex items-center gap-1 hover:text-shubban-gold truncate max-w-[150px]"
                              title={pub.email}
                            >
                              <Mail className="w-3 h-3 text-stone-400 flex-shrink-0" />
                              <span className="truncate">{pub.email}</span>
                            </a>
                          )}
                          {pub.phone && (
                            <a
                              href={`tel:${pub.phone}`}
                              className="flex items-center gap-1 hover:text-shubban-gold"
                            >
                              <Phone className="w-3 h-3 text-stone-400 flex-shrink-0" />
                              <span>{toBengaliNumber(pub.phone)}</span>
                            </a>
                          )}
                          {pub.website && (
                            <a
                              href={pub.website}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span>ওয়েবসাইট</span>
                            </a>
                          )}
                          {!pub.email && !pub.phone && !pub.website && (
                            <span className="text-stone-400 text-[11px] italic">—</span>
                          )}
                        </div>
                      </td>

                      {/* 7. Location */}
                      <td className="py-3.5 px-3 text-stone-600 dark:text-stone-400 text-xs">
                        {pub.city || pub.country ? (
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-stone-800 dark:text-stone-200">{pub.city || '—'}</p>
                              <p className="text-[10px] text-stone-400">{pub.country || 'বাংলাদেশ'}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">অনুল্লিখিত</span>
                        )}
                      </td>

                      {/* 8. Publications Count */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenReassignModal(pub)}
                          className="group inline-flex flex-col items-center px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 transition-colors"
                          title="প্রকাশনা ব্যবস্থাপনা ও স্থানান্তর"
                        >
                          <span className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold">
                            {toBengaliNumber(totalPubs)}টি
                          </span>
                          <span className="text-[9px] text-stone-500">
                            বই: {toBengaliNumber(pub._count?.books || 0)} | ম্যগ: {toBengaliNumber(pub._count?.magazines || 0)}
                          </span>
                        </button>
                      </td>

                      {/* 9. Verification Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleVerification(pub)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            pub.isVerified
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200'
                          }`}
                          title="ভেরিফিকেশন টগল করতে ক্লিক করুন"
                        >
                          <ShieldCheck className={`w-3.5 h-3.5 ${pub.isVerified ? 'text-emerald-600' : 'text-stone-400'}`} />
                          <span>{pub.isVerified ? 'ভেরিফাইড' : 'আনভেরিফাইড'}</span>
                        </button>
                      </td>

                      {/* 10. Status Switch */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(pub)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            pub.status === 'ACTIVE' || pub.isActive ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
                          }`}
                          title={pub.status === 'ACTIVE' || pub.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              pub.status === 'ACTIVE' || pub.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {pub.status === 'ACTIVE' || pub.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </p>
                      </td>

                      {/* 11. Created Date (Hydration Safe) */}
                      <td className="py-3.5 px-4 text-stone-500 text-[11px]" suppressHydrationWarning>
                        {formatBengaliDate(pub.createdAt)}
                      </td>

                      {/* 12. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Dedicated Profile */}
                          <Link
                            href={`/admin/publishers/${pub.id}`}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                            title="বিস্তারিত প্রোফাইল ও ক্যাটালগ"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                          </Link>

                          {/* Quick Drawer View */}
                          <button
                            onClick={() => setViewingPublisher(pub)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                            title="সরাসরি ওভারভিউ"
                          >
                            <FileText className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                          </button>

                          {/* Edit Modal */}
                          <button
                            onClick={() => handleOpenEditModal(pub)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                            title="সম্পাদনা করুন"
                          >
                            <Edit className="w-3.5 h-3.5 text-shubban-gold" />
                          </button>

                          {/* Delete Action with Safety Guard */}
                          <button
                            onClick={() => handleDeleteClick(pub)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition-colors"
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

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="text-stone-500 font-medium">
            দেখানো হচ্ছে <span className="font-bold text-stone-800 dark:text-stone-200">{toBengaliNumber(startItem)}</span> থেকে{' '}
            <span className="font-bold text-stone-800 dark:text-stone-200">{toBengaliNumber(endItem)}</span> (মোট{' '}
            <span className="font-bold text-stone-800 dark:text-stone-200">{toBengaliNumber(totalCount)}</span>টি প্রকাশনী)
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="প্রথম পাতা"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="পূর্ববর্তী পাতা"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Numbered Page Badges */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber = page - 2 + i;
                if (page < 3) pageNumber = i + 1;
                if (pageNumber > totalPages) return null;
                if (pageNumber < 1) return null;

                const isCurrent = pageNumber === page;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors ${
                      isCurrent
                        ? 'bg-shubban-gold text-stone-900 shadow-sm'
                        : 'border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {toBengaliNumber(pageNumber)}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="পরবর্তী পাতা"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="শেষ পাতা"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT PUBLISHER MODAL (Structured Tabs A-F) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-shubban-gold/15 text-shubban-gold flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                    {editingPublisher ? 'প্রকাশনী সংস্থা সম্পাদনা' : 'নতুন প্রকাশনী সংস্থা নিবন্ধন'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    প্রয়োজনীয় তথ্য দিয়ে ক্যাটালগ প্রোফাইল পরিপূর্ণ করুন।
                  </p>
                </div>
              </div>

              {/* Profile Completion Indicator */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-stone-400">প্রোফাইল সম্পূর্ণতা</span>
                  <p className="font-bold text-xs text-shubban-gold">{toBengaliNumber(formCompletionScore)}%</p>
                </div>
                <div className="w-16 h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-shubban-gold rounded-full transition-all duration-300"
                    style={{ width: `${formCompletionScore}%` }}
                  />
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto text-xs font-semibold px-4 bg-stone-50/50 dark:bg-stone-950/40">
              <button
                type="button"
                onClick={() => setFormTab('basic')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  formTab === 'basic'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ক. প্রাথমিক তথ্য</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('contact')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  formTab === 'contact'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>খ. যোগাযোগ</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('address')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  formTab === 'address'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>গ. ঠিকানা ও অবস্থান</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('business')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  formTab === 'business'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>ঘ. প্রাতিষ্ঠানিক তথ্য</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('social')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  formTab === 'social'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>ঙ. সোশ্যাল মিডিয়া</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('seo')}
                className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  formTab === 'seo'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>চ. এসইও ও স্ট্যাটাস</span>
              </button>
            </div>

            {/* Modal Body / Tab Contents */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* TAB 1: BASIC INFO */}
              {formTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        প্রকাশনীর নাম (বাংলায়) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="উদা: ঐতিহ্য প্রকাশনী, ইসলামি ফাউন্ডেশন"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Name English */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        প্রকাশনীর নাম (ইংরেজিতে)
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                        placeholder="e.g. Oitijjho Prokashoni"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Slug */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        ইউআরএল স্লাগ (Slug)
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="oitijjho-prokashoni"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 font-mono text-stone-600 dark:text-stone-300 focus:outline-none focus:border-shubban-gold"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        লিংক: /books?publisher={formData.slug || 'slug'}
                      </span>
                    </div>

                    {/* Publisher Type */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        প্রকাশনীর ধরণ
                      </label>
                      <select
                        value={formData.publisherType}
                        onChange={(e) => setFormData({ ...formData, publisherType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      >
                        <option value="COMMERCIAL">বাণিজ্যিক প্রকাশনী (Commercial)</option>
                        <option value="ISLAMIC_FOUNDATION">ইসলামিক ফাউন্ডেশন / গবেষণা প্রতিষ্ঠান</option>
                        <option value="ACADEMIC_PRESS">প্রাতিষ্ঠানিক প্রেস (Academic / University)</option>
                        <option value="GOVERNMENT">সরকারি প্রকাশনা সংস্থা</option>
                        <option value="INDEPENDENT">স্বাধীন / স্বতন্ত্র প্রকাশনী</option>
                      </select>
                    </div>
                  </div>

                  {/* Logo URL with Central DAM Media Picker */}
                  <MediaPickerInput
                    label="লোগো ইমেজ লিঙ্ক (Publisher Logo)"
                    value={formData.logoUrl}
                    onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                    folderSlug="authors-publishers"
                    allowedTypes={['IMAGE']}
                    placeholder="মিডিয়া লাইব্রেরি থেকে প্রকাশনীর লোগো নির্বাচন করুন..."
                  />

                  {/* Short Description */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      সংক্ষিপ্ত পরিচিতি
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="প্রকাশনীর সংক্ষিপ্ত পরিচয় (১-২ বাক্যে)..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      বিস্তারিত বিবরণ ও ঐতিহ্য
                    </label>
                    <textarea
                      rows={4}
                      value={formData.descriptionDetails}
                      onChange={(e) => setFormData({ ...formData, descriptionDetails: e.target.value })}
                      placeholder="প্রতিষ্ঠানের ইতিহাস, মূল দর্শন ও কার্যক্রম সম্পর্কে বিস্তারিত বিবরণ..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACT INFO */}
              {formTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact Person */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        দায়িত্বপ্রাপ্ত ব্যক্তি / স্বত্বাধিকারী
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="উদা: মুহাম্মদ ইকবাল হোসাইন (পরিচালক)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Official Email */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        অফিসিয়াল ইমেইল
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@publisher.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        প্রাথমিক ফোন নম্বর
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+880 1700 000000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Alt Phone */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        বিকল্প ফোন নম্বর (হটলাইন)
                      </label>
                      <input
                        type="tel"
                        value={formData.altPhone}
                        onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                        placeholder="+880 2 9560000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  {/* Official Website */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      অফিসিয়াল ওয়েবসাইট
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.examplepublisher.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: ADDRESS & LOCATION */}
              {formTab === 'address' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        দেশ (Country)
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="বাংলাদেশ"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Division */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        বিভাগ (Division)
                      </label>
                      <input
                        type="text"
                        value={formData.division}
                        onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                        placeholder="ঢাকা"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* City / District */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        শহর / জেলা (City / District)
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="ঢাকা, বাংলাবাজার"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        পোস্টাল কোড (Postal Code)
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="১১০০"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  {/* Full Address */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      পূর্ণ ঠিকানা (বইবাজার বা হেড অফিস)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="৩৮/২ক, বাংলাবাজার, ঢাকা-১১০০"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: BUSINESS INFO */}
              {formTab === 'business' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Reg Number */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        রেজিস্ট্রেশন নম্বর / ট্রেড লাইসেন্স
                      </label>
                      <input
                        type="text"
                        value={formData.regNumber}
                        onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                        placeholder="TR-DH-849204"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* BIN / TIN */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        BIN / TIN নম্বর
                      </label>
                      <input
                        type="text"
                        value={formData.binNumber}
                        onChange={(e) => setFormData({ ...formData, binNumber: e.target.value })}
                        placeholder="002948201-0101"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Established Year */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        প্রতিষ্ঠার সাল (Established Year)
                      </label>
                      <input
                        type="number"
                        min="1800"
                        max="2099"
                        value={formData.establishedYear}
                        onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                        placeholder="উদা: 1995"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Organization Type */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        প্রতিষ্ঠানের আইনি রূপ (Organization Type)
                      </label>
                      <select
                        value={formData.organizationType}
                        onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      >
                        <option value="LIMITED">লিমিটেড কোম্পানি</option>
                        <option value="PROPRIETORSHIP">একমালিকানা (Proprietorship)</option>
                        <option value="TRUST">ট্রাস্ট ও ওয়াকফ</option>
                        <option value="SOCIETY">সোসাইটি / সমিতি</option>
                        <option value="NGO">এনজিও / অলাভজনক সংস্থা</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Main Category */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        মূল ক্যাটাগরি / ঘরানা
                      </label>
                      <input
                        type="text"
                        value={formData.mainCategory}
                        onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value })}
                        placeholder="উদা: কুরআন ও তাফসীর, সাহিত্য ও ইতিহাস"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Specialization */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        বিশেষত্ব (Specialization)
                      </label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="উদা: ক্লাসিক্যাল ইসলামিক পাণ্ডুলিপি গবেষণা"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SOCIAL LINKS */}
              {formTab === 'social' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Facebook */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        ফেসবুক পেজ (Facebook Page URL)
                      </label>
                      <input
                        type="url"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="https://facebook.com/publisherpage"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        লিংকডইন (LinkedIn Profile)
                      </label>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/company/publisher"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Twitter/X */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        টুইটার / এক্স (X / Twitter URL)
                      </label>
                      <input
                        type="url"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        placeholder="https://x.com/publisher"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>

                    {/* Instagram */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                        ইনস্টাগ্রাম (Instagram URL)
                      </label>
                      <input
                        type="url"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/publisher"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                      />
                    </div>
                  </div>

                  {/* YouTube */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      ইউটিউব চ্যানেল (YouTube Channel)
                    </label>
                    <input
                      type="url"
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="https://youtube.com/@publisherchannel"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: SEO & STATUS */}
              {formTab === 'seo' && (
                <div className="space-y-4">
                  {/* Status & Badges Box */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-3">
                    <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-xs">
                      অ্যাকাউন্ট স্ট্যাটাস ও ভিজিবিলিটি
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-600 dark:text-stone-400 font-medium mb-1">
                          মূল স্ট্যাটাস
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setFormData({
                              ...formData,
                              status: newStatus,
                              isActive: newStatus === 'ACTIVE',
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-none focus:border-shubban-gold"
                        >
                          <option value="ACTIVE">সক্রিয় (Active)</option>
                          <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                          <option value="PENDING_VERIFICATION">অপেক্ষমাণ ভেরিফিকেশন</option>
                          <option value="SUSPENDED">স্থগিত (Suspended)</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isVerified}
                            onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                            className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            ভেরিফাইড প্রকাশনী ব্যাজ প্রদর্শন করুন
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold"
                          />
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            হোমপেজে ফিচার্ড প্রকাশনী হিসেবে তালিকাভুক্ত করুন
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* SEO Meta Title */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      এসইও মেটা টাইটেল (SEO Title)
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="ঐতিহ্য প্রকাশনী - ইসলামি ও সৃজনশীল গ্রন্থ সম্ভার | Shubban Library"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>

                  {/* SEO Meta Description */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      এসইও মেটা বিবরণ (Meta Description)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="ঐতিহ্য প্রকাশনীর সমস্ত প্রকাশিত বই ও গ্রন্থ অনলাইনেই অর্ডার করুন শুব্বান লাইব্রেরি থেকে..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>

                  {/* OG Image */}
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      সোশ্যাল শেয়ারিং ইমেজ (OG Image URL)
                    </label>
                    <input
                      type="url"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      placeholder="https://example.com/og-banner.jpg"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="text-[11px] text-stone-400">
                  <span className="text-rose-500">*</span> চিহ্নিত ঘর পূরণ করা বাধ্যতামূলক
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold/90 text-stone-900 font-bold shadow-md shadow-shubban-gold/20 flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPublisher ? 'আপডেট সংরক্ষণ করুন' : 'প্রকাশনী সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK VIEW DETAILS MODAL / DRAWER */}
      {viewingPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center">
                  {viewingPublisher.logoUrl ? (
                    <img src={viewingPublisher.logoUrl} alt={viewingPublisher.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-stone-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                      {viewingPublisher.name}
                    </h3>
                    {viewingPublisher.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-stone-400 font-mono">/{viewingPublisher.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPublisher(null)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Type & Stats Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                  {PUBLISHER_TYPES[viewingPublisher.publisherType || 'COMMERCIAL']?.label || viewingPublisher.publisherType}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                  {ORG_TYPES[viewingPublisher.organizationType || 'LIMITED'] || viewingPublisher.organizationType}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                  {toBengaliNumber((viewingPublisher._count?.books || 0) + (viewingPublisher._count?.magazines || 0))}টি প্রকাশনা
                </span>
                {viewingPublisher.isFeatured && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                    ফিচার্ড প্রকাশনী
                  </span>
                )}
              </div>

              {/* Description */}
              {viewingPublisher.description && (
                <div>
                  <h4 className="font-semibold text-stone-700 dark:text-stone-300 mb-1">সংক্ষিপ্ত পরিচিতি:</h4>
                  <p className="text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    {viewingPublisher.description}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-stone-400 block text-[11px]">দায়িত্বপ্রাপ্ত ব্যক্তি:</span>
                  <p className="font-medium text-stone-800 dark:text-stone-200">{viewingPublisher.contactPerson || 'অনুল্লিখিত'}</p>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">অফিসিয়াল ইমেইল:</span>
                  <p className="font-medium text-stone-800 dark:text-stone-200">{viewingPublisher.email || 'অনুল্লিখিত'}</p>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">যোগাযোগ নম্বর:</span>
                  <p className="font-medium text-stone-800 dark:text-stone-200">{viewingPublisher.phone ? toBengaliNumber(viewingPublisher.phone) : 'অনুল্লিখিত'}</p>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">প্রতিষ্ঠানের ওয়েবসাইট:</span>
                  {viewingPublisher.website ? (
                    <a href={viewingPublisher.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {viewingPublisher.website}
                    </a>
                  ) : (
                    <p className="font-medium text-stone-400">অনুল্লিখিত</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[11px]">ঠিকানা ও অবস্থান:</span>
                <p className="font-medium text-stone-800 dark:text-stone-200 mt-0.5">
                  {viewingPublisher.address ? `${viewingPublisher.address}, ` : ''}
                  {viewingPublisher.city ? `${viewingPublisher.city}, ` : ''}
                  {viewingPublisher.country || 'বাংলাদেশ'}
                </p>
              </div>

              {/* Business Registration */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block text-[10px]">ট্রেড লাইসেন্স</span>
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">{viewingPublisher.regNumber || '—'}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block text-[10px]">প্রতিষ্ঠার বছর</span>
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                    {viewingPublisher.establishedYear ? toBengaliNumber(viewingPublisher.establishedYear) : '—'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 col-span-2 sm:col-span-1">
                  <span className="text-stone-400 block text-[10px]">মূল ক্যাটাগরি</span>
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">{viewingPublisher.mainCategory || '—'}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/40">
              <Link
                href={`/admin/publishers/${viewingPublisher.id}`}
                className="px-4 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold/90 text-stone-900 font-bold flex items-center gap-1.5 transition-colors text-xs"
              >
                <span>সম্পূর্ণ প্রোফাইল ও গ্রন্থাবলি দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setViewingPublisher(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLICATIONS REASSIGNMENT MODAL */}
      {reassignModalPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                    প্রকাশনা ব্যবস্থাপনা ও স্থানান্তর
                  </h3>
                  <p className="text-xs text-stone-500">
                    উৎস: <span className="font-bold text-stone-800 dark:text-stone-200">{reassignModalPublisher.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReassignModalPublisher(null)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold text-xs">ক্যাটালগ নিরাপত্তা প্রটোকল</p>
                  <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                    কোনো প্রকাশনী মুছে ফেলার পূর্বে তার অধীনে থাকা গ্রন্থাবলি বা সাময়িকী অন্য কোনো সক্রিয় প্রকাশনীতে স্থানান্তর করতে হবে।
                  </p>
                </div>
              </div>

              {/* Current Publications Summary */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">বর্তমানে সংযুক্ত প্রকাশনাসমূহ:</span>
                  <span className="font-bold text-shubban-gold">
                    {loadingPubs
                      ? 'লোড হচ্ছে...'
                      : `${toBengaliNumber(publisherPublications.books.length + publisherPublications.magazines.length)}টি কনটেন্ট`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-600 dark:text-stone-400">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span>বই (Books):</span>
                    <span className="font-bold">{toBengaliNumber(publisherPublications.books.length)}টি</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span>সাময়িকী (Magazines):</span>
                    <span className="font-bold">{toBengaliNumber(publisherPublications.magazines.length)}টি</span>
                  </div>
                </div>
              </div>

              {/* Target Publisher Selector */}
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  স্থানান্তরের লক্ষ্য প্রকাশনী (Target Publisher) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-shubban-gold font-medium"
                >
                  <option value="">-- লক্ষ্য প্রকাশনী নির্বাচন করুন --</option>
                  {publishers
                    .filter((p) => p.id !== reassignModalPublisher.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.slug})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2 bg-stone-50/50 dark:bg-stone-950/40">
              <button
                onClick={() => setReassignModalPublisher(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleExecuteReassignment}
                disabled={!reassignTargetId || reassigning}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                {reassigning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>স্থানান্তর হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>সকল প্রকাশনা স্থানান্তর করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL WITH DELETION GUARD */}
      {deletingPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                প্রকাশনী মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনি &quot;{deletingPublisher.name}&quot; প্রকাশনীটি ডিলিট করতে যাচ্ছেন।
              </p>
            </div>

            {/* Check if publications exist */}
            {(deletingPublisher._count?.books || 0) + (deletingPublisher._count?.magazines || 0) > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>ডিলিট করা সম্ভব নয় (Deletion Guard সক্রিয়)</span>
                </div>
                <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90">
                  এই প্রকাশনীর অধীনে মোট{' '}
                  <span className="font-bold underline">
                    {toBengaliNumber((deletingPublisher._count?.books || 0) + (deletingPublisher._count?.magazines || 0))}টি প্রকাশনা
                  </span>{' '}
                  (বই: {toBengaliNumber(deletingPublisher._count?.books || 0)}, সাময়িকী:{' '}
                  {toBengaliNumber(deletingPublisher._count?.magazines || 0)}) সংযুক্ত রয়েছে। ডিলিট করার আগে &quot;স্থানান্তর&quot;
                  ফিচার ব্যবহার করে প্রকাশনাগুলো অন্য প্রকাশনীতে রিঅ্যাসাইন করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const pub = deletingPublisher;
                    setDeletingPublisher(null);
                    handleOpenReassignModal(pub);
                  }}
                  className="w-full mt-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>এখনই প্রকাশনা স্থানান্তর করুন</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-stone-600 dark:text-stone-400 text-center">
                এই প্রকাশনীর অধীনে কোনো সক্রিয় প্রকাশনা নেই। এটি নিরাপদে মুছে ফেলা যাবে।
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingPublisher(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-semibold text-xs"
              >
                বাতিল
              </button>
              {(deletingPublisher._count?.books || 0) + (deletingPublisher._count?.magazines || 0) === 0 && (
                <button
                  onClick={handleConfirmSingleDelete}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                >
                  মুছে ফেলুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                নির্বাচিত {toBengaliNumber(selectedIds.length)}টি প্রকাশনী মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                নিরাপত্তা নীতি অনুসারে, যেসব প্রকাশনীতে ইতিমধ্যে বই বা ম্যাগাজিন যুক্ত রয়েছে সেগুলো স্বয়ংক্রিয়ভাবে বাদ রাখা হবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-semibold text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
              >
                নিরাপদ ডিলিট সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

