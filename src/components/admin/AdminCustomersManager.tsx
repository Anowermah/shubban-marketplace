'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShoppingBag,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Tag,
  Award,
  Clock,
  Eye,
  Edit,
  Trash2,
  Send,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Check,
  Upload,
  ExternalLink,
  Copy,
  Layers,
  Sparkles,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate, formatTaka } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface CustomerOrderSummary {
  id: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
}

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  status: string; // ACTIVE, INACTIVE, PENDING_VERIFICATION, SUSPENDED, BLOCKED
  isVerified: boolean;
  isPhoneVerified: boolean;
  membershipTier?: string | null;
  membershipExpiry?: string | null;
  customerType: string; // INDIVIDUAL, BUSINESS, INSTITUTIONAL, WHOLESALE
  customerTags: string[];
  country?: string | null;
  division?: string | null;
  city?: string | null;
  area?: string | null;
  postalCode?: string | null;
  fullAddress?: string | null;
  adminNotes?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  totalSpent: number;
  avgOrderValue: number;
  completionPercentage: number;
  orders: CustomerOrderSummary[];
  _count: {
    orders: number;
    reviews: number;
    comments: number;
    bookmarks: number;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newCustomersThisMonth: number;
  totalOrders: number;
  verifiedEmailAccounts: number;
}

export interface CustomerTagItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string | null;
  count?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
}

interface AdminCustomersManagerProps {
  initialCustomers: CustomerItem[];
  initialStats: CustomerStats;
  initialTags: CustomerTagItem[];
  initialPagination: PaginationInfo;
}

export default function AdminCustomersManager({
  initialCustomers,
  initialStats,
  initialTags,
  initialPagination,
}: AdminCustomersManagerProps) {
  // Main State
  const [activeTab, setActiveTab] = useState<'list' | 'tags' | 'analytics'>('list');
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [stats, setStats] = useState<CustomerStats>(initialStats);
  const [tags, setTags] = useState<CustomerTagItem[]>(initialTags);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [membershipTierFilter, setMembershipTierFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(initialPagination.page || 1);
  const [limit, setLimit] = useState<number | 'all'>(initialPagination.limit || 25);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<CustomerItem | null>(null);
  const [membershipModalTarget, setMembershipModalTarget] = useState<CustomerItem | null>(null);
  const [communicationModalTarget, setCommunicationModalTarget] = useState<CustomerItem | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<CustomerItem | null>(null);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form State for Create/Edit Customer
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    gender: '',
    dateOfBirth: '',
    customerType: 'INDIVIDUAL',
    membershipTier: 'FREE',
    membershipExpiry: '',
    status: 'ACTIVE',
    isVerified: true,
    isPhoneVerified: false,
    country: 'Bangladesh',
    division: '',
    city: '',
    area: '',
    postalCode: '',
    fullAddress: '',
    adminNotes: '',
    selectedTags: [] as string[],
  });

  // Communication modal state
  const [commData, setCommData] = useState({
    type: 'NOTICE', // NOTICE, PASSWORD_RESET, ORDER_NOTICE
    subject: '',
    message: '',
    link: '',
    generatedResetLink: '',
  });

  // Import CSV state
  const [importText, setImportText] = useState('');
  const [importResults, setImportResults] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Quick Status state
  const [quickStatus, setQuickStatus] = useState('ACTIVE');
  const [quickStatusReason, setQuickStatusReason] = useState('');
  const [quickStatusNotify, setQuickStatusNotify] = useState(true);

  // Quick Membership state
  const [quickTier, setQuickTier] = useState('FREE');
  const [quickTierExpiry, setQuickTierExpiry] = useState('');
  const [quickTierNotes, setQuickTierNotes] = useState('');
  const [quickTierNotify, setQuickTierNotify] = useState(true);

  // Tag Form state
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2563EB');
  const [newTagDesc, setNewTagDesc] = useState('');

  // Bulk actions state
  const [bulkActionTag, setBulkActionTag] = useState('');

  // Auto clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (emailVerifiedFilter !== 'all') params.set('emailVerified', emailVerifiedFilter);
      if (customerTypeFilter !== 'all') params.set('customerType', customerTypeFilter);
      if (membershipTierFilter !== 'all') params.set('membershipTier', membershipTierFilter);
      if (tagFilter !== 'all') params.set('tag', tagFilter);
      if (cityFilter) params.set('city', cityFilter);
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', currentPage.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCustomers(data.customers || []);
        setStats(data.stats || stats);
        setPagination(data.pagination || pagination);
        if (data.availableTags) setTags(data.availableTags);
      } else {
        setNotification({ type: 'error', message: data.error || 'গ্রাহক তথ্য লোড করতে ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'সার্ভার যোগাযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    emailVerifiedFilter,
    customerTypeFilter,
    membershipTierFilter,
    tagFilter,
    cityFilter,
    dateFilter,
    sortBy,
    sortOrder,
    currentPage,
    limit,
  ]);

  // Refetch when filters or pagination change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setEmailVerifiedFilter('all');
    setCustomerTypeFilter('all');
    setMembershipTierFilter('all');
    setTagFilter('all');
    setCityFilter('');
    setDateFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Open Create Customer Modal
  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      gender: '',
      dateOfBirth: '',
      customerType: 'INDIVIDUAL',
      membershipTier: 'FREE',
      membershipExpiry: '',
      status: 'ACTIVE',
      isVerified: true,
      isPhoneVerified: false,
      country: 'Bangladesh',
      division: '',
      city: '',
      area: '',
      postalCode: '',
      fullAddress: '',
      adminNotes: '',
      selectedTags: [],
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Customer Modal
  const openEditModal = (customer: CustomerItem) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      username: customer.username || '',
      password: '',
      gender: (customer as any).gender || '',
      dateOfBirth: (customer as any).dateOfBirth || '',
      customerType: customer.customerType || 'INDIVIDUAL',
      membershipTier: customer.membershipTier || 'FREE',
      membershipExpiry: customer.membershipExpiry ? customer.membershipExpiry.split('T')[0] : '',
      status: customer.status || 'ACTIVE',
      isVerified: customer.isVerified ?? false,
      isPhoneVerified: customer.isPhoneVerified ?? false,
      country: customer.country || 'Bangladesh',
      division: customer.division || '',
      city: customer.city || '',
      area: customer.area || '',
      postalCode: customer.postalCode || '',
      fullAddress: customer.fullAddress || '',
      adminNotes: customer.adminNotes || '',
      selectedTags: customer.customerTags || [],
    });
    setIsEditModalOpen(true);
  };

  // Handle Save Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setNotification({ type: 'error', message: 'নাম এবং ইমেইল প্রদান করা আবশ্যক।' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerTags: formData.selectedTags,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({ type: 'success', message: 'নতুন গ্রাহক সফলভাবে তৈরি করা হয়েছে।' });
        setIsCreateModalOpen(false);
        fetchCustomers();
      } else {
        setNotification({ type: 'error', message: data.error || 'গ্রাহক তৈরি ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'গ্রাহক তৈরিতে সমস্যা হয়েছে।' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Save Edit Customer
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerTags: formData.selectedTags,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({ type: 'success', message: 'গ্রাহকের তথ্য সফলভাবে আপডেট হয়েছে।' });
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        setNotification({ type: 'error', message: data.error || 'তথ্য আপডেট ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'তথ্য আপডেটে সমস্যা হয়েছে।' });
    } finally {
      setIsLoading(false);
    }
  };

  // Open Quick Status Modal
  const openStatusModal = (customer: CustomerItem) => {
    setStatusModalTarget(customer);
    setQuickStatus(customer.status || 'ACTIVE');
    setQuickStatusReason('');
    setQuickStatusNotify(true);
  };

  // Submit Quick Status Change
  const handleQuickStatusSubmit = async () => {
    if (!statusModalTarget) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${statusModalTarget.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: quickStatus,
          reason: quickStatusReason,
          notifyUser: quickStatusNotify,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({ type: 'success', message: `স্ট্যাটাস সফলভাবে '${quickStatus}' এ পরিবর্তিত হয়েছে।` });
        setStatusModalTarget(null);
        fetchCustomers();
      } else {
        setNotification({ type: 'error', message: data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।' });
    } finally {
      setIsLoading(false);
    }
  };

  // Open Quick Membership Modal
  const openMembershipModal = (customer: CustomerItem) => {
    setMembershipModalTarget(customer);
    setQuickTier(customer.membershipTier || 'FREE');
    setQuickTierExpiry(customer.membershipExpiry ? customer.membershipExpiry.split('T')[0] : '');
    setQuickTierNotes('');
    setQuickTierNotify(true);
  };

  // Submit Quick Membership Change
  const handleQuickMembershipSubmit = async () => {
    if (!membershipModalTarget) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${membershipModalTarget.id}/membership`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipTier: quickTier,
          membershipExpiry: quickTierExpiry || null,
          notes: quickTierNotes,
          notifyUser: quickTierNotify,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({ type: 'success', message: `মেম্বারশিপ টায়ার সফলভাবে '${quickTier}' এ উন্নীত হয়েছে।` });
        setMembershipModalTarget(null);
        fetchCustomers();
      } else {
        setNotification({ type: 'error', message: data.error || 'মেম্বারশিপ পরিবর্তন ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'মেম্বারশিপ পরিবর্তনে সমস্যা হয়েছে।' });
    } finally {
      setIsLoading(false);
    }
  };

  // Open Communication Modal
  const openCommunicationModal = (customer: CustomerItem) => {
    setCommunicationModalTarget(customer);
    setCommData({
      type: 'NOTICE',
      subject: '',
      message: '',
      link: '',
      generatedResetLink: '',
    });
  };

  // Submit Communication (Notice or Password Reset)
  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communicationModalTarget) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${communicationModalTarget.id}/communication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.resetLink) {
          setCommData((prev) => ({ ...prev, generatedResetLink: data.resetLink }));
          setNotification({ type: 'success', message: 'পাসওয়ার্ড রিসেট লিঙ্ক সফলভাবে তৈরি করা হয়েছে।' });
        } else {
          setNotification({ type: 'success', message: 'গ্রাহকের নিকট বার্তা সফলভাবে পাঠানো হয়েছে।' });
          setCommunicationModalTarget(null);
        }
      } else {
        setNotification({ type: 'error', message: data.error || 'বার্তা পাঠানো ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'বার্তা পাঠাতে সমস্যা হয়েছে।' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Safe Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deleteModalTarget) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${deleteModalTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({ type: 'success', message: 'গ্রাহকের অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
        setDeleteModalTarget(null);
        fetchCustomers();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'গ্রাহক মোছা সম্ভব হয়নি।',
        });
        setDeleteModalTarget(null);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'গ্রাহক মুছতে সমস্যা হয়েছে।' });
      setDeleteModalTarget(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'suspend' | 'verify' | 'delete' | 'assign_tag') => {
    if (selectedIds.length === 0) {
      setNotification({ type: 'error', message: 'কমপক্ষে একজন গ্রাহক নির্বাচন করুন।' });
      return;
    }

    if (action === 'delete') {
      const confirmMsg = `আপনি কি নিশ্চিত যে নির্বাচিত ${selectedIds.length} জন গ্রাহককে মুছতে চান? (যাদের কোনো ক্রয়াদেশ রয়েছে তাদের স্বয়ংক্রিয়ভাবে সুরক্ষিত রাখা হবে)`;
      if (!window.confirm(confirmMsg)) return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerIds: selectedIds,
          action,
          tag: action === 'assign_tag' ? bulkActionTag : undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({ type: 'success', message: data.message });
        setSelectedIds([]);
        fetchCustomers();
      } else {
        setNotification({ type: 'error', message: data.error || 'বাল্ক কার্যক্রম ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'বাল্ক কার্যক্রমে ত্রুটি হয়েছে।' });
    } finally {
      setIsLoading(false);
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length && customers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Tag Form Submit
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch('/api/admin/customers/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
          description: newTagDesc,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ type: 'success', message: 'নতুন ট্যাগ সফলভাবে সংরক্ষিত হয়েছে।' });
        setNewTagName('');
        setNewTagDesc('');
        // Refresh tags
        const tagsRes = await fetch('/api/admin/customers/tags');
        const tagsData = await tagsRes.json();
        if (tagsData.tags) setTags(tagsData.tags);
      } else {
        setNotification({ type: 'error', message: data.error || 'ট্যাগ তৈরি ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Tag Delete
  const handleDeleteTag = async (id: string) => {
    if (!window.confirm('আপনি কি এই ট্যাগটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/customers/tags?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ type: 'success', message: 'ট্যাগ সফলভাবে মোছা হয়েছে।' });
        const tagsRes = await fetch('/api/admin/customers/tags');
        const tagsData = await tagsRes.json();
        if (tagsData.tags) setTags(tagsData.tags);
      } else {
        setNotification({ type: 'error', message: data.error || 'ট্যাগ মোছা ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Import CSV Submission
  const handleProcessImport = async () => {
    if (!importText.trim()) {
      setNotification({ type: 'error', message: 'সিএসভি ডাটা বা টেক্সট প্রবেশ করান।' });
      return;
    }

    try {
      setIsImporting(true);
      const lines = importText.trim().split('\n');
      if (lines.length < 2) {
        setNotification({ type: 'error', message: 'কমপক্ষে ১টি হেডার লাইন এবং ১টি ডাটা লাইন আবশ্যক।' });
        setIsImporting(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      const res = await fetch('/api/admin/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setImportResults(data.results);
        setNotification({ type: 'success', message: data.message });
        fetchCustomers();
      } else {
        setNotification({ type: 'error', message: data.error || 'আমদানি ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'আমদানিতে ত্রুটি হয়েছে।' });
    } finally {
      setIsImporting(false);
    }
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0 ? customers.filter((c) => selectedIds.includes(c.id)) : customers;
    if (listToExport.length === 0) {
      setNotification({ type: 'error', message: 'রপ্তানি করার জন্য কোনো গ্রাহক পাওয়া যায়নি।' });
      return;
    }

    const headers = ['আইডি', 'নাম', 'ইউজারনেম', 'ইমেইল', 'ফোন', 'স্ট্যাটাস', 'মেম্বারশিপ স্তর', 'গ্রাহকের ধরন', 'শহর', 'মোট অর্ডার', 'মোট ব্যয় (টাকা)', 'নিবন্ধন তারিখ'];
    const rows = listToExport.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.username || '',
      c.email,
      c.phone || '',
      c.status,
      c.membershipTier || 'FREE',
      c.customerType,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      c._count.orders,
      c.totalSpent,
      new Date(c.createdAt).toLocaleDateString('bn-BD'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shubban-customers-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({ type: 'success', message: `মোট ${listToExport.length} জন গ্রাহকের তথ্য সিএসভি ফাইলে রপ্তানি হয়েছে।` });
  };

  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            সক্রিয়
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
            নিষ্ক্রিয়
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300/40">
            পেন্ডিং ভেরিফিকেশন
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-300/40">
            স্থগিত (Suspended)
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300/40">
            ব্লকড (Blocked)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  // Helper for tier badge styling
  const getTierBadge = (tier?: string | null) => {
    const t = (tier || 'FREE').toUpperCase();
    if (t === 'PREMIUM' || t === 'VIP' || t === 'GOLD') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-400/50">
          <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          {t}
        </span>
      );
    }
    if (t === 'DIGITAL' || t === 'SILVER') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-300/40">
          {t}
        </span>
      );
    }
    if (t === 'INSTITUTIONAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-300/40">
          প্রতিষ্ঠান
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
        ফ্রি (Free)
      </span>
    );
  };

  return (
    <div className="space-y-6 font-bengali text-stone-900 dark:text-stone-100">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all duration-300 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
              : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <span>গ্রাহক ও সদস্য ব্যবস্থাপনা</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-sans font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  Customers & Members System
                </span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                গ্রাহক প্রোফাইল, সদস্যপদ টিয়ার, অর্ডার ইতিহাস, ঠিকানা ও যোগাযোগ নিয়ন্ত্রণ ড্যাশবোর্ড
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchCustomers}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV ইম্পোর্ট</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={() => setIsTagsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>ট্যাগ ও সেগমেন্ট</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-amber-800 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন গ্রাহক যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* 1. Six Dynamic Database Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Registered Customers */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">মোট নিবন্ধিত গ্রাহক</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.totalCustomers)}
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
            ডাটাবেজে নিবন্ধিত সদস্য
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">সক্রিয় গ্রাহক</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {toBengaliNumber(stats.activeCustomers)}
          </div>
          <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
            মোটের{' '}
            {stats.totalCustomers > 0
              ? toBengaliNumber(Math.round((stats.activeCustomers / stats.totalCustomers) * 100))
              : '০'}
            % সক্রিয়
          </div>
        </div>

        {/* Card 3: Inactive / Suspended */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group hover:border-rose-400 dark:hover:border-rose-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">নিষ্ক্রিয় / স্থগিত</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-stone-700 dark:text-stone-300">
            {toBengaliNumber(stats.inactiveCustomers)}
          </div>
          <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">স্থগিত বা নিষ্ক্রিয় অ্যাকাউন্ট</div>
        </div>

        {/* Card 4: New This Month */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">চলতি মাসে নতুন</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {toBengaliNumber(stats.newCustomersThisMonth)}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            চলতি মাসের নতুন সংযোজন
          </div>
        </div>

        {/* Card 5: Total Orders */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">সর্বমোট ক্রয়াদেশ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400">
            {toBengaliNumber(stats.totalOrders)}
          </div>
          <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">মার্কেটপ্লেস অর্ডার</div>
        </div>

        {/* Card 6: Verified Email Accounts */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group hover:border-teal-400 dark:hover:border-teal-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">ভেরিফাইড ইমেইল</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-teal-600 dark:text-teal-400">
            {toBengaliNumber(stats.verifiedEmailAccounts)}
          </div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-1">যাচাইকৃত ইমেইল আইডি</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'list'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>গ্রাহক তালিকা ({toBengaliNumber(pagination.total)})</span>
        </button>

        <button
          onClick={() => setActiveTab('tags')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'tags'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>গ্রাহক সেগমেন্ট ও ট্যাগ ({toBengaliNumber(tags.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>গ্রাহক আচরণ ও গ্রোথ রিপোর্ট</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMERS LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Advanced Search & Multi-Filter Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="গ্রাহকের নাম, ইমেইল, ফোন, ইউজারনেম বা আইডি দিয়ে খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Quick filter summary & Reset button */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={resetFilters}
                  className="text-xs text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 flex items-center gap-1 font-semibold px-2 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ফিল্টার রিসেট</span>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 text-xs">
              {/* Status */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                  অ্যাকাউন্ট স্ট্যাটাস
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="ACTIVE">সক্রিয় (Active)</option>
                  <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                  <option value="PENDING_VERIFICATION">পেন্ডিং ভেরিফিকেশন</option>
                  <option value="SUSPENDED">স্থগিত (Suspended)</option>
                  <option value="BLOCKED">ব্লকড (Blocked)</option>
                </select>
              </div>

              {/* Email Verification */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                  ইমেইল ভেরিফিকেশন
                </label>
                <select
                  value={emailVerifiedFilter}
                  onChange={(e) => {
                    setEmailVerifiedFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">সব ভেরিফিকেশন</option>
                  <option value="verified">ভেরিফাইড (Verified)</option>
                  <option value="unverified">আন-ভেরিফাইড</option>
                </select>
              </div>

              {/* Customer Type */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                  গ্রাহকের ধরন
                </label>
                <select
                  value={customerTypeFilter}
                  onChange={(e) => {
                    setCustomerTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">সব ধরন</option>
                  <option value="INDIVIDUAL">সাধারণ ব্যক্তি</option>
                  <option value="BUSINESS">ব্যবসা প্রতিষ্ঠান</option>
                  <option value="INSTITUTIONAL">প্রাতিষ্ঠানিক</option>
                  <option value="WHOLESALE">পাইকারি ক্রেতা</option>
                </select>
              </div>

              {/* Membership Tier */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                  সদস্যপদ স্তর (Tier)
                </label>
                <select
                  value={membershipTierFilter}
                  onChange={(e) => {
                    setMembershipTierFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">সকল স্তর</option>
                  <option value="FREE">ফ্রি মেম্বার</option>
                  <option value="DIGITAL">ডিজিটাল মেম্বার</option>
                  <option value="PREMIUM">প্রিমিয়াম মেম্বার</option>
                  <option value="INSTITUTIONAL">প্রতিষ্ঠান স্তর</option>
                </select>
              </div>

              {/* Customer Tags */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                  ট্যাগ / সেগমেন্ট
                </label>
                <select
                  value={tagFilter}
                  onChange={(e) => {
                    setTagFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">সকল ট্যাগ</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                  নিবন্ধন সময়কাল
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:ring-1 focus:ring-amber-500 text-xs"
                >
                  <option value="all">সকল সময়কাল</option>
                  <option value="today">আজ নিবন্ধিত</option>
                  <option value="7days">বিগত ৭ দিন</option>
                  <option value="30days">বিগত ৩০ দিন</option>
                  <option value="thisMonth">চলতি মাস</option>
                  <option value="thisYear">চলতি বছর</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions Floating Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{toBengaliNumber(selectedIds.length)} জন গ্রাহক নির্বাচিত</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  সক্রিয় করুন
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-600 text-white hover:bg-stone-700 transition"
                >
                  নিষ্ক্রিয় করুন
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 transition"
                >
                  স্থগিত করুন
                </button>
                <button
                  onClick={() => handleBulkAction('verify')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition"
                >
                  ভেরিফাই করুন
                </button>

                {/* Bulk Tag Select */}
                <div className="flex items-center gap-1 bg-white dark:bg-stone-800 rounded-lg p-0.5 border border-amber-300 dark:border-amber-700">
                  <select
                    value={bulkActionTag}
                    onChange={(e) => setBulkActionTag(e.target.value)}
                    className="text-xs bg-transparent px-2 py-0.5 text-stone-800 dark:text-stone-200 focus:outline-none"
                  >
                    <option value="">ট্যাগ নির্বাচন</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleBulkAction('assign_tag')}
                    disabled={!bulkActionTag}
                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white disabled:opacity-50"
                  >
                    যোগ
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  এক্সপোর্ট
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition"
                >
                  মুছুন
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}

          {/* Customer Data Table */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50/90 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 uppercase text-[10px] font-semibold border-b border-stone-200/80 dark:border-stone-800">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === customers.length && customers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">গ্রাহকের প্রোফাইল</th>
                    <th className="p-3.5">যোগাযোগ ও ঠিকানা</th>
                    <th className="p-3.5">অ্যাকাউন্ট স্ট্যাটাস</th>
                    <th className="p-3.5">মেম্বারশিপ স্তর</th>
                    <th className="p-3.5">ক্রয়াদেশ ও ব্যয়</th>
                    <th className="p-3.5">প্রোফাইল পূর্ণতা</th>
                    <th className="p-3.5">নিবন্ধন তারিখ</th>
                    <th className="p-3.5 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                          <span>ডাটাবেজ থেকে গ্রাহক তালিকা লোড হচ্ছে...</span>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-400">
                        <Users className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                        <span className="font-semibold text-sm">কোনো গ্রাহকের রেকর্ড পাওয়া যায়নি।</span>
                        <p className="text-xs text-stone-400 mt-1">
                          ফিল্টার বা সার্চ শর্ত পরিবর্তন করে পুনরায় চেষ্টা করুন।
                        </p>
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => {
                      const isSelected = selectedIds.includes(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-amber-50/30 dark:hover:bg-stone-800/40 transition ${
                            isSelected ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(c.id)}
                              className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>

                          {/* Profile */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                {c.avatarUrl ? (
                                  <img
                                    src={c.avatarUrl}
                                    alt={c.name}
                                    className="w-full h-full object-cover rounded-2xl"
                                  />
                                ) : (
                                  c.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/customers/${c.id}`}
                                  className="font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 truncate text-xs"
                                >
                                  <span>{c.name}</span>
                                  {c.isVerified && (
                                    <span title="ভেরিফাইড অ্যাকাউন্ট">
                                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                                    </span>
                                  )}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    @{c.username || c.id.slice(-6).toLowerCase()}
                                  </span>
                                  {c.customerType && c.customerType !== 'INDIVIDUAL' && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                                      {c.customerType}
                                    </span>
                                  )}
                                </div>
                                {/* Tags */}
                                {c.customerTags && c.customerTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {c.customerTags.slice(0, 2).map((t, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[9px] px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                    {c.customerTags.length > 2 && (
                                      <span className="text-[9px] text-stone-400">
                                        +{c.customerTags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contact & Address */}
                          <td className="p-3.5">
                            <div className="space-y-0.5 text-[11px]">
                              <div className="flex items-center gap-1 text-stone-700 dark:text-stone-300">
                                <Mail className="w-3 h-3 text-stone-400 flex-shrink-0" />
                                <span className="truncate max-w-[170px]" title={c.email}>
                                  {c.email}
                                </span>
                              </div>
                              {c.phone ? (
                                <div className="flex items-center gap-1 text-stone-500 font-mono text-[10px]">
                                  <Phone className="w-3 h-3 text-stone-400 flex-shrink-0" />
                                  <span>{c.phone}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-stone-400 italic">ফোন যুক্ত নেই</span>
                              )}
                              {c.city && (
                                <div className="flex items-center gap-1 text-stone-400 text-[10px]">
                                  <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                                  <span>
                                    {c.city}
                                    {c.country ? `, ${c.country}` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5">
                            <button
                              onClick={() => openStatusModal(c)}
                              className="text-left group cursor-pointer"
                              title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                            >
                              <span className="block group-hover:scale-105 transition-transform">
                                {getStatusBadge(c.status)}
                              </span>
                              <span className="block text-[9px] text-stone-400 mt-0.5 group-hover:text-amber-600 transition">
                                ক্লিক করে পরিবর্তন ✎
                              </span>
                            </button>
                          </td>

                          {/* Membership Tier */}
                          <td className="p-3.5">
                            <button
                              onClick={() => openMembershipModal(c)}
                              className="text-left group cursor-pointer"
                              title="টিয়ার পরিবর্তন করতে ক্লিক করুন"
                            >
                              <span className="block group-hover:scale-105 transition-transform">
                                {getTierBadge(c.membershipTier)}
                              </span>
                              <span className="block text-[9px] text-stone-400 mt-0.5 group-hover:text-amber-600 transition">
                                টিয়ার পরিবর্তন ✎
                              </span>
                            </button>
                          </td>

                          {/* Orders & Spending */}
                          <td className="p-3.5">
                            <div className="font-mono text-xs">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                                {formatTaka(c.totalSpent)}
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-stone-400">
                                {toBengaliNumber(c._count?.orders || c.orders?.length || 0)}টি ক্রয়াদেশ
                              </span>
                              {c.avgOrderValue > 0 && (
                                <span className="block text-[9px] text-stone-400">
                                  গড়: {formatTaka(c.avgOrderValue)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Profile Completion */}
                          <td className="p-3.5">
                            <div className="w-24">
                              <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                                <span>স্কোর</span>
                                <span className="font-mono font-bold">
                                  {toBengaliNumber(c.completionPercentage || 50)}%
                                </span>
                              </div>
                              <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    (c.completionPercentage || 50) >= 80
                                      ? 'bg-emerald-500'
                                      : (c.completionPercentage || 50) >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${c.completionPercentage || 50}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Registered Date & Last Login */}
                          <td className="p-3.5 text-stone-500 text-[11px]">
                            <div className="flex items-center gap-1 text-stone-700 dark:text-stone-300">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>{formatBengaliDate(c.createdAt)}</span>
                            </div>
                            {c.lastLoginAt ? (
                              <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>লগইন: {formatBengaliDate(c.lastLoginAt)}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-stone-400">লগইন রেকর্ড নেই</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <Link
                                href={`/admin/customers/${c.id}`}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                                title="সম্পূর্ণ প্রোফাইল দেখুন"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>

                              {/* Edit Modal */}
                              <button
                                onClick={() => openEditModal(c)}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                                title="প্রোফাইল সম্পাদনা"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Send Message */}
                              <button
                                onClick={() => openCommunicationModal(c)}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-purple-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                                title="নোটিশ বা রিসেট লিঙ্ক পাঠান"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              {/* Safe Delete */}
                              <button
                                onClick={() => setDeleteModalTarget(c)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                title="অ্যাকাউন্ট মুছুন বা ব্লক করুন"
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

            {/* Unified Pagination Footer */}
            <div className="p-4 border-t border-stone-200/80 dark:border-stone-800">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={typeof limit === 'number' ? limit : pagination.total}
                itemName="গ্রাহক"
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(s) => {
                  setLimit(s);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER SEGMENTS & TAGS */}
      {activeTab === 'tags' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create New Tag */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              <span>নতুন সেগমেন্ট বা ট্যাগ তৈরি করুন</span>
            </h2>
            <p className="text-xs text-stone-500">
              গ্রাহকদের নির্দিষ্ট দলে ভাগ করতে (যেমন: নিয়মিত ক্রেতা, ভিআইপি, বড় অর্ডারকারী) ট্যাগ যুক্ত করুন।
            </p>

            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">ট্যাগের নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: VIP Member, High Spender"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">ট্যাগ কালার থিম</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 dark:border-stone-700 bg-transparent"
                  />
                  <span className="text-xs font-mono">{newTagColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="ট্যাগের ব্যবহারের উদ্দেশ্য..."
                  value={newTagDesc}
                  onChange={(e) => setNewTagDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                ট্যাগ সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* Existing Tags List */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
              <span>বিদ্যমান সেগমেন্ট ও ট্যাগসমূহ ({toBengaliNumber(tags.length)})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 transition bg-stone-50/50 dark:bg-stone-800/40 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.color || '#6B7280' }}
                      ></span>
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{t.name}</span>
                    </div>
                    {t.description && <p className="text-[11px] text-stone-500">{t.description}</p>}
                    <span className="inline-block text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full mt-2">
                      {toBengaliNumber(t.count || 0)} জন গ্রাহক এই ট্যাগে যুক্ত
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteTag(t.id)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                    title="ট্যাগ মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ANALYTICS & GROWTH */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Retention & Engagement */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-stone-800 dark:text-stone-200">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>গ্রাহক সক্রিয়তা অনুপাত</span>
              </h3>
              <div className="text-3xl font-mono font-bold text-emerald-600">
                {stats.totalCustomers > 0
                  ? toBengaliNumber(Math.round((stats.activeCustomers / stats.totalCustomers) * 100))
                  : '০'}
                %
              </div>
              <p className="text-xs text-stone-500">
                মোট {toBengaliNumber(stats.totalCustomers)} জন গ্রাহকের মধ্যে{' '}
                {toBengaliNumber(stats.activeCustomers)} জন গ্রাহক বর্তমানে সক্রিয় অবস্থায় রয়েছেন।
              </p>
            </div>

            {/* Box 2: Verification Ratio */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-stone-800 dark:text-stone-200">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span>ইমেইল যাচাইকরণ হার</span>
              </h3>
              <div className="text-3xl font-mono font-bold text-teal-600">
                {stats.totalCustomers > 0
                  ? toBengaliNumber(Math.round((stats.verifiedEmailAccounts / stats.totalCustomers) * 100))
                  : '০'}
                %
              </div>
              <p className="text-xs text-stone-500">
                যাচাইকৃত অ্যাকাউন্টে ফেক অর্ডার হ্রাস পায় এবং সঠিক যোগাযোগ নিশ্চিত হয়।
              </p>
            </div>

            {/* Box 3: Order Density */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-stone-800 dark:text-stone-200">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                <span>গ্রাহক প্রতি গড় অর্ডার</span>
              </h3>
              <div className="text-3xl font-mono font-bold text-blue-600">
                {stats.totalCustomers > 0
                  ? toBengaliNumber((stats.totalOrders / stats.totalCustomers).toFixed(1))
                  : '০'}
                টি
              </div>
              <p className="text-xs text-stone-500">
                সার্বিক প্ল্যাটফর্মে প্রতি গ্রাহকের গড় ক্রয়াদেশ সংখ্যা।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE CUSTOMER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <span>নতুন গ্রাহক অ্যাকাউন্ট তৈরি করুন</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  ১. প্রাথমিক পরিচয় ও লগইন তথ্য
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">পূর্ণ নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="গ্রাহকের নাম"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">ইমেইল ঠিকানা *</label>
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">মোবাইল ফোন নম্বর</label>
                    <input
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">পাসওয়ার্ড (প্রাথমিক)</label>
                    <input
                      type="password"
                      placeholder="কমপক্ষে ৬ অক্ষর (ডিফল্ট: CustomerPass@123)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Account Status & Tiers */}
              <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  ২. মেম্বারশিপ ও অ্যাকাউন্ট সেটিংস
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">গ্রাহকের ধরন</label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                    >
                      <option value="INDIVIDUAL">সাধারণ ব্যক্তি (Individual)</option>
                      <option value="BUSINESS">ব্যবসায়িক ক্রেতা (Business)</option>
                      <option value="INSTITUTIONAL">প্রতিষ্ঠান / একাডেমি</option>
                      <option value="WHOLESALE">পাইকারি ক্রেতা</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">মেম্বারশিপ টায়ার</label>
                    <select
                      value={formData.membershipTier}
                      onChange={(e) => setFormData({ ...formData, membershipTier: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                    >
                      <option value="FREE">ফ্রি মেম্বার (FREE)</option>
                      <option value="DIGITAL">ডিজিটাল মেম্বার (DIGITAL)</option>
                      <option value="PREMIUM">প্রিমিয়াম ভিআইপি (PREMIUM)</option>
                      <option value="INSTITUTIONAL">প্রাতিষ্ঠানিক (INSTITUTIONAL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">অ্যাকাউন্ট স্ট্যাটাস</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                    >
                      <option value="ACTIVE">সক্রিয় (Active)</option>
                      <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                      <option value="PENDING_VERIFICATION">পেন্ডিং ভেরিফিকেশন</option>
                      <option value="SUSPENDED">স্থগিত (Suspended)</option>
                      <option value="BLOCKED">ব্লকড (Blocked)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                      className="rounded border-stone-300 text-amber-600"
                    />
                    <span>ইমেইল ইতিমধ্যে ভেরিফাইড হিসেবে গণ্য হবে</span>
                  </label>
                </div>
              </div>

              {/* Section 3: Address */}
              <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  ৩. ঠিকানা বিবরণ (Shipping Address)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">শহর (City)</label>
                    <input
                      type="text"
                      placeholder="যেমন: ঢাকা, চট্টগ্রাম"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">বিভাগ (Division)</label>
                    <input
                      type="text"
                      placeholder="যেমন: ঢাকা বিভাগ"
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">পূর্ণ ঠিকানা</label>
                    <textarea
                      rows={2}
                      placeholder="বাড়ি নং, রোড নং, এলাকা..."
                      value={formData.fullAddress}
                      onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition"
                >
                  {isLoading ? 'সংরক্ষণ হচ্ছে...' : 'গ্রাহক অ্যাকাউন্ট তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CUSTOMER */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>গ্রাহক প্রোফাইল সম্পাদনা: {editingCustomer.name}</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">মোবাইল ফোন নম্বর</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">ইউজারনেম</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে)</label>
                  <input
                    type="password"
                    placeholder="অপরিবর্তিত রাখতে খালি রাখুন"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">শহর</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">পূর্ণ ঠিকানা</label>
                  <input
                    type="text"
                    value={formData.fullAddress}
                    onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">অ্যাডমিন নোটস (Internal Note)</label>
                  <textarea
                    rows={2}
                    value={formData.adminNotes}
                    onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                    placeholder="এই গ্রাহক সম্পর্কে বিশেষ নোট..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  {isLoading ? 'আপডেট হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK STATUS MODAL */}
      {statusModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <span>স্ট্যাটাস পরিবর্তন: {statusModalTarget.name}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">বর্তমান স্ট্যাটাস</label>
                <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800">
                  {getStatusBadge(statusModalTarget.status)}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">নতুন স্ট্যাটাস নির্বাচন করুন</label>
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                >
                  <option value="ACTIVE">সক্রিয় (Active)</option>
                  <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                  <option value="PENDING_VERIFICATION">পেন্ডিং ভেরিফিকেশন</option>
                  <option value="SUSPENDED">স্থগিত (Suspended)</option>
                  <option value="BLOCKED">ব্লকড (Blocked)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">কারণ বা অ্যাডমিন নোট</label>
                <textarea
                  rows={2}
                  value={quickStatusReason}
                  onChange={(e) => setQuickStatusReason(e.target.value)}
                  placeholder="যেমন: গ্রাহকের অনুরোধে সক্রিয় করা হলো..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                ></textarea>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={quickStatusNotify}
                  onChange={(e) => setQuickStatusNotify(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600"
                />
                <span>গ্রাহকের ড্যাশবোর্ডে ইন-অ্যাপ নোটিফিকেশন পাঠান</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setStatusModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleQuickStatusSubmit}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                স্ট্যাটাস নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QUICK MEMBERSHIP TIER MODAL */}
      {membershipModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>মেম্বারশিপ টায়ার আপডেট: {membershipModalTarget.name}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">নতুন মেম্বারশিপ টায়ার</label>
                <select
                  value={quickTier}
                  onChange={(e) => setQuickTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
                >
                  <option value="FREE">ফ্রি মেম্বার (FREE)</option>
                  <option value="DIGITAL">ডিজিটাল মেম্বার (DIGITAL)</option>
                  <option value="PREMIUM">প্রিমিয়াম ভিআইপি (PREMIUM)</option>
                  <option value="INSTITUTIONAL">প্রতিষ্ঠান স্তর (INSTITUTIONAL)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">মেয়াদ উত্তীর্ণের তারিখ (ঐচ্ছিক)</label>
                <input
                  type="date"
                  value={quickTierExpiry}
                  onChange={(e) => setQuickTierExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
                <span className="text-[10px] text-stone-400">লাইফটাইম মেম্বারশিপের জন্য খালি রাখুন</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={quickTierNotify}
                  onChange={(e) => setQuickTierNotify(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600"
                />
                <span>টিয়ার উন্নীতের অভিনন্দন বার্তা গ্রাহককে পাঠান</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setMembershipModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleQuickMembershipSubmit}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                মেম্বারশিপ আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: COMMUNICATION & PASSWORD RESET */}
      {communicationModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" />
                <span>গ্রাহক যোগাযোগ: {communicationModalTarget.name}</span>
              </h2>
              <button
                onClick={() => setCommunicationModalTarget(null)}
                className="text-stone-400 hover:text-stone-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCommunication} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">যোগাযোগের ধরন</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCommData({ ...commData, type: 'NOTICE' })}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                      commData.type === 'NOTICE'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    ইন-অ্যাপ বার্তা / নোটিশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommData({ ...commData, type: 'PASSWORD_RESET' })}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                      commData.type === 'PASSWORD_RESET'
                        ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    পাসওয়ার্ড রিসেট লিংক
                  </button>
                </div>
              </div>

              {commData.type === 'PASSWORD_RESET' ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                  <p className="text-stone-700 dark:text-stone-300">
                    নিচের বাটনে চাপ দিলে গ্রাহকের অ্যাকাউন্টের জন্য একটি নিরাপদ ওয়ান-টাইম পাসওয়ার্ড রিসেট লিঙ্ক জেনারেট
                    হবে এবং গ্রাহকের ইন-অ্যাপ নোটিফিকেশনে পৌঁছে যাবে।
                  </p>
                  {commData.generatedResetLink && (
                    <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 font-mono text-[11px] break-all">
                      <span>{window.location.origin + commData.generatedResetLink}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-semibold block mb-1">বার্তার শিরোনাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: আপনার বিশেষ অফার বা প্রোফাইল আপডেট"
                      value={commData.subject}
                      onChange={(e) => setCommData({ ...commData, subject: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">বার্তার বিবরণ *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="বিস্তারিত বার্তা লিখুন..."
                      value={commData.message}
                      onChange={(e) => setCommData({ ...commData, message: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    ></textarea>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setCommunicationModalTarget(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                  {commData.type === 'PASSWORD_RESET' ? 'রিসেট লিঙ্ক তৈরি করুন' : 'বার্তা পাঠান'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: SAFE DELETE / BLOCK CONFIRMATION */}
      {deleteModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                গ্রাহক অ্যাকাউন্ট মুছে ফেলার সতর্কতা
              </h2>
              <p className="text-xs text-stone-500">
                আপনি কি নিশ্চিত যে গ্রাহক <b>{deleteModalTarget.name}</b> ({deleteModalTarget.email})-এর অ্যাকাউন্ট স্থায়ীভাবে
                মুছতে চান?
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300">
              <b>নিরাপত্তা নিয়ম:</b> যদি এই গ্রাহকের পূর্বে কোনো সফল বা পেন্ডিং অর্ডার থাকে, তবে আর্থিক হিসাব ও
              রসিদ সুরক্ষার স্বার্থে ডাটাবেজ থেকে স্থায়ীভাবে অ্যাকাউন্ট মোছা যাবে না; সে ক্ষেত্রে অ্যাকাউন্ট ব্লক বা
              নিষ্ক্রিয় করতে পারবেন।
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                {isLoading ? 'যাচাই হচ্ছে...' : 'স্থায়ীভাবে মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: CSV IMPORT */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <span>গ্রাহক বাল্ক CSV আমদানি (Bulk Import)</span>
              </h2>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResults(null);
                }}
                className="text-stone-400 hover:text-stone-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-[11px] space-y-1">
                <p className="font-bold text-stone-700 dark:text-stone-300">ফরম্যাট নির্দেশনা:</p>
                <p className="text-stone-500 font-mono">
                  name,email,phone,city,fullAddress,customerType,membershipTier,tag
                </p>
                <p className="text-stone-500 font-mono">
                  Md Karim,karim@example.com,01711111111,Dhaka,Mirpur 10,INDIVIDUAL,FREE,New Customer
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1">CSV কন্টেন্ট পেস্ট করুন</label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="name,email,phone,city,fullAddress,customerType,membershipTier,tag..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-[11px]"
                ></textarea>
              </div>

              {importResults && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                  <p className="font-bold">আমদানি ফলাফল:</p>
                  <p>মোট প্রসেসড: {toBengaliNumber(importResults.totalProcessed)}</p>
                  <p>সফলভাবে তৈরি: {toBengaliNumber(importResults.createdCount)} জন</p>
                  <p>বাদ পড়েছে (ডুপ্লিকেট/ত্রুটি): {toBengaliNumber(importResults.skippedCount)} জন</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResults(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={isImporting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                {isImporting ? 'আমদানি হচ্ছে...' : 'ইম্পোর্ট শুরু করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
