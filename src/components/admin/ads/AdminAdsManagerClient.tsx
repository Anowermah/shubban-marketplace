'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Megaphone,
  LayoutDashboard,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  AlertCircle,
  Trash2,
  Play,
  Pause,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  Edit3,
  Copy,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import AdLivePreview from '@/components/ads/AdLivePreview';
import MediaPickerInput from '@/components/media/MediaPickerInput';

interface AdminAdsProps {
  initialStats: any;
}

export default function AdminAdsManagerClient({ initialStats }: AdminAdsProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'campaigns' | 'placements' | 'creatives' | 'advertisers' | 'billing' | 'policies'
  >('dashboard');

  useEffect(() => {
    if (urlTab) {
      if (['campaigns', 'placements', 'creatives', 'advertisers'].includes(urlTab)) {
        setActiveTab(urlTab as any);
      } else if (urlTab === 'billing' || urlTab === 'pricing' || urlTab === 'revenue') {
        setActiveTab('billing');
      } else if (urlTab === 'policies' || urlTab === 'settings') {
        setActiveTab('policies');
      }
    }
  }, [urlTab]);

  const [dateRange, setDateRange] = useState('last_30_days');
  const [stats, setStats] = useState(initialStats);
  const [loadingStats, setLoadingStats] = useState(false);

  // Tab sub-states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter States
  const [campSearch, setCampSearch] = useState('');
  const [campFilter, setCampFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'PENDING' | 'REJECTED'>('ALL');
  const [creativeSearch, setCreativeSearch] = useState('');
  const [creativeFilter, setCreativeFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [placementSearch, setPlacementSearch] = useState('');
  const [advertiserSearch, setAdvertiserSearch] = useState('');

  // Review Modal State
  const [reviewModalItem, setReviewModalItem] = useState<any | null>(null);
  const [reviewType, setReviewType] = useState<'campaign' | 'creative'>('campaign');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Admin Create Campaign Modal State
  const [showCreateCampModal, setShowCreateCampModal] = useState(false);
  const [adminCampName, setAdminCampName] = useState('');
  const [adminCampAdvId, setAdminCampAdvId] = useState('');
  const [adminCampPlacementId, setAdminCampPlacementId] = useState('');
  const [adminCampCreativeId, setAdminCampCreativeId] = useState('');
  const [adminCampBudget, setAdminCampBudget] = useState(3000);
  const [adminCampPriority, setAdminCampPriority] = useState(5);
  const [submittingAdminCamp, setSubmittingAdminCamp] = useState(false);

  // Admin Edit Campaign Modal State
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [editCampName, setEditCampName] = useState('');
  const [editCampBudget, setEditCampBudget] = useState(0);
  const [editCampPriority, setEditCampPriority] = useState(5);
  const [editCampStatus, setEditCampStatus] = useState('ACTIVE');
  const [savingCampEdit, setSavingCampEdit] = useState(false);

  // Admin Create Placement Modal State
  const [showCreatePlacementModal, setShowCreatePlacementModal] = useState(false);
  const [newPlaceKey, setNewPlaceKey] = useState('');
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceDesc, setNewPlaceDesc] = useState('');
  const [newPlacePageType, setNewPlacePageType] = useState('HOME');
  const [newPlacePosition, setNewPlacePosition] = useState('TOP');
  const [newPlaceDWidth, setNewPlaceDWidth] = useState(728);
  const [newPlaceDHeight, setNewPlaceDHeight] = useState(90);
  const [newPlaceMWidth, setNewPlaceMWidth] = useState(320);
  const [newPlaceMHeight, setNewPlaceMHeight] = useState(50);
  const [newPlaceCap, setNewPlaceCap] = useState(5);
  const [submittingPlacement, setSubmittingPlacement] = useState(false);

  // Admin Edit Placement Modal State
  const [editingPlacement, setEditingPlacement] = useState<any | null>(null);
  const [editPlaceName, setEditPlaceName] = useState('');
  const [editPlaceCap, setEditPlaceCap] = useState(5);
  const [editPlaceStatus, setEditPlaceStatus] = useState('ACTIVE');
  const [savingPlaceEdit, setSavingPlaceEdit] = useState(false);

  // Admin Edit Creative Modal State
  const [editingCreative, setEditingCreative] = useState<any | null>(null);
  const [editCrName, setEditCrName] = useState('');
  const [editCrMediaUrl, setEditCrMediaUrl] = useState('');
  const [editCrHeadline, setEditCrHeadline] = useState('');
  const [editCrDescription, setEditCrDescription] = useState('');
  const [editCrCtaText, setEditCrCtaText] = useState('');
  const [editCrDestUrl, setEditCrDestUrl] = useState('');
  const [savingCrEdit, setSavingCrEdit] = useState(false);

  // Universal Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'campaign' | 'placement' | 'creative';
    id: string;
    name: string;
  } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Refresh stats
  const fetchStats = async (range: string) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/ads/stats?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load specific tab data
  const loadData = async (tab = activeTab) => {
    setLoadingTab(true);
    try {
      if (tab === 'campaigns') {
        const res = await fetch('/api/admin/ads/campaigns');
        const data = await res.json();
        if (data.success) setCampaigns(data.campaigns);
      } else if (tab === 'placements') {
        const res = await fetch('/api/admin/ads/placements');
        const data = await res.json();
        if (data.success) setPlacements(data.placements);
      } else if (tab === 'creatives') {
        const res = await fetch('/api/admin/ads/creatives');
        const data = await res.json();
        if (data.success) setCreatives(data.creatives);
      } else if (tab === 'advertisers') {
        const res = await fetch('/api/admin/ads/advertisers');
        const data = await res.json();
        if (data.success) setAdvertisers(data.advertisers);
      } else if (tab === 'billing') {
        const res = await fetch('/api/admin/ads/billing');
        const data = await res.json();
        if (data.success) setInvoices(data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'dashboard' && activeTab !== 'policies') {
      loadData(activeTab);
    }
  }, [activeTab]);

  // Campaign Actions (Approve, Reject, Pause, Resume)
  const handleCampaignAction = async (id: string, action: string, reason?: string) => {
    setSubmittingAction(true);
    try {
      const res = await fetch('/api/admin/ads/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('ক্যাম্পেইন অ্যাকশন সফলভাবে সম্পন্ন হয়েছে।');
        setReviewModalItem(null);
        loadData('campaigns');
        fetchStats(dateRange);
      } else {
        showToast(data.error || 'অ্যাকশন ব্যর্থ হয়েছে।', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Creative Actions (Approve, Reject)
  const handleCreativeAction = async (id: string, action: string, reason?: string) => {
    setSubmittingAction(true);
    try {
      const res = await fetch('/api/admin/ads/creatives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('বিজ্ঞাপন ক্রিয়েটিভ অনুমোদন হালনাগাদ হয়েছে।');
        setReviewModalItem(null);
        loadData('creatives');
      } else {
        showToast(data.error || 'অ্যাকশন ব্যর্থ হয়েছে।', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Placement Toggle
  const handlePlacementToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/ads/placements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPlacements(placements.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));
        showToast(`প্লেসমেন্ট এখন ${nextStatus === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}।`);
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Admin Create Campaign
  const handleCreateAdminCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCampName || !adminCampAdvId || !adminCampPlacementId || !adminCampCreativeId) {
      showToast('সকল প্রয়োজনীয় ঘর পূরণ করুন।', 'error');
      return;
    }

    setSubmittingAdminCamp(true);
    try {
      const res = await fetch('/api/admin/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminCampName,
          advertiserId: adminCampAdvId,
          placementIds: [adminCampPlacementId],
          creativeId: adminCampCreativeId,
          budget: adminCampBudget,
          deliveryPriority: adminCampPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('ক্যাম্পেইন সফলভাবে তৈরি করা হয়েছে!');
        setShowCreateCampModal(false);
        setAdminCampName('');
        loadData('campaigns');
      } else {
        showToast(data.error || 'ক্যাম্পেইন তৈরি ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingAdminCamp(false);
    }
  };

  // Admin Save Campaign Edit
  const handleSaveCampaignEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    setSavingCampEdit(true);
    try {
      const res = await fetch('/api/admin/ads/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCampaign.id,
          name: editCampName,
          budget: editCampBudget,
          deliveryPriority: editCampPriority,
          status: editCampStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('ক্যাম্পেইন সফলভাবে সংরক্ষিত হয়েছে!');
        setEditingCampaign(null);
        loadData('campaigns');
      } else {
        showToast(data.error || 'আপডেট ব্যর্থ হয়েছে।', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSavingCampEdit(false);
    }
  };

  // Admin Create Placement
  const handleCreatePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceKey || !newPlaceName) {
      showToast('প্লেসমেন্ট কী ও নাম দিন।', 'error');
      return;
    }

    setSubmittingPlacement(true);
    try {
      const res = await fetch('/api/admin/ads/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementKey: newPlaceKey,
          name: newPlaceName,
          description: newPlaceDesc,
          pageType: newPlacePageType,
          position: newPlacePosition,
          desktopWidth: newPlaceDWidth,
          desktopHeight: newPlaceDHeight,
          mobileWidth: newPlaceMWidth,
          mobileHeight: newPlaceMHeight,
          frequencyCap: newPlaceCap,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('নতুন প্লেসমেন্ট স্লট সফলভাবে তৈরি হয়েছে!');
        setShowCreatePlacementModal(false);
        setNewPlaceKey('');
        setNewPlaceName('');
        loadData('placements');
      } else {
        showToast(data.error || 'তৈরি ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingPlacement(false);
    }
  };

  // Admin Save Placement Edit
  const handleSavePlacementEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlacement) return;

    setSavingPlaceEdit(true);
    try {
      const res = await fetch('/api/admin/ads/placements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlacement.id,
          name: editPlaceName,
          frequencyCap: editPlaceCap,
          status: editPlaceStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('প্লেসমেন্ট তথ্য সংরক্ষিত হয়েছে!');
        setEditingPlacement(null);
        loadData('placements');
      } else {
        showToast(data.error || 'আপডেট ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingPlaceEdit(false);
    }
  };

  // Admin Save Creative Edit
  const handleSaveCreativeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreative) return;

    setSavingCrEdit(true);
    try {
      const res = await fetch('/api/admin/ads/creatives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCreative.id,
          name: editCrName,
          mediaUrl: editCrMediaUrl,
          headline: editCrHeadline,
          description: editCrDescription,
          ctaText: editCrCtaText,
          destinationUrl: editCrDestUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('ক্রিয়েটিভ তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
        setEditingCreative(null);
        loadData('creatives');
      } else {
        showToast(data.error || 'আপডেট ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingCrEdit(false);
    }
  };

  // Universal Delete Handler
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    setDeletingItem(true);
    try {
      let endpoint = '';
      if (deleteTarget.type === 'campaign') endpoint = `/api/admin/ads/campaigns?id=${deleteTarget.id}`;
      else if (deleteTarget.type === 'placement') endpoint = `/api/admin/ads/placements?id=${deleteTarget.id}`;
      else if (deleteTarget.type === 'creative') endpoint = `/api/admin/ads/creatives?id=${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'সফলভাবে মুছে ফেলা হয়েছে।');
        setDeleteTarget(null);
        if (deleteTarget.type === 'campaign') loadData('campaigns');
        else if (deleteTarget.type === 'placement') loadData('placements');
        else if (deleteTarget.type === 'creative') loadData('creatives');
      } else {
        showToast(data.error || 'ডিলিট করতে ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  const m = stats?.metrics || {};

  // Filtered lists
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const s = campSearch.toLowerCase();
      const matchSearch =
        c.name?.toLowerCase().includes(s) ||
        c.campaignNumber?.toLowerCase().includes(s) ||
        c.advertiser?.companyName?.toLowerCase().includes(s);

      if (!matchSearch) return false;

      if (campFilter === 'ACTIVE') return c.status === 'ACTIVE';
      if (campFilter === 'PAUSED') return c.status === 'PAUSED';
      if (campFilter === 'PENDING') return c.approvalStatus === 'SUBMITTED' || c.status === 'PENDING_APPROVAL';
      if (campFilter === 'REJECTED') return c.approvalStatus === 'REJECTED';

      return true;
    });
  }, [campaigns, campSearch, campFilter]);

  const filteredCreatives = useMemo(() => {
    return creatives.filter((cr) => {
      const s = creativeSearch.toLowerCase();
      const matchSearch =
        cr.name?.toLowerCase().includes(s) ||
        cr.headline?.toLowerCase().includes(s) ||
        cr.advertiser?.companyName?.toLowerCase().includes(s);

      if (!matchSearch) return false;

      if (creativeFilter === 'PENDING') return cr.approvalStatus === 'PENDING_REVIEW' || cr.approvalStatus === 'DRAFT';
      if (creativeFilter === 'APPROVED') return cr.approvalStatus === 'APPROVED';
      if (creativeFilter === 'REJECTED') return cr.approvalStatus === 'REJECTED';

      return true;
    });
  }, [creatives, creativeSearch, creativeFilter]);

  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const s = placementSearch.toLowerCase();
      return p.name?.toLowerCase().includes(s) || p.placementKey?.toLowerCase().includes(s);
    });
  }, [placements, placementSearch]);

  const filteredAdvertisers = useMemo(() => {
    return advertisers.filter((a) => {
      const s = advertiserSearch.toLowerCase();
      return a.companyName?.toLowerCase().includes(s) || a.name?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s);
    });
  }, [advertisers, advertiserSearch]);

  return (
    <div className="space-y-6 font-bengali">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-6 rounded-3xl shadow-xl border border-amber-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            <span>শুব্বান ফার্স্ট-পার্টি বিজ্ঞাপন নেটওয়ার্ক ও রেভিনিউ সিস্টেম</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            অ্যাড ম্যানেজার কন্ট্রোল সেন্টার (Ads Control Center)
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            বিজ্ঞাপনদাতা আবেদন, ক্যাম্পেইন তৈরি ও অনুমোদন, প্লেসমেন্ট নিয়ন্ত্রণ, ইম্প্রেশন-ক্লিক ট্র্যাকিং এবং বিলিং।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/advertiser"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>অ্যাডভার্টাইজার পোর্টাল ↗</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 dark:border-stone-800 scrollbar-none text-xs font-bold">
        {[
          { key: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
          { key: 'campaigns', label: 'ক্যাম্পেইনসমূহ', icon: Megaphone, badge: m.activeCampaigns },
          { key: 'placements', label: 'প্লেসমেন্ট রেজিস্ট্রি', icon: Layers, badge: m.activePlacements },
          { key: 'creatives', label: 'ক্রিয়েটিভ অনুমোদন', icon: Sparkles, badge: stats?.pendingApprovals?.length },
          { key: 'advertisers', label: 'বিজ্ঞাপনদাতা', icon: Building2, badge: m.pendingAdvertisers },
          { key: 'billing', label: 'বিলিং ও ইনভয়েস', icon: CreditCard },
          { key: 'policies', label: 'বিজ্ঞাপন নীতিমালা', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all ${isActive
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  {toBengaliNumber(tab.badge)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>সময়সীমা নির্বাচন:</span>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  fetchStats(e.target.value);
                }}
                className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold"
              >
                <option value="today">আজ (Today)</option>
                <option value="yesterday">গতকাল (Yesterday)</option>
                <option value="last_7_days">গত ৭ দিন (Last 7 Days)</option>
                <option value="last_30_days">গত ৩০ দিন (Last 30 Days)</option>
                <option value="this_month">চলতি মাস (This Month)</option>
              </select>
            </div>

            <button
              onClick={() => fetchStats(dateRange)}
              disabled={loadingStats}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 text-xs font-bold flex items-center gap-1.5 text-stone-600 dark:text-stone-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">নেট অর্জিত রেভিনিউ</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  ৳
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                ৳{toBengaliNumber(Math.round(m.netRevenue || 0))}
              </div>
              <div className="text-[11px] text-stone-400">
                প্রাপ্ত: ৳{toBengaliNumber(Math.round(m.receivedRevenue || 0))} • রিফান্ড: ৳{toBengaliNumber(Math.round(m.refundedAmount || 0))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">বৈধ ইম্প্রেশন (Impressions)</span>
                <Eye className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                {toBengaliNumber(m.validImpressions || 0)}
              </div>
              <div className="text-[11px] text-stone-400">
                ভিউয়েবল: {toBengaliNumber(m.viewableImpressions || 0)} (Viewable)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">বৈধ ক্লিক ও CTR</span>
                <TrendingUp className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                {toBengaliNumber(m.validClicks || 0)}{' '}
                <span className="text-sm font-sans text-amber-600">({toBengaliNumber(m.ctr || 0)}%)</span>
              </div>
              <div className="text-[11px] text-rose-500">
                ফিল্টারকৃত ফ্রড ক্লিক: {toBengaliNumber(m.invalidClicks || 0)}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">সক্রিয় বিজ্ঞাপন ক্যাম্পেইন</span>
                <Megaphone className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                {toBengaliNumber(m.activeCampaigns || 0)}{' '}
                <span className="text-xs text-stone-400 font-sans">/ {toBengaliNumber(m.totalCampaigns || 0)} মোট</span>
              </div>
              <div className="text-[11px] text-amber-600 font-bold">
                অনুমোদনের অপেক্ষায়: {toBengaliNumber(m.pendingCampaigns || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGNS (Full Admin Control) */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={campSearch}
                  onChange={(e) => setCampSearch(e.target.value)}
                  placeholder="ক্যাম্পেইন বা বিজ্ঞাপনদাতা খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold overflow-x-auto">
                {[
                  { key: 'ALL', label: 'সকল' },
                  { key: 'ACTIVE', label: 'সক্রিয়' },
                  { key: 'PAUSED', label: 'স্থগিত' },
                  { key: 'PENDING', label: 'অনুমোদনহীন' },
                  { key: 'REJECTED', label: 'বাতিল' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setCampFilter(f.key as any)}
                    className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${campFilter === f.key
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (advertisers.length === 0) loadData('advertisers');
                  if (placements.length === 0) loadData('placements');
                  if (creatives.length === 0) loadData('creatives');
                  setShowCreateCampModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ক্যাম্পেইন তৈরি</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bengali">
                <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500">
                  <tr>
                    <th className="p-3.5">ক্যাম্পেইন নাম</th>
                    <th className="p-3.5">বিজ্ঞাপনদাতা</th>
                    <th className="p-3.5">বাজেট</th>
                    <th className="p-3.5">অগ্রাধিকার</th>
                    <th className="p-3.5">পারফরম্যান্স</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন ও নিয়ন্ত্রণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-3.5">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">{c.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{c.campaignNumber}</span>
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-300">
                        {c.advertiser?.companyName || c.advertiser?.name}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-stone-800 dark:text-stone-200">
                        ৳{toBengaliNumber(c.agreedPrice || c.budget)}
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 font-bold">
                          {toBengaliNumber(c.deliveryPriority || 5)}/১০
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">
                        👁️ {toBengaliNumber(c._count?.impressions || 0)} | 🖱️ {toBengaliNumber(c._count?.clicks || 0)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                            : c.status === 'PAUSED'
                              ? 'bg-amber-500/10 text-amber-700'
                              : c.approvalStatus === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-700'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}
                        >
                          {c.status === 'ACTIVE' ? 'সক্রিয়' : c.status === 'PAUSED' ? 'স্থগিত' : c.approvalStatus === 'REJECTED' ? 'প্রত্যাখ্যাত' : c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {/* Pause / Resume */}
                        {c.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleCampaignAction(c.id, 'PAUSE')}
                            className="p-1 rounded-lg text-amber-600 hover:bg-amber-50"
                            title="স্থগিত করুন"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCampaignAction(c.id, 'RESUME')}
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="চালু করুন"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingCampaign(c);
                            setEditCampName(c.name || '');
                            setEditCampBudget(c.budget || 0);
                            setEditCampPriority(c.deliveryPriority || 5);
                            setEditCampStatus(c.status || 'ACTIVE');
                          }}
                          className="p-1 rounded-lg text-stone-600 hover:bg-stone-100"
                          title="এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Review / Moderate */}
                        <button
                          onClick={() => {
                            setReviewModalItem(c);
                            setReviewType('campaign');
                          }}
                          className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] font-bold"
                        >
                          যাচাই
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget({ type: 'campaign', id: c.id, name: c.name })}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLACEMENTS (Full Admin Control) */}
      {activeTab === 'placements' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={placementSearch}
                onChange={(e) => setPlacementSearch(e.target.value)}
                placeholder="স্লট বা পেজ নাম দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <button
              onClick={() => setShowCreatePlacementModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন প্লেসমেন্ট স্লট যোগ করুন</span>
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bengali">
                <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500">
                  <tr>
                    <th className="p-3.5">প্লেসমেন্ট নাম ও কী</th>
                    <th className="p-3.5">পেজ ক্যাটাগরি</th>
                    <th className="p-3.5">মাত্রা (ডেস্কটপ / মোবাইল)</th>
                    <th className="p-3.5">ফ্রিকোয়েন্সি ক্যাপ</th>
                    <th className="p-3.5">সক্রিয় বিজ্ঞাপন</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">নিয়ন্ত্রণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredPlacements.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-3.5 font-bold text-stone-900 dark:text-stone-100">
                        {p.name}
                        <span className="block text-[10px] text-amber-600 font-mono font-normal">
                          {p.placementKey}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-300">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 font-mono text-[10px]">
                          {p.pageType} ({p.position})
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-stone-600 dark:text-stone-300">
                        {p.desktopWidth}×{p.desktopHeight} / {p.mobileWidth}×{p.mobileHeight}
                      </td>
                      <td className="p-3.5 font-mono">{toBengaliNumber(p.frequencyCap)}/দিন</td>
                      <td className="p-3.5 font-mono font-bold">
                        {toBengaliNumber(p._count?.campaignPlacements || 0)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'bg-stone-100 text-stone-500'
                            }`}
                        >
                          {p.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => handlePlacementToggle(p.id, p.status)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${p.status === 'ACTIVE'
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                          {p.status === 'ACTIVE' ? 'টগল' : 'অন'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlacement(p);
                            setEditPlaceName(p.name);
                            setEditPlaceCap(p.frequencyCap || 5);
                            setEditPlaceStatus(p.status || 'ACTIVE');
                          }}
                          className="p-1 rounded-lg text-stone-600 hover:bg-stone-100"
                          title="এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'placement', id: p.id, name: p.name })}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CREATIVES (Full Admin Control) */}
      {activeTab === 'creatives' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={creativeSearch}
                onChange={(e) => setCreativeSearch(e.target.value)}
                placeholder="বিজ্ঞাপন বা বিজ্ঞাপনদাতা দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              {[
                { key: 'ALL', label: 'সকল' },
                { key: 'PENDING', label: 'অনুমোদনের অপেক্ষায়' },
                { key: 'APPROVED', label: 'অনুমোদিত' },
                { key: 'REJECTED', label: 'প্রত্যাখ্যাত' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setCreativeFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${creativeFilter === f.key
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCreatives.map((cr) => (
              <div
                key={cr.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-stone-700 dark:text-stone-300 truncate max-w-[150px]">
                      {cr.advertiser?.companyName || cr.advertiser?.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${cr.approvalStatus === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : cr.approvalStatus === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-700'
                          : 'bg-amber-500/10 text-amber-700'
                        }`}
                    >
                      {cr.approvalStatus}
                    </span>
                  </div>

                  <div className="w-full h-36 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden border border-stone-200 dark:border-stone-700 flex items-center justify-center">
                    {cr.mediaUrl ? (
                      <img src={cr.mediaUrl} alt={cr.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-stone-400">মিডিয়া ফাইল নেই</span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">{cr.name}</h4>
                  <div className="text-[11px] text-stone-500 truncate">
                    লিঙ্ক:{' '}
                    <a href={cr.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                      {cr.destinationUrl}
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1.5">
                  <button
                    onClick={() => handleCreativeAction(cr.id, 'APPROVE')}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    অনুমোদন
                  </button>
                  <button
                    onClick={() => {
                      setReviewModalItem(cr);
                      setReviewType('creative');
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold"
                  >
                    প্রিভিউ ও যাচাই
                  </button>
                  <button
                    onClick={() => {
                      setEditingCreative(cr);
                      setEditCrName(cr.name || '');
                      setEditCrMediaUrl(cr.mediaUrl || '');
                      setEditCrHeadline(cr.headline || '');
                      setEditCrDescription(cr.description || '');
                      setEditCrCtaText(cr.ctaText || 'বিস্তারিত দেখুন');
                      setEditCrDestUrl(cr.destinationUrl || '');
                    }}
                    className="p-1.5 rounded-xl text-stone-500 hover:bg-stone-100"
                    title="এডিট করুন"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'creative', id: cr.id, name: cr.name })}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                    title="ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ADVERTISERS */}
      {activeTab === 'advertisers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                বিজ্ঞাপনদাতা প্রতিষ্ঠান তালিকা ({toBengaliNumber(filteredAdvertisers.length)})
              </h3>
              <input
                type="text"
                value={advertiserSearch}
                onChange={(e) => setAdvertiserSearch(e.target.value)}
                placeholder="বিজ্ঞাপনদাতা খুঁজুন..."
                className="p-1.5 px-3 rounded-xl border border-stone-200 text-xs"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bengali">
                <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500">
                  <tr>
                    <th className="p-3.5">প্রতিষ্ঠান ও যোগাযোগ</th>
                    <th className="p-3.5">ইমেইল ও ফোন</th>
                    <th className="p-3.5">ট্যাক্স / ট্রেড আইডি</th>
                    <th className="p-3.5">ক্যাম্পেইন সংখ্যা</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredAdvertisers.map((adv) => (
                    <tr key={adv.id} className="hover:bg-stone-50/50">
                      <td className="p-3.5 font-bold text-stone-900 dark:text-stone-100">
                        {adv.companyName}
                        <span className="block text-[11px] text-stone-400 font-normal">{adv.name}</span>
                      </td>
                      <td className="p-3.5 text-stone-600 dark:text-stone-300">
                        {adv.email}
                        <span className="block text-[10px] text-stone-400">{adv.phone || 'ফোন নেই'}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">{adv.taxId || 'প্রদান করেনি'}</td>
                      <td className="p-3.5 font-mono font-bold">{toBengaliNumber(adv._count?.campaigns || 0)}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${adv.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-amber-500/10 text-amber-700'
                            }`}
                        >
                          {adv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BILLING */}
      {activeTab === 'billing' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              বিজ্ঞাপন বিলিং ও ইনভয়েস তালিকা
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bengali">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500">
                <tr>
                  <th className="p-3.5">ইনভয়েস নম্বর</th>
                  <th className="p-3.5">বিজ্ঞাপনদাতা</th>
                  <th className="p-3.5">টাকার পরিমাণ</th>
                  <th className="p-3.5">মেয়াদ তারিখ</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/50">
                    <td className="p-3.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3.5">{inv.advertiser?.companyName || inv.advertiser?.name}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600">
                      ৳{toBengaliNumber(inv.totalAmount)}
                    </td>
                    <td className="p-3.5 text-stone-500">
                      {new Date(inv.dueDate).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-amber-500/10 text-amber-700'
                          }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: POLICIES */}
      {activeTab === 'policies' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>ইসলামিক নীতিমালা ও বিজ্ঞাপন ফিল্টারিং গাইডলাইন</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              শুব্বান লাইব্রেরী প্রামাণ্য ইসলামিক জ্ঞান বিতরণ ও সাহিত্য প্রকাশনার মঞ্চ।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { title: 'সুদ ও প্রতারণামূলক আর্থিক অফার', desc: 'সুদি লোন, ফরেক্স বেটিং, ফরেক্স ট্রেডিং বা ভুয়া স্কিম সম্পূর্ণ নিষিদ্ধ।' },
              { title: 'জুয়া, বাজি ও লটারি', desc: 'যেকোনো ধরনের জুয়া, ক্যাসিনো বা বেটিং প্রমোশন সিস্টেমে ব্লক থাকে।' },
              { title: 'অশ্লীলতা ও শালীনতাহীন কন্টেন্ট', desc: 'ইসলামিক শিষ্টাচার পরিপন্থী পোশাক, ছবি বা অশোভন অঙ্গভঙ্গি সম্পূর্ণ নিষিদ্ধ।' },
              { title: 'কুরআন ও হাদিসের ভেতর বিজ্ঞাপন নিষেধ', desc: 'কুরআনুল কারীমের মূল আরবি পাঠ, সিহাহ সিত্তাহ হাদিস ও শাস্ত্রীয় প্রমাণের ভেতর কোনো বিজ্ঞাপন ঢোকানো যাবে না।' },
            ].map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{p.title}</span>
                </h4>
                <p className="text-stone-600 dark:text-stone-400 text-[11px]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADMIN CREATE CAMPAIGN */}
      {showCreateCampModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                নতুন ক্যাম্পেইন তৈরি (Admin Creator)
              </h3>
              <button onClick={() => setShowCreateCampModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminCampaign} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ক্যাম্পেইন নাম *</label>
                <input
                  type="text"
                  required
                  value={adminCampName}
                  onChange={(e) => setAdminCampName(e.target.value)}
                  placeholder="যেমন: শুভ্বান প্রধান স্লাইডার প্রচার"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">বিজ্ঞাপনদাতা প্রতিষ্ঠান *</label>
                <select
                  required
                  value={adminCampAdvId}
                  onChange={(e) => setAdminCampAdvId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  <option value="">বিজ্ঞাপনদাতা নির্বাচন করুন</option>
                  {advertisers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.companyName} ({a.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">প্লেসমেন্ট স্লট *</label>
                  <select
                    required
                    value={adminCampPlacementId}
                    onChange={(e) => setAdminCampPlacementId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  >
                    <option value="">স্লট নির্বাচন করুন</option>
                    {placements.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">ক্রিয়েটিভ ব্যানার *</label>
                  <select
                    required
                    value={adminCampCreativeId}
                    onChange={(e) => setAdminCampCreativeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  >
                    <option value="">ব্যানার নির্বাচন করুন</option>
                    {creatives.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name} [{cr.format}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">বাজেট (BDT)</label>
                  <input
                    type="number"
                    value={adminCampBudget}
                    onChange={(e) => setAdminCampBudget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">ডেলিভারি অগ্রাধিকার (১-১০)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={adminCampPriority}
                    onChange={(e) => setAdminCampPriority(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCampModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingAdminCamp}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
                >
                  {submittingAdminCamp ? 'সংরক্ষণ হচ্ছে...' : 'ক্যাম্পেইন সক্রিয় করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADMIN EDIT CAMPAIGN */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                ক্যাম্পেইন সম্পাদনা
              </h3>
              <button onClick={() => setEditingCampaign(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaignEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ক্যাম্পেইন নাম</label>
                <input
                  type="text"
                  required
                  value={editCampName}
                  onChange={(e) => setEditCampName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">বাজেট (BDT)</label>
                  <input
                    type="number"
                    value={editCampBudget}
                    onChange={(e) => setEditCampBudget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">অগ্রাধিকার (১-১০)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editCampPriority}
                    onChange={(e) => setEditCampPriority(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ক্যাম্পেইন স্ট্যাটাস</label>
                <select
                  value={editCampStatus}
                  onChange={(e) => setEditCampStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                >
                  <option value="ACTIVE">সক্রিয় (ACTIVE)</option>
                  <option value="PAUSED">স্থগিত (PAUSED)</option>
                  <option value="COMPLETED">সম্পন্ন (COMPLETED)</option>
                  <option value="CANCELLED">বাতিলকৃত (CANCELLED)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingCampEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
                >
                  {savingCampEdit ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE PLACEMENT */}
      {showCreatePlacementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                নতুন প্লেসমেন্ট স্লট রেজিস্ট্রি
              </h3>
              <button onClick={() => setShowCreatePlacementModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlacement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">প্লেসমেন্ট কী (Key) *</label>
                  <input
                    type="text"
                    required
                    value={newPlaceKey}
                    onChange={(e) => setNewPlaceKey(e.target.value)}
                    placeholder="যেমন: custom_footer_slot"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">স্লটের নাম *</label>
                  <input
                    type="text"
                    required
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    placeholder="যেমন: ফুটার ব্যানার স্লট"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">পেজ টাইপ</label>
                  <select
                    value={newPlacePageType}
                    onChange={(e) => setNewPlacePageType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  >
                    <option value="HOME">হোমপেজ (HOME)</option>
                    <option value="ARTICLE">প্রবন্ধ পেজ (ARTICLE)</option>
                    <option value="MAGAZINE">ম্যাগাজিন পেজ (MAGAZINE)</option>
                    <option value="STORE">বই সম্ভার (STORE)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">পজিশন</label>
                  <select
                    value={newPlacePosition}
                    onChange={(e) => setNewPlacePosition(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  >
                    <option value="TOP">শীর্ষে (TOP)</option>
                    <option value="MIDDLE">মাঝখানে (MIDDLE)</option>
                    <option value="BOTTOM">নিচে (BOTTOM)</option>
                    <option value="SIDEBAR">সাইডবারে (SIDEBAR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">ডেস্কটপ W</label>
                  <input
                    type="number"
                    value={newPlaceDWidth}
                    onChange={(e) => setNewPlaceDWidth(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">ডেস্কটপ H</label>
                  <input
                    type="number"
                    value={newPlaceDHeight}
                    onChange={(e) => setNewPlaceDHeight(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">মোবাইল W</label>
                  <input
                    type="number"
                    value={newPlaceMWidth}
                    onChange={(e) => setNewPlaceMWidth(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">মোবাইল H</label>
                  <input
                    type="number"
                    value={newPlaceMHeight}
                    onChange={(e) => setNewPlaceMHeight(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ফ্রিকোয়েন্সি ক্যাপ (জনপ্রতি/দিন)</label>
                <input
                  type="number"
                  value={newPlaceCap}
                  onChange={(e) => setNewPlaceCap(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePlacementModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingPlacement}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
                >
                  {submittingPlacement ? 'তৈরি হচ্ছে...' : 'স্লট তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT PLACEMENT */}
      {editingPlacement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                প্লেসমেন্ট স্লট সম্পাদন
              </h3>
              <button onClick={() => setEditingPlacement(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlacementEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">স্লটের নাম</label>
                <input
                  type="text"
                  required
                  value={editPlaceName}
                  onChange={(e) => setEditPlaceName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ফ্রিকোয়েন্সি ক্যাপ</label>
                <input
                  type="number"
                  value={editPlaceCap}
                  onChange={(e) => setEditPlaceCap(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">স্ট্যাটাস</label>
                <select
                  value={editPlaceStatus}
                  onChange={(e) => setEditPlaceStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                >
                  <option value="ACTIVE">সক্রিয় (ACTIVE)</option>
                  <option value="INACTIVE">নিষ্ক্রিয় (INACTIVE)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPlacement(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingPlaceEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
                >
                  {savingPlaceEdit ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT CREATIVE */}
      {editingCreative && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                বিজ্ঞাপন ক্রিয়েটিভ সম্পাদন
              </h3>
              <button onClick={() => setEditingCreative(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreativeEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">বিজ্ঞাপনের নাম</label>
                <input
                  type="text"
                  required
                  value={editCrName}
                  onChange={(e) => setEditCrName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              {/* Banner Creative Media with Central DAM Picker */}
              <MediaPickerInput
                label="বিজ্ঞাপন ব্যানার / ক্রিয়েটিভ ছবি"
                value={editCrMediaUrl}
                onChange={setEditCrMediaUrl}
                folderSlug="ads-campaigns"
                allowedTypes={['IMAGE']}
                placeholder="মিডিয়া লাইব্রেরি থেকে বিজ্ঞাপন ইমেজ বেছে নিন..."
              />

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">শিরোনাম</label>
                <input
                  type="text"
                  value={editCrHeadline}
                  onChange={(e) => setEditCrHeadline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">বিবরণ</label>
                <input
                  type="text"
                  value={editCrDescription}
                  onChange={(e) => setEditCrDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">বাটন টেক্সট</label>
                  <input
                    type="text"
                    value={editCrCtaText}
                    onChange={(e) => setEditCrCtaText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">গন্তব্য লিঙ্ক</label>
                  <input
                    type="url"
                    value={editCrDestUrl}
                    onChange={(e) => setEditCrDestUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCreative(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingCrEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
                >
                  {savingCrEdit ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: UNIVERSAL DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনি কি নিশ্চিতভাবে &quot;<span className="font-bold text-stone-800 dark:text-stone-200">{deleteTarget.name}</span>&quot; মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deletingItem}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
              >
                {deletingItem ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, নিশ্চিত ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: REVIEW WITH LIVE PREVIEW */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {reviewType === 'campaign' ? 'ক্যাম্পেইন যাচাই ও অনুমোদন' : 'বিজ্ঞাপন ক্রিয়েটিভ লাইভ প্রিভিউ ও যাচাই'}
              </h3>
              <button onClick={() => setReviewModalItem(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Preview Widget */}
            {reviewType === 'creative' && (
              <AdLivePreview
                format={reviewModalItem.format}
                mediaUrl={reviewModalItem.mediaUrl}
                headline={reviewModalItem.headline}
                description={reviewModalItem.description}
                ctaText={reviewModalItem.ctaText}
                destinationUrl={reviewModalItem.destinationUrl}
                advertiserName={reviewModalItem.advertiser?.companyName || reviewModalItem.advertiser?.name}
              />
            )}

            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs space-y-1">
              <span className="font-bold block text-stone-900 dark:text-stone-100">{reviewModalItem.name}</span>
              <span className="text-stone-500 block">
                বিজ্ঞাপনদাতা: {reviewModalItem.advertiser?.companyName || reviewModalItem.advertiser?.name}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300">
                বাতিলকরণ কারণ বা সংশোধন নির্দেশনা (প্রত্যাখ্যানের ক্ষেত্রে):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="যেমন: ব্যানারের ছবির কোয়ালিটি সঠিক নয় বা নির্ধারিত মাত্রা লঙ্ঘন করেছে..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => {
                  if (reviewType === 'campaign') {
                    handleCampaignAction(reviewModalItem.id, 'REJECT', rejectReason);
                  } else {
                    handleCreativeAction(reviewModalItem.id, 'REJECT', rejectReason);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => {
                  if (reviewType === 'campaign') {
                    handleCampaignAction(reviewModalItem.id, 'APPROVE');
                  } else {
                    handleCreativeAction(reviewModalItem.id, 'APPROVE');
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                অনুমোদন দিন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
