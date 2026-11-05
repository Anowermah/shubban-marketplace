import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import PdfReader from '@/components/publications/PdfReader';
import Link from 'next/link';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';

interface ReadPageProps {
  params: {
    publicationId: string;
  };
}

export async function generateMetadata({ params }: ReadPageProps) {
  const issue = await prisma.publicationIssue.findUnique({
    where: { id: params.publicationId },
    include: { magazine: true },
  });

  if (!issue) {
    return { title: 'সংখ্যা পাওয়া যায়নি | শুব্বান ডিজিটাল লাইব্রেরি' };
  }

  return {
    title: `${issue.issueTitle} — ${issue.magazine.title} অনলাইনে পড়ুন | শুব্বান`,
    description: issue.summary || `${issue.magazine.title}-এর ডিজিটাল পাঠ`,
  };
}

export default async function PublicationReadPage({ params }: ReadPageProps) {
  const { publicationId } = params;

  const issue = await prisma.publicationIssue.findUnique({
    where: { id: publicationId },
    include: {
      magazine: true,
    },
  });

  if (!issue) {
    notFound();
  }

  const sessionUser = await getSessionUser();

  // 1. Permission check: readOnline
  if (issue.readOnline === false) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif font-bold text-lg text-stone-100 mb-2">
            অনলাইনে পাঠের সুবিধা সংরক্ষিত
          </h2>
          <p className="text-xs text-stone-400 mb-6 leading-relaxed">
            এই সাময়িকীটি বর্তমানে শুধুমাত্র মুদ্রিত সংস্করণে অথবা অনুমোদিত পাঠকের জন্য সংরক্ষিত রয়েছে।
          </p>
          <Link
            href="/magazine"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" /> সাময়িকী তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  // 2. Permission check: requireLogin
  if (issue.requireLogin && !sessionUser) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif font-bold text-lg text-stone-100 mb-2">
            লগইন করা আবশ্যক
          </h2>
          <p className="text-xs text-stone-400 mb-6 leading-relaxed">
            &quot;{issue.issueTitle}&quot; পড়ার জন্য আপনার শুব্বান অ্যাকাউন্টে লগইন করা প্রয়োজন।
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/login?redirect=/magazine/read/${issue.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-lg shadow-amber-900/40"
            >
              <LogIn className="w-4 h-4" /> অ্যাকাউন্টে লগইন করুন
            </Link>
            <Link
              href="/magazine"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition"
            >
              ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PdfReader
      publication={{
        id: issue.id,
        title: issue.issueTitle,
        magazineTitle: issue.magazine.title,
        volume: issue.volume,
        issueNumber: issue.issueNumber,
        pdfUrl: issue.authorizedPdfUrl || issue.pdfUrl,
        coverImage: issue.coverImage,
        pageCount: issue.pageCount || 48,
        allowDownload: issue.allowDownload,
        allowShare: issue.allowShare,
        requireLogin: issue.requireLogin,
      }}
      currentUser={sessionUser}
    />
  );
}

