import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Building2,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Mail,
  Phone,
  Globe,
  Share2,
  Calendar,
  Briefcase,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Sparkles,
  FileText,
  BookmarkCheck,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate, formatTaka } from '@/lib/utils';

export const revalidate = 0;

interface AdminPublisherDetailsPageProps {
  params: {
    id: string;
  };
}

const PUBLISHER_TYPES: { [key: string]: { label: string; bg: string; text: string } } = {
  COMMERCIAL: { label: 'বাণিজ্যিক প্রকাশনী', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' },
  ISLAMIC_FOUNDATION: { label: 'ইসলামিক ফাউন্ডেশন', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
  ACADEMIC_PRESS: { label: 'প্রাতিষ্ঠানিক প্রেস', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300' },
  GOVERNMENT: { label: 'সরকারি প্রকাশনা', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
  INDEPENDENT: { label: 'স্বাধীন / স্বতন্ত্র', bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-700 dark:text-stone-300' },
};

const ORG_TYPES: { [key: string]: string } = {
  LIMITED: 'লিমিটেড কোম্পানি',
  PROPRIETORSHIP: 'একমালিকানা (Proprietorship)',
  TRUST: 'ট্রাস্ট ও ওয়াকফ',
  SOCIETY: 'সোসাইটি / সমিতি',
  NGO: 'এনজিও / অলাভজনক সংস্থা',
};

export default async function AdminPublisherDetailsPage({ params }: AdminPublisherDetailsPageProps) {
  const publisher = await prisma.publisher.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
    },
    include: {
      _count: {
        select: {
          books: true,
          magazines: true,
        },
      },
      books: {
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          author: { select: { id: true, name: true, slug: true } },
        },
      },
      magazines: {
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!publisher) {
    notFound();
  }

  // Calculate Profile Completion Score
  let score = 0;
  const totalCriteria = 10;
  if (publisher.name) score++;
  if (publisher.logoUrl) score++;
  if (publisher.description) score++;
  if (publisher.contactPerson) score++;
  if (publisher.email || publisher.phone) score++;
  if (publisher.address || publisher.city) score++;
  if (publisher.website) score++;
  if (publisher.regNumber || publisher.establishedYear) score++;
  if (publisher.facebook || publisher.linkedin || publisher.youtube) score++;
  if (publisher.seoTitle || publisher.seoDescription) score++;
  const profileCompletion = Math.round((score / totalCriteria) * 100);

  const totalPublications = publisher._count.books + publisher._count.magazines;
  const typeMeta = PUBLISHER_TYPES[publisher.publisherType || 'COMMERCIAL'] || {
    label: publisher.publisherType || 'বাণিজ্যিক',
    bg: 'bg-stone-100 dark:bg-stone-800',
    text: 'text-stone-700 dark:text-stone-300',
  };

  return (
    <div className="space-y-6 font-bengali pb-20">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <Link
          href="/admin/publishers"
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-shubban-gold transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>প্রকাশনী তালিকায় ফিরে যান</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/books?publisher=${publisher.slug}`}
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>লাইভ ক্যাটালগ দেখুন</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>
        </div>
      </div>

      {/* Publisher Hero Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
              {publisher.logoUrl ? (
                <img src={publisher.logoUrl} alt={publisher.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-stone-400" />
              )}
            </div>

            {/* Title & Badges */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
                  {publisher.name}
                </h1>
                {publisher.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ভেরিফাইড</span>
                  </span>
                )}
                {publisher.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>ফিচার্ড</span>
                  </span>
                )}
              </div>

              {publisher.nameEn && (
                <p className="text-xs text-stone-400 font-sans">{publisher.nameEn}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeMeta.bg} ${typeMeta.text}`}>
                  {typeMeta.label}
                </span>
                <span className="font-mono text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                  /{publisher.slug}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    publisher.status === 'ACTIVE' || publisher.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                >
                  {publisher.status === 'ACTIVE' || publisher.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>সক্রিয় অ্যাকাউন্ট</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>নিষ্ক্রিয় অ্যাকাউন্ট</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Completion Box */}
          <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto p-4 md:p-0 bg-stone-50 md:bg-transparent dark:bg-stone-950 md:dark:bg-transparent rounded-2xl">
            <span className="text-xs text-stone-500">প্রোফাইল পূর্ণাঙ্গতা:</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-shubban-gold rounded-full"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <span className="font-bold text-sm text-stone-800 dark:text-stone-200">
                {toBengaliNumber(profileCompletion)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">মোট গ্রন্থ (Books)</p>
            <h3 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
              {toBengaliNumber(publisher._count.books)}টি
            </h3>
            <span className="text-[11px] text-stone-400 mt-1 inline-block">ক্যাটালগ প্রকাশনা</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">সাময়িকী (Magazines)</p>
            <h3 className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-1">
              {toBengaliNumber(publisher._count.magazines)}টি
            </h3>
            <span className="text-[11px] text-stone-400 mt-1 inline-block">সাময়িকী সংখ্যা</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookmarkCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">প্রতিষ্ঠার বছর</p>
            <h3 className="text-2xl font-bold font-serif text-shubban-gold mt-1">
              {publisher.establishedYear ? toBengaliNumber(publisher.establishedYear) : 'অনুল্লিখিত'}
            </h3>
            <span className="text-[11px] text-stone-400 mt-1 inline-block">ঐতিহ্যের ইতিহাস</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-shubban-gold/15 text-shubban-gold flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-medium">মোট প্রকাশিত কনটেন্ট</p>
            <h3 className="text-2xl font-bold font-serif text-purple-600 dark:text-purple-400 mt-1">
              {toBengaliNumber(totalPublications)}টি
            </h3>
            <span className="text-[11px] text-stone-400 mt-1 inline-block">বই ও সাময়িকী একত্রে</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Details Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Descriptions & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview & Description */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-shubban-gold" />
              <span>পরিচিতি ও প্রেক্ষাপট</span>
            </h2>

            {publisher.description && (
              <div>
                <span className="text-xs text-stone-400 block mb-1">সংক্ষিপ্ত পরিচিতি:</span>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                  {publisher.description}
                </p>
              </div>
            )}

            {publisher.descriptionDetails ? (
              <div>
                <span className="text-xs text-stone-400 block mb-1">বিস্তারিত বিবরণ ও ঐতিহ্য:</span>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                  {publisher.descriptionDetails}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">কোনো বিস্তারিত বিবরণ যোগ করা হয়নি।</p>
            )}
          </div>

          {/* Published Books Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-shubban-gold" />
                <span>প্রকাশিত গ্রন্থাবলি (Books: {toBengaliNumber(publisher.books.length)})</span>
              </h2>
            </div>

            {publisher.books.length === 0 ? (
              <div className="py-10 text-center text-stone-400 text-xs">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <span>এই প্রকাশনীর অধীনে কোনো বই এখনো যুক্ত করা হয়নি।</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50/80 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold">
                      <th className="py-2.5 px-3 w-12 text-center">কভার</th>
                      <th className="py-2.5 px-3 min-w-[180px]">বইয়ের নাম</th>
                      <th className="py-2.5 px-3 min-w-[120px]">লেখক</th>
                      <th className="py-2.5 px-3 min-w-[100px]">ক্যাটাগরি</th>
                      <th className="py-2.5 px-3 text-right">মূল্য</th>
                      <th className="py-2.5 px-3 text-center">স্টক</th>
                      <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {publisher.books.map((book) => (
                      <tr key={book.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30">
                        <td className="py-2.5 px-3 text-center">
                          <div className="w-8 h-10 rounded bg-stone-100 dark:bg-stone-800 overflow-hidden mx-auto border border-stone-200 dark:border-stone-700">
                            {book.coverImage ? (
                              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-stone-400 m-auto mt-2.5" />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-800 dark:text-stone-200">
                          {book.title}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">
                          {book.author?.name || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">
                          {book.category?.name || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-stone-800 dark:text-stone-200">
                          {formatTaka(book.discountPrice || book.price)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              book.stockQuantity > 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}
                          >
                            {book.stockQuantity > 0 ? `${toBengaliNumber(book.stockQuantity)}টি` : 'স্টক শেষ'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/books/${book.slug}`}
                            target="_blank"
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-shubban-gold inline-flex items-center"
                            title="বইয়ের পেজ দেখুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact, Address, Business & Social Info */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-shubban-gold" />
              <span>যোগাযোগের বিবরণ</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">দায়িত্বপ্রাপ্ত প্রতিনিধি</span>
                <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                  {publisher.contactPerson || 'অনুল্লিখিত'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">অফিসিয়াল ইমেইল</span>
                {publisher.email ? (
                  <a href={`mailto:${publisher.email}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {publisher.email}
                  </a>
                ) : (
                  <p className="text-stone-400 italic">অনুল্লিখিত</p>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">ফোন ও হটলাইন</span>
                <div className="space-y-0.5 mt-0.5">
                  {publisher.phone && (
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {toBengaliNumber(publisher.phone)}
                    </p>
                  )}
                  {publisher.altPhone && (
                    <p className="font-medium text-stone-500">
                      বিকল্প: {toBengaliNumber(publisher.altPhone)}
                    </p>
                  )}
                  {!publisher.phone && !publisher.altPhone && (
                    <p className="text-stone-400 italic">অনুল্লিখিত</p>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">অফিসিয়াল ওয়েবসাইট</span>
                {publisher.website ? (
                  <a href={publisher.website} target="_blank" rel="noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3" />
                    <span>{publisher.website}</span>
                  </a>
                ) : (
                  <p className="text-stone-400 italic">অনুল্লিখিত</p>
                )}
              </div>
            </div>
          </div>

          {/* Address & Headquarters */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-shubban-gold" />
              <span>ঠিকানা ও অবস্থান</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 block text-[10px]">পূর্ণ কার্যালয় ঠিকানা</span>
                <p className="font-medium text-stone-800 dark:text-stone-200 mt-0.5">
                  {publisher.address || 'অনুল্লিখিত'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 block text-[10px]">শহর / জেলা</span>
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">{publisher.city || '—'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 block text-[10px]">পোস্টাল কোড</span>
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">{publisher.postalCode || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business & Registration */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-shubban-gold" />
              <span>আইনি ও ব্যবসায়িক নিবন্ধন</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">ট্রেড লাইসেন্স নম্বর:</span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{publisher.regNumber || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">BIN / TIN নম্বর:</span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{publisher.binNumber || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">প্রাতিষ্ঠানিক কাঠামো:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {ORG_TYPES[publisher.organizationType || 'LIMITED'] || publisher.organizationType}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-stone-400">মূল ঘরানা / জঁর:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{publisher.mainCategory || '—'}</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-shubban-gold" />
              <span>সোশ্যাল মিডিয়া পেজ</span>
            </h3>

            <div className="flex flex-wrap gap-2 text-xs">
              {publisher.facebook && (
                <a
                  href={publisher.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium hover:underline flex items-center gap-1"
                >
                  Facebook
                </a>
              )}
              {publisher.youtube && (
                <a
                  href={publisher.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-medium hover:underline flex items-center gap-1"
                >
                  YouTube
                </a>
              )}
              {publisher.linkedin && (
                <a
                  href={publisher.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-medium hover:underline flex items-center gap-1"
                >
                  LinkedIn
                </a>
              )}
              {publisher.twitter && (
                <a
                  href={publisher.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 font-medium hover:underline flex items-center gap-1"
                >
                  X (Twitter)
                </a>
              )}
              {!publisher.facebook && !publisher.youtube && !publisher.linkedin && !publisher.twitter && (
                <span className="text-stone-400 italic text-xs">কোনো সোশ্যাল লিংক যুক্ত করা নেই।</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

