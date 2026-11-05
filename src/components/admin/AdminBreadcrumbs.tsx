'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  admin: 'ড্যাশবোর্ড',
  'ads-manager': 'বিজ্ঞাপন নেটওয়ার্ক',
  'ai-assistant': 'AI কমান্ড সেন্টার',
  articles: 'প্রবন্ধ ও নিবন্ধ',
  attributes: 'প্রোডাক্ট অ্যাট্রিবিউটস',
  'audit-logs': 'অডিট লগ ও নিরাপত্তা',
  authors: 'লেখক পরিচিতি',
  banners: 'হিরো ব্যানার',
  books: 'বই সম্ভার',
  categories: 'ক্যাটাগরি ও উপ-বিভাগ',
  commissions: 'মার্কেটপ্লেস কমিশন',
  coupons: 'কুপন ও ডিসকাউন্ট',
  couriers: 'কুরিয়ার ও ট্র্যাকিং',
  customers: 'গ্রাহক ও সদস্যবৃন্দ',
  donations: 'দান ও সদকাহ ফান্ড',
  homepage: 'হোমপেজ সিএমএস',
  inventory: 'ইনভেন্টরি ও স্টক',
  'islamic-ai': 'ইসলামিক এআই নলেজ',
  notifications: 'বিজ্ঞপ্তি ও অ্যালার্ট',
  orders: 'অর্ডার ও ডেলিভারি',
  payments: 'পেমেন্ট ও ট্রানজেকশন',
  payouts: 'বিক্রেতা পে-আউট',
  products: 'পণ্য ব্যবস্থাপনা',
  promotions: 'প্রমোশন ও অফার',
  publications: 'সাময়িকী ও আর্কাইভ',
  publishers: 'প্রকাশনী সংস্থা',
  refunds: 'রিফান্ড ও রিটার্ন',
  reports: 'আর্থিক ও বিক্রয় রিপোর্ট',
  analytics: 'অ্যানালিটিক্স',
  appearance: 'থিম ও অ্যাপিয়ারেন্স',
  reviews: 'পাঠক রিভিউ ও রেটিং',
  roles: 'রোল ও পারমিশন',
  sellers: 'মার্কেটপ্লেস বিক্রেতা',
  applications: 'আবেদনসমূহ',
  settings: 'ওয়েবসাইট সেটিংস',
  pwa: 'PWA ও অ্যাপ কন্ট্রোল',
  shipping: 'শিপিং ও ডেলিভারি',
  staff: 'স্টাফ ও প্রশাসন',
  directory: 'স্টাফ ডিরেক্টরি',
  departments: 'বিভাগ ও পদবি',
  tasks: 'দায়িত্ব ও টাস্ক',
  approvals: 'অনুমোদন কিউ',
  attendance: 'উপস্থিতি ও ছুটি',
  leave: 'ছুটির আবেদন',
  'ai-studio': 'AI স্টুডিও',
  'chat-hub': 'চ্যাট হাব',
  'command-center': 'কমান্ড সেন্টার',
  agents: 'এআই এজেন্ট',
  'content-studio': 'কনটেন্ট স্টুডিও',
  'knowledge-base': 'নলেজ বেস',
  submissions: 'পাণ্ডুলিপি ও সাবমিশন',
  support: 'সাপোর্ট টিকিট',
  users: 'ব্যবহারকারী তালিকা',
};

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname.split('/').filter(Boolean);
  // Example segments: ['admin', 'customers', 'cmvwgxwj60000ic6xi9x7was5']

  if (segments.length <= 1) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400" suppressHydrationWarning>
        <Home className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
        <span className="font-semibold text-stone-800 dark:text-stone-200">ড্যাশবোর্ড</span>
      </nav>
    );
  }

  const breadcrumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const isLast = idx === segments.length - 1;
    const label = ROUTE_LABELS[seg] || (seg.length > 15 ? 'বিস্তারিত তথ্য' : seg);

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400" suppressHydrationWarning>
      <Link
        href="/admin"
        className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
        title="ড্যাশবোর্ড"
      >
        <Home className="w-3.5 h-3.5 text-stone-400" />
      </Link>

      {breadcrumbs.map((crumb, idx) => {
        if (idx === 0) return null; // skip root 'admin' since home icon handles it
        return (
          <React.Fragment key={crumb.href}>
            <ChevronRight className="w-3 h-3 text-stone-300 dark:text-stone-600 flex-shrink-0" />
            {crumb.isLast ? (
              <span className="font-bold text-stone-900 dark:text-stone-100 truncate max-w-[160px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate max-w-[120px]"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

