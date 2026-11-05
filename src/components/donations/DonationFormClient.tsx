'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Lock, ShieldCheck, CheckCircle2, User, Phone, Mail } from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthContext';

interface DonationFormClientProps {
  campaignId: string;
  campaignTitle: string;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function DonationFormClient({ campaignId, campaignTitle }: DonationFormClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>(user?.name || '');
  const [donorEmail, setDonorEmail] = useState<string>(user?.email || '');
  const [donorPhone, setDonorPhone] = useState<string>(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card' | 'bank'>('bkash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmount || selectedAmount < 10) {
      setErrorMsg('অনুগ্রহ করে ন্যূনতম ১০ টাকা বা তদূর্ধ্ব অনুদান প্রদান করুন।');
      return;
    }

    if (!isAnonymous && !donorName.trim()) {
      setErrorMsg('অনুগ্রহ করে দাতার নাম লিখুন অথবা গোপন দান নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          donorName: isAnonymous ? 'গোপন দানকারী' : donorName.trim(),
          donorEmail: donorEmail.trim() || null,
          donorPhone: donorPhone.trim() || null,
          isAnonymous,
          amount: selectedAmount,
          paymentMethod,
          transactionId: transactionId || `TXN-DON-${Date.now().toString().slice(-8)}`,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'অনুদান গ্রহণ ব্যর্থ হয়েছে।');
      }

      router.push(`/donations/receipt/${data.receiptNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'অনুদান সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="pb-4 border-b border-stone-100 dark:border-stone-800">
        <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-current" />
          <span>অনুদানের পরিমাণ ও তথ্য দিন</span>
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          আপনার প্রদত্ত সম্পূর্ণ অর্থ সরাসরি এই নির্দিষ্ট প্রকল্পে ব্যয় করা হবে।
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
            ১. অনুদানের পরিমাণ নির্বাচন করুন (টাকা):
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setAmount(amt);
                  setCustomAmount('');
                }}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                  !customAmount && amount === amt
                    ? 'border-shubban-green bg-shubban-green text-shubban-gold shadow-md'
                    : 'border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-shubban-gold'
                }`}
              >
                {formatTaka(amt)}
              </button>
            ))}
          </div>

          <div className="mt-2">
            <input
              type="number"
              min="10"
              placeholder="অথবা অন্য যেকোনো কাস্টম টাকার পরিমাণ লিখুন (যেমন: ২০০০)..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>
        </div>

        {/* Anonymous Toggle */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
              গোপন দান (Anonymous Sadaqah)
            </span>
            <span className="text-[11px] text-stone-500">
              পাবলিক ডোনেশন লিস্টে আপনার নাম প্রকাশ করা হবে না
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-shubban-green"></div>
          </label>
        </div>

        {/* Donor Info (if not anonymous) */}
        {!isAnonymous && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              ২. দাতার যোগাযোগের তথ্য (রসিদ প্রেরণের জন্য):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="আপনার পূর্ণ নাম *"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-900"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-900"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="email"
                  placeholder="ইমেইল অ্যাড্রেস (রসিদ পেতে)"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
            ৩. অনুদানের পেমেন্ট মেথড নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('bkash')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20 text-pink-700 font-bold ring-2 ring-pink-500/20'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <span className="block text-xs">বিকাশ (bKash)</span>
              <span className="text-[10px] text-stone-400">ব্যক্তিগত বা মার্চেন্ট</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('nagad')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'nagad'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-700 font-bold ring-2 ring-orange-500/20'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <span className="block text-xs">নগদ (Nagad)</span>
              <span className="text-[10px] text-stone-400">মোবাইল ব্যাংকিং</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 font-bold ring-2 ring-blue-500/20'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <span className="block text-xs">কার্ড / SSL</span>
              <span className="text-[10px] text-stone-400">ভিসা / মাস্টারকার্ড</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('bank')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'bank'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 font-bold ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <span className="block text-xs">ব্যাংক ট্রান্সফার</span>
              <span className="text-[10px] text-stone-400">ইসলামী ব্যাংক বাংলাদেশ</span>
            </button>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 space-y-1">
            <span className="font-semibold block text-stone-800 dark:text-stone-200">
              {paymentMethod === 'bkash' && 'বিকাশ অনুদান নাম্বার: ০১৭১১-০০০০০১ (মার্চেন্ট পেমেন্ট)'}
              {paymentMethod === 'nagad' && 'নগদ অনুদান নাম্বার: ০১৮১২-০০০০০২ (মার্চেন্ট পেমেন্ট)'}
              {paymentMethod === 'bank' && 'হিসাব নাম: শুব্বান চ্যারিটি ট্রাস্ট, ইসলামী ব্যাংক বাংলাদেশ, হিসাব নং: ২০৫০১২৩৪৫৬৭৮'}
              {paymentMethod === 'card' && 'যেকোনো ডেবিট বা ক্রেডিট কার্ড দিয়ে তাৎক্ষণিক এনক্রিপ্টেড পেমেন্ট'}
            </span>
            <input
              type="text"
              placeholder="পেমেন্টের ট্রানজেকশন আইডি (TxnID) লিখুন..."
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs bg-white dark:bg-stone-900 mt-2 font-mono"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Heart className="w-4 h-4 text-shubban-gold fill-current" />
            <span>
              {isSubmitting
                ? 'অনুদান প্রক্রিয়াকরণ হচ্ছে...'
                : `${formatTaka(selectedAmount)} টাকা অনুদান নিশ্চিত করুন`}
            </span>
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 mt-2.5">
            <Lock className="w-3.5 h-3.5" />
            <span>২৫৬-বিট SSL এনক্রিপ্টেড ও সম্পূর্ণ নিরাপদ ইসলামিক দান ব্যবস্থা</span>
          </div>
        </div>
      </form>
    </div>
  );
}

