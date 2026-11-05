'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  User,
  FileText,
  Newspaper,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationFeedbackClientProps {
  initialComments: any[];
}

export default function AdminPublicationFeedbackClient({
  initialComments,
}: AdminPublicationFeedbackClientProps) {
  const [comments, setComments] = useState<any[]>(initialComments);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const q = search.toLowerCase();
      const content = c.content.toLowerCase();
      const userName = (c.user?.name || '').toLowerCase();
      const pubTitle = (c.article?.title || c.issue?.title || '').toLowerCase();
      const matchesSearch = content.includes(q) || userName.includes(q) || pubTitle.includes(q);

      let matchesStatus = true;
      if (filterStatus === 'APPROVED') matchesStatus = Boolean(c.isApproved);
      if (filterStatus === 'PENDING') matchesStatus = !c.isApproved;

      return matchesSearch && matchesStatus;
    });
  }, [comments, search, filterStatus]);

  const totalPages = Math.ceil(filteredComments.length / pageSize) || 1;
  const paginatedComments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredComments.slice(start, start + pageSize);
  }, [filteredComments, currentPage, pageSize]);

  const handleToggleStatus = async (comment: any, isApproved: boolean) => {
    try {
      setLoadingId(comment.id);
      const res = await fetch('/api/publications/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comment.id, isApproved }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(
          comments.map((c) =>
            c.id === comment.id ? { ...c, isApproved } : c
          )
        );
        setSuccessMsg(isApproved ? 'মন্তব্য অনুমোদন করা হয়েছে' : 'অনুমোদন প্রত্যাহার করা হয়েছে');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই মন্তব্যটি মুছে ফেলতে চান?')) return;
    try {
      setLoadingId(id);
      const res = await fetch(`/api/publications/feedback?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.filter((c) => c.id !== id));
        setSuccessMsg('মন্তব্য মুছে ফেলা হয়েছে');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>পাঠক মতামত ও কমেন্ট মডারেশন</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            পত্রিকা ও প্রবন্ধ সমূহে পাঠকদের পাঠানো মতামত অনুমোদন ও পরিচালনা
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="মন্তব্য বা প্রকাশনার নাম খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          {[
            { id: 'ALL', label: 'সকল মন্তব্য' },
            { id: 'PENDING', label: 'অপেক্ষমাণ (Pending)' },
            { id: 'APPROVED', label: 'অনুমোদিত (Approved)' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setFilterStatus(st.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterStatus === st.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {paginatedComments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
            কোনো মন্তব্য পাওয়া যায়নি
          </div>
        ) : (
          paginatedComments.map((comment) => (
            <div
              key={comment.id}
              className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-4 transition hover:border-amber-400/40"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{comment.user?.name || 'পাঠক'}</span>
                  </div>

                  <span className="text-stone-300 dark:text-stone-700">•</span>

                  <span className="text-stone-400 text-[11px]">
                    {formatBengaliDate(comment.createdAt)}
                  </span>

                  <span className="text-stone-300 dark:text-stone-700">•</span>

                  {comment.isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>অনুমোদিত</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>অপেক্ষমাণ</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
                  {comment.content}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone-500">
                  {comment.article ? (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <FileText className="w-3 h-3" />
                      <span>প্রবন্ধ: {comment.article.title}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                {comment.isApproved ? (
                  <button
                    onClick={() => handleToggleStatus(comment, false)}
                    disabled={loadingId === comment.id}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <XCircle className="w-3.5 h-3.5 text-stone-400" />
                    <span>বাতিল করুন</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(comment, true)}
                    disabled={loadingId === comment.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>অনুমোদন দিন</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={loadingId === comment.id}
                  className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Unified Pagination */}
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredComments.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="টি মন্তব্য"
          />
        </div>
      </div>
    </div>
  );
}
