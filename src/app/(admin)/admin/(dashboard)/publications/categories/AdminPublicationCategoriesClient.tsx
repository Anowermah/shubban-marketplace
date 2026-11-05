'use client';

import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  FileText,
  Package,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationCategoriesClientProps {
  initialCategories: any[];
}

export default function AdminPublicationCategoriesClient({
  initialCategories,
}: AdminPublicationCategoriesClientProps) {
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q))
    );
  }, [categories, search]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('ক্যাটাগরির নাম আবশ্যক');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const res = await fetch('/api/publications/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory ? editingCategory.id : undefined,
          name,
          slug,
          description,
        }),
      });
      const data = await res.json();

      if (data.success && data.category) {
        if (editingCategory) {
          setCategories(
            categories.map((c) =>
              c.id === editingCategory.id
                ? { ...c, ...data.category }
                : c
            )
          );
          setSuccessMsg('ক্যাটাগরি আপডেট হয়েছে');
        } else {
          setCategories([
            { ...data.category, articleCount: 0, productCount: 0 },
            ...categories,
          ]);
          setSuccessMsg('নতুন ক্যাটাগরি তৈরি হয়েছে');
        }
        setModalOpen(false);
      } else {
        setErrorMsg(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ত্রুটি ঘটেছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>প্রকাশনা ক্যাটাগরি ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট {toBengaliNumber(categories.length)}টি সক্রিয় বিষয়ভিত্তিক ক্যাটাগরি
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ক্যাটাগরি তৈরি করুন</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ক্যাটাগরি বা স্লাগ খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-bold">ক্যাটাগরির নাম</th>
                <th className="py-3 px-4 font-bold">স্লাগ (URL Slug)</th>
                <th className="py-3 px-4 font-bold">প্রবন্ধ ও আর্টিকেল</th>
                <th className="py-3 px-4 font-bold">ক্যাটালগ পণ্য</th>
                <th className="py-3 px-4 font-bold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    কোনো ক্যাটাগরি পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {cat.name}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-500">
                      {cat.slug}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{toBengaliNumber(cat.articleCount)}টি প্রবন্ধ</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                        <Package className="w-3.5 h-3.5" />
                        <span>{toBengaliNumber(cat.bookCount || cat.productCount || 0)}টি বই</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
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
            totalItems={filteredCategories.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="টি ক্যাটাগরি"
          />
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ক্যাটাগরির নাম *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[\s\W-]+/g, '-'));
                    }
                  }}
                  required
                  placeholder="যেমন: সমকালীন চিন্তাধারা"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  স্লাগ (URL Slug)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="যেমন: contemporary-thoughts"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  বিবরণ
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ক্যাটাগরির সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition disabled:opacity-50"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
