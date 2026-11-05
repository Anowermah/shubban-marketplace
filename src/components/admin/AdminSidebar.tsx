'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Package,
  BookOpen,
  FolderTree,
  Users,
  Building2,
  Sliders,
  Boxes,
  ShoppingCart,
  UserCheck,
  Store,
  FileCheck2,
  CreditCard,
  RotateCcw,
  Percent,
  Banknote,
  Truck,
  Ticket,
  Flame,
  Image as ImageIcon,
  LayoutTemplate,
  FileText,
  Newspaper,
  HeartHandshake,
  Star,
  LifeBuoy,
  Bell,
  BarChart3,
  UserCog,
  ShieldAlert,
  ClipboardList,
  Settings,
  Search,
  ChevronDown,
  X,
  Palette,
  ShieldCheck,
  Home,
  Smartphone,
  MessageSquare,
  Bot,
  Cpu,
  CheckSquare,
  CalendarClock,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  Megaphone,
  Layers,
  Music,
  Video,
  Folder,
  HardDrive,
  Trash2,
} from 'lucide-react';

export interface AdminNavItem {
  id: string | number;
  label: string;
  href: string;
  icon: any;
  badge?: string;
  badgeVariant?: 'live' | 'smart' | 'pwa' | 'verified' | 'central' | 'default';
}

export interface AdminNavGroup {
  title: string;
  key: string;
  icon: any;
  items: AdminNavItem[];
  badge?: string;
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: 'ড্যাশবোর্ড',
    key: 'dashboard',
    icon: LayoutDashboard,
    items: [
      { id: 'dash-1', label: 'ওভারভিউ', href: '/admin', icon: Home },
      { id: 'dash-2', label: 'অ্যানালিটিক্স', href: '/admin/reports', icon: BarChart3, badge: 'লাইভ', badgeVariant: 'live' },
      { id: 'dash-3', label: 'AI সহকারী', href: '/admin/ai-assistant', icon: Sparkles, badge: 'স্মার্ট', badgeVariant: 'smart' },
    ],
  },
  {
    title: 'পণ্য ও ইনভেন্টরি',
    key: 'catalog',
    icon: Package,
    items: [
      { id: 'cat-1', label: 'পণ্য তালিকা', href: '/admin/products', icon: Package },
      { id: 'cat-2', label: 'বই সম্ভার', href: '/admin/books', icon: BookOpen },
      { id: 'cat-3', label: 'ক্যাটাগরি', href: '/admin/categories', icon: FolderTree },
      { id: 'cat-4', label: 'লেখকবৃন্দ', href: '/admin/authors', icon: Users },
      { id: 'cat-5', label: 'প্রকাশনী', href: '/admin/publishers', icon: Building2 },
      { id: 'cat-6', label: 'স্টক ইনভেন্টরি', href: '/admin/inventory', icon: Boxes },
      { id: 'cat-7', label: 'পণ্য ভ্যারিয়েন্ট', href: '/admin/attributes', icon: Sliders },
      { id: 'cat-8', label: 'রিভিউ ও রেটিং', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'অর্ডার ও ডেলিভারি',
    key: 'orders',
    icon: ShoppingCart,
    items: [
      { id: 'ord-1', label: 'সকল অর্ডার', href: '/admin/orders', icon: ShoppingCart },
      { id: 'ord-2', label: 'কুরিয়ার ট্র্যাকিং', href: '/admin/couriers', icon: Truck, badge: 'লাইভ', badgeVariant: 'live' },
      { id: 'ord-3', label: 'শিপিং রেট', href: '/admin/shipping', icon: Truck },
      { id: 'ord-4', label: 'রিটার্ন ও রিফান্ড', href: '/admin/refunds', icon: RotateCcw },
    ],
  },
  {
    title: 'মার্কেটপ্লেস ও বিক্রেতা',
    key: 'sellers',
    icon: Store,
    items: [
      { id: 'sel-1', label: 'সকল বিক্রেতা', href: '/admin/sellers', icon: Store },
      { id: 'sel-2', label: 'সেলার আবেদন', href: '/admin/sellers/applications', icon: FileCheck2 },
      { id: 'sel-3', label: 'পে-আউট ও উত্তোলন', href: '/admin/payouts', icon: Banknote },
      { id: 'sel-4', label: 'কমিশন হার', href: '/admin/commissions', icon: Percent },
    ],
  },
  {
    title: 'গ্রাহক ও সাপোর্ট',
    key: 'customers',
    icon: UserCheck,
    items: [
      { id: 'cus-1', label: 'গ্রাহক তালিকা', href: '/admin/customers', icon: UserCheck },
      { id: 'cus-2', label: 'সাপোর্ট টিকিট', href: '/admin/support', icon: LifeBuoy },
      { id: 'cus-3', label: 'বিজ্ঞপ্তি পাঠান', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    title: 'প্রকাশনা ও ম্যাগাজিন',
    key: 'publishing',
    icon: Newspaper,
    items: [
      { id: 'pub-central', label: 'কন্ট্রোল সেন্টার', href: '/admin/publishing', icon: ShieldCheck, badge: 'সেন্ট্রাল', badgeVariant: 'central' },
      { id: 'pub-mags', label: 'ম্যাগাজিন ও সাময়িকী', href: '/admin/magazines', icon: Newspaper },
      { id: 'pub-articles', label: 'প্রবন্ধ ও কলাম', href: '/admin/articles', icon: FileText },
      { id: 'pub-essays', label: 'রচনা ও গবেষণা', href: '/admin/essays', icon: BookOpen },
      { id: 'pub-pdf', label: 'PDF লাইব্রেরি', href: '/admin/publications/files', icon: Boxes },
      { id: 'pub-analytics', label: 'রিডিং অ্যানালিটিক্স', href: '/admin/publications/analytics', icon: BarChart3, badge: 'লাইভ', badgeVariant: 'live' },
      { id: 'pub-subs', label: 'সাবস্ক্রিপশন', href: '/admin/publishing/subscriptions', icon: CreditCard },
      { id: 'pub-feedback', label: 'পাঠক প্রতিক্রিয়া', href: '/admin/publications/feedback', icon: MessageSquare },
      { id: 'pub-settings', label: 'প্রকাশনা সেটিংস', href: '/admin/publications/settings', icon: Settings },
    ],
  },
  {
    title: 'AI স্টুডিও',
    key: 'ai-studio',
    icon: Sparkles,
    badge: 'স্মার্ট',
    items: [
      { id: 'ai-1', label: 'ড্যাশবোর্ড', href: '/admin/ai-studio/dashboard', icon: LayoutDashboard },
      { id: 'ai-2', label: 'চ্যাট হাব', href: '/admin/ai-studio/chat-hub', icon: Sparkles, badge: 'লাইভ', badgeVariant: 'live' },
      { id: 'ai-3', label: 'কমান্ড সেন্টার', href: '/admin/ai-studio/command-center', icon: Bot },
      { id: 'ai-4', label: 'AI এজেন্ট', href: '/admin/ai-studio/agents', icon: Users },
      { id: 'ai-5', label: 'কনটেন্ট স্টুডিও', href: '/admin/ai-studio/content-studio', icon: FileText },
      { id: 'ai-6', label: 'গবেষণা সহকারী', href: '/admin/ai-studio/research', icon: Search },
      { id: 'ai-7', label: 'নলেজ বেস', href: '/admin/ai-studio/knowledge-base', icon: BookOpen },
      { id: 'ai-8', label: 'অনুমোদন কেন্দ্র', href: '/admin/ai-studio/approvals', icon: ShieldCheck },
      { id: 'ai-9', label: 'অটোমেশন', href: '/admin/ai-studio/automations', icon: Sliders },
      { id: 'ai-10', label: 'AI মডেল', href: '/admin/ai-studio/providers', icon: Cpu },
      { id: 'ai-11', label: 'এআই সেটিংস', href: '/admin/ai-studio/settings', icon: Settings },
    ],
  },
  {
    title: 'ওয়েবসাইট ও কনটেন্ট',
    key: 'cms',
    icon: LayoutTemplate,
    items: [
      { id: 'cms-1', label: 'হোমপেজ সাজান', href: '/admin/homepage', icon: LayoutTemplate },
      { id: 'cms-2', label: 'ব্যানার ও স্লাইডার', href: '/admin/banners', icon: ImageIcon },
      { id: 'cms-3', label: 'থিম ও রূপ', href: '/admin/appearance', icon: Palette },
      { id: 'isl-1', label: 'ইসলামিক AI', href: '/admin/islamic-ai', icon: Sparkles, badge: 'প্রামাণ্য', badgeVariant: 'verified' },
      { id: 'isl-2', label: 'দান ও সদকাহ', href: '/admin/donations', icon: HeartHandshake },
      { id: 'cms-ads', label: 'বিজ্ঞাপন ও স্পনসর', href: '/admin/ads-manager', icon: Megaphone, badge: 'Ads', badgeVariant: 'smart' },
      { id: 'sub-1', label: 'পাণ্ডুলিপি সাবমিশন', href: '/admin/submissions', icon: FileCheck2 },
    ],
  },
  {
    title: 'মিডিয়া ও অ্যাসেট (DAM)',
    key: 'media-dam',
    icon: Layers,
    badge: 'DAM',
    items: [
      { id: 'med-1', label: 'মিডিয়া লাইব্রেরি', href: '/admin/media', icon: Layers, badge: 'সেন্ট্রাল', badgeVariant: 'central' },
      { id: 'med-2', label: 'ছবি (Images)', href: '/admin/media?tab=images', icon: ImageIcon },
      { id: 'med-3', label: 'পিডিএফ ও ডকুমেন্টস', href: '/admin/media?tab=documents', icon: FileText },
      { id: 'med-4', label: 'অডিও লাইব্রেরি', href: '/admin/media?tab=audio', icon: Music },
      { id: 'med-5', label: 'ভিডিও লাইব্রেরি', href: '/admin/media?tab=video', icon: Video },
      { id: 'med-6', label: 'ফোল্ডার ও কালেকশন', href: '/admin/media?tab=folders', icon: Folder },
      { id: 'med-7', label: 'ট্র্যাশ ও রিকভারি', href: '/admin/media?tab=trash', icon: Trash2 },
      { id: 'med-8', label: 'স্টোরেজ অ্যানালিটিক্স', href: '/admin/media?tab=overview', icon: HardDrive, badge: 'লাইভ', badgeVariant: 'live' },
    ],
  },
  {
    title: 'বিজ্ঞাপন ও নেটওয়ার্ক',
    key: 'ads-network',
    icon: Megaphone,
    badge: 'Ads',
    items: [
      { id: 'ad-1', label: 'অ্যাড কন্ট্রোল সেন্টার', href: '/admin/ads-manager', icon: Megaphone, badge: 'নেটওয়ার্ক', badgeVariant: 'smart' },
      { id: 'ad-2', label: 'বিজ্ঞাপনদাতা তালিকা', href: '/admin/ads-manager?tab=advertisers', icon: Users },
      { id: 'ad-3', label: 'ক্যাম্পেইন ম্যানেজমেন্ট', href: '/admin/ads-manager?tab=campaigns', icon: LayoutDashboard },
      { id: 'ad-4', label: 'প্লেসমেন্ট ও সাইজ', href: '/admin/ads-manager?tab=placements', icon: LayoutTemplate },
      { id: 'ad-5', label: 'প্যাকেজ ও রেট', href: '/admin/ads-manager?tab=pricing', icon: Banknote },
      { id: 'ad-6', label: 'রাজস্ব ও অডিট', href: '/admin/ads-manager?tab=revenue', icon: BarChart3, badge: 'লাইভ', badgeVariant: 'live' },
      { id: 'ad-7', label: 'বিজ্ঞাপন সেটিংস', href: '/admin/ads-manager?tab=settings', icon: Settings },
    ],
  },
  {
    title: 'আর্থিক ও অফার',
    key: 'finance',
    icon: CreditCard,
    items: [
      { id: 'fin-1', label: 'পেমেন্ট হিস্ট্রি', href: '/admin/payments', icon: CreditCard },
      { id: 'fin-2', label: 'কুপন কোড', href: '/admin/coupons', icon: Ticket },
      { id: 'fin-3', label: 'অফার ও ছাড়', href: '/admin/promotions', icon: Flame },
    ],
  },
  {
    title: 'স্টাফ ও প্রশাসন',
    key: 'staff_hrms',
    icon: Users,
    items: [
      { id: 'stf-1', label: 'স্টাফ ড্যাশবোর্ড', href: '/admin/staff', icon: LayoutDashboard },
      { id: 'stf-2', label: 'স্টাফ ডিরেক্টরি', href: '/admin/staff/directory', icon: Users },
      { id: 'stf-3', label: 'ডিপার্টমেন্ট ও পদবি', href: '/admin/staff/departments', icon: Building2 },
      { id: 'stf-4', label: 'দায়িত্ব ও টাস্ক', href: '/admin/staff/tasks', icon: CheckSquare },
      { id: 'stf-5', label: 'অনুমোদন কিউ', href: '/admin/staff/approvals', icon: FileCheck2 },
      { id: 'stf-6', label: 'উপস্থিতি ও ছুটি', href: '/admin/staff/attendance', icon: CalendarClock },
      { id: 'stf-7', label: 'পারফরম্যান্স রিপোর্ট', href: '/admin/staff/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'প্রশাসন ও সেটিংস',
    key: 'settings',
    icon: Settings,
    items: [
      { id: 'set-1', label: 'ইউজার লিস্ট', href: '/admin/users', icon: UserCog },
      { id: 'set-2', label: 'রোল ও পারমিশন', href: '/admin/roles', icon: ShieldAlert },
      { id: 'set-4', label: 'অডিট লগ', href: '/admin/audit-logs', icon: ClipboardList },
      { id: 'set-5', label: 'সিস্টেম সেটিংস', href: '/admin/settings', icon: Settings },
      { id: 'set-6', label: 'মোবাইল অ্যাপ', href: '/admin/settings/pwa', icon: Smartphone, badge: 'PWA', badgeVariant: 'pwa' },
    ],
  },
];

export const ADMIN_NAV_SECTIONS = ADMIN_NAV_GROUPS;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

function renderBadge(badge: string, variant?: string) {
  if (variant === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {badge}
      </span>
    );
  }
  if (variant === 'smart') {
    return (
      <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
        {badge}
      </span>
    );
  }
  if (variant === 'pwa') {
    return (
      <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
        {badge}
      </span>
    );
  }
  if (variant === 'verified') {
    return (
      <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
        {badge}
      </span>
    );
  }
  if (variant === 'central') {
    return (
      <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
        {badge}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
      {badge}
    </span>
  );
}

export default function AdminSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [filterQuery, setFilterQuery] = useState('');
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    dashboard: true,
  });
  const [hoveredGroupKey, setHoveredGroupKey] = useState<string | null>(null);

  // Mobile Body Scroll Lock & Escape Key Handler
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  // Auto-expand active group dropdown
  useEffect(() => {
    ADMIN_NAV_GROUPS.forEach((group) => {
      const hasActiveChild = group.items.some(
        (item) => pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
      );
      if (hasActiveChild) {
        setOpenDropdowns((prev) => ({ ...prev, [group.key]: true }));
      }
    });
  }, [pathname]);

  // Filter groups & items based on search query
  const filteredGroups = useMemo(() => {
    if (!filterQuery.trim()) return ADMIN_NAV_GROUPS;

    const q = filterQuery.toLowerCase();
    return ADMIN_NAV_GROUPS.map((group) => {
      const groupMatches = group.title.toLowerCase().includes(q);
      const matchingItems = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q)
      );

      if (groupMatches) return group;
      if (matchingItems.length > 0) return { ...group, items: matchingItems };
      return null;
    }).filter(Boolean) as AdminNavGroup[];
  }, [filterQuery]);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay with subtle blur */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Full-Height Sidebar Element */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 lg:sticky lg:top-0 lg:h-screen bg-stone-50/90 dark:bg-stone-900/95 backdrop-blur-md border-r border-stone-200/80 dark:border-stone-800/90 transition-all duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Admin Navigation Sidebar"
      >
        {/* Modern Sidebar Brand Header */}
        <div
          className={`h-16 flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-stone-900/70 flex-shrink-0 px-3.5 transition-all`}
        >
          <Link
            href="/admin"
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex items-center gap-3 overflow-hidden group min-w-0"
          >
            {/* Elegant Emblem Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/25 flex-shrink-0 group-hover:scale-105 transition-transform ring-1 ring-amber-400/40">
              <ShieldCheck className="w-5 h-5 text-amber-50" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="font-serif font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100 block truncate">
                  শুব্বান প্রশাসন
                </span>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-sans font-bold tracking-widest block uppercase -mt-0.5">
                  CONTROL CENTER
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle Inside Sidebar Header */}
          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="সাইডবার সংকুচিত করুন"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Mode Expand Button */}
        {isCollapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center py-2.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="সাইডবার প্রসারিত করুন"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modern Filter Search Input */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="মেনু খুঁজুন..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-800/90 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition shadow-xs"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Groups with Refined, Modern Accordions */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 text-xs font-bengali scrollbar-thin">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const isGroupActive = group.items.some(
              (item) => pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
            );
            const isExpanded = !!openDropdowns[group.key] || !!filterQuery;

            // Collapsed View (Desktop icon only)
            if (isCollapsed) {
              return (
                <div
                  key={group.key}
                  className="relative group my-1"
                  onMouseEnter={() => setHoveredGroupKey(group.key)}
                  onMouseLeave={() => setHoveredGroupKey(null)}
                >
                  <button
                    onClick={() => toggleDropdown(group.key)}
                    className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all ${
                      isGroupActive
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/30'
                        : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                    title={group.title}
                  >
                    <GroupIcon className="w-4 h-4 flex-shrink-0" />
                  </button>

                  {/* Flyout Submenu on Hover in Collapsed Mode */}
                  {hoveredGroupKey === group.key && (
                    <div className="absolute left-full top-0 ml-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-xs font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GroupIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{group.title}</span>
                        </div>
                        {group.badge && renderBadge(group.badge, 'smart')}
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                        {group.items.map((item) => {
                          const SubIcon = item.icon;
                          const isSubActive =
                            pathname === item.href ||
                            (item.href !== '/admin' && pathname?.startsWith(item.href));
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setHoveredGroupKey(null);
                                if (window.innerWidth < 1024) onClose();
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                                isSubActive
                                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold'
                                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && renderBadge(item.badge, item.badgeVariant)}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Normal Expanded View (Clean, modern, refined accordion)
            return (
              <div key={group.key} className="transition-colors">
                {/* Accordion Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleDropdown(group.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all select-none ${
                    isGroupActive
                      ? 'text-stone-900 dark:text-stone-100 bg-stone-200/50 dark:bg-stone-800/50'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-stone-800/40 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GroupIcon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isGroupActive
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-stone-400 dark:text-stone-500'
                      }`}
                    />
                    <span className="truncate tracking-tight">{group.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {group.badge && renderBadge(group.badge, 'smart')}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-stone-600 dark:text-stone-300' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Submenu Children with Modern Active State */}
                {isExpanded && (
                  <div className="ml-3 pl-2.5 my-1 border-l border-stone-200 dark:border-stone-800/80 space-y-0.5 transition-all">
                    {group.items.map((item) => {
                      const SubIcon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/admin' && pathname?.startsWith(item.href));

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                            isActive
                              ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200'
                          }`}
                        >
                          {/* Active Left Indicator Bar */}
                          {isActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 dark:bg-amber-400 rounded-r-full shadow-xs shadow-amber-500/50" />
                          )}

                          <div className="flex items-center gap-2 min-w-0">
                            <SubIcon
                              className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                                isActive
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-stone-400 dark:text-stone-500'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && renderBadge(item.badge, item.badgeVariant)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modern Sidebar Footer */}
        <div className="p-3 border-t border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 text-[11px] text-stone-500 flex items-center justify-between flex-shrink-0">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-stone-400 text-[10px]">সিস্টেম অনলাইন • v2.6</span>
              </div>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 text-[10px] font-bold transition-colors"
                title="মূল ওয়েবসাইট মার্কেটপ্লেস দেখুন"
              >
                মার্কেটপ্লেস <ExternalLink className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <div className="mx-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" title="সিস্টেম অনলাইন"></span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
