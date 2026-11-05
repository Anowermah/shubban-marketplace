'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Search,
  Plus,
  Trash2,
  Pin,
  CheckCircle2,
  BookOpen,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sliders,
  Layers,
  FileText,
  ExternalLink,
  MessageSquare,
  X,
  Share2,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import type { AiAgentDto } from '@/lib/ai/ai-studio-service';

interface ConversationItem {
  id: string;
  title: string;
  agentKey?: string;
  mode?: string;
  isPinned: boolean;
  isIslamicAi?: boolean;
  lastMessage?: string | null;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  agentKey?: string;
  content: string;
  evidenceStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE';
  citations?: any[];
  task?: any;
  createdAt: string;
}

interface AiStudioChatHubClientProps {
  initialAgents: AiAgentDto[];
  initialConversations: ConversationItem[];
}

export default function AiStudioChatHubClient({
  initialAgents,
  initialConversations,
}: AiStudioChatHubClientProps) {
  const [agents] = useState<AiAgentDto[]>(initialAgents);
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Modes & Selected Agent
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>(
    initialAgents[0]?.key || 'general-ai'
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchConv, setSearchConv] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'AI_STUDIO' | 'ISLAMIC_AI'>('ALL');

  // Copy & Audio States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Expanded citations
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Load active conversation messages
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/admin/ai-studio/chat?conversationId=${activeConversationId}`);
        const data = await res.json();
        if (data.success && data.conversation) {
          setMessages(data.conversation.messages || []);
          if (data.conversation.mode) {
            setMode(data.conversation.mode as 'AUTO' | 'MANUAL');
          }
          if (data.conversation.agentKey) {
            setSelectedAgentKey(data.conversation.agentKey);
          }
        }
      } catch (err) {
        console.error('Error fetching conversation:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversationId]);

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'bn-BD';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থন করে না।');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Text to Speech
  const toggleSpeech = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
    utterance.lang = 'bn-BD';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || sending) return;

    const currentText = textToSend.trim();
    setInputText('');
    setSending(true);

    // Optimistic user message
    const tempUserMsg: MessageItem = {
      id: `temp_u_${Date.now()}`,
      sender: 'USER',
      content: currentText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/admin/ai-studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId || undefined,
          message: currentText,
          mode,
          agentKey: selectedAgentKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!activeConversationId) {
          setActiveConversationId(data.conversationId);
          // Refresh conversations
          fetchConversations();
        }

        const newAssistantMsg: MessageItem = {
          id: data.assistantMessageId,
          sender: 'ASSISTANT',
          agentKey: data.routedAgent.key,
          content: data.content,
          evidenceStatus: data.evidenceStatus,
          citations: data.citations || [],
          task: data.task,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), {
          ...tempUserMsg,
          id: data.userMessageId,
        }, newAssistantMsg]);
      } else {
        alert(data.error || 'বার্তা পাঠাতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Send error:', err);
      alert('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি');
    } finally {
      setSending(false);
    }
  };

  // Fetch updated conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/admin/ai-studio/conversations?source=${sourceFilter}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Fetch conv error:', err);
    }
  };

  // Create New Chat
  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
  };

  // Delete Conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('আপনি কি নিশ্চিত যে এই কথোপকথনটি মুছে ফেলতে চান?')) return;

    try {
      await fetch(`/api/admin/ai-studio/conversations?id=${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Delete conv error:', err);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/admin/ai-studio/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'TOGGLE_PIN' }),
      });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
        );
      }
    } catch (err) {
      console.error('Pin conv error:', err);
    }
  };

  const activeAgent = agents.find((a) => a.key === selectedAgentKey) || agents[0];

  const filteredConversations = conversations.filter((c) => {
    if (searchConv && !c.title.toLowerCase().includes(searchConv.toLowerCase())) {
      return false;
    }
    if (sourceFilter === 'ISLAMIC_AI' && !c.isIslamicAi) return false;
    if (sourceFilter === 'AI_STUDIO' && c.isIslamicAi) return false;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm font-bengali">
      {/* 1. Left Sidebar: Conversation History Drawer */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0 -translate-x-full'
        } transition-all duration-300 ease-in-out border-r border-stone-200 dark:border-stone-800 flex flex-col bg-stone-50/70 dark:bg-stone-950/60 overflow-hidden flex-shrink-0`}
      >
        {/* Drawer Header */}
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
          <button
            onClick={handleStartNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কথোপকথন</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition"
            title="সাইডবার সংকুচিত করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Filter Tabs */}
        <div className="p-2 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setSourceFilter('ALL')}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition text-center ${
              sourceFilter === 'ALL'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            সব ({toBengaliNumber(conversations.length)})
          </button>
          <button
            onClick={() => setSourceFilter('AI_STUDIO')}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition text-center ${
              sourceFilter === 'AI_STUDIO'
                ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            স্টুডিও
          </button>
          <button
            onClick={() => setSourceFilter('ISLAMIC_AI')}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition text-center ${
              sourceFilter === 'ISLAMIC_AI'
                ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            ইসলামিক
          </button>
        </div>

        {/* Search input */}
        <div className="p-2 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
              placeholder="কথোপকথন খুঁজুন..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-400">
              কোনো কথোপকথন পাওয়া যায়নি
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group relative p-2.5 rounded-xl cursor-pointer transition border text-xs flex flex-col gap-1 ${
                    isActive
                      ? 'bg-white dark:bg-stone-800/90 border-amber-500/40 shadow-xs text-stone-900 dark:text-stone-100'
                      : 'hover:bg-stone-200/50 dark:hover:bg-stone-800/50 border-transparent text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-semibold truncate flex-1 flex items-center gap-1.5">
                      {conv.isPinned && <Pin className="w-3 h-3 text-amber-500 rotate-45 flex-shrink-0" />}
                      <span className="truncate">{conv.title}</span>
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      {!conv.isIslamicAi && (
                        <button
                          onClick={(e) => handleTogglePin(conv.id, e)}
                          className="p-1 hover:text-amber-600 rounded"
                          title={conv.isPinned ? 'আনপিন করুন' : 'পিন করুন'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 hover:text-rose-600 rounded"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {conv.lastMessage && (
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate line-clamp-1">
                      {conv.lastMessage}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-stone-400 mt-0.5">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono ${
                        conv.isIslamicAi
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {conv.isIslamicAi ? 'ইসলামিক আরএজি' : conv.agentKey || 'সেন্ট্রাল এআই'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-stone-900 min-w-0">
        {/* Top Chat Toolbar */}
        <div className="h-16 border-b border-stone-200 dark:border-stone-800 px-4 flex items-center justify-between gap-3 flex-shrink-0 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition"
                title="কথোপকথন তালিকা খুলুন"
              >
                <Layers className="w-4 h-4" />
              </button>
            )}

            {/* Mode Switcher Badge */}
            <div className="flex items-center bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMode('AUTO')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                  mode === 'AUTO'
                    ? 'bg-white dark:bg-stone-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
                title="সিস্টেম স্বয়ংক্রিয়ভাবে প্রশ্নের বিষয় অনুযায়ী সবচেয়ে উপযুক্ত এজেন্ট নির্বাচন করবে"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>স্বয়ংক্রিয় মোড</span>
              </button>
              <button
                onClick={() => setMode('MANUAL')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                  mode === 'MANUAL'
                    ? 'bg-white dark:bg-stone-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
                title="আপনি নিজে ১২টি এজেন্টের মধ্যে যেকোনো একটি নির্দিষ্ট করতে পারবেন"
              >
                <Sliders className="w-3.5 h-3.5 text-stone-500" />
                <span>ম্যানুয়াল মোড</span>
              </button>
            </div>

            {/* Agent Selector (Disabled in Auto mode or shown as default) */}
            <div className="relative">
              <select
                value={selectedAgentKey}
                disabled={mode === 'AUTO'}
                onChange={(e) => setSelectedAgentKey(e.target.value)}
                className={`text-xs font-medium py-1.5 pl-3 pr-8 rounded-xl border appearance-none transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  mode === 'AUTO'
                    ? 'bg-stone-100 dark:bg-stone-800/40 text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed'
                    : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border-stone-300 dark:border-stone-700 cursor-pointer shadow-xs'
                }`}
              >
                {agents.map((ag) => (
                  <option key={ag.key} value={ag.key}>
                    {ag.name} ({ag.department})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/ai-studio/command-center"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs text-stone-600 dark:text-stone-300 hover:text-amber-600 transition"
              title="সরাসরি কমান্ড সেন্টারে যান"
            >
              <Bot className="w-3.5 h-3.5 text-amber-600" />
              <span>কমান্ড সেন্টার</span>
            </Link>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full text-stone-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" />
              কথোপকথন লোড হচ্ছে...
            </div>
          ) : messages.length === 0 ? (
            /* Welcome / Zero State */
            <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
                <Sparkles className="w-7 h-7 text-amber-200" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                  শুব্বান সেন্ট্রাল এআই চ্যাট হাব
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  কুরআন, সহীহ হাদিস, প্রকাশনা, মার্কেটপ্লেস বা ওয়েবসাইটের যেকোনো প্রশাসনিক বিষয়ে প্রশ্ন করুন। অটো-মোডে সিস্টেম স্বয়ংক্রিয়ভাবে উপযুক্ত বিশেষজ্ঞ এজেন্টের কাছে পাঠাবে।
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-4 text-left">
                {[
                  {
                    title: 'দ্বীনি ও ফিকহী প্রশ্ন',
                    prompt: 'নামাযের ওয়াক্তসমূহের কুরআন ও সহীহ হাদিসের দলীল কী?',
                    agent: 'ইসলামিক এআই',
                  },
                  {
                    title: 'মার্কেটপ্লেস ইনভেন্টরি',
                    prompt: 'বর্তমান ক্যাটালগে স্বল্প স্টকের বইগুলোর অবস্থা কী?',
                    agent: 'মার্কেটপ্লেস এআই',
                  },
                  {
                    title: 'প্রকাশনা ও সম্পাদকীয়',
                    prompt: 'আসন্ন মাসিক সংখ্যার সম্পাদকীয় রূপরেখা তৈরি করুন।',
                    agent: 'ম্যাগাজিন এআই',
                  },
                  {
                    title: 'এসইও অপ্টিমাইজেশন',
                    prompt: 'ইসলামিক তাফসীর গ্রন্থের জন্য এসইও মেটাডাটা প্রস্তাব করুন।',
                    agent: 'এসইও এআই',
                  },
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sample.prompt)}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-xs transition text-left group"
                  >
                    <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                      <span>{sample.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-stone-500 text-[11px] mt-1 line-clamp-1">{sample.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Stream of Messages */
            messages.map((msg) => {
              const isUser = msg.sender === 'USER';
              const agentMeta = agents.find((a) => a.key === msg.agentKey) || activeAgent;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
                      isUser
                        ? 'bg-amber-600 text-white'
                        : 'bg-gradient-to-tr from-emerald-800 to-emerald-950 text-emerald-200 border border-emerald-700/40'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble & Content */}
                  <div
                    className={`flex flex-col gap-1.5 min-w-0 ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Header info for assistant */}
                    {!isUser && (
                      <div className="flex items-center gap-2 text-[11px] text-stone-400">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {agentMeta.name}
                        </span>
                        <span>•</span>
                        <span>{agentMeta.department}</span>
                        {msg.evidenceStatus && msg.evidenceStatus !== 'NOT_APPLICABLE' && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                              msg.evidenceStatus === 'VERIFIED'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {msg.evidenceStatus === 'VERIFIED' ? '✓ যাচাইকৃত রেফারেন্স' : 'আংশিক তথ্যসূত্র'}
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-amber-600 text-white rounded-tr-xs'
                          : 'bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-100 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.content}

                      {/* Associated Task Card if any */}
                      {msg.task && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs">
                          <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-200">
                            <span>অটোনোমাস টাস্ক: {msg.task.intent}</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-[10px]">
                              {msg.task.safetyMode}
                            </span>
                          </div>
                          <p className="mt-1 text-stone-600 dark:text-stone-400 text-[11px]">
                            {msg.task.planSummary}
                          </p>
                          <div className="mt-2 flex items-center justify-end">
                            <Link
                              href="/admin/ai-studio/command-center"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                            >
                              কমান্ড সেন্টারে দেখুন <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Grounded Citations Drawer / Accordion */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700/80">
                          <button
                            onClick={() =>
                              setExpandedCitations((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>যাচাইকৃত তথ্যসূত্র ({toBengaliNumber(msg.citations.length)} টি)</span>
                            {expandedCitations[msg.id] ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {expandedCitations[msg.id] && (
                            <div className="mt-2 space-y-2">
                              {msg.citations.map((cite: any, cIdx: number) => (
                                <div
                                  key={cIdx}
                                  className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-500/30 text-xs space-y-1 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                      {cite.title || cite.sourceBook}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px]">
                                      {cite.sourceType}
                                    </span>
                                  </div>
                                  {cite.arabicText && (
                                    <p
                                      dir="rtl"
                                      className="font-serif text-sm leading-loose text-stone-900 dark:text-stone-100 pt-1 border-t border-stone-100 dark:border-stone-800"
                                    >
                                      {cite.arabicText}
                                    </p>
                                  )}
                                  {cite.translation && (
                                    <p className="text-stone-600 dark:text-stone-400 text-[11px] italic">
                                      {cite.translation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions toolbar */}
                    <div className="flex items-center gap-1 text-stone-400 text-xs px-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 hover:text-stone-700 dark:hover:text-stone-200 rounded transition"
                        title="কপি করুন"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleSpeech(msg.id, msg.content)}
                        className={`p-1 rounded transition ${
                          speakingId === msg.id
                            ? 'text-amber-600 animate-pulse'
                            : 'hover:text-stone-700 dark:hover:text-stone-200'
                        }`}
                        title={speakingId === msg.id ? 'ভয়েস বন্ধ করুন' : 'উচ্চস্বরে শুনুন'}
                      >
                        {speakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Sending Indicator */}
          {sending && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-950 text-emerald-200 flex items-center justify-center flex-shrink-0 animate-pulse shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>এজেন্ট তথ্য বিশ্লেষণ ও উত্তর প্রস্তুত করছে...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer Area */}
        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            <div className="relative flex items-center rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  mode === 'AUTO'
                    ? 'কুরআন, হাদিস, প্রকাশনা বা অ্যাডমিন বিষয়ে যে কোনো প্রশ্ন লিখুন...'
                    : `${activeAgent.name}-এর নিকট প্রশ্ন লিখুন...`
                }
                className="flex-1 py-3 pl-4 pr-24 text-xs sm:text-sm bg-transparent resize-none focus:outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400 max-h-32 min-h-[44px]"
              />

              <div className="absolute right-2 flex items-center gap-1">
                {/* Voice Input Mic */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl transition ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                  title={isRecording ? 'রেকর্ডিং বন্ধ করুন' : 'মুখে বলুন (Voice Input)'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || sending}
                  className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white shadow-xs transition active:scale-95"
                  title="বার্তা পাঠান"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
              <span>
                মোড: <strong className="text-stone-600 dark:text-stone-300">{mode === 'AUTO' ? 'স্মার্ট অটো রাউটিং' : activeAgent.name}</strong>
              </span>
              <span>Enter চাপুন পাঠাতে • Shift+Enter নতুন লাইনের জন্য</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

