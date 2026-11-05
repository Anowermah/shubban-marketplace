import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Heart, Printer, CheckCircle2, ShieldCheck, ArrowLeft, Download } from 'lucide-react';
import { formatTaka, toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import PrintButton from '@/components/donations/PrintButton';

interface ReceiptPageProps {
  params: {
    receiptNumber: string;
  };
}

export default async function DonationReceiptPage({ params }: ReceiptPageProps) {
  const { receiptNumber } = params;

  const receipt = await prisma.donationReceipt.findUnique({
    where: { receiptNumber },
    include: {
      donation: {
        include: {
          campaign: true,
        },
      },
    },
  });

  if (!receipt) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 font-bengali space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/donations"
          className="text-xs text-stone-500 hover:text-shubban-green flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল দান প্রকল্পে ফিরুন</span>
        </Link>

        <PrintButton />
      </div>

      {/* Official Printable Receipt Card */}
      <div className="bg-white text-stone-900 border-2 border-shubban-gold/40 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden print:p-6 print:border-none print:shadow-none">
        {/* Background Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-20deg]">
          <span className="font-serif text-8xl font-bold uppercase tracking-widest text-shubban-green">
            SHUBBAN CHARITY
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-stone-100 gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-3 h-3 rounded-full bg-shubban-gold"></span>
              <h1 className="font-serif font-bold text-2xl text-shubban-green tracking-wide">
                শুব্বান ওয়েলফেয়ার ট্রাস্ট
              </h1>
            </div>
            <p className="text-xs text-stone-500">
              আস-সুন্নাহ ও শুব্বান সমন্বিত সদকায়ে জারিয়া ও মানবিক সহায়তা তহবিল
            </p>
            <span className="text-[10px] text-stone-400 block">
              রেজিস্ট্রেশন নং: SWT-BD-2026/88 • ঢাকা, বাংলাদেশ
            </span>
          </div>

          <div className="text-center sm:text-right">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              পরিশোধিত অনুদান রসিদ
            </span>
            <span className="block font-mono text-xs font-bold text-stone-700 mt-1">
              রসিদ নং: {receipt.receiptNumber}
            </span>
            <span className="block text-[11px] text-stone-400">
              তারিখ: {formatBengaliDate(receipt.issuedAt)}
            </span>
          </div>
        </div>

        {/* Success Banner */}
        <div className="my-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <strong>আলহামদুলিল্লাহ! আপনার অনুদান সফলভাবে নিবন্ধিত হয়েছে।</strong>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              “আল্লাহর রাস্তায় এক টাকা দান করলে আল্লাহ তার বিনিময় সাতশত গুণ পর্যন্ত বৃদ্ধি করে দেন।”
            </p>
          </div>
        </div>

        {/* Receipt Details Table */}
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs border-b border-stone-100 pb-6">
            <div>
              <span className="text-stone-400 block mb-0.5">সম্মানিত দাতার নাম</span>
              <strong className="text-stone-800 text-sm font-serif">
                {receipt.donorName}
              </strong>
            </div>

            <div>
              <span className="text-stone-400 block mb-0.5">অনুদানের খাত / প্রকল্প</span>
              <strong className="text-stone-800 font-medium">
                {receipt.campaignTitle}
              </strong>
            </div>

            <div>
              <span className="text-stone-400 block mb-0.5">পেমেন্ট মেথড</span>
              <strong className="text-stone-800 font-medium">
                {receipt.paymentMethod}
              </strong>
            </div>

            <div>
              <span className="text-stone-400 block mb-0.5">ট্রানজেকশন রেফারেন্স</span>
              <strong className="font-mono text-stone-800">
                {receipt.transactionId || 'N/A'}
              </strong>
            </div>

            <div>
              <span className="text-stone-400 block mb-0.5">অনুদানের ধরন</span>
              <strong className="text-emerald-700 font-medium">
                ঐচ্ছিক সদকাহ ও চ্যারিটি
              </strong>
            </div>

            <div>
              <span className="text-stone-400 block mb-0.5">ভেরিফিকেশন স্ট্যাটাস</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                যাচাইকৃত (Verified)
              </strong>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 uppercase tracking-wider block">
                সর্বমোট গৃহীত অনুদানের পরিমাণ
              </span>
              <span className="text-xs text-stone-400 italic">
                (অংকে ও কথায় পরিশোধিত)
              </span>
            </div>
            <div className="text-right">
              <span className="font-serif text-3xl font-bold text-shubban-green">
                {formatTaka(receipt.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-semibold text-stone-700 block">
              {receipt.taxExemptInfo}
            </span>
            <p className="text-[11px] text-stone-400 max-w-sm">
              এই রসিদটি কম্পিউটার জেনারেটেড ও ডিজিটালভাবে স্বাক্ষরিত। যেকোনো প্রয়োজনে রসিদ নম্বরটি সংরক্ষণ করুন।
            </p>
          </div>

          <div className="text-center">
            <div className="w-32 border-b border-stone-400 pb-1 mx-auto font-serif font-bold text-shubban-green text-xs">
              আহমদ জুবায়ের
            </div>
            <span className="text-[10px] text-stone-400 block mt-1">
              পরিচালক, হিসাব ও দান তহবিল
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

