'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  BookOpen,
  Truck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useCart, DeliveryZone } from '@/components/providers/CartContext';
import { formatTaka, toBengaliNumber } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    deliveryZone,
    setDeliveryZone,
    subtotal,
    shippingFee,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    isShippingFree,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) return;

    setIsApplying(true);
    const res = await applyCoupon(couponInput);
    setIsApplying(false);

    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const hasPhysical = items.some((i) => i.type === 'PHYSICAL');
  const freeShippingThreshold = 1500;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-bengali space-y-4">
        <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 mx-auto flex items-center justify-center text-stone-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-200">
          আপনার শপিং কার্ট খালি রয়েছে
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
          পছন্দের বই, ইসলামিক লাইফস্টাইল বা সাময়িকী কার্টে যোগ করে অর্ডার সম্পন্ন করুন।
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/books"
            className="px-6 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-shubban-gold" />
            <span>বইয়ের ক্যাটালগ দেখুন</span>
          </Link>
          <Link
            href="/products"
            className="px-6 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-all"
          >
            সকল পণ্য
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-shubban-gold" />
            <span>শপিং কার্ট ({toBengaliNumber(items.length)}টি আইটেম)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            কার্টের আইটেম ও ডেলিভারি বিবরণ পর্যালোচনা করে চেকআউট সম্পন্ন করুন।
          </p>
        </div>
        <Link
          href="/books"
          className="text-xs font-semibold text-shubban-gold hover:underline flex items-center gap-1 self-start sm:self-center"
        >
          <span>আরও বই যোগ করুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Shipping Alert if physical products */}
          {hasPhysical && (
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-shubban-gold shrink-0" />
                {amountNeededForFreeShipping > 0 ? (
                  <span>
                    আর মাত্র <strong>{formatTaka(amountNeededForFreeShipping)}</strong> টাকার বই কিনলে ঢাকা মেট্রোতে{' '}
                    <strong className="text-shubban-green dark:text-shubban-gold">ফ্রি ডেলিভারি!</strong>
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    🎉 অভিনন্দন! আপনি ঢাকা মেট্রোতে ফ্রি ডেলিভারির জন্য যোগ্য হয়েছেন।
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cart Table Container */}
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
            {items.map((item) => (
              <div
                key={`${item.id}-${item.type}-${item.variantId || 'novar'}`}
                className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start sm:items-center hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
              >
                {/* Product Info */}
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0">
                    <img
                      src={item.coverImage || '/placeholder.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                      <Link href={`/books/${item.slug}`} className="hover:text-shubban-gold">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">{item.authorName}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {item.type === 'PHYSICAL' ? 'মুদ্রিত সংস্করণ' : 'ডিজিটাল ই-বুক'}
                      </span>
                      {item.variantTitle && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50">
                          ভ্যারিয়েন্ট: {item.variantTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Quantity & Actions */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:justify-end">
                  {/* Quantity Controller */}
                  {item.type === 'PHYSICAL' ? (
                    <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.type, item.quantity - 1, item.variantId)}
                        className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                        title="কমান"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono text-stone-900 dark:text-stone-100">
                        {toBengaliNumber(item.quantity)}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.type, item.quantity + 1, item.variantId)}
                        className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                        title="বাড়ান"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400 font-sans italic">১টি লাইসেন্স</span>
                  )}

                  {/* Total Item Price */}
                  <div className="text-right font-mono min-w-[80px]">
                    <span className="font-bold text-sm text-shubban-green dark:text-shubban-gold block">
                      {formatTaka(item.price * item.quantity)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-stone-400">
                        {formatTaka(item.price)} প্রতি কপি
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id, item.type, item.variantId)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="কার্ট থেকে মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Zone Selector */}
          {hasPhysical && (
            <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-shubban-gold" />
                <span>ডেলিভারি এলাকা ও শিপিং রেট নির্বাচন</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label
                  onClick={() => setDeliveryZone('DHAKA_METRO')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryZone === 'DHAKA_METRO'
                      ? 'border-shubban-gold bg-shubban-gold/10 font-bold'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span>ঢাকা মেট্রো</span>
                    <span className="text-shubban-green dark:text-shubban-gold font-mono">
                      {isShippingFree ? 'ফ্রি' : '৳৬০'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-normal">১-২ কর্মদিবসে হোম ডেলিভারি</span>
                </label>

                <label
                  onClick={() => setDeliveryZone('OUTSIDE_DHAKA')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryZone === 'OUTSIDE_DHAKA'
                      ? 'border-shubban-gold bg-shubban-gold/10 font-bold'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span>ঢাকার বাইরে (সমগ্র বাংলাদেশ)</span>
                    <span className="text-shubban-green dark:text-shubban-gold font-mono">৳১১০</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-normal">কুরিয়ারে ৩-৪ কর্মদিবসে</span>
                </label>

                <label
                  onClick={() => setDeliveryZone('EXPRESS')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryZone === 'EXPRESS'
                      ? 'border-shubban-gold bg-shubban-gold/10 font-bold'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span>এক্সপ্রেস ডেলিভারি (ঢাকা)</span>
                    <span className="text-shubban-green dark:text-shubban-gold font-mono">৳১৩০</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-normal">জরুরি ২৪ ঘণ্টার মধ্যে</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary & Coupon Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-5">
            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-100 dark:border-stone-800">
              অর্ডার সারাংশ
            </h2>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>পণ্যের উপ-মোট (Subtotal)</span>
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {formatTaka(subtotal)}
                </span>
              </div>

              {hasPhysical && (
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">ফ্রি</span>
                    ) : (
                      formatTaka(shippingFee)
                    )}
                  </span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>কুপন ছাড় ({appliedCoupon})</span>
                  <span className="font-mono font-bold">-{formatTaka(discount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between text-sm font-bold text-stone-900 dark:text-stone-100">
                <span>সর্বমোট প্রদেয় (Grand Total)</span>
                <span className="text-lg font-mono text-shubban-green dark:text-shubban-gold">
                  {formatTaka(total)}
                </span>
              </div>
            </div>

            {/* Coupon Application Box */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                ডিসকাউন্ট বা প্রোমো কুপন কোড
              </span>

              {appliedCoupon ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>কুপন <strong>{appliedCoupon}</strong> সক্রিয়</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-stone-400 hover:text-rose-600"
                    title="কুপন মুছুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="যেমন: SHUBBAN10"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                  <button
                    type="submit"
                    disabled={isApplying || !couponInput.trim()}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isApplying ? '...' : 'প্রয়োগ'}
                  </button>
                </form>
              )}

              {couponSuccess && (
                <p className="text-[11px] text-emerald-600 font-medium">{couponSuccess}</p>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>অর্ডার সম্পন্ন করতে এগিয়ে যান</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Trust Badges */}
            <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-shubban-gold" />
                <span>শতভাগ নিরাপদ পেমেন্ট</span>
              </span>
              <span>•</span>
              <span>সহজ রিটার্ন পলিসি</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
