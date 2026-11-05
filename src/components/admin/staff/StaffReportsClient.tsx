'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function StaffReportsClient() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold border border-shubban-green/20">
              অপারেশনাল অ্যানালিটিক্স
            </span>
            <span className="text-xs text-stone-500">পারফরম্যান্স অডিট ও রিপোর্ট</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-shubban-gold" />
            <span>স্টাফ পারফরম্যান্স ও ডিপার্টমেন্ট অডিট রিপোর্ট</span>
          </h1>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 self-start sm:self-auto"
          title="রিফ্রেশ"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-shubban-gold' : ''}`} />
        </button>
      </div>

      {/* Overview Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs text-stone-500 font-medium">কার্য সম্পাদন হার</span>
          <div className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
            {stats ? `${toBengaliNumber(stats.tasks.completionRate)}%` : '০%'}
          </div>
          <p className="text-[11px] text-stone-400">
            মোট {stats ? toBengaliNumber(stats.tasks.total) : '০'} টি টাস্কের মধ্যে
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs text-stone-500 font-medium">সক্রিয় জনবল অনুপাত</span>
          <div className="text-2xl font-bold font-serif text-shubban-green dark:text-shubban-gold">
            {stats && stats.staff.total > 0
              ? `${toBengaliNumber(Math.round((stats.staff.active / stats.staff.total) * 100))}%`
              : '১০০%'}
          </div>
          <p className="text-[11px] text-stone-400">
            {stats ? `${toBengaliNumber(stats.staff.active)} জন সক্রিয় কর্মকর্তা` : ''}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs text-stone-500 font-medium">আজকের কর্মস্থলে উপস্থিতি</span>
          <div className="text-2xl font-bold font-serif text-teal-600">
            {stats ? toBengaliNumber(stats.attendance.todayCount) : '০'} জন
          </div>
          <p className="text-[11px] text-stone-400">ডিজিটাল হাজিরা নথিভুক্ত</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs text-stone-500 font-medium">অপেক্ষমান সিদ্ধান্ত</span>
          <div className="text-2xl font-bold font-serif text-amber-600">
            {stats ? toBengaliNumber(stats.approvals.pending + stats.leaves.pending) : '০'} টি
          </div>
          <p className="text-[11px] text-stone-400">অনুমোদন ও ছুটির কিউতে</p>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-shubban-green" />
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              বিভাগভিত্তিক কর্মদক্ষতা ও লোকবল বণ্টন (Department Matrix)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-stone-500 font-semibold">
                <th className="py-3 px-4">বিভাগ ও কোড</th>
                <th className="py-3 px-4">কর্মকর্তা সংখ্যা</th>
                <th className="py-3 px-4">চলমান দায়িত্ব</th>
                <th className="py-3 px-4">জনবল অংশীদারিত্ব (%)</th>
                <th className="py-3 px-4 text-right">কার্যক্রম স্থিতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {stats?.departments?.breakdown?.map((dept: any) => {
                const totalStaff = stats.staff.total || 1;
                const pct = Math.round((dept._count.staffMembers / totalStaff) * 100);
                return (
                  <tr key={dept.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">{dept.name}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{dept.code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800 dark:text-stone-200">
                      {toBengaliNumber(dept._count.staffMembers)} জন
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                      {toBengaliNumber(dept._count.tasks)} টি
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 max-w-[120px]">
                        <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-shubban-green h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono">{toBengaliNumber(pct)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        সক্রিয়
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

