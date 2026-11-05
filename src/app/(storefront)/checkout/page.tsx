'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  MapPin,
  Plus,
  Gift,
  Tag,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useCart, DeliveryZone } from '@/components/providers/CartContext';
import { useAuth } from '@/components/providers/AuthContext';
import { formatTaka, toBengaliNumber } from '@/lib/utils';

interface SavedAddress {
  id: string;
  title: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  zone: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    shippingFee,
    discount,
    total,
    clearCart,
    isShippingFree,
    deliveryZone,
    setDeliveryZone,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { user } = useAuth();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  const [formData, setFormData] = useState({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: 'ঢাকা',
  });

  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'sslcommerz' | 'cod' | 'bank'>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasPhysical = items.some((i) => i.type === 'PHYSICAL');
  const giftWrapFee = isGiftWrapped ? 30 : 0;
  const finalTotal = total + giftWrapFee;

  // Fetch saved addresses if logged in
  useEffect(() => {
    if (user) {
      fetch('/api/account/addresses')
        .then((res) => res.json())
        .then((data) => {
          if (data.addresses && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setFormData({
              shippingName: defaultAddr.name,
              shippingPhone: defaultAddr.phone,
              shippingAddress: defaultAddr.address,
              shippingCity: defaultAddr.city,
            });
            if (defaultAddr.zone === 'OUTSIDE_DHAKA') {
              setDeliveryZone('OUTSIDE_DHAKA');
            } else {
              setDeliveryZone('DHAKA_METRO');
            }
          } else {
            setFormData((prev) => ({
              ...prev,
              shippingName: user.name || '',
              shippingPhone: user.phone || '',
            }));
          }
        })
        .catch((err) => console.error('Failed to load addresses:', err));
    }
  }, [user, setDeliveryZone]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setFormData({
      shippingName: addr.name,
      shippingPhone: addr.phone,
      shippingAddress: addr.address,
      shippingCity: addr.city,
    });
    if (addr.zone === 'OUTSIDE_DHAKA') {
      setDeliveryZone('OUTSIDE_DHAKA');
    } else {
      setDeliveryZone('DHAKA_METRO');
    }
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setFormData({
      shippingName: user?.name || '',
      shippingPhone: user?.phone || '',
      shippingAddress: '',
      shippingCity: 'ঢাকা',
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleZoneChange = (zone: DeliveryZone) => {
    setDeliveryZone(zone);
    if (zone === 'OUTSIDE_DHAKA' && formData.shippingCity === 'ঢাকা') {
      setFormData((prev) => ({ ...prev, shippingCity: 'চট্টগ্রাম' }));
    } else if (zone === 'DHAKA_METRO' && formData.shippingCity !== 'ঢাকা') {
      setFormData((prev) => ({ ...prev, shippingCity: 'ঢাকা' }));
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponMsg({ text: res.message, isError: false });
      setCouponInput('');
    } else {
      setCouponMsg({ text: res.message, isError: true });
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('আপনার কার্টে কোনো বই নেই।');
      return;
    }

    if (hasPhysical && (!formData.shippingName.trim() || !formData.shippingPhone.trim() || !formData.shippingAddress.trim())) {
      setErrorMsg('অনুগ্রহ করে পূর্ণ ডেলিভারি ঠিকানা ও সচল মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    if (['bkash', 'nagad', 'bank'].includes(paymentMethod) && !transactionId.trim()) {
      setErrorMsg('অনুগ্রহ করে সফল পেমেন্টের Transaction ID (ট্রানজেকশন আইডি) দিন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map((i) => ({
          id: i.id,
          variantId: i.variantId || null,
          type: i.type,
          quantity: i.quantity,
        })),
        shippingName: formData.shippingName.trim(),
        shippingPhone: formData.shippingPhone.trim(),
        shippingAddress: formData.shippingAddress.trim(),
        shippingCity: formData.shippingCity.trim(),
        shippingZone: deliveryZone,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        couponCode: appliedCoupon || undefined,
        isGiftWrapped,
        giftMessage: isGiftWrapped ? giftMessage.trim() : undefined,
        saveAddress: selectedAddressId === 'new' && saveAddressForFuture,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'অর্ডার প্রক্রিয়াকরণে ত্রুটি হয়েছে।');
      }

      clearCart();
      router.push(`/order-confirmation?orderNumber=${data.orderNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'অর্ডার সম্পন্ন হতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-bengali">
        <h2 className="font-serif text-2xl font-bold mb-4 text-stone-900 dark:text-stone-100">
          আপনার কার্টে কোনো বই নেই
        </h2>
        <p className="text-xs text-stone-500 mb-6">
          অর্ডার করতে প্রথমে আপনার পছন্দের বইগুলো কার্টে যোগ করুন।
        </p>
        <Link
          href="/books"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-md transition-all"
        >
          <span>বইয়ের ক্যাটালগ দেখুন</span>
          <ArrowRight className="w-4 h-4 text-shubban-gold" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            নিরাপদ চেকআউট ও পেমেন্ট
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            আপনার অর্ডারটি নিশ্চিত করতে ডেলিভারি ঠিকানা ও পেমেন্ট পদ্ধতি প্রদান করুন।
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>২৫৬-বিট SSL নিরাপদ পেমেন্ট গেটওয়ে</span>
        </div>
      </div>

      <form onSubmit={handleOrderSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Delivery Address & Payment Method */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Delivery Details (Physical books) */}
            {hasPhysical ? (
              <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-5">
                <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-shubban-gold" />
                    <span>১. বই ডেলিভারির ঠিকানা</span>
                  </div>
                  {savedAddresses.length > 0 && (
                    <span className="text-xs font-normal text-stone-500">
                      সংরক্ষিত ঠিকানা থেকে বেছে নিন
                    </span>
                  )}
                </h2>

                {/* Saved Address Cards */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-shubban-green bg-shubban-green/5 shadow-sm'
                                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-shubban-gold" />
                                {addr.title}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-shubban-gold/15 text-shubban-gold px-2 py-0.5 rounded-full font-bold">
                                  ডিফল্ট
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-stone-600 dark:text-stone-400 space-y-0.5 mt-2">
                              <p className="font-semibold text-stone-800 dark:text-stone-200">{addr.name}</p>
                              <p className="text-[11px]">{addr.phone}</p>
                              <p className="text-[11px] line-clamp-2">{addr.address}, {addr.city}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectNewAddress}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        selectedAddressId === 'new'
                          ? 'border-shubban-green bg-shubban-green text-shubban-ivory'
                          : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-shubban-gold'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>অন্য ঠিকানায় পাঠান (নতুন ঠিকানা)</span>
                    </button>
                  </div>
                )}

                {/* Form Fields for Address */}
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        গ্রাহকের পূর্ণ নাম *
                      </label>
                      <input
                        type="text"
                        name="shippingName"
                        required
                        value={formData.shippingName}
                        onChange={handleInputChange}
                        placeholder="যেমন: মুহাম্মদ আব্দুল্লাহ"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        সচল মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        name="shippingPhone"
                        required
                        value={formData.shippingPhone}
                        onChange={handleInputChange}
                        placeholder="০১৭১১-০০০০০০"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        পূর্ণ ঠিকানা (বাসা/ফ্ল্যাট নং, রোড, এলাকা) *
                      </label>
                      <textarea
                        name="shippingAddress"
                        required
                        rows={2}
                        value={formData.shippingAddress}
                        onChange={handleInputChange}
                        placeholder="যেমন: বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        শহর / জেলা
                      </label>
                      <input
                        type="text"
                        name="shippingCity"
                        value={formData.shippingCity}
                        onChange={handleInputChange}
                        placeholder="যেমন: ঢাকা / চট্টগ্রাম / সিলেট"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                      />
                    </div>

                    {/* Delivery Zone Selector */}
                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        ডেলিভারি অঞ্চল (Courier Zone) *
                      </label>
                      <select
                        value={deliveryZone}
                        onChange={(e) => handleZoneChange(e.target.value as DeliveryZone)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-medium"
                      >
                        <option value="DHAKA_METRO">ঢাকা মেট্রো (হোম ডেলিভারি — ৳ ৬০)</option>
                        <option value="OUTSIDE_DHAKA">ঢাকার বাইরে সমগ্র বাংলাদেশ (কুরিয়ার — ৳ ১১০)</option>
                        <option value="EXPRESS">ঢাকা এক্সপ্রেস (জরুরি ২৪ ঘণ্টায় — ৳ ১৩০)</option>
                      </select>
                    </div>
                  </div>

                  {user && selectedAddressId === 'new' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="saveAddressFuture"
                        checked={saveAddressForFuture}
                        onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                        className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold"
                      />
                      <label
                        htmlFor="saveAddressFuture"
                        className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
                      >
                        ভবিষ্যতের কেনাকাটার সুবিধার জন্য এই ঠিকানাটি সেভ করে রাখুন
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    ডিজিটাল ই-বুক ডেলিভারি
                  </h4>
                  <p className="mt-0.5 leading-relaxed">
                    আপনার কার্টের সমস্ত আইটেম ডিজিটাল ই-বুক। কোনো কুরিয়ার ডেলিভারি ফি নেই এবং পেমেন্ট সম্পন্ন হওয়ামাত্রই আপনার অ্যাকাউন্টের লাইব্রেরিতে উন্মুক্ত হবে।
                  </p>
                </div>
              </div>
            )}

            {/* Gift Wrapping (Rokomari Style) */}
            {hasPhysical && (
              <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="giftWrap"
                      checked={isGiftWrapped}
                      onChange={(e) => setIsGiftWrapped(e.target.checked)}
                      className="w-4 h-4 rounded text-shubban-gold focus:ring-shubban-gold"
                    />
                    <label
                      htmlFor="giftWrap"
                      className="text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <Gift className="w-4 h-4 text-rose-500" />
                      <span>উপহার হিসেবে পাঠাতে চান? (সুন্দর গিফট র‍্যাপিং ও কাস্টম কার্ড — ৳ ৩০)</span>
                    </label>
                  </div>
                  <span className="text-xs font-bold text-shubban-gold">+ ৳ ৩০</span>
                </div>

                {isGiftWrapped && (
                  <div className="pt-2 pl-6">
                    <textarea
                      rows={2}
                      placeholder="প্রিয়জনের জন্য সুন্দর একটি শুভেচ্ছা বার্তা লিখুন (বইয়ের সাথে প্রিন্ট করে দেওয়া হবে)..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold leading-relaxed"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. Payment Method Selector */}
            <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                <CreditCard className="w-5 h-5 text-shubban-gold" />
                <span>২. পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cash on Delivery */}
                {hasPhysical && (
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600/30'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                          ক্যাশ অন ডেলিভারি (COD)
                        </span>
                        <span className="text-[10px] text-stone-500">বই হাতে পেয়ে মূল্য পরিশোধ</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                      COD
                    </span>
                  </label>
                )}

                {/* bKash */}
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'bkash'
                      ? 'border-pink-500 bg-pink-500/5 ring-1 ring-pink-500/30'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bkash"
                      checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                        বিকাশ পেমেন্ট (bKash)
                      </span>
                      <span className="text-[10px] text-stone-500">বিকাশ মার্চেন্ট ওয়ালেট</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-pink-600 bg-pink-100 dark:bg-pink-950/60 px-2 py-0.5 rounded">
                    bKash
                  </span>
                </label>

                {/* Nagad */}
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'nagad'
                      ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="nagad"
                      checked={paymentMethod === 'nagad'}
                      onChange={() => setPaymentMethod('nagad')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                        নগদ পেমেন্ট (Nagad)
                      </span>
                      <span className="text-[10px] text-stone-500">নগদ ইনস্ট্যান্ট গেটওয়ে</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded">
                    Nagad
                  </span>
                </label>

                {/* SSLCommerz Cards */}
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'sslcommerz'
                      ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="sslcommerz"
                      checked={paymentMethod === 'sslcommerz'}
                      onChange={() => setPaymentMethod('sslcommerz')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                        কার্ড ও নেট ব্যাংকিং (SSLCommerz)
                      </span>
                      <span className="text-[10px] text-stone-500">ভিসা, মাস্টারকার্ড ও ডেবিট কার্ড</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                    Cards
                  </span>
                </label>
              </div>

              {/* Online MFS instructions & Transaction ID */}
              {['bkash', 'nagad', 'bank'].includes(paymentMethod) && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-xs text-stone-800 dark:text-stone-200 font-semibold">
                    <Info className="w-4 h-4 text-shubban-gold shrink-0" />
                    <span>
                      {paymentMethod === 'bkash'
                        ? 'বিকাশ মার্চেন্ট নম্বর: 01711-000001 (Make Payment অপশন)'
                        : 'নগদ মার্চেন্ট নম্বর: 01811-000002 (Merchant Pay)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    সার্ভার টেস্ট মোড: যেকোনো ডেমো Transaction ID (যেমন: <strong>TXN984210</strong>) লিখে অর্ডার কনফার্ম করতে পারেন।
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                      Transaction ID (ট্রানজেকশন আইডি) *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="TXN984210"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-5">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span>অর্ডারের সারাংশ</span>
                <span className="text-xs font-normal text-stone-500">
                  {toBengaliNumber(items.length)} টি আইটেম
                </span>
              </h3>

              {/* Items List with thumbnails */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-stone-100 dark:divide-stone-800">
                {items.map((i) => (
                  <div key={`${i.id}-${i.type}-${i.variantId || 'base'}`} className="pt-2.5 first:pt-0 flex gap-3 text-xs">
                    <div className="relative w-10 h-14 bg-stone-100 dark:bg-stone-800 rounded overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                      <Image
                        src={i.coverImage || '/placeholder.jpg'}
                        alt={i.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                        {i.title}
                      </h5>
                      {i.variantTitle && (
                        <span className="text-[10px] text-shubban-gold block font-medium">
                          ভ্যারিয়েন্ট: {i.variantTitle}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-1 text-[11px] text-stone-500">
                        <span>
                          {toBengaliNumber(i.quantity)} × {formatTaka(i.price)}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {formatTaka(i.price * i.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                {appliedCoupon ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>কুপন কোড: {appliedCoupon}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-stone-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="কুপন কোড দিন"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 uppercase font-mono focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-3 py-2 rounded-xl bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs font-bold hover:bg-stone-900 transition-colors"
                      >
                        প্রয়োগ
                      </button>
                    </div>
                    {couponMsg && (
                      <p
                        className={`text-[11px] font-medium ${
                          couponMsg.isError ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {couponMsg.text}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Summary Calculations */}
              <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>উপমোট (Subtotal):</span>
                  <span>{formatTaka(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className={isShippingFree ? 'text-emerald-600 font-bold' : ''}>
                    {isShippingFree ? 'ফ্রি' : formatTaka(shippingFee)}
                  </span>
                </div>
                {isGiftWrapped && (
                  <div className="flex justify-between text-shubban-gold font-medium">
                    <span>গিফট র‍্যাপিং ফি:</span>
                    <span>+ ৳ ৩০</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>কুপন ছাড় (Discount):</span>
                    <span>- {formatTaka(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-shubban-green dark:text-shubban-gold pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span>{formatTaka(finalTotal)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover disabled:opacity-50 text-shubban-green-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>সার্ভার যাচাইকরণ ও প্রক্রিয়াকরণ হচ্ছে...</span>
                ) : (
                  <>
                    <span>অর্ডার নিশ্চিত করুন ({formatTaka(finalTotal)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-[11px] text-stone-400 text-center space-y-1">
                <p>🔒 আপনার সমস্ত তথ্য এনক্রিপ্ট করে নিরাপদে সংরক্ষিত হয়।</p>
                <p>সমস্যার ক্ষেত্রে হেল্পলাইন: ০৯৬৩৮-০০০০০ (সকাল ৯টা - রাত ১০টা)</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
