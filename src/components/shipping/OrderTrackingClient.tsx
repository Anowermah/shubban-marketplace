'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Phone,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';
import { ShipmentStatus } from '@/lib/courier/types';

interface TrackingShipment {
  shipmentNumber: string;
  trackingNumber: string;
  consignmentId?: string;
  courierName: string;
  courierCode: string;
  status: ShipmentStatus;
  recipientName: string;
  recipientPhone: string;
  maskedDestination: string;
  orderNumber: string;
  bookedAt: string;
  deliveredAt?: string | null;
  weightKg: number;
  codAmount: number;
  checkpoints: {
    time: string;
    status: string;
    note?: string;
    location?: string;
  }[];
}

interface PreBookingOrder {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  recipientName: string;
  recipientPhone: string;
  maskedDestination: string;
  createdAt: string;
  message: string;
}

export default function OrderTrackingClient() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<TrackingShipment | null>(null);
  const [preBookingOrder, setPreBookingOrder] = useState<PreBookingOrder | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setShipment(null);
    setPreBookingOrder(null);

    try {
      const res = await fetch(`/api/shipping/track?trackingNumber=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'পার্সেলটি খুঁজে পাওয়া যায়নি।');
      }

      if (data.isPreBooking && data.order) {
        setPreBookingOrder(data.order);
      } else if (data.shipment) {
        setShipment(data.shipment);
      } else {
        throw new Error('কোনো পার্সেল বা ট্র্যাকিং তথ্য পাওয়া যায়নি।');
      }
    } catch (err: any) {
      setError(err.message || 'ট্র্যাকিং তথ্য লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const milestones: { key: ShipmentStatus; label: string; desc: string }[] = [
    { key: 'PENDING_PICKUP', label: 'বুকিং সম্পন্ন', desc: 'কুরিয়ার পার্সেল গ্রহণ করবে' },
    { key: 'IN_TRANSIT', label: 'কুরিয়ারে পথে রয়েছে', desc: 'পার্সেল সংশ্লিষ্ট হাবে ট্রানজিটে রয়েছে' },
    { key: 'OUT_FOR_DELIVERY', label: 'ডেলিভারি বের হয়েছে', desc: 'ডেলিভারি রাইডার গ্রাহকের উদ্দেশ্যে রওনা হয়েছে' },
    { key: 'DELIVERED', label: 'ডেলিভারি সম্পন্ন', desc: 'গ্রাহকের নিকট পার্সেল পৌঁছানো হয়েছে' },
  ];

  const getStepIndex = (status: ShipmentStatus) => {
    if (status === 'DELIVERED') return 4;
    if (status === 'OUT_FOR_DELIVERY') return 3;
    if (['IN_TRANSIT', 'PICKED_UP'].includes(status)) return 2;
    if (status === 'PENDING_PICKUP') return 1;
    return 0;
  };

  const currentStep = shipment ? getStepIndex(shipment.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-shubban-gold/15 text-shubban-primary dark:text-shubban-gold text-xs font-bold">
          <Truck className="w-3.5 h-3.5" />
          <span>লাইভ কুরিয়ার ও পার্সেল ট্র্যাকিং</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
          আপনার অর্ডার ও পার্সেল ট্র্যাক করুন
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto">
          অর্ডার নম্বর (যেমন: SHB-2026-XXXXX), কুরিয়ার ট্র্যাকিং কোড বা কনসাইনমেন্ট আইডি দিয়ে আপনার পার্সেলটির লাইভ অবস্থান দেখুন।
        </p>
      </div>

      {/* Search Input Box */}
      <div className="max-w-xl mx-auto bg-white dark:bg-shubban-darkCard p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ট্র্যাকিং কোড বা অর্ডার নম্বর দিন..."
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 font-mono focus:outline-none focus:ring-1 focus:ring-shubban-primary"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-shubban-primary hover:bg-shubban-primary/90 text-white font-bold text-xs shadow transition flex items-center gap-1.5 whitespace-nowrap"
          >
            {loading ? <span>অনুসন্ধান হচ্ছে...</span> : <span>ট্র্যাক করুন</span>}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Pre-Booking Order State (Order Placed, awaiting courier booking) */}
      {preBookingOrder && (
        <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-amber-200 dark:border-amber-800/60 shadow-md p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-stone-900 dark:text-stone-100">
                  #{preBookingOrder.orderNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  প্রক্রিয়াধীন
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                অর্ডার তারিখ: {new Date(preBookingOrder.createdAt).toLocaleDateString('bn-BD')} • পেমেন্ট: {preBookingOrder.paymentStatus}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-stone-400 block">বর্তমান স্ট্যাটাস:</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-serif">
                অর্ডার প্রস্তুতকরণ চলছে
              </span>
            </div>
          </div>

          {/* Reassuring Pre-booking Message */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                কুরিয়ার ট্র্যাকিং কোড প্রক্রিয়া চলছে
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                {preBookingOrder.message}
              </p>
            </div>
          </div>

          {/* Stepper Progress Bar for Pre-booking */}
          <div className="relative py-4">
            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="mt-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                  অর্ডার গৃহীত
                </span>
                <span className="text-[10px] text-stone-400 hidden sm:block max-w-[120px] mt-0.5">
                  অর্ডার সফলভাবে ডাটাবেজে যুক্ত হয়েছে
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-shubban-primary text-white ring-4 ring-shubban-primary/20 animate-pulse">
                  <Package className="w-4 h-4" />
                </div>
                <span className="mt-2 text-xs font-bold text-shubban-primary dark:text-shubban-gold">
                  প্যাকেজিং ও যাচাই
                </span>
                <span className="text-[10px] text-stone-400 hidden sm:block max-w-[120px] mt-0.5">
                  হাব থেকে বই সংগ্রহ ও প্যাকিং চলছে
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-stone-200 dark:bg-stone-800 text-stone-500">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="mt-2 text-xs font-bold text-stone-500">
                  কুরিয়ার বুকিং
                </span>
                <span className="text-[10px] text-stone-400 hidden sm:block max-w-[120px] mt-0.5">
                  অ্যাডমিন বুকিং অনুমোদন করবেন
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-stone-200 dark:bg-stone-800 text-stone-500">
                  {toBengaliNumber(4)}
                </div>
                <span className="mt-2 text-xs font-bold text-stone-500">
                  ডেলিভারি সম্পন্ন
                </span>
                <span className="text-[10px] text-stone-400 hidden sm:block max-w-[120px] mt-0.5">
                  গ্রাহকের ঠিকানায় পৌঁছানো
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Safe Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800 text-xs">
            <div>
              <span className="text-stone-400 block mb-0.5">প্রাপকের নাম:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {preBookingOrder.recipientName}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">মোবাইল নম্বর:</span>
              <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                {preBookingOrder.recipientPhone}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">গন্তব্য জেলা/শহর:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-shubban-gold" />
                {preBookingOrder.maskedDestination}
              </span>
            </div>
          </div>

          {/* Help Banner */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-shubban-gold flex-shrink-0" />
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200">জরুরি তথ্যের জন্য যোগাযোগ:</span>
                <p className="text-stone-500 text-[11px]">আমাদের হটলাইনে কল করে আপনার অর্ডার নম্বরটি উল্লেখ করুন।</p>
              </div>
            </div>
            <a
              href="tel:+8801711000000"
              className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>হেল্পলাইন: +৮৮০ ১৭১১-০০০০০০</span>
            </a>
          </div>
        </div>
      )}

      {/* Tracking Result Card (Once Courier Booking is Active) */}
      {shipment && (
        <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md p-6 sm:p-8 space-y-8 animate-fadeIn">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-stone-900 dark:text-stone-100">
                  {shipment.trackingNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-gold/15 text-shubban-primary dark:text-shubban-gold">
                  {shipment.courierName}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                অর্ডার নং: <span className="font-mono font-semibold">{shipment.orderNumber}</span> • বুকিং তারিখ: {new Date(shipment.bookedAt).toLocaleDateString('bn-BD')}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-stone-400 block">বর্তমান অবস্থা:</span>
              <span className="text-sm font-bold text-emerald-600 font-serif">
                {shipment.status === 'DELIVERED'
                  ? 'ডেলিভারি সম্পন্ন হয়েছে'
                  : shipment.status === 'OUT_FOR_DELIVERY'
                  ? 'ডেলিভারির জন্য বের হয়েছে'
                  : shipment.status === 'RETURNED'
                  ? 'পার্সেল রিটার্ন হয়েছে'
                  : 'কুরিয়ারে ট্রানজিটে রয়েছে'}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="relative py-4">
            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
              {milestones.map((m, idx) => {
                const isPassed = currentStep > idx;
                const isCurrent = currentStep === idx + 1;
                return (
                  <div key={m.key} className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-md'
                          : isCurrent
                          ? 'bg-shubban-primary text-white ring-4 ring-shubban-primary/20'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : toBengaliNumber(idx + 1)}
                    </div>
                    <span className="mt-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                      {m.label}
                    </span>
                    <span className="text-[10px] text-stone-400 hidden sm:block max-w-[120px] mt-0.5">
                      {m.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy-Safe Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800 text-xs">
            <div>
              <span className="text-stone-400 block mb-0.5">প্রাপকের নাম:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {shipment.recipientName}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">যোগাযোগের মোবাইল:</span>
              <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                {shipment.recipientPhone}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">ডেলিভারি গন্তব্য:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-shubban-gold" />
                {shipment.maskedDestination}
              </span>
            </div>
          </div>

          {/* Checkpoints Timeline */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-shubban-gold" />
              <span>পার্সেল মুভমেন্ট হিস্ট্রি (Checkpoints Timeline)</span>
            </h3>

            <div className="relative pl-6 border-l-2 border-stone-200 dark:border-stone-800 space-y-5 ml-2">
              {shipment.checkpoints && shipment.checkpoints.length > 0 ? (
                shipment.checkpoints.map((cp, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-stone-900" />
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {cp.status || cp.note}
                    </div>
                    {cp.location && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{cp.location}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {new Date(cp.time).toLocaleString('bn-BD')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400">কুরিয়ার থেকে প্রাথমিক আপডেট প্রক্রিয়াকরণ চলছে...</p>
              )}
            </div>
          </div>

          {/* Help Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-shubban-gold flex-shrink-0" />
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200">ডেলিভারি নিয়ে কোনো প্রশ্ন আছে?</span>
                <p className="text-stone-500 text-[11px]">আমাদের গ্রাহক সেবা প্রতিনিধি আপনাকে সহায়তা করতে প্রস্তুত।</p>
              </div>
            </div>
            <a
              href="tel:+8801711000000"
              className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>হেল্পলাইন: +৮৮০ ১৭১১-০০০০০০</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
