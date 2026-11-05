'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Upload,
  Search,
  FileText,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Shield,
  FileCheck,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

interface AdminPublicationFilesClientProps {
  initialFiles: any[];
}

export default function AdminPublicationFilesClient({
  initialFiles,
}: AdminPublicationFilesClientProps) {
  const [files, setFiles] = useState<any[]>(initialFiles);
  const [search, setSearch] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const q = search.toLowerCase();
      return (
        f.fileName.toLowerCase().includes(q) ||
        (f.title && f.title.toLowerCase().includes(q)) ||
        (f.checksum && f.checksum.toLowerCase().includes(q))
      );
    });
  }, [files, search]);

  const totalPages = Math.ceil(filteredFiles.length / pageSize) || 1;
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, currentPage, pageSize]);

  // Handle direct upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('অনুগ্রহ করে একটি ফাইল নির্বাচন করুন');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle || selectedFile.name);
      formData.append('isRestricted', String(isRestricted));

      const res = await fetch('/api/publications/files', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.file) {
        setFiles([
          {
            ...data.file,
            usageCount: 0,
            linkedIssues: [],
            linkedArticles: [],
          },
          ...files,
        ]);
        setSuccessMsg('ফাইল সফলভাবে আপলোড হয়েছে!');
        setUploadModalOpen(false);
        setSelectedFile(null);
        setUploadTitle('');
      } else {
        setErrorMsg(data.error || 'আপলোড ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'আপলোডে ত্রুটি');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: any) => {
    if (file.usageCount > 0) {
      alert(`এই ফাইলটি ${toBengaliNumber(file.usageCount)}টি আইটেমে ব্যবহৃত হচ্ছে। মুছে ফেলা সম্ভব নয়।`);
      return;
    }

    if (!confirm(`আপনি কি নিশ্চিত যে "${file.fileName}" মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      setDeleteLoading(file.id);
      const res = await fetch(`/api/publications/files/${file.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setFiles(files.filter((f) => f.id !== file.id));
        setSuccessMsg('ফাইল মুছে ফেলা হয়েছে');
      } else {
        alert(data.error || 'ফাইল মোছা যায়নি');
      }
    } catch (err: any) {
      alert(err.message || 'ত্রুটি ঘটেছে');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>PDF ফাইল ও মিডিয়া লাইব্রেরি</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট {toBengaliNumber(files.length)}টি সংরক্ষিত PDF ফাইল ও প্রকাশনা রিসোর্স
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setUploadModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>নতুন PDF আপলোড করুন</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            placeholder="ফাইলের নাম বা শিরোনাম খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-bold">ফাইল ও শিরোনাম</th>
                <th className="py-3 px-4 font-bold">সাইজ ও ধরন</th>
                <th className="py-3 px-4 font-bold">ব্যবহার (Linked)</th>
                <th className="py-3 px-4 font-bold">আপলোড তারিখ</th>
                <th className="py-3 px-4 font-bold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    কোনো PDF ফাইল পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 dark:text-stone-100 block truncate max-w-xs">
                            {file.title || file.fileName}
                          </span>
                          <span className="text-[10px] text-stone-400 block truncate max-w-xs font-mono">
                            {file.fileName}
                          </span>
                          {file.checksum && (
                            <span className="text-[9px] text-stone-400 block truncate max-w-xs font-mono">
                              SHA: {file.checksum.slice(0, 16)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                        {file.fileSize || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-stone-400 uppercase">
                        {file.storageType || 'LOCAL'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {file.usageCount > 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            {toBengaliNumber(file.usageCount)}টি প্রকাশনায় যুক্ত
                          </span>
                          <div className="text-[10px] text-stone-400 truncate max-w-[180px]">
                            {file.linkedIssues?.map((i: any) => i.title).join(', ')}
                            {file.linkedArticles?.map((a: any) => a.title).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500">
                          ব্যবহারহীন (Unlinked)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      {formatBengaliDate(file.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                          title="প্রিভিউ দেখুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={file.fileUrl}
                          download
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                          title="ডাউনলোড করুন"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDelete(file)}
                          disabled={deleteLoading === file.id || file.usageCount > 0}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title={file.usageCount > 0 ? 'ব্যবহৃত ফাইল মোছা যাবে না' : 'মুছে ফেলুন'}
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
            totalItems={filteredFiles.length}
            itemsPerPage={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            itemName="টি ফাইল"
          />
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <span>নতুন PDF ফাইল আপলোড</span>
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ফাইলের শিরোনাম / বর্ণনা
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="যেমন: আল-কাওসার রমাদান সংখ্যা ২০২৬"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  PDF ফাইল নির্বাচন করুন *
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={isRestricted}
                    onChange={(e) => setIsRestricted(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>সংরক্ষিত অ্যাক্সেস (শুধু নিবন্ধিত ব্যবহারকারী ডাউনলোড করতে পারবে)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition disabled:opacity-50"
                >
                  {uploading ? 'আপলোড হচ্ছে...' : 'আপলোড নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full h-[85vh] border border-stone-200 dark:border-stone-800 flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {previewFile.title || previewFile.fileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.fileUrl}
                  target="_blank"
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold flex items-center gap-1 text-stone-600 dark:text-stone-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>নতুন ট্যাবে</span>
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-stone-100 dark:bg-stone-950 p-2">
              <iframe
                src={previewFile.fileUrl}
                className="w-full h-full rounded-2xl border-0"
                title={previewFile.title || previewFile.fileName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

