'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface ApplicationData {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessAddress: string;
  city: string;
  businessType: string;
  tradeLicense?: string | null;
  status: string;
  createdAt: Date | string;
}

export default function AdminSellerApplicationsClient({
  initialApplications,
}: {
  initialApplications: ApplicationData[];
}) {
  const [applications, setApplications] = useState<ApplicationData[]>(initialApplications);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [feedback, setFeedback] = useState<string | null>(null);

  const totalPages = Math.ceil(applications.length / pageSize);
  const paginated = applications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/admin/sellers/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok) {
        setApplications(applications.map((a) => (a.id === id ? { ...a, status } : a)));
        setFeedback(data.message);
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 font-bengali">
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/admin/sellers"
          className="text-xs text-stone-500 hover:text-shubban-green flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>বিক্রেতা তালিকায় ফিরুন</span>
        </Link>
      </div>

      {feedback && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
            <tr>
              <th className="p-3.5">দোকানের নাম</th>
              <th className="p-3.5">মালিক ও যোগাযোগ</th>
              <th className="p-3.5">ব্যবসায়ের ধরন ও ঠিকানা</th>
              <th className="p-3.5">আবেদনের তারিখ</th>
              <th className="p-3.5 text-center">স্ট্যাটাস</th>
              <th className="p-3.5 text-right">অনুমোদন অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-400">
                  বর্তমানে কোনো নতুন বিক্রেতা আবেদন অপেক্ষমাণ নেই।
                </td>
              </tr>
            ) : (
              paginated.map((app) => (
                <tr key={app.id}>
                  <td className="p-3.5 font-bold font-serif text-stone-900 dark:text-stone-100">
                    {app.shopName}
                  </td>
                  <td className="p-3.5 text-stone-600 dark:text-stone-400">
                    <strong className="block text-stone-800 dark:text-stone-200">{app.ownerName}</strong>
                    <span className="font-mono text-[10px]">{app.phone} • {app.email}</span>
                  </td>
                  <td className="p-3.5 text-stone-600 dark:text-stone-400">
                    <span className="font-medium block">{app.businessType}</span>
                    <span className="text-[10px] text-stone-400">{app.businessAddress}, {app.city}</span>
                  </td>
                  <td className="p-3.5 text-stone-400">
                    {formatBengaliDate(app.createdAt)}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status === 'APPROVED' && 'অনুমোদিত'}
                      {app.status === 'REJECTED' && 'বাতিল'}
                      {app.status === 'PENDING' && 'অপেক্ষমাণ'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {app.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleReview(app.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>অনুমোদন</span>
                        </button>
                        <button
                          onClick={() => handleReview(app.id, 'REJECTED')}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] font-bold flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>বাতিল</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-stone-400 text-[10px]">সম্পন্ন</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={applications.length}
        itemsPerPage={pageSize}
        itemName="আবেদন"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20]}
      />
    </div>
  );
}

