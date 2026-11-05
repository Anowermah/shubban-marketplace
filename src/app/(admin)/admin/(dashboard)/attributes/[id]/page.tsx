import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  Sliders,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  Tag,
  Palette,
  Package,
  Hash,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate, formatTaka } from '@/lib/utils';
import Image from 'next/image';

export const revalidate = 0;

export default async function AdminAttributeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const attribute = await prisma.productAttribute.findUnique({
    where: { id: params.id },
    include: {
      group: true,
      values: {
        orderBy: { displayOrder: 'asc' },
      },
      assignments: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              price: true,
              stockQuantity: true,
            },
          },
        },
      },
      _count: {
        select: {
          assignments: true,
          values: true,
        },
      },
    },
  });

  if (!attribute) {
    notFound();
  }

  return (
    <div className="space-y-6 font-bengali pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <Link href="/admin" className="hover:text-shubban-primary transition-colors">
              ড্যাশবোর্ড
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/admin/attributes" className="hover:text-shubban-primary transition-colors">
              অ্যাট্রিবিউট ও ভ্যারিয়েন্ট
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-800 dark:text-stone-200 font-semibold">{attribute.name}</span>
          </div>
          <h1 className="font-serif font-bold text-2xl lg:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-shubban-gold" />
            <span>{attribute.name}</span>
            <span className="text-xs font-mono bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-xl text-stone-600 dark:text-stone-300">
              {attribute.code}
            </span>
          </h1>
        </div>

        <Link
          href="/admin/attributes"
          className="px-4 py-2 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-xs font-bold inline-flex items-center gap-2 shadow-sm hover:bg-stone-50 transition-all self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>তালিকায় ফিরে যান</span>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">ধরন (Type)</span>
          <span className="font-bold text-stone-900 dark:text-stone-100 text-base">{attribute.type}</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">গ্রুপ (Group)</span>
          <span className="font-bold text-stone-900 dark:text-stone-100 text-base">
            {attribute.group?.name || 'কোনো গ্রুপ নেই'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">মোট ভ্যালু</span>
          <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-xl">
            {toBengaliNumber(attribute.values.length)}টি
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">ব্যবহৃত পণ্য</span>
          <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-xl">
            {toBengaliNumber(attribute._count.assignments)}টি
          </span>
        </div>
      </div>

      {/* Main Details & Values Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attribute Configuration & Rules (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-shubban-darkCard p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-3">
              অ্যাট্রিবিউট স্পেসিফিকেশন
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-400 font-medium">অ্যাট্রিবিউট স্লাগ</span>
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">{attribute.slug}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-400 font-medium">ডিসপ্লে লেবেল</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {attribute.displayLabel || attribute.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-400 font-medium">ভ্যারিয়েন্ট জেনারেটর ফ্ল্যাগ</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    attribute.isVariant ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {attribute.isVariant ? 'সক্রিয় (Variant Generating)' : 'শুধুমাত্র স্পেসিফিকেশন'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-400 font-medium">স্টোরফ্রন্ট ফিল্টারে প্রদর্শন</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    attribute.useInFilter ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {attribute.useInFilter ? 'হ্যাঁ' : 'না'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-400 font-medium">প্রোডাক্ট পেইজে প্রদর্শন</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    attribute.showOnProduct ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {attribute.showOnProduct ? 'হ্যাঁ' : 'না'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-400 font-medium">আবশ্যক নির্বাচন (Required)</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    attribute.isRequired ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {attribute.isRequired ? 'আবশ্যক' : 'ঐচ্ছিক'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-100 dark:border-stone-800/60">
                <span className="text-stone-400 font-medium">তৈরির তারিখ</span>
                <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-shubban-gold" />
                  {formatBengaliDate(attribute.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-stone-400 font-medium">সর্বশেষ আপডেট</span>
                <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {formatBengaliDate(attribute.updatedAt)}
                </span>
              </div>
            </div>

            {attribute.description && (
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[11px] font-bold text-stone-400 block mb-1">বিবরণ:</span>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {attribute.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Attribute Values & Connected Products (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Values Section */}
          <div className="bg-white dark:bg-shubban-darkCard p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-shubban-gold" />
                <span>ভ্যালু তালিকা ({toBengaliNumber(attribute.values.length)}টি)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attribute.values.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {v.colorHex && (
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 shadow-xs"
                        style={{ backgroundColor: v.colorHex }}
                      />
                    )}
                    {v.swatchImage && (
                      <Image
                        src={v.swatchImage}
                        alt={v.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded object-cover border"
                      />
                    )}
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">{v.name}</span>
                      {v.code && <span className="font-mono text-[10px] text-stone-400">{v.code}</span>}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-stone-400">
                    ক্রম: #{toBengaliNumber(v.displayOrder)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Products */}
          <div className="bg-white dark:bg-shubban-darkCard p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>সংযুক্ত পণ্যসমূহ ({toBengaliNumber(attribute.assignments.length)}টি)</span>
            </h3>

            {attribute.assignments.length === 0 ? (
              <div className="p-6 text-center text-stone-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">বর্তমানে কোনো পণ্যে এই বৈশিষ্ট্যটি যুক্ত নেই।</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {attribute.assignments.map((assignment) => (
                  <div key={assignment.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Image
                        src={assignment.book.coverImage || '/placeholder-book.png'}
                        alt={assignment.book.title}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-lg object-cover border"
                      />
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          {assignment.book.title}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          মূল্য: {formatTaka(assignment.book.price)} | স্টক: {toBengaliNumber(assignment.book.stockQuantity)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/books/${assignment.book.slug}`}
                      target="_blank"
                      className="p-1.5 text-stone-400 hover:text-shubban-gold rounded-lg transition-colors"
                      title="পণ্যটি স্টোরফ্রন্টে দেখুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

