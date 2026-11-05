import React from 'react';
import { prisma } from '@/lib/prisma';
import { Truck, MapPin, CheckCircle2 } from 'lucide-react';
import { formatTaka } from '@/lib/utils';

export const revalidate = 0;

export default async function AdminShippingPage() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: ['delivery_fee_inside_dhaka', 'delivery_fee_outside_dhaka'] },
    },
  });

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const insideDhaka = settingsMap['delivery_fee_inside_dhaka'] || '60';
  const outsideDhaka = settingsMap['delivery_fee_outside_dhaka'] || '110';

  return (
    <div className="space-y-6 font-bengali">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-shubban-gold" />
            <span>শিপিং ও কুরিয়ার ডেলিভারি কনফিগারেশন (Shipping Rates)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            সারা বাংলাদেশব্যাপী জোনভিত্তিক ডেলিভারি চার্জ ও ডেলিভারি পার্টনার ইন্টিগ্রেশন।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-shubban-green dark:text-shubban-gold" />
              ঢাকা মেট্রোপলিটন এলাকা (Zone 1)
            </span>
            <span className="px-3 py-1 rounded-full font-mono font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold">
              ৳{insideDhaka}
            </span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            আনুমানিক সময়: ২-৩ কার্যদিবস। রেডএক্স, সুন্দরবন ও পাঠাও কুরিয়ার সাপোর্ট।
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-shubban-green dark:text-shubban-gold" />
              ঢাকার বাইরে সারাদেশে (Zone 2 - Countrywide)
            </span>
            <span className="px-3 py-1 rounded-full font-mono font-bold bg-shubban-green/10 text-shubban-green dark:text-shubban-gold">
              ৳{outsideDhaka}
            </span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            আনুমানিক সময়: ৩-৫ কার্যদিবস। জেলা ও উপজেলা সদর হোম ডেলিভারি।
          </p>
        </div>
      </div>
    </div>
  );
}

