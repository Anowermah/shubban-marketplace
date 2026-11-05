'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  BookOpen,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Library,
  Feather,
  GraduationCap,
  MessageCircle,
  Users,
  Compass,
  ArrowRight,
  Store,
  HeartHandshake,
  Heart,
  LayoutGrid,
  Sparkles,
  Newspaper,
  FileText,
  Home,
  ChevronRight,
  Megaphone,
  Building2,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import MegaMenu from '@/components/layout/MegaMenu';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useCart } from '@/components/providers/CartContext';
import { useAuth } from '@/components/providers/AuthContext';
import { toBengaliNumber, formatTaka } from '@/lib/utils';
import { MAIN_NAV_LINKS } from '@/lib/constants';

const MOBILE_CATEGORIES = [
  {
    title: 'সাহিত্য ও ক্লাসিক',
    icon: BookOpen,
    color: 'text-amber-600 dark:text-amber-400',
    items: [
      { label: 'সাহিত্য ও ছোটগল্প', href: '/books?category=literature' },
      { label: 'চিরায়ত ও আধুনিক উপন্যাস', href: '/books?category=novel' },
      { label: 'কাব্যগ্রন্থ ও কবিতা', href: '/books?category=poetry' },
      { label: 'ইতিহাস ও ঐতিহ্য', href: '/books?category=history' },
      { label: 'দর্শন ও মননশীল চিন্তা', href: '/books?category=philosophy' },
      { label: 'মুক্ত ডিজিটাল বই (PDF)', href: '/digital-library', highlight: true },
    ],
  },
  {
    title: 'ইসলামিক জ্ঞানপীঠ',
    icon: Compass,
    color: 'text-emerald-600 dark:text-emerald-400',
    items: [
      { label: 'কুরআন ও তাফসীর গ্রন্থ', href: '/books?category=islamic' },
      { label: 'হাদিস শরিফ ও ব্যাখ্যা', href: '/books?category=islamic' },
      { label: 'নবী-রাসূল ও সাহাবিদের জীবনী', href: '/books?category=biography' },
      { label: 'ফিকহ ও দৈনন্দিন মাসায়েল', href: '/books?category=islamic' },
      { label: 'প্রশ্নোত্তর ও ফতোয়া ফোরাম', href: '/questions' },
      { label: 'ইসলামিক এআই সহকারী', href: '/islamic-ai', highlight: true },
      { label: 'মাসিক সাময়িকী আর্কাইভ', href: '/magazine' },
    ],
  },
  {
    title: 'সুন্নাহ ও লাইফস্টাইল',
    icon: Sparkles,
    color: 'text-amber-500',
    items: [
      { label: 'খাঁটি অ্যালকোহলমুক্ত আতর', href: '/books?category=islamic-lifestyle' },
      { label: 'তুর্কি মখমল ও জায়নামাজ', href: '/books?category=islamic-lifestyle' },
      { label: 'প্রাকৃতিক জয়তুন মিসওয়াক ও তসবিহ', href: '/books?category=islamic-lifestyle' },
      { label: 'আত্মউন্নয়ন ও সুন্নাহসম্মত জীবন', href: '/books?category=self-help' },
      { label: 'দারুল হুদা লাইফস্টাইল স্টোর', href: '/sellers/darul-huda-lifestyle', highlight: true },
    ],
  },
  {
    title: 'সদকাহ ও মার্কেটপ্লেস',
    icon: HeartHandshake,
    color: 'text-rose-500',
    items: [
      { label: 'আস-সুন্নাহ ও শুব্বান সদকাহ ফান্ড', href: '/donations' },
      { label: 'মার্কেটপ্লেসে বিক্রেতা হোন', href: '/seller/apply' },
      { label: 'বই ও প্রবন্ধ জমা দিন', href: '/submit' },
      { label: 'সদস্যপদ প্ল্যানসমূহ', href: '/membership' },
    ],
  },
];

function getNavLinkIcon(href: string) {
  switch (href) {
    case '/':
      return Home;
    case '/islamic-ai':
      return Sparkles;
    case '/books':
      return BookOpen;
    case '/magazine':
    case '/publications':
      return Newspaper;
    case '/articles':
      return FileText;
    case '/resources':
      return Compass;
    case '/donations':
      return HeartHandshake;
    case '/authors':
      return Users;
    case '/digital-library':
      return Library;
    case '/seller/apply':
      return Store;
    default:
      return BookOpen;
  }
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { items } = useCart();
  const { user, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [liveResults, setLiveResults] = useState<{
    books: any[];
    authors?: any[];
    publishers?: any[];
    categories?: any[];
    articles: any[];
  }>({ books: [], authors: [], publishers: [], categories: [], articles: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load wishlist count
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem('shubban_wishlist') || '[]');
      setWishlistCount(Array.isArray(local) ? local.length : 0);
    } catch (e) { }
  }, []);

  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Live autocomplete search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setLiveResults({ books: [], articles: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data);
        }
      } catch (e) {
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotificationPopup(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setLiveResults({ books: [], articles: [] });
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubCategory = (title: string) => {
    setOpenSubCategory((prev) => (prev === title ? null : title));
  };

  // 1. Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // 2. Lock body scroll when mobile sidebar is open & restore on close
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // 3. Lock body scroll & close on ESC key press
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // 4. Auto-expand category containing current active page when opened
  useEffect(() => {
    if (isMobileMenuOpen) {
      const activeCat = MOBILE_CATEGORIES.find((cat) =>
        cat.items.some((it) => pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href)))
      );
      if (activeCat) {
        setIsCategoriesMenuOpen(true);
        setOpenSubCategory(activeCat.title);
      }
    }
  }, [isMobileMenuOpen, pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const catQuery = searchCategory !== 'all' ? `&category=${encodeURIComponent(searchCategory)}` : '';
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${catQuery}`);
    setIsSearchOpen(false);
    setLiveResults({ books: [], articles: [] });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-shubban-darkBg/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
        {/* Top Utility Bar */}
        <div className="hidden lg:block bg-shubban-green text-shubban-ivory text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 font-bengali text-shubban-gold">
                <span className="inline-block w-2 h-2 rounded-full bg-shubban-gold animate-pulse"></span>
                শুব্বান লাইব্রেরী — বই, জ্ঞান ও মননশীলতার এক সমৃদ্ধ ঠিকানা
              </span>
              <span className="text-shubban-ivory/60">|</span>
              <span className="font-bengali text-shubban-ivory/80">
                হেল্পলাইন: +৮৮০ ১৭১১-০০০০০০
              </span>
            </div>

            <div className="flex items-center gap-5">
              <Link
                href="/donations"
                className="font-bengali text-amber-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>সদকাহ ও দান</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/40">
                  ফান্ড
                </span>
              </Link>

              <span className="text-shubban-ivory/40">|</span>

              <Link
                href="/seller/apply"
                className="font-bengali text-shubban-ivory/90 hover:text-shubban-gold transition-colors flex items-center gap-1"
              >
                <Store className="w-3.5 h-3.5" />
                <span>মার্কেটপ্লেস বিক্রেতা</span>
              </Link>

              <span className="text-shubban-ivory/40">|</span>

              <Link
                href="/membership"
                className="font-bengali text-shubban-gold hover:text-white transition-colors flex items-center gap-1"
              >
                <span>সদস্যপদ</span>
                <span className="text-[10px] bg-shubban-gold/20 text-shubban-gold px-1.5 py-0.5 rounded border border-shubban-gold/40">
                  অফার
                </span>
              </Link>

              <span className="text-shubban-ivory/40">|</span>

              {/* Language Selector */}
              <div className="flex items-center gap-1 text-[11px] font-sans">
                <span className="font-bold text-shubban-gold">বাং</span>
                <span className="text-shubban-ivory/50">/</span>
                <span className="text-shubban-ivory/70 hover:text-white cursor-pointer">EN</span>
              </div>

              {/* Dark / Light Mode Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                suppressHydrationWarning
                className="p-1 rounded-md text-shubban-ivory/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {mounted && theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-shubban-gold" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo & Mobile Menu Trigger */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Animated Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="lg:hidden relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-stone-900 dark:text-stone-100 bg-stone-100 hover:bg-stone-200/90 dark:bg-stone-800/90 dark:hover:bg-stone-700/90 border border-stone-200/90 dark:border-stone-700/80 hover:border-shubban-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-shubban-gold transition-all active:scale-95 flex-shrink-0 shadow-xs"
                aria-label={isMobileMenuOpen ? 'মেনু বন্ধ করুন' : 'প্রধান মেনু খুলুন'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
              >
                <span
                  className={`block h-[3px] w-6 sm:w-6.5 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen
                      ? 'rotate-45 translate-y-[9px] bg-shubban-gold'
                      : 'bg-stone-900 dark:bg-stone-100'
                    }`}
                />
                <span
                  className={`block h-[3px] w-6 sm:w-6.5 rounded-full transition-all duration-200 ease-in-out ${isMobileMenuOpen
                      ? 'opacity-0 scale-x-0'
                      : 'bg-stone-900 dark:bg-stone-100'
                    }`}
                />
                <span
                  className={`block h-[3px] w-6 sm:w-6.5 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen
                      ? '-rotate-45 -translate-y-[9px] bg-shubban-gold'
                      : 'bg-stone-900 dark:bg-stone-100'
                    }`}
                />
              </button>
              <Logo size="md" showTagline={true} />
            </div>

            {/* Prominent Global Search Bar (Desktop) with Live Autocomplete */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-4 relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center rounded-full bg-stone-100 dark:bg-shubban-darkCard border border-stone-200 dark:border-shubban-darkBorder focus-within:ring-2 focus-within:ring-shubban-gold/60 focus-within:border-transparent transition-all overflow-hidden">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  aria-label="Search Category"
                  className="bg-transparent text-xs font-bengali font-semibold text-stone-600 dark:text-stone-300 py-2.5 pl-4 pr-2 border-r border-stone-200 dark:border-stone-700 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-stone-900">সকল বিভাগ</option>
                  <option value="books" className="bg-white dark:bg-stone-900">বইসমূহ</option>
                  <option value="islamic-lifestyle" className="bg-white dark:bg-stone-900">লাইফস্টাইল ও আতর</option>
                  <option value="magazines" className="bg-white dark:bg-stone-900">পত্রিকা ও সাময়িকী</option>
                  <option value="articles" className="bg-white dark:bg-stone-900">প্রবন্ধ ও গবেষণা</option>
                </select>

                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="বইয়ের নাম, লেখক, আতর, সাময়িকী খুঁজুন..."
                    className="w-full pl-9 pr-24 py-2.5 text-sm bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none font-bengali"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-full bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bengali font-medium shadow-sm transition-colors"
                  >
                    খুঁজুন
                  </button>
                </div>
              </form>

              {/* Live Autocomplete Dropdown */}
              {(liveResults.books?.length > 0 ||
                (liveResults.authors && liveResults.authors.length > 0) ||
                (liveResults.publishers && liveResults.publishers.length > 0) ||
                (liveResults.categories && liveResults.categories.length > 0) ||
                liveResults.articles?.length > 0) && (
                  <div className="absolute top-12 left-0 right-0 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-4 z-50 font-bengali space-y-3 max-h-96 overflow-y-auto">
                    {/* Books & Products */}
                    {liveResults.books?.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-shubban-gold uppercase tracking-wider block mb-2">
                          বই ও পণ্যসমূহ
                        </span>
                        <div className="space-y-1">
                          {liveResults.books.map((b) => (
                            <Link
                              key={b.id}
                              href={`/books/${b.slug}`}
                              onClick={() => setLiveResults({ books: [], articles: [] })}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                            >
                              <div className="w-8 h-10 rounded overflow-hidden bg-stone-100 flex-shrink-0">
                                <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 block line-clamp-1">
                                  {b.title}
                                </span>
                                <span className="text-[10px] text-stone-500">{b.author?.name}</span>
                              </div>
                              <span className="text-xs font-bold text-shubban-green dark:text-shubban-gold">
                                {formatTaka(b.discountPrice || b.price)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Authors */}
                    {liveResults.authors && liveResults.authors.length > 0 && (
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-[11px] font-bold text-shubban-gold uppercase tracking-wider block mb-2">
                          লেখকবৃন্দ
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {liveResults.authors.map((auth: any) => (
                            <Link
                              key={auth.id}
                              href={`/authors/${auth.slug}`}
                              onClick={() => setLiveResults({ books: [], articles: [] })}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-shubban-green/10 text-xs border border-stone-200 dark:border-stone-700"
                            >
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
                                {auth.photoUrl ? (
                                  <img src={auth.photoUrl} alt={auth.name} className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <span className="font-semibold text-stone-800 dark:text-stone-200">{auth.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Publishers */}
                    {liveResults.publishers && liveResults.publishers.length > 0 && (
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-[11px] font-bold text-shubban-gold uppercase tracking-wider block mb-2">
                          প্রকাশনী
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {liveResults.publishers.map((pub: any) => (
                            <Link
                              key={pub.id}
                              href={`/books?publisher=${pub.slug}`}
                              onClick={() => setLiveResults({ books: [], articles: [] })}
                              className="px-2.5 py-1 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 hover:border-shubban-green border border-stone-200 dark:border-stone-700"
                            >
                              {pub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Articles */}
                    {liveResults.articles?.length > 0 && (
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-[11px] font-bold text-shubban-gold uppercase tracking-wider block mb-2">
                          প্রবন্ধসমূহ
                        </span>
                        <div className="space-y-1">
                          {liveResults.articles.map((art) => (
                            <Link
                              key={art.id}
                              href={`/articles/${art.slug}`}
                              onClick={() => setLiveResults({ books: [], articles: [] })}
                              className="block p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-xs text-stone-800 dark:text-stone-200"
                            >
                              <span className="font-bold line-clamp-1">{art.title}</span>
                              <span className="text-[10px] text-stone-400">{art.author?.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setLiveResults({ books: [], articles: [] })}
                      className="block text-center text-xs font-bold text-shubban-green dark:text-shubban-gold pt-2 border-t border-stone-100 dark:border-stone-800 hover:underline"
                    >
                      “{searchQuery}”-এর সমস্ত ফলাফল দেখুন &rarr;
                    </Link>
                  </div>
                )}
            </div>

            {/* Action Icons: Search (mobile), Notifications, Cart, Account */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="lg:hidden p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                  className="relative p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full">
                      {toBengaliNumber(unreadNotifications)}
                    </span>
                  )}
                </button>

                {showNotificationPopup && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-4 z-50 font-bengali">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                      <span className="font-semibold text-stone-900 dark:text-white">বিজ্ঞপ্তি সমূহ</span>
                      <span className="text-xs text-shubban-gold cursor-pointer" onClick={() => setUnreadNotifications(0)}>
                        সব পড়া হয়েছে
                      </span>
                    </div>
                    <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-64 overflow-y-auto mt-2">
                      <div className="py-2.5 text-xs">
                        <p className="font-medium text-stone-900 dark:text-stone-200">
                          মাসিক শুব্বান সাহিত্য ও দর্শন সাময়িকীর নতুন সংখ্যা প্রকাশিত হয়েছে!
                        </p>
                        <span className="text-[10px] text-stone-400">২ ঘণ্টা আগে</span>
                      </div>
                      <div className="py-2.5 text-xs">
                        <p className="font-medium text-stone-900 dark:text-stone-200">
                          আপনার ডিজিটাল রিডিং প্রগ্রেস সফলভাবে সিঙ্ক হয়েছে।
                        </p>
                        <span className="text-[10px] text-stone-400">১ দিন আগে</span>
                      </div>
                    </div>
                    <Link
                      href="/account/notifications"
                      className="block text-center text-xs text-shubban-green dark:text-shubban-gold font-medium mt-3 pt-2 border-t border-stone-200 dark:border-stone-800"
                      onClick={() => setShowNotificationPopup(false)}
                    >
                      সকল বিজ্ঞপ্তি দেখুন &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* Wishlist Button (Heart) */}
              <Link
                href="/account/bookmarks"
                className="relative p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Wishlist"
                title="পছন্দ তালিকা (Wishlist)"
              >
                <Heart className="w-5 h-5 text-stone-700 dark:text-stone-300 hover:text-rose-600 transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-600 rounded-full shadow">
                    {toBengaliNumber(wishlistCount)}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Button */}
              <Link
                href="/cart"
                className="relative p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-shubban-gold rounded-full shadow">
                    {toBengaliNumber(totalCartCount)}
                  </span>
                )}
              </Link>

              {/* User Account Menu */}
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <div>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-stone-200 dark:border-stone-700 hover:border-shubban-gold transition-colors"
                    >
                      <span className="hidden md:inline-block text-xs font-bengali font-medium text-stone-800 dark:text-stone-200 max-w-[120px] truncate">
                        {user.name}
                      </span>
                      <span className="w-7 h-7 rounded-full overflow-hidden bg-shubban-green text-shubban-gold font-serif font-bold text-xs inline-flex items-center justify-center flex-shrink-0 border border-stone-200 dark:border-stone-700">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl py-2 z-50 font-bengali text-sm">
                        <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                          <p className="font-semibold text-stone-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-stone-500 truncate">{user.email}</p>
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-shubban-gold/15 text-shubban-gold border border-shubban-gold/30">
                            {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
                              ? 'প্রশাসক (Admin)'
                              : user.membershipTier === 'DIGITAL'
                                ? 'ডিজিটাল সদস্য'
                                : user.membershipTier === 'PREMIUM'
                                  ? 'প্রিমিয়াম স্কলার'
                                  : 'সাধারণ সদস্য'}
                          </div>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/account"
                            className="flex items-center gap-2.5 px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <UserIcon className="w-4 h-4 text-stone-400" />
                            <span>আমার ড্যাশবোর্ড</span>
                          </Link>
                          <Link
                            href="/account/library"
                            className="flex items-center gap-2.5 px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <BookOpen className="w-4 h-4 text-stone-400" />
                            <span>আমার ব্যক্তিগত লাইব্রেরী</span>
                          </Link>
                          <Link
                            href="/account/orders"
                            className="flex items-center gap-2.5 px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <ShoppingCart className="w-4 h-4 text-stone-400" />
                            <span>আমার অর্ডার ও চালান</span>
                          </Link>
                          {/* Multi-Role Workspace Switcher Links */}
                          {user.workspaces && user.workspaces.length > 0 ? (
                            <div className="pt-1.5 border-t border-stone-100 dark:border-stone-800 space-y-0.5">
                              <div className="px-4 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                ভূমিকা ও ওয়ার্কস্পেসসমূহ
                              </div>
                              {user.workspaces.map((ws: any) => (
                                <Link
                                  key={ws.key}
                                  href={ws.href}
                                  className="flex items-center justify-between px-4 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  <div className="flex items-center gap-2">
                                    {ws.key === 'admin' || ws.key === 'staff' ? (
                                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                    ) : ws.key === 'advertiser' ? (
                                      <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                                    ) : ws.key === 'publisher' ? (
                                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : ws.key === 'seller' ? (
                                      <Store className="w-3.5 h-3.5 text-blue-500" />
                                    ) : (
                                      <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                                    )}
                                    <span className="font-medium">{ws.title}</span>
                                  </div>
                                  {ws.badge && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 font-mono">
                                      {ws.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <>
                              <Link
                                href="/seller/dashboard"
                                className="flex items-center gap-2.5 px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Store className="w-4 h-4 text-stone-400" />
                                <span>বিক্রেতা ড্যাশবোর্ড (Seller)</span>
                              </Link>

                              {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.isStaff) && (
                                <Link
                                  href="/admin"
                                  className="flex items-center gap-2.5 px-4 py-2 text-shubban-green dark:text-shubban-gold font-semibold hover:bg-stone-50 dark:hover:bg-stone-800/60 border-t border-stone-100 dark:border-stone-800"
                                  onClick={() => setIsUserMenuOpen(false)}
                                >
                                  <ShieldCheck className="w-4 h-4 text-shubban-gold" />
                                  <span>অ্যাডমিন প্যানেল</span>
                                </Link>
                              )}
                            </>
                          )}
                        </div>

                        <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>লগআউট করুন</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bengali font-medium text-shubban-green dark:text-shubban-ivory hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      লগইন
                    </Link>
                    <Link
                      href="/register"
                      className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-bengali font-medium bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory shadow-sm transition-colors"
                    >
                      নিবন্ধন
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Overlay Bar */}
          {isSearchOpen && (
            <div className="lg:hidden pb-3 pt-1">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="বই, লেখক, সাময়িকী বা প্রবন্ধ খুঁজুন..."
                  className="w-full pl-10 pr-20 py-2 text-sm rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bengali focus:outline-none focus:ring-2 focus:ring-shubban-gold"
                  autoFocus
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <button
                  type="submit"
                  className="absolute right-1 top-1 px-3 py-1 rounded bg-shubban-green text-shubban-ivory text-xs font-bengali"
                >
                  খুঁজুন
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Main Categories Navigation Bar (Desktop) */}
        <nav className="hidden lg:block bg-stone-50 dark:bg-shubban-darkCard/50 border-t border-stone-200/60 dark:border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-2">
              {/* Mega Menu Dropdown (All Categories) */}
              <MegaMenu />

              <div className="h-5 w-px bg-stone-300 dark:bg-stone-700 mx-1 flex-shrink-0" />

              {/* Main Links */}
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none flex-1">
                {MAIN_NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 rounded-md text-xs font-bengali font-medium transition-colors whitespace-nowrap ${isActive
                        ? 'bg-shubban-green text-shubban-gold shadow-sm font-semibold'
                        : 'text-stone-700 dark:text-stone-300 hover:text-shubban-green dark:hover:text-shubban-gold hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Backdrop Overlay - Placed outside header to escape backdrop-filter containing block */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer (Off-Canvas Sidebar) - Placed outside header to escape backdrop-filter containing block */}
      <aside
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="মোবাইল সাইডবার নেভিগেশন"
        aria-hidden={!isMobileMenuOpen}
        className={`fixed inset-y-0 left-0 z-[70] w-[86vw] max-w-sm sm:max-w-md h-full bg-white dark:bg-shubban-darkBg shadow-2xl flex flex-col font-bengali transition-transform duration-300 ease-in-out lg:hidden overflow-hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Drawer Header */}
        <div className="h-16 sm:h-20 px-4 sm:px-5 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/60 flex-shrink-0">
          <Logo size="sm" showTagline={false} />

          <div className="flex items-center gap-2">
            {/* Dark Mode Quick Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition border border-stone-200/80 dark:border-stone-700/80"
              aria-label="Toggle Theme"
              title={mounted && theme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}
            >
              {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-shubban-gold" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition active:scale-95 border border-stone-200/80 dark:border-stone-700/80"
              aria-label="মেনু বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Search inside Drawer */}
        <div className="p-3.5 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 flex-shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বই, লেখক, সাময়িকী খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-shubban-gold/60"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scrollbar-thin">
          {/* 1. Expandable Nested Categories & Subjects (From MegaMenu) */}
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCategoriesMenuOpen(!isCategoriesMenuOpen)}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-stone-900 dark:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/60 transition-colors select-none"
              aria-expanded={isCategoriesMenuOpen}
            >
              <span className="flex items-center gap-2 text-shubban-green dark:text-shubban-gold">
                <LayoutGrid className="w-4 h-4 text-shubban-gold" />
                <span className="font-bold">সকল বিষয় ও বিভাগ (Categories)</span>
              </span>
              <span className="flex items-center gap-1.5 text-stone-400">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 font-sans font-semibold">৪টি শাখা</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesMenuOpen ? 'rotate-180 text-shubban-gold' : ''}`} />
              </span>
            </button>

            {isCategoriesMenuOpen && (
              <div className="p-2.5 pt-0 space-y-2 border-t border-stone-200/60 dark:border-stone-800/80 mt-1">
                {MOBILE_CATEGORIES.map((cat) => {
                  const isSubOpen = openSubCategory === cat.title;
                  const Icon = cat.icon;
                  return (
                    <div key={cat.title} className="rounded-xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-stone-900 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleSubCategory(cat.title)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                        aria-expanded={isSubOpen}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                          <span>{cat.title}</span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isSubOpen ? 'rotate-180 text-shubban-gold' : ''}`} />
                      </button>

                      {isSubOpen && (
                        <div className="px-3 pb-2.5 pt-1 space-y-1 bg-stone-50/50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800/60 text-xs">
                          {cat.items.map((it) => {
                            const isSubActive = pathname === it.href;
                            return (
                              <Link
                                key={it.label}
                                href={it.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${isSubActive
                                  ? 'bg-shubban-green/15 text-shubban-green dark:text-shubban-gold font-bold'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                                  } ${it.highlight ? 'text-shubban-gold font-semibold' : ''}`}
                              >
                                <span>{it.label}</span>
                                <ChevronRight className="w-3 h-3 text-stone-300 dark:text-stone-600" />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Main Navigation Links (All 10 items) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-3 block">
              প্রধান মেনুসমূহ
            </span>
            <div className="space-y-1 pt-1">
              {MAIN_NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                const Icon = getNavLinkIcon(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${isActive
                      ? 'bg-shubban-green text-shubban-gold font-bold shadow-sm'
                      : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                      }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-shubban-gold' : 'text-stone-400'}`} />
                    <span className="flex-1 truncate">{link.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-shubban-gold" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 3. Member & Service Hub Links */}
          <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-3 block">
              সেবা ও কমিউনিটি
            </span>
            <Link
              href="/donations"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-100/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-500" />
                <span>আস-সুন্নাহ ও শুব্বান সদকাহ ফান্ড</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
            </Link>

            <Link
              href="/seller/apply"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50 hover:bg-amber-100/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" />
                <span>মার্কেটপ্লেসে বিক্রেতা হোন</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </Link>

            <Link
              href="/submit"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-shubban-gold bg-shubban-green/10 rounded-xl border border-shubban-gold/20 hover:bg-shubban-green/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4" />
                <span>বই ও প্রবন্ধ জমা দিন</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-shubban-gold" />
            </Link>

            <Link
              href="/membership"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50 hover:bg-emerald-100/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>সদস্যপদ প্ল্যানসমূহ</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>

          {/* 4. User Profile & Account Action Section */}
          <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800">
            {user ? (
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-shubban-green text-shubban-gold font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-stone-400 block truncate font-mono">
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Mobile Workspaces Switcher */}
                {user.workspaces && user.workspaces.length > 1 && (
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      ওয়ার্কস্পেস সুইচ করুন:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {user.workspaces.map((ws: any) => (
                        <Link
                          key={ws.key}
                          href={ws.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-1 px-2 rounded-lg bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 text-[11px] font-medium text-stone-700 dark:text-stone-300 truncate text-center flex items-center justify-center gap-1"
                        >
                          {ws.key === 'admin' || ws.key === 'staff' ? (
                            <ShieldCheck className="w-3 h-3 text-amber-500" />
                          ) : ws.key === 'advertiser' ? (
                            <Megaphone className="w-3 h-3 text-amber-600" />
                          ) : ws.key === 'publisher' ? (
                            <Building2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <UserIcon className="w-3 h-3 text-stone-400" />
                          )}
                          <span className="truncate">{ws.title.split(' ')[0]}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60 dark:border-stone-800">
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-shubban-gold/15 hover:bg-shubban-gold/25 text-shubban-gold font-bold text-xs text-center transition-colors"
                  >
                    ড্যাশবোর্ড
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await logout();
                      router.push('/');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>লগআউট</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 px-3 text-center rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow-sm transition-all"
                >
                  লগইন করুন
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 px-3 text-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-xs border border-stone-200 dark:border-stone-700 transition-all"
                >
                  নতুন অ্যাকাউন্ট
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/80 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between flex-shrink-0">
          <span>হেল্পলাইন: +৮৮০ ১৭১১-০০০০০০</span>
          <span className="text-[10px] text-stone-400">শুব্বান লাইব্রেরী</span>
        </div>
      </aside>
    </>
  );
}
