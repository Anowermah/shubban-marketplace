import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DonationFormClient from '@/components/donations/DonationFormClient';
import { Heart, Users, Target, Calendar, Share2, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { formatTaka, toBengaliNumber, formatBengaliDate } from '@/lib/utils';

interface CampaignDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { slug } = params;

  const campaign = await prisma.donationCampaign.findUnique({
    where: { slug },
    include: {
      donations: {
        where: { paymentStatus: 'PAID' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          donorName: true,
          amount: true,
          createdAt: true,
          isAnonymous: true,
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const percent = Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-stone-500 flex items-center gap-2">
        <Link href="/" className="hover:text-shubban-green">হোম</Link>
        <span>/</span>
        <Link href="/donations" className="hover:text-shubban-green">সদকাহ ও দান তহবিল</Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 font-semibold truncate max-w-sm">
          {campaign.title}
        </span>
      </nav>

      {/* Main Grid: Left Campaign Story, Right Donation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Story & Progress (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-shubban-green text-shubban-gold border border-shubban-gold/30">
              {campaign.category === 'RELIEF' && 'জরুরি মানবিক সহায়তা'}
              {campaign.category === 'QURAN_DISTRIBUTION' && 'বিনামূল্যে কুরআন বিতরণ'}
              {campaign.category === 'WATER_WELL' && 'সুপেয় পানির নলকূপ প্রকল্প'}
              {campaign.category === 'WINTER_AID' && 'শীতবস্ত্র বিতরণ'}
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {campaign.title}
            </h1>
          </div>

          {/* Featured Image */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-md">
            <img
              src={campaign.coverImage}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Goal & Raised Status Card */}
          <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-stone-400 block">মোট সংগৃহীত অনুদান</span>
                <span className="font-serif text-3xl font-bold text-shubban-green dark:text-shubban-gold">
                  {formatTaka(campaign.raisedAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-400 block">লক্ষ্যমাত্রা</span>
                <span className="font-serif text-xl font-bold text-stone-700 dark:text-stone-300">
                  {formatTaka(campaign.goalAmount)}
                </span>
              </div>
            </div>

            {/* Progress line */}
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-shubban-green to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-shubban-gold" />
                <span>{toBengaliNumber(campaign.donorCount)} জন সম্মানিত দাতা</span>
              </span>
              <span className="font-bold text-shubban-gold font-mono">
                {toBengaliNumber(percent)}% সম্পন্ন
              </span>
            </div>
          </div>

          {/* Campaign Case Story */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              প্রকল্পের প্রেক্ষাপট ও পূর্ণ বিবরণ
            </h3>
            <div className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed font-serif space-y-4 whitespace-pre-line select-text">
              <p>{campaign.description}</p>
              {campaign.story && <p>{campaign.story}</p>}
            </div>
          </div>

          {/* Recent Donors List */}
          <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-shubban-gold" />
              <span>সাম্প্রতিক দাতাগণ ({toBengaliNumber(campaign.donations.length)})</span>
            </h3>

            {campaign.donations.length === 0 ? (
              <p className="text-xs text-stone-500 italic">এখনও কোনো অনুদান জমা পড়েনি। আপনি প্রথম দাতা হিসেবে বরকতময় অংশীদার হোন।</p>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {campaign.donations.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center font-bold">
                        {d.isAnonymous ? 'স' : d.donorName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">
                          {d.donorName}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {formatBengaliDate(d.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-shubban-green dark:text-shubban-gold">
                      {formatTaka(d.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Donation Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <DonationFormClient
              campaignId={campaign.id}
              campaignTitle={campaign.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

