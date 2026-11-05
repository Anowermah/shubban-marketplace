'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Tag,
  Award,
  Clock,
  Edit,
  Trash2,
  Send,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
  Star,
  MessageSquare,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check,
  UserCheck,
  UserX,
  Activity,
  CreditCard,
  Truck,
  Package,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate, formatTaka } from '@/lib/utils';

export interface CustomerDetailProps {
  customer: any;
}

export default function AdminCustomerDetailClient({ customer: initialCustomer }: CustomerDetailProps) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [activeTab, setActiveTab] = useState<'orders' | 'timeline' | 'addresses' | 'reviews'>('orders');
  const [copiedId, setCopiedId] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Status modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(customer.status || 'ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [notifyUserStatus, setNotifyUserStatus] = useState(true);

  // Tier modal
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(customer.membershipTier || 'FREE');
  const [tierExpiry, setTierExpiry] = useState(
    customer.membershipExpiry ? customer.membershipExpiry.split('T')[0] : ''
  );
  const [tierNotes, setTierNotes] = useState('');

  // Communication modal
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [commType, setCommType] = useState('NOTICE');
  const [commSubject, setCommSubject] = useState('');
  const [commMessage, setCommMessage] = useState('');
  const [generatedResetLink, setGeneratedResetLink] = useState('');

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState(customer.adminNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleUpdateStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${customer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          reason: statusReason,
          notifyUser: notifyUserStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer({ ...customer, status: selectedStatus, adminNotes: data.customer.adminNotes });
        setNotification({ type: 'success', message: 'স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে।' });
        setIsStatusModalOpen(false);
      } else {
        setNotification({ type: 'error', message: data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${customer.id}/membership`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipTier: selectedTier,
          membershipExpiry: tierExpiry || null,
          notes: tierNotes,
          notifyUser: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer({ ...customer, membershipTier: selectedTier, membershipExpiry: tierExpiry });
        setNotification({ type: 'success', message: 'মেম্বারশিপ টায়ার আপডেট করা হয়েছে।' });
        setIsTierModalOpen(false);
      } else {
        setNotification({ type: 'error', message: data.error || 'মেম্বারশিপ আপডেট ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/customers/${customer.id}/communication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: commType,
          subject: commSubject,
          message: commMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.resetLink) {
          setGeneratedResetLink(data.resetLink);
          setNotification({ type: 'success', message: 'রিসেট লিঙ্ক তৈরি হয়েছে।' });
        } else {
          setNotification({ type: 'success', message: 'বার্তা পাঠানো হয়েছে।' });
          setIsCommModalOpen(false);
        }
      } else {
        setNotification({ type: 'error', message: data.error || 'বার্তা পাঠানো ব্যর্থ।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ type: 'success', message: 'অ্যাডমিন নোটস সংরক্ষিত হয়েছে।' });
      } else {
        setNotification({ type: 'error', message: data.error || 'নোটস সংরক্ষণে ত্রুটি।' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Helper status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            সক্রিয় অ্যাকাউন্ট (Active)
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200">
            নিষ্ক্রিয় (Inactive)
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-300">
            স্থগিত (Suspended)
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300">
            ব্লকড (Blocked)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-bengali text-stone-900 dark:text-stone-100">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all duration-300 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="গ্রাহক তালিকায় ফিরে যান"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">গ্রাহক ও সদস্য ব্যবস্থাপনা</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-bold text-amber-600">গ্রাহক প্রোফাইল</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>{customer.name}</span>
              {customer.isVerified && (
                <span title="ভেরিফাইড অ্যাকাউন্ট">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>স্ট্যাটাস পরিবর্তন</span>
          </button>

          <button
            onClick={() => setIsTierModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/40 hover:bg-amber-100 transition"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>টিয়ার পরিবর্তন</span>
          </button>

          <button
            onClick={() => setIsCommModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            <Send className="w-4 h-4" />
            <span>বার্তা বা রিসেট লিঙ্ক</span>
          </button>
        </div>
      </div>

      {/* Customer Header Banner Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {customer.avatarUrl ? (
                <img
                  src={customer.avatarUrl}
                  alt={customer.name}
                  className="w-full h-full object-cover rounded-3xl"
                />
              ) : (
                customer.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{customer.name}</h2>
                {getStatusBadge(customer.status)}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-500">
                <span className="font-mono">@{customer.username || 'username_not_set'}</span>
                <span>•</span>
                <button
                  onClick={() => copyToClipboard(customer.id)}
                  className="inline-flex items-center gap-1 hover:text-amber-600 font-mono text-[11px]"
                  title="আইডি কপি করুন"
                >
                  <span>ID: {customer.id}</span>
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {customer.membershipTier || 'FREE'} মেম্বার
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              ধরন: <b>{customer.customerType || 'INDIVIDUAL'}</b>
            </span>
            <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              নিবন্ধন: <b>{formatBengaliDate(customer.createdAt)}</b>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Financial & Activity Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Orders */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500">মোট ক্রয়াদেশ</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(customer.stats?.totalOrders || customer._count?.orders || 0)}টি
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            সম্পন্ন: {toBengaliNumber(customer.stats?.completedOrders || 0)} • পেন্ডিং:{' '}
            {toBengaliNumber(customer.stats?.pendingOrders || 0)}
          </div>
        </div>

        {/* Card 2: Spending */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500">মোট ব্যয় (Total Spent)</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatTaka(customer.stats?.totalSpent || 0)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            গড় ক্রয় মান: {formatTaka(customer.stats?.avgOrderValue || 0)}
          </div>
        </div>

        {/* Card 3: Reviews */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500">রিভিউ ও মতামত</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(customer.stats?.reviewsCount || customer._count?.reviews || 0)}টি
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            মন্তব্য: {toBengaliNumber(customer.stats?.commentsCount || customer._count?.comments || 0)}টি
          </div>
        </div>

        {/* Card 4: Addresses & Bookmarks */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500">সংরক্ষিত ঠিকানা ও উইশলিস্ট</span>
            <MapPin className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(customer.stats?.addressesCount || customer.addresses?.length || 0)}টি
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            বুকমার্ক: {toBengaliNumber(customer.stats?.bookmarksCount || customer._count?.bookmarks || 0)}টি
          </div>
        </div>
      </div>

      {/* Main Grid: Left Profile Details + Right Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Contact Information */}
        <div className="space-y-6">
          {/* Card: Contact Details */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>ব্যক্তিগত ও যোগাযোগের বিবরণ</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">ইমেইল ঠিকানা:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 mt-0.5">
                  {customer.email}
                  {customer.isVerified ? (
                    <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.2 rounded font-bold">
                      ভেরিফাইড
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 rounded">
                      আনভেরিফাইড
                    </span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">মোবাইল নম্বর:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 font-mono mt-0.5 block">
                  {customer.phone || 'ফোন নম্বর যুক্ত নেই'}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">লিঙ্গ ও জন্মতারিখ:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5 block">
                  {customer.gender || 'উল্লেখ নেই'} • {customer.dateOfBirth || 'তারিখ নেই'}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">ঠিকানা ও অবস্থান:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5 block">
                  {customer.fullAddress || customer.city
                    ? `${customer.fullAddress || ''} ${customer.city || ''} ${customer.country || ''}`
                    : 'ঠিকানা তথ্য প্রদান করা হয়নি'}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block text-[11px]">সর্বশেষ লগইন কার্যক্রম:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5 block">
                  {customer.lastLoginAt ? formatBengaliDate(customer.lastLoginAt) : 'লগইন হিস্ট্রি নেই'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Internal Admin Notes */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between">
              <span>অভ্যন্তরীণ অ্যাডমিন নোটস</span>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-xs text-amber-600 font-bold hover:underline"
              >
                {isSavingNotes ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </h3>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="এই গ্রাহক সম্পর্কে অ্যাডমিন মন্তব্য..."
              className="w-full p-3 text-xs rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            ></textarea>
          </div>
        </div>

        {/* Right Column: Tabbed Content (Orders, Timeline, Addresses, Reviews) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs bar */}
          <div className="flex border-b border-stone-200 dark:border-stone-800 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'orders'
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>অর্ডার হিস্ট্রি ({toBengaliNumber(customer.orders?.length || 0)})</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'timeline'
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>কার্যক্রম ও অডিট টাইমলাইন</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'addresses'
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>ঠিকানাসমূহ ({toBengaliNumber(customer.addresses?.length || 0)})</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'reviews'
                  ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>রিভিউ ({toBengaliNumber(customer.reviews?.length || 0)})</span>
            </button>
          </div>

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
              {customer.orders && customer.orders.length > 0 ? (
                <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                  {customer.orders.map((o: any) => (
                    <div key={o.id} className="p-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                            #{o.orderNumber || o.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-stone-400">{formatBengaliDate(o.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {o.orderStatus}
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-2">
                            {formatTaka(o.total)}
                          </span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      {o.items && o.items.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                          {o.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-50 dark:bg-stone-800/60 text-[11px]"
                            >
                              <Package className="w-3 h-3 text-stone-400" />
                              <span className="font-medium text-stone-700 dark:text-stone-300">
                                {item.book?.title || item.product?.title || 'পণ্য'}
                              </span>
                              <span className="text-stone-400">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-stone-400 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                  <span>এখনও কোনো অর্ডার রেকর্ড নেই।</span>
                </div>
              )}
            </div>
          )}

          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm p-6">
              <div className="space-y-4">
                {customer.timeline && customer.timeline.length > 0 ? (
                  customer.timeline.map((event: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 relative pb-4 last:pb-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{event.title}</span>
                          <span className="text-[10px] text-stone-400">{formatBengaliDate(event.timestamp)}</span>
                        </div>
                        <p className="text-stone-500 mt-0.5">{event.details}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-stone-400 py-6 text-xs">টাইমলাইন রেকর্ড খালি।</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customer.addresses && customer.addresses.length > 0 ? (
                customer.addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 dark:text-stone-100">{addr.title || 'ঠিকানা'}</span>
                      {addr.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                          ডিফল্ট
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600 dark:text-stone-300">{addr.address}</p>
                    <p className="text-stone-400 text-[11px]">
                      {addr.city} {addr.zone ? `, ${addr.zone}` : ''}
                    </p>
                    {addr.phone && <p className="font-mono text-stone-500 text-[10px]">ফোন: {addr.phone}</p>}
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-stone-400 text-xs">কোনো ঠিকানা সংরক্ষিত নেই।</div>
              )}
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
              {customer.reviews && customer.reviews.length > 0 ? (
                customer.reviews.map((rev: any) => (
                  <div key={rev.id} className="p-4 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 dark:text-stone-100">{rev.book?.title || 'বই'}</span>
                      <span className="text-[10px] text-stone-400">{formatBengaliDate(rev.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-stone-600 dark:text-stone-300 mt-1">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-stone-400 text-xs">কোনো রিভিউ বা মতামত জমা নেই।</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STATUS MODAL */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <h2 className="font-bold text-base">স্ট্যাটাস পরিবর্তন</h2>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border text-xs font-bold"
            >
              <option value="ACTIVE">সক্রিয় (Active)</option>
              <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
              <option value="SUSPENDED">স্থগিত (Suspended)</option>
              <option value="BLOCKED">ব্লকড (Blocked)</option>
            </select>
            <textarea
              rows={2}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="পরিবর্তনের কারণ..."
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border text-xs"
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-800"
              >
                বাতিল
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white"
              >
                সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIER MODAL */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <h2 className="font-bold text-base">মেম্বারশিপ টায়ার আপডেট</h2>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border text-xs font-bold"
            >
              <option value="FREE">FREE</option>
              <option value="DIGITAL">DIGITAL</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="INSTITUTIONAL">INSTITUTIONAL</option>
            </select>
            <input
              type="date"
              value={tierExpiry}
              onChange={(e) => setTierExpiry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsTierModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-800"
              >
                বাতিল
              </button>
              <button
                onClick={handleUpdateTier}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white"
              >
                আপডেট
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMUNICATION MODAL */}
      {isCommModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <h2 className="font-bold text-base">গ্রাহক বার্তা বা পাসওয়ার্ড রিসেট</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCommType('NOTICE')}
                className={`p-2 rounded-xl border font-bold ${
                  commType === 'NOTICE' ? 'bg-purple-50 text-purple-700 border-purple-500' : ''
                }`}
              >
                বার্তা পাঠান
              </button>
              <button
                type="button"
                onClick={() => setCommType('PASSWORD_RESET')}
                className={`p-2 rounded-xl border font-bold ${
                  commType === 'PASSWORD_RESET' ? 'bg-amber-50 text-amber-700 border-amber-500' : ''
                }`}
              >
                পাসওয়ার্ড রিসেট
              </button>
            </div>

            {commType === 'NOTICE' ? (
              <div className="space-y-3 text-xs">
                <input
                  type="text"
                  placeholder="বার্তার বিষয়"
                  value={commSubject}
                  onChange={(e) => setCommSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border"
                />
                <textarea
                  rows={3}
                  placeholder="বার্তার বিষয়বস্তু"
                  value={commMessage}
                  onChange={(e) => setCommMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border"
                ></textarea>
              </div>
            ) : (
              <div className="text-xs text-stone-500">
                গ্রাহকের ইন-অ্যাপ নোটিফিকেশনে পাসওয়ার্ড রিসেটের নিরাপদ লিংক পাঠানো হবে।
                {generatedResetLink && (
                  <div className="mt-2 p-2 bg-stone-100 font-mono text-[11px] break-all">
                    {window.location.origin + generatedResetLink}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCommModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-800"
              >
                বন্ধ
              </button>
              <button
                onClick={handleSendComm}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white"
              >
                {commType === 'PASSWORD_RESET' ? 'রিসেট তৈরি করুন' : 'বার্তা পাঠান'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
