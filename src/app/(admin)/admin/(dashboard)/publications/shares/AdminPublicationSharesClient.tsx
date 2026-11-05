'use client';

import React, { useState, useMemo } from 'react';
import {
  Share2,
  Search,
  FileSpreadsheet,
  Facebook,
  MessageCircle,
  Copy,
  Smartphone,
  User,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationSharesClientProps {
  initialShares: any[];
  stats: {
    totalShares: number;
    byPlatform: {
      FACEBOOK: number;
      WHATSAPP: number;
      COPY_LINK: number;
      NATIVE: number;
    };
  };
}

export default function AdminPublicationSharesClient({
  initialShares,
  stats,
}: AdminPublicationSharesClientProps) {
  const [shares, setShares] = useState<any[]>(initialShares);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [range, setRange] = useState('30d');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredShares = useMemo(() => {
    return shares.filter((s) => {
      const q = search.toLowerCase();
      const title = (s.issue?.issueTitle || s.article?.title || '').toLowerCase();
      const userName = (s.user?.name || '').toLowerCase();
      const matchesSearch = title.includes(q) || userName.includes(q);
      const matchesPlatform = selectedPlatform ? s.platform === selectedPlatform : true;
      return matchesSearch && matchesPlatform;
    });
  }, [shares, search, selectedPlatform]);

  const totalPages = Math.ceil(filteredShares.length / pageSize) || 1;
  const paginatedShares = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShares.slice(start, start + pageSize);
  }, [filteredShares, currentPage, pageSize]);

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Facebook className="w-3.5 h-3.5" />
            <span>ফেসবুক (Facebook)</span>
          </span>
        );
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>হোয়াটসঅ্যাপ (WhatsApp)</span>
          </span>
        );
      case 'COPY_LINK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Copy className="w-3.5 h-3.5" />
            <span>লিংক কপি (Copy Link)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span>নেটিভ শেয়ার (Mobile)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>সোশ্যাল শেয়ার রিপোর্ট ও অ্যানালিটিক্স</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            ফেসবুক, হোয়াটসঅ্যাপ ও লিংক কপি মাধ্যমে পাঠকদের শেয়ারিং কার্যক্রমের অডিট
          </p>
        </div>

        <a
          href={`/api/publications/shares?export=csv`}
          target="_blank"
          className="px-4 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs shadow-md hover:bg-stone-800 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>CSV রিপোর্ট ডাউনলোড করুন</span>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] text-stone-500 block">মোট শেয়ার</span>
          <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.totalShares)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] text-stone-500 block">ফেসবুক শেয়ার</span>
          <span className="text-2xl font-bold font-serif text-blue-600 dark:text-blue-400">
            {toBengaliNumber(stats.byPlatform.FACEBOOK)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] text-stone-500 block">হোয়াটসঅ্যাপ শেয়ার</span>
          <span className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
            {toBengaliNumber(stats.byPlatform.WHATSAPP)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-[11px] text-stone-500 block">লিংক কপি ও অন্যান্য</span>
          <span className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400">
            {toBengaliNumber(stats.byPlatform.COPY_LINK + stats.byPlatform.NATIVE)}
          </span>
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
            placeholder="প্রকাশনার নাম বা পাঠক খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          {[
            { id: '', label: 'সকল প্ল্যাটফর্ম' },
            { id: 'FACEBOOK', label: 'ফেসবুক' },
            { id: 'WHATSAPP', label: 'হোয়াটসঅ্যাপ' },
            { id: 'COPY_LINK', label: 'লিংক কপি' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlatform(p.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                selectedPlatform === p.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shares Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-bold">প্রকাশনা শিরোনাম</th>
                <th className="py-3 px-4 font-bold">ধরন</th>
                <th className="py-3 px-4 font-bold">শেয়ারিং মাধ্যম</th>
                <th className="py-3 px-4 font-bold">ব্যবহারকারী</th>
                <th className="py-3 px-4 font-bold">তারিখ ও সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedShares.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    কোনো শেয়ারিং তথ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedShares.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {s.issue?.issueTitle || s.article?.title || 'অজানা প্রকাশনা'}
                    </td>

                    <td className="py-3.5 px-4">
                      {s.issueId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          মাসিক পত্রিকা
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">
                          প্রবন্ধ
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {getPlatformBadge(s.platform)}
                    </td>

                    <td className="py-3.5 px-4 text-stone-700 dark:text-stone-300">
                      {s.user?.name ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>{s.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400">পাঠক (Visitor)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      {formatBengaliDate(s.createdAt)}
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
            totalItems={filteredShares.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="টি শেয়ার"
          />
        </div>
      </div>
    </div>
  );
}
