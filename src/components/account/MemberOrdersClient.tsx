'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  ExternalLink,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { formatBengaliDate, formatTaka, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface MemberOrder {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  createdAt: string | Date;
  items: {
    id: string;
    title: string;
    quantity: number;
    totalPrice: number;
    type: string;
  }[];
}

export default function MemberOrdersClient({ initialOrders }: { initialOrders: MemberOrder[] }) {
  const [orders, setOrders] = useState<MemberOrder[]>(initialOrders);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('ব্যক্তিগত কারণে বাতিল');
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ message: string; isError?: boolean } | null>(null);

  const showBanner = (message: string, isError = false) => {
    setBanner({ message, isError });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'অর্ডার বাতিল করতে সমস্যা হয়েছে।');
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, orderStatus: 'CANCELLED', paymentStatus: o.paymentStatus === 'PAID' ? 'REFUNDED' : o.paymentStatus }
            : o
        )
      );

      setActiveModalId(null);
      showBanner(data.message || 'অর্ডার সফলভাবে বাতিল করা হয়েছে।');
    } catch (err: any) {
      showBanner(err.message, true);
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ডেলিভারি নিশ্চিতকরণ ব্যর্থ হয়েছে।');
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, orderStatus: 'DELIVERED', paymentStatus: 'PAID' }
            : o
        )
      );

      showBanner(data.message || 'ডেলিভারি প্রাপ্তি সফলভাবে নিশ্চিত করা হয়েছে।');
    } catch (err: any) {
      showBanner(err.message, true);
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> ডেলিভারি সম্পন্ন
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Truck className="w-3 h-3" /> কুরিয়ারে পাঠানো হয়েছে
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3 h-3" /> বাতিল
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3 h-3" /> নিশ্চিতকৃত
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <Clock className="w-3 h-3" /> প্রক্রিয়াধীন
          </span>
        );
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-xs text-stone-400">
        আপনার কোনো অর্ডার নেই।
      </div>
    );
  }

  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            banner.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}
        >
          {banner.isError ? <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
          <span>{banner.message}</span>
        </div>
      )}

      {paginatedOrders.map((ord) => {
        const canCancel = ord.orderStatus === 'PROCESSING' || ord.orderStatus === 'CONFIRMED' || ord.orderStatus === 'PENDING';
        const isShipped = ord.orderStatus === 'SHIPPED';

        return (
          <div
            key={ord.id}
            className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 gap-2 text-xs">
              <div>
                <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100 block">
                  অর্ডার: #{ord.orderNumber}
                </span>
                <span className="text-stone-400 text-[11px]">{formatBengaliDate(ord.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-shubban-green dark:text-shubban-gold">
                  {formatTaka(ord.total)}
                </span>
                {getStatusBadge(ord.orderStatus)}
              </div>
            </div>

            {/* Tracking banner if shipped */}
            {ord.trackingNumber && (
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-stone-600 dark:text-stone-300">
                      কুরিয়ার পার্টনার: <strong>{ord.courierName || 'Steadfast / Pathao'}</strong>
                    </span>
                    <span className="block text-[11px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                      ট্র্যাকিং নম্বর: {ord.trackingNumber}
                    </span>
                  </div>
                </div>
                {isShipped && (
                  <button
                    onClick={() => handleConfirmDelivery(ord.id)}
                    disabled={confirmingId === ord.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors"
                  >
                    {confirmingId === ord.id ? 'নিশ্চিত হচ্ছে...' : 'পণ্য হাতে পেয়েছি'}
                  </button>
                )}
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              {ord.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {item.type === 'PHYSICAL'
                        ? `মুদ্রিত সংস্করণ (${toBengaliNumber(item.quantity)} কপি)`
                        : 'ডিজিটাল সংস্করণ'}
                    </span>
                  </div>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {formatTaka(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-stone-500 flex items-center gap-2">
                <span>পেমেন্ট: {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus})</span>
              </div>

              <div className="flex items-center gap-3">
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setActiveModalId(ord.id)}
                    className="text-rose-600 hover:text-rose-700 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>অর্ডার বাতিল করুন</span>
                  </button>
                )}

                <Link
                  href={`/order-confirmation?orderNumber=${ord.orderNumber}`}
                  className="font-bold text-shubban-gold hover:underline flex items-center gap-1"
                >
                  <span>চালান ভিউ ও প্রিন্ট</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Cancel Modal */}
            {activeModalId === ord.id && (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 mt-3">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>আপনি কি নিশ্চিত যে অর্ডারটি বাতিল করতে চান?</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  বাতিল করলে সংরক্ষিত বই পুনরায় স্টক ইনভেন্টরিতে ফেরত যাবে। আপনি যদি অনলাইন পেমেন্ট করে থাকেন, তবে রিফান্ড রেকর্ড তৈরি হবে।
                </p>
                <div>
                  <label className="text-[11px] text-stone-700 dark:text-stone-300 font-semibold block mb-1">
                    বাতিল করার কারণ:
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    placeholder="বাতিলের কারণ লিখুন"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveModalId(null)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600"
                  >
                    না, রাখুন
                  </button>
                  <button
                    type="button"
                    disabled={cancellingId === ord.id}
                    onClick={() => handleCancelOrder(ord.id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    {cancellingId === ord.id ? 'বাতিল হচ্ছে...' : 'হ্যাঁ, অর্ডার বাতিল করুন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={orders.length}
        itemsPerPage={pageSize}
        itemName="অর্ডার"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
}

