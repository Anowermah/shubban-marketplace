'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Layers,
  LayoutDashboard,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Folder,
  Trash2,
  Upload,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Check,
  Eye,
  ExternalLink,
  Copy,
  Clock,
  HardDrive,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  FolderPlus,
  X,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Maximize2,
  Sparkles,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Share2,
  Code,
  Link as LinkIcon,
} from 'lucide-react';
import { toBengaliNumber, formatBengaliDate } from '@/lib/utils';

interface AdminMediaClientProps {
  initialStats: any;
}

export default function AdminMediaManagerClient({ initialStats }: AdminMediaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'all' | 'images' | 'documents' | 'audio' | 'video' | 'folders' | 'trash' | 'settings'
  >('all');

  const [stats, setStats] = useState(initialStats);
  const [assets, setAssets] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inspector Drawer State
  const [activeAsset, setActiveAsset] = useState<any | null>(null);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAlt, setMetaAlt] = useState('');
  const [metaCaption, setMetaCaption] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [metaFolder, setMetaFolder] = useState('');
  const [metaVisibility, setMetaVisibility] = useState('PUBLIC');
  const [savingMeta, setSavingMeta] = useState(false);

  // Transform & Replace State
  const [transformingImage, setTransformingImage] = useState(false);
  const [replacingFile, setReplacingFile] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Share & Embed Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAsset, setShareAsset] = useState<any | null>(null);
  const [shareSignedUrl, setShareSignedUrl] = useState<string>('');
  const [shareSignedExpiry, setShareSignedExpiry] = useState<string>('86400');
  const [generatingSignedUrl, setGeneratingSignedUrl] = useState(false);

  // PDF Preview Reader Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState<string>('');
  const [pdfModalTitle, setPdfModalTitle] = useState<string>('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFolder, setUploadFolder] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Folder Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#C49A45');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Feedback Notification
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync tab with URL
  useEffect(() => {
    if (urlTab) {
      if (['overview', 'all', 'images', 'documents', 'audio', 'video', 'folders', 'trash', 'settings'].includes(urlTab)) {
        setActiveTab(urlTab as any);
      }
    }
  }, [urlTab]);

  // Load Folders
  const loadFolders = async () => {
    try {
      const res = await fetch('/api/media/folders');
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
      }
    } catch {}
  };

  useEffect(() => {
    loadFolders();
  }, []);

  // Determine mediaType filter from activeTab
  const currentMediaType = useMemo(() => {
    if (activeTab === 'images') return 'IMAGE';
    if (activeTab === 'documents') return 'PDF';
    if (activeTab === 'audio') return 'AUDIO';
    if (activeTab === 'video') return 'VIDEO';
    return 'ALL';
  }, [activeTab]);

  // Load Assets
  const loadAssets = async () => {
    if (activeTab === 'overview' || activeTab === 'folders' || activeTab === 'settings') return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (currentMediaType !== 'ALL') params.set('mediaType', currentMediaType);
      if (selectedFolder) params.set('folderId', selectedFolder);
      if (selectedVisibility !== 'ALL') params.set('visibility', selectedVisibility);
      if (activeTab === 'trash') params.set('trash', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(currentPage));
      params.set('limit', '30');

      const res = await fetch(`/api/media/assets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [activeTab, search, selectedFolder, selectedVisibility, sortBy, sortOrder, currentPage]);

  // When activeAsset changes, populate meta form
  useEffect(() => {
    if (activeAsset) {
      setMetaTitle(activeAsset.title || '');
      setMetaAlt(activeAsset.altText || '');
      setMetaCaption(activeAsset.caption || '');
      setMetaDesc(activeAsset.description || '');
      setMetaFolder(activeAsset.folderId || '');
      setMetaVisibility(activeAsset.visibility || 'PUBLIC');
    }
  }, [activeAsset]);

  // Handle Save Metadata
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) return;

    try {
      setSavingMeta(true);
      const res = await fetch(`/api/media/assets/${activeAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: metaTitle,
          altText: metaAlt,
          caption: metaCaption,
          description: metaDesc,
          folderId: metaFolder || null,
          visibility: metaVisibility,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('মিডিয়া তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
        setActiveAsset({ ...activeAsset, ...data.asset });
        setAssets((prev) => prev.map((a) => (a.id === activeAsset.id ? { ...a, ...data.asset } : a)));
        setEditingMetadata(false);
      } else {
        showToast(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingMeta(false);
    }
  };

  // Handle Image Transformation (Rotate, Flip, Flop)
  const handleTransformImage = async (options: { rotate?: number; flip?: boolean; flop?: boolean }) => {
    if (!activeAsset || activeAsset.mediaType !== 'IMAGE') return;

    try {
      setTransformingImage(true);
      const res = await fetch(`/api/media/assets/${activeAsset.id}/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (data.success) {
        showToast('ছবি সফলভাবে রূপান্তর ও আপডেট করা হয়েছে!');
        // Add cache buster to trigger re-render of transformed image in browser
        const updatedAsset = {
          ...activeAsset,
          ...data.asset,
          publicUrl: `${data.asset.publicUrl}?t=${Date.now()}`,
        };
        setActiveAsset(updatedAsset);
        setAssets((prev) => prev.map((a) => (a.id === activeAsset.id ? updatedAsset : a)));
      } else {
        showToast(data.error || 'ছবি রূপান্তর ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTransformingImage(false);
    }
  };

  // Handle File Replacement (Preserves ID & references)
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeAsset) return;

    if (!confirm(`আপনি কি "${activeAsset.title || activeAsset.fileName}" ফাইলটি "${file.name}" দিয়ে প্রতিস্থাপন করতে চান? এটি ব্যবহৃত সকল স্থানে স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।`)) {
      if (replaceInputRef.current) replaceInputRef.current.value = '';
      return;
    }

    try {
      setReplacingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/media/assets/${activeAsset.id}/replace`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast('ফাইল সফলভাবে প্রতিস্থাপন করা হয়েছে!');
        const updatedAsset = {
          ...activeAsset,
          ...data.asset,
          publicUrl: `${data.asset.publicUrl}?t=${Date.now()}`,
        };
        setActiveAsset(updatedAsset);
        setAssets((prev) => prev.map((a) => (a.id === activeAsset.id ? updatedAsset : a)));
      } else {
        showToast(data.error || 'ফাইল প্রতিস্থাপন ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setReplacingFile(false);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Handle Generate Signed URL
  const handleGenerateSignedUrl = async (assetId: string, expiresInSeconds = 86400) => {
    try {
      setGeneratingSignedUrl(true);
      const res = await fetch(`/api/media/assets/${assetId}/signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInSeconds }),
      });
      const data = await res.json();
      if (data.success) {
        const fullUrl = `${window.location.origin}${data.signedUrl}`;
        setShareSignedUrl(fullUrl);
      } else {
        showToast(data.error || 'সাইনড লিঙ্ক তৈরি ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setGeneratingSignedUrl(false);
    }
  };

  // Handle Move to Trash / Delete
  const handleDeleteAsset = async (asset: any, permanent = false) => {
    if (asset.usageCount > 0) {
      alert(`এই ফাইলটি ${toBengaliNumber(asset.usageCount)}টি স্থানে সক্রিয়ভাবে ব্যবহৃত হচ্ছে। সরাসরি মুছে ফেলা সম্ভব নয়।`);
      return;
    }

    const actionText = permanent ? 'স্থায়ীভাবে মুছে ফেলতে' : 'ট্র্যাশে পাঠাতে';
    if (!confirm(`আপনি কি "${asset.title || asset.fileName}" ${actionText} নিশ্চিত?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/media/assets/${asset.id}?permanent=${permanent}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'অ্যাকশন সফল হয়েছে!');
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
        if (activeAsset?.id === asset.id) setActiveAsset(null);
      } else {
        showToast(data.error || 'অ্যাকশন ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Restore from Trash
  const handleRestoreAsset = async (asset: any) => {
    try {
      const res = await fetch(`/api/media/assets/${asset.id}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast('ফাইল ট্র্যাশ থেকে পুনরুদ্ধার করা হয়েছে!');
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
        if (activeAsset?.id === asset.id) setActiveAsset(null);
      } else {
        showToast(data.error || 'পুনরুদ্ধার ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Action Handler
  const handleBulkAction = async (action: 'MOVE' | 'TRASH' | 'RESTORE' | 'DELETE_PERMANENT') => {
    if (selectedIds.length === 0) return;

    if (action === 'DELETE_PERMANENT') {
      if (!confirm(`নির্বাচিত ${toBengaliNumber(selectedIds.length)}টি ফাইল স্থায়ীভাবে মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না!`)) {
        return;
      }
    }

    try {
      const res = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          assetIds: selectedIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setSelectedIds([]);
        loadAssets();
      } else {
        showToast(data.error || 'বালক অ্যাকশন ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Upload Form Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    try {
      setUploading(true);
      setUploadError('');

      const formData = new FormData();
      for (const file of uploadFiles) {
        formData.append('files', file);
      }
      if (uploadFolder) formData.append('folderId', uploadFolder);
      formData.append('visibility', uploadVisibility);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'ফাইল আপলোড সম্পন্ন হয়েছে!');
        setShowUploadModal(false);
        setUploadFiles([]);
        loadAssets();
        // Refresh stats
        fetch('/api/media/stats')
          .then((r) => r.json())
          .then((s) => s.success && setStats(s.stats));
      } else {
        setUploadError(data.error || 'আপলোড ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setUploadError(err.message || 'আপলোড প্রক্রিয়াকরণে সমস্যা');
    } finally {
      setUploading(false);
    }
  };

  // Create Folder Submit
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setCreatingFolder(true);
      const res = await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('ফোল্ডার সফলভাবে তৈরি হয়েছে!');
        setShowFolderModal(false);
        setNewFolderName('');
        loadFolders();
      } else {
        showToast(data.error || 'ফোল্ডার তৈরিতে ব্যর্থতা', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label = 'লিঙ্ক') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} কপি হয়েছে!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold text-white animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>সেন্ট্রাল মিডিয়া লাইব্রেরি (DAM)</span>
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  v1.0 Production
                </span>
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                মোট সংরক্ষিত ফাইল: <strong className="text-stone-800 dark:text-stone-200">{toBengaliNumber(stats.totalFiles || 0)}টি</strong> ({stats.totalFormatted || '0 B'} স্টোরেজ ব্যবহৃত)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold text-xs transition flex items-center gap-1.5 border border-stone-200 dark:border-stone-700"
          >
            <FolderPlus className="w-4 h-4 text-amber-600" />
            <span>নতুন ফোল্ডার</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>ফাইল আপলোড</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold scrollbar-none">
        {[
          { key: 'all', label: 'সকল মিডিয়া', icon: Layers, count: stats.totalFiles },
          { key: 'overview', label: 'ড্যাশবোর্ড ও অ্যানালিটিক্স', icon: LayoutDashboard },
          { key: 'images', label: 'ছবি (Images)', icon: ImageIcon, count: stats.countsByType?.IMAGE },
          { key: 'documents', label: 'ডকুমেন্টস ও PDF', icon: FileText, count: stats.countsByType?.PDF },
          { key: 'audio', label: 'অডিও লাইব্রেরি', icon: Music, count: stats.countsByType?.AUDIO },
          { key: 'video', label: 'ভিডিও লাইব্রেরি', icon: Video, count: stats.countsByType?.VIDEO },
          { key: 'folders', label: 'ফোল্ডার ও কালেকশন', icon: Folder, count: stats.folderCount },
          { key: 'trash', label: 'ট্র্যাশ ও রিকভারি', icon: Trash2, count: stats.trashCount },
          { key: 'settings', label: 'স্টোরেজ সেটিংস', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setSelectedIds([]);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-sans ${
                    isActive ? 'bg-amber-700 text-amber-100' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {toBengaliNumber(tab.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Storage Quota Bar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  ক্লাউড ও লোকাল স্টোরেজ কোটা
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-serif">
                {stats.totalFormatted} ব্যবহৃত / ১০ GB মোট কোটা ({stats.storageUsagePercentage}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, stats.storageUsagePercentage)}%` }}
              />
            </div>
          </div>

          {/* Type Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'ছবি (Images)', count: stats.countsByType?.IMAGE || 0, icon: ImageIcon, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
              { label: 'পিডিএফ ও ম্যাগাজিন', count: stats.countsByType?.PDF || 0, icon: FileText, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
              { label: 'ডকুমেন্টস', count: stats.countsByType?.DOCUMENT || 0, icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
              { label: 'অডিও ফাইল', count: stats.countsByType?.AUDIO || 0, icon: Music, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' },
              { label: 'ভিডিও ফাইল', count: stats.countsByType?.VIDEO || 0, icon: Video, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
              { label: 'ট্র্যাশ বিন', count: stats.trashCount || 0, icon: Trash2, color: 'text-stone-600 bg-stone-100 dark:bg-stone-800' },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                      {toBengaliNumber(c.count)}
                    </h4>
                    <p className="text-[11px] text-stone-500">{c.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Module References Breakdown & Largest Files */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Usage by Website Module */}
            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>মডিউলভিত্তিক মিডিয়া ব্যবহার (Usage Tracking)</span>
              </h3>
              <div className="space-y-2.5">
                {(stats.moduleUsage || []).length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">এখনো কোনো মিডিয়া রেফারেন্স ট্র্যাক হয়নি।</p>
                ) : (
                  stats.moduleUsage.map((m: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 text-xs">
                      <span className="font-bold text-stone-700 dark:text-stone-300">{m.module}</span>
                      <span className="font-serif font-semibold text-amber-600 dark:text-amber-400">
                        {toBengaliNumber(m.count)}টি রেফারেন্স
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Largest Files */}
            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-600" />
                <span>সর্বোচ্চ সাইজের ফাইলসমূহ (Top Storage Consumers)</span>
              </h3>
              <div className="space-y-2">
                {(stats.largestFiles || []).length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">কোনো বড় ফাইল নেই।</p>
                ) : (
                  stats.largestFiles.map((file: any) => (
                    <div
                      key={file.id}
                      onClick={() => setActiveAsset(file)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="truncate font-medium text-stone-800 dark:text-stone-200">
                          {file.title || file.fileName}
                        </span>
                      </div>
                      <span className="font-serif text-[11px] font-bold text-stone-500 flex-shrink-0 ml-2">
                        {file.fileSizeFormatted}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEDIA EXPLORER (ALL, IMAGES, DOCUMENTS, AUDIO, VIDEO, TRASH) */}
      {activeTab !== 'overview' && activeTab !== 'folders' && activeTab !== 'settings' && (
        <div className="space-y-4">
          {/* Toolbar: Search, Folder Filter, Sort & View Mode */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ফাইলের নাম, টাইটেল বা বিবরণ সার্চ করুন..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              {folders.length > 0 && (
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-700 dark:text-stone-200"
                >
                  <option value="">সকল ফোল্ডার</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({toBengaliNumber(f.assetCount || 0)})
                    </option>
                  ))}
                </select>
              )}

              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-700 dark:text-stone-200"
              >
                <option value="ALL">সকল ভিজিবিলিটি</option>
                <option value="PUBLIC">পাবলিক (Public)</option>
                <option value="PRIVATE">প্রাইভেট / সাইনড (Private)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order as any);
                }}
                className="text-xs py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-700 dark:text-stone-200"
              >
                <option value="createdAt_desc">নতুন আগে</option>
                <option value="createdAt_asc">পুরাতন আগে</option>
                <option value="fileSizeBytes_desc">সাইজ বড়</option>
                <option value="fileSizeBytes_asc">সাইজ ছোট</option>
                <option value="title_asc">নাম A-Z</option>
              </select>

              <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-2xs'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                  title="গ্রিড ভিউ"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-2xs'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                  title="লিস্ট ভিউ"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs animate-in fade-in duration-200">
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {toBengaliNumber(selectedIds.length)}টি ফাইল নির্বাচিত হয়েছে
              </span>

              <div className="flex items-center gap-2">
                {activeTab === 'trash' ? (
                  <>
                    <button
                      onClick={() => handleBulkAction('RESTORE')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                    >
                      পুনরুদ্ধার করুন
                    </button>
                    <button
                      onClick={() => handleBulkAction('DELETE_PERMANENT')}
                      className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition"
                    >
                      স্থায়ীভাবে মুছুন
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleBulkAction('TRASH')}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition"
                  >
                    ট্র্যাশে পাঠান
                  </button>
                )}

                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}

          {/* Assets Presentation (Grid or List) */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">ফাইল লোড হচ্ছে...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="h-64 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center gap-3 text-stone-400 p-8 text-center">
              <Layers className="w-10 h-10 stroke-1 text-stone-300" />
              <div>
                <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300">
                  {activeTab === 'trash' ? 'ট্র্যাশ বিন খালি আছে' : 'কোনো মিডিয়া ফাইল পাওয়া যায়নি'}
                </h4>
                <p className="text-xs text-stone-400 mt-1">
                  নতুন ফাইল যুক্ত করতে 'ফাইল আপলোড' বাটনে ক্লিক করুন।
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {assets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => setActiveAsset(asset)}
                    className={`group relative rounded-2xl border cursor-pointer overflow-hidden transition-all duration-200 ${
                      activeAsset?.id === asset.id
                        ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/20'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
                    }`}
                  >
                    {/* Checkbox select */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          setSelectedIds(selectedIds.filter((id) => id !== asset.id));
                        } else {
                          setSelectedIds([...selectedIds, asset.id]);
                        }
                      }}
                      className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-white/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-600 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Preview Box */}
                    <div className="w-full aspect-square bg-stone-100 dark:bg-stone-800 flex items-center justify-center overflow-hidden">
                      {asset.mediaType === 'IMAGE' ? (
                        <img
                          src={asset.thumbnailUrl || asset.publicUrl}
                          alt={asset.altText || asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : asset.mediaType === 'PDF' ? (
                        <div className="flex flex-col items-center gap-1 text-rose-500">
                          <FileText className="w-9 h-9" />
                          <span className="text-[9px] font-bold">PDF</span>
                        </div>
                      ) : asset.mediaType === 'AUDIO' ? (
                        <Music className="w-9 h-9 text-indigo-500" />
                      ) : asset.mediaType === 'VIDEO' ? (
                        <Video className="w-9 h-9 text-purple-500" />
                      ) : (
                        <FileText className="w-9 h-9 text-stone-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-2.5 space-y-0.5">
                      <h5 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate" title={asset.title || asset.fileName}>
                        {asset.title || asset.fileName}
                      </h5>
                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span>{asset.fileSizeFormatted}</span>
                        {asset.usageCount > 0 && (
                          <span className="text-amber-600 font-bold">
                            {toBengaliNumber(asset.usageCount)} ব্যবহার
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List Table View */
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left font-bengali">
                <thead className="bg-stone-50 dark:bg-stone-850 text-stone-500 border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === assets.length && assets.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(assets.map((a) => a.id));
                          else setSelectedIds([]);
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3">ফাইল</th>
                    <th className="p-3">টাইপ</th>
                    <th className="p-3">সাইজ</th>
                    <th className="p-3">ফোল্ডার</th>
                    <th className="p-3">রেফারেন্স</th>
                    <th className="p-3">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {assets.map((asset) => {
                    const isSelected = selectedIds.includes(asset.id);
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => setActiveAsset(asset)}
                        className={`hover:bg-stone-50 dark:hover:bg-stone-850/50 cursor-pointer transition ${
                          activeAsset?.id === asset.id ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, asset.id]);
                              else setSelectedIds(selectedIds.filter((id) => id !== asset.id));
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {asset.mediaType === 'IMAGE' ? (
                                <img src={asset.thumbnailUrl || asset.publicUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <strong className="block text-stone-900 dark:text-stone-100 truncate max-w-[200px]">
                                {asset.title || asset.fileName}
                              </strong>
                              <span className="text-[10px] text-stone-400 block truncate">{asset.fileName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold text-stone-600 dark:text-stone-300">
                            {asset.mediaType}
                          </span>
                        </td>
                        <td className="p-3 font-serif text-[11px] text-stone-600 dark:text-stone-300">
                          {asset.fileSizeFormatted}
                        </td>
                        <td className="p-3 text-stone-500">
                          {asset.folder ? asset.folder.name : '—'}
                        </td>
                        <td className="p-3">
                          {asset.usageCount > 0 ? (
                            <span className="text-amber-600 font-bold">
                              {toBengaliNumber(asset.usageCount)} স্থানে ব্যবহৃত
                            </span>
                          ) : (
                            <span className="text-stone-400">অব্যবহৃত</span>
                          )}
                        </td>
                        <td className="p-3 text-stone-400 font-serif text-[11px]">
                          {formatBengaliDate(asset.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FOLDERS & COLLECTIONS */}
      {activeTab === 'folders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => {
                  setSelectedFolder(folder.id);
                  setActiveTab('all');
                }}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:border-amber-500 cursor-pointer transition space-y-3 group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: `${folder.color || '#C49A45'}20`, color: folder.color || '#C49A45' }}
                >
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">
                    {folder.name}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {toBengaliNumber(folder.assetCount || 0)}টি ফাইল সংরক্ষিত
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSPECTOR SLIDE-OVER DRAWER (Right Side) */}
      {activeAsset && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col font-bengali animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-850">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              ফাইল বিস্তারিত ও মেটাডাটা
            </h3>
            <button
              onClick={() => setActiveAsset(null)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Media Preview Box */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 p-3 flex flex-col items-center justify-center overflow-hidden min-h-[180px] relative">
              {transformingImage && (
                <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span className="text-xs font-bold">ছবি রূপান্তর ও অপ্টিমাইজ হচ্ছে...</span>
                </div>
              )}

              {activeAsset.mediaType === 'IMAGE' ? (
                <>
                  <img
                    src={activeAsset.publicUrl}
                    alt={activeAsset.altText || ''}
                    className="max-h-56 object-contain rounded-xl"
                  />
                  {/* Image Transform Toolbar */}
                  <div className="mt-3 pt-2 w-full border-t border-stone-200 dark:border-stone-800 flex items-center justify-center gap-1.5 text-stone-600 dark:text-stone-300">
                    <button
                      type="button"
                      disabled={transformingImage}
                      onClick={() => handleTransformImage({ rotate: 270 })}
                      title="বামে ৯০° ঘোরান"
                      className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-xs flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[10px]">বামে ৯০°</span>
                    </button>
                    <button
                      type="button"
                      disabled={transformingImage}
                      onClick={() => handleTransformImage({ rotate: 90 })}
                      title="ডানে ৯০° ঘোরান"
                      className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-xs flex items-center gap-1 transition"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="text-[10px]">ডানে ৯০°</span>
                    </button>
                    <button
                      type="button"
                      disabled={transformingImage}
                      onClick={() => handleTransformImage({ flop: true })}
                      title="অনুভূমিক মিরর (Flip H)"
                      className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-xs flex items-center gap-1 transition"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span className="text-[10px]">মিরর</span>
                    </button>
                    <button
                      type="button"
                      disabled={transformingImage}
                      onClick={() => handleTransformImage({ flip: true })}
                      title="উল্লম্ব ফ্লিপ (Flip V)"
                      className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-xs flex items-center gap-1 transition"
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                      <span className="text-[10px]">ফ্লিপ</span>
                    </button>
                  </div>
                </>
              ) : activeAsset.mediaType === 'PDF' ? (
                <div className="text-center py-6 space-y-2.5">
                  <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                  <span className="text-xs font-bold block text-stone-700 dark:text-stone-300">
                    PDF ডকুমেন্ট প্রিভিউ
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPdfModalUrl(activeAsset.publicUrl);
                        setPdfModalTitle(activeAsset.title || activeAsset.originalName);
                        setShowPdfModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/30 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>লাইব্রেরি রিডারে দেখুন</span>
                    </button>
                    <a
                      href={activeAsset.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:underline"
                    >
                      <span>ট্যাব</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : activeAsset.mediaType === 'AUDIO' ? (
                <div className="w-full text-center py-4 space-y-2">
                  <Music className="w-10 h-10 text-indigo-500 mx-auto" />
                  <audio controls className="w-full">
                    <source src={activeAsset.publicUrl} type={activeAsset.mimeType} />
                  </audio>
                </div>
              ) : activeAsset.mediaType === 'VIDEO' ? (
                <video controls className="w-full rounded-lg max-h-56">
                  <source src={activeAsset.publicUrl} type={activeAsset.mimeType} />
                </video>
              ) : (
                <FileText className="w-12 h-12 text-stone-400" />
              )}
            </div>

            {/* Quick Actions (Share, Replace, Download) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShareAsset(activeAsset);
                  setShareSignedUrl('');
                  setShowShareModal(true);
                }}
                className="py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1 border border-amber-500/30 transition"
              >
                <Share2 className="w-3 h-3" />
                <span>শেয়ার ও কোড</span>
              </button>

              <button
                type="button"
                disabled={replacingFile}
                onClick={() => replaceInputRef.current?.click()}
                className="py-1.5 px-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1 border border-stone-200 dark:border-stone-700 transition disabled:opacity-50"
              >
                {replacingFile ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>প্রতিস্থাপন</span>
              </button>
              <input
                type="file"
                ref={replaceInputRef}
                onChange={handleReplaceFile}
                className="hidden"
              />

              <a
                href={`/api/media/assets/${activeAsset.id}/download`}
                className="py-1.5 px-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1 border border-stone-200 dark:border-stone-700 transition"
              >
                <Download className="w-3 h-3" />
                <span>ডাউনলোড</span>
              </a>
            </div>

            {/* Usage References Card */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>রেফারেন্স ট্র্যাকিং</span>
                </span>
                <span className="font-serif text-xs font-bold text-amber-700 dark:text-amber-400">
                  {toBengaliNumber(activeAsset.usageCount || 0)}টি মডিউলে
                </span>
              </div>
              {activeAsset.references && activeAsset.references.length > 0 ? (
                <div className="space-y-1 pt-1 border-t border-amber-500/20 text-[11px] text-stone-600 dark:text-stone-300">
                  {activeAsset.references.map((r: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="font-semibold">{r.module}</span>
                      <span className="text-stone-400 truncate max-w-[140px]">{r.entityTitle || r.entityId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-stone-500">
                  এই ফাইলটি অন্য কোনো পণ্য বা ম্যাগাজিনে এখনো সংযুক্ত নয়।
                </p>
              )}
            </div>

            {/* Metadata Editor Form */}
            <form onSubmit={handleSaveMetadata} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ফাইলের শিরোনাম (Title)
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Alt Text (এসইও ও অ্যাক্সেসিবিলিটি)
                </label>
                <input
                  type="text"
                  value={metaAlt}
                  onChange={(e) => setMetaAlt(e.target.value)}
                  placeholder="ছবির বিকল্প বিবরণ..."
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ক্যাপশন (Caption)
                </label>
                <input
                  type="text"
                  value={metaCaption}
                  onChange={(e) => setMetaCaption(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ফোল্ডার
                </label>
                <select
                  value={metaFolder}
                  onChange={(e) => setMetaFolder(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none"
                >
                  <option value="">মূল লাইব্রেরি (কোনো ফোল্ডার নয়)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ভিজিবিলিটি (Visibility)
                </label>
                <select
                  value={metaVisibility}
                  onChange={(e) => setMetaVisibility(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none"
                >
                  <option value="PUBLIC">পাবলিক (Public)</option>
                  <option value="PRIVATE">প্রাইভেট / সাইনড লিঙ্ক (Private)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingMeta}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
              >
                {savingMeta ? 'সংরক্ষণ হচ্ছে...' : 'মেটাডাটা সংরক্ষণ করুন'}
              </button>
            </form>

            {/* Destructive Actions */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
              {activeAsset.isTrash ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestoreAsset(activeAsset)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                  >
                    ট্র্যাশ থেকে রিকভার করুন
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(activeAsset, true)}
                    className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
                  >
                    স্থায়ী মুছুন
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDeleteAsset(activeAsset, false)}
                  className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ট্র্যাশে পাঠান</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-bengali">
          <div className="bg-white dark:bg-stone-900 max-w-lg w-full rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                নতুন মিডিয়া ফাইল আপলোড করুন
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-850/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files) setUploadFiles(Array.from(e.target.files));
                  }}
                  multiple
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="font-bold text-xs text-stone-800 dark:text-stone-200">
                  ফাইল ড্রপ করুন অথবা নির্বাচন করুন
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  JPG, PNG, WebP, PDF, DOCX, MP3, MP4 সমর্থিত (সর্বোচ্চ ৬০MB)
                </p>
                {uploadFiles.length > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>{toBengaliNumber(uploadFiles.length)}টি ফাইল নির্বাচিত</span>
                  </div>
                )}
              </div>

              {folders.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    ফোল্ডারে রাখুন
                  </label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none"
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

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || uploadFiles.length === 0}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>আপলোড ও প্রসেসিং হচ্ছে...</span>
                  </>
                ) : (
                  <span>আপলোড করুন</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW FOLDER MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-bengali">
          <div className="bg-white dark:bg-stone-900 max-w-sm w-full rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-600" />
                <span>নতুন ফোল্ডার তৈরি</span>
              </h3>
              <button onClick={() => setShowFolderModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ফোল্ডারের নাম
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="যেমন: বইয়ের কভার, ব্যানার, সাময়িকী..."
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  থিম কালার
                </label>
                <div className="flex items-center gap-2">
                  {['#C49A45', '#0F766E', '#1D4ED8', '#7C3AED', '#BE185D', '#EA580C'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newFolderColor === color ? 'scale-125 ring-2 ring-stone-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingFolder || !newFolderName.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
              >
                {creatingFolder ? 'তৈরি হচ্ছে...' : 'ফোল্ডার তৈরি করুন'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* SHARE & EMBED MODAL */}
      {showShareModal && shareAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-bengali animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 max-w-lg w-full rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-600" />
                <span>শেয়ার, এম্বেড ও সাইনড লিঙ্ক</span>
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Direct Public Link */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>সরাসরি পাবলিক লিঙ্ক (Public URL)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}${shareAsset.publicUrl}`}
                    className="flex-1 p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}${shareAsset.publicUrl}`,
                        'সরাসরি পাবলিক URL'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition shrink-0"
                  >
                    কপি
                  </button>
                </div>
              </div>

              {/* Direct Download Link */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সরাসরি ডাউনলোড লিঙ্ক (Direct Attachment)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/media/assets/${shareAsset.id}/download`}
                    className="flex-1 p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/api/media/assets/${shareAsset.id}/download`,
                        'ডাউনলোড লিঙ্ক'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition shrink-0"
                  >
                    কপি
                  </button>
                </div>
              </div>

              {/* HTML Embed Code */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-600" />
                  <span>রেসপনসিভ HTML এম্বেড কোড</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <textarea
                    readOnly
                    rows={2}
                    value={
                      shareAsset.mediaType === 'IMAGE'
                        ? `<img src="${typeof window !== 'undefined' ? window.location.origin : ''}${shareAsset.publicUrl}" alt="${shareAsset.altText || shareAsset.title}" loading="lazy" style="max-width:100%;height:auto;border-radius:8px;" />`
                        : shareAsset.mediaType === 'PDF'
                        ? `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}${shareAsset.publicUrl}" width="100%" height="600" style="border:none;border-radius:8px;"></iframe>`
                        : shareAsset.mediaType === 'AUDIO'
                        ? `<audio controls src="${typeof window !== 'undefined' ? window.location.origin : ''}${shareAsset.publicUrl}" style="width:100%;"></audio>`
                        : `<video controls src="${typeof window !== 'undefined' ? window.location.origin : ''}${shareAsset.publicUrl}" style="max-width:100%;height:auto;border-radius:8px;"></video>`
                    }
                    className="flex-1 p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono text-[11px] resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code =
                        shareAsset.mediaType === 'IMAGE'
                          ? `<img src="${window.location.origin}${shareAsset.publicUrl}" alt="${shareAsset.altText || shareAsset.title}" loading="lazy" style="max-width:100%;height:auto;border-radius:8px;" />`
                          : shareAsset.mediaType === 'PDF'
                          ? `<iframe src="${window.location.origin}${shareAsset.publicUrl}" width="100%" height="600" style="border:none;border-radius:8px;"></iframe>`
                          : shareAsset.mediaType === 'AUDIO'
                          ? `<audio controls src="${window.location.origin}${shareAsset.publicUrl}" style="width:100%;"></audio>`
                          : `<video controls src="${window.location.origin}${shareAsset.publicUrl}" style="max-width:100%;height:auto;border-radius:8px;"></video>`;
                      copyToClipboard(code, 'HTML এম্বেড কোড');
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition shrink-0"
                  >
                    কপি
                  </button>
                </div>
              </div>

              {/* Temporary Signed URL (Expiring) */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <label className="block font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>নিরাপদ মেয়াদভিত্তিক সাইনড URL (HMAC-SHA256)</span>
                  </span>
                  <span className="text-[10px] text-stone-400">নির্ধারিত সময়ে স্বয়ংক্রিয় বাতিল</span>
                </label>

                <div className="flex items-center gap-2">
                  <select
                    value={shareSignedExpiry}
                    onChange={(e) => setShareSignedExpiry(e.target.value)}
                    className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold"
                  >
                    <option value="3600">১ ঘণ্টা মেয়াদের লিঙ্ক</option>
                    <option value="86400">২৪ ঘণ্টা মেয়াদের লিঙ্ক</option>
                    <option value="604800">৭ দিন মেয়াদের লিঙ্ক</option>
                  </select>

                  <button
                    type="button"
                    disabled={generatingSignedUrl}
                    onClick={() => handleGenerateSignedUrl(shareAsset.id, Number(shareSignedExpiry))}
                    className="flex-1 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30 transition text-xs flex items-center justify-center gap-1.5"
                  >
                    {generatingSignedUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>সাইনড লিঙ্ক তৈরি করুন</span>
                  </button>
                </div>

                {shareSignedUrl && (
                  <div className="flex items-center gap-1.5 pt-1 animate-in fade-in duration-200">
                    <input
                      type="text"
                      readOnly
                      value={shareSignedUrl}
                      className="flex-1 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shareSignedUrl, 'মেয়াদভিত্তিক সাইনড URL')}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition shrink-0"
                    >
                      কপি
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-LIBRARY PDF READER MODAL */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-bengali animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-stone-900 w-full max-w-5xl h-[88vh] rounded-3xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                  {pdfModalTitle || 'PDF রিডার'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={pdfModalUrl}
                  download
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </a>
                <a
                  href={pdfModalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ট্যাবে খুলুন</span>
                </a>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded PDF View */}
            <div className="flex-1 bg-stone-900 p-1 sm:p-2">
              <iframe
                src={`${pdfModalUrl}#toolbar=1&navpanes=1`}
                className="w-full h-full rounded-2xl border-none"
                title={pdfModalTitle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

