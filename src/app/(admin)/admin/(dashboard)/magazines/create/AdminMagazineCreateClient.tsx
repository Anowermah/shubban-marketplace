'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MediaPickerInput from '@/components/media/MediaPickerInput';
import {
  Newspaper,
  Upload,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Layers,
  Eye,
  Shield,
  Download,
  Share2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface AdminMagazineCreateClientProps {
  magazines: any[];
  recentFiles: any[];
}

const MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export default function AdminMagazineCreateClient({
  magazines,
  recentFiles,
}: AdminMagazineCreateClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [magazineId, setMagazineId] = useState(magazines[0]?.id || '');
  const [title, setTitle] = useState('');
  const [issueNumber, setIssueNumber] = useState('০১');
  const [volume, setVolume] = useState('০১');
  const [publicationMonth, setPublicationMonth] = useState('জানুয়ারি');
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear());
  const [editor, setEditor] = useState('');
  const [editorialMessage, setEditorialMessage] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pageCount, setPageCount] = useState<number | ''>(64);
  const [fileSize, setFileSize] = useState('');
  const [language, setLanguage] = useState('bn');
  const [tags, setTags] = useState('ইসলাম, সাহিত্য, সাময়িকী');
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowShare, setAllowShare] = useState(true);
  const [readOnline, setReadOnline] = useState(true);
  const [requireLogin, setRequireLogin] = useState(false);
  const [status, setStatus] = useState('PUBLISHED');

  // Handle direct PDF upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPdf(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);

      const res = await fetch('/api/publications/files', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.file) {
        setPdfUrl(data.file.fileUrl);
        setFileSize(data.file.fileSize || '');
        if (!title) setTitle(data.file.title || '');
      } else {
        setErrorMsg(data.error || 'পিডিএফ আপলোড ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'পিডিএফ আপলোডে ত্রুটি');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magazineId) {
      setErrorMsg('অনুগ্রহ করে সাময়িকী সিরিজ নির্বাচন করুন');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('সংখ্যার শিরোনাম আবশ্যক');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch('/api/publications/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magazineId,
          title,
          issueNumber,
          volume,
          publicationDate: new Date(publicationYear, MONTHS.indexOf(publicationMonth) || 0, 1),
          coverImage: coverImage || null,
          pdfUrl: pdfUrl || null,
          editor: editor || null,
          editorialMessage: editorialMessage || null,
          description: description || null,
          pageCount: pageCount ? Number(pageCount) : null,
          fileSize: fileSize || null,
          language,
          isFeatured,
          allowDownload,
          allowShare,
          readOnline,
          requireLogin,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('নতুন পত্রিকা সংখ্যা সফলভাবে তৈরি ও প্রকাশিত হয়েছে!');
        setTimeout(() => {
          router.push('/admin/magazines');
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'সংরক্ষণ প্রক্রিয়ায় ত্রুটি ঘটেছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/magazines"
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              <span>নতুন পত্রিকা সংখ্যা তৈরি</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              সাময়িকীর নতুন সংখ্যা তৈরি, প্রচ্ছদ ও পিডিএফ ফাইল সংযুক্তকরণ
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <Layers className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <span>মৌলিক বিবরণ</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  সাময়িকী সিরিজ *
                </label>
                <select
                  value={magazineId}
                  onChange={(e) => setMagazineId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {magazines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  সংখ্যার শিরোনাম *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: বিশেষ মাহে রমাদান সংখ্যা"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  সংখ্যা নম্বর
                </label>
                <input
                  type="text"
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                  placeholder="যেমন: ১২"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  বর্ষ / ভলিউম
                </label>
                <input
                  type="text"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  placeholder="যেমন: ০৪"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  প্রকাশের মাস
                </label>
                <select
                  value={publicationMonth}
                  onChange={(e) => setPublicationMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  প্রকাশের বছর
                </label>
                <input
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                সংক্ষিপ্ত সারসংক্ষেপ / বিষয়বস্তু
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="এই সংখ্যার প্রধান বিষয় ও প্রবন্ধসমূহ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Editorial & Contributors Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <span>সম্পাদকীয় ও বার্তা</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                সম্পাদক / সম্পাদনা পরিষদের নাম
              </label>
              <input
                type="text"
                value={editor}
                onChange={(e) => setEditor(e.target.value)}
                placeholder="যেমন: মাওলানা মুহাম্মাদ আব্দুল্লাহ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                সম্পাদকীয় বার্তা (Editorial Message)
              </label>
              <textarea
                rows={4}
                value={editorialMessage}
                onChange={(e) => setEditorialMessage(e.target.value)}
                placeholder="সম্পাদকীয় কলাম ও পাঠকের প্রতি বাণী..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* PDF Attachment & Metadata */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <Upload className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <span>PDF ফাইল ও রিডার সংযোগ</span>
            </h2>

            {/* Direct Upload Box */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 text-center space-y-2">
              <Upload className="w-8 h-8 mx-auto text-stone-400" />
              <div className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                কম্পিউটার থেকে সরাসরি PDF ফাইল নির্বাচন বা ড্র্যাগ করুন
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploadingPdf}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
              />
              {uploadingPdf && (
                <p className="text-xs text-amber-600 animate-pulse font-bold">
                  PDF আপলোড ও প্রসেসিং হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  PDF URL / ফাইল পাথ
                </label>
                <input
                  type="text"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="/uploads/publications/... বা অনলাইন লিংক"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  ফাইল সাইজ
                </label>
                <input
                  type="text"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="যেমন: 14.8 MB"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  মোট পৃষ্ঠা সংখ্যা
                </label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="যেমন: ৬৪"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  ভাষা
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Existing PDF Picker */}
            {recentFiles.length > 0 && !pdfUrl && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                  অথবা সাম্প্রতিক আপলোডকৃত ফাইল থেকে বেছে নিন:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  {recentFiles.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setPdfUrl(f.fileUrl);
                        setFileSize(f.fileSize || '');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-stone-700 dark:text-stone-300 truncate max-w-xs"
                    >
                      {f.fileName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Publish Control & Cover Image */}
        <div className="space-y-6">
          {/* Publish Action Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <span>প্রকাশনা নিয়ন্ত্রণ</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                স্ট্যাটাস
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="PUBLISHED">প্রকাশিত (Published)</option>
                <option value="DRAFT">খসড়া (Draft)</option>
                <option value="SCHEDULED">শিডিউল (Scheduled)</option>
                <option value="ARCHIVED">আর্কাইভ (Archived)</option>
              </select>
            </div>

            <div className="pt-2 space-y-3 border-t border-stone-100 dark:border-stone-800">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>হোমপেজে ফিচার্ড করুন (Featured)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={readOnline}
                  onChange={(e) => setReadOnline(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>অনলাইন রিডারে পড়া যাবে (Read Online)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>সরাসরি ডাউনলোড অনুমোদন (Allow Download)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={allowShare}
                  onChange={(e) => setAllowShare(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>সোশ্যাল শেয়ার বাটন প্রদর্শন (Allow Share)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={requireLogin}
                  onChange={(e) => setRequireLogin(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>পড়া ও ডাউনলোডের জন্য লগইন আবশ্যক</span>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'সংরক্ষণ হচ্ছে...' : 'পত্রিকা সংখ্যা প্রকাশ করুন'}
              </button>
            </div>
          </div>

          {/* Cover Image Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <ImageIcon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <span>প্রচ্ছদ ছবি (Cover)</span>
            </h2>

            <MediaPickerInput
              label="প্রচ্ছদ ছবি (Cover Image)"
              value={coverImage}
              onChange={(url) => setCoverImage(url)}
              allowedTypes={['IMAGE']}
              placeholder="প্রচ্ছদের লিঙ্ক লিখুন বা মিডিয়া লাইব্রেরি থেকে সিলেক্ট করুন"
              helpText="সাময়িকীর সম্মুখ প্রচ্ছদ ইমেজ (JPG, PNG, WebP)"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

