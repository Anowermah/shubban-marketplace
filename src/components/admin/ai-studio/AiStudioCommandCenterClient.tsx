'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Boxes,
  Tag,
  Search,
  ExternalLink,
  Flame,
  LayoutTemplate,
  RefreshCw,
  Cpu,
  ShieldAlert,
  Shield,
  FileCheck2,
  Activity,
  History,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface TaskStep {
  id: string;
  stepOrder: number;
  title: string;
  toolName: string;
  status: string;
}

interface TaskData {
  id: string;
  intent: string;
  status: string;
  safetyMode: string;
  planSummary: string;
  diffPreview?: any;
  beforeState?: any;
  afterState?: any;
  rollbackData?: string | null;
  steps?: TaskStep[];
  data?: any;
}

interface Message {
  id: string;
  sender: 'USER' | 'AI' | 'SYSTEM';
  content: string;
  createdAt: string | Date;
  task?: TaskData | null;
}

interface CommandCenterStats {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    pendingApprovals: number;
    failedTasks: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  providers: Array<{
    providerKey: string;
    name: string;
    isEnabled: boolean;
    modelName: string;
  }>;
  recentTasks: Array<any>;
}

interface AiStudioCommandCenterClientProps {
  initialConversation: {
    id: string;
    title: string;
    messages: Message[];
  };
  stats: CommandCenterStats;
}

export default function AiStudioCommandCenterClient({
  initialConversation,
  stats: initialStats,
}: AiStudioCommandCenterClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialConversation.messages || []);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle command submission
  const handleSubmitCommand = async (commandToSend?: string) => {
    const text = (commandToSend || inputText).trim();
    if (!text || isProcessing) return;

    setInputText('');
    setFeedback(null);
    setIsProcessing(true);

    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      sender: 'USER',
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/admin/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: initialConversation.id,
          command: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'কমান্ড সম্পন্ন করা সম্ভব হয়নি');
      }

      const aiMsg: Message = {
        id: data.messageId,
        sender: 'AI',
        content: data.responseContent,
        createdAt: new Date(),
        task: data.task || null,
      };

      setMessages((prev) => [...prev, aiMsg]);
      refreshStats();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'একটি ত্রুটি ঘটেছে',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Refresh live stats
  const refreshStats = async () => {
    try {
      const res = await fetch('/api/admin/ai/tasks?action=stats');
      const data = await res.json();
      if (data.metrics) {
        setStats((prev) => ({
          ...prev,
          metrics: data.metrics,
          recentTasks: data.recentTasks || prev.recentTasks,
        }));
      }
    } catch (e) {}
  };

  // Execute pending task
  const handleExecuteTask = async (taskId: string) => {
    setActionInProgress(taskId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/ai/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE', taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'টাস্ক সম্পন্ন করা যায়নি');

      setFeedback({ type: 'success', text: 'টাস্ক সফলভাবে এক্সিকিউট করা হয়েছে!' });

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.task?.id === taskId) {
            return {
              ...msg,
              task: {
                ...msg.task,
                status: 'COMPLETED',
                steps: msg.task.steps?.map((s) => ({ ...s, status: 'COMPLETED' })),
              },
            };
          }
          return msg;
        })
      );
      refreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  // Rollback task
  const handleRollbackTask = async (taskId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পরিবর্তনগুলো আগের অবস্থায় ফিরিয়ে নিতে চান?')) return;

    setActionInProgress(taskId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/ai/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ROLLBACK', taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'রোলব্যাক ব্যর্থ হয়েছে');

      setFeedback({ type: 'success', text: 'পরিবর্তন সফলভাবে পূর্বাবস্থায় ফিরিয়ে নেওয়া হয়েছে।' });

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.task?.id === taskId) {
            return {
              ...msg,
              task: { ...msg.task, status: 'ROLLED_BACK' },
            };
          }
          return msg;
        })
      );
      refreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject task
  const handleRejectTask = async (taskId: string) => {
    setActionInProgress(taskId);
    try {
      const res = await fetch('/api/admin/ai/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', taskId }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.task?.id === taskId) {
              return {
                ...msg,
                task: { ...msg.task, status: 'REJECTED' },
              };
            }
            return msg;
          })
        );
        refreshStats();
      }
    } catch (e) {} finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner / Safety Architecture Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bot className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                শুব্বান এআই কমান্ড সেন্টার
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                AUTONOMOUS V2.5
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              প্রাকৃতিক বাংলায় নির্দেশ দিন। সিস্টেম স্বয়ংক্রিয়ভাবে অ্যাকশন প্ল্যান তৈরি করবে, ডিফারেনশিয়াল প্রিভিউ দেখাবে এবং নিরাপত্তা মোড বজায় রেখে এক্সিকিউট বা রোলব্যাক করবে।
            </p>
          </div>

          {/* Three Tier Safety Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>মোড A: স্বয়ংক্রিয়</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>মোড B: প্রিভিউ অনুমোদন</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>মোড C: স্পর্শকাতর নিশ্চিতকরণ</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>মোট টাস্ক</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-2 font-mono">
            {toBengaliNumber(stats.metrics.totalTasks)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>সফল বাস্তবায়ন</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {toBengaliNumber(stats.metrics.completedTasks)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>অনুমোদন অপেক্ষমাণ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {toBengaliNumber(stats.metrics.pendingApprovals)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>ব্যর্থ / প্রত্যাখ্যাত</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-2 font-mono">
            {toBengaliNumber(stats.metrics.failedTasks)}
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Command Stream & Interactive Output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Messages Container */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm flex flex-col h-[580px]">
            {/* Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.map((msg) => {
                const isUser = msg.sender === 'USER';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-3xl ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
                        isUser
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-800 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className="space-y-3 min-w-0 flex-1">
                      {/* Message Content Bubble */}
                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-amber-600 text-white ml-auto'
                            : 'bg-stone-50 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 shadow-xs'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Interactive Task Card if message generated an AI task */}
                      {msg.task && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-4 shadow-sm">
                          {/* Task Header */}
                          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                                পরিকল্পনা: {msg.task.intent}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  msg.task.safetyMode === 'MODE_A'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                                    : msg.task.safetyMode === 'MODE_C'
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                                }`}
                              >
                                {msg.task.safetyMode}
                              </span>
                            </div>

                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                msg.task.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : msg.task.status === 'PENDING_APPROVAL'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : msg.task.status === 'ROLLED_BACK'
                                  ? 'bg-purple-500/10 text-purple-600'
                                  : 'bg-stone-500/10 text-stone-600'
                              }`}
                            >
                              {msg.task.status === 'COMPLETED'
                                ? '✓ বাস্তবায়িত'
                                : msg.task.status === 'PENDING_APPROVAL'
                                ? 'অপেক্ষমাণ অনুমোদন'
                                : msg.task.status === 'ROLLED_BACK'
                                ? 'রোলড ব্যাক'
                                : msg.task.status}
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-300">
                            {msg.task.planSummary}
                          </p>

                          {/* Steps List */}
                          {msg.task.steps && msg.task.steps.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                                এক্সিকিউশন ধাপসমূহ:
                              </span>
                              <div className="space-y-1">
                                {msg.task.steps.map((st) => (
                                  <div
                                    key={st.id}
                                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 text-[10px] flex items-center justify-center font-bold">
                                        {toBengaliNumber(st.stepOrder)}
                                      </span>
                                      <span>{st.title}</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-stone-400">
                                      {st.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Diff Preview if available */}
                          {msg.task.diffPreview && (
                            <div className="p-3 rounded-xl bg-stone-900 text-stone-100 text-[11px] font-mono overflow-x-auto space-y-1">
                              <div className="text-stone-400 border-b border-stone-800 pb-1">
                                পরিবর্তন তুলনামূলক নিরীক্ষা (Diff Preview):
                              </div>
                              <pre className="text-amber-300 text-[10px]">
                                {typeof msg.task.diffPreview === 'string'
                                  ? msg.task.diffPreview
                                  : JSON.stringify(msg.task.diffPreview, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-700">
                            {msg.task.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  disabled={actionInProgress === msg.task.id}
                                  onClick={() => handleRejectTask(msg.task!.id)}
                                  className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 transition"
                                >
                                  প্রত্যাখ্যান
                                </button>
                                <button
                                  disabled={actionInProgress === msg.task.id}
                                  onClick={() => handleExecuteTask(msg.task!.id)}
                                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                                >
                                  {actionInProgress === msg.task.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>অনুমোদন ও বাস্তবায়ন</span>
                                </button>
                              </>
                            )}

                            {msg.task.status === 'COMPLETED' && (
                              <button
                                disabled={actionInProgress === msg.task.id}
                                onClick={() => handleRollbackTask(msg.task!.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>রোলব্যাক (পূর্বাবস্থায় ফেরত)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isProcessing && (
                <div className="flex gap-3 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>কমান্ডের পরিকল্পনা তৈরি ও নিরাপত্তা নিরীক্ষা করা হচ্ছে...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
              <div className="relative flex items-center rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitCommand();
                    }
                  }}
                  placeholder="বাংলায় নির্দেশ দিন (যেমন: 'স্টক ৫ এর কম বইগুলোর তালিকা দাও', 'নতুন রমজান ব্যানার তৈরি করো')..."
                  className="flex-1 py-3 pl-4 pr-14 text-xs sm:text-sm bg-transparent focus:outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
                />
                <button
                  type="button"
                  onClick={() => handleSubmitCommand()}
                  disabled={!inputText.trim() || isProcessing}
                  className="absolute right-2 p-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white shadow-xs transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Command Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              দ্রুত প্রশাসনিক কমান্ডসমূহ:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'স্টক কম থাকা বইগুলোর রিপোর্ট দাও',
                'রমজান উপলক্ষে নতুন কুপন RAMADAN20 তৈরি করো',
                'হোমপেজের ব্যানার বিন্যাস পরিবর্তন করো',
                'গত ৩০ দিনের বিক্রয় বিশ্লেষণ দেখাও',
                'এসইও মেটা অপ্টিমাইজেশনের খসড়া তৈরি করো',
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmitCommand(cmd)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-stone-700 dark:text-stone-300 text-xs transition active:scale-95 text-left"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Connected Providers & Recent Executions */}
        <div className="space-y-6">
          {/* Recent Executed Tasks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-500" />
                <span>সাম্প্রতিক কমান্ড কার্যক্রম</span>
              </h3>
              <Link
                href="/admin/ai-studio/audit-logs"
                className="text-[11px] text-amber-600 hover:underline"
              >
                সব দেখুন
              </Link>
            </div>

            <div className="space-y-2">
              {stats.recentTasks.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">
                  কোনো কমান্ড এখনও সম্পন্ন হয়নি
                </p>
              ) : (
                stats.recentTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                        {t.intent}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{t.command}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-xs text-amber-900 dark:text-amber-200">
                এআই স্টুডিও শর্টকাটস
              </h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <Link
                href="/admin/ai-studio/chat-hub"
                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
              >
                <span>ইউনিফায়েড চ্যাট হাব</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
              <Link
                href="/admin/ai-studio/approvals"
                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
              >
                <span>অনুমোদন কেন্দ্র ({toBengaliNumber(stats.metrics.pendingApprovals)})</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
              <Link
                href="/admin/ai-studio/agents"
                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
              >
                <span>১২টি এজেন্ট রেজিস্ট্রি</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

