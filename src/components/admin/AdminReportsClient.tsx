'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Percent,
  Truck,
  Download,
  Printer,
  Calendar,
  Layers,
  ShoppingBag,
  HeartHandshake,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';

export interface MonthlySalesData {
  month: string;
  revenue: number;
  orders: number;
}

export interface CategorySalesData {
  id: string;
  name: string;
  itemsSold: number;
  totalRevenue: number;
  percentage: number;
}

export interface ProductSalesData {
  id: string;
  title: string;
  coverImage?: string | null;
  unitsSold: number;
  revenue: number;
}

export interface PaymentGatewayData {
  gateway: string;
  count: number;
  totalAmount: number;
  successRate: number;
}

interface AdminReportsClientProps {
  summary: {
    totalGross: number;
    totalCommission: number;
    totalPayout: number;
    totalShipping: number;
    totalDiscount: number;
    orderCount: number;
    totalDonations: number;
    onlinePaymentVolume: number;
  };
  monthlySales: MonthlySalesData[];
  categorySales: CategorySalesData[];
  topProducts: ProductSalesData[];
  paymentBreakdown: PaymentGatewayData[];
}

export default function AdminReportsClient({
  summary,
  monthlySales,
  categorySales,
  topProducts,
  paymentBreakdown,
}: AdminReportsClientProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CATEGORIES' | 'PRODUCTS' | 'PAYMENTS'>('OVERVIEW');
  const [timeRange, setTimeRange] = useState('ALL');

  const maxMonthlyRevenue = Math.max(...monthlySales.map((m) => m.revenue), 1);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Category,Items Sold,Revenue (BDT),Share (%)\n';
    categorySales.forEach((c) => {
      csvContent += `"${c.name}",${c.itemsSold},${c.totalRevenue},${c.percentage}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shubban-sales-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Export Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm print:hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            সার্বিক আর্থিক চিত্র
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'CATEGORIES'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            ক্যাটাগরি বিক্রয়
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'PRODUCTS'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            শীর্ষ বিক্রিত বই
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'PAYMENTS'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            পেমেন্ট চ্যানেল
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <p className="text-[11px] text-stone-500 font-medium">সর্বমোট মোট বিক্রয়</p>
          <p className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
            {formatTaka(summary.totalGross)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">{toBengaliNumber(summary.orderCount)}টি অর্ডার</p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <p className="text-[11px] text-emerald-600 font-medium">প্ল্যাটফর্ম কমিশন</p>
          <p className="text-xl font-bold font-serif text-emerald-700 dark:text-emerald-400 mt-1">
            {formatTaka(summary.totalCommission)}
          </p>
          <p className="text-[10px] text-emerald-600/80 mt-0.5">নিট মার্কেটপ্লেস আয়</p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <p className="text-[11px] text-amber-600 font-medium">বিক্রেতা পে-আউট দেয়</p>
          <p className="text-xl font-bold font-serif text-amber-700 dark:text-amber-400 mt-1">
            {formatTaka(summary.totalPayout)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">সেলার নিট প্রাপ্য</p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <p className="text-[11px] text-stone-500 font-medium">শিপিং চার্জ সংগৃহীত</p>
          <p className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
            {formatTaka(summary.totalShipping)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">কুরিয়ার ডেলিভারি ফি</p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <p className="text-[11px] text-blue-600 font-medium">অনলাইন পেমেন্ট ভলিউম</p>
          <p className="text-xl font-bold font-serif text-blue-700 dark:text-blue-400 mt-1">
            {formatTaka(summary.onlinePaymentVolume)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">বিকাশ ও ডিজিটাল পে</p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <p className="text-[11px] text-purple-600 font-medium">দান ও ওয়াকফ ফান্ড</p>
          <p className="text-xl font-bold font-serif text-purple-700 dark:text-purple-400 mt-1">
            {formatTaka(summary.totalDonations)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">চ্যারিটি ক্যাম্পেইন</p>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-shubban-darkCard p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-shubban-gold" />
                  <span>মাসিক রাজস্ব ও বিক্রয় ধারা ({new Date().getFullYear()})</span>
                </h3>
                <p className="text-[11px] text-stone-400">প্রতি মাসের মোট বিক্রয় পরিসংখ্যান</p>
              </div>
            </div>

            <div className="pt-4 flex items-end gap-3 h-56 justify-between px-2">
              {monthlySales.map((item, idx) => {
                const heightPercent = Math.max(Math.round((item.revenue / maxMonthlyRevenue) * 100), 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] px-2 py-1 rounded-md mb-1 pointer-events-none whitespace-nowrap shadow-lg">
                      {formatTaka(item.revenue)} ({toBengaliNumber(item.orders)}টি অর্ডার)
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-shubban-green to-shubban-gold rounded-t-lg group-hover:brightness-110 transition-all shadow-xs"
                    />
                    <span className="text-[11px] font-medium text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-100">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Financial Ratios */}
          <div className="bg-white dark:bg-shubban-darkCard p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>আর্থিক অনুপাত ও মুনাফা বিশ্লেষণ</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>মার্কেটপ্লেস নিট মার্জিন</span>
                  <span className="text-emerald-600 font-mono">
                    {summary.totalGross > 0
                      ? ((summary.totalCommission / summary.totalGross) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${summary.totalGross > 0 ? (summary.totalCommission / summary.totalGross) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>সেলার পে-আউট অনুপাত</span>
                  <span className="text-amber-600 font-mono">
                    {summary.totalGross > 0
                      ? ((summary.totalPayout / summary.totalGross) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${summary.totalGross > 0 ? (summary.totalPayout / summary.totalGross) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>অনলাইন পেমেন্ট গ্রহণযোগ্যতা</span>
                  <span className="text-blue-600 font-mono">
                    {summary.totalGross > 0
                      ? ((summary.onlinePaymentVolume / summary.totalGross) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${summary.totalGross > 0 ? (summary.onlinePaymentVolume / summary.totalGross) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5 text-[11px] text-stone-500">
                <p className="font-semibold text-stone-700 dark:text-stone-300">💡 আর্থিক পরামর্শ:</p>
                <p>বিকাশ ও ডিজিটাল পেমেন্ট ব্যবহারে ক্যাশ-অন-ডেলিভারির তুলনায় রিটার্ন বা ক্যান্সেলেশন হার প্রায় ৭০% কম থাকে।</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Sales Breakdown */}
      {activeTab === 'CATEGORIES' && (
        <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-shubban-gold" />
              <span>ক্যাটাগরি-ভিত্তিক বিক্রয় ও শেয়ার</span>
            </h3>
            <span className="text-xs text-stone-400">
              মোট {toBengaliNumber(categorySales.length)}টি ক্যাটাগরি
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-3.5">ক্যাটাগরি নাম</th>
                  <th className="p-3.5">বিক্রিত আইটেম সংখ্যা</th>
                  <th className="p-3.5">মোট অর্জিত মূল্য</th>
                  <th className="p-3.5">মার্কেটপ্লেস শেয়ার</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {categorySales.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="p-3.5 font-bold text-stone-900 dark:text-stone-100">
                      {c.name}
                    </td>
                    <td className="p-3.5 font-mono text-stone-700 dark:text-stone-300">
                      {toBengaliNumber(c.itemsSold)} টি
                    </td>
                    <td className="p-3.5 font-bold text-shubban-green dark:text-shubban-gold font-mono">
                      {formatTaka(c.totalRevenue)}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-shubban-gold rounded-full"
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-stone-600 dark:text-stone-400">
                          {c.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products View */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-shubban-gold" />
              <span>শীর্ষ বিক্রিত বই ও পণ্যের রাজস্ব র‍্যাংকিং</span>
            </h3>
            <span className="text-xs text-stone-400">
              মোট {toBengaliNumber(topProducts.length)}টি বই ট্র্যাক করা হচ্ছে
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-3.5">র‍্যাংক</th>
                  <th className="p-3.5">বই / পণ্য</th>
                  <th className="p-3.5">মোট ইউনিট বিক্রয়</th>
                  <th className="p-3.5">অর্জিত মোট রাজস্ব</th>
                  <th className="p-3.5 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {topProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="p-3.5 font-bold font-mono text-stone-400">
                      #{idx + 1}
                    </td>
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-9 h-12 bg-stone-100 dark:bg-stone-800 rounded-md overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                        {p.coverImage ? (
                          <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-stone-400">
                            বই
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-stone-800 dark:text-stone-200 line-clamp-1">
                        {p.title}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-stone-700 dark:text-stone-300">
                      {toBengaliNumber(p.unitsSold)} কপি
                    </td>
                    <td className="p-3.5 font-bold text-shubban-green dark:text-shubban-gold font-mono">
                      {formatTaka(p.revenue)}
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={`/books/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-shubban-gold hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <span>ভিউ</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Gateways Breakdown */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-shubban-gold" />
              <span>পেমেন্ট মেথড ও গেটওয়ে পারফরম্যান্স</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-3.5">পেমেন্ট গেটওয়ে / পদ্ধতি</th>
                  <th className="p-3.5">মোট সফল লেনদেন</th>
                  <th className="p-3.5">সংগৃহীত সর্বমোট টাকা</th>
                  <th className="p-3.5">সফলতার হার (Success Rate)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {paymentBreakdown.map((pb, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="p-3.5 font-bold font-mono text-stone-800 dark:text-stone-200 uppercase">
                      {pb.gateway}
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-stone-700 dark:text-stone-300">
                      {toBengaliNumber(pb.count)} টি
                    </td>
                    <td className="p-3.5 font-bold text-shubban-green dark:text-shubban-gold font-mono">
                      {formatTaka(pb.totalAmount)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {pb.successRate}% সফল
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

