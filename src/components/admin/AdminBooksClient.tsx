'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, CheckCircle2, AlertTriangle, Plus, Minus } from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminBook {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  isPhysicalAvailable: boolean;
  isDigitalAvailable: boolean;
  isFree: boolean;
  isFeatured: boolean;
  authorName: string;
  categoryName: string;
}

export default function AdminBooksClient({ initialBooks }: { initialBooks: AdminBook[] }) {
  const [books, setBooks] = useState<AdminBook[]>(initialBooks);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.authorName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedBooks = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStockChange = async (id: string, delta: number) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    const newStock = Math.max(0, book.stockQuantity + delta);

    try {
      const res = await fetch(`/api/admin/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock }),
      });

      if (res.ok) {
        setBooks(books.map((b) => (b.id === id ? { ...b, stockQuantity: newStock } : b)));
        setFeedback(`“${book.title}”-এর স্টক হালনাগাদ করা হয়েছে (${toBengaliNumber(newStock)} কপি)।`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="বই বা লেখক দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        {feedback && (
          <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Books Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">বইয়ের শিরোনাম</th>
                <th className="p-3.5">লেখক ও বিভাগ</th>
                <th className="p-3.5">মূল্য</th>
                <th className="p-3.5">ধরন</th>
                <th className="p-3.5 text-center">ইনভেন্টরি স্টক</th>
                <th className="p-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {paginatedBooks.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                  <td className="p-3.5 font-bold font-serif text-stone-900 dark:text-stone-100">
                    <Link href={`/books/${b.slug}`} className="hover:text-shubban-gold">
                      {b.title}
                    </Link>
                  </td>
                  <td className="p-3.5 text-stone-600 dark:text-stone-400">
                    <span className="block font-medium">{b.authorName}</span>
                    <span className="text-[10px] text-stone-400">{b.categoryName}</span>
                  </td>
                  <td className="p-3.5 font-bold text-shubban-green dark:text-shubban-gold">
                    {formatTaka(b.discountPrice || b.price)}
                  </td>
                  <td className="p-3.5">
                    <div className="flex gap-1">
                      {b.isPhysicalAvailable && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px]">
                          মুদ্রিত
                        </span>
                      )}
                      {b.isDigitalAvailable && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
                          ই-বুক
                        </span>
                      )}
                      {b.isFree && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                          মুক্ত
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="inline-flex items-center gap-2 border border-stone-200 dark:border-stone-700 rounded-lg p-1">
                      <button
                        onClick={() => handleStockChange(b.id, -1)}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                        title="কমান"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        className={`font-mono font-bold px-2 ${
                          b.stockQuantity <= 5 ? 'text-red-600' : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {toBengaliNumber(b.stockQuantity)}
                      </span>
                      <button
                        onClick={() => handleStockChange(b.id, 1)}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                        title="বাড়ান"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/books/${b.slug}`}
                      className="text-shubban-gold hover:underline font-bold text-[11px]"
                    >
                      ভিউ করুন
                    </Link>
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
        itemName="বই"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 15, 25, 50]}
      />
    </div>
  );
}

