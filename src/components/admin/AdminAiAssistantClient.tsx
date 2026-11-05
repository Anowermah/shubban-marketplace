'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

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

interface AdminAiAssistantClientProps {
  initialConversation: {
    id: string;
    title: string;
    messages: Message[];
  };
  stats: {
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
  };
}

export default function AdminAiAssistantClient({
  initialConversation,
  stats: initialStats,
}: AdminAiAssistantClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialConversation.messages || []);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Refresh AI dashboard stats
  const refreshStats = async () => {
    try {
      const res = await fetch('/api/admin/ai/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  };

  // Quick Prompt chips
  const QUICK_PROMPTS = [
    { label: 'রমজান ক্যাম্পেইন তৈরি করো', icon: Flame, prompt: 'রমজান উপলক্ষে একটি পূর্ণাঙ্গ প্রমোশন ক্যাম্পেইন ও ব্যানার তৈরি করো।' },
    { label: 'হোমপেজ আধুনিকায়ন করো', icon: LayoutTemplate, prompt: 'আমার ওয়েবসাইটের হোমপেজ আরও আধুনিক ও আকর্ষণীয় করে সাজিয়ে দাও।' },
    { label: 'স্টক অ্যালার্ট ও ইনভেন্টরি রিপোর্ট', icon: Boxes, prompt: 'স্টক কম থাকা বইগুলোর রিপোর্ট দাও এবং ইনভেন্টরি বিশ্লেষণ করো।' },
    { label: 'এসইও মেটাডাটা অডিট', icon: Search, prompt: 'পুরো ওয়েবসাইটের বই ও কন্টেন্টের এসইও মেটাডাটা পরীক্ষা করো।' },
    { label: 'অনুপস্থিত ছবি ও ব্রোকেন লিংক', icon: AlertTriangle, prompt: 'অনুপস্থিত ছবি ও ব্রোকেন লিংকগুলো শনাক্ত করো।' },
    { label: 'গত ৩০ দিনের বিক্রয় রিপোর্ট', icon: TrendingUp, prompt: 'গত ৩০ দিনের বিক্রয় ও রাজস্ব সংক্রান্ত পারফরম্যান্স রিপোর্ট দাও।' },
    { label: 'নতুন কুপন কোড তৈরি', icon: Tag, prompt: 'গ্রাহকদের জন্য ১৫% ছাড়ের একটি নতুন প্রোমোশনাল কুপন কোড তৈরি করো।' },
  ];

  // Submit User Command
  const handleSendCommand = async (commandToSend?: string) => {
    const text = (commandToSend || inputText).trim();
    if (!text || isProcessing) return;

    setInputText('');
    setFeedback(null);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsProcessing(true);

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
        throw new Error(data.error || 'কমান্ড সম্পন্ন করতে ব্যর্থ হয়েছে');
      }

      // Add AI response message
      const aiMsg: Message = {
        id: data.messageId,
        sender: 'AI',
        content: data.responseContent,
        createdAt: new Date().toISOString(),
        task: data.task,
      };

      setMessages((prev) => [...prev, aiMsg]);
      await refreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'AI',
          content: `⚠️ ত্রুটি: ${err.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Approve and execute task
  const handleApproveTask = async (taskId: string) => {
    setActionInProgress(taskId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/ai/tasks/${taskId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'টাস্ক অনুমোদন ব্যর্থ হয়েছে');

      setFeedback({ type: 'success', text: 'টাস্ক সফলভাবে অনুমোদিত ও ওয়েবসাইটে কার্যকর করা হয়েছে!' });

      // Update task in state
      setMessages((prev) =>
        prev.map((m) => {
          if (m.task && m.task.id === taskId) {
            return {
              ...m,
              task: {
                ...m.task,
                status: 'COMPLETED',
                rollbackData: data.task.rollbackData,
              },
            };
          }
          return m;
        })
      );
      await refreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject task
  const handleRejectTask = async (taskId: string) => {
    setActionInProgress(taskId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/ai/tasks/${taskId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'অ্যাডমিন কর্তৃক বাতিল' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'টাস্ক বাতিল ব্যর্থ হয়েছে');

      setFeedback({ type: 'success', text: 'টাস্কটি বাতিল করা হয়েছে।' });

      setMessages((prev) =>
        prev.map((m) => {
          if (m.task && m.task.id === taskId) {
            return {
              ...m,
              task: {
                ...m.task,
                status: 'REJECTED',
              },
            };
          }
          return m;
        })
      );
      await refreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  // Rollback task
  const handleRollbackTask = async (taskId: string) => {
    setActionInProgress(taskId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/ai/tasks/${taskId}/rollback`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'রোলব্যাক ব্যর্থ হয়েছে');

      setFeedback({ type: 'success', text: 'সফলভাবে আগের অবস্থায় ফিরিয়ে নেওয়া হয়েছে (Rolled Back)!' });

      setMessages((prev) =>
        prev.map((m) => {
          if (m.task && m.task.id === taskId) {
            return {
              ...m,
              task: {
                ...m.task,
                status: 'ROLLED_BACK',
              },
            };
          }
          return m;
        })
      );
      await refreshStats();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-shubban-green via-emerald-950 to-shubban-green text-white p-6 rounded-2xl shadow-lg border border-shubban-gold/30">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>অটোনোমাস ওয়েবসাইট ম্যানেজমেন্ট সিস্টেম</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            শুব্বান AI কমান্ড সেন্টার
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
            স্বাভাবিক বাংলায় যে-কোনো নির্দেশনা দিন। AI পরিকল্পনা তৈরি করবে, প্রিভিউ দেখাবে এবং আপনার অনুমোদনের পর স্বয়ংক্রিয়ভাবে পুরো ওয়েবসাইট পরিচালনা করবে।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>লাইভ ওয়েবসাইট</span>
          </a>
          <button
            onClick={refreshStats}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
            title="রিফ্রেশ ড্যাশবোর্ড"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: Chat Workspace + AI Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Chat & Execution Console */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col h-[750px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-shubban-green flex items-center justify-center text-shubban-gold shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                  AI অটোনোমাস অ্যাসিস্ট্যান্ট
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  সক্রিয় • ৩-টিয়ার সেফটি গার্ডরেইল প্রযোজ্য
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-mono border border-stone-200 dark:border-stone-700">
                Mode A, B, C
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => {
              const isUser = msg.sender === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                      isUser
                        ? 'bg-stone-800 text-stone-100'
                        : 'bg-shubban-green text-shubban-gold'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-3">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        isUser
                          ? 'bg-shubban-green text-white rounded-tr-none'
                          : 'bg-stone-100 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 rounded-tl-none border border-stone-200 dark:border-stone-700/60'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Mode B / Mode C Visual Diff Preview Card */}
                    {msg.task && msg.task.status === 'PENDING_APPROVAL' && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-3 shadow-md">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4" />
                            <span>
                              {msg.task.safetyMode === 'MODE_C'
                                ? 'উচ্চ ঝুঁকি: অ্যাডমিন নিশ্চিতকরণ প্রয়োজন'
                                : 'প্রিভিউ ও সম্মতি প্রয়োজন (Mode B)'}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                            #{msg.task.id.slice(-6)}
                          </span>
                        </div>

                        {/* Plan Summary */}
                        <div className="p-3 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-200 space-y-1">
                          <span className="font-bold block text-stone-900 dark:text-stone-100">
                            পরিকল্পিত কার্যক্রম:
                          </span>
                          <p>{msg.task.planSummary}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleApproveTask(msg.task!.id)}
                            disabled={actionInProgress === msg.task.id}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-[1.02]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {actionInProgress === msg.task.id
                                ? 'কার্যকর হচ্ছে...'
                                : 'অনুমোদন ও কার্যকর করুন (Approve)'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleRejectTask(msg.task!.id)}
                            disabled={actionInProgress === msg.task.id}
                            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs transition-colors"
                          >
                            বাতিল করুন
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Task Completed with Rollback Action */}
                    {msg.task && msg.task.status === 'COMPLETED' && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ডাটাবেসে সংরক্ষিত ও ওয়েবসাইটে প্রকাশিত</span>
                        </div>

                        {msg.task.rollbackData && (
                          <button
                            onClick={() => handleRollbackTask(msg.task!.id)}
                            disabled={actionInProgress === msg.task.id}
                            className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-stone-700 dark:text-stone-300 hover:text-amber-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>রোলব্যাক (Undo)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Task Rolled Back Badge */}
                    {msg.task && msg.task.status === 'ROLLED_BACK' && (
                      <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-stone-500 text-xs flex items-center gap-2 border border-stone-200 dark:border-stone-700">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>এই পরিবর্তনের রোলব্যাক সম্পন্ন হয়েছে (পূর্বাবস্থায় প্রত্যাবর্তিত)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing / Processing Indicator */}
            {isProcessing && (
              <div className="flex gap-3 mr-auto max-w-[80%] items-center">
                <div className="w-8 h-8 rounded-xl bg-shubban-green flex items-center justify-center text-shubban-gold shadow-sm animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 rounded-tl-none border border-stone-200 dark:border-stone-700 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-shubban-gold animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-shubban-gold animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-shubban-gold animate-bounce [animation-delay:0.4s]"></span>
                  <span>AI কমান্ড বিশ্লেষণ ও পরিকল্পনা তৈরি করছে...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900/80 border-t border-stone-200 dark:border-stone-800 overflow-x-auto flex gap-2 text-xs scrollbar-none">
            {QUICK_PROMPTS.map((q, idx) => {
              const Icon = q.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendCommand(q.prompt)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-shubban-gold hover:text-shubban-gold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs disabled:opacity-50"
                >
                  <Icon className="w-3 h-3 text-shubban-gold" />
                  <span>{q.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Box Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCommand();
            }}
            className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="বাংলা বা ইংরেজিতে নির্দেশ দিন (যেমন: 'রমজান ক্যাম্পেইন তৈরি করো', 'হোমপেজ সাজাও')..."
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold transition-all"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 disabled:opacity-40 text-shubban-gold font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition-transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">প্রেরণ</span>
            </button>
          </form>
        </div>

        {/* Right: AI Dashboard Metrics & System Health */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                মোট AI টাস্ক
              </span>
              <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                {stats.metrics.totalTasks}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                সম্পন্ন টাস্ক
              </span>
              <span className="text-2xl font-serif font-bold text-emerald-600">
                {stats.metrics.completedTasks}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block mb-1">
                অনুমোদন অপেক্ষমাণ
              </span>
              <span className="text-2xl font-serif font-bold text-amber-500">
                {stats.metrics.pendingApprovals}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                ব্যবহৃত টোকেন
              </span>
              <span className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                {stats.metrics.totalTokens.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* AI Engines & Providers */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-shubban-gold" />
                <span>সক্রিয় AI ইঞ্জিনসমূহ</span>
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                হাইব্রিড ইঞ্জিন
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {stats.providers.map((p) => (
                <div
                  key={p.providerKey}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      মডেল: {p.modelName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                    }`}
                  >
                    {p.isEnabled ? 'সক্রিয়' : 'বন্ধ'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Modes Legend */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5 border-b border-stone-200 dark:border-stone-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-shubban-gold" />
              <span>নিরাপত্তা ও এক্সিকিউশন মোড</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                  Mode A — অটো এক্সিকিউট (Auto Execute)
                </span>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  রিপোর্ট তৈরি, ইনভেন্টরি বিশ্লেষণ ও এসইও অডিট তাৎক্ষণিকভাবে সম্পন্ন হয়।
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                  Mode B — প্রিভিউ ও অনুমোদন (Preview & Approve)
                </span>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  হোমপেজ পরিবর্তন, ব্যানার ও কুপন তৈরির পূর্বে প্রিভিউ দেখিয়ে অনুমোদন নেওয়া হয়।
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="font-bold text-rose-700 dark:text-rose-300 block mb-0.5">
                  Mode C — নিশ্চিতকরণ আবশ্যক (Confirmation Required)
                </span>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  অর্থ, রিফান্ড বা স্থায়ীভাবে ডেটা পরিবর্তনের ক্ষেত্রে অ্যাডমিনের স্পষ্ট সম্মতি বাধ্যতামূলক।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

