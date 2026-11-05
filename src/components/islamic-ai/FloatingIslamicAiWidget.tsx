'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  MessageCircle,
  MessageSquare,
  X,
  Maximize2,
  Send,
  Loader2,
  BookOpen,
  ShieldCheck,
  Mic,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Phone,
  UserCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface MiniMessage {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  evidenceStatus?: string;
  citations?: Array<{
    sourceType: string;
    referenceId: string;
    title: string;
    arabicText?: string;
    translation: string;
    grading?: string;
    sourceBook: string;
  }>;
}

interface HotlinePayload {
  enabled: boolean;
  config: {
    hotlineEnabled: boolean;
    whatsappEnabled: boolean;
    primaryHotlinePhone: string;
    defaultWhatsappNumber: string;
    whatsappDefaultMessage: string;
    noticeBannerText: string;
  };
  onDutyShaykhs: Array<{
    id: string;
    name: string;
    title: string;
    specialization: string;
    institution: string;
    phone?: string;
    whatsappNumber: string;
    avatarUrl?: string;
    dutySchedule: string;
    isOnDuty: boolean;
    status: string;
    bio?: string;
  }>;
  primaryShaykh: any | null;
}

export default function FloatingIslamicAiWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<MiniMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);
  const [guestSessionId, setGuestSessionId] = useState<string>('');
  const [hotline, setHotline] = useState<HotlinePayload | null>(null);
  const [showShaykhCard, setShowShaykhCard] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Do not show floating widget on the full /islamic-ai page or admin pages
  const isHiddenRoute = pathname?.startsWith('/islamic-ai') || pathname?.startsWith('/admin');

  // Initialize guest session ID and fetch Hotline info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('shubban_islamic_guest_id');
      if (!sid) {
        sid = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        localStorage.setItem('shubban_islamic_guest_id', sid);
      }
      setGuestSessionId(sid);

      // Welcome message if messages empty
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome',
            sender: 'AI',
            content:
              'আসসালামু আলাইকুম! আমি শুব্বান লাইব্রেরীর ভেরিফায়েড ইসলামিক এআই সহকারী। কুরআন, বিশুদ্ধ হাদিস ও তাফসিরের আলোকে আপনার যেকোনো প্রশ্ন করতে পারেন। জরুরি ও ব্যক্তিগত ফতোয়ার জন্য আমাদের দায়িত্বরত শাইখের সাথে সরাসরি WhatsApp ও হটলাইনেও যোগাযোগ করতে পারবেন।',
            evidenceStatus: 'VERIFIED',
          },
        ]);
      }
    }

    // Load Live Hotline & On-Duty Shaykh info
    async function loadHotline() {
      try {
        const res = await fetch('/api/islamic-ai/hotline');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setHotline(data);
          }
        }
      } catch { }
    }

    loadHotline();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showShaykhCard]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: MiniMessage = {
      id: `user_${Date.now()}`,
      sender: 'USER',
      content: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/islamic-ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          sessionId: guestSessionId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const aiMsg: MiniMessage = {
          id: data.data.messageId || `ai_${Date.now()}`,
          sender: 'AI',
          content: data.data.summaryAnswer,
          evidenceStatus: data.data.evidenceStatus,
          citations: data.data.citations,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'AI',
            content: data.error || 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে। দয়া করে আবার চেষ্টা করুন।',
            evidenceStatus: 'INSUFFICIENT_EVIDENCE',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'AI',
          content: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।',
          evidenceStatus: 'INSUFFICIENT_EVIDENCE',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isHiddenRoute) return null;

  const primaryShaykh = hotline?.primaryShaykh || hotline?.onDutyShaykhs?.[0];
  const activeWhatsappNumber = primaryShaykh?.whatsappNumber || hotline?.config.defaultWhatsappNumber || '8801711000000';
  const whatsappBaseMessage = hotline?.config.whatsappDefaultMessage || 'আসসালামু আলাইকুম। শুব্বান লাইব্রেরী থেকে ইসলামিক পরামর্শ চাই।';

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 font-bengali">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          suppressHydrationWarning
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-full shadow-2xl hover:shadow-emerald-900/50 border border-amber-400/50 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="ইসলামিক এআই সহকারী ও শাইখ হটলাইন"
        >
          <span className="relative inline-flex items-center">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </span>
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            ইসলামিক এআই
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 border border-emerald-500/40 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>লাইভ শাইখ</span>
          </span>
        </button>
      )}

      {/* Mini Interactive Chat & Hotline Modal */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-emerald-700/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 px-4 py-3 border-b border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>ইসলামিক এআই</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </h3>
                <p className="text-[10px] text-emerald-200/80">কুরআন, সহীহ হাদিস ও লাইভ শাইখ হটলাইন</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/islamic-ai"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-lg transition-colors"
                title="পূর্ণাঙ্গ পেজে যান"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-lg transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* On-Duty Shaykh WhatsApp Consultation Strip */}
          {hotline?.enabled && primaryShaykh && (
            <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex-shrink-0">
                  <img
                    src={primaryShaykh.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&q=80'}
                    alt={primaryShaykh.name}
                    className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-emerald-950" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-white truncate block">
                    {primaryShaykh.name}
                  </span>
                  <span className="text-[9px] text-emerald-300 block truncate">
                    {primaryShaykh.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Direct WhatsApp Callout Button */}
                <a
                  href={`https://wa.me/${activeWhatsappNumber}?text=${encodeURIComponent(
                    whatsappBaseMessage + (inputQuery ? `\n\nআমার প্রশ্ন: ${inputQuery}` : '')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition-all"
                  title="শাইখের সাথে সরাসরি WhatsApp এ কথা বলুন"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </a>

                {/* View Details Toggle Button */}
                <button
                  onClick={() => setShowShaykhCard(!showShaykhCard)}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold text-amber-300 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors"
                >
                  {showShaykhCard ? 'চ্যাট' : 'শাইখ তথ্য'}
                </button>
              </div>
            </div>
          )}

          {/* Collapsible On-Duty Shaykh Profile Card */}
          {showShaykhCard && primaryShaykh && (
            <div className="p-4 bg-emerald-950/95 border-b border-emerald-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-3">
                <img
                  src={primaryShaykh.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80'}
                  alt={primaryShaykh.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/60 shadow"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-serif font-bold text-sm text-white truncate">
                      {primaryShaykh.name}
                    </h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-amber-300 font-semibold">{primaryShaykh.title}</p>
                  <p className="text-[11px] text-emerald-200/80">{primaryShaykh.institution}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-800/60 space-y-1 text-[11px] text-emerald-100/90">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">বিশেষজ্ঞতা: {primaryShaykh.specialization}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">ডিউটি সময়: {primaryShaykh.dutySchedule}</span>
                </div>
              </div>

              {primaryShaykh.bio && (
                <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed">
                  {primaryShaykh.bio}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://wa.me/${activeWhatsappNumber}?text=${encodeURIComponent(
                    whatsappBaseMessage + (inputQuery ? `\n\nআমার প্রশ্ন: ${inputQuery}` : '')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp এ সরাসরি প্রশ্ন করুন</span>
                </a>

                {primaryShaykh.phone && (
                  <a
                    href={`tel:${primaryShaykh.phone}`}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center gap-1 border border-stone-700"
                    title="হটলাইনে কল করুন"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>কল</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Quick Questions Pills */}
          <div className="bg-stone-950/80 px-3 py-1.5 border-b border-stone-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => handleSend('নামাজের ওয়াক্ত ও সহীহ পদ্ধতি কি?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] border border-stone-700 transition-colors"
            >
              নামাজের শর্ত
            </button>
            <button
              onClick={() => handleSend('যাকাত কার ওপর ফরজ এবং প্রদানের সঠিক নিয়ম কি?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] border border-stone-700 transition-colors"
            >
              যাকাতের নিয়ম
            </button>
            <button
              onClick={() => handleSend('লেনদেনের ক্ষেত্রে সুদের হুকুম কি?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] border border-stone-700 transition-colors"
            >
              লেনদেনে সুদ
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.sender === 'USER'
                    ? 'bg-shubban-green text-shubban-ivory rounded-br-none shadow-sm'
                    : 'bg-stone-850 text-stone-200 border border-stone-750 rounded-bl-none'
                    }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {/* Citations block */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-750 text-[11px] space-y-1.5">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>প্রামাণ্য হাদিস ও তাফসির সনদ:</span>
                      </div>
                      {msg.citations.map((c, i) => (
                        <div key={i} className="bg-stone-900/80 p-2 rounded-lg border border-stone-700/60">
                          <span className="font-bold text-amber-300 block">{c.title}</span>
                          <span className="text-[10px] text-stone-400 block">{c.sourceBook}</span>
                          {c.arabicText && (
                            <p className="font-arabic text-right text-stone-300 my-1 leading-relaxed">
                              {c.arabicText}
                            </p>
                          )}
                          <p className="text-stone-300 text-[10px]">{c.translation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Direct Shaykh WhatsApp Escalation Button on AI Answers */}
                  {msg.sender === 'AI' && msg.id !== 'welcome' && primaryShaykh && (
                    <div className="mt-2.5 pt-2 border-t border-stone-750 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400">ব্যক্তিগত ফতোয়া দরকার?</span>
                      <a
                        href={`https://wa.me/${activeWhatsappNumber}?text=${encodeURIComponent(
                          `আসসালামু আলাইকুম শাইখ, শুব্বান লাইব্রেরী এআই সহকারী থেকে একটি বিষয়ে আপনার পরামর্শ চাই:\n\nবিষয়: ${msg.content.slice(0, 120)}...`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/90 px-2 py-0.5 rounded-md border border-emerald-700/60 transition"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-400" />
                        <span>শাইখকে WhatsApp করুন &rarr;</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Message Utility Actions */}
                {msg.sender === 'AI' && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="text-[10px] text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors"
                      title="উত্তর কপি করুন"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>কপি</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-stone-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span className="text-xs">প্রামাণ্য হাদিস ও কুরআন থেকে উত্তর প্রস্তুত হচ্ছে...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="আপনার ইসলামিক প্রশ্ন লিখুন..."
              disabled={loading}
              className="flex-1 bg-stone-850 text-white text-xs rounded-xl px-3.5 py-2.5 border border-stone-700 focus:outline-none focus:border-amber-400/60 placeholder:text-stone-500"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 bg-shubban-gold hover:bg-shubban-gold-hover text-emerald-950 font-bold rounded-xl disabled:opacity-40 transition-transform active:scale-95 flex items-center justify-center shadow"
              aria-label="পাঠান"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
