import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Heart, Users, Target, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export const metadata = {
  title: 'দান ও সদকাহ তহবিল — শুব্বান চ্যারিটি উইং | As-Sunnah Inspired Charity',
  description: 'জরুরি মানবিক ত্রাণ, সুবিধাবঞ্চিতদের মাঝে কুরআন বিতরণ, নলকূপ স্থাপন ও শীতবস্ত্র সহায়তা প্রকল্পে আপনার পবিত্র সদকাহ প্রদান করুন।',
};

interface DonationsPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function DonationsPage({ searchParams }: DonationsPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 9;

  const [stats, totalCampaigns, campaigns] = await Promise.all([
    prisma.donationCampaign.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { raisedAmount: true, donorCount: true },
    }),
    prisma.donationCampaign.count({ where: { status: 'ACTIVE' } }),
    prisma.donationCampaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalRaised = stats._sum.raisedAmount || 0;
  const totalDonors = stats._sum.donorCount || 0;
  const totalPages = Math.ceil(totalCampaigns / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-shubban-green via-[#174e40] to-shubban-green text-shubban-ivory p-8 sm:p-14 shadow-xl border border-shubban-gold/30">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-shubban-gold/20 text-shubban-gold border border-shubban-gold/40">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>আস-সুন্নাহ ও শুব্বান সদকায়ে জারিয়া ফান্ড</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight text-white">
            “তোমরা যা ভালোবাসো তা থেকে ব্যয় না করা পর্যন্ত কখনো পুণ্য লাভ করতে পারবে না।”
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-sans leading-relaxed">
            পবিত্র আল-কুরআনের নির্দেশনায় ও সুন্নাহর আলোকে পরিচালিত আমাদের উন্মুক্ত দাতব্য ফান্ডে আপনার দান ও যাকাত পৌঁছে দিন দেশের সবচেয়ে অসহায় মানুষের দ্বারে।
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/15">
            <div>
              <span className="text-[11px] text-stone-300 block">মোট সংগৃহীত অনুদান</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-shubban-gold">
                {formatTaka(totalRaised)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-300 block">সম্মানিত দাতা সংখ্যা</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-white">
                {toBengaliNumber(totalDonors)} জন
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] text-stone-300 block">সক্রিয় দাতব্য প্রকল্প</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-400">
                {toBengaliNumber(campaigns.length)}টি
              </span>
            </div>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <Heart className="w-96 h-96 text-shubban-gold" />
        </div>
      </div>

      {/* Trust & Transparency Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-shubban-darkCard p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm text-xs text-stone-700 dark:text-stone-300">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <strong className="block text-stone-900 dark:text-stone-100 font-semibold">১০০% স্বচ্ছ হিসাব ও রসিদ</strong>
            <span className="text-stone-500">প্রতিটি অনুদানের তাৎক্ষণিক ডিজিটাল ভেরিফায়েড রসিদ প্রদান</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-shubban-gold flex-shrink-0" />
          <div>
            <strong className="block text-stone-900 dark:text-stone-100 font-semibold">দাতার পূর্ণ গোপনীয়তা</strong>
            <span className="text-stone-500">চাইলে নাম প্রকাশ না করে সম্পূর্ণ গোপনে সদকাহ করার সুযোগ</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <strong className="block text-stone-900 dark:text-stone-100 font-semibold">নির্দিষ্ট খাতে ব্যয় নিশ্চিতকরণ</strong>
            <span className="text-stone-500">আপনার দান করা টাকা সরাসরি নির্বাচিত প্রকল্পেই খরচ করা হয়</span>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-6">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
            চলমান সদকাহ ও দাতব্য প্রকল্পসমূহ
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            আপনার পছন্দের খাতে সুবিধাজনক যেকোনো পরিমাণ দান করুন
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const percent = Math.min(100, Math.round((camp.raisedAmount / camp.goalAmount) * 100));

            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                    <img
                      src={camp.coverImage}
                      alt={camp.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-shubban-green/90 backdrop-blur-sm text-shubban-gold text-[11px] font-bold px-3 py-1 rounded-full border border-shubban-gold/30">
                      {camp.category === 'RELIEF' && 'জরুরি ত্রাণ ও খাদ্য'}
                      {camp.category === 'QURAN_DISTRIBUTION' && 'কুরআন বিতরণ'}
                      {camp.category === 'WATER_WELL' && 'সুপেয় পানির প্রকল্প'}
                      {camp.category === 'WINTER_AID' && 'শীতবস্ত্র বিতরণ'}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 leading-snug line-clamp-2">
                      <Link href={`/donations/${camp.slug}`} className="hover:text-shubban-gold">
                        {camp.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                      {camp.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-shubban-green dark:text-shubban-gold">
                          উত্তোলিত: {formatTaka(camp.raisedAmount)}
                        </span>
                        <span className="text-stone-400 font-mono">
                          {toBengaliNumber(percent)}%
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-shubban-green to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-stone-400" />
                          {toBengaliNumber(camp.donorCount)} জন দাতা
                        </span>
                        <span>লক্ষ্য: {formatTaka(camp.goalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/donations/${camp.slug}`}
                    className="w-full py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <Heart className="w-4 h-4 text-shubban-gold fill-current" />
                    <span>এখনই দান করুন</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCampaigns}
          itemsPerPage={pageSize}
          itemName="প্রকল্প"
          pageUrlTemplate="/donations?page=[page]"
        />
      </div>
    </div>
  );
}

