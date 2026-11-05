'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Truck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingBag,
  CreditCard,
  Phone,
  MapPin,
  Clock,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { formatBengaliDate, formatTaka, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface AdminOrderItem {
  id: string;
  bookTitle: string;
  quantity: number;
  price: number;
  format?: string | null;
}

export interface AdminSubOrder {
  id: string;
  subOrderNumber: string;
  vendorName: string;
  payoutAmt: number;
  commissionAmt: number;
  status: string;
  courierName?: string | null;
  trackingNumber?: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  trackingNumber?: string | null;
  createdAt: Date | string;
  items: AdminOrderItem[];
  subOrders: AdminSubOrder[];
}

export default function AdminOrdersClient({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tracking edit state
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('Steadfast');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [bookingLoadingId, setBookingLoadingId] = useState<string | null>(null);
  const [selectedCourierMap, setSelectedCourierMap] = useState<Record<string, string>>({});

  const showBanner = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleInstantCourierBooking = async (order: AdminOrder) => {
    setBookingLoadingId(order.id);
    const courierCode = selectedCourierMap[order.id] || 'STEADFAST';

    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          courierCode,
          recipientName: order.customerName,
          recipientPhone: order.phone,
          recipientAddress: order.address,
          recipientCity: order.city,
          codAmount: order.paymentMethod.toLowerCase() === 'cod' ? order.total : 0,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        const fullTracking = `${data.booking.courierCode}: ${data.booking.trackingNumber || data.booking.consignmentId}`;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, trackingNumber: fullTracking, orderStatus: 'SHIPPED' }
              : o
          )
        );
        showBanner(`কুরিয়ার বুকিং সম্পন্ন! ট্র্যাকিং নং: ${data.booking.trackingNumber || data.booking.consignmentId}`);
      } else {
        showBanner(`ত্রুটি: ${data.error || 'বুকিং ব্যর্থ'}`);
      }
    } catch (e: any) {
      showBanner('কুরিয়ার সার্ভার সংযোগ ব্যর্থ');
    } finally {
      setBookingLoadingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (res.ok) {
        setOrders(orders.map((o) => (o.id === id ? { ...o, orderStatus: newStatus } : o)));
        showBanner('অর্ডারের ডেলিভারি স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaymentStatusChange = async (id: string, newPaymentStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (res.ok) {
        setOrders(orders.map((o) => (o.id === id ? { ...o, paymentStatus: newPaymentStatus } : o)));
        showBanner('পেমেন্ট স্ট্যাটাস আপডেট করা হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTracking = async (id: string) => {
    try {
      const fullTracking = trackingInput.trim() ? `${courierInput}: ${trackingInput.trim()}` : null;
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: fullTracking,
          orderStatus: 'SHIPPED',
        }),
      });

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === id ? { ...o, trackingNumber: fullTracking, orderStatus: 'SHIPPED' } : o
          )
        );
        setEditingTrackingId(null);
        setTrackingInput('');
        showBanner('শিপিং ট্র্যাকিং নম্বর সংরক্ষিত হয়েছে এবং স্ট্যাটাস SHIPPED করা হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">প্রক্রিয়াধীন</span>;
      case 'PACKED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">প্যাকিং সম্পন্ন</span>;
      case 'SHIPPED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">শিপড / ট্র্যাকিংযুক্ত</span>;
      case 'DELIVERED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">ডেলিভারি সম্পন্ন</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">বাতিল</span>;
    }
  };

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedOrders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="অর্ডার #, গ্রাহকের নাম, ফোন বা ট্র্যাকিং দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="ALL">সকল অর্ডার স্ট্যাটাস</option>
            <option value="PROCESSING">PROCESSING (প্রক্রিয়াধীন)</option>
            <option value="PACKED">PACKED (প্যাকিং সম্পন্ন)</option>
            <option value="SHIPPED">SHIPPED (শিপড)</option>
            <option value="DELIVERED">DELIVERED (ডেলিভারি সম্পন্ন)</option>
            <option value="CANCELLED">CANCELLED (বাতিলকৃত)</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="ALL">সকল পেমেন্ট স্ট্যাটাস</option>
            <option value="PAID">পরিশোধিত (PAID)</option>
            <option value="PENDING">অপেক্ষমাণ (PENDING)</option>
            <option value="FAILED">ব্যর্থ (FAILED)</option>
          </select>
        </div>

        {feedback && (
          <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">অর্ডার নম্বর</th>
                <th className="p-3.5">গ্রাহক ও ঠিকানা</th>
                <th className="p-3.5">সর্বমোট মূল্য</th>
                <th className="p-3.5">পেমেন্ট মেথড ও অবস্থা</th>
                <th className="p-3.5">ডেলিভারি স্ট্যাটাস</th>
                <th className="p-3.5">কুরিয়ার ট্র্যাকিং</th>
                <th className="p-3.5 text-right">চালান ও অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {paginatedOrders.map((o) => {
                const isExpanded = expandedId === o.id;
                return (
                  <React.Fragment key={o.id}>
                    <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-3.5 font-bold font-mono text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : o.id)}
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
                            title="বিস্তারিত দেখুন / বন্ধ করুন"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="text-shubban-gold hover:underline font-bold"
                          >
                            #{o.orderNumber}
                          </Link>
                        </div>
                        <span className="block text-[10px] text-stone-400 font-sans mt-0.5 ml-6">
                          {formatBengaliDate(o.createdAt)}
                        </span>
                      </td>

                      <td className="p-3.5 text-stone-700 dark:text-stone-300">
                        <span className="font-bold block text-stone-900 dark:text-stone-100">
                          {o.customerName}
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono block">
                          {o.phone}
                        </span>
                        <span className="text-[10px] text-stone-400 block line-clamp-1">
                          {o.address}, {o.city}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-shubban-green dark:text-shubban-gold">
                        <span className="text-sm font-mono">{formatTaka(o.total)}</span>
                        <span className="block text-[10px] text-stone-400 font-sans">
                          ({toBengaliNumber(o.items.length)}টি বই/পণ্য)
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono uppercase font-bold text-stone-800 dark:text-stone-200 block">
                          {o.paymentMethod}
                        </span>
                        <select
                          value={o.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(o.id, e.target.value)}
                          className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            o.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40'
                          }`}
                        >
                          <option value="PAID">পরিশোধিত (PAID)</option>
                          <option value="PENDING">অপেক্ষমাণ (PENDING)</option>
                          <option value="FAILED">ব্যর্থ (FAILED)</option>
                        </select>
                      </td>

                      <td className="p-3.5">
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                        >
                          <option value="PROCESSING">PROCESSING (প্রক্রিয়াধীন)</option>
                          <option value="PACKED">PACKED (প্যাকিং সম্পন্ন)</option>
                          <option value="SHIPPED">SHIPPED (শিপড)</option>
                          <option value="DELIVERED">DELIVERED (ডেলিভারি সম্পন্ন)</option>
                          <option value="CANCELLED">CANCELLED (বাতিলকৃত)</option>
                        </select>
                        <div className="mt-1">{getOrderStatusBadge(o.orderStatus)}</div>
                      </td>

                      <td className="p-3.5">
                        {editingTrackingId === o.id ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={courierInput}
                              onChange={(e) => setCourierInput(e.target.value)}
                              className="text-[10px] px-1 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                            >
                              <option value="Steadfast">Steadfast</option>
                              <option value="Pathao">Pathao</option>
                              <option value="RedX">RedX</option>
                              <option value="Sundarban">Sundarban</option>
                            </select>
                            <input
                              type="text"
                              value={trackingInput}
                              onChange={(e) => setTrackingInput(e.target.value)}
                              placeholder="কোড লিখুন..."
                              className="w-24 text-[10px] px-1.5 py-1 rounded border border-stone-300 dark:border-stone-700 font-mono"
                            />
                            <button
                              onClick={() => handleSaveTracking(o.id)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="সংরক্ষণ"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingTrackingId(null)}
                              className="p-1 rounded bg-stone-200 text-stone-700 hover:bg-stone-300"
                              title="বাতিল"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {o.trackingNumber ? (
                              <span className="font-mono text-[11px] font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                                {o.trackingNumber}
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-400">ট্র্যাকিং নেই</span>
                            )}
                            <button
                              onClick={() => {
                                setEditingTrackingId(o.id);
                                setTrackingInput(o.trackingNumber ? o.trackingNumber.split(': ')[1] || o.trackingNumber : '');
                              }}
                              className="p-1 text-stone-400 hover:text-shubban-gold rounded"
                              title="ট্র্যাকিং কোড দিন"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="px-2.5 py-1 rounded-lg bg-shubban-primary hover:bg-shubban-primary/90 text-white text-[11px] font-bold inline-flex items-center gap-1 transition shadow-xs"
                          >
                            <Truck className="w-3 h-3 text-shubban-gold" />
                            <span>কুরিয়ার ও বিস্তারিত</span>
                          </Link>
                          <Link
                            href={`/order-confirmation?orderNumber=${o.orderNumber}`}
                            target="_blank"
                            className="text-stone-500 hover:text-stone-700 dark:text-stone-400 font-medium text-[11px] inline-flex items-center gap-1"
                          >
                            <span>চালান</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Order Items & Sub-Orders details */}
                    {isExpanded && (
                      <tr className="bg-stone-50/80 dark:bg-stone-900/60">
                        <td colSpan={7} className="p-4 sm:p-5 border-t border-b border-stone-200 dark:border-stone-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Items List */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-shubban-gold" />
                                <span>অর্ডারকৃত পণ্য তালিকা ({toBengaliNumber(o.items.length)}টি):</span>
                              </h4>
                              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
                                {o.items.map((item) => (
                                  <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                                        {item.bookTitle}
                                      </span>
                                      <span className="text-[10px] text-stone-400">
                                        ফরম্যাট: {item.format || 'হার্ডকভার'}
                                      </span>
                                    </div>
                                    <div className="text-right font-mono">
                                      <span className="text-stone-500 block">
                                        {toBengaliNumber(item.quantity)} × {formatTaka(item.price)}
                                      </span>
                                      <span className="font-bold text-shubban-green dark:text-shubban-gold">
                                        {formatTaka(item.price * item.quantity)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* SubOrders & Shipping Breakdown */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-shubban-gold" />
                                <span>মাল্টি-ভেন্ডর সাব-অর্ডার ও ডেলিভারি বিবরণ:</span>
                              </h4>
                              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-3 space-y-2 text-xs">
                                {o.subOrders.length > 0 ? (
                                  o.subOrders.map((so) => (
                                    <div key={so.id} className="p-2 bg-stone-50 dark:bg-stone-800/60 rounded-lg flex items-center justify-between">
                                      <div>
                                        <span className="font-bold block text-stone-800 dark:text-stone-200">
                                          বিক্রেতা: {so.vendorName}
                                        </span>
                                        <span className="text-[10px] text-stone-400 font-mono">
                                          সাব-অর্ডার: #{so.subOrderNumber}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-emerald-600 font-mono block text-[11px]">
                                          পে-আউট: {formatTaka(so.payoutAmt)}
                                        </span>
                                        <span className="text-[10px] text-stone-400">
                                          কমিশন: {formatTaka(so.commissionAmt)}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-stone-400 text-xs">সরাসরি শুভ্র প্রকাশনী ও মূল হাব থেকে সরবরাহকৃত।</p>
                                )}

                                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between text-stone-500 text-[11px]">
                                  <span>সাবটোটাল: {formatTaka(o.subtotal)} | শিপিং: {formatTaka(o.shippingFee)} | ছাড়: {formatTaka(o.discount)}</span>
                                  <span className="font-bold text-stone-900 dark:text-stone-100">সর্বমোট: {formatTaka(o.total)}</span>
                                </div>
                              </div>

                              {/* One-click Courier Logistics Box */}
                              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                    <Truck className="w-4 h-4 text-shubban-gold" />
                                    <span>স্বয়ংক্রিয় কুরিয়ার এপিআই বুকিং</span>
                                  </span>
                                  <span className="text-[10px] text-stone-500 block mt-0.5">
                                    Steadfast / Pathao / REDX কনসাইনমেন্ট ও ট্র্যাকিং আইডি স্বয়ংক্রিয়ভাবে জেনারেট করুন।
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <select
                                    value={selectedCourierMap[o.id] || 'STEADFAST'}
                                    onChange={(e) =>
                                      setSelectedCourierMap({ ...selectedCourierMap, [o.id]: e.target.value })
                                    }
                                    className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-900 font-semibold text-stone-800 dark:text-stone-200"
                                  >
                                    <option value="STEADFAST">Steadfast Courier</option>
                                    <option value="PATHAO">Pathao Courier</option>
                                    <option value="REDX">REDX Logistics</option>
                                  </select>

                                  <button
                                    onClick={() => handleInstantCourierBooking(o)}
                                    disabled={bookingLoadingId === o.id || Boolean(o.trackingNumber)}
                                    className="px-3.5 py-1.5 bg-shubban-primary hover:bg-shubban-primary/90 text-white font-bold rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                  >
                                    {bookingLoadingId === o.id ? (
                                      <span>বুকিং হচ্ছে...</span>
                                    ) : o.trackingNumber ? (
                                      <span>ইতিমধ্যে বুকড</span>
                                    ) : (
                                      <span>কুরিয়ার বুক করুন</span>
                                    )}
                                  </button>
                                  <Link
                                    href={`/admin/orders/${o.id}`}
                                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 text-stone-200 hover:text-white font-bold rounded-lg transition text-xs whitespace-nowrap inline-flex items-center gap-1"
                                  >
                                    <span>ম্যানুয়াল কন্ট্রোল</span>
                                    <ExternalLink className="w-3 h-3 text-shubban-gold" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={pageSize}
        itemName="অর্ডার"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 15, 25, 50]}
      />
    </div>
  );
}
