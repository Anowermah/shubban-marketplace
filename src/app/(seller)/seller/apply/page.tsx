'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, ShieldCheck, TrendingUp, Truck, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthContext';

export default function SellerApplyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    businessAddress: '',
    city: 'ঢাকা',
    businessType: 'BOOKSTORE',
    tradeLicense: '',
    nidNumber: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'আবেদন জমা দিতে সমস্যা হয়েছে।');
      }

      setSuccessMsg(data.message);
      setFormData({
        shopName: '',
        ownerName: '',
        phone: '',
        email: '',
        businessAddress: '',
        city: 'ঢাকা',
        businessType: 'BOOKSTORE',
        tradeLicense: '',
        nidNumber: '',
        description: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'আবেদন প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-bengali space-y-12">
      {/* Return to website navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-shubban-green dark:hover:text-shubban-gold transition-colors p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>মূল ওয়েবসাইটে ফিরে যান</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-shubban-gold/15 text-shubban-gold border border-shubban-gold/30">
          <Store className="w-4 h-4" />
          <span>শুব্বান সেলার রেজিস্ট্রেশন পোর্টাল</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          শুব্বান মার্কেটপ্লেসে আপনার দোকান খুলুন
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          আপনার প্রকাশনী, বুকশপ বা ইসলামিক লাইফস্টাইল পণ্য পৌঁছে দিন দেশের লক্ষ লক্ষ শিক্ষিত ও রুচিশীল পাঠকের কাছে।
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 space-y-2 text-center sm:text-left">
          <TrendingUp className="w-6 h-6 text-shubban-gold mx-auto sm:mx-0" />
          <strong className="block text-stone-900 dark:text-stone-100 text-sm font-serif">দেশের শীর্ষ বইপ্রেমী ক্রেতা</strong>
          <p className="text-xs text-stone-500">নির্দিষ্ট বই ও জ্ঞানান্বেষী পাঠকগোষ্ঠীর কাছে বিনামূল্যে ব্র্যান্ডিং ও পৌঁছানো।</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 space-y-2 text-center sm:text-left">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto sm:mx-0" />
          <strong className="block text-stone-900 dark:text-stone-100 text-sm font-serif">স্বচ্ছ ও নিয়মিত পেআউট</strong>
          <p className="text-xs text-stone-500">অর্ডার ডেলিভারির পর সাপ্তাহিক ভিত্তিতে সরাসরি ব্যাংক বা বিকাশ অ্যাকাউন্টে টাকা স্থানান্তর।</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 space-y-2 text-center sm:text-left">
          <Truck className="w-6 h-6 text-blue-600 mx-auto sm:mx-0" />
          <strong className="block text-stone-900 dark:text-stone-100 text-sm font-serif">সহজ লজিস্টিকস ও শিপিং</strong>
          <p className="text-xs text-stone-500">পাঠাও, রেডেক্স ও স্টিডফাস্ট কুরিয়ার ইন্টিগ্রেশন দিয়ে ডোর-টু-ডোর পিকআপ ও ডেলিভারি।</p>
        </div>
      </div>

      {/* Main Application Card */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
          <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            বিক্রেতা নিবন্ধন আবেদন ফর্ম
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            অনুগ্রহ করে আপনার ব্যবসায়ের সঠিক তথ্য প্রদান করুন। ২৪-৪৮ ঘণ্টার মধ্যে আবেদন যাচাই করা হবে।
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                দোকান বা প্রকাশনীর নাম *
              </label>
              <input
                type="text"
                name="shopName"
                required
                placeholder="যেমন: আল-মদিনা বুক হাউজ"
                value={formData.shopName}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                ব্যবসার ধরন *
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              >
                <option value="BOOKSTORE">বুকস্টোর / লাইব্রেরী</option>
                <option value="PUBLISHER">মুদ্রণ ও প্রকাশনা সংস্থা</option>
                <option value="ISLAMIC_LIFESTYLE">ইসলামিক লাইফস্টাইল ও আতর</option>
                <option value="GENERAL">অন্যান্য সামগ্রী</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                স্বত্বাধিকারী / প্রতিনিধির পূর্ণ নাম *
              </label>
              <input
                type="text"
                name="ownerName"
                required
                placeholder="মালিকের নাম"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                মোবাইল নম্বর (যোগাযোগ ও ওটিপি) *
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="017XXXXXXXX"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                ব্যবসায়িক ইমেইল অ্যাড্রেস *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="shop@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                দোকান বা ওয়্যারহাউসের পূর্ণ ঠিকানা (কুরিয়ার পিকআপ পয়েন্ট) *
              </label>
              <input
                type="text"
                name="businessAddress"
                required
                placeholder="দোকান নং, মার্কেট/রোড, থানা, জেলা"
                value={formData.businessAddress}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                ট্রেড লাইসেন্স নম্বর (যদি থাকে)
              </label>
              <input
                type="text"
                name="tradeLicense"
                placeholder="ঐচ্ছিক"
                value={formData.tradeLicense}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                জাতীয় পরিচয়পত্র (NID) নম্বর
              </label>
              <input
                type="text"
                name="nidNumber"
                placeholder="এনআইডি নম্বর"
                value={formData.nidNumber}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                দোকান ও প্রধান পণ্যসমূহ সম্পর্কে সংক্ষিপ্ত বর্ণনা
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="আপনার দোকানে কি কি ধরনের বই বা পণ্য রয়েছে সে সম্পর্কে সংক্ষেপে লিখুন..."
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Store className="w-4 h-4 text-shubban-gold" />
              <span>{isSubmitting ? 'আবেদন পাঠানো হচ্ছে...' : 'আবেদনপত্র জমা দিন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

