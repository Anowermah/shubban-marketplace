'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  FileText,
  BookOpen,
  Star,
  User,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationAuthorsClientProps {
  initialAuthors: any[];
}

export default function AdminPublicationAuthorsClient({
  initialAuthors,
}: AdminPublicationAuthorsClientProps) {
  const [authors, setAuthors] = useState<any[]>(initialAuthors);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAuthors = useMemo(() => {
    const q = search.toLowerCase();
    return authors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.designation && a.designation.toLowerCase().includes(q))
    );
  }, [authors, search]);

  const totalPages = Math.ceil(filteredAuthors.length / pageSize) || 1;
  const paginatedAuthors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAuthors.slice(start, start + pageSize);
  }, [filteredAuthors, currentPage, pageSize]);

  const openCreateModal = () => {
    setEditingAuthor(null);
    setName('');
    setDesignation('');
    setBio('');
    setImage('');
    setFeatured(false);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (author: any) => {
    setEditingAuthor(author);
    setName(author.name || '');
    setDesignation(author.designation || '');
    setBio(author.bio || '');
    setImage(author.image || '');
    setFeatured(Boolean(author.featured));
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('লেখকের নাম আবশ্যক');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const res = await fetch('/api/publications/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAuthor ? editingAuthor.id : undefined,
          name,
          designation,
          bio,
          image,
          featured,
        }),
      });
      const data = await res.json();

      if (data.success && data.author) {
        if (editingAuthor) {
          setAuthors(
            authors.map((a) =>
              a.id === editingAuthor.id
                ? { ...a, ...data.author }
                : a
            )
          );
          setSuccessMsg('লেখক প্রোফাইল আপডেট হয়েছে');
        } else {
          setAuthors([
            { ...data.author, articleCount: 0, bookCount: 0 },
            ...authors,
          ]);
          setSuccessMsg('নতুন লেখক যুক্ত হয়েছে');
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
            <Users className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>লেখক ও সম্পাদক পরিষদ</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট {toBengaliNumber(authors.length)} জন নিবন্ধিত লেখক, গবেষক ও সম্পাদক
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন লেখক যোগ করুন</span>
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
            placeholder="লেখকের নাম বা পদবী খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Authors Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-bold">লেখক ও প্রোফাইল</th>
                <th className="py-3 px-4 font-bold">পদবী ও পরিচয়</th>
                <th className="py-3 px-4 font-bold">আর্টিকেল সংখ্যা</th>
                <th className="py-3 px-4 font-bold">প্রকাশিত বই</th>
                <th className="py-3 px-4 font-bold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedAuthors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    কোনো লেখক পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedAuthors.map((author) => (
                  <tr key={author.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {author.image ? (
                          <img
                            src={author.image}
                            alt={author.name}
                            className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                            {author.name}
                          </span>
                          {author.featured && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>ফিচার্ড লেখক</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                      {author.designation || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{toBengaliNumber(author.articleCount)}টি</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{toBengaliNumber(author.bookCount)}টি</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(author)}
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
            totalItems={filteredAuthors.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="জন লেখক"
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {editingAuthor ? 'লেখক তথ্য সম্পাদনা' : 'নতুন লেখক তৈরি'}
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
                  লেখকের পুরো নাম *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="যেমন: ড. মাহমূদ হাসান"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  পদবী ও পরিচয় (Designation)
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="যেমন: গবেষক ও অধ্যাপক, ইসলামিক স্টাডিজ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  সংক্ষিপ্ত জীবনবৃত্তান্ত (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="লেখকের সংক্ষিপ্ত পরিচয়..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ছবির URL
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/images/... বা অনলাইন ফটো লিংক"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>ফিচার্ড লেখক হিসেবে প্রদর্শন করুন</span>
                </label>
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

