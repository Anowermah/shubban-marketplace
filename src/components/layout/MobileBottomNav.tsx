'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Library, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';
import { toBengaliNumber } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Hide mobile bottom nav on the dedicated reading page to maximize screen space
  if (pathname.startsWith('/read/')) {
    return null;
  }

  const navItems = [
    { label: 'হোম', href: '/', icon: Home },
    { label: 'বইসমূহ', href: '/books', icon: BookOpen },
    { label: 'লাইব্রেরী', href: '/digital-library', icon: Library },
    { label: 'কার্ট', href: '/cart', icon: ShoppingCart, count: totalCartCount },
    { label: 'প্রোফাইল', href: '/account', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-shubban-darkBg/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 py-1 px-2 font-bengali pb-[max(env(safe-area-inset-bottom),6px)] shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] sm:text-[11px] font-medium transition-colors relative ${
                isActive
                  ? 'text-shubban-green dark:text-shubban-gold font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-shubban-gold text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center">
                    {toBengaliNumber(item.count)}
                  </span>
                )}
              </div>
              <span className="mt-0.5 leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
