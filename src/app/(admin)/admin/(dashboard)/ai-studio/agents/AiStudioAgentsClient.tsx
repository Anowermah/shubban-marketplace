'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Shield,
  Bot,
  BookOpen,
  Newspaper,
  ShoppingBag,
  LayoutTemplate,
  Headphones,
  TrendingUp,
  BarChart3,
  Palette,
  Video,
  ArrowRight,
  Code,
  X,
  Loader2,
} from 'lucide-react';

interface AgentItem {
  id: string;
  key: string;
  name: string;
  nameEn: string;
  description: string;
  department: string;
  icon: string;
  enabled: boolean;
  safetyMode: string;
  isPublic: boolean;
  systemPrompt: string;
  allowedTools: string[];
}

interface Props {
  initialAgents: AgentItem[];
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
  GENERAL: 'সাধারণ ও বহুমুখী',
  ISLAMIC: 'ইসলামিক ও তাহকীক',
  EDITORIAL: 'সম্পাদকীয় ও সাময়িকী',
  COMMERCE: 'ই-কমার্স ও পণ্য',
  OPERATIONS: 'অপারেশনস ও সাপোর্ট',
  MARKETING: 'মার্কেটিং ও এসইও',
  ANALYTICS: 'বিজনেস এনালিটিক্স',
  CREATIVE: 'ক্রিয়েটিভ ও মিডিয়া',
};

export default function AiStudioAgentsClient({ initialAgents }: Props) {
  const [agents, setAgents] = useState<AgentItem[]>(initialAgents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return agents.filter((ag) => {
      const matchSearch =
        !searchTerm ||
        ag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.key.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = !selectedDept || ag.department === selectedDept;

      return matchSearch && matchDept;
    });
  }, [agents, searchTerm, selectedDept]);

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    try {
      setTogglingKey(key);
      const res = await fetch('/api/admin/ai-studio/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'এজেন্ট আপডেট ব্যর্থ হয়েছে');

      setAgents((prev) =>
        prev.map((a) => (a.key === key ? { ...a, enabled: !currentEnabled } : a))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <Link href="/admin/ai-studio/dashboard" className="hover:text-emerald-700 transition">
              এআই স্টুডিও
            </Link>
            <span>/</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">এজেন্ট রেজিস্ট্রি</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 text-white flex items-center justify-center shadow-md shadow-purple-700/20">
              <Users className="w-5 h-5" />
            </div>
            ১২টি বিশেষায়িত এআই এজেন্ট রেজিস্ট্রি
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            প্রতিটি এজেন্টের কার্যপরিধি, প্রম্পট নির্দেশনা, অনুমোদিত টুলস ও অ্যাক্সেস স্ট্যাটাস
          </p>
        </div>

        <Link
          href="/admin/ai-studio/chat-hub"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition self-start"
        >
          <span>চ্যাট হাবে যান</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="এজেন্টের নাম, বিভাগ বা কিওয়ার্ড দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল ডিপার্টমেন্ট</option>
            {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((agent) => {
          const Icon = AGENT_ICON_MAP[agent.key] || Bot;
          const isToggling = togglingKey === agent.key;

          return (
            <div
              key={agent.id}
              className="p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-purple-400/50 shadow-sm transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {agent.name}
                      </h3>
                      <span className="text-[10px] text-stone-400 font-mono block">
                        {agent.key}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(agent.key, agent.enabled)}
                    disabled={isToggling}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                      agent.enabled
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{agent.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                  </button>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                  {agent.description}
                </p>

                {/* Allowed Tools Tags */}
                {agent.allowedTools && agent.allowedTools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {agent.allowedTools.map((tool) => (
                      <span
                        key={tool}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className="text-stone-600 dark:text-stone-400 hover:text-stone-900 font-semibold"
                >
                  প্রম্পট ও কনফিগারেশন →
                </button>

                <Link
                  href={`/admin/ai-studio/chat-hub?agent=${agent.key}`}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>চ্যাট হাব</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                    {selectedAgent.name} ({selectedAgent.nameEn})
                  </h3>
                  <span className="text-xs text-stone-400 font-mono">আইডি: {selectedAgent.key}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  বিভাগ ও দায়িত্ব
                </label>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 font-medium">
                  {DEPARTMENT_LABELS[selectedAgent.department] || selectedAgent.department}
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  কার্যপরিধি ও বর্ণনা
                </label>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
                  {selectedAgent.description}
                </p>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  সিস্টেম প্রম্পট নির্দেশনা (System Instructions)
                </label>
                <div className="p-3.5 rounded-xl bg-stone-900 text-stone-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedAgent.systemPrompt}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  অনুমোদিত এআই টুলস (Allowed Tools)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.allowedTools.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>

              <Link
                href={`/admin/ai-studio/chat-hub?agent=${selectedAgent.key}`}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                <span>এই এজেন্টের সাথে চ্যাট শুরু করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

