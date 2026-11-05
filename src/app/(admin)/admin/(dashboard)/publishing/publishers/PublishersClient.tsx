'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Newspaper,
  BookOpen,
  Users,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface PublishersClientProps {
  initialPublishers: any[];
}

const PUBLISHER_TYPES = [
  { value: 'COMMERCIAL', label: 'বাণিজ্যিক প্রকাশনা (Commercial)' },
  { value: 'ISLAMIC_FOUNDATION', label: 'ইসলামিক রিসার্চ ও ফাউন্ডেশন (Islamic Foundation)' },
  { value: 'ACADEMIC_PRESS', label: 'একাডেমিক ও বিশ্ববিদ্যালয় প্রেস (Academic Press)' },
  { value: 'GOVERNMENT', label: 'সরকারি সংস্থা (Government / Trust)' },
  { value: 'INDEPENDENT', label: 'স্বাধীন প্রকাশনা (Independent)' },
];

export default function PublishersClient({ initialPublishers }: PublishersClientProps) {
  const [publishers, setPublishers] = useState<any[]>(initialPublishers);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [publisherType, setPublisherType] = useState('COMMERCIAL');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [status, setStatus] = useState('ACTIVE');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredPublishers = useMemo(() => {
    const q = search.toLowerCase();
    return publishers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(q))
    );
  }, [publishers, search]);

  const totalPages = Math.ceil(filteredPublishers.length / pageSize) || 1;
  const paginatedPublishers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPublishers.slice(start, start + pageSize);
  }, [filteredPublishers, currentPage, pageSize]);

  const openCreateModal = () => {
    setEditingPublisher(null);
    setName('');
    setNameEn('');
    setSlug('');
    setPublisherType('COMMERCIAL');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setAddress('');
    setDescription('');
    setIsVerified(true);
    setStatus('ACTIVE');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (pub: any) => {
    setEditingPublisher(pub);
    setName(pub.name || '');
    setNameEn(pub.nameEn || '');
    setSlug(pub.slug || '');
    setPublisherType(pub.publisherType || 'COMMERCIAL');
    setContactPerson(pub.contactPerson || '');
    setEmail(pub.email || '');
    setPhone(pub.phone || '');
    setWebsite(pub.website || '');
    setAddress(pub.address || '');
    setDescription(pub.description || '');
    setIsVerified(Boolean(pub.isVerified));
    setStatus(pub.status || 'ACTIVE');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('প্রকাশনীর নাম আবশ্যক');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const url = editingPublisher
        ? `/api/publishing/publishers/${editingPublisher.id}`
        : '/api/publishing/publishers';
      const method = editingPublisher ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          nameEn,
          slug,
          publisherType,
          contactPerson,
          email,
          phone,
          website,
          address,
          description,
          isVerified,
          status,
        }),
      });

      const data = await res.json();
      if (data.success && data.publisher) {
        if (editingPublisher) {
          setPublishers(
            publishers.map((p) =>
              p.id === editingPublisher.id
                ? { ...p, ...data.publisher }
                : p
            )
          );
          setSuccessMsg('প্রকাশক তথ্য আপডেট হয়েছে');
        } else {
          setPublishers([
            { ...data.publisher, _count: { magazines: 0, books: 0, members: 0 }, magazines: [] },
            ...publishers,
          ]);
          setSuccessMsg('নতুন প্রকাশক সফলভাবে নিবন্ধিত হয়েছে');
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

  const handleToggleStatus = async (pub: any) => {
    const nextStatus = pub.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/publishing/publishers/${pub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishers(
          publishers.map((p) => (p.id === pub.id ? { ...p, status: nextStatus } : p))
        );
        setSuccessMsg(`প্রকাশক স্ট্যাটাস ${nextStatus === 'ACTIVE' ? 'সক্রিয়' : 'স্থগিত'} করা হয়েছে`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/publishing"
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              <span>প্রকাশক ও সংস্থা পরিচালনা (Publishers & Organizations)</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              মোট {toBengaliNumber(publishers.length)}টি নিবন্ধিত প্রকাশনা সংস্থা ও প্রতিষ্ঠান
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন প্রকাশক যোগ করুন</span>
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
            placeholder="প্রকাশনীর নাম, যোগাযোগ বা ইমেইল খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Publishers Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-bold">প্রকাশনা সংস্থা</th>
                <th className="py-3 px-4 font-bold">সংস্থার ধরন</th>
                <th className="py-3 px-4 font-bold">যোগাযোগ ও ঠিকানা</th>
                <th className="py-3 px-4 font-bold">সাময়িকী</th>
                <th className="py-3 px-4 font-bold">স্ট্যাটাস</th>
                <th className="py-3 px-4 font-bold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedPublishers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    কোনো প্রকাশক পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedPublishers.map((pub) => (
                  <tr key={pub.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
                              {pub.name}
                            </span>
                            {pub.isVerified && (
                              <span title="ভেরিফাইড প্রতিষ্ঠান" className="inline-flex">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          {pub.nameEn && (
                            <span className="text-[10px] text-stone-400 block truncate">
                              {pub.nameEn}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {pub.publisherType || 'COMMERCIAL'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                      <div>
                        {pub.contactPerson && <span className="font-semibold block">{pub.contactPerson}</span>}
                        {pub.phone && <span className="text-[10px] text-stone-400 block font-mono">{pub.phone}</span>}
                        {pub.email && <span className="text-[10px] text-stone-400 block">{pub.email}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>{toBengaliNumber(pub._count?.magazines || pub.magazines?.length || 0)}টি</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {pub.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>সক্রিয়</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <ShieldAlert className="w-3 h-3" />
                          <span>স্থগিত</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(pub)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition text-[11px] font-semibold"
                          title={pub.status === 'ACTIVE' ? 'স্থগিত করুন' : 'সক্রিয় করুন'}
                        >
                          {pub.status === 'ACTIVE' ? 'স্থগিত' : 'সক্রিয়'}
                        </button>
                        <button
                          onClick={() => openEditModal(pub)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPublishers.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="টি প্রতিষ্ঠান"
          />
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {editingPublisher ? 'প্রকাশক তথ্য সম্পাদনা' : 'নতুন প্রকাশক / সংস্থা নিবন্ধন'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    প্রকাশনীর নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingPublisher) {
                        setSlug(e.target.value.toLowerCase().replace(/[\s\W-]+/g, '-'));
                      }
                    }}
                    required
                    placeholder="যেমন: ইসলামিক রিসার্চ একাডেমি"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    নাম (ইংরেজি)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Islamic Research Academy"
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
                    placeholder="islamic-research-academy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    প্রকাশক / সংস্থার ধরন
                  </label>
                  <select
                    value={publisherType}
                    onChange={(e) => setPublisherType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {PUBLISHER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    যোগাযোগ ব্যক্তি
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="যেমন: মুফতি আব্দুল হক"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ইমেইল
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="editor@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ওয়েবসাইট
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ঠিকানা
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ঢাকা, বাংলাদেশ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>যাচাইকৃত প্রতিষ্ঠান (Verified Publisher)</span>
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
