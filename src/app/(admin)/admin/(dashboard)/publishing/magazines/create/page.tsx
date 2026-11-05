import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CentralMagazineCreateClient from './CentralMagazineCreateClient';

export const metadata: Metadata = {
  title: 'নতুন প্রকাশনা বা সাময়িকী তৈরি | শুব্বান প্রকাশনা প্রশাসন',
  description: 'নতুন ডিজিটাল সাময়িকী বা জার্নাল নিবন্ধন এবং অটোমেটেড ওয়ার্কস্পেস ইনিশিয়ালাইজেশন',
};

export const dynamic = 'force-dynamic';

export default async function CentralMagazineCreatePage() {
  const [publishers, categories, users] = await Promise.all([
    prisma.publisher.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, nameEn: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN', 'SELLER'] },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <CentralMagazineCreateClient
      publishers={publishers}
      categories={categories}
      users={users}
    />
  );
}

