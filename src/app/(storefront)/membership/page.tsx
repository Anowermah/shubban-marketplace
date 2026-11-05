import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import MembershipSubscribeButton from '@/components/membership/MembershipSubscribeButton';
import { Check, Sparkles, Award, Shield, BookOpen, GraduationCap, Users } from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';

export default async function MembershipPage() {
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-16">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-shubban-gold/20 text-shubban-gold border border-shubban-gold/40">
          <Award className="w-3.5 h-3.5" />
          <span>শুব্বান জ্ঞান সাধক মেম্বারশিপ ২০২৬</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100">
          আপনার পাঠ ও গবেষণার উপযোগী প্ল্যান বেছে নিন
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
          ডিজিটাল লাইব্রেরীর সমস্ত দুর্লভ বই, ক্লাসিক উপন্যাস, সাময়িকী এবং গবেষণাপত্রে পূর্ণ ইন-ব্রাউজার প্রবেশাধিকার পান। কোনো দীর্ঘমেয়াদি বাধ্যবাধকতা নেই, যেকোনো সময় বাতিলযোগ্য।
        </p>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => {
          const features: string[] = JSON.parse(plan.features || '[]');
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                plan.isPopular
                  ? 'bg-shubban-green text-shubban-ivory shadow-xl ring-2 ring-shubban-gold border border-shubban-gold'
                  : 'bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-shubban-gold text-shubban-green-950 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
                  সর্বাধিক জনপ্রিয়
                </div>
              )}

              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    plan.isPopular ? 'text-shubban-gold' : 'text-stone-500'
                  }`}
                >
                  {plan.nameEn}
                </span>

                <h3
                  className={`font-serif font-bold text-2xl ${
                    plan.isPopular ? 'text-white' : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {plan.name}
                </h3>

                <p
                  className={`text-xs mt-2 min-h-[36px] leading-relaxed ${
                    plan.isPopular ? 'text-shubban-ivory/80' : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="my-6 pb-6 border-b border-stone-200/40">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold font-mono ${
                        plan.isPopular ? 'text-shubban-gold' : 'text-shubban-green dark:text-shubban-gold'
                      }`}
                    >
                      {plan.priceMonthly === 0 ? '৳ ০' : formatTaka(plan.priceMonthly)}
                    </span>
                    <span className={`text-xs ${plan.isPopular ? 'text-shubban-ivory/70' : 'text-stone-400'}`}>
                      /মাস
                    </span>
                  </div>
                  {plan.priceYearly > 0 && (
                    <span className={`text-[11px] block mt-1 ${plan.isPopular ? 'text-shubban-gold' : 'text-stone-500'}`}>
                      অথবা বাৎসরিক এককালীন {formatTaka(plan.priceYearly)}
                    </span>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 text-xs">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          plan.isPopular ? 'text-shubban-gold' : 'text-emerald-600'
                        }`}
                      />
                      <span className={plan.isPopular ? 'text-shubban-ivory/90' : 'text-stone-700 dark:text-stone-300'}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <MembershipSubscribeButton plan={plan} isPopular={plan.isPopular} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Institutional Inquiry Box */}
      <div className="bg-stone-100 dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
            বিশ্ববিদ্যালয়, কলেজ ও গ্রন্থাগারের জন্য প্রাতিষ্ঠানিক এক্সেস
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl">
            আইপি-ভিত্তিক বা প্রাতিষ্ঠানিক ডোমেন সরাসরি লগইন, শত শত গবেষকের জন্য মাল্টি-ইউজার ড্যাশবোর্ড ও ক্যাটালগ ইন্টিগ্রেশন।
          </p>
        </div>
        <Link
          href="/contact?subject=institutional"
          className="px-6 py-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow whitespace-nowrap"
        >
          প্রাতিষ্ঠানিক যোগাযোগ করুন
        </Link>
      </div>
    </div>
  );
}
