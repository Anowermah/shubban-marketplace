import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CentralRightsClient from './CentralRightsClient';

export const metadata: Metadata = {
  title: 'সেন্ট্রাল কপিরাইট ও লাইসেন্স ব্যবস্থাপনা | শুব্বান প্রকাশনা প্রশাসন',
  description: 'সকল প্রকাশনার কপিরাইট স্বত্বাধিকার, লিগ্যাল লাইসেন্স ও টেকডাউন মনিটরিং',
};

export const dynamic = 'force-dynamic';

export default async function CentralRightsPage() {
  const rightsRecords = await prisma.publicationRights.findMany({
    include: {
      magazine: {
        select: {
          id: true,
          title: true,
          slug: true,
          themeColor: true,
          publisher: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const formattedRights = rightsRecords.map((r) => ({
    id: r.id,
    magazineId: r.magazineId || '',
    rightsHolder: r.rightsHolder,
    licenseType: r.licenseType,
    allowPdfHosting: r.allowPdfHosting,
    attributionRequirement: r.attributionRequirement,
    takedownStatus: r.takedownStatus,
    notes: r.notes,
    copyrightNotice: r.copyrightNotice,
    updatedAt: r.updatedAt.toISOString(),
    magazine: r.magazine || {
      id: '',
      title: 'অজ্ঞাত সাময়িকী',
      slug: '',
      themeColor: '#0f3e2e',
      publisher: null,
    },
  }));

  return <CentralRightsClient initialRights={formattedRights} />;
}
