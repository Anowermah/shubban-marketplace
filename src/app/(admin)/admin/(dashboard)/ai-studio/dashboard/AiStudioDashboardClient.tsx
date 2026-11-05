'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Search,
  Newspaper,
  ShoppingBag,
  LayoutTemplate,
  Headphones,
  BarChart3,
  Palette,
  Video,
  Shield,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface Props {
  initialStats: any;
  initialAgents: any[];
}

const AGENT_ICON_MAP: Record<string, any> = {
  'general-ai': Bot,
  'islamic-ai': BookOpen,
  'research-ai': Search,
  'magazine-ai': Newspaper,
  'marketplace-ai': ShoppingBag,
  'website-ai': LayoutTemplate,
  'support-ai': Headphones,
  'seo-ai': TrendingUp,
  'business-ai': BarChart3,
  'design-ai': Palette,
  'video-ai': Video,
  'knowledge-ai': Shield,
};

const DEPARTMENT_LABELS: Record<string, string> = {
  GENERAL: 'সাধারণ',
  ISLAMIC: 'ইসলামিক নলেজ',
  EDITORIAL: 'সম্পাদকীয় ও সাময়িকী',
  COMMERCE: 'ই-কমার্স ও পণ্য',
  OPERATIONS: 'অপারেশনস',
  MARKETING: 'মার্কেটিং ও এসইও',
  ANALYTICS: 'বিজনেস এনালিটিক্স',
  CREATIVE: 'ক্রিয়েটিভ ডিজাইন',
};

export default function AiStudioDashboardClient({ initialStats, initialAgents }: Props) {
  const stats = initialStats;
  const agents = initialAgents;

  const successRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <span>অ্যাডমিন কনসোল</span>
            <span>/</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">এআই স্টুডিও</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            শুভ্বান এআই স্টুডিও (Shubban AI Studio)
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            সেন্ট্রাল এআই ইকোসিস্টেম — ১২টি বিশেষায়িত এজেন্ট, ইউনিফায়েড চ্যাট হাব ও স্বয়ংক্রিয় কমান্ড সেন্টার
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/ai-studio/chat-hub"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>ইউনিফায়েড চ্যাট হাব</span>
          </Link>

          <Link
            href="/admin/ai-studio/command-center"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-bold shadow-sm transition"
          >
            <Bot className="w-4 h-4" />
            <span>কমান্ড সেন্টার</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-medium text-stone-500 block mb-1">মোট কনভারসেশন</span>
          <p className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {stats.totalConversations}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            {stats.islamicConversations} ইসলামিক • {stats.adminConversations} অ্যাডমিন
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-medium text-stone-500 block mb-1">মোট বার্তা (Messages)</span>
          <p className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {stats.totalMessages}
          </p>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">দ্বিমুখী আলোচনা</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-medium text-stone-500 block mb-1">সক্রিয় এআই এজেন্ট</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.activeAgents} / {stats.totalAgents}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            ১২টি বিভাগীয় বিশেষজ্ঞ
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-medium text-stone-500 block mb-1">টাস্ক সাকসেস রেট</span>
          <p className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {successRate}%
          </p>
          <span className="text-[10px] text-stone-500 block mt-0.5">
            {stats.completedTasks} সফল • {stats.failedTasks} ত্রুটি
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-medium text-stone-500 block mb-1">অপেক্ষমাণ অনুমোদন</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.pendingApprovals}
          </p>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
            <Link href="/admin/ai-studio/approvals" className="hover:underline">
              অনুমোদন কেন্দ্র →
            </Link>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-medium text-stone-500 block mb-1">সংযুক্ত প্রোভাইডার</span>
          <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.providers.filter((p: any) => p.isActive).length}
          </p>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
            লোকাল RAG + ক্লাউড
          </span>
        </div>
      </div>

      {/* 12 Specialized AI Agents Grid */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-600" />
              ১২টি বিশেষায়িত এআই এজেন্ট (Specialized Agent Registry)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              প্রতিটি এজেন্টের রয়েছে নিজস্ব জ্ঞানভাণ্ডার, অনুমতি পরিধি ও নিরাপত্তা মোড
            </p>
          </div>

          <Link
            href="/admin/ai-studio/agents"
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            এজেন্ট কনফিগারেশন দেখুন →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const Icon = AGENT_ICON_MAP[agent.key] || Bot;

            return (
              <div
                key={agent.id}
                className="p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-400/50 dark:hover:border-amber-500/40 transition flex flex-col justify-between space-y-3 bg-stone-50/40 dark:bg-stone-800/20 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                          {agent.name}
                        </h3>
                        <span className="text-[10px] text-stone-400 block">{agent.nameEn}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        agent.enabled
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {agent.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-stone-500">
                    {DEPARTMENT_LABELS[agent.department] || agent.department}
                  </span>

                  <Link
                    href={`/admin/ai-studio/chat-hub?agent=${agent.key}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <span>চ্যাট শুরু করুন</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Command Tasks & Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-600" />
              সাম্প্রতিক কমান্ড সেন্টার টাস্কসমূহ
            </h3>

            <Link
              href="/admin/ai-studio/command-center"
              className="text-xs text-emerald-600 hover:underline font-semibold"
            >
              কমান্ড সেন্টার খুলুন →
            </Link>
          </div>

          {stats.recentTasks.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              এখনো কোনো কমান্ড টাস্ক সম্পাদিত হয়নি।{' '}
              <Link
                href="/admin/ai-studio/command-center"
                className="text-emerald-600 font-bold hover:underline ml-1"
              >
                প্রথম কমান্ড দিন
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-start justify-between bg-stone-50/30 dark:bg-stone-800/20 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                      {task.command}
                    </span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      ইন্টেন্ট: {task.intent} • মোড: {task.safetyMode}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : task.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Connected Providers */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              সংযুক্ত এআই প্রোভাইডার
            </h3>

            <Link
              href="/admin/ai-studio/providers"
              className="text-xs text-purple-600 hover:underline font-semibold"
            >
              ম্যানেজ →
            </Link>
          </div>

          <div className="space-y-3">
            {stats.providers.map((prov: any) => (
              <div
                key={prov.id}
                className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs bg-stone-50/40 dark:bg-stone-800/20"
              >
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    {prov.name}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    {prov.providerKey} {prov.isDefault ? '• (ডিফল্ট)' : ''}
                  </span>
                </div>

                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    prov.isActive ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                  title={prov.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

