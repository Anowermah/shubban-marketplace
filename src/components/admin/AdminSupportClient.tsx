'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Send,
  Trash2,
  Plus,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  ShoppingBag,
} from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface TicketResponse {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  message: string;
  orderId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  responses: TicketResponse[];
}

interface AdminSupportClientProps {
  initialTickets: SupportTicket[];
}

export default function AdminSupportClient({ initialTickets }: AdminSupportClientProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0].id : null
  );

  // Reply state
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<string | null>(null);

  // New ticket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newMessage, setNewMessage] = useState('');
  const [newOrderId, setNewOrderId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.user.name.toLowerCase().includes(search.toLowerCase()) ||
      t.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.orderId && t.orderId.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(tickets.map((t) => (t.id === ticketId ? data.ticket : t)));
        showBanner('টিকেটের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriorityVal: string) => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriorityVal }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(tickets.map((t) => (t.id === ticketId ? data.ticket : t)));
        showBanner('টিকেটের গুরুত্ব লেভেল আপডেট হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (ticketId: string, autoResolve = false) => {
    const text = replyText[ticketId]?.trim();
    if (!text) return;

    setIsSubmittingReply(ticketId);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyMessage: text,
          status: autoResolve ? 'RESOLVED' : 'IN_PROGRESS',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(tickets.map((t) => (t.id === ticketId ? data.ticket : t)));
        setReplyText({ ...replyText, [ticketId]: '' });
        showBanner(autoResolve ? 'উত্তর পাঠানো হয়েছে এবং টিকিট সমাধান হিসেবে চিহ্নিত হয়েছে!' : 'উত্তর সফলভাবে পাঠানো হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReply(null);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই সাপোর্ট টিকিটটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets(tickets.filter((t) => t.id !== ticketId));
        if (expandedId === ticketId) setExpandedId(null);
        showBanner('টিকিট সফলভাবে মুছে ফেলা হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: newPriority,
          message: newMessage.trim(),
          orderId: newOrderId.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets([data.ticket, ...tickets]);
        setExpandedId(data.ticket.id);
        setShowCreateModal(false);
        setNewSubject('');
        setNewMessage('');
        setNewOrderId('');
        showBanner('নতুন সাপোর্ট টিকিট সফলভাবে নথিভুক্ত হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">জরুরি (URGENT)</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">উচ্চ (HIGH)</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">সাধারণ (MEDIUM)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">নিম্ন (LOW)</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">উন্মুক্ত (OPEN)</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">প্রক্রিয়াধীন</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">সমাধানকৃত</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400">বন্ধ (CLOSED)</span>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'ORDER': return 'অর্ডার সংক্রান্ত';
      case 'PAYMENT': return 'পেমেন্ট ও রিফান্ড';
      case 'RETURN': return 'বই রিটার্ন / রিপ্লেসমেন্ট';
      case 'BOOK_INQUIRY': return 'বই বা সংস্করণ জিজ্ঞাসা';
      case 'TECHNICAL': return 'ওয়েবসাইট বা একাউন্ট সমস্যা';
      default: return 'সাধারণ জিজ্ঞাসা';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Feedback */}
      {feedback && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">মোট সাপোর্ট টিকিট</p>
            <p className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-0.5">
              {toBengaliNumber(totalCount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-shubban-gold/15 text-shubban-gold flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 font-medium">উন্মুক্ত / অপেক্ষমাণ</p>
            <p className="text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-400 mt-0.5">
              {toBengaliNumber(openCount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-medium">প্রক্রিয়াধীন টিকিট</p>
            <p className="text-2xl font-bold font-serif text-blue-700 dark:text-blue-400 mt-0.5">
              {toBengaliNumber(inProgressCount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-600 font-medium">সমাধানকৃত</p>
            <p className="text-2xl font-bold font-serif text-purple-700 dark:text-purple-400 mt-0.5">
              {toBengaliNumber(resolvedCount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="টিকিট নম্বর, গ্রাহক, বিষয় বা অর্ডার দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="OPEN">উন্মুক্ত (OPEN)</option>
            <option value="IN_PROGRESS">প্রক্রিয়াধীন (IN_PROGRESS)</option>
            <option value="RESOLVED">সমাধানকৃত (RESOLVED)</option>
            <option value="CLOSED">বন্ধ (CLOSED)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          >
            <option value="ALL">সকল প্রায়োরিটি</option>
            <option value="URGENT">জরুরি (URGENT)</option>
            <option value="HIGH">উচ্চ (HIGH)</option>
            <option value="MEDIUM">সাধারণ (MEDIUM)</option>
            <option value="LOW">নিম্ন (LOW)</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন টিকিট খুলুন</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <LifeBuoy className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
              কোনো সাপোর্ট টিকিট পাওয়া যায়নি
            </p>
            <p className="text-xs text-stone-400 mt-1">
              আপনার ফিল্টারিং শর্ত পরিবর্তন করুন অথবা নতুন টিকিট তৈরি করুন।
            </p>
          </div>
        ) : (
          paginatedTickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/50 dark:hover:bg-stone-800/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                      <LifeBuoy className="w-4 h-4 text-shubban-gold" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-shubban-gold">
                          #{ticket.ticketNumber}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <span className="text-[11px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                          {getCategoryLabel(ticket.category)}
                        </span>
                        {ticket.orderId && (
                          <span className="text-[11px] text-shubban-green font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span>#{ticket.orderId}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 mt-1">
                        {ticket.subject}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                        <span>গ্রাহক: <strong>{ticket.user.name}</strong> ({ticket.user.email})</span>
                        <span>•</span>
                        <span>{formatBengaliDate(ticket.createdAt)}</span>
                        {ticket.responses.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-shubban-gold font-medium">
                              {toBengaliNumber(ticket.responses.length)}টি উত্তর
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTicket(ticket.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="টিকিট মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Discussion Thread */}
                {isExpanded && (
                  <div className="border-t border-stone-200 dark:border-stone-800 p-4 sm:p-6 bg-stone-50/50 dark:bg-stone-900/40 space-y-5">
                    {/* Status & Priority Control Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-500 font-medium">স্ট্যাটাস পরিবর্তন:</span>
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold text-xs"
                          >
                            <option value="OPEN">উন্মুক্ত (OPEN)</option>
                            <option value="IN_PROGRESS">প্রক্রিয়াধীন (IN_PROGRESS)</option>
                            <option value="RESOLVED">সমাধানকৃত (RESOLVED)</option>
                            <option value="CLOSED">বন্ধ (CLOSED)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-500 font-medium">গুরুত্ব:</span>
                          <select
                            value={ticket.priority}
                            onChange={(e) => handlePriorityChange(ticket.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold text-xs"
                          >
                            <option value="LOW">নিম্ন (LOW)</option>
                            <option value="MEDIUM">সাধারণ (MEDIUM)</option>
                            <option value="HIGH">উচ্চ (HIGH)</option>
                            <option value="URGENT">জরুরি (URGENT)</option>
                          </select>
                        </div>
                      </div>

                      {ticket.orderId && (
                        <a
                          href={`/order-confirmation?orderNumber=${ticket.orderId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-shubban-gold hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>অর্ডার বিবরণ দেখুন (#{ticket.orderId})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Original Inquiry Message */}
                    <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-stone-800 dark:text-stone-200">
                            {ticket.user.name} (গ্রাহক)
                          </span>
                        </div>
                        <span>{formatBengaliDate(ticket.createdAt)}</span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                        {ticket.message}
                      </p>
                    </div>

                    {/* Responses Thread */}
                    {ticket.responses.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-stone-200 dark:border-stone-800">
                        {ticket.responses.map((resp) => (
                          <div
                            key={resp.id}
                            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                              resp.isAdmin
                                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 ml-4'
                                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] text-stone-500">
                              <span className="font-bold text-stone-800 dark:text-stone-200">
                                {resp.isAdmin ? '🛡️ শুব্বান সাপোর্ট টিম' : resp.user.name}
                              </span>
                              <span>{formatBengaliDate(resp.createdAt)}</span>
                            </div>
                            <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                              {resp.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Box */}
                    <div className="space-y-2 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                      <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                        সাপোর্ট টিমের আনুষ্ঠানিক উত্তর লিখুন:
                      </label>
                      <textarea
                        rows={3}
                        value={replyText[ticket.id] || ''}
                        onChange={(e) =>
                          setReplyText({ ...replyText, [ticket.id]: e.target.value })
                        }
                        placeholder="গ্রাহকের জিজ্ঞাসার বিস্তারিত উত্তর দিন এবং সমাধানের দিকনির্দেশনা প্রদান করুন..."
                        className="w-full p-3 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold resize-none"
                      />
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSubmittingReply === ticket.id || !replyText[ticket.id]?.trim()}
                          onClick={() => handleSendReply(ticket.id, false)}
                          className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>উত্তর পাঠান</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSubmittingReply === ticket.id || !replyText[ticket.id]?.trim()}
                          onClick={() => handleSendReply(ticket.id, true)}
                          className="px-3.5 py-1.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>উত্তর দিন ও সমাধান সম্পন্ন করুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTickets.length}
        itemsPerPage={pageSize}
        itemName="টিকেট"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
      />

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-shubban-gold" />
                <span>নতুন সাপোর্ট টিকিট নথিভুক্তকরণ</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">টিকিট বিষয় *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="যেমন: বইয়ের স্টক ডেলিভারি সমস্যা"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">বিভাগ</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    <option value="GENERAL">সাধারণ জিজ্ঞাসা</option>
                    <option value="ORDER">অর্ডার সংক্রান্ত</option>
                    <option value="PAYMENT">পেমেন্ট ও রিফান্ড</option>
                    <option value="RETURN">বই রিপ্লেসমেন্ট</option>
                    <option value="BOOK_INQUIRY">বই ও প্রকাশনী</option>
                    <option value="TECHNICAL">প্রযুক্তিগত সমস্যা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">গুরুত্ব লেভেল</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    <option value="LOW">নিম্ন (LOW)</option>
                    <option value="MEDIUM">সাধারণ (MEDIUM)</option>
                    <option value="HIGH">উচ্চ (HIGH)</option>
                    <option value="URGENT">জরুরি (URGENT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">সম্পর্কিত অর্ডার নম্বর (যদি থাকে)</label>
                <input
                  type="text"
                  value={newOrderId}
                  onChange={(e) => setNewOrderId(e.target.value)}
                  placeholder="যেমন: ORD-20261028-1001"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">বিস্তারিত বার্তা / সমস্যার বিবরণ *</label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="সমস্যার বিস্তারিত বর্ণনা লিখুন..."
                  className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreating ? 'তৈরি হচ্ছে...' : 'টিকিট খুলুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

