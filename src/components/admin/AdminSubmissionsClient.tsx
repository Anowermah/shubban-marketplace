'use client';

import React, { useState } from 'react';
import {
  Feather,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  MessageSquare,
} from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export interface SubmissionItem {
  id: string;
  type: string;
  title: string;
  category: string;
  description: string;
  fileUrl?: string | null;
  status: string;
  reviewNotes?: string | null;
  createdAt: Date | string;
  authorName: string;
  authorEmail: string;
}

export default function AdminSubmissionsClient({
  initialSubmissions,
}: {
  initialSubmissions: SubmissionItem[];
}) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals state
  const [deleteSub, setDeleteSub] = useState<SubmissionItem | null>(null);
  const [editNotesSub, setEditNotesSub] = useState<SubmissionItem | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusUpdate = async (id: string, status: string, notes?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(notes !== undefined ? { reviewNotes: notes } : {}),
        }),
      });

      if (res.ok) {
        setSubmissions(
          submissions.map((s) =>
            s.id === id ? { ...s, status, ...(notes !== undefined ? { reviewNotes: notes } : {}) } : s
          )
        );
        setFeedback(`পাণ্ডুলিপির স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে (${status})।`);
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNotesSub) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/submissions/${editNotesSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: notesText }),
      });

      if (res.ok) {
        setSubmissions(
          submissions.map((s) => (s.id === editNotesSub.id ? { ...s, reviewNotes: notesText } : s))
        );
        setEditNotesSub(null);
        setFeedback('সম্পাদকীয় মন্তব্য সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!deleteSub) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/submissions/${deleteSub.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSubmissions(submissions.filter((s) => s.id !== deleteSub.id));
        setDeleteSub(null);
        setFeedback('পাণ্ডুলিপি সফলভাবে মুছে ফেলা হয়েছে!');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-bengali">
      {feedback && (
        <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
          পর্যালোচনার জন্য কোনো পাণ্ডুলিপি জমা নেই।
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="p-6 bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-shubban-gold uppercase">{s.type}</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500">{s.category}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 mt-1">
                    {s.title}
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    লেখক: {s.authorName} ({s.authorEmail}) • {formatBengaliDate(s.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      s.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : s.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {s.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => setDeleteSub(s)}
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                    title="পাণ্ডুলিপি মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line bg-stone-50 dark:bg-stone-900/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
                {s.description}
              </p>

              {s.reviewNotes && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  <strong className="block mb-0.5 text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                    সম্পাদকীয় মূল্যায়ন নোট:
                  </strong>
                  <span>{s.reviewNotes}</span>
                </div>
              )}

              {s.fileUrl && (
                <div className="text-xs">
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-shubban-gold hover:underline font-bold"
                  >
                    <span>দাখিলকৃত ফাইল / পাণ্ডুলিপি দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800">
                <span className="text-xs text-stone-500">সম্পাদকীয় সিদ্ধান্ত ও পদক্ষেপ:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditNotesSub(s);
                      setNotesText(s.reviewNotes || '');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                    <span>মন্তব্য যোগ/সংশোধন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(s.id, 'APPROVED')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    অনুমোদন করুন (Approve)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(s.id, 'REVISION_REQUESTED')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                  >
                    সংশোধন অনুরোধ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(s.id, 'REJECTED')}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                  >
                    অননুমোদিত
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Review Notes Modal */}
      {editNotesSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  সম্পাদকীয় মূল্যায়ন মন্তব্য
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditNotesSub(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 font-bold block mb-1 uppercase">পাণ্ডুলিপি:</span>
                <p className="font-serif font-bold text-stone-900 dark:text-stone-100">{editNotesSub.title}</p>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  লেখকের জন্য সম্পাদকীয় নোট ও নির্দেশনা:
                </label>
                <textarea
                  rows={4}
                  required
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="পাণ্ডুলিপি বিষয়ে সম্পাদকীয় মতামত বা সংশোধন নির্দেশনা লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditNotesSub(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>মন্তব্য সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Submission Modal */}
      {deleteSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                পাণ্ডুলিপি মুছে ফেলতে চান?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="font-bold text-stone-900 dark:text-stone-100">"{deleteSub.title}"</strong> পাণ্ডুলিপিটি স্থায়ীভাবে মুছে ফেলতে চান?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteSub(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmission}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>হ্যাঁ, পাণ্ডুলিপি মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
