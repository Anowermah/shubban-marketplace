import React from 'react';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';
import Link from 'next/link';
import {
  Megaphone,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import AdvertiserPortalClient from '@/components/advertiser/AdvertiserPortalClient';
import AdvertiserOnboardingForm from '@/components/advertiser/AdvertiserOnboardingForm';

export const revalidate = 0; // Dynamic server component for Advertiser Portal

export default async function AdvertiserPortalPage() {
  const session = await getVerifiedSessionUser();

  // 1. If not logged in, render the high-conversion public advertiser landing page
  if (!session) {
    const placements = await prisma.adPlacement.findMany({
      where: { status: 'ACTIVE' },
      take: 6,
    });
    const packages = await prisma.adPricingPackage.findMany({
      where: { status: 'ACTIVE' },
      take: 4,
    });

    return (
      <div className="font-bengali space-y-16 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span>শুব্বান লাইব্রেরী ফার্স্ট-পার্টি বিজ্ঞাপন নেটওয়ার্ক</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100 max-w-3xl mx-auto leading-tight">
            দ্বীনদার ও প্রজ্ঞাবান পাঠকদের কাছে আপনার প্রতিষ্ঠান ও প্রকাশনাকে তুলে ধরুন
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            ইসলামিক সাহিত্য, বইমেলা, দ্বীনি শিক্ষাপ্রতিষ্ঠান ও ইসলামিক পণ্যের জন্য দেশের অন্যতম বিশ্বস্ত ও পরিচ্ছন্ন বিজ্ঞাপন মাধ্যম।
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>বিজ্ঞাপনদাতা হিসেবে যোগ দিন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login?redirect=/advertiser"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-sm border border-stone-200 dark:border-stone-700 transition-all"
            >
              লগইন করুন
            </Link>
          </div>
        </div>

        {/* Core Value Props */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">টার্গেটেড অডিয়েন্স</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                বইপ্রেমী, আলেম-উলামা, গবেষক ও সচেতন মুসলিম পরিবারের কাছে সরাসরি পৌঁছানোর শতভাগ প্রামাণ্য সুযোগ।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">হালাল ও রুচিশীল প্ল্যাটফর্ম</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                কোনো অনাকাঙ্ক্ষিত পপ-আপ, তৃতীয় পক্ষের বিজ্ঞাপন বা অস্বস্তিকর কনটেন্ট নেই। সম্পূর্ণ সুশৃঙ্খল ও পবিত্র পরিবেশ।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">রিয়েল-টাইম মেট্রিক্স</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                প্রতিটি বিজ্ঞাপনের প্রকৃত ইম্প্রেশন, ভিউয়েবিলিটি রেট ও ক্লিকে সম্পূর্ণ স্বচ্ছতা এবং অটোমেটেড ইনভয়েস ব্যবস্থা।
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged in: Check if advertiser organization exists for this user
  const advertiser = await prisma.advertiser.findFirst({
    where: {
      OR: [
        { ownerId: session.id },
        { members: { some: { userId: session.id } } },
      ],
    },
  });

  // If no advertiser organization, show onboarding wizard
  if (!advertiser) {
    return <AdvertiserOnboardingForm defaultEmail={session.email} defaultName={session.name} />;
  }

  // Load available placements & packages for campaign creation
  const availablePlacements = await prisma.adPlacement.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { pageType: 'asc' },
  });

  const availablePackages = await prisma.adPricingPackage.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { price: 'asc' },
  });

  return (
    <AdvertiserPortalClient
      initialAdvertiser={advertiser}
      availablePlacements={availablePlacements}
      availablePackages={availablePackages}
    />
  );
}

