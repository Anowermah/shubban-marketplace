'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BookOpen,
  FolderTree,
  Building2,
  Sliders,
  Boxes,
  Truck,
  CreditCard,
  RotateCcw,
  Percent,
  Ticket,
  Flame,
  LayoutTemplate,
  FileText,
  HeartHandshake,
  Star,
  LifeBuoy,
  Bell,
  BarChart3,
  UserCog,
  ShieldAlert,
  ClipboardList,
  Settings,
  Sparkles,
  ArrowRight,
  Command,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: any;
  keywords?: string;
}

const COMMAND_LIST: CommandItem[] = [
  { id: '1', title: 'ড্যাশবোর্ড ওভারভিউ (Dashboard)', category: 'ড্যাশবোর্ড', href: '/admin', icon: LayoutDashboard },
  { id: '2', title: 'AI কমান্ড সেন্টার (AI Assistant)', category: 'ড্যাশবোর্ড', href: '/admin/ai-assistant', icon: Sparkles },
  { id: '3', title: 'বই সম্ভার (Books Management)', category: 'ক্যাটালগ', href: '/admin/books', icon: BookOpen },
  { id: '4', title: 'সাধারণ পণ্য (General Products)', category: 'ক্যাটালগ', href: '/admin/products', icon: Package },
  { id: '5', title: 'ক্যাটাগরি ও সাব-বিভাগ (Categories)', category: 'ক্যাটালগ', href: '/admin/categories', icon: FolderTree },
  { id: '6', title: 'লেখক পরিচিতি ও প্রোফাইল (Authors)', category: 'ক্যাটালগ', href: '/admin/authors', icon: Users },
  { id: '7', title: 'প্রকাশনী সংস্থা (Publishers)', category: 'ক্যাটালগ', href: '/admin/publishers', icon: Building2 },
  { id: '8', title: 'প্রোডাক্ট অ্যাট্রিবিউটস ও ভ্যারিয়েন্ট (Attributes)', category: 'ক্যাটালগ', href: '/admin/attributes', icon: Sliders },
  { id: '9', title: 'ইনভেন্টরি ও স্টক নিয়ন্ত্রণ (Inventory)', category: 'ক্যাটালগ', href: '/admin/inventory', icon: Boxes },
  { id: '10', title: 'অর্ডার ও ডেলিভারি (Orders Management)', category: 'বিক্রয়', href: '/admin/orders', icon: ShoppingCart },
  { id: '11', title: 'গ্রাহক ও সদস্যবৃন্দ (Customers Management)', category: 'বিক্রয়', href: '/admin/customers', icon: Users },
  { id: '12', title: 'মার্কেটপ্লেস বিক্রেতা (Sellers)', category: 'মার্কেটপ্লেস', href: '/admin/sellers', icon: Building2 },
  { id: '13', title: 'কুরিয়ার ও ট্র্যাকিং (Courier Management)', category: 'ডেলিভারি', href: '/admin/couriers', icon: Truck },
  { id: '14', title: 'পেমেন্ট ও ট্রানজেকশন (Payments)', category: 'অর্থ', href: '/admin/payments', icon: CreditCard },
  { id: '15', title: 'রিফান্ড ও রিটার্ন (Refunds)', category: 'অর্থ', href: '/admin/refunds', icon: RotateCcw },
  { id: '16', title: 'কমিশন ও পে-আউট (Commissions)', category: 'অর্থ', href: '/admin/commissions', icon: Percent },
  { id: '17', title: 'কুপন ও ডিসকাউন্ট (Coupons)', category: 'মার্কেটিং', href: '/admin/coupons', icon: Ticket },
  { id: '18', title: 'প্রমোশন ও অফার (Promotions)', category: 'মার্কেটিং', href: '/admin/promotions', icon: Flame },
  { id: '19', title: 'হোমপেজ ও সিএমএস (Homepage Manager)', category: 'সিএমএস', href: '/admin/homepage', icon: LayoutTemplate },
  { id: '20', title: 'হিরো ব্যানার (Banners)', category: 'সিএমএস', href: '/admin/banners', icon: LayoutTemplate },
  { id: '21', title: 'প্রবন্ধ ও নিবন্ধ (Articles)', category: 'সিএমএস', href: '/admin/articles', icon: FileText },
  { id: '22', title: 'দান ও সদকাহ ফান্ড (Donations)', category: 'দাতব্য', href: '/admin/donations', icon: HeartHandshake },
  { id: '23', title: 'পাঠক রিভিউ ও রেটিং (Reviews)', category: 'ফিডব্যাক', href: '/admin/reviews', icon: Star },
  { id: '24', title: 'ইসলামিক এআই নলেজ (Islamic AI)', category: 'ইসলামিক', href: '/admin/islamic-ai', icon: Sparkles },
  { id: '25', title: 'আর্থিক ও বিক্রয় রিপোর্ট (Reports & Analytics)', category: 'রিপোর্ট', href: '/admin/reports', icon: BarChart3 },
  { id: '26', title: 'সাপোর্ট টিকিট ও জিজ্ঞাসা (Support)', category: 'সাপোর্ট', href: '/admin/support', icon: LifeBuoy },
  { id: '27', title: 'সিস্টেম বিজ্ঞপ্তি (Notifications)', category: 'সিস্টেম', href: '/admin/notifications', icon: Bell },
  { id: '28', title: 'ব্যবহারকারী ও রোল (Users & Permissions)', category: 'সিস্টেম', href: '/admin/users', icon: UserCog },
  { id: '29', title: 'স্টাফ ও টিম (Staff Management)', category: 'সিস্টেম', href: '/admin/staff', icon: UserCog },
  { id: '30', title: 'অডিট লগ ও নিরাপত্তা (Audit Logs)', category: 'নিরাপত্তা', href: '/admin/audit-logs', icon: ClipboardList },
  { id: '31', title: 'ওয়েবসাইট সেটিংস (Website Settings)', category: 'সেটিংস', href: '/admin/settings', icon: Settings },
  { id: '32', title: 'থিম ও অ্যাপিয়ারেন্স (Appearance)', category: 'সেটিংস', href: '/admin/appearance', icon: Settings },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = COMMAND_LIST.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.href.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3 bg-stone-50/50 dark:bg-stone-800/40">
          <Search className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="অ্যাডমিন মেনু, মডিউল বা পেজ খুঁজুন (যেমন: Orders, Books, Customers)..."
            className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-stone-100 dark:divide-stone-800/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              কোনো মিল খুঁজে পাওয়া যায়নি।
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all text-xs ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block">{item.title}</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        বিভাগ: {item.category} • {item.href}
                      </span>
                    </span>
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'translate-x-1 text-amber-600' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-400 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span>↑↓ নেভিগেট</span>
            <span>↵ নির্বাচন</span>
            <span>ESC বন্ধ</span>
          </div>
          <span className="font-mono">Shubban Libery Console</span>
        </div>
      </div>
    </div>
  );
}

