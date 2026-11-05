'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileText,
  XCircle,
  Edit2,
  Save,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Phone,
  MapPin,
  DollarSign,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import { CourierCode, ShipmentStatus } from '@/lib/courier/types';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  type: string;
  book: {
    id: string;
    title: string;
    coverImage?: string | null;
    author?: { name: string } | null;
  };
}

interface ShipmentEvent {
  id: string;
  status: string;
  note?: string | null;
  location?: string | null;
  timestamp: string;
}

interface ShipmentData {
  id: string;
  shipmentNumber: string;
  courierCode: CourierCode;
  courierName: string;
  trackingNumber?: string | null;
  consignmentId?: string | null;
  status: ShipmentStatus;
  shippingAddress: string;
  shippingPhone: string;
  recipientName: string;
  weightKg: number;
  codAmount: number;
  courierFee: number;
  createdAt: string;
  deliveredAt?: string | null;
  labelPrintedAt?: string | null;
  invoicePrintedAt?: string | null;
  events?: ShipmentEvent[];
}

interface ProviderOption {
  id: string;
  code: CourierCode;
  name: string;
  status: string;
  isEnabled: boolean;
  isDefault: boolean;
  defaultChargeInsideDhaka: number;
  defaultChargeOutsideDhaka: number;
}

interface OrderDetailProps {
  initialOrder: any;
  providers: ProviderOption[];
}

export default function AdminOrderDetailClient({ initialOrder, providers }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Status edit states
  const [orderStatus, setOrderStatus] = useState<string>(initialOrder.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState<string>(initialOrder.paymentStatus);

  // Customer info edit modal/states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editShippingName, setEditShippingName] = useState(initialOrder.shippingName);
  const [editShippingPhone, setEditShippingPhone] = useState(initialOrder.shippingPhone);
  const [editShippingAddress, setEditShippingAddress] = useState(initialOrder.shippingAddress);
  const [editShippingCity, setEditShippingCity] = useState(initialOrder.shippingCity || 'ঢাকা');

  // Courier Selection & Booking Form State
  const activeShipment: ShipmentData | undefined = order.shipments?.find(
    (s: ShipmentData) => s.status !== 'CANCELLED'
  );

  const [selectedCourier, setSelectedCourier] = useState<CourierCode>('STEADFAST');
  const [manualCourierName, setManualCourierName] = useState('সুন্দরবন কুরিয়ার সার্ভিস');
  const [manualTrackingNo, setManualTrackingNo] = useState('');
  const [manualConsignmentId, setManualConsignmentId] = useState('');
  const [manualCourierFee, setManualCourierFee] = useState('60');
  const [parcelWeight, setParcelWeight] = useState('1.0');
  const [bookingCodAmount, setBookingCodAmount] = useState(
    initialOrder.paymentMethod === 'cod' ? String(initialOrder.total) : '0'
  );
  const [adminNotes, setAdminNotes] = useState('');

  // Confirmation Modal State (MANDATORY REQUIREMENT 5)
  const [showBookingConfirmModal, setShowBookingConfirmModal] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Print Modals
  const [printableLabel, setPrintableLabel] = useState<any | null>(null);
  const [printableInvoice, setPrintableInvoice] = useState<any | null>(null);

  // Tracking Modal State
  const [trackingModalData, setTrackingModalData] = useState<any | null>(null);

  // Manual Shipment Edit State
  const [isEditingManualShipment, setIsEditingManualShipment] = useState(false);
  const [editManualStatus, setEditManualStatus] = useState<ShipmentStatus>(
    activeShipment?.status || 'BOOKED'
  );
  const [editManualTracking, setEditManualTracking] = useState(
    activeShipment?.trackingNumber || ''
  );
  const [editManualName, setEditManualName] = useState(
    activeShipment?.courierName || ''
  );

  const [copiedCode, setCopiedCode] = useState(false);

  const showToast = (message: string, isError = false) => {
    setFeedback({ message, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Refresh Order Data
  const refreshOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setOrderStatus(data.order.orderStatus);
        setPaymentStatus(data.order.paymentStatus);
        showToast('অর্ডার তথ্য রিফ্রেশ হয়েছে।');
      }
    } catch (e) {
      showToast('তথ্য রিফ্রেশ ব্যর্থ', true);
    } finally {
      setLoading(false);
    }
  };

  // Update Order Status cleanly
  const handleUpdateOrderStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderStatus(newStatus);
        setOrder((prev: any) => ({ ...prev, orderStatus: newStatus }));
        showToast(`অর্ডার স্ট্যাটাস "${newStatus}" হিসেবে সংরক্ষিত হয়েছে।`);
      } else {
        showToast(data.error || 'স্ট্যাটাস আপডেট ব্যর্থ', true);
      }
    } catch (e) {
      showToast('সার্ভার সংযোগ সমস্যা', true);
    }
  };

  // Update Payment Status cleanly
  const handleUpdatePaymentStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus(newStatus);
        setOrder((prev: any) => ({ ...prev, paymentStatus: newStatus }));
        showToast(`পেমেন্ট স্ট্যাটাস "${newStatus}" হিসেবে সংরক্ষিত হয়েছে।`);
      } else {
        showToast(data.error || 'পেমেন্ট স্ট্যাটাস আপডেট ব্যর্থ', true);
      }
    } catch (e) {
      showToast('সার্ভার সংযোগ সমস্যা', true);
    }
  };

  // Save Customer Address Updates
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingName: editShippingName,
          shippingPhone: editShippingPhone,
          shippingAddress: editShippingAddress,
          shippingCity: editShippingCity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder((prev: any) => ({
          ...prev,
          shippingName: editShippingName,
          shippingPhone: editShippingPhone,
          shippingAddress: editShippingAddress,
          shippingCity: editShippingCity,
        }));
        setIsEditingAddress(false);
        showToast('গ্রাহকের ঠিকানা সফলভাবে আপডেট করা হয়েছে।');
      } else {
        showToast(data.error || 'ঠিকানা আপডেট ব্যর্থ', true);
      }
    } catch (e) {
      showToast('ঠিকানা সংরক্ষণ করা যায়নি', true);
    }
  };

  // Execute Booking upon Admin Confirmation (Workflow Step 10)
  const handleConfirmAndExecuteBooking = async () => {
    setIsSubmittingBooking(true);
    setBookingError(null);

    const isManual = selectedCourier === 'MANUAL';
    const payload = {
      orderId: order.id,
      courierCode: selectedCourier,
      recipientName: editShippingName || order.shippingName,
      recipientPhone: editShippingPhone || order.shippingPhone,
      recipientAddress: editShippingAddress || order.shippingAddress,
      recipientCity: editShippingCity || order.shippingCity || 'ঢাকা',
      codAmount: parseFloat(bookingCodAmount) || 0,
      weightKg: parseFloat(parcelWeight) || 1.0,
      isManual,
      manualCourierName: isManual ? manualCourierName : undefined,
      manualTrackingNumber: isManual ? manualTrackingNo : undefined,
      manualConsignmentId: isManual ? manualConsignmentId : undefined,
      manualCourierFee: isManual ? parseFloat(manualCourierFee) : undefined,
      adminNotes,
    };

    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'কুরিয়ার বুকিং সফল হয়েছে!');
        setShowBookingConfirmModal(false);
        refreshOrder();
      } else {
        setBookingError(data.error || 'কুরিয়ার বুকিং অনুরোধ ব্যর্থ হয়েছে।');
      }
    } catch (e: any) {
      setBookingError('সার্ভার সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Print Shipping Label
  const handlePrintLabel = async (shipmentId: string) => {
    try {
      const res = await fetch(`/api/admin/couriers/shipments/${shipmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'print_label' }),
      });
      const data = await res.json();
      if (data.success && data.labelData) {
        setPrintableLabel(data.labelData);
      } else {
        showToast(data.error || 'লেবেল তৈরি করা যায়নি', true);
      }
    } catch (e) {
      showToast('প্রিন্ট সংযোগ সমস্যা', true);
    }
  };

  // Print Invoice
  const handlePrintInvoice = async (shipmentId: string) => {
    try {
      const res = await fetch(`/api/admin/couriers/shipments/${shipmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'print_invoice' }),
      });
      const data = await res.json();
      if (data.success && data.invoiceData) {
        setPrintableInvoice(data.invoiceData);
      } else {
        showToast(data.error || 'চালান তৈরি ব্যর্থ', true);
      }
    } catch (e) {
      showToast('চালান প্রিন্ট ত্রুটি', true);
    }
  };

  // Cancel Shipment
  const handleCancelShipment = async (shipmentId: string) => {
    const confirmCancel = window.confirm(
      'আপনি কি নিশ্চিত যে এই কুরিয়ার শিপমেন্ট বাতিল করতে চান? বাতিল করলে কুরিয়ার ট্র্যাকিং মুছে যাবে।'
    );
    if (!confirmCancel) return;

    try {
      const res = await fetch(`/api/admin/couriers/shipments/${shipmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: 'Admin cancelled from order details' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'শিপমেন্ট বাতিল করা হয়েছে।');
        refreshOrder();
      } else {
        showToast(data.error || 'শিপমেন্ট বাতিল করা যায়নি', true);
      }
    } catch (e) {
      showToast('সার্ভার অনুরোধ ব্যর্থ', true);
    }
  };

  // Live Track Modal
  const handleLiveTrack = async (shipment: ShipmentData) => {
    setTrackingModalData({
      shipmentNumber: shipment.shipmentNumber,
      trackingNumber: shipment.trackingNumber || shipment.consignmentId,
      courierName: shipment.courierName,
      status: shipment.status,
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
          currentStatus: data.currentStatus,
          checkpoints: data.checkpoints || [],
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
        error: 'কুরিয়ার সার্ভার সংযোগ ব্যর্থ।',
      }));
    }
  };

  // Update Manual Shipment
  const handleSaveManualShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;

    try {
      const res = await fetch(`/api/admin/couriers/shipments/${activeShipment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_manual',
          courierName: editManualName,
          trackingNumber: editManualTracking,
          status: editManualStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'ম্যানুয়াল শিপমেন্ট আপডেট সফল!');
        setIsEditingManualShipment(false);
        refreshOrder();
      } else {
        showToast(data.error || 'আপডেট ব্যর্থ', true);
      }
    } catch (e) {
      showToast('সংরক্ষণ করা যায়নি', true);
    }
  };

  const totalItemsCount = order.items?.reduce((sum: number, i: OrderItem) => sum + i.quantity, 0) || 0;

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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            title="অর্ডার তালিকায় ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 font-mono">
                #{order.orderNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-gold/15 text-shubban-primary dark:text-shubban-gold">
                {order.paymentMethod.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 font-sans">
              তারিখ: {formatBengaliDate(order.createdAt)} • আইডি: <span className="font-mono">{order.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.orderStatus === 'PROCESSING' && (
            <button
              onClick={() => handleUpdateOrderStatus('CONFIRMED')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>অর্ডার নিশ্চিত করুন (Confirm)</span>
            </button>
          )}

          <button
            onClick={refreshOrder}
            disabled={loading}
            className="p-2 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Status Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Order Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase">অর্ডার স্ট্যাটাস (Order Status):</span>
          <select
            value={orderStatus}
            onChange={(e) => handleUpdateOrderStatus(e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
          >
            <option value="PROCESSING">PROCESSING (প্রক্রিয়াধীন)</option>
            <option value="CONFIRMED">CONFIRMED (অনুমোদিত/নিশ্চিত)</option>
            <option value="PACKED">PACKED (প্যাকিং সম্পন্ন)</option>
            <option value="SHIPPED">SHIPPED (শিপড)</option>
            <option value="DELIVERED">DELIVERED (ডেলিভারি সম্পন্ন)</option>
            <option value="CANCELLED">CANCELLED (বাতিলকৃত)</option>
          </select>
        </div>

        {/* Payment Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase">পেমেন্ট স্ট্যাটাস (Payment Status):</span>
          <select
            value={paymentStatus}
            onChange={(e) => handleUpdatePaymentStatus(e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
          >
            <option value="PENDING">PENDING (অপেক্ষমাণ)</option>
            <option value="PAID">PAID (পরিশোধিত)</option>
            <option value="FAILED">FAILED (ব্যর্থ)</option>
            <option value="REFUNDED">REFUNDED (রিফান্ডকৃত)</option>
          </select>
        </div>

        {/* Shipment Status Badge */}
        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase">শিপমেন্ট অবস্থা (Shipment Status):</span>
          <div className="pt-1">
            {activeShipment ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>{activeShipment.status} ({activeShipment.courierName})</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 inline-flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>NOT_BOOKED (কুরিয়ার বুকিং বাকি)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Address Card */}
          <div className="bg-white dark:bg-shubban-darkCard p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-shubban-gold" />
                <span>গ্রাহক ও ডেলিভারি ঠিকানা (Customer Information)</span>
              </h3>
              {!activeShipment && (
                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs text-shubban-primary dark:text-shubban-gold hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingAddress ? 'বাতিল' : 'ঠিকানা সংশোধন'}</span>
                </button>
              )}
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-500 mb-1">গ্রাহকের নাম:</label>
                    <input
                      type="text"
                      value={editShippingName}
                      onChange={(e) => setEditShippingName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1">মোবাইল নম্বর:</label>
                    <input
                      type="text"
                      value={editShippingPhone}
                      onChange={(e) => setEditShippingPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-500 mb-1">পূর্ণ ঠিকানা:</label>
                  <textarea
                    rows={2}
                    value={editShippingAddress}
                    onChange={(e) => setEditShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="px-3 py-1.5 rounded-lg border text-stone-600 dark:text-stone-300"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-shubban-primary text-white rounded-lg font-bold"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block mb-0.5">নাম:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    {order.shippingName || order.user?.name || 'সম্মানিত গ্রাহক'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">মোবাইল:</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{order.shippingPhone}</span>
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-stone-400 block mb-0.5">পূর্ণ ডেলিভারি ঠিকানা:</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-shubban-gold flex-shrink-0 mt-0.5" />
                    <span>{order.shippingAddress}, {order.shippingCity}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ordered Products Table */}
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden space-y-3 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-shubban-gold" />
                <span>অর্ডারকৃত পণ্য তালিকা ({toBengaliNumber(totalItemsCount)}টি)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">পণ্য / বইয়ের নাম</th>
                    <th className="py-2.5 px-3">ফরম্যাট</th>
                    <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                    <th className="py-2.5 px-3 text-right">একক মূল্য</th>
                    <th className="py-2.5 px-3 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {order.items?.map((item: OrderItem) => (
                    <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/40">
                      <td className="py-3 px-3">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          {item.book?.title || 'বই/পণ্য'}
                        </span>
                        {item.book?.author && (
                          <span className="text-[11px] text-stone-400">লেখক: {item.book.author.name}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-stone-800">
                          {item.type || 'PHYSICAL'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {toBengaliNumber(item.quantity)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {formatTaka(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                        {formatTaka(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>পণ্য উপমোট (Subtotal):</span>
                <span className="font-mono">{formatTaka(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>ডেলিভারি চার্জ (Delivery Charge):</span>
                <span className="font-mono">{formatTaka(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>ছাড় / কুপন ডিসকাউন্ট:</span>
                  <span className="font-mono">- {formatTaka(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
                <span>সর্বমোট অর্ডার মূল্য:</span>
                <span className="font-mono text-emerald-600">{formatTaka(order.total)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl">
                <span>ক্যাশ অন ডেলিভারি (COD Amount):</span>
                <span className="font-mono">{order.paymentMethod === 'cod' ? formatTaka(order.total) : '৳ ০ (অনলাইন পরিশোধিত)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: ADMIN COURIER MANAGEMENT SECTION (REQUIREMENTS 2, 3, 4, 7, 9) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-shubban-darkCard p-6 rounded-3xl border-2 border-shubban-gold/30 shadow-md space-y-5">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-shubban-gold" />
                  <span>কুরিয়ার লজিস্টিকস ও বুকিং</span>
                </h3>
                <span className="text-[11px] text-stone-400">অ্যাডমিন নিয়ন্ত্রিত ম্যানুয়াল বুকিং</span>
              </div>
            </div>

            {/* SCENARIO A: SHIPMENT ALREADY BOOKED */}
            {activeShipment ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>শিপমেন্ট বুক করা হয়েছে</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                      {activeShipment.shipmentNumber}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex justify-between">
                      <span className="text-stone-500">কুরিয়ার:</span>
                      <span className="font-bold">{activeShipment.courierName}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">ট্র্যাকিং নম্বর:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-shubban-primary dark:text-shubban-gold">
                        <span>{activeShipment.trackingNumber || activeShipment.consignmentId}</span>
                        <button
                          onClick={() => copyToClipboard(activeShipment.trackingNumber || activeShipment.consignmentId || '')}
                          className="text-stone-400 hover:text-stone-600"
                          title="কপি করুন"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-stone-500">সিওডি সংগ্রহ:</span>
                      <span className="font-mono font-bold">{formatTaka(activeShipment.codAmount)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-stone-500">বর্তমান স্ট্যাটাস:</span>
                      <span className="font-bold text-emerald-600">{activeShipment.status}</span>
                    </div>
                  </div>
                </div>

                {/* Print Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePrintLabel(activeShipment.id)}
                    className="py-2.5 px-3 bg-shubban-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-shubban-primary/90 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>লেবেল প্রিন্ট</span>
                  </button>

                  <button
                    onClick={() => handlePrintInvoice(activeShipment.id)}
                    className="py-2.5 px-3 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-stone-200 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>চালান প্রিন্ট</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => handleLiveTrack(activeShipment)}
                    className="text-xs text-shubban-primary dark:text-shubban-gold font-bold hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>লাইভ চেকপয়েন্ট ট্র্যাকিং</span>
                  </button>

                  <button
                    onClick={() => handleCancelShipment(activeShipment.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>শিপমেন্ট বাতিল করুন</span>
                  </button>
                </div>

                {/* Manual Courier Edit Option (REQUIREMENT 9) */}
                {activeShipment.courierCode === 'MANUAL' && (
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() => setIsEditingManualShipment(!isEditingManualShipment)}
                      className="w-full py-2 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 transition flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>ম্যানুয়াল শিপমেন্টের তথ্য পরিবর্তন করুন</span>
                    </button>

                    {isEditingManualShipment && (
                      <form onSubmit={handleSaveManualShipment} className="mt-3 space-y-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-2xl text-xs">
                        <div>
                          <label className="block text-stone-500 mb-1">কুরিয়ার নাম:</label>
                          <input
                            type="text"
                            value={editManualName}
                            onChange={(e) => setEditManualName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 mb-1">ট্র্যাকিং কোড:</label>
                          <input
                            type="text"
                            value={editManualTracking}
                            onChange={(e) => setEditManualTracking(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 mb-1">শিপমেন্ট স্ট্যাটাস:</label>
                          <select
                            value={editManualStatus}
                            onChange={(e) => setEditManualStatus(e.target.value as ShipmentStatus)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                          >
                            <option value="BOOKED">BOOKED (বুকিং সম্পন্ন)</option>
                            <option value="PICKED_UP">PICKED_UP (পিকআপ হয়েছে)</option>
                            <option value="IN_TRANSIT">IN_TRANSIT (পথে রয়েছে)</option>
                            <option value="DELIVERED">DELIVERED (ডেলিভারি সম্পন্ন)</option>
                            <option value="RETURNED">RETURNED (রিটার্ন)</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingManualShipment(false)}
                            className="px-3 py-1 rounded-lg border text-stone-500"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1 bg-emerald-600 text-white rounded-lg font-bold"
                          >
                            সংরক্ষণ
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* SCENARIO B: NO SHIPMENT BOOKED YET (STEP 3 & 4 MANUAL WORKFLOW) */
              <div className="space-y-4">
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold block">⚠️ কোনো স্বয়ংক্রিয় বুকিং হয়নি</span>
                  <span className="text-[11px] block mt-0.5">
                    অর্ডার যাচাই করে নিচের ফর্ম থেকে পছন্দের কুরিয়ার সিলেক্ট করে ম্যানুয়ালি বুক করুন।
                  </span>
                </div>

                {/* Select Courier Provider (REQUIREMENT 3) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    ১. কুরিয়ার নির্বাচন করুন:
                  </label>
                  <div className="space-y-2">
                    {/* Steadfast */}
                    <label
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        selectedCourier === 'STEADFAST'
                          ? 'border-shubban-primary bg-shubban-primary/5 dark:bg-shubban-gold/10 ring-2 ring-shubban-primary/20'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="courierOption"
                          value="STEADFAST"
                          checked={selectedCourier === 'STEADFAST'}
                          onChange={() => setSelectedCourier('STEADFAST')}
                        />
                        <div>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                            Steadfast Courier
                          </span>
                          <span className="text-[10px] text-stone-400">এপিআই স্বয়ংক্রিয় বুকিং ও ট্র্যাকিং</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        সক্রিয়
                      </span>
                    </label>

                    {/* Pathao */}
                    <label
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        selectedCourier === 'PATHAO'
                          ? 'border-shubban-primary bg-shubban-primary/5 dark:bg-shubban-gold/10 ring-2 ring-shubban-primary/20'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="courierOption"
                          value="PATHAO"
                          checked={selectedCourier === 'PATHAO'}
                          onChange={() => setSelectedCourier('PATHAO')}
                        />
                        <div>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                            Pathao Courier
                          </span>
                          <span className="text-[10px] text-stone-400">পাঠাও এক্সপ্রেস ডেলিভারি</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        কনফিগ বাকি
                      </span>
                    </label>

                    {/* REDX */}
                    <label
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        selectedCourier === 'REDX'
                          ? 'border-shubban-primary bg-shubban-primary/5 dark:bg-shubban-gold/10 ring-2 ring-shubban-primary/20'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="courierOption"
                          value="REDX"
                          checked={selectedCourier === 'REDX'}
                          onChange={() => setSelectedCourier('REDX')}
                        />
                        <div>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                            REDX Logistics
                          </span>
                          <span className="text-[10px] text-stone-400">রেডএক্স পার্সেল সার্ভিস</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        কনফিগ বাকি
                      </span>
                    </label>

                    {/* Manual / Other Courier (REQUIREMENT 9) */}
                    <label
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        selectedCourier === 'MANUAL'
                          ? 'border-shubban-primary bg-shubban-primary/5 dark:bg-shubban-gold/10 ring-2 ring-shubban-primary/20'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="courierOption"
                          value="MANUAL"
                          checked={selectedCourier === 'MANUAL'}
                          onChange={() => setSelectedCourier('MANUAL')}
                        />
                        <div>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                            Manual / Other Courier
                          </span>
                          <span className="text-[10px] text-stone-400">সুন্দরবন, এসএ পরিবহন বা নিজস্ব রাইডার</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        সরাসরি
                      </span>
                    </label>
                  </div>
                </div>

                {/* If Manual Courier Selected: Inputs */}
                {selectedCourier === 'MANUAL' && (
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-900 rounded-2xl space-y-2.5 text-xs border border-stone-200 dark:border-stone-800">
                    <div>
                      <label className="block text-stone-500 mb-1">কুরিয়ারের নাম *</label>
                      <input
                        type="text"
                        value={manualCourierName}
                        onChange={(e) => setManualCourierName(e.target.value)}
                        placeholder="যেমন: সুন্দরবন কুরিয়ার সার্ভিস / এসএ পরিবহন"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-stone-500 mb-1">ট্র্যাকিং নম্বর / চালান নং</label>
                      <input
                        type="text"
                        value={manualTrackingNo}
                        onChange={(e) => setManualTrackingNo(e.target.value)}
                        placeholder="যেমন: SB-123456"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-500 mb-1">ডেলিভারি চার্জ (৳)</label>
                      <input
                        type="number"
                        value={manualCourierFee}
                        onChange={(e) => setManualCourierFee(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Parcel Weight & COD Inputs */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      পার্সেল ওজন (কেজি):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={parcelWeight}
                      onChange={(e) => setParcelWeight(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      COD কালেকশন (৳):
                    </label>
                    <input
                      type="number"
                      value={bookingCodAmount}
                      onChange={(e) => setBookingCodAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {/* Primary Booking Trigger Button (Opens Confirmation Modal) */}
                <button
                  type="button"
                  onClick={() => setShowBookingConfirmModal(true)}
                  className="w-full py-3.5 bg-shubban-primary hover:bg-shubban-primary/90 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span>কুরিয়ার শিপমেন্ট বুক করুন (Create Shipment)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION DIALOG MODAL (REQUIREMENT 5) */}
      {showBookingConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base">
                  কুরিয়ার বুকিং নিশ্চিতকরণ (Booking Confirmation)
                </h3>
              </div>
              <button
                onClick={() => setShowBookingConfirmModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              অনুগ্রহ করে নিচের তথ্যগুলো যাচাই করুন। &apos;নিশ্চিত বুক করুন&apos; বাটনে ক্লিক করার পর কুরিয়ার এপিআইতে অনুরোধ প্রেরণ করা হবে।
            </p>

            {bookingError && (
              <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Summary List */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-2xl space-y-2 text-xs text-stone-700 dark:text-stone-300">
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                <span className="text-stone-500">অর্ডার নম্বর:</span>
                <span className="font-mono font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                <span className="text-stone-500">নির্বাচিত কুরিয়ার:</span>
                <span className="font-bold text-shubban-primary dark:text-shubban-gold">
                  {selectedCourier === 'MANUAL' ? manualCourierName : `${selectedCourier} Courier`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                <span className="text-stone-500">প্রাপক ও মোবাইল:</span>
                <span className="font-bold">{order.shippingName} ({order.shippingPhone})</span>
              </div>
              <div className="py-1 border-b border-stone-200 dark:border-stone-800">
                <span className="text-stone-500 block mb-0.5">ডেলিভারি ঠিকানা:</span>
                <span className="font-medium text-[11px]">{order.shippingAddress}, {order.shippingCity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                <span className="text-stone-500">পার্সেল ওজন:</span>
                <span className="font-mono font-bold">{parcelWeight} কেজি</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                <span className="text-stone-500">সিওডি কালেকশন:</span>
                <span className="font-mono font-bold text-emerald-600">{formatTaka(parseFloat(bookingCodAmount) || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">আনুমানিক ডেলিভারি চার্জ:</span>
                <span className="font-mono font-bold">
                  {formatTaka(selectedCourier === 'MANUAL' ? parseFloat(manualCourierFee) : 60)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBookingConfirmModal(false)}
                disabled={isSubmittingBooking}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleConfirmAndExecuteBooking}
                disabled={isSubmittingBooking}
                className="px-5 py-2.5 bg-shubban-primary hover:bg-shubban-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                {isSubmittingBooking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>কুরিয়ার এপিআইতে বুকিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>নিশ্চিত বুক করুন (Confirm Booking)</span>
                  </>
                )}
              </button>
            </div>
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

      {/* PRINTABLE INVOICE MODAL */}
      {printableInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 text-stone-900 shadow-2xl border border-stone-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <span className="font-bold text-sm">গ্রাহক চালান ও ইনভয়েস</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-stone-900 text-white text-xs rounded font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
                <button onClick={() => setPrintableInvoice(null)} className="text-stone-400 hover:text-stone-700">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-4 border rounded-xl space-y-4 text-xs font-sans">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold font-serif">{printableInvoice.storeName}</h2>
                  <p className="text-[11px] text-stone-500">{printableInvoice.storeDomain}</p>
                  <p className="text-[11px] text-stone-500">{printableInvoice.storeAddress}</p>
                  <p className="text-[11px] text-stone-500">ফোন: {printableInvoice.storePhone}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm block font-mono">চালান #{printableInvoice.orderNumber}</span>
                  <span className="text-[11px] text-stone-500 block">তারিখ: {printableInvoice.date}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-stone-400 uppercase block font-bold">বিল ও ডেলিভারি প্রাপক:</span>
                <span className="font-bold text-sm block">{printableInvoice.customerName}</span>
                <span className="block font-mono">{printableInvoice.customerPhone}</span>
                <span className="block text-stone-600">{printableInvoice.shippingAddress}</span>
              </div>

              <table className="w-full text-left border-t border-b py-2">
                <thead className="bg-stone-50 text-[10px] uppercase">
                  <tr>
                    <th className="py-1">পণ্য</th>
                    <th className="py-1 text-center">পরিমাণ</th>
                    <th className="py-1 text-right">একক মূল্য</th>
                    <th className="py-1 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {printableInvoice.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="py-1.5">{it.title}</td>
                      <td className="py-1.5 text-center font-mono">{it.quantity}</td>
                      <td className="py-1.5 text-right font-mono">{formatTaka(it.unitPrice)}</td>
                      <td className="py-1.5 text-right font-mono font-bold">{formatTaka(it.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-right text-xs pt-1">
                <div className="flex justify-between">
                  <span>উপমোট:</span>
                  <span className="font-mono">{formatTaka(printableInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি ফি:</span>
                  <span className="font-mono">{formatTaka(printableInvoice.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="font-mono text-emerald-600">{formatTaka(printableInvoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE TRACKING MODAL */}
      {trackingModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-shubban-darkCard max-w-md w-full rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="font-bold text-sm">লাইভ কুরিয়ার ট্র্যাকিং</span>
              <button onClick={() => setTrackingModalData(null)} className="text-stone-400 hover:text-stone-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {trackingModalData.loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-stone-500">
                <RefreshCw className="w-6 h-6 animate-spin text-shubban-gold mb-2" />
                <span>কুরিয়ার সার্ভার থেকে ট্র্যাকিং ডাটা নেওয়া হচ্ছে...</span>
              </div>
            ) : trackingModalData.error ? (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs">
                {trackingModalData.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">কুরিয়ার:</span>
                    <span className="font-bold">{trackingModalData.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">কোড:</span>
                    <span className="font-mono font-bold">{trackingModalData.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">বর্তমান স্ট্যাটাস:</span>
                    <span className="font-bold text-emerald-600">{trackingModalData.currentStatus}</span>
                  </div>
                </div>

                <div className="relative pl-5 border-l-2 border-stone-200 dark:border-stone-800 space-y-3 ml-2 text-xs">
                  {trackingModalData.checkpoints?.map((cp: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900" />
                      <div className="font-bold text-stone-800 dark:text-stone-200">{cp.status || cp.note}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{new Date(cp.time).toLocaleString('bn-BD')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

