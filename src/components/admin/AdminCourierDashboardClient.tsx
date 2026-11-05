'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Banknote,
  Search,
  Filter,
  ExternalLink,
  Printer,
  XCircle,
  RefreshCw,
  Sliders,
  Settings,
  ChevronRight,
  ShieldCheck,
  Building,
  DollarSign,
  Copy,
  Check,
  Send,
  Plus,
} from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';
import { CourierCode, ShipmentStatus } from '@/lib/courier/types';

interface ProviderItem {
  id: string;
  name: string;
  code: CourierCode;
  apiBaseUrl?: string | null;
  trackingUrl?: string | null;
  isDefault: boolean;
  isEnabled: boolean;
  isSandbox: boolean;
  shipmentCount: number;
  settings: {
    key: string;
    hasValue: boolean;
    isSecret: boolean;
    value: string;
  }[];
}

interface ShipmentItem {
  id: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber: string;
  courierName: string;
  courierCode: CourierCode;
  trackingNumber?: string | null;
  consignmentId?: string | null;
  recipientName: string;
  shippingPhone: string;
  shippingAddress: string;
  status: ShipmentStatus;
  codAmount: number;
  courierFee: number;
  weightKg: number;
  isRemitted: boolean;
  labelPrintedAt?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
}

interface DashboardStats {
  totalShipments: number;
  pendingPickups: number;
  inTransit: number;
  delivered: number;
  returned: number;
  cancelled: number;
  totalCodCollected: number;
  totalCodRemitted: number;
  pendingCodSettlement: number;
}

export default function AdminCourierDashboardClient() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'providers' | 'settlement' | 'book'>('shipments');
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    pendingPickups: 0,
    inTransit: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    totalCodCollected: 0,
    totalCodRemitted: 0,
    pendingCodSettlement: 0,
  });

  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  // Copy tracking state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tracking Modal State
  const [trackingModalData, setTrackingModalData] = useState<any | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Label Modal State
  const [printableLabel, setPrintableLabel] = useState<any | null>(null);

  // Provider Settings Edit State
  const [editingProvider, setEditingProvider] = useState<ProviderItem | null>(null);
  const [providerFormSettings, setProviderFormSettings] = useState<Record<string, string>>({});
  const [providerTestingStatus, setProviderTestingStatus] = useState<{ [key: string]: { loading: boolean; res?: any } }>({});

  // Settlement State
  const [settlementData, setSettlementData] = useState<any | null>(null);
  const [selectedSettlementShipmentIds, setSelectedSettlementShipmentIds] = useState<string[]>([]);
  const [remittanceRef, setRemittanceRef] = useState('');
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);

  // Manual Booking Form State
  const [bookOrderId, setBookOrderId] = useState('');
  const [bookCourierCode, setBookCourierCode] = useState<CourierCode>('STEADFAST');
  const [bookWeight, setBookWeight] = useState('1.0');
  const [isBooking, setIsBooking] = useState(false);

  const showToast = (message: string, isError = false) => {
    setFeedback({ message, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        status: statusFilter,
        provider: providerFilter,
      });
      const res = await fetch(`/api/admin/couriers?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setProviders(data.providers);
        setShipments(data.shipments);
      } else {
        showToast(data.error || 'তথ্য লোড ব্যর্থ', true);
      }
    } catch (e: any) {
      showToast('সার্ভার সংযোগে ত্রুটি', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [statusFilter, providerFilter]);

  // Fetch COD Settlement data
  const loadSettlementData = async () => {
    try {
      const res = await fetch('/api/admin/couriers/settlements');
      const data = await res.json();
      if (data.success) {
        setSettlementData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'settlement') {
      loadSettlementData();
    }
  }, [activeTab]);

  // Live Tracking Modal Action
  const handleTrackShipment = async (shipment: ShipmentItem) => {
    setIsTrackingLoading(true);
    setTrackingModalData({
      shipmentNumber: shipment.shipmentNumber,
      trackingNumber: shipment.trackingNumber || shipment.consignmentId,
      courierName: shipment.courierName,
      status: shipment.status,
      recipientName: shipment.recipientName,
      shippingPhone: shipment.shippingPhone,
      shippingAddress: shipment.shippingAddress,
      loading: true,
    });

    try {
      const res = await fetch(`/api/admin/couriers/shipments/${shipment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'track' }),
      });
      const data = await res.json();
      if (data.success) {
        setTrackingModalData((prev: any) => ({
          ...prev,
          loading: false,
          checkpoints: data.checkpoints || [],
          currentStatus: data.currentStatus,
          courierRawStatus: data.courierRawStatus,
        }));
      } else {
        setTrackingModalData((prev: any) => ({
          ...prev,
          loading: false,
          error: data.message || 'ট্র্যাকিং তথ্য পাওয়া যায়নি।',
        }));
      }
    } catch (e) {
      setTrackingModalData((prev: any) => ({
        ...prev,
        loading: false,
        error: 'কুরিয়ার ট্র্যাকিং সার্ভারে সংযোগ ব্যর্থ।',
      }));
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Print Label Action
  const handlePrintLabel = async (shipment: ShipmentItem) => {
    try {
      const res = await fetch(`/api/admin/couriers/shipments/${shipment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'print_label' }),
      });
      const data = await res.json();
      if (data.success) {
        setPrintableLabel(data.labelData);
        // Refresh local list to show labelPrintedAt
        setShipments((prev) =>
          prev.map((s) => (s.id === shipment.id ? { ...s, labelPrintedAt: new Date().toISOString() } : s))
        );
      } else {
        showToast(data.error || 'লেবেল তৈরি ব্যর্থ', true);
      }
    } catch (e) {
      showToast('লেবেল প্রিন্ট সংযোগ সমস্যা', true);
    }
  };

  // Cancel Shipment Action
  const handleCancelShipment = async (shipment: ShipmentItem) => {
    const confirmCancel = window.confirm(
      `আপনি কি নিশ্চিত যে শিপমেন্ট "${shipment.shipmentNumber}" (${shipment.courierName}) বাতিল করতে চান?`
    );
    if (!confirmCancel) return;

    try {
      const res = await fetch(`/api/admin/couriers/shipments/${shipment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: 'Admin cancelled from dashboard' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'শিপমেন্ট সফলভাবে বাতিল করা হয়েছে।');
        loadDashboardData();
      } else {
        showToast(data.error || 'শিপমেন্ট বাতিল ব্যর্থ', true);
      }
    } catch (e) {
      showToast('অপারেশন ব্যর্থ', true);
    }
  };

  // Test Connection Action
  const handleTestConnection = async (code: CourierCode, tempSettings?: Record<string, string>) => {
    setProviderTestingStatus((prev) => ({
      ...prev,
      [code]: { loading: true },
    }));

    try {
      const res = await fetch('/api/admin/couriers/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, settings: tempSettings }),
      });
      const data = await res.json();
      setProviderTestingStatus((prev) => ({
        ...prev,
        [code]: { loading: false, res: data },
      }));
    } catch (e) {
      setProviderTestingStatus((prev) => ({
        ...prev,
        [code]: { loading: false, res: { success: false, message: 'নেটওয়ার্ক অনুরোধ ব্যর্থ হয়েছে।' } },
      }));
    }
  };

  // Save Provider Settings
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editingProvider.code,
          isDefault: editingProvider.isDefault,
          isEnabled: editingProvider.isEnabled,
          isSandbox: editingProvider.isSandbox,
          apiBaseUrl: editingProvider.apiBaseUrl,
          settings: providerFormSettings,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setEditingProvider(null);
        loadDashboardData();
      } else {
        showToast(data.error || 'সেটিংস সংরক্ষণ ব্যর্থ', true);
      }
    } catch (e) {
      showToast('সংরক্ষণ ব্যর্থ', true);
    }
  };

  // Submit Settlement Reconciliation
  const handleSubmitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSettlementShipmentIds.length === 0) {
      showToast('অনুগ্রহ করে ন্যূনতম একটি ডেলিভারিকৃত পার্সেল সিলেক্ট করুন।', true);
      return;
    }

    setIsSubmittingSettlement(true);
    try {
      const res = await fetch('/api/admin/couriers/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierCode: 'STEADFAST',
          shipmentIds: selectedSettlementShipmentIds,
          remittanceRef,
          notes: 'ড্যাশবোর্ড থেকে রিকনসিলিয়েশন সম্পন্ন।',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setSelectedSettlementShipmentIds([]);
        setRemittanceRef('');
        loadSettlementData();
        loadDashboardData();
      } else {
        showToast(data.error || 'সেটেলমেন্ট ব্যর্থ', true);
      }
    } catch (e) {
      showToast('সেটেলমেন্ট সম্পন্ন করা যায়নি', true);
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  // Manual Booking Action
  const handleManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookOrderId.trim()) {
      showToast('অর্ডার আইডি বা অর্ডার নম্বর দিন।', true);
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: bookOrderId.trim(),
          courierCode: bookCourierCode,
          weightKg: parseFloat(bookWeight) || 1.0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setBookOrderId('');
        setActiveTab('shipments');
        loadDashboardData();
      } else {
        showToast(data.error || 'বুকিং ব্যর্থ হয়েছে।', true);
      }
    } catch (e) {
      showToast('সার্ভার অনুরোধ ব্যর্থ হয়েছে।', true);
    } finally {
      setIsBooking(false);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'PENDING_PICKUP':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">পিকআপের অপেক্ষায়</span>;
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">পথে রয়েছে (In Transit)</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">ডেলিভারির জন্য বের হয়েছে</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">ডেলিভারি সম্পন্ন</span>;
      case 'RETURNED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">রিটার্ন এসেছে</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">বাতিলকৃত</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 transition-all ${
            feedback.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
          }`}
        >
          {feedback.isError ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Truck className="w-7 h-7 text-shubban-gold" />
            <span>কুরিয়ার ও ডেলিভারি ম্যানেজমেন্ট সিস্টেম</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Steadfast, Pathao ও REDX API ইন্টিগ্রেশন, রিয়েল-টাইম ট্র্যাকিং, COD সেটেলমেন্ট ও প্রিন্টিং।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('book')}
            className="px-4 py-2 bg-shubban-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-shubban-primary/90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পার্সেল বুক করুন</span>
          </button>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>মোট পার্সেল</span>
            <Package className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.totalShipments)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 text-xs">
            <span>পিকআপের অপেক্ষায়</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-amber-600">
            {toBengaliNumber(stats.pendingPickups)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 text-xs">
            <span>পথে রয়েছে</span>
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-blue-600">
            {toBengaliNumber(stats.inTransit)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs">
            <span>ডেলিভারি সম্পন্ন</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-emerald-600">
            {toBengaliNumber(stats.delivered)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 text-xs">
            <span>রিটার্ন / বাতিল</span>
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-rose-600">
            {toBengaliNumber(stats.returned + stats.cancelled)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-purple-600 text-xs">
            <span>বকেয়া COD রিসিভেবল</span>
            <Banknote className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold font-mono mt-1 text-purple-600 truncate">
            {formatTaka(stats.pendingCodSettlement)}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-2">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'shipments'
              ? 'text-shubban-primary dark:text-shubban-gold border-b-2 border-shubban-primary dark:border-shubban-gold'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          পার্সেল ও ট্র্যাকিং তালিকা ({toBengaliNumber(shipments.length)})
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'providers'
              ? 'text-shubban-primary dark:text-shubban-gold border-b-2 border-shubban-primary dark:border-shubban-gold'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          কুরিয়ার প্রোভাইডার সেটিংস ({toBengaliNumber(providers.length)})
        </button>

        <button
          onClick={() => setActiveTab('settlement')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'settlement'
              ? 'text-shubban-primary dark:text-shubban-gold border-b-2 border-shubban-primary dark:border-shubban-gold'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          COD রেমিট্যান্স ও সেটেলমেন্ট
        </button>

        <button
          onClick={() => setActiveTab('book')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'book'
              ? 'text-shubban-primary dark:text-shubban-gold border-b-2 border-shubban-primary dark:border-shubban-gold'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          ম্যানুয়াল কুরিয়ার বুকিং
        </button>
      </div>

      {/* TAB 1: SHIPMENTS LIST */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-shubban-darkCard p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="অর্ডার নং, ট্র্যাকিং কোড বা ফোন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDashboardData()}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-1 focus:ring-shubban-primary"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none text-stone-700 dark:text-stone-300"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="PENDING_PICKUP">পিকআপের অপেক্ষায়</option>
                <option value="IN_TRANSIT">ইন ট্রানজিট</option>
                <option value="OUT_FOR_DELIVERY">ডেলিভারির জন্য বের হয়েছে</option>
                <option value="DELIVERED">ডেলিভারি সম্পন্ন</option>
                <option value="RETURNED">রিটার্ন</option>
                <option value="CANCELLED">বাতিল</option>
              </select>

              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none text-stone-700 dark:text-stone-300"
              >
                <option value="ALL">সকল কুরিয়ার</option>
                <option value="STEADFAST">Steadfast Courier</option>
                <option value="PATHAO">Pathao Courier</option>
                <option value="REDX">REDX</option>
              </select>
            </div>
          </div>

          {/* Shipments Table */}
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">শিপমেন্ট ও অর্ডার নং</th>
                    <th className="py-3 px-4 font-bold">কুরিয়ার ও ট্র্যাকিং</th>
                    <th className="py-3 px-4 font-bold">গ্রাহকের তথ্য</th>
                    <th className="py-3 px-4 font-bold">সিওডি ও চার্জ</th>
                    <th className="py-3 px-4 font-bold">স্ট্যাটাস</th>
                    <th className="py-3 px-4 font-bold text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {shipments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        কোনো পার্সেল পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s) => {
                      const trackingCode = s.trackingNumber || s.consignmentId || s.shipmentNumber;
                      return (
                        <tr key={s.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-900/30 transition">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                              {s.shipmentNumber}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              অর্ডার: <span className="font-mono">{s.orderNumber}</span>
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {new Date(s.createdAt).toLocaleDateString('bn-BD')}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-800 dark:text-stone-200">
                              {s.courierName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-xs text-shubban-primary dark:text-shubban-gold select-all">
                                {trackingCode}
                              </span>
                              <button
                                onClick={() => copyToClipboard(trackingCode, s.id)}
                                className="text-stone-400 hover:text-stone-600"
                                title="কপি করুন"
                              >
                                {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900 dark:text-stone-100">
                              {s.recipientName}
                            </div>
                            <div className="text-stone-500 font-mono text-[11px]">{s.shippingPhone}</div>
                            <div className="text-[11px] text-stone-400 truncate max-w-xs" title={s.shippingAddress}>
                              {s.shippingAddress}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-stone-900 dark:text-stone-100">
                              {formatTaka(s.codAmount)}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              কুরিয়ার ফি: {formatTaka(s.courierFee)} ({s.weightKg} কেজি)
                            </div>
                            {s.isRemitted && (
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 rounded">
                                রেমিট্যান্স সেটেল্ড
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">{getStatusBadge(s.status)}</td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleTrackShipment(s)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 rounded-lg flex items-center gap-1 transition"
                                title="লাইভ ট্র্যাকিং দেখুন"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>ট্র্যাক</span>
                              </button>

                              <button
                                onClick={() => handlePrintLabel(s)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-shubban-primary/10 hover:bg-shubban-primary/20 text-shubban-primary dark:text-shubban-gold rounded-lg flex items-center gap-1 transition"
                                title="প্যাকিং লেবেল প্রিন্ট করুন"
                              >
                                <Printer className="w-3 h-3" />
                                <span>লেবেল</span>
                              </button>

                              {s.status !== 'CANCELLED' && s.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleCancelShipment(s)}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                  title="শিপমেন্ট বাতিল করুন"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
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
        </div>
      )}

      {/* TAB 2: COURIER PROVIDERS & CREDENTIALS */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {providers.map((p) => {
            const testing = providerTestingStatus[p.code];
            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-shubban-gold/15 text-shubban-gold flex items-center justify-center font-bold">
                        {p.code.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {p.name}
                        </h3>
                        <span className="text-[10px] text-stone-400 font-mono">{p.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          ডিফল্ট
                        </span>
                      )}
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          p.isEnabled ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                        title={p.isEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-stone-600 dark:text-stone-300">
                    <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-800/40">
                      <span className="text-stone-400">এনভায়রনমেন্ট:</span>
                      <span className="font-semibold">{p.isSandbox ? 'স্যান্ডবক্স / টেস্ট' : 'লাইভ প্রোডাকশন'}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-800/40">
                      <span className="text-stone-400">বুকড পার্সেল:</span>
                      <span className="font-mono font-bold">{toBengaliNumber(p.shipmentCount)}টি</span>
                    </div>

                    <div className="py-1">
                      <span className="text-stone-400 block mb-1">প্রয়োজনীয় ক্রেডেনশিয়াল:</span>
                      <div className="flex flex-wrap gap-1">
                        {p.settings.map((s) => (
                          <span
                            key={s.key}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              s.hasValue
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {s.key}: {s.hasValue ? 'সেট করা' : 'অনুপস্থিত'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testing Feedback Box */}
                  {testing?.res && (
                    <div
                      className={`mt-3 p-2.5 rounded-xl text-[11px] ${
                        testing.res.success
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      <div className="font-bold">{testing.res.message}</div>
                      {testing.res.balance !== undefined && (
                        <div>ব্যালেন্স: ৳{testing.res.balance}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTestConnection(p.code)}
                    disabled={testing?.loading}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition flex items-center gap-1 text-stone-700 dark:text-stone-300"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing?.loading ? 'animate-spin' : ''}`} />
                    <span>সংযোগ পরীক্ষা</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProvider(p);
                      const initialMap: Record<string, string> = {};
                      p.settings.forEach((s) => {
                        initialMap[s.key] = s.value || '';
                      });
                      setProviderFormSettings(initialMap);
                    }}
                    className="px-3 py-1.5 bg-shubban-primary text-white rounded-xl text-xs font-semibold hover:bg-shubban-primary/90 transition flex items-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>কনফিগার</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: COD SETTLEMENT & REMITTANCE */}
      {activeTab === 'settlement' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-xs text-stone-500">অনিষ্পন্ন পার্সেল (Unremitted)</span>
              <div className="text-2xl font-bold font-mono mt-1 text-stone-900 dark:text-stone-100">
                {toBengaliNumber(settlementData?.summary?.unremittedCount || 0)}টি
              </div>
              <p className="text-[11px] text-stone-400 mt-1">কুরিয়ার ডেলিভারি সম্পন্ন কিন্তু অর্থ জমা হয়নি।</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-xs text-stone-500">মোট সংগৃহীত সিওডি (Total COD)</span>
              <div className="text-2xl font-bold font-mono mt-1 text-emerald-600">
                {formatTaka(settlementData?.summary?.unremittedTotalCod || 0)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">গ্রাহকদের থেকে কুরিয়ার কর্তৃক সংগৃহীত।</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-xs text-stone-500">প্রাপ্য নেট রেমিট্যান্স (Net Receivable)</span>
              <div className="text-2xl font-bold font-mono mt-1 text-purple-600">
                {formatTaka(settlementData?.summary?.estimatedNetPending || 0)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">কুরিয়ার ডেলিভারি ফি কাটার পর ব্যাংক প্রাপ্য।</p>
            </div>
          </div>

          {/* Unremitted Shipments Table & Reconciliation Form */}
          <div className="bg-white dark:bg-shubban-darkCard p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base">
                  বকেয়া সিওডি পার্সেল নির্বাচন ও রেমিট্যান্স সেটেলমেন্ট
                </h3>
                <p className="text-xs text-stone-500">
                  কুরিয়ার থেকে প্রাপ্ত ব্যাংক ইনভয়েস মিলিয়ে পার্সেলগুলোকে সেটেল্ড চিহ্নিত করুন।
                </p>
              </div>

              {selectedSettlementShipmentIds.length > 0 && (
                <button
                  onClick={() => setSelectedSettlementShipmentIds([])}
                  className="text-xs text-stone-500 underline"
                >
                  সব ডিসিলেক্ট করুন
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={
                          settlementData?.unremittedShipments?.length > 0 &&
                          selectedSettlementShipmentIds.length === settlementData?.unremittedShipments?.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSettlementShipmentIds(
                              settlementData?.unremittedShipments?.map((s: any) => s.id) || []
                            );
                          } else {
                            setSelectedSettlementShipmentIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-2.5 px-3">শিপমেন্ট নং</th>
                    <th className="py-2.5 px-3">অর্ডার নং</th>
                    <th className="py-2.5 px-3">কুরিয়ার</th>
                    <th className="py-2.5 px-3">সংগৃহীত COD</th>
                    <th className="py-2.5 px-3">কুরিয়ার ফি</th>
                    <th className="py-2.5 px-3">ডেলিভারির তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {(!settlementData?.unremittedShipments || settlementData.unremittedShipments.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-stone-400">
                        কোনো বকেয়া সিওডি পার্সেল নেই। সকল ডেলিভারির অর্থ সেটেল্ড রয়েছে।
                      </td>
                    </tr>
                  ) : (
                    settlementData.unremittedShipments.map((s: any) => (
                      <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/40">
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={selectedSettlementShipmentIds.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSettlementShipmentIds([...selectedSettlementShipmentIds, s.id]);
                              } else {
                                setSelectedSettlementShipmentIds(
                                  selectedSettlementShipmentIds.filter((id) => id !== s.id)
                                );
                              }
                            }}
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-stone-800 dark:text-stone-200">
                          {s.shipmentNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-600 dark:text-stone-400">
                          {s.orderNumber}
                        </td>
                        <td className="py-2.5 px-3">{s.courierName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                          {formatTaka(s.codAmount)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-500">
                          {formatTaka(s.courierFee)}
                        </td>
                        <td className="py-2.5 px-3 text-stone-400 text-[11px]">
                          {s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString('bn-BD') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedSettlementShipmentIds.length > 0 && (
              <form onSubmit={handleSubmitSettlement} className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="কুরিয়ার রেমিট্যান্স রেফারেন্স / ব্যাংক ইনভয়েস নং..."
                  value={remittanceRef}
                  onChange={(e) => setRemittanceRef(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingSettlement}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    নির্বাচিত {toBengaliNumber(selectedSettlementShipmentIds.length)}টি পার্সেল সেটেল করুন
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* Past Settlements History Table */}
          <div className="bg-white dark:bg-shubban-darkCard p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base">
              অতীত সেটেলমেন্ট হিস্ট্রি (Past Remittances)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400">
                  <tr>
                    <th className="py-2.5 px-3">সেটেলমেন্ট নং</th>
                    <th className="py-2.5 px-3">কুরিয়ার</th>
                    <th className="py-2.5 px-3">পার্সেল সংখ্যা</th>
                    <th className="py-2.5 px-3">মোট COD</th>
                    <th className="py-2.5 px-3">প্রাপ্ত রেমিট্যান্স</th>
                    <th className="py-2.5 px-3">রেফারেন্স</th>
                    <th className="py-2.5 px-3">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {(!settlementData?.settlements || settlementData.settlements.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-stone-400">
                        পূর্বে কোনো সেটেলমেন্ট রেকর্ড নেই।
                      </td>
                    </tr>
                  ) : (
                    settlementData.settlements.map((st: any) => (
                      <tr key={st.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/40">
                        <td className="py-2.5 px-3 font-mono font-bold">{st.settlementNumber}</td>
                        <td className="py-2.5 px-3">{st.courierCode}</td>
                        <td className="py-2.5 px-3 font-mono">{toBengaliNumber(st.totalShipments)}টি</td>
                        <td className="py-2.5 px-3 font-mono">{formatTaka(st.totalCodAmount)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                          {formatTaka(st.amountReceived)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">
                          {st.remittanceRef}
                        </td>
                        <td className="py-2.5 px-3 text-stone-400 text-[11px]">
                          {new Date(st.createdAt).toLocaleDateString('bn-BD')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL BOOKING */}
      {activeTab === 'book' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-shubban-darkCard p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-shubban-gold" />
              <span>সরাসরি কুরিয়ার পার্সেল বুকিং</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              যেকোনো সক্রিয় অর্ডারের জন্য সংশ্লিষ্ট কুরিয়ারের অফিশিয়াল এপিআইতে কনসাইনমেন্ট তৈরি করুন।
            </p>
          </div>

          <form onSubmit={handleManualBooking} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                অর্ডার আইডি (Order ID):
              </label>
              <input
                type="text"
                placeholder="যেমন: cm2x... বা অর্ডারের ডাটাবেজ আইডি"
                value={bookOrderId}
                onChange={(e) => setBookOrderId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                required
              />
              <p className="text-[10px] text-stone-400 mt-1">
                টিপ: অর্ডার তালিকা থেকে সরাসরি &apos;কুরিয়ার বুকিং&apos; বাটনে ক্লিক করেও এক ক্লিকে বুক করতে পারেন।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  কুরিয়ার পার্টনার:
                </label>
                <select
                  value={bookCourierCode}
                  onChange={(e) => setBookCourierCode(e.target.value as CourierCode)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-semibold"
                >
                  <option value="STEADFAST">Steadfast Courier</option>
                  <option value="PATHAO">Pathao Courier</option>
                  <option value="REDX">REDX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ওজন (কেজি):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={bookWeight}
                  onChange={(e) => setBookWeight(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isBooking}
                className="w-full py-3 bg-shubban-primary hover:bg-shubban-primary/90 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                {isBooking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>কুরিয়ার এপিআইতে অনুরোধ পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>কনসাইনমেন্ট নিশ্চিত ও বুক করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TRACKING MODAL */}
      {trackingModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-shubban-darkCard max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-shubban-gold" />
                  <span>লাইভ কুরিয়ার পার্সেল ট্র্যাকিং</span>
                </h3>
                <span className="text-xs text-stone-400 font-mono">
                  {trackingModalData.courierName} — {trackingModalData.trackingNumber}
                </span>
              </div>
              <button
                onClick={() => setTrackingModalData(null)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {trackingModalData.loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-500">
                <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold" />
                <span className="text-xs">কুরিয়ার সার্ভার থেকে ট্র্যাকিং ডাটা নেওয়া হচ্ছে...</span>
              </div>
            ) : trackingModalData.error ? (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs dark:bg-rose-950/60 dark:text-rose-200">
                {trackingModalData.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">বর্তমান স্ট্যাটাস:</span>
                    <span className="font-bold text-emerald-600">
                      {trackingModalData.currentStatus || trackingModalData.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">প্রাপক:</span>
                    <span className="font-semibold">{trackingModalData.recipientName}</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3 pl-2 border-l-2 border-stone-200 dark:border-stone-800 ml-2 max-h-60 overflow-y-auto">
                  {trackingModalData.checkpoints?.map((cp: any, idx: number) => (
                    <div key={idx} className="relative pl-4">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-shubban-gold ring-4 ring-white dark:ring-stone-900" />
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {cp.status || cp.note}
                      </div>
                      {cp.location && <div className="text-[11px] text-stone-500">{cp.location}</div>}
                      <div className="text-[10px] text-stone-400 font-mono">
                        {new Date(cp.time).toLocaleString('bn-BD')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE LABEL MODAL */}
      {printableLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 text-stone-900 shadow-2xl border border-stone-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <span className="font-bold text-sm">শিপিং লেবেল / প্যাকিং স্লিপ</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-stone-900 text-white text-xs rounded font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
                <button onClick={() => setPrintableLabel(null)} className="text-stone-400 hover:text-stone-700">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Label Body (A4/Thermal Printable) */}
            <div className="border-2 border-dashed border-stone-800 p-4 rounded-lg space-y-3 text-xs font-mono">
              <div className="text-center border-b pb-2">
                <h2 className="text-base font-bold font-serif">{printableLabel.storeName}</h2>
                <p className="text-[10px] text-stone-500">{printableLabel.storeDomain} • {printableLabel.storePhone}</p>
                <div className="mt-1 text-xs font-bold bg-stone-100 py-1 rounded">
                  {printableLabel.courierName}
                </div>
              </div>

              <div className="flex justify-between text-[11px] border-b pb-2">
                <div>
                  <span className="text-stone-500 block text-[9px]">ট্র্যাকিং নং:</span>
                  <span className="font-bold">{printableLabel.trackingNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block text-[9px]">অর্ডার নং:</span>
                  <span className="font-bold">{printableLabel.orderNumber}</span>
                </div>
              </div>

              {/* Barcode Mock */}
              <div className="text-center py-2 bg-stone-50 rounded">
                <div className="text-lg tracking-widest font-barcode">|||| | | |||| ||| || ||||</div>
                <span className="text-[10px]">{printableLabel.shipmentNumber}</span>
              </div>

              <div className="border-b pb-2">
                <span className="text-[9px] text-stone-500 block uppercase font-sans">প্রাপক (Deliver To):</span>
                <div className="font-bold font-sans text-sm">{printableLabel.recipientName}</div>
                <div className="font-bold">{printableLabel.recipientPhone}</div>
                <div className="text-[11px] font-sans">{printableLabel.shippingAddress}</div>
              </div>

              <div className="flex justify-between items-center text-sm font-bold bg-stone-100 p-2 rounded">
                <span>সিওডি সংগ্রহ (COD):</span>
                <span>{formatTaka(printableLabel.codAmount)}</span>
              </div>

              <div className="text-[9px] text-stone-500 pt-1">
                ফেরত ঠিকানা: {printableLabel.returnAddress}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROVIDER EDIT MODAL */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-shubban-darkCard max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base">
                  {editingProvider.name} কনফিগারেশন
                </h3>
                <span className="text-xs text-stone-400 font-mono">{editingProvider.code}</span>
              </div>
              <button
                onClick={() => setEditingProvider(null)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-3 text-xs">
              <div className="flex items-center gap-4 py-2 border-b border-stone-100 dark:border-stone-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProvider.isEnabled}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, isEnabled: e.target.checked })
                    }
                  />
                  <span className="font-semibold">সক্রিয় (Enabled)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProvider.isDefault}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, isDefault: e.target.checked })
                    }
                  />
                  <span className="font-semibold">ডিফল্ট কুরিয়ার</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProvider.isSandbox}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, isSandbox: e.target.checked })
                    }
                  />
                  <span className="font-semibold">স্যান্ডবক্স মোড</span>
                </label>
              </div>

              <div>
                <label className="block text-stone-500 mb-1">API Base URL:</label>
                <input
                  type="text"
                  value={editingProvider.apiBaseUrl || ''}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, apiBaseUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                />
              </div>

              {/* Dynamic Credentials Inputs */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-stone-700 dark:text-stone-300 block">
                  API ক্রেডেনশিয়াল ও সিক্রেট:
                </span>
                {editingProvider.settings.map((s) => (
                  <div key={s.key}>
                    <label className="block text-stone-500 mb-0.5 font-mono">{s.key}:</label>
                    <input
                      type={s.isSecret ? 'password' : 'text'}
                      placeholder={s.hasValue ? '•••••••••••• (পরিবর্তন করতে টাইপ করুন)' : 'নতুন মান প্রদান করুন'}
                      value={providerFormSettings[s.key] || ''}
                      onChange={(e) =>
                        setProviderFormSettings({ ...providerFormSettings, [s.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-shubban-primary text-white rounded-xl font-bold shadow"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

