'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, BookOpen, ShoppingBag, MessageSquare, Info, ExternalLink } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  type: string;
  createdAt: string | Date;
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isUpdating, setIsUpdating] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'COMMENT':
      case 'QNA':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'SUBSCRIPTION':
        return <BookOpen className="w-4 h-4 text-shubban-gold" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-shubban-gold" />
            <span>বিজ্ঞপ্তি ও সাহিত্য বার্তা</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-stone-900">
                {toBengaliNumber(unreadCount)} টি নতুন
              </span>
            )}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            আপনার অর্ডার, সাময়িকীর নতুন সংখ্যা ও অ্যাকাউন্টের জরুরি আপডেট।
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:border-shubban-gold transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>সব পঠিত হিসেবে চিহ্নিত করুন</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-xs text-stone-400">
          কোনো নতুন বিজ্ঞপ্তি নেই।
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkOneRead(n.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                n.isRead
                  ? 'bg-white dark:bg-shubban-darkCard border-stone-200 dark:border-stone-800 opacity-80'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 shadow-sm'
              } flex items-start gap-3.5`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  n.isRead
                    ? 'bg-stone-100 dark:bg-stone-800'
                    : 'bg-amber-100 dark:bg-amber-900/40'
                }`}
              >
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-xs sm:text-sm ${
                        n.isRead
                          ? 'font-semibold text-stone-800 dark:text-stone-200'
                          : 'font-bold text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0">
                    {formatBengaliDate(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {n.link && (
                  <Link
                    href={n.link}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-semibold text-shubban-gold hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    <span>বিস্তারিত দেখুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

