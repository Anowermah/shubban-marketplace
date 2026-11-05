import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminSubmissionsClient from '@/components/admin/AdminSubmissionsClient';
import { Feather } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default async function AdminSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Feather className="w-6 h-6 text-shubban-gold" />
          <span>লেখক ও প্রকাশক পাণ্ডুলিপি মূল্যায়ন কনসোল</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          মোট {toBengaliNumber(submissions.length)}টি দাখিলকৃত পাণ্ডুলিপি পর্যালোচনার তালিকায় রয়েছে।
        </p>
      </div>

      <AdminSubmissionsClient
        initialSubmissions={submissions.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          category: s.category,
          description: s.description,
          fileUrl: s.fileUrl,
          status: s.status,
          createdAt: s.createdAt,
          authorName: s.user.name,
          authorEmail: s.user.email,
        }))}
      />
    </div>
  );
}

