import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Compass,
  Download,
  FileCheck,
  Search,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import ResourceCardClient from './ResourceCardClient';

export const metadata = {
  title: 'ইসলামিক রিসোর্স ও পাঠ্যক্রম — শুব্বান ডিজিটাল লাইব্রেরি',
  description:
    'আকীদা, ফিকহ, তাফসীর, হাদিস, সীরাত ও সমকালীন দাওয়াহ বিষয়ক মুক্ত ইসলামিক ই-বুক, অডিও লেকচার, ইনফোগ্রাফিক এবং শিক্ষামূলক গবেষণা সামগ্রী।',
};

const TOPIC_LABELS: Record<string, string> = {
  ALL: 'সকল বিষয়',
  AQEEDAH: 'আকীদা ও ঈমান',
  FIQH: 'ফিকহ ও মাসায়েল',
  TAFSEER: 'কুরআন ও তাফসীর',
  HADITH: 'হাদিস ও সুন্নাহ',
  SEERAH: 'সীরাতুন্নবী সা.',
  ARABIC_LANGUAGE: 'আরবি ভাষা শিক্ষা',
  TAJWEED: 'তাজবীদ ও কিরাত',
  CONTEMPORARY: 'সমকালীন চিন্তাধারা',
};

const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'সকল ফরম্যাট',
  EBOOK: 'ই-বুক (E-Book)',
  AUDIO_LECTURE: 'অডিও লেকচার',
  INFOGRAPHIC: 'ইনফোগ্রাফিক চার্ট',
  RESEARCH_PAPER: 'গবেষণাপত্র',
  WORKSHEET: 'ওয়ার্কশিট',
  CURRICULUM: 'সিলেবাস ও পাঠ্যক্রম',
};

interface ResourcesPageProps {
  searchParams: {
    topic?: string;
    category?: string;
    search?: string;
  };
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const { topic = 'ALL', category = 'ALL', search } = searchParams;

  const where: any = {};
  if (topic && topic !== 'ALL') {
    where.topic = topic;
  }
  if (category && category !== 'ALL') {
    where.category = category;
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { authorName: { contains: search } },
    ];
  }

  const [resources, totalCount] = await Promise.all([
    prisma.islamicResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.islamicResource.count(),
  ]);

  const totalDownloads = resources.reduce((sum, r) => sum + r.downloads, 0);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-bengali text-stone-900 dark:text-stone-100">
      {/* Header Banner */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>মুক্ত উন্মুক্ত ইসলামিক শিক্ষা ও গবেষণা ভাণ্ডার</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                ইসলামিক রিসোর্স ও পাঠ্যক্রম
              </h1>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
                বিশুদ্ধ আকিদা, দৈনন্দিন ফিকহ, সুন্নাহ চর্চা এবং মাদরাসা ও স্কুলের জন্য প্রয়োজনীয় উন্মুক্ত ইসলামিক পাঠ্যক্রম, ইনফোগ্রাফিক এবং অডিও লেকচার সংকলন।
              </p>
            </div>

            <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <div className="text-right">
                <div className="text-xs text-stone-500">মোট রিসোর্স</div>
                <div className="text-2xl font-serif font-bold text-shubban-gold">
                  {toBengaliNumber(totalCount)}টি
                </div>
              </div>
              <div className="h-8 w-px bg-stone-300 dark:bg-stone-700" />
              <div className="text-right">
                <div className="text-xs text-stone-500">মোট ডাউনলোড</div>
                <div className="text-2xl font-serif font-bold text-shubban-green">
                  {toBengaliNumber(totalDownloads)}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Topic Filters */}
          <div className="mt-8 space-y-4">
            <form method="GET" action="/resources" className="relative max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="রিসোর্স, লেখক বা বিষয় অনুসন্ধান..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:ring-2 focus:ring-shubban-gold/50"
              />
            </form>

            {/* Topic Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              {Object.entries(TOPIC_LABELS).map(([key, label]) => {
                const isActive = topic === key;
                const query = new URLSearchParams();
                if (key !== 'ALL') query.set('topic', key);
                if (category && category !== 'ALL') query.set('category', category);
                if (search) query.set('search', search);

                return (
                  <Link
                    key={key}
                    href={`/resources?${query.toString()}`}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-shubban-green text-shubban-gold shadow'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-[11px]">
              <span className="text-stone-400 font-medium whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3 h-3" /> ফরম্যাট:
              </span>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const isActive = category === key;
                const query = new URLSearchParams();
                if (topic && topic !== 'ALL') query.set('topic', topic);
                if (key !== 'ALL') query.set('category', key);
                if (search) query.set('search', search);

                return (
                  <Link
                    key={key}
                    href={`/resources?${query.toString()}`}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-shubban-gold text-stone-900 font-bold'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Resources Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {resources.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">
              কোনো ইসলামিক রিসোর্স পাওয়া যায়নি
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              অনুগ্রহ করে অন্য কোনো বিষয় বা ফরম্যাট নির্বাচন করুন।
            </p>
            <Link
              href="/resources"
              className="inline-block mt-4 text-xs font-bold text-shubban-gold hover:underline"
            >
              সকল রিসোর্স দেখুন &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCardClient
                key={resource.id}
                resource={resource}
                topicLabel={TOPIC_LABELS[resource.topic] || resource.topic}
                categoryLabel={CATEGORY_LABELS[resource.category] || resource.category}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

