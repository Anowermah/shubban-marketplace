import React from 'react';
import type { Metadata, Viewport } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MainPwaManager from '@/components/pwa/MainPwaManager';
import FloatingIslamicAiWidget from '@/components/islamic-ai/FloatingIslamicAiWidget';
import FloatingAdPopup from '@/components/ads/FloatingAdPopup';
import ScrollToTop from '@/components/layout/ScrollToTop';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#C49A45',
};

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shubban Libery',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/main/apple-touch-icon.png',
  },
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
      <FloatingIslamicAiWidget />
      <FloatingAdPopup />
      <ScrollToTop />
      <MainPwaManager />
    </>
  );
}
