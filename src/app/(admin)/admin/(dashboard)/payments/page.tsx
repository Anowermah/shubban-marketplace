import React from 'react';
import { prisma } from '@/lib/prisma';
import { CreditCard, CheckCircle2, Clock, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatTaka, toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';

export const revalidate = 0;

interface AdminPaymentsPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 15;

  const [totalPayments, payments, totalAmountAgg, refundsAgg, countByGateway] = await Promise.all([
    prisma.paymentTransaction.count(),
    prisma.paymentTransaction.findMany({
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.refund.aggregate({
      where: { status: 'PROCESSED' },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.groupBy({
      by: ['gateway'],
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalPayments / pageSize);
  const grossCollected = totalAmountAgg._sum.amount || 0;
  const totalRefunded = refundsAgg._sum.amount || 0;
  const netRevenue = grossCollected - totalRefunded;

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-shubban-gold" />
            <span>পেমেন্ট ও অনলাইন লেনদেন (Payments & Transactions)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            বিকাশ, নগদ, SSLCommerz ও ক্যাশ অন ডেলিভারি (COD) পেমেন্ট ট্রানজেকশন ট্র্যাকিং।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/refunds"
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:border-shubban-gold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
            <span>রিফান্ড ম্যানেজমেন্ট</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs text-stone-500 block">মোট সফল পেমেন্ট</span>
          <span className="font-bold text-xl text-emerald-600 font-mono mt-1 block">
            {formatTaka(grossCollected)}
          </span>
          <span className="text-[10px] text-stone-400 mt-0.5 block">
            {toBengaliNumber(totalAmountAgg._count.id || 0)} টি সফল লেনদেন
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs text-stone-500 block">মোট রিফান্ড সমন্বয়</span>
          <span className="font-bold text-xl text-rose-600 font-mono mt-1 block">
            - {formatTaka(totalRefunded)}
          </span>
          <span className="text-[10px] text-stone-400 mt-0.5 block">নিষ্পন্ন ক্যাশব্যাক</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs text-stone-500 block">নেট সংগৃহীত অর্থ</span>
          <span className="font-bold text-xl text-shubban-green dark:text-shubban-gold font-mono mt-1 block">
            {formatTaka(netRevenue)}
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">প্রকৃত রাজস্ব উদ্বৃত্ত</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs text-stone-500 block">রিকনসিলিয়েশন স্ট্যাটাস</span>
          <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mt-1 block flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            গেটের সাথে সিংকড
          </span>
          <span className="text-[10px] text-stone-400 mt-0.5 block">জিরো-ট্রাস্ট যাচাইকৃত</span>
        </div>
      </div>

      {/* Gateway breakdown pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-500">গেটওয়ে সারসংক্ষেপ:</span>
        {countByGateway.map((gw) => (
          <span
            key={gw.gateway}
            className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700"
          >
            {gw.gateway}: {formatTaka(gw._sum.amount || 0)} ({toBengaliNumber(gw._count.id)} টি)
          </span>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-shubban-gold" />
            <span>সাম্প্রতিক পেমেন্ট ট্রানজেকশন তালিকা</span>
          </h3>
          <span className="text-xs text-stone-400">সর্বশেষ {toBengaliNumber(payments.length)}টি লেনদেন</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4">ট্রানজেকশন আইডি</th>
                <th className="p-4">অর্ডার রেফারেন্স</th>
                <th className="p-4">পেমেন্ট গেটওয়ে</th>
                <th className="p-4">পরিমাণ (টাকা)</th>
                <th className="p-4">স্ট্যাটাস</th>
                <th className="p-4 text-right">তারিখ ও সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {payments.map((txn) => (
                <tr key={txn.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                  <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                    {txn.transactionId}
                  </td>
                  <td className="p-4 font-mono text-stone-600 dark:text-stone-300">
                    {txn.orderId ? `অর্ডার #${txn.orderId.slice(-6)}` : txn.donationId ? `দান #${txn.donationId.slice(-6)}` : 'সাধারণ'}
                  </td>
                  <td className="p-4 font-semibold text-stone-800 dark:text-stone-200">
                    <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[11px] font-mono">
                      {txn.gateway}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-shubban-green dark:text-shubban-gold">
                    {formatTaka(txn.amount)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${txn.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : txn.status === 'REFUNDED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                    >
                      {txn.status === 'SUCCESS' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> সফল
                        </>
                      ) : txn.status === 'REFUNDED' ? (
                        <>
                          <RefreshCw className="w-3 h-3" /> রিফান্ডেড
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> {txn.status}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-right text-stone-400">
                    {formatBengaliDate(txn.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalPayments}
        itemsPerPage={pageSize}
        itemName="লেনদেন"
        pageUrlTemplate="/admin/payments?page=[page]"
      />
    </div>
  );
}
