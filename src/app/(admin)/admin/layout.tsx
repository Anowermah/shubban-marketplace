import type { Metadata, Viewport } from 'next';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#D97706',
};

export const metadata: Metadata = {
  title: 'শুব্বান অ্যাডমিন কনসোল — Enterprise Management',
  description: 'শুব্বান লাইব্রেরী এন্টারপ্রাইজ অ্যাডমিন ও সেন্ট্রাল ম্যানেজমেন্ট কনসোল',
  manifest: '/admin/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shubban Admin',
  },
  icons: {
    icon: '/icons/admin/favicon-32x32.png',
    apple: '/icons/admin/apple-touch-icon.png',
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
