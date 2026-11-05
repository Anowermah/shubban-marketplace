'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Calendar,
  FileSpreadsheet,
  FileText,
  User,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationDownloadsClientProps {
  initialDownloads: any[];
  stats: {
    totalDownloads: number;
    issueDownloads: number;
    articleDownloads: number;
  };
}

export default function AdminPublicationDownloadsClient({
  initialDownloads,
  stats,
}: AdminPublicationDownloadsClientProps) {
  const [downloads, setDownloads] = useState<any[]>(initialDownloads);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchFiltered = async (selectedRange: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/publications/downloads?range=${selectedRange}`);
      const data = await res.json();
      if (data.success && data.downloads) {
        setDownloads(data.downloads);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (r: string) => {
    setRange(r);
    fetchFiltered(r);
  };

  const filteredDownloads = useMemo(() => {
    const q = search.toLowerCase();
    return downloads.filter((d) => {
      const title = (d.issue?.issueTitle || d.article?.title || '').toLowerCase();
      const userName = (d.user?.name || '').toLowerCase();
      const ip = (d.ipHash || '').toLowerCase();
      return title.includes(q) || userName.includes(q) || ip.includes(q);
    });
  }, [downloads, search]);

  const totalPages = Math.ceil(filteredDownloads.length / pageSize) || 1;
  const paginatedDownloads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDownloads.slice(start, start + pageSize);
  }, [filteredDownloads, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Download className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>ডাউনলোড রিপোর্ট ও লগস (Download Audit Reports)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            পাঠকদের ডাউনলোড কার্যক্রম, ফাইল ধরন, আইপি হ্যাশ ও সামগ্রিক রিপোর্ট
          </p>
        </div>

        <a
          href={`/api/publications/downloads?range=${range}&export=csv`}
          target="_blank"
          className="px-4 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs shadow-md hover:bg-stone-800 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>CSV রিপোর্ট ডাউনলোড করুন</span>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 block">মোট সফল ডাউনলোড</span>
            <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {toBengaliNumber(stats.totalDownloads)}টি
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 block">পত্রিকা সংখ্যা ডাউনলোড</span>
            <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {toBengaliNumber(stats.issueDownloads)}টি
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 block">প্রবন্ধ ও গবেষণাপত্র ডাউনলোড</span>
            <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {toBengaliNumber(stats.articleDownloads)}টি
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="প্রকাশনার নাম, পাঠক বা আইপি খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          {['7d', '30d', '90d', 'all'].map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                range === r
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {r === '7d' ? '৭ দিন' : r === '30d' ? '৩০ দিন' : r === '90d' ? '৩ মাস' : 'সব'}
            </button>
          ))}
        </div>
      </div>

      {/* Downloads Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-bold">প্রকাশনা শিরোনাম</th>
                <th className="py-3 px-4 font-bold">ধরন</th>
                <th className="py-3 px-4 font-bold">পাঠক / ইউজার</th>
                <th className="py-3 px-4 font-bold">সুরক্ষিত IP Hash</th>
                <th className="py-3 px-4 font-bold">তারিখ ও সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedDownloads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    কোনো ডাউনলোড তথ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedDownloads.map((dl) => (
                  <tr key={dl.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {dl.issue?.issueTitle || dl.article?.title || 'অজানা প্রকাশনা'}
                    </td>

                    <td className="py-3.5 px-4">
                      {dl.issueId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          মাসিক পত্রিকা
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">
                          প্রবন্ধ
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-700 dark:text-stone-300">
                      {dl.user?.name ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>{dl.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400">অতিথি পাঠক (Guest)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                      {dl.ipHash ? `${dl.ipHash.slice(0, 12)}...` : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      {formatBengaliDate(dl.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDownloads.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="টি ডাউনলোড"
          />
        </div>
      </div>
    </div>
  );
}
