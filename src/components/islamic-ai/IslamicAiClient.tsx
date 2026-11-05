'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Share2,
  ExternalLink,
  BookMarked,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Info,
  Compass,
  ArrowRight,
  RefreshCw,
  Scale,
  History,
  X,
  User,
  Search,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import type { GroundedIslamicResponse } from '@/lib/islamic-ai/types';

interface MessageItem {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  response?: GroundedIslamicResponse;
  createdAt: string;
}

export default function IslamicAiClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const initialMode = searchParams.get('mode') === 'RESEARCH' ? 'RESEARCH' : 'STANDARD';

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'AI',
      content:
        'আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহু। আমি শুব্বান অ্যাডভান্সড ইসলামিক এআই নলেজ অ্যাসিস্ট্যান্ট।\n\nআপনি পবিত্র কুরআন, সহিহ হাদিস, নির্ভরযোগ্য তাফসির ও ফিকহি মাসআলা সম্পর্কে বাংলা, ইংরেজি বা আরবিতে যেকোনো প্রশ্ন করতে পারেন। প্রতিটি উত্তর প্রামাণ্য দলিল ও নির্ভরযোগ্য রেফারেন্সের সাথে পরিবেশন করা হবে।',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'STANDARD' | 'RESEARCH'>(initialMode);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, 'up' | 'down'>>({});
  const [activeCitationTab, setActiveCitationTab] = useState<Record<string, 'quran' | 'hadith' | 'scholarly' | 'books'>>({});
  const [guestSessionId, setGuestSessionId] = useState<string>('');
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [hotline, setHotline] = useState<any>(null);

  // Load Hotline & On-Duty Shaykh info
  useEffect(() => {
    fetch('/api/islamic-ai/hotline')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHotline(d);
      })
      .catch(() => {});
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Guest Session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('shubban_islamic_guest_id');
      if (!sid) {
        sid = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        localStorage.setItem('shubban_islamic_guest_id', sid);
      }
      setGuestSessionId(sid);
    }
  }, []);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If query passed in URL params, auto-execute once guestId is ready
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && guestSessionId) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery, guestSessionId]);

  // Suggested quick questions
  const SUGGESTIONS = [
    'নামাজের গুরুত্ব ও কুরআন-হাদিসের দলিল কী?',
    'রমজানের রোজার ফজিলত ও সহিহ হাদিস',
    'তারাবীহর নামাজ কত রাকাত? চার মাযহাবের মতামত কী?',
    'ফিতরা কি নগদ টাকায় দেওয়া যাবে?',
    'আয়াতুল কুরসীর মর্যাদা ও ফজিলত ব্যাখ্যা করো',
    'দ্বীনি ইলম অন্বেষণ করার গুরুত্ব সম্পর্কে হাদিস',
    'কাজের নিয়ত সংক্রান্ত বুখারীর প্রথম হাদিসটি বলো',
  ];

  // Fetch conversation history
  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/islamic-ai/conversations?sessionId=${guestSessionId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.conversations || []);
      }
    } catch {}
  };

  const openHistoryDrawer = () => {
    setHistoryOpen(true);
    loadHistory();
  };

  const loadPastConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/islamic-ai/conversations?id=${convId}&sessionId=${guestSessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation?.messages) {
          const formatted: MessageItem[] = data.conversation.messages.map((m: any) => ({
            id: m.id,
            sender: m.sender as 'USER' | 'AI',
            content: m.content,
            createdAt: m.createdAt,
          }));
          setMessages(formatted);
          setCurrentConversationId(convId);
          setHistoryOpen(false);
        }
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  // Send Question
  const handleSend = async (questionText?: string) => {
    const text = (questionText || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    const userMsg: MessageItem = {
      id: `usr_${Date.now()}`,
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/islamic-ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          mode,
          sessionId: guestSessionId,
          conversationId: currentConversationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'উত্তর পেতে সমস্যা হয়েছে');

      if (data.quotaRemaining !== undefined) {
        setQuotaRemaining(data.quotaRemaining);
      }
      if (data.conversationId) {
        setCurrentConversationId(data.conversationId);
      }

      const aiMsg: MessageItem = {
        id: data.messageId,
        sender: 'AI',
        content: data.summaryAnswer,
        response: data,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'AI',
          content: `দুঃখিত: ${err.message || 'সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Speech Recognition
  const toggleVoiceInput = () => {
    if (!speechSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text to Speech
  const speakArabicOrBengali = (text: string, lang = 'bn-BD') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy to clipboard
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Share Answer
  const shareAnswer = async (msg: MessageItem) => {
    const textToShare = `${msg.content}\n\n— শুব্বান ইসলামিক এআই\nhttps://atrbd.com/islamic-ai`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'শুব্বান ইসলামিক এআই উত্তর',
          text: textToShare,
          url: window.location.href,
        });
      } catch {}
    } else {
      copyText(textToShare, `share_${msg.id}`);
    }
  };

  // Submit Feedback
  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      await fetch('/api/islamic-ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, isHelpful }),
      });
      setFeedbackSent((prev) => ({
        ...prev,
        [messageId]: isHelpful ? 'up' : 'down',
      }));
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-bengali">
      {/* Sub Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Link
            href="/islamic-ai"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 text-white shadow flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>এআই সহকারী</span>
          </Link>
          <Link
            href="/islamic-ai/quran"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>কুরআন অনুসন্ধান</span>
          </Link>
          <Link
            href="/islamic-ai/hadith"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Search className="w-4 h-4 text-amber-500" />
            <span>হাদিস অনুসন্ধান</span>
          </Link>
          <Link
            href="/islamic-ai/research"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Scale className="w-4 h-4 text-purple-500" />
            <span>মাযহাব গবেষণা</span>
          </Link>
        </div>

        <button
          onClick={openHistoryDrawer}
          className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
          title="কথোপকথন ইতিহাস দেখুন"
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">ইতিহাস</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-shubban-green to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-shubban-gold/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>১০০% প্রামাণ্য কুরআন ও সহিহ হাদিস ভিত্তিক</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              শুব্বান অ্যাডভান্সড ইসলামিক এআই
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              পবিত্র কুরআন, সিহাহ সিত্তাহ হাদিস ও নির্ভরযোগ্য তাফসিরের সমন্বয়ে গঠিত রিয়েল-টাইম ভেরিফায়েড নলেজ ইঞ্জিন। কোনো মিথ্যা বা যাচাইবিহীন উত্তর পরিবেশন করা হয় না।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3">
            {/* Mode Selector */}
            <div className="bg-emerald-900/80 p-1 rounded-xl border border-emerald-700/60 flex items-center gap-1 text-xs font-medium">
              <button
                onClick={() => setMode('STANDARD')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mode === 'STANDARD'
                    ? 'bg-shubban-gold text-emerald-950 font-bold shadow'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                সাধারণ প্রশ্নোত্তর
              </button>
              <button
                onClick={() => setMode('RESEARCH')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mode === 'RESEARCH'
                    ? 'bg-shubban-gold text-emerald-950 font-bold shadow'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                ৪ মাযহাব গবেষণা
              </button>
            </div>

            {/* Quota Indicator */}
            {quotaRemaining !== null && (
              <span className="text-[11px] text-amber-300 font-semibold bg-black/30 px-3 py-1 rounded-full border border-amber-400/30">
                আজকের অবশিষ্ট প্রশ্ন: {toBengaliNumber(quotaRemaining)} টি
              </span>
            )}
          </div>
        </div>
      </div>

      {/* History Slide-out Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 h-full p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>কথোপকথন ইতিহাস</span>
                </h3>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-2 overflow-y-auto max-h-[75vh]">
                {historyList.length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-8">
                    পূর্বে কোনো কথোপকথন পাওয়া যায়নি।
                  </p>
                ) : (
                  historyList.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadPastConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-colors space-y-1 ${
                        currentConversationId === conv.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500'
                      }`}
                    >
                      <p className="font-bold line-clamp-1">{conv.title}</p>
                      <p className="text-[10px] text-stone-400">
                        {toBengaliNumber(conv._count?.messages || 0)} টি বার্তা
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    sender: 'AI',
                    content: 'আসসালামু আলাইকুম! নতুন বিষয়ে আপনার ইসলামিক প্রশ্ন লিখুন।',
                    createdAt: new Date().toISOString(),
                  },
                ]);
                setCurrentConversationId(null);
                setHistoryOpen(false);
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              + নতুন প্রশ্ন শুরু করুন
            </button>
          </div>
        </div>
      )}

      {/* Live Shaykh & Fatwa Hotline Banner */}
      {hotline?.enabled && hotline.primaryShaykh && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 border border-emerald-700/60 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={hotline.primaryShaykh.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80'}
                alt={hotline.primaryShaykh.name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-stone-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  আজকের দায়িত্বরত শাইখ
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>লাইভ ফতোয়া হটলাইন</span>
                </span>
              </div>
              <h4 className="font-serif font-bold text-base text-white mt-0.5 flex items-center gap-1.5">
                <span>{hotline.primaryShaykh.name}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h4>
              <p className="text-xs text-stone-300">
                {hotline.primaryShaykh.title} • {hotline.primaryShaykh.institution} ({hotline.primaryShaykh.dutySchedule})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={`https://wa.me/${hotline.primaryShaykh.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                hotline.config.whatsappDefaultMessage + (inputText ? `\n\nআমার প্রশ্ন: ${inputText}` : '')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp এ সরাসরি ফতোয়া পরামর্শ</span>
            </a>

            {hotline.primaryShaykh.phone && (
              <a
                href={`tel:${hotline.primaryShaykh.phone}`}
                className="px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-stone-700 transition-colors"
                title="হটলাইনে কল করুন"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>হটলাইন কল</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Stream Container */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col h-[700px] max-h-[82vh]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            const data = msg.response;

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  isUser ? 'ml-auto flex-row-reverse max-w-[85%]' : 'mr-auto max-w-[92%]'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-emerald-800 text-white'
                      : 'bg-shubban-green text-shubban-gold'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble Body */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs leading-relaxed text-xs sm:text-sm ${
                    isUser
                      ? 'bg-emerald-700 text-white rounded-tr-none'
                      : 'bg-stone-50 dark:bg-stone-800/80 text-stone-800 dark:text-stone-100 rounded-tl-none border border-stone-200/80 dark:border-stone-700/60'
                  }`}
                >
                  {/* Evidence Status Badge for AI */}
                  {!isUser && data && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60 dark:border-stone-700/60 text-xs">
                      <div className="flex items-center gap-2">
                        {data.evidenceStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-300 dark:border-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>প্রামাণ্য সনদে নিশ্চিত (VERIFIED)</span>
                          </span>
                        ) : data.evidenceStatus === 'PARTIALLY_VERIFIED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-700">
                            <Info className="w-3.5 h-3.5" />
                            <span>আংশিক দলিলের আলোকে প্রস্তুত</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[11px] border border-rose-300 dark:border-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>অপর্যাপ্ত সনদ সতর্কতা</span>
                          </span>
                        )}

                        <span className="text-[11px] text-stone-400">
                          {data.citations?.length || 0} টি প্রামাণ্য দলিল
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-stone-400">
                        <button
                          onClick={() => copyText(msg.content, msg.id)}
                          className="p-1 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                          title="উত্তর কপি করুন"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => shareAnswer(msg)}
                          className="p-1 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                          title="শেয়ার করুন"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => speakArabicOrBengali(msg.content, 'bn-BD')}
                          className="p-1 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                          title="শুনুন"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Summary Text Content */}
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {/* RAG Retrieved Evidence Grounding Cards */}
                  {!isUser && data && (
                    <div className="space-y-4 pt-2">
                      {/* Evidence Navigation Tabs */}
                      <div className="flex items-center gap-1.5 border-b border-stone-200 dark:border-stone-700 pb-1 text-xs">
                        {data.quranEvidence && (
                          <button
                            onClick={() =>
                              setActiveCitationTab((prev) => ({ ...prev, [msg.id]: 'quran' }))
                            }
                            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                              (activeCitationTab[msg.id] || 'quran') === 'quran'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>কুরআনিক দলিল</span>
                          </button>
                        )}

                        {data.hadithEvidence && (
                          <button
                            onClick={() =>
                              setActiveCitationTab((prev) => ({ ...prev, [msg.id]: 'hadith' }))
                            }
                            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                              activeCitationTab[msg.id] === 'hadith'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>সহীহ হাদিস</span>
                          </button>
                        )}

                        {data.scholarlyContext && (
                          <button
                            onClick={() =>
                              setActiveCitationTab((prev) => ({ ...prev, [msg.id]: 'scholarly' }))
                            }
                            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                              activeCitationTab[msg.id] === 'scholarly'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                            }`}
                          >
                            <Scale className="w-3.5 h-3.5 text-purple-600" />
                            <span>৪ মাযহাবের দৃষ্টিভঙ্গি</span>
                          </button>
                        )}

                        {data.recommendedBooks && data.recommendedBooks.length > 0 && (
                          <button
                            onClick={() =>
                              setActiveCitationTab((prev) => ({ ...prev, [msg.id]: 'books' }))
                            }
                            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                              activeCitationTab[msg.id] === 'books'
                                ? 'bg-shubban-green/10 text-shubban-green dark:text-shubban-gold'
                                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                            }`}
                          >
                            <BookMarked className="w-3.5 h-3.5 text-shubban-gold" />
                            <span>প্রস্তাবিত কিতাব ({data.recommendedBooks.length})</span>
                          </button>
                        )}
                      </div>

                      {/* 1. Quran Proof Card */}
                      {data.quranEvidence && (activeCitationTab[msg.id] || 'quran') === 'quran' && (
                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <span>
                              সূরা {data.quranEvidence.surahNameBn} ({data.quranEvidence.surahNameAr}) — আয়াত {toBengaliNumber(data.quranEvidence.ayahNumber)}
                            </span>
                            <button
                              onClick={() => speakArabicOrBengali(data.quranEvidence!.arabicText, 'ar-SA')}
                              className="p-1 hover:text-amber-500 transition-colors"
                              title="আরবী তেলাওয়াত শুনুন"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div
                            dir="rtl"
                            className="font-serif text-xl sm:text-2xl leading-loose text-emerald-950 dark:text-emerald-100 text-right py-1"
                          >
                            {data.quranEvidence.arabicText}
                          </div>

                          <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">অনুবাদ: </span>
                            {data.quranEvidence.translationBn}
                          </p>

                          {data.quranEvidence.tafsirExcerpt && (
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-400/20 text-xs text-stone-600 dark:text-stone-400 space-y-1">
                              <span className="font-bold text-amber-700 dark:text-amber-400 block">
                                {data.quranEvidence.tafsirSource || 'তাফসীর ইবনে কাসীর'}:
                              </span>
                              <p className="leading-relaxed">{data.quranEvidence.tafsirExcerpt}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Hadith Proof Card */}
                      {data.hadithEvidence && activeCitationTab[msg.id] === 'hadith' && (
                        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                            <span>
                              {data.hadithEvidence.collectionNameBn} — হাদিস নং {toBengaliNumber(data.hadithEvidence.hadithNumber)}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              মান: {data.hadithEvidence.authenticity}
                            </span>
                          </div>

                          <div
                            dir="rtl"
                            className="font-serif text-lg sm:text-xl leading-loose text-stone-900 dark:text-amber-100 text-right py-1"
                          >
                            {data.hadithEvidence.arabicText}
                          </div>

                          <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm">
                            <span className="font-bold text-amber-700 dark:text-amber-400">হাদিসের অর্থ: </span>
                            {data.hadithEvidence.translationBn}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-amber-200/50 dark:border-amber-800/50">
                            <span>সনদ তাহকীক: {data.hadithEvidence.gradingAuthority}</span>
                            {data.hadithEvidence.narrator && <span>রাবী: {data.hadithEvidence.narrator}</span>}
                          </div>
                        </div>
                      )}

                      {/* 3. Four Madhhab Perspectives Card */}
                      {data.scholarlyContext && activeCitationTab[msg.id] === 'scholarly' && (
                        <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 space-y-4">
                          <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-purple-600" />
                            <span>{data.scholarlyContext.topic} — চার মাযহাবের সিদ্ধান্ত</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-900">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                                হানাফী মাযহাব:
                              </span>
                              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                                {data.scholarlyContext.hanafi || 'তথ্য নেই'}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-900">
                              <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                                মালিকী মাযহাব:
                              </span>
                              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                                {data.scholarlyContext.maliki || 'তথ্য নেই'}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-blue-200 dark:border-blue-900">
                              <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">
                                শাফেয়ী মাযহাব:
                              </span>
                              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                                {data.scholarlyContext.shafii || 'তথ্য নেই'}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-900">
                              <span className="font-bold text-purple-700 dark:text-purple-400 block mb-1">
                                হাম্বলী মাযহাব:
                              </span>
                              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                                {data.scholarlyContext.hanbali || 'তথ্য নেই'}
                              </p>
                            </div>
                          </div>

                          {data.scholarlyContext.consensusNotes && (
                            <p className="text-xs text-stone-600 dark:text-stone-400 pt-1">
                              <span className="font-bold">ইজমা ও পর্যালোচনা: </span>
                              {data.scholarlyContext.consensusNotes}
                            </p>
                          )}

                          {data.scholarlyContext.classicalSources && (
                            <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200 dark:border-stone-700">
                              গ্রন্থসূত্র: {data.scholarlyContext.classicalSources}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 4. Shubban Marketplace Books Card */}
                      {data.recommendedBooks && activeCitationTab[msg.id] === 'books' && (
                        <div className="space-y-2">
                          <p className="text-xs text-stone-500">
                            এই বিষয়ের উপর শুব্বান লাইব্রেরীর প্রামাণ্য গ্রন্থাবলী:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.recommendedBooks.map((book) => (
                              <Link
                                key={book.id}
                                href={`/books/${book.slug}`}
                                className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-shubban-gold flex items-center gap-3 transition-colors group"
                              >
                                <img
                                  src={book.coverImage}
                                  alt={book.title}
                                  className="w-12 h-16 object-cover rounded shadow-xs flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <h5 className="font-bold text-stone-900 dark:text-white group-hover:text-shubban-gold text-xs truncate">
                                    {book.title}
                                  </h5>
                                  <p className="text-[11px] text-stone-500 truncate">{book.authorName}</p>
                                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                                    ৳ {toBengaliNumber(book.discountPrice || book.price)}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback & Disclaimer */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 dark:border-stone-800 text-stone-400">
                        <span className="text-[10px] text-stone-400 max-w-lg leading-relaxed">
                          {data?.disclaimer}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFeedback(msg.id, true)}
                            disabled={!!feedbackSent[msg.id]}
                            className={`p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                              feedbackSent[msg.id] === 'up' ? 'text-emerald-600 font-bold' : ''
                            }`}
                            title="উত্তরটি তথ্যবহুল"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, false)}
                            disabled={!!feedbackSent[msg.id]}
                            className={`p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                              feedbackSent[msg.id] === 'down' ? 'text-rose-600 font-bold' : ''
                            }`}
                            title="ত্রুটিপূর্ণ বা অসম্পূর্ণ"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Direct Shaykh WhatsApp Consultation Box on AI Message */}
                      {hotline?.enabled && hotline.primaryShaykh && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-stone-700 dark:text-stone-300">
                              ব্যক্তিগত জরুরি মাসআলা বা সরাসরি মুফতী সাহেবের দিকনির্দেশনা চান?
                            </span>
                          </div>
                          <a
                            href={`https://wa.me/${hotline.primaryShaykh.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `আসসালামু আলাইকুম শাইখ, শুব্বান লাইব্রেরী এআই সহকারী থেকে একটি বিষয়ে পরামর্শ চাই:\n\nপ্রশ্ন/বিষয়: ${msg.content.slice(0, 120)}...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-transform hover:scale-105 whitespace-nowrap self-start sm:self-auto"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>শাইখকে WhatsApp করুন &rarr;</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking RAG Indicator */}
          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-[85%] items-center">
              <div className="w-9 h-9 rounded-2xl bg-shubban-green flex items-center justify-center text-shubban-gold shadow-sm animate-pulse">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 rounded-tl-none border border-stone-200 dark:border-stone-700 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                <span>কুরআন ও বিশুদ্ধ হাদিসের প্রামাণ্য ডাটাবেসে অনুসন্ধান চলছে...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Pills */}
        <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900/80 border-t border-stone-200 dark:border-stone-800 overflow-x-auto flex gap-2 text-xs scrollbar-none">
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-shubban-gold hover:text-shubban-gold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs disabled:opacity-50"
            >
              <Compass className="w-3 h-3 text-shubban-gold" />
              <span>{item}</span>
            </button>
          ))}
        </div>

        {/* Bottom Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2"
        >
          {speechSupported && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse border-red-600'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border-stone-300 dark:border-stone-700'
              }`}
              title={isListening ? 'কথা বলা থামান' : 'মুখে বলুন (ভয়েস ইনপুট)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ইসলামিক যেকোনো বিষয়ে প্রশ্ন করুন (যেমন: 'নামাজের ফজিলত', 'রমজানের রোজা', 'ফিতরা সংক্রান্ত হাদিস')..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-shubban-gold transition-all"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 disabled:opacity-40 text-shubban-gold font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition-transform hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">জানতে চান</span>
          </button>
        </form>
      </div>
    </div>
  );
}
