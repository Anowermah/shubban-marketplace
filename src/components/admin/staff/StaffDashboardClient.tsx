'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  CalendarCheck,
  CheckSquare,
  FileCheck2,
  Plus,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Search,
  Shield,
  Briefcase,
  ChevronRight,
  TrendingUp,
  BarChart3,
  CalendarClock,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function StaffDashboardClient() {
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
      console.error('Error fetching staff stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold border border-shubban-green/20">
              HRMS & Responsibility
            </span>
            <span className="text-xs text-stone-400">সংস্করণ ২.৪</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-shubban-gold" />
            <span>প্রশাসনিক স্টাফ ও দায়িত্ব বণ্টন ড্যাশবোর্ড</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            কর্মকর্তা-কর্মচারীদের পদমর্যাদা, বিভাগীয় দায়িত্ব, টাস্ক ট্র্যাকিং ও অনুমোদন ব্যবস্থা।
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-shubban-gold' : ''}`} />
          </button>

          <Link
            href="/admin/staff/tasks?create=true"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4 text-stone-500" />
            <span>নতুন টাস্ক</span>
          </Link>

          <Link
            href="/admin/staff/directory?action=new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-greenDark text-white text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4 text-shubban-gold" />
            <span>স্টাফ অনবোর্ড</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Staff */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium">মোট স্টাফ</span>
            <Users className="w-4 h-4 text-shubban-gold" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {stats ? toBengaliNumber(stats.staff.total) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{stats ? toBengaliNumber(stats.staff.active) : '০'} জন সক্রিয়</span>
          </div>
        </div>

        {/* Departments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium">বিভাগসমূহ</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {stats ? toBengaliNumber(stats.departments.total) : '—'}
          </div>
          <Link href="/admin/staff/departments" className="mt-1 text-[11px] text-blue-600 hover:underline flex items-center gap-0.5">
            <span>বিভাগ তালিকা</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pending Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium">চলমান টাস্ক</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {stats ? toBengaliNumber(stats.tasks.inProgress + stats.tasks.todo) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>বকেয়া দায়িত্ব</span>
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium">সম্পন্নতার হার</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
            {stats ? `${toBengaliNumber(stats.tasks.completionRate)}%` : '০%'}
          </div>
          <div className="mt-1 text-[11px] text-stone-400">
            {stats ? `${toBengaliNumber(stats.tasks.completed)} সম্পন্ন` : ''}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium">অনুমোদন কিউ</span>
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {stats ? toBengaliNumber(stats.approvals.pending) : '—'}
          </div>
          <Link href="/admin/staff/approvals" className="mt-1 text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5">
            <span>পর্যালোচনা করুন</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Attendance Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-medium">আজকের হাজিরা</span>
            <CalendarCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {stats ? toBengaliNumber(stats.attendance.todayCount) : '—'}
          </div>
          <Link href="/admin/staff/attendance" className="mt-1 text-[11px] text-teal-600 hover:underline flex items-center gap-0.5">
            <span>উপস্থিতি খাতা</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Department Breakdown & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Overview */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-shubban-green dark:text-shubban-gold" />
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                বিভাগভিত্তিক কর্মী ও দায়িত্ব বণ্টন
              </h2>
            </div>
            <Link
              href="/admin/staff/departments"
              className="text-xs text-shubban-green hover:underline flex items-center gap-1 font-semibold"
            >
              <span>সকল বিভাগ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stats?.departments?.breakdown?.map((dept: any) => (
              <div
                key={dept.id}
                className="p-3.5 rounded-xl border border-stone-150 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-shubban-gold/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                    {dept.code}
                  </span>
                  <span className="text-xs font-semibold text-shubban-green dark:text-shubban-gold">
                    {toBengaliNumber(dept._count.staffMembers)} জন
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-stone-900 dark:text-stone-100 mt-2 truncate group-hover:text-shubban-green transition">
                  {dept.name}
                </h3>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-500">
                  <span>চলমান দায়িত্ব</span>
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {toBengaliNumber(dept._count.tasks)} টি
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Navigation / Shortcuts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Briefcase className="w-5 h-5 text-shubban-gold" />
            <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              প্রশাসনিক মডিউলসমূহ
            </h2>
          </div>

          <div className="space-y-2">
            {[
              {
                title: 'স্টাফ ডিরেক্টরি ও প্রোফাইল',
                desc: 'কর্মকর্তাদের পরিচয়, পদমর্যাদা ও যোগাযোগ',
                href: '/admin/staff/directory',
                icon: Users,
                color: 'text-emerald-500',
              },
              {
                title: 'ডিপার্টমেন্ট ও পদবি কাঠামো',
                desc: 'অর্গানোগ্রাম ও গ্রেড স্কেল নিয়ন্ত্রণ',
                href: '/admin/staff/departments',
                icon: Building2,
                color: 'text-blue-500',
              },
              {
                title: 'দায়িত্ব ও টাস্ক অ্যাসাইনমেন্ট',
                desc: 'টাস্ক অর্পণ, অগ্রগতি ও জবাবদিহিতা',
                href: '/admin/staff/tasks',
                icon: CheckSquare,
                color: 'text-amber-500',
              },
              {
                title: 'অনুমোদন ও ওয়ার্কফ্লো কিউ',
                desc: 'প্রকাশনা, খরচ ও প্রশাসনিক অনুমোদন',
                href: '/admin/staff/approvals',
                icon: FileCheck2,
                color: 'text-purple-500',
              },
              {
                title: 'দৈনিক হাজিরা ও ছুটির ব্যবস্থাপনা',
                desc: 'চেক-ইন, চেক-আউট ও ছুটির আবেদন',
                href: '/admin/staff/attendance',
                icon: CalendarClock,
                color: 'text-teal-500',
              },
              {
                title: 'পারফরম্যান্স ও ডেলিভারি রিপোর্ট',
                desc: 'কর্মদক্ষতা পরিসংখ্যান ও নিরীক্ষা',
                href: '/admin/staff/reports',
                icon: BarChart3,
                color: 'text-rose-500',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition group"
                >
                  <div className={`p-2 rounded-lg bg-stone-100 dark:bg-stone-800 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-shubban-green transition">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Staff & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                সাম্প্রতিক দায়িত্ব ও কার্যতালিকা
              </h2>
            </div>
            <Link
              href="/admin/staff/tasks"
              className="text-xs text-shubban-green hover:underline flex items-center gap-1 font-semibold"
            >
              <span>সকল টাস্ক</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.tasks?.recent?.length > 0 ? (
              stats.tasks.recent.map((task: any) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-stone-150 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          task.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : task.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {task.priority === 'URGENT' ? 'জরুরি' : task.priority === 'HIGH' ? 'উচ্চ' : 'সাধারণ'}
                      </span>
                      <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                      <span>দায়িত্বে: {task.assignee?.name || 'অনির্ধারিত'}</span>
                      {task.department && <span>• {task.department.name}</span>}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {task.status === 'COMPLETED' ? 'সম্পন্ন' : task.status === 'IN_PROGRESS' ? 'চলমান' : 'অপেক্ষমান'}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      অগ্রগতি {toBengaliNumber(task.progress)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-6">বর্তমানে কোনো নতুন টাস্ক নেই।</p>
            )}
          </div>
        </div>

        {/* Recent Staff Members */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-shubban-green" />
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                সর্বশেষ অনবোর্ডকৃত কর্মকর্তা
              </h2>
            </div>
            <Link
              href="/admin/staff/directory"
              className="text-xs text-shubban-green hover:underline flex items-center gap-1 font-semibold"
            >
              <span>সকল স্টাফ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats?.recentStaff?.length > 0 ? (
              stats.recentStaff.map((member: any) => (
                <div
                  key={member.id}
                  className="p-3 rounded-xl border border-stone-150 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center font-bold text-xs border border-shubban-green/20 shrink-0">
                      {member.user?.name?.charAt(0) || 'ক'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                        {member.user?.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate">
                        {member.designation?.name || 'অফিসার'} • {member.department?.name || 'সাধারণ'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                      {member.employeeId}
                    </span>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      {member.employmentStatus === 'ACTIVE' ? 'সক্রিয়' : member.employmentStatus}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-6">কোনো স্টাফ রেকর্ড পাওয়া যায়নি।</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

