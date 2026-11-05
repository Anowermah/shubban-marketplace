import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminHomepageManager from '@/components/admin/AdminHomepageManager';

export const revalidate = 0; // Dynamic server component for administrative dashboard

export default async function AdminHomepagePage() {
  const sections = await prisma.homepageSection.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <AdminHomepageManager
      initialSections={sections.map((s) => ({
        id: s.id,
        sectionKey: s.sectionKey,
        title: s.title,
        subtitle: s.subtitle,
        isEnabled: s.isEnabled,
        displayOrder: s.displayOrder,
        badge: s.badge,
        viewAllUrl: s.viewAllUrl,
        config: s.config,
      }))}
    />
  );
}
