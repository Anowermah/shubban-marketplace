'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Newspaper,
  BookOpen,
  Plus,
  Download,
  Eye,
  Lock,
  Search,
  X,
  CheckCircle2,
  Edit,
  Trash2,
  Calendar,
  ExternalLink,
  Share2,
  FileText,
  Clock,
  Layers,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminMagazinesClientProps {
  initialMagazines: any[];
  initialIssues: any[];
  categories: any[];
  publishers: any[];
}

export default function AdminMagazinesClient({
  initialMagazines,
  initialIssues,
  categories,
  publishers,
}: AdminMagazinesClientProps) {
  const [activeTab, setActiveTab] = useState<'issues' | 'series'>('issues');
  const [magazines, setMagazines] = useState(initialMagazines);
  const [issues, setIssues] = useState(initialIssues);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any | null>(null);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Issue Form States
  const [issueForm, setIssueForm] = useState({
    magazineId: magazines[0]?.id || '',
    issueTitle: '',
    volume: '১ম বর্ষ',
    issueNumber: '১ম সংখ্যা',
    publicationDate: new Date().toISOString().split('T')[0],
    coverImage: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=600',
    pdfUrl: '/samples/magazine-shubban-vol1-issue5.pdf',
    fileSize: '5.5 MB',
    pageCount: 48,
    summary: '',
    toc: '',
    allowDownload: true,
    allowShare: true,
    readOnline: true,
    requireLogin: false,
    status: 'PUBLISHED',
  });

  // Series Form States
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    titleEn: '',
    slug: '',
    frequency: 'MONTHLY',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=600',
    editor: '',
    editorialMessage: '',
    categoryId: categories[0]?.id || '',
    publisherId: publishers[0]?.id || '',
    status: 'PUBLISHED',
  });

  // Filter Issues
  const filteredIssues = issues.filter((iss) => {
    const matchesSearch =
      !search ||
      iss.issueTitle.toLowerCase().includes(search.toLowerCase()) ||
      iss.magazine.title.toLowerCase().includes(search.toLowerCase()) ||
      (iss.volume && iss.volume.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || iss.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredIssues.length / pageSize);
  const paginatedIssues = filteredIssues.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Open Issue Modal for Create or Edit
  const handleOpenIssueModal = (issue?: any) => {
    if (issue) {
      setEditingIssue(issue);
      setIssueForm({
        magazineId: issue.magazineId,
        issueTitle: issue.issueTitle,
        volume: issue.volume || '',
        issueNumber: issue.issueNumber || '',
        publicationDate: new Date(issue.publicationDate).toISOString().split('T')[0],
        coverImage: issue.coverImage,
        pdfUrl: issue.pdfUrl,
        fileSize: issue.fileSize || '5.5 MB',
        pageCount: issue.pageCount || 48,
        summary: issue.summary || '',
        toc: issue.toc || '',
        allowDownload: issue.allowDownload !== false,
        allowShare: issue.allowShare !== false,
        readOnline: issue.readOnline !== false,
        requireLogin: Boolean(issue.requireLogin),
        status: issue.status || 'PUBLISHED',
      });
    } else {
      setEditingIssue(null);
      setIssueForm({
        magazineId: magazines[0]?.id || '',
        issueTitle: '',
        volume: '১ম বর্ষ',
        issueNumber: '১ম সংখ্যা',
        publicationDate: new Date().toISOString().split('T')[0],
        coverImage: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=600',
        pdfUrl: '/samples/magazine-shubban-vol1-issue5.pdf',
        fileSize: '5.5 MB',
        pageCount: 48,
        summary: '',
        toc: '',
        allowDownload: true,
        allowShare: true,
        readOnline: true,
        requireLogin: false,
        status: 'PUBLISHED',
      });
    }
    setShowIssueModal(true);
  };

  // Submit Issue
  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const url = editingIssue
        ? `/api/publications/issues/${editingIssue.id}`
        : '/api/publications/issues';
      const method = editingIssue ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueForm),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');

      if (editingIssue) {
        setIssues((prev) => prev.map((iss) => (iss.id === editingIssue.id ? data.issue : iss)));
        setFeedback({ type: 'success', message: 'সংখ্যাটি সফলভাবে আপডেট করা হয়েছে।' });
      } else {
        setIssues((prev) => [data.issue, ...prev]);
        setFeedback({ type: 'success', message: 'নতুন সংখ্যা সফলভাবে প্রকাশিত হয়েছে।' });
      }

      setShowIssueModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Issue
  const handleDeleteIssue = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই সংখ্যাটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/publications/issues/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'মুছে ফেলা সম্ভব হয়নি');

      setIssues((prev) => prev.filter((i) => i.id !== id));
      setFeedback({ type: 'success', message: 'সংখ্যাটি মুছে ফেলা হয়েছে।' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Toggle Quick Status (Publish / Archive / Draft)
  const handleToggleStatus = async (issue: any, newStatus: string) => {
    try {
      const res = await fetch(`/api/publications/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setIssues((prev) =>
          prev.map((i) => (i.id === issue.id ? { ...i, status: newStatus } : i))
        );
      }
    } catch (e) { }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Newspaper className="w-5 h-5" />
            </span>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
              মাসিক সাময়িকী ও প্রকাশনা প্রশাসন
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            মাসিক সাময়িকী, নতুন সংখ্যা প্রকাশ, PDF ফাইল আপলোড, পারমিশন ও এক্সেস কন্ট্রোল
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/publications/analytics"
            className="px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition border border-stone-200 dark:border-stone-700"
          >
            <Eye className="w-4 h-4 text-amber-600" />
            <span>পাঠক অ্যানালিটিক্স</span>
          </Link>

          <button
            onClick={() => handleOpenIssueModal()}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সংখ্যা প্রকাশ করুন</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl border border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'issues'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
          >
            সংখ্যা তালিকা ({toBengaliNumber(issues.length)})
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'series'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
          >
            সাময়িকী সিরিজ ({toBengaliNumber(magazines.length)})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="সংখ্যা বা সাময়িকী খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="PUBLISHED">প্রকাশিত (Published)</option>
            <option value="DRAFT">খসড়া (Draft)</option>
            <option value="SCHEDULED">শিডিউলড (Scheduled)</option>
            <option value="ARCHIVED">আর্কাইভড (Archived)</option>
          </select>
        </div>
      </div>

      {/* Main Content: Issues List */}
      {activeTab === 'issues' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <th className="py-3 px-4">প্রচ্ছদ ও শিরোনাম</th>
                  <th className="py-3 px-4">সাময়িকী</th>
                  <th className="py-3 px-4">প্রকাশনার তারিখ</th>
                  <th className="py-3 px-4">পারমিশন</th>
                  <th className="py-3 px-4">রিডার ও ডাউনলোড</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                {paginatedIssues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 shadow-sm border border-stone-200 dark:border-stone-700">
                          <Image
                            src={iss.coverImage}
                            alt={iss.issueTitle}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/magazine/read/${iss.id}`}
                            target="_blank"
                            className="font-serif font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 transition truncate block max-w-xs"
                            title={iss.issueTitle}
                          >
                            {iss.issueTitle}
                          </Link>
                          <span className="text-[11px] text-stone-400 block">
                            {iss.volume} • {iss.issueNumber} • {toBengaliNumber(iss.pageCount || 48)} পৃষ্ঠা
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-stone-700 dark:text-stone-300">
                      {iss.magazine.title}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                      {formatBengaliDate(iss.publicationDate)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${iss.allowDownload !== false
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-stone-500/10 text-stone-400'
                            }`}
                          title="ডাউনলোড পারমিশন"
                        >
                          ডাউনলোড
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${iss.requireLogin
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-blue-500/10 text-blue-600'
                            }`}
                          title="লগইন পলিসি"
                        >
                          {iss.requireLogin ? 'লগইন আবশ্যক' : 'উন্মুক্ত'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-[11px] space-y-0.5">
                        <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
                          <Eye className="w-3 h-3 text-amber-500" />
                          {toBengaliNumber(iss.views || 0)} ভিউ
                        </span>
                        <span className="flex items-center gap-1 text-stone-500">
                          <Download className="w-3 h-3 text-stone-400" />
                          {toBengaliNumber(iss.downloads || 0)} ডাউনলোড
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={iss.status}
                        onChange={(e) => handleToggleStatus(iss, e.target.value)}
                        className={`text-[10px] font-bold rounded-lg px-2 py-1 border transition ${iss.status === 'PUBLISHED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-300 dark:border-emerald-800'
                            : iss.status === 'DRAFT'
                              ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 border-stone-300 dark:border-stone-700'
                              : iss.status === 'SCHEDULED'
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-300 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-300 dark:border-rose-800'
                          }`}
                      >
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/magazine/read/${iss.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="লাইভ প্রিভিউ দেখুন"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenIssueModal(iss)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="এডিট করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteIssue(iss.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unified Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredIssues.length}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemName="টি সংখ্যা"
              />
            </div>
          )}
        </div>
      )}

      {/* Series List Tab */}
      {activeTab === 'series' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {magazines.map((mag) => (
            <div
              key={mag.id}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 border border-stone-200 dark:border-stone-700 shadow-sm">
                    <Image
                      src={mag.coverImage}
                      alt={mag.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      {mag.category.name}
                    </span>
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                      {mag.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      মোট {toBengaliNumber(mag._count?.issues || 0)}টি প্রকাশিত সংখ্যা
                    </p>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed mb-4">
                  {mag.description}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <Link
                  href={`/magazine/${mag.slug}`}
                  target="_blank"
                  className="text-amber-600 font-semibold hover:underline flex items-center gap-1"
                >
                  পাবলিক পেজ <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                  {mag.frequency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-6">
              <h2 className="font-serif font-black text-lg sm:text-xl text-stone-900 dark:text-stone-100">
                {editingIssue ? 'সংখ্যা সম্পাদনা করুন' : 'নতুন সাময়িকী সংখ্যা প্রকাশ'}
              </h2>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIssue} className="space-y-4 text-xs">
              {/* Select Magazine */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  মূল সাময়িকী *
                </label>
                <select
                  value={issueForm.magazineId}
                  onChange={(e) => setIssueForm({ ...issueForm, magazineId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                >
                  {magazines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  সংখ্যার শিরোনাম *
                </label>
                <input
                  type="text"
                  value={issueForm.issueTitle}
                  onChange={(e) => setIssueForm({ ...issueForm, issueTitle: e.target.value })}
                  placeholder="যেমন: বর্ষ ১, সংখ্যা ৫ — আধুনিকতা ও ঐতিহ্য বিতর্ক"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Volume, Issue Number, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    বর্ষ / ভলিউম
                  </label>
                  <input
                    type="text"
                    value={issueForm.volume}
                    onChange={(e) => setIssueForm({ ...issueForm, volume: e.target.value })}
                    placeholder="১ম বর্ষ"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    সংখ্যা
                  </label>
                  <input
                    type="text"
                    value={issueForm.issueNumber}
                    onChange={(e) => setIssueForm({ ...issueForm, issueNumber: e.target.value })}
                    placeholder="৫ম সংখ্যা"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রকাশের তারিখ
                  </label>
                  <input
                    type="date"
                    value={issueForm.publicationDate}
                    onChange={(e) => setIssueForm({ ...issueForm, publicationDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Cover Image & PDF URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রচ্ছদ ছবির URL *
                  </label>
                  <input
                    type="text"
                    value={issueForm.coverImage}
                    onChange={(e) => setIssueForm({ ...issueForm, coverImage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    PDF ফাইলের পাথ / URL *
                  </label>
                  <input
                    type="text"
                    value={issueForm.pdfUrl}
                    onChange={(e) => setIssueForm({ ...issueForm, pdfUrl: e.target.value })}
                    placeholder="/samples/magazine-shubban-vol1-issue5.pdf"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>
              </div>

              {/* Page Count & File Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    মোট পৃষ্ঠা সংখ্যা
                  </label>
                  <input
                    type="number"
                    value={issueForm.pageCount}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, pageCount: parseInt(e.target.value) || 48 })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ফাইল সাইজ
                  </label>
                  <input
                    type="text"
                    value={issueForm.fileSize}
                    onChange={(e) => setIssueForm({ ...issueForm, fileSize: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  সংক্ষিপ্ত সম্পাদকীয় বা সারাংশ
                </label>
                <textarea
                  rows={2}
                  value={issueForm.summary}
                  onChange={(e) => setIssueForm({ ...issueForm, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Table of contents */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  সূচিপত্র (TOC)
                </label>
                <textarea
                  rows={3}
                  value={issueForm.toc}
                  onChange={(e) => setIssueForm({ ...issueForm, toc: e.target.value })}
                  placeholder="১. সম্পাদকীয়&#10;২. গবেষণাপত্র — গবেষক নাম&#10;৩. গ্রন্থ সমালোচনা"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>

              {/* Permissions & Security Flags */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3">
                <span className="font-bold text-stone-800 dark:text-stone-200 block">
                  নিরাপত্তা ও অ্যাক্সেস পারমিশন পলিসি
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={issueForm.readOnline}
                      onChange={(e) => setIssueForm({ ...issueForm, readOnline: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>অনলাইন রিডার</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={issueForm.allowDownload}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, allowDownload: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>PDF ডাউনলোড</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={issueForm.allowShare}
                      onChange={(e) => setIssueForm({ ...issueForm, allowShare: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>শেয়ারিং অনুমতি</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={issueForm.requireLogin}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, requireLogin: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>লগইন আবশ্যক</span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  প্রকাশনা স্ট্যাটাস
                </label>
                <select
                  value={issueForm.status}
                  onChange={(e) => setIssueForm({ ...issueForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                >
                  <option value="PUBLISHED">PUBLISHED (তাত্ক্ষণিক প্রকাশ)</option>
                  <option value="DRAFT">DRAFT (খসড়া)</option>
                  <option value="SCHEDULED">SCHEDULED (শিডিউলড)</option>
                  <option value="ARCHIVED">ARCHIVED (আর্কাইভড)</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-900/30 transition disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : editingIssue ? 'আপডেট করুন' : 'প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

