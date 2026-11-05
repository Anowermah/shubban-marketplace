'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Upload,
  Folder,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Check,
  Filter,
  Loader2,
  ExternalLink,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  HardDrive,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export interface MediaPickerAsset {
  id: string;
  title: string;
  fileName: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  mediumUrl?: string | null;
  mimeType: string;
  mediaType: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
}

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: MediaPickerAsset[]) => void;
  allowedTypes?: Array<'IMAGE' | 'PDF' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'ARCHIVE' | 'ALL'>;
  multiple?: boolean;
  title?: string;
  initialSelectedUrl?: string;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = ['ALL'],
  multiple = false,
  title = 'মিডিয়া লাইব্রেরি থেকে ফাইল নির্বাচন করুন',
  initialSelectedUrl,
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [assets, setAssets] = useState<MediaPickerAsset[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(allowedTypes[0] || 'ALL');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<MediaPickerAsset[]>([]);
  const [previewAsset, setPreviewAsset] = useState<MediaPickerAsset | null>(null);

  // Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadFolder, setUploadFolder] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch folders
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/media/folders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFolders(data.folders || []);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Fetch assets
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedType !== 'ALL') params.set('mediaType', selectedType);
      if (selectedFolder) params.set('folderId', selectedFolder);
      params.set('limit', '40');

      const res = await fetch(`/api/media/assets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
        // Auto-select initial if provided
        if (initialSelectedUrl && selectedAssets.length === 0) {
          const matched = (data.assets || []).find((a: any) => a.publicUrl === initialSelectedUrl);
          if (matched) {
            setSelectedAssets([matched]);
            setPreviewAsset(matched);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, search, selectedType, selectedFolder]);

  // Handle asset toggle click
  const handleToggleSelect = (asset: MediaPickerAsset) => {
    setPreviewAsset(asset);
    if (multiple) {
      const exists = selectedAssets.some((a) => a.id === asset.id);
      if (exists) {
        setSelectedAssets(selectedAssets.filter((a) => a.id !== asset.id));
      } else {
        setSelectedAssets([...selectedAssets, asset]);
      }
    } else {
      setSelectedAssets([asset]);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedAssets.length === 0 && previewAsset) {
      onSelect([previewAsset]);
    } else {
      onSelect(selectedAssets);
    }
    onClose();
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    try {
      setUploading(true);
      setUploadError('');
      setUploadProgress(20);

      const formData = new FormData();
      for (const file of uploadFiles) {
        formData.append('files', file);
      }
      if (uploadFolder) {
        formData.append('folderId', uploadFolder);
      }

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      setUploadProgress(100);

      if (data.success && data.assets && data.assets.length > 0) {
        // Refresh library and auto-select
        setAssets((prev) => [...data.assets, ...prev]);
        if (multiple) {
          setSelectedAssets((prev) => [...data.assets, ...prev]);
        } else {
          setSelectedAssets([data.assets[0]]);
          setPreviewAsset(data.assets[0]);
        }
        setUploadFiles([]);
        setActiveTab('browse');
      } else {
        setUploadError(data.error || 'আপলোড ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setUploadError(err.message || 'আপলোড প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm font-bengali animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-5xl h-[88vh] max-h-[750px] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {title}
              </h3>
              <p className="text-[11px] text-stone-500">
                {multiple ? 'এক বা একাধিক ফাইল নির্বাচন করুন' : 'একটি ফাইল নির্বাচন করুন'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nav Tabs */}
            <div className="flex items-center bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'browse'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                লাইব্রেরি ব্রাউজ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>নতুন আপলোড</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Browse Media Library */}
        {activeTab === 'browse' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Main Content: Search, Filters, Assets Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800">
              {/* Filter Toolbar */}
              <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 bg-stone-50/50 dark:bg-stone-900/50">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ফাইলের নাম বা শিরোনাম খুঁজুন..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {folders.length > 0 && (
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="text-xs py-1.5 px-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-700 dark:text-stone-200"
                    >
                      <option value="">সকল ফোল্ডার</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({toBengaliNumber(f.assetCount || 0)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Media Type Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
                  {['ALL', 'IMAGE', 'PDF', 'DOCUMENT', 'AUDIO', 'VIDEO'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        selectedType === type
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {type === 'ALL' && 'সকল'}
                      {type === 'IMAGE' && 'ছবি'}
                      {type === 'PDF' && 'পিডিএফ'}
                      {type === 'DOCUMENT' && 'ডকুমেন্ট'}
                      {type === 'AUDIO' && 'অডিও'}
                      {type === 'VIDEO' && 'ভিডিও'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Assets */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-2 text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-xs">মিডিয়া লোড হচ্ছে...</span>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3 text-stone-400 text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                        কোনো মিডিয়া ফাইল পাওয়া যায়নি
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        নতুন ফাইল যোগ করতে উপরের 'নতুন আপলোড' ট্যাবে ক্লিক করুন।
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {assets.map((asset) => {
                      const isSelected = selectedAssets.some((a) => a.id === asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => handleToggleSelect(asset)}
                          className={`group relative rounded-2xl border cursor-pointer overflow-hidden transition-all duration-200 ${
                            isSelected
                              ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20'
                              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-850'
                          }`}
                        >
                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md animate-in zoom-in-75">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Media Preview Box */}
                          <div className="w-full aspect-square bg-stone-100 dark:bg-stone-900 flex items-center justify-center overflow-hidden">
                            {asset.mediaType === 'IMAGE' ? (
                              <img
                                src={asset.thumbnailUrl || asset.publicUrl}
                                alt={asset.altText || asset.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : asset.mediaType === 'PDF' ? (
                              <div className="flex flex-col items-center gap-1.5 text-rose-500">
                                <FileText className="w-10 h-10" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                  PDF
                                </span>
                              </div>
                            ) : asset.mediaType === 'AUDIO' ? (
                              <div className="flex flex-col items-center gap-1.5 text-indigo-500">
                                <Music className="w-10 h-10" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                  AUDIO
                                </span>
                              </div>
                            ) : asset.mediaType === 'VIDEO' ? (
                              <div className="flex flex-col items-center gap-1.5 text-purple-500">
                                <Video className="w-10 h-10" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                  VIDEO
                                </span>
                              </div>
                            ) : (
                              <FileText className="w-10 h-10 text-stone-400" />
                            )}
                          </div>

                          {/* File Details Caption */}
                          <div className="p-2 space-y-0.5">
                            <h5 className="font-medium text-[11px] text-stone-800 dark:text-stone-200 truncate" title={asset.title || asset.fileName}>
                              {asset.title || asset.fileName}
                            </h5>
                            <div className="flex items-center justify-between text-[10px] text-stone-400">
                              <span>{asset.fileSizeFormatted}</span>
                              {asset.width && asset.height && (
                                <span>{asset.width}×{asset.height}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Active Asset Inspector Panel */}
            <div className="w-full md:w-72 bg-stone-50 dark:bg-stone-850 p-4 flex flex-col justify-between overflow-y-auto">
              {previewAsset ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 max-h-48 flex items-center justify-center p-2">
                    {previewAsset.mediaType === 'IMAGE' ? (
                      <img
                        src={previewAsset.publicUrl}
                        alt={previewAsset.altText || previewAsset.title}
                        className="max-h-44 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="py-8 flex flex-col items-center gap-2 text-stone-500">
                        <FileText className="w-12 h-12 text-amber-600" />
                        <span className="text-xs font-bold">{previewAsset.mediaType}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] block">শিরোনাম</span>
                      <strong className="text-stone-800 dark:text-stone-200 text-xs break-all">
                        {previewAsset.title || previewAsset.fileName}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-stone-400 text-[10px] block">সাইজ</span>
                        <span className="font-serif">{previewAsset.fileSizeFormatted}</span>
                      </div>
                      {previewAsset.width && previewAsset.height && (
                        <div>
                          <span className="text-stone-400 text-[10px] block">রেজোলিউশন</span>
                          <span>{previewAsset.width} × {previewAsset.height} px</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-stone-400 text-[10px] block">MIME Type</span>
                      <span className="font-mono text-[10px] text-stone-500 break-all">{previewAsset.mimeType}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 text-[10px] block">ফাইল লিংক</span>
                      <a
                        href={previewAsset.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 hover:underline break-all text-[11px] inline-flex items-center gap-1"
                      >
                        <span>ওপেন প্রিভিউ</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center p-4">
                  <Eye className="w-8 h-8 stroke-1 text-stone-300 dark:text-stone-600 mb-2" />
                  <p className="text-xs">ফাইল সিলেক্ট করে বিস্তারিত ও প্রিভিউ দেখুন</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload New Media */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-center">
            <form onSubmit={handleUploadSubmit} className="w-full max-w-lg space-y-4">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-850/50 hover:bg-amber-50/10"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadFiles(Array.from(e.target.files));
                    }
                  }}
                  multiple={multiple}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>

                <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                  ফাইল ড্রপ করুন অথবা ব্রাউজ করুন
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  JPG, PNG, WebP, PDF, DOCX, MP3, MP4 ফাইল সমর্থিত (সর্বোচ্চ ৬০MB)
                </p>

                {uploadFiles.length > 0 && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>{toBengaliNumber(uploadFiles.length)}টি ফাইল নির্বাচিত হয়েছে</span>
                  </div>
                )}
              </div>

              {/* Folder Selector */}
              {folders.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ফোল্ডারে রাখুন (ঐচ্ছিক)
                  </label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">মূল লাইব্রেরি (কোনো ফোল্ডার নয়)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Error Alert */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                  {uploadError}
                </div>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {/* Upload CTA Button */}
              <button
                type="submit"
                disabled={uploading || uploadFiles.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>আপলোড ও প্রসেসিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>আপলোড নিশ্চিত করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-850">
          <div className="text-xs text-stone-500">
            {selectedAssets.length > 0 ? (
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {toBengaliNumber(selectedAssets.length)}টি ফাইল নির্বাচিত
              </span>
            ) : (
              <span>কোনো ফাইল নির্বাচিত হয়নি</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedAssets.length === 0 && !previewAsset}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>নির্বাচন করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

