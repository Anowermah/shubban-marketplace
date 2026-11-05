'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface ConversationItem {
  id: string;
  title: string;
  agentKey?: string | null;
  mode?: string | null;
  isIslamicAi: boolean;
  messageCount: number;
  lastMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AiStudioConversationsClientProps {
  initialConversations: ConversationItem[];
}

export default function AiStudioConversationsClient({
  initialConversations,
}: AiStudioConversationsClientProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'AI_STUDIO' | 'ISLAMIC_AI'>('ALL');

  const handleDelete = async (id: string, isIslamic: boolean) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই কথোপকথনটি মুছে ফেলতে চান?')) return;

    try {
      const deleteId = isIslamic ? `islamic_${id}` : id;
      const res = await fetch(`/api/admin/ai-studio/conversations?id=${deleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      alert('মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const handleExport = (conv: ConversationItem) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conv, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `conversation_${conv.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = conversations.filter((c) => {
    if (filterType === 'ISLAMIC_AI' && !c.isIslamicAi) return false;
    if (filterType === 'AI_STUDIO' && c.isIslamicAi) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <MessageSquare className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                সেন্ট্রাল এআই কথোপকথন আর্কাইভ ও ব্যবস্থাপনা
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {toBengaliNumber(conversations.length)} টি সংরক্ষিত সেশন
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              ইসলামিক এআই এবং অ্যাডমিন কমান্ড সেন্টারের সকল কথোপকথন এক জায়গায় নিরীক্ষা, পর্যালোচনা ও এক্সপোর্ট করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/ai-studio/chat-hub"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>চ্যাট হাবে যান</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${filterType === 'ALL'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
          >
            সব সেশন ({toBengaliNumber(conversations.length)})
          </button>
          <button
            onClick={() => setFilterType('ISLAMIC_AI')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${filterType === 'ISLAMIC_AI'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
          >
            ইসলামিক এআই
          </button>
          <button
            onClick={() => setFilterType('AI_STUDIO')}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${filterType === 'AI_STUDIO'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
          >
            অ্যাডমিন এআই স্টুডিও
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="কথোপকথন অনুসন্ধান করুন..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 uppercase tracking-wider text-[10px] font-bold border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4">শিরোনাম ও সর্বশেষ বার্তা</th>
                <th className="p-4">উৎস ও এজেন্ট</th>
                <th className="p-4">বার্তা সংখ্যা</th>
                <th className="p-4">হালনাগাদের সময়</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-stone-400">
                    কোনো সংরক্ষিত সেশন পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((conv) => (
                  <tr key={conv.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span className="truncate max-w-md">{conv.title}</span>
                      </div>
                      {conv.lastMessage && (
                        <p className="text-[11px] text-stone-500 truncate max-w-md mt-0.5">
                          {conv.lastMessage}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${conv.isIslamicAi
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                      >
                        {conv.isIslamicAi ? 'ইসলামিক আরএজি' : conv.agentKey || 'সেন্ট্রাল এআই'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-stone-500">
                      {toBengaliNumber(conv.messageCount)} টি বার্তা
                    </td>
                    <td className="p-4 text-stone-400 text-[11px]">
                      {new Date(conv.updatedAt).toLocaleString('bn-BD')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href="/admin/ai-studio/chat-hub"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="চ্যাট হাবে খুলুন"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleExport(conv)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="এক্সপোর্ট (JSON)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(conv.id, conv.isIslamicAi)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

