import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Users,
  ArrowLeft,
  Edit,
  ExternalLink,
  BookOpen,
  FileText,
  Mail,
  Phone,
  Globe,
  Share2,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export const revalidate = 0;

interface AdminAuthorDetailsPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    articlePage?: string;
  };
}

export default async function AdminAuthorDetailsPage({
  params,
  searchParams,
}: AdminAuthorDetailsPageProps) {
  const author = await prisma.author.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
    },
    include: {
      _count: {
        select: {
          books: true,
          articles: true,
          papers: true,
        },
      },
      articles: {
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      books: {
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!author) {
    notFound();
  }

  // Calculate Profile Completion
  let score = 0;
  const totalCriteria = 10;
  if (author.name) score++;
  if (author.photoUrl) score++;
  if (author.designation) score++;
  if (author.email) score++;
  if (author.bio) score++;
  if (author.bioDetails) score++;
  if (author.expertise) score++;
  if (author.workplace || author.education) score++;
  if (author.website || author.facebook || author.linkedin) score++;
  if (author.seoTitle || author.seoDescription) score++;
  const completionPercentage = Math.round((score / totalCriteria) * 100);

  // Article pagination
  const articlePage = Math.max(1, parseInt(searchParams?.articlePage || '1', 10));
  const pageSize = 10;
  const totalArticles = author.articles.length;
  const totalArticlePages = Math.ceil(totalArticles / pageSize) || 1;
  const paginatedArticles = author.articles.slice((articlePage - 1) * pageSize, articlePage * pageSize);

  const publishedCount = author.articles.filter((a) => a.status === 'PUBLISHED').length;
  const draftCount = author.articles.filter((a) => a.status === 'DRAFT').length;

  return (
    <div className="space-y-6 font-bengali pb-20">
      {/* Back button & top navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <Link
          href="/admin/authors"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-shubban-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>লেখক তালিকায় ফিরে যান</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/authors/${author.slug}`}
            target="_blank"
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors"
          >
            <span>পাবলিক পেজ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/admin/authors?edit=${author.id}`}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-shubban-green hover:bg-shubban-green/90 text-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>সম্পাদনা করুন</span>
          </Link>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-lg border-2 border-shubban-gold/40 flex-shrink-0 bg-stone-100">
          <img
            src={author.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
            alt={author.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
              {author.name}
            </h1>
            {author.isVerified && (
              <span title="ভেরিফাইড লেখক">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </span>
            )}
            {author.isFeatured && (
              <span title="ফিচার্ড লেখক">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </span>
            )}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                author.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {author.status}
            </span>
          </div>

          <p className="text-sm font-medium text-shubban-gold">
            {author.designation || 'নিবন্ধিত গবেষক ও লেখক'} {author.workplace && `• ${author.workplace}`}
          </p>

          {author.bio && (
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
              {author.bio}
            </p>
          )}

          {/* Social and Contact Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-xs">
            {author.email && (
              <div className="flex items-center gap-1.5 text-stone-500">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-mono">{author.email}</span>
              </div>
            )}
            {author.phone && (
              <div className="flex items-center gap-1.5 text-stone-500">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>{author.phone}</span>
              </div>
            )}
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                className="flex items-center gap-1.5 text-blue-600 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>ওয়েবসাইট</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">মোট প্রবন্ধ</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-sky-600 dark:text-sky-400">
              {toBengaliNumber(totalArticles)}
            </span>
            <span className="text-[11px] text-stone-400">টি নিবন্ধিত</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">প্রকাশিত প্রবন্ধ</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
              {toBengaliNumber(publishedCount)}
            </span>
            <span className="text-[11px] text-stone-400">টি লাইভ</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">প্রকাশিত বই</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">
              {toBengaliNumber(author._count.books)}
            </span>
            <span className="text-[11px] text-stone-400">টি ক্যাটালগে</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">প্রোফাইল পূর্ণতা</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-shubban-gold">
              {toBengaliNumber(completionPercentage)}%
            </span>
            <span className="text-[11px] text-stone-400">স্কোর</span>
          </div>
        </div>
      </div>

      {/* Professional Information & Bio Details */}
      {(author.bioDetails || author.education || author.experience || author.awards) && (
        <div className="p-6 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-shubban-gold" />
            <span>পেশাগত পরিচয় ও একাডেমিক ব্যাকগ্রাউন্ড</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {author.education && (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 space-y-1">
                <span className="font-bold text-stone-500 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-sky-600" />
                  <span>শিক্ষাগত যোগ্যতা:</span>
                </span>
                <p className="text-stone-800 dark:text-stone-200">{author.education}</p>
              </div>
            )}

            {author.awards && (
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 space-y-1">
                <span className="font-bold text-stone-500 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>পুরস্কার ও সম্মাননা:</span>
                </span>
                <p className="text-stone-800 dark:text-stone-200">{author.awards}</p>
              </div>
            )}
          </div>

          {author.bioDetails && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                বিস্তারিত জীবনী ও গবেষণাকর্ম:
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line font-sans">
                {author.bioDetails}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 7. Dedicated Author Articles Section with Pagination */}
      <div className="rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden space-y-3 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 gap-2">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>লেখকের রচিত প্রবন্ধসমূহ ({toBengaliNumber(totalArticles)}টি)</span>
            </h3>
            <p className="text-xs text-stone-400">এই লেখকের অধীনে নিবন্ধিত সকল গবেষণা ও আর্টিকেলের তালিকা।</p>
          </div>
        </div>

        {totalArticles === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            এই লেখকের কোনো প্রবন্ধ এখনো যুক্ত করা হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {paginatedArticles.map((art) => (
              <div
                key={art.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                      {art.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        art.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {art.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-400 text-[11px]">
                    <span className="font-mono">/{art.slug}</span>
                    {art.category && <span>• বিভাগ: {art.category.name}</span>}
                    <span suppressHydrationWarning>• {formatBengaliDate(art.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/articles/${art.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center gap-1"
                  >
                    <span>পড়ুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Pagination */}
        {totalArticlePages > 1 && (
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
            <span>
              পৃষ্ঠা {toBengaliNumber(articlePage)} / {toBengaliNumber(totalArticlePages)}
            </span>
            <div className="flex items-center gap-1">
              <Link
                href={`/admin/authors/${author.id}?articlePage=${Math.max(1, articlePage - 1)}`}
                className={`p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 ${
                  articlePage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-stone-50'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/authors/${author.id}?articlePage=${Math.min(totalArticlePages, articlePage + 1)}`}
                className={`p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 ${
                  articlePage >= totalArticlePages ? 'pointer-events-none opacity-40' : 'hover:bg-stone-50'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
