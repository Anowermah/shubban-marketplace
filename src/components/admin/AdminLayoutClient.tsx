'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  AlertTriangle,
  Smartphone,
  Download,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminBreadcrumbs from './AdminBreadcrumbs';
import AdminCommandPalette from './AdminCommandPalette';
import AdminPwaManager from '@/components/pwa/AdminPwaManager';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface AdminLayoutClientProps {
  user: {
    id: string;
    name: string;
    role: string;
    email: string;
    avatarUrl?: string | null;
  };
  children: React.ReactNode;
}

export default function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 1. Mount detection & load desktop collapsed preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('shubban_admin_sidebar_collapsed');
    if (saved !== null) {
      setDesktopCollapsed(saved === 'true');
    }
  }, []);

  const isSidebarCollapsed = mounted ? desktopCollapsed : false;

  const toggleDesktopCollapse = () => {
    const next = !desktopCollapsed;
    setDesktopCollapsed(next);
    localStorage.setItem('shubban_admin_sidebar_collapsed', String(next));
  };

  // 2. Fetch live notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/admin/notifications');
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) { }
    };
    fetchNotifs();
  }, [pathname]);

  // 3. Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) { }
  };

  // 4. Outside-click listener to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 5. Handle Logout
  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ADMIN_CACHE' });
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 font-bengali flex text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-500 selection:text-white">
      {/* Left Full-Height Responsive & Collapsible Sidebar */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleDesktopCollapse}
      />

      {/* Right Main Content Workspace (Header + Main) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        {/* Top Admin Header Navigation */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-xs transition-colors flex-shrink-0">
          <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left section: Mobile Hamburger + Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden border border-stone-200 dark:border-stone-700 flex-shrink-0 transition active:scale-95"
                aria-label={mobileSidebarOpen ? 'অ্যাডমিন সাইডবার বন্ধ করুন' : 'অ্যাডমিন সাইডবার খুলুন'}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Sidebar Collapse Toggle */}
              <button
                type="button"
                onClick={toggleDesktopCollapse}
                className="hidden lg:flex p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 flex-shrink-0 transition active:scale-95"
                title={desktopCollapsed ? 'সাইডবার প্রসারিত করুন' : 'সাইডবার সংকুচিত করুন'}
              >
                {desktopCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>

              {/* Breadcrumb Navigation */}
              <div className="min-w-0">
                <AdminBreadcrumbs />
              </div>
            </div>

          {/* Center: Command Palette Trigger (Ctrl+K) */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:border-amber-400 transition text-xs shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>দ্রুত খুঁজুন বা যান...</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-[10px] font-mono text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-600">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right section: Store Link, Theme Toggle, Notifications, Profile Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700"
              title="খুঁজুন"
            >
              <Search className="w-4 h-4 text-amber-500" />
            </button>

            {/* View Live Storefront */}
            <Link
              href="/"
              target="_blank"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition border border-stone-200 dark:border-stone-700"
              title="মূল ওয়েবসাইট নতুন ট্যাবে দেখুন"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">ওয়েবসাইট</span>
            </Link>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              suppressHydrationWarning
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition border border-stone-200 dark:border-stone-700"
              title={mounted && theme === 'dark' ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
              aria-label="Toggle Theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600 dark:text-stone-300" />
              )}
            </button>

            {/* Notifications Dropdown Container */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition border border-stone-200 dark:border-stone-700"
                title="বিজ্ঞপ্তি ও অ্যালার্ট"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? '৯+' : toBengaliNumber(unreadCount)}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden z-50 animate-fadeIn">
                  <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        সিস্টেম নোটিফিকেশন
                      </h4>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                      >
                        সব পঠিত করুন
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-stone-400">
                        কোনো নতুন নোটিফিকেশন নেই।
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition flex items-start gap-3 ${!n.isRead ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                            }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                              {n.title}
                            </span>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                              {formatBengaliDate(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-100 dark:border-stone-800 text-center">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline block"
                    >
                      সব বিজ্ঞপ্তি দেখুন &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition border border-stone-200 dark:border-stone-700"
                aria-label="User Profile Menu"
              >
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white inline-flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="hidden sm:block text-left pr-1">
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-stone-400 block -mt-0.5">
                    {user.role === 'SUPER_ADMIN' ? 'সুপার অ্যাডমিন' : 'অ্যাডমিনিস্ট্রেটর'}
                  </span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* User Dropdown Popover */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-2 z-50 animate-fadeIn text-xs">
                  {/* User Profile Summary Header */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl mb-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-stone-400 block font-mono truncate">
                      {user.email}
                    </span>
                    <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href="/admin/staff"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium transition"
                  >
                    <User className="w-4 h-4 text-stone-400" />
                    <span>প্রোফাইল ও স্টাফ ড্যাশবোর্ড</span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium transition"
                  >
                    <Settings className="w-4 h-4 text-stone-400" />
                    <span>সিস্টেম কনফিগারেশন</span>
                  </Link>

                  <Link
                    href="/admin/settings/pwa"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold transition"
                  >
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span>PWA ও অ্যাপ সেটিংস</span>
                  </Link>

                  <div className="my-1 border-t border-stone-100 dark:border-stone-800" />

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>সাইন আউট (Log Out)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* Command Palette Modal (Ctrl+K) */}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                লগআউট নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনি কি নিশ্চিত যে আপনি প্রশাসন কনসোল থেকে প্রস্থান করতে চান?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                {isLoggingOut ? 'লগআউট হচ্ছে...' : 'হ্যাঁ, লগআউট'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin PWA Manager: SW Scope /admin & Push Alerts */}
      <AdminPwaManager />
    </div>
  );
}
