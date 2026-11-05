'use client';

import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Palette,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationTagsClientProps {
  initialTags: any[];
}

const PRESET_COLORS = [
  '#c59b27', // Gold
  '#0f3e2e', // Deep Islamic Green
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#ea580c', // Orange
  '#059669', // Emerald
  '#475569', // Slate
];

export default function AdminPublicationTagsClient({
  initialTags,
}: AdminPublicationTagsClientProps) {
  const [tags, setTags] = useState<any[]>(initialTags);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#c59b27');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredTags = useMemo(() => {
    const q = search.toLowerCase();
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.slug && t.slug.toLowerCase().includes(q))
    );
  }, [tags, search]);

  const totalPages = Math.ceil(filteredTags.length / pageSize) || 1;
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTags.slice(start, start + pageSize);
  }, [filteredTags, currentPage, pageSize]);

  const openCreateModal = () => {
    setEditingTag(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('#c59b27');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingTag(t);
    setName(t.name || '');
    setSlug(t.slug || '');
    setDescription(t.description || '');
    setColor(t.color || '#c59b27');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('ট্যাগের নাম আবশ্যক');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const res = await fetch('/api/publications/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTag ? editingTag.id : undefined,
          name,
          slug,
          description,
          color,
        }),
      });
      const data = await res.json();

      if (data.success && data.tag) {
        if (editingTag) {
          setTags(
            tags.map((t) =>
              t.id === editingTag.id ? { ...t, ...data.tag } : t
            )
          );
          setSuccessMsg('ট্যাগ আপডেট হয়েছে');
        } else {
          setTags([data.tag, ...tags]);
          setSuccessMsg('নতুন ট্যাগ তৈরি হয়েছে');
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

  const handleDelete = async (tagId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ট্যাগটি মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch(`/api/publications/tags/${tagId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTags(tags.filter((t) => t.id !== tagId));
        setSuccessMsg('ট্যাগ মুছে ফেলা হয়েছে');
      } else {
        alert(data.error || 'মুছে ফেলা সম্ভব হয়নি');
      }
    } catch (err: any) {
      alert(err.message || 'ত্রুটি ঘটেছে');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>ট্যাগ ব্যবস্থাপনা (Tags Management)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট {toBengaliNumber(tags.length)}টি সক্রিয় ট্যাগ ও বিষয়ভিত্তিক লেবেল
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ট্যাগ যোগ করুন</span>
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
            placeholder="ট্যাগ বা স্লাগ খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tags Grid / Badges Preview */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300">
          ট্যাগ ক্লাউড প্রিভিউ (Tag Cloud)
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs"
              style={{
                backgroundColor: `${t.color || '#c59b27'}15`,
                color: t.color || '#c59b27',
                border: `1px solid ${t.color || '#c59b27'}30`,
              }}
            >
              <span>#{t.name}</span>
              {t.usageCount > 0 && (
                <span className="text-[10px] opacity-75 font-mono">
                  ({toBengaliNumber(t.usageCount)})
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Tags Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-bold">ট্যাগের নাম ও প্রিভিউ</th>
                <th className="py-3 px-4 font-bold">স্লাগ</th>
                <th className="py-3 px-4 font-bold">রং (Color Hex)</th>
                <th className="py-3 px-4 font-bold">ব্যবহার সংখ্যা</th>
                <th className="py-3 px-4 font-bold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedTags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    কোনো ট্যাগ পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold"
                        style={{
                          backgroundColor: `${tag.color || '#c59b27'}20`,
                          color: tag.color || '#c59b27',
                          border: `1px solid ${tag.color || '#c59b27'}40`,
                        }}
                      >
                        #{tag.name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-500">
                      {tag.slug}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700"
                          style={{ backgroundColor: tag.color || '#c59b27' }}
                        />
                        <span>{tag.color || '#c59b27'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-700 dark:text-stone-300">
                      {toBengaliNumber(tag.usageCount || 0)} বার
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(tag)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            totalItems={filteredTags.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="টি ট্যাগ"
          />
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {editingTag ? 'ট্যাগ সম্পাদনা' : 'নতুন ট্যাগ তৈরি'}
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
                  ট্যাগের নাম *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingTag) {
                      setSlug(e.target.value.toLowerCase().replace(/[\s\W-]+/g, '-'));
                    }
                  }}
                  required
                  placeholder="যেমন: সীরাত"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  স্লাগ
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="যেমন: seerah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
                  ট্যাগ কালার
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        color === c ? 'scale-110 border-white shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-stone-900 dark:text-stone-100 text-xs"
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

