import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminBannersManager from '@/components/admin/AdminBannersManager';

export const revalidate = 0; // Dynamic server component for administrative dashboard

export default async function AdminBannersPage() {
  const slides = await prisma.heroSlide.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <AdminBannersManager
      initialSlides={slides.map((s) => ({
        id: s.id,
        badge: s.badge,
        badgeIcon: s.badgeIcon,
        headline: s.headline,
        subhead: s.subhead,
        couponCode: s.couponCode,
        primaryCtaText: s.primaryCtaText,
        primaryCtaLink: s.primaryCtaLink,
        secondaryCtaText: s.secondaryCtaText,
        secondaryCtaLink: s.secondaryCtaLink,
        bgGradient: s.bgGradient,
        imageUrl: s.imageUrl,
        displayOrder: s.displayOrder,
        isPublished: s.isPublished,
      }))}
    />
  );
}
