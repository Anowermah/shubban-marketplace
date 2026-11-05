'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Check,
  MailCheck,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AdminNotificationsClientProps {
  initialNotifications: NotificationItem[];
}

export default function AdminNotificationsClient({
  initialNotifications,
}: AdminNotificationsClientProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/notifications', { method: 'PATCH' });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setFeedback({ type: 'success', message: 'সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!confirm('আপনি কি নিশ্চিত যে সকল নোটিফিকেশন মুছে ফেলতে চান?')) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/notifications?clearAll=true', { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotifications([]);
        setFeedback({ type: 'success', message: data.message || 'সকল নোটিফিকেশন মুছে ফেলা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setFeedback({ type: 'success', message: 'নোটিফিকেশন মুছে ফেলা হয়েছে!' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-shubban-gold" />
            <span>সিস্টেম নোটিফিকেশন ও পাঠক বার্তা (Notifications)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট <strong className="text-stone-900 dark:text-stone-100 font-bold">{toBengaliNumber(notifications.length)}</strong>টি নোটিফিকেশন (অপঠিত: <span className="text-amber-600 font-bold">{toBengaliNumber(unreadCount)}</span>টি)।
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <MailCheck className="w-3.5 h-3.5" />
              <span>সবগুলো পঠিত মার্ক করুন</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-2xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>সকল নোটিফিকেশন ক্লিয়ার করুন</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-xs text-stone-400">
            কোনো নোটিফিকেশন নেই। সমস্ত বার্তা ক্লিয়ার করা হয়েছে।
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-colors flex items-start justify-between gap-3.5 ${
                  notif.isRead
                    ? 'bg-stone-50/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800'
                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.isRead
                        ? 'bg-stone-200/60 dark:bg-stone-800 text-stone-500'
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="অপঠিত" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-stone-400 block mt-1.5 font-mono">
                      {formatBengaliDate(notif.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSingle(notif.id)}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900 text-stone-400 hover:text-rose-600 transition-colors shrink-0"
                  title="নোটিফিকেশন মুছুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

