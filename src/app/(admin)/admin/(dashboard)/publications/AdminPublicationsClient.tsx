'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Newspaper,
  BookOpen,
  Plus,
  Download,
  Eye,
  Lock,
  List,
  Search,
  X,
  CheckCircle2,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationsClientProps {
  initialIssues: any[];
  magazines: any[];
}

export default function AdminPublicationsClient({
  initialIssues,
  magazines,
}: AdminPublicationsClientProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Form states
  const [magazineId, setMagazineId] = useState(magazines[0]?.id || '');
  const [issueTitle, setIssueTitle] = useState('');
  const [volume, setVolume] = useState('বর্ষ ০১');
  const [issueNumber, setIssueNumber] = useState('সংখ্যা ০৩');
  const [publicationDate, setPublicationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [coverImage, setCoverImage] = useState('/images/hero-1.jpg');
  const [pdfUrl, setPdfUrl] = useState('/documents/sample-issue.pdf');
  const [summary, setSummary] = useState('');
  const [toc, setToc] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);

  const filteredIssues = issues.filter((iss) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      iss.issueTitle.toLowerCase().includes(term) ||
      iss.magazine.title.toLowerCase().includes(term) ||
      (iss.volume && iss.volume.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredIssues.length / pageSize);
  const paginatedIssues = filteredIssues.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch('/api/admin/publications/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magazineId,
          issueTitle,
          volume,
          issueNumber,
          publicationDate,
          coverImage,
          pdfUrl,
          authorizedPdfUrl: pdfUrl,
          summary,
          toc,
          isFree,
          price: isFree ? 0 : Number(price),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIssues([data.issue, ...issues]);
        setShowCreateModal(false);
        setIssueTitle('');
        setSummary('');
        setToc('');
        setFeedback({ type: 'success', message: 'নতুন সাময়িকী সংখ্যা সফলভাবে প্রকাশিত হয়েছে!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'প্রকাশনায় ত্রুটি হয়েছে।' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'সার্ভার যোগাযোগে ব্যর্থতা।' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="সাময়িকী সংখ্যা অনুসন্ধান..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-shubban-gold/50"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-shubban-gold" />
          <span>নতুন সংখ্যা আপলোড করুন</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4">কভার ও শিরোনাম</th>
                <th className="p-4">সাময়িকী</th>
                <th className="p-4">ভলিউম/সংখ্যা</th>
                <th className="p-4">ডাউনলোড</th>
                <th className="p-4">এক্সেস ধরন</th>
                <th className="p-4 text-right">প্রকাশের তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">
                    কোনো প্রকাশনা সংখ্যা পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                paginatedIssues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="p-4 flex items-center gap-3">
                      <div className="relative w-10 h-14 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                        <Image
                          src={iss.coverImage || '/placeholder.jpg'}
                          alt={iss.issueTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold font-serif text-stone-900 dark:text-stone-100 block line-clamp-1">
                          {iss.issueTitle}
                        </span>
                        {iss.summary && (
                          <span className="text-[10px] text-stone-400 block line-clamp-1 max-w-xs">
                            {iss.summary}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-stone-700 dark:text-stone-300 font-semibold whitespace-nowrap">
                      {iss.magazine.title}
                    </td>
                    <td className="p-4 font-mono font-bold text-stone-600 dark:text-stone-400 whitespace-nowrap">
                      {iss.volume} {iss.issueNumber}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-shubban-green">
                        <Download className="w-3 h-3" />
                        {toBengaliNumber(iss.downloads || 0)}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {iss.isFree ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ফ্রি উন্মুক্ত
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 w-fit">
                          <Lock className="w-2.5 h-2.5" />
                          <span>৳{iss.price}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right text-stone-400 whitespace-nowrap">
                      {formatBengaliDate(iss.publicationDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredIssues.length}
        itemsPerPage={pageSize}
        itemName="সংখ্যা"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
      />

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-shubban-gold" />
                <span>নতুন সাময়িকী সংখ্যা সংযোজন</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">সাময়িকী শিরোনাম *</label>
                  <select
                    value={magazineId}
                    onChange={(e) => setMagazineId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {magazines.map((mag) => (
                      <option key={mag.id} value={mag.id}>
                        {mag.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">সংখ্যার নাম / শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="যেমন: বিশেষ রমযান ও কুরআন সংখ্যা"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">ভলিউম</label>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="বর্ষ ০১"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">সংখ্যা নম্বর</label>
                  <input
                    type="text"
                    value={issueNumber}
                    onChange={(e) => setIssueNumber(e.target.value)}
                    placeholder="সংখ্যা ০২"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">প্রকাশের তারিখ</label>
                  <input
                    type="date"
                    required
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">কভার ছবির লিংক *</label>
                  <input
                    type="text"
                    required
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">অনুমোদিত পিডিএফ ফাইল লিংক *</label>
                  <input
                    type="text"
                    required
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">সংক্ষিপ্ত পরিচিতি</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="এই সংখ্যার প্রধান প্রতিপাদ্য বিষয়..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">সূচিপত্র (TOC)</label>
                <textarea
                  rows={3}
                  value={toc}
                  onChange={(e) => setToc(e.target.value)}
                  placeholder="১. সম্পাদকীয় - পৃষ্ঠা ৩&#10;২. কুরআনের চিরন্তন আলো - পৃষ্ঠা ৭"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-6 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 rounded text-shubban-green"
                  />
                  <span>সবার জন্য উন্মুক্ত (Free Access)</span>
                </label>

                {!isFree && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">মূল্য (৳):</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'প্রকাশ হচ্ছে...' : 'সংখ্যা প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

