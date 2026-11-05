'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, ShieldCheck, CheckCircle2, Search, ExternalLink, Edit } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminVendor {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  rating: number;
  commissionRate?: number | null;
  status: string;
  booksCount: number;
  subOrdersCount: number;
}

export default function AdminSellersClient({ initialVendors }: { initialVendors: AdminVendor[] }) {
  const [vendors, setVendors] = useState<AdminVendor[]>(initialVendors);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<string>('10');

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedVendors = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';

    try {
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setVendors(vendors.map((v) => (v.id === id ? { ...v, status: nextStatus } : v)));
        setFeedback(`ভেন্ডর স্ট্যাটাস “${nextStatus === 'APPROVED' ? 'অনুমোদিত' : 'সাময়িক স্থগিত'}” করা হয়েছে।`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommissionSave = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: parseFloat(newRate) }),
      });

      if (res.ok) {
        setVendors(vendors.map((v) => (v.id === id ? { ...v, commissionRate: parseFloat(newRate) } : v)));
        setEditingCommissionId(null);
        setFeedback(`কমিশন হার ${newRate}% নির্ধারণ করা হয়েছে।`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="দোকানের নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/sellers/applications"
            className="px-4 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow flex items-center gap-1.5 transition-all"
          >
            <span>পেন্ডিং আবেদনসমূহ দেখুন</span>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg flex items-center gap-1.5 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Sellers Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">দোকান / বিক্রেতা</th>
                <th className="p-3.5">ঠিকানা ও শহর</th>
                <th className="p-3.5 text-center">ক্যাটালগ পণ্য</th>
                <th className="p-3.5 text-center">কমিশন রেট</th>
                <th className="p-3.5 text-center">বর্তমান অবস্থা</th>
                <th className="p-3.5 text-right">ম্যানেজমেন্ট অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {paginatedVendors.map((v) => (
                <tr key={v.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                  <td className="p-3.5">
                    <strong className="font-serif font-bold text-stone-900 dark:text-stone-100 block">
                      {v.name}
                    </strong>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      {v.email} • {v.phone}
                    </span>
                  </td>
                  <td className="p-3.5 text-stone-600 dark:text-stone-400">
                    {v.city}
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold">
                    {toBengaliNumber(v.booksCount)}টি
                  </td>
                  <td className="p-3.5 text-center">
                    {editingCommissionId === v.id ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          className="w-14 p-1 text-center font-mono rounded border border-stone-300 text-xs"
                        />
                        <button
                          onClick={() => handleCommissionSave(v.id)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                        >
                          সেভ
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCommissionId(v.id);
                          setNewRate(v.commissionRate?.toString() || '10');
                        }}
                        className="inline-flex items-center gap-1 text-shubban-gold font-bold hover:underline"
                        title="কমিশন পরিবর্তন করুন"
                      >
                        <span>{toBengaliNumber(v.commissionRate || 10)}%</span>
                        <Edit className="w-3 h-3 text-stone-400" />
                      </button>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {v.status === 'APPROVED' ? 'অনুমোদিত' : 'স্থগিত'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/sellers/${v.slug}`}
                        target="_blank"
                        className="p-1 text-stone-400 hover:text-shubban-gold"
                        title="স্টোরফ্রন্ট দেখুন"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleStatusToggle(v.id, v.status)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                          v.status === 'APPROVED'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {v.status === 'APPROVED' ? 'স্থগিত করুন' : 'অনুমোদন দিন'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={pageSize}
        itemName="বিক্রেতা"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
}

