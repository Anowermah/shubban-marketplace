import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUserWithProfile } from '@/lib/auth';
import {
  User,
  Library,
  ShoppingCart,
  Bookmark,
  Bell,
  Settings,
  ShieldCheck,
  Clock,
  MapPin,
  Heart,
  Star,
  Award,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserWithProfile();

  if (!user) {
    redirect('/login?redirect=/account');
  }

  const menuItems = [
    { label: 'ড্যাশবোর্ড', href: '/account', icon: User },
    { label: 'অর্ডারসমূহ', href: '/account/orders', icon: ShoppingCart },
    { label: 'সংরক্ষিত ঠিকানা', href: '/account/addresses', icon: MapPin },
    { label: 'পছন্দের তালিকা', href: '/account/wishlist', icon: Heart },
    { label: 'আমার রিভিউ', href: '/account/reviews', icon: Star },
    { label: 'ডিজিটাল লাইব্রেরী', href: '/account/library', icon: Library },
    { label: 'পড়ার ইতিহাস', href: '/account/reading-history', icon: Clock },
    { label: 'সাবস্ক্রিপশন', href: '/account/subscriptions', icon: Award },
    { label: 'বিজ্ঞপ্তি', href: '/account/notifications', icon: Bell },
    { label: 'প্রোফাইল সেটিংস', href: '/account/settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali">
      {/* Top Banner with User identity */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-shubban-green text-shubban-gold font-serif font-bold text-2xl flex items-center justify-center border-2 border-shubban-gold shadow shrink-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                fill
                sizes="64px"
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
                {user.name}
              </h1>
              {user.username && (
                <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                  @{user.username}
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 mt-0.5">
              {user.email} {user.phone ? `• ${user.phone}` : ''}
            </p>

            <div className="mt-2 flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-shubban-gold/15 text-shubban-gold border border-shubban-gold/30">
                {user.membershipTier === 'DIGITAL'
                  ? 'ডিজিটাল সদস্য (Digital Member)'
                  : user.membershipTier === 'PREMIUM'
                  ? 'প্রিমিয়াম স্কলার (Premium Member)'
                  : user.membershipTier === 'INSTITUTIONAL'
                  ? 'প্রাতিষ্ঠানিক সদস্য'
                  : 'সাধারণ মুক্ত সদস্য (Free Member)'}
              </span>

              {user.role !== 'REGISTERED_MEMBER' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold text-xs shadow flex items-center gap-2 shrink-0 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-shubban-gold" />
            <span>অ্যাডমিন ড্যাশবোর্ড</span>
          </Link>
        )}
      </div>

      {/* Grid: Navigation Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-3 shadow-sm space-y-1 text-xs">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-shubban-green hover:text-shubban-gold transition-colors group"
                >
                  <Icon className="w-4 h-4 text-stone-400 group-hover:text-shubban-gold transition-colors" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}
