import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Heart,
  Users,
  Target,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { formatTaka, toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import { reconcileDonations, getDonationReports } from '@/lib/donations';
import AdminDonationsClient from './AdminDonationsClient';

export const revalidate = 0;

export const metadata = {
  title: 'দান ও সদকাহ তহবিল ব্যবস্থাপনা ও অডিট লেজার — অ্যাডমিন প্যানেল',
};

export default async function AdminDonationsPage() {
  const [reconciliation, reports, campaigns, recentDonations, recentLedgerEntries] =
    await Promise.all([
      reconcileDonations(),
      getDonationReports(),
      prisma.donationCampaign.findMany({
        include: { _count: { select: { donations: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.findMany({
        include: { campaign: true },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.donationLedgerEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

  const { metrics } = reports;

  return (
    <div className="space-y-8 font-bengali">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <span>দান ও সদকাহ তহবিল ব্যবস্থাপনা (As-Sunnah Charity Module)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট সংগৃহীত অনুদান: <strong className="text-shubban-gold font-serif">{formatTaka(metrics.totalRaised)}</strong> • 
            বিতরণকৃত সহায়তা: <strong className="text-stone-700 dark:text-stone-300 font-serif">{formatTaka(metrics.totalReliefDisbursed)}</strong> • 
            বর্তমান নিট ব্যালেন্স: <strong className="text-shubban-green font-serif">{formatTaka(metrics.netCharityBalance)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/donations"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-1.5 transition-all"
          >
            <span>লাইভ দান পেজ দেখুন &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Strict Accounting Segregation Assurance Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <span className="font-bold block">
            শরিয়াহ সম্মত স্বতন্ত্র সদকাহ লেজার নীতি (Strict Fund Isolation):
          </span>
          <p className="text-stone-600 dark:text-stone-400">
            মার্কেটপ্লেসের বাণিজ্যিক আয়, বিক্রেতা সাব-অর্ডার ও প্ল্যাটফর্ম কমিশন থেকে সদকাহ ও দান তহবিলের অর্থ ১০০% পৃথক রাখা হয়েছে (<code className="font-mono text-amber-700 dark:text-amber-300">DonationLedgerEntry</code>)। অনুদাতার পুরো অর্থ কোনো কমিশন কর্তন ছাড়াই সংশ্লিষ্ট ফান্ডে জমা হয়।
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>মোট অনুদান প্রাপ্তি</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-serif font-black text-shubban-gold">
            {formatTaka(metrics.totalRaised)}
          </div>
          <div className="text-[11px] text-stone-400">
            মোট দাতা: {toBengaliNumber(metrics.totalActiveDonations)} জন
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>ত্রাণ ও সহায়তা বিতরণ</span>
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
            {formatTaka(metrics.totalReliefDisbursed)}
          </div>
          <div className="text-[11px] text-stone-400">
            ত্রাণ ও সদকাহ খাতে ডেবিট
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>বর্তমান নিট ফান্ড ব্যালেন্স</span>
            <Target className="w-4 h-4 text-shubban-green" />
          </div>
          <div className="text-2xl font-serif font-black text-shubban-green">
            {formatTaka(metrics.netCharityBalance)}
          </div>
          <div className="text-[11px] text-stone-400">
            বিতরণযোগ্য অবশিষ্ট অর্থ
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>লেজার অডিট স্থিতি</span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-serif font-bold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{reconciliation.allBalanced ? '১০০% নির্ভুল' : 'পার্থক্য রয়েছে'}</span>
          </div>
          <div className="text-[11px] text-stone-400">
            লেজার এন্ট্রি: {toBengaliNumber(recentLedgerEntries.length)}টি
          </div>
        </div>
      </div>

      {/* Interactive Client Component for Actions, Modals, Refunds, and Relief Disbursements */}
      <AdminDonationsClient
        campaigns={campaigns}
        recentDonations={recentDonations}
        recentLedgerEntries={recentLedgerEntries}
        reconciliation={reconciliation}
      />
    </div>
  );
}
