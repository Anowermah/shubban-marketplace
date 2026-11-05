import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import AddressBookClient from '@/components/account/AddressBookClient';
import { MapPin } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountAddressesPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-shubban-gold" />
          <span>সংরক্ষিত ডেলিভারি ঠিকানা খাতা (Address Book)</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          মোট {toBengaliNumber(addresses.length)}টি ঠিকানা সংরক্ষিত। চেকআউটে দ্রুত বই সরবরাহের জন্য আপনার ঠিকানা পরিচালনা করুন।
        </p>
      </div>

      <AddressBookClient initialAddresses={addresses} />
    </div>
  );
}

