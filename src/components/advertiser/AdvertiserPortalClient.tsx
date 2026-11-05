'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Layers,
  Sparkles,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  ExternalLink,
  Pause,
  Play,
  Upload,
  RefreshCw,
  TrendingUp,
  FileText,
  DollarSign,
  ShieldCheck,
  X,
  Edit3,
  Trash2,
  Copy,
  BarChart2,
  Search,
  Filter,
  Check,
  Printer,
  Calendar,
  MousePointer,
  Percent,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import AdLivePreview from '@/components/ads/AdLivePreview';

interface AdvertiserPortalClientProps {
  initialAdvertiser: any;
  availablePlacements: any[];
  availablePackages: any[];
}

export default function AdvertiserPortalClient({
  initialAdvertiser,
  availablePlacements,
  availablePackages,
}: AdvertiserPortalClientProps) {
  const [advertiser, setAdvertiser] = useState<any>(initialAdvertiser);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create-campaign' | 'creatives' | 'invoices' | 'profile'>('campaigns');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter State
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'PENDING' | 'REJECTED' | 'DRAFT'>('ALL');

  // New Campaign Form State
  const [newCampName, setNewCampName] = useState('');
  const [newCampObjective, setNewCampObjective] = useState('BRAND_AWARENESS');
  const [selectedPlacementId, setSelectedPlacementId] = useState(availablePlacements[0]?.id || '');
  const [selectedCreativeId, setSelectedCreativeId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(availablePackages[0]?.id || '');
  const [customDays, setCustomDays] = useState(7);
  const [submittingCamp, setSubmittingCamp] = useState(false);

  // New Creative Upload State
  const [creativeName, setCreativeName] = useState('');
  const [creativeFormat, setCreativeFormat] = useState('LEADERBOARD_BANNER');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [ctaText, setCtaText] = useState('বিস্তারিত দেখুন');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submittingCreative, setSubmittingCreative] = useState(false);

  // Edit Campaign Modal State
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [editCampName, setEditCampName] = useState('');
  const [editCampObjective, setEditCampObjective] = useState('');
  const [editCampPlacementId, setEditCampPlacementId] = useState('');
  const [editCampCreativeId, setEditCampCreativeId] = useState('');
  const [savingCampEdit, setSavingCampEdit] = useState(false);

  // Edit Creative Modal State
  const [editingCreative, setEditingCreative] = useState<any | null>(null);
  const [editCrName, setEditCrName] = useState('');
  const [editCrHeadline, setEditCrHeadline] = useState('');
  const [editCrDescription, setEditCrDescription] = useState('');
  const [editCrCtaText, setEditCrCtaText] = useState('');
  const [editCrDestUrl, setEditCrDestUrl] = useState('');
  const [editCrMediaUrl, setEditCrMediaUrl] = useState('');
  const [savingCrEdit, setSavingCrEdit] = useState(false);

  // Analytics Modal State
  const [analyticsCampaign, setAnalyticsCampaign] = useState<any | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'campaign' | 'creative'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Payment Modal State
  const [payModalInvoice, setPayModalInvoice] = useState<any | null>(null);
  const [payGateway, setPayGateway] = useState('BKASH');
  const [isPaying, setIsPaying] = useState(false);

  // Printable Invoice Modal State
  const [printInvoice, setPrintInvoice] = useState<any | null>(null);

  // Profile Edit State
  const [companyName, setCompanyName] = useState(advertiser?.companyName || '');
  const [contactName, setContactName] = useState(advertiser?.name || '');
  const [phone, setPhone] = useState(advertiser?.phone || '');
  const [website, setWebsite] = useState(advertiser?.website || '');
  const [taxId, setTaxId] = useState(advertiser?.taxId || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch tab data
  const loadTab = async (tab: string) => {
    setLoadingData(true);
    try {
      if (tab === 'campaigns') {
        const res = await fetch('/api/advertiser/campaigns');
        const data = await res.json();
        if (data.success) setCampaigns(data.campaigns);
      } else if (tab === 'creatives') {
        const res = await fetch('/api/advertiser/creatives');
        const data = await res.json();
        if (data.success) {
          setCreatives(data.creatives);
          if (data.creatives.length > 0 && !selectedCreativeId) {
            setSelectedCreativeId(data.creatives[0].id);
          }
        }
      } else if (tab === 'invoices') {
        const res = await fetch('/api/advertiser/invoices');
        const data = await res.json();
        if (data.success) setInvoices(data.invoices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    loadTab('campaigns');
    loadTab('creatives');
    loadTab('invoices');
  }, []);

  // Upload creative file via Sharp API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', isEdit ? editingCreative?.format || 'LEADERBOARD_BANNER' : creativeFormat);

      const res = await fetch('/api/ads/creatives/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        if (isEdit) {
          setEditCrMediaUrl(data.url);
        } else {
          setUploadedMediaUrl(data.url);
        }
        showToast('ব্যানার সফলভাবে আপলোড ও অপটিমাইজ করা হয়েছে!');
      } else {
        showToast(data.error || 'আপলোড ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Create Creative
  const handleCreateCreative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creativeName || !uploadedMediaUrl || !destinationUrl) {
      showToast('ব্যানার নাম, ছবি এবং গন্তব্য লিঙ্ক দিন।', 'error');
      return;
    }

    setSubmittingCreative(true);
    try {
      const res = await fetch('/api/advertiser/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: creativeName,
          format: creativeFormat,
          mediaUrl: uploadedMediaUrl,
          headline,
          description,
          ctaText,
          destinationUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setCreativeName('');
        setUploadedMediaUrl('');
        setHeadline('');
        setDescription('');
        setDestinationUrl('');
        loadTab('creatives');
        setActiveTab('creatives');
      } else {
        showToast(data.error || 'ক্রিয়েটিভ তৈরিতে সমস্যা হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingCreative(false);
    }
  };

  // Open Edit Creative Modal
  const openEditCreative = (cr: any) => {
    setEditingCreative(cr);
    setEditCrName(cr.name || '');
    setEditCrHeadline(cr.headline || '');
    setEditCrDescription(cr.description || '');
    setEditCrCtaText(cr.ctaText || 'বিস্তারিত দেখুন');
    setEditCrDestUrl(cr.destinationUrl || '');
    setEditCrMediaUrl(cr.mediaUrl || '');
  };

  // Save Creative Edit
  const handleSaveCreativeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreative) return;

    setSavingCrEdit(true);
    try {
      const res = await fetch('/api/advertiser/creatives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCreative.id,
          name: editCrName,
          headline: editCrHeadline,
          description: editCrDescription,
          ctaText: editCrCtaText,
          destinationUrl: editCrDestUrl,
          mediaUrl: editCrMediaUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setEditingCreative(null);
        loadTab('creatives');
      } else {
        showToast(data.error || 'আপডেট ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingCrEdit(false);
    }
  };

  // Submit Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName || !selectedPlacementId || !selectedCreativeId) {
      showToast('ক্যাম্পেইনের নাম, স্লট এবং ব্যানার নির্বাচন করুন।', 'error');
      return;
    }

    const pkg = availablePackages.find((p) => p.id === selectedPackageId);
    const agreedPrice = pkg ? pkg.price : 2500;
    const durationDays = pkg ? pkg.durationDays : customDays;

    setSubmittingCamp(true);
    try {
      const res = await fetch('/api/advertiser/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampName,
          objective: newCampObjective,
          placementIds: [selectedPlacementId],
          creativeId: selectedCreativeId,
          packageId: selectedPackageId,
          durationDays,
          agreedPrice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setNewCampName('');
        loadTab('campaigns');
        loadTab('invoices');
        setActiveTab('campaigns');
      } else {
        showToast(data.error || 'ক্যাম্পেইন জমা দিতে সমস্যা হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingCamp(false);
    }
  };

  // Open Edit Campaign Modal
  const openEditCampaign = (c: any) => {
    setEditingCampaign(c);
    setEditCampName(c.name || '');
    setEditCampObjective(c.objective || 'BRAND_AWARENESS');
    setEditCampPlacementId(c.placements?.[0]?.placementId || availablePlacements[0]?.id || '');
    setEditCampCreativeId(c.creatives?.[0]?.creativeId || creatives[0]?.id || '');
  };

  // Save Campaign Edit
  const handleSaveCampaignEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    setSavingCampEdit(true);
    try {
      const res = await fetch('/api/advertiser/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCampaign.id,
          name: editCampName,
          objective: editCampObjective,
          placementIds: [editCampPlacementId],
          creativeId: editCampCreativeId,
          action: editingCampaign.approvalStatus === 'REJECTED' ? 'RESUBMIT' : 'UPDATE',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setEditingCampaign(null);
        loadTab('campaigns');
      } else {
        showToast(data.error || 'আপডেট করতে ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingCampEdit(false);
    }
  };

  // Toggle Pause / Resume
  const handleToggleCampaignStatus = async (c: any) => {
    const action = c.status === 'ACTIVE' ? 'PAUSE' : 'RESUME';
    try {
      const res = await fetch('/api/advertiser/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, action }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || (action === 'PAUSE' ? 'ক্যাম্পেইন স্থগিত করা হয়েছে।' : 'ক্যাম্পেইন পুনরায় চালু হয়েছে।'));
        loadTab('campaigns');
      } else {
        showToast(data.error || 'অ্যাকশন সম্পন্ন হয়নি।', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Duplicate Campaign
  const handleDuplicateCampaign = async (c: any) => {
    try {
      const res = await fetch('/api/advertiser/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, action: 'DUPLICATE' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        loadTab('campaigns');
      } else {
        showToast(data.error || 'ডুপ্লিকেট করা সম্ভব হয়নি।', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Execute Delete
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    setDeletingItem(true);
    try {
      const endpoint = deleteTarget.type === 'campaign'
        ? `/api/advertiser/campaigns?id=${deleteTarget.id}`
        : `/api/advertiser/creatives?id=${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setDeleteTarget(null);
        if (deleteTarget.type === 'campaign') loadTab('campaigns');
        else loadTab('creatives');
      } else {
        showToast(data.error || 'ডিলিট করতে সমস্যা হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  // Pay Invoice
  const handlePayInvoice = async () => {
    if (!payModalInvoice) return;
    setIsPaying(true);
    try {
      const res = await fetch('/api/advertiser/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: payModalInvoice.id,
          paymentGateway: payGateway,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!');
        setPayModalInvoice(null);
        loadTab('invoices');
        loadTab('campaigns');
      } else {
        showToast(data.error || 'পেমেন্ট সম্পন্ন হয়নি।', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsPaying(false);
    }
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/advertiser/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: advertiser.id,
          companyName,
          contactName,
          phone,
          website,
          taxId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdvertiser(data.advertiser);
        showToast('প্রতিষ্ঠান প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!');
      } else {
        showToast(data.error || 'আপডেট ব্যর্থ হয়েছে।', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
        c.campaignNumber.toLowerCase().includes(campaignSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (campaignFilter === 'ACTIVE') return c.status === 'ACTIVE';
      if (campaignFilter === 'PAUSED') return c.status === 'PAUSED';
      if (campaignFilter === 'PENDING') return c.approvalStatus === 'SUBMITTED' || c.status === 'PENDING_APPROVAL';
      if (campaignFilter === 'REJECTED') return c.approvalStatus === 'REJECTED';
      if (campaignFilter === 'DRAFT') return c.status === 'DRAFT';

      return true;
    });
  }, [campaigns, campaignSearch, campaignFilter]);

  // Selected creative object for Live Preview in create-campaign tab
  const activeSelectedCreative = useMemo(() => {
    return creatives.find((cr) => cr.id === selectedCreativeId);
  }, [creatives, selectedCreativeId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-bengali space-y-8">
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

      {/* Header Profile Summary */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-2xl flex-shrink-0">
            {advertiser.companyName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold">{advertiser.companyName}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                ভেরিফাইড পার্টনার
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              যোগাযোগ: {advertiser.name} • {advertiser.email} • {advertiser.phone || 'ফোন যুক্ত নেই'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('create-campaign')}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বিজ্ঞাপন ক্যাম্পেইন শুরু করুন</span>
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 dark:border-stone-800 text-xs font-bold scrollbar-none">
        {[
          { key: 'campaigns', label: 'আমার ক্যাম্পেইনসমূহ', icon: Megaphone, badge: campaigns.length },
          { key: 'create-campaign', label: 'ক্যাম্পেইন লঞ্চ করুন', icon: Plus },
          { key: 'creatives', label: 'ব্যানার ও ক্রিয়েটিভস', icon: Sparkles, badge: creatives.length },
          { key: 'invoices', label: 'বিলিং ও ইনভয়েস', icon: CreditCard, badge: invoices.filter((i) => i.status !== 'PAID').length },
          { key: 'profile', label: 'প্রতিষ্ঠান তথ্য', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                loadTab(tab.key);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${isActive
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold shadow-xs'
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

      {/* TAB 1: MY CAMPAIGNS (Advanced Full Control) */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="ক্যাম্পেইন নাম বা নম্বর দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-semibold">
              {[
                { key: 'ALL', label: 'সকল' },
                { key: 'ACTIVE', label: 'সক্রিয়' },
                { key: 'PAUSED', label: 'স্থগিত' },
                { key: 'PENDING', label: 'অনুমোদনের অপেক্ষায়' },
                { key: 'REJECTED', label: 'প্রত্যাখ্যাত' },
                { key: 'DRAFT', label: 'ড্রাফট' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setCampaignFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${campaignFilter === f.key
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            {filteredCampaigns.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Megaphone className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="font-bold text-sm text-stone-700 dark:text-stone-300">কোনো ক্যাম্পেইন পাওয়া যায়নি</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  শুব্বান লাইব্রেরীতে আপনার বই, প্রকাশনা বা প্রতিষ্ঠানের প্রচারণা শুরু করতে নতুন ক্যাম্পেইন তৈরি করুন।
                </p>
                <button
                  onClick={() => setActiveTab('create-campaign')}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ক্যাম্পেইন শুরু করুন</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bengali">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500">
                    <tr>
                      <th className="p-4">ক্যাম্পেইন বিবরণ</th>
                      <th className="p-4">প্লেসমেন্ট স্লট</th>
                      <th className="p-4">বাজেট</th>
                      <th className="p-4">সময়কাল</th>
                      <th className="p-4">ইম্প্রেশন / ক্লিক (CTR)</th>
                      <th className="p-4">স্ট্যাটাস</th>
                      <th className="p-4 text-right">নিয়ন্ত্রণ ও অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredCampaigns.map((c) => {
                      const imp = c._count?.impressions || 0;
                      const clk = c._count?.clicks || 0;
                      const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={c.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                          <td className="p-4">
                            <div className="font-bold text-stone-900 dark:text-stone-100">{c.name}</div>
                            <span className="block text-[10px] text-stone-400 font-mono">
                              {c.campaignNumber}
                            </span>
                            {c.approvalStatus === 'REJECTED' && c.rejectionReason && (
                              <div className="text-[10px] text-rose-600 mt-1 flex items-center gap-1 font-sans">
                                <AlertCircle className="w-3 h-3" />
                                কারণ: {c.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-stone-600 dark:text-stone-300">
                            {c.placements?.map((p: any) => p.placement?.name).join(', ') || 'সাধারণ'}
                          </td>
                          <td className="p-4 font-mono font-bold text-stone-800 dark:text-stone-200">
                            ৳{toBengaliNumber(c.agreedPrice || c.budget)}
                          </td>
                          <td className="p-4 text-[11px] text-stone-500">
                            {new Date(c.startDate).toLocaleDateString('bn-BD')} —{' '}
                            {new Date(c.endDate).toLocaleDateString('bn-BD')}
                          </td>
                          <td className="p-4 font-mono text-[11px]">
                            <div>👁️ {toBengaliNumber(imp)} | 🖱️ {toBengaliNumber(clk)}</div>
                            <div className="text-[10px] text-amber-600">CTR: {toBengaliNumber(ctr)}%</div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${c.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : c.status === 'PAUSED'
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                    : c.approvalStatus === 'REJECTED'
                                      ? 'bg-rose-500/10 text-rose-700'
                                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                                }`}
                            >
                              {c.status === 'ACTIVE' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  সক্রিয়
                                </>
                              ) : c.status === 'PAUSED' ? (
                                'স্থগিত'
                              ) : c.approvalStatus === 'REJECTED' ? (
                                'প্রত্যাখ্যাত'
                              ) : c.approvalStatus === 'SUBMITTED' ? (
                                'অনুমোদনের অপেক্ষায়'
                              ) : (
                                c.status
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* 1. Pause / Resume */}
                              {c.approvalStatus === 'APPROVED' && (
                                <button
                                  onClick={() => handleToggleCampaignStatus(c)}
                                  className={`p-1.5 rounded-lg transition-colors ${c.status === 'ACTIVE'
                                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    }`}
                                  title={c.status === 'ACTIVE' ? 'সাময়িকভাবে স্থগিত করুন' : 'পুনরায় চালু করুন'}
                                >
                                  {c.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                              )}

                              {/* 2. Analytics */}
                              <button
                                onClick={() => setAnalyticsCampaign(c)}
                                className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                                title="পারফরম্যান্স অ্যানালিটিক্স দেখুন"
                              >
                                <BarChart2 className="w-4 h-4" />
                              </button>

                              {/* 3. Edit */}
                              <button
                                onClick={() => openEditCampaign(c)}
                                className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                title="ক্যাম্পেইন এডিট করুন"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* 4. Duplicate */}
                              <button
                                onClick={() => handleDuplicateCampaign(c)}
                                className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                                title="ক্যাম্পেইন ডুপ্লিকেট (কপি) করুন"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* 5. Delete */}
                              <button
                                onClick={() => setDeleteTarget({ type: 'campaign', id: c.id, name: c.name })}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="ক্যাম্পেইন ডিলিট করুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE / LAUNCH CAMPAIGN */}
      {activeTab === 'create-campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                নতুন বিজ্ঞাপন ক্যাম্পেইন কনফিগার করুন
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                বিজ্ঞাপনের লক্ষ্য, অবস্থান, সময়সীমা এবং বাজেট নির্বাচন করে ক্যাম্পেইন সাবমিট করুন।
              </p>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ক্যাম্পেইন নাম *</label>
                <input
                  type="text"
                  required
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="যেমন: সীরাত প্রকাশনী রমজান অফার ২০২৬"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">ক্যাম্পেইনের লক্ষ্য (Objective)</label>
                  <select
                    value={newCampObjective}
                    onChange={(e) => setNewCampObjective(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  >
                    <option value="BRAND_AWARENESS">ব্র্যান্ড পরিচিতি (Brand Awareness)</option>
                    <option value="TRAFFIC">ওয়েবসাইটে পাঠক ট্রাফিক (Website Traffic)</option>
                    <option value="SALES">বই ও পণ্য বিক্রয় বৃদ্ধি (Sales)</option>
                    <option value="BOOK_LAUNCH">নতুন গ্রন্থ উন্মোচন (Book Launch)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">বিজ্ঞাপনের অবস্থান (Placement Slot) *</label>
                  <select
                    value={selectedPlacementId}
                    onChange={(e) => setSelectedPlacementId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  >
                    {availablePlacements.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.desktopWidth}×{p.desktopHeight})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 dark:text-stone-300">সংযুক্ত ব্যানার / ক্রিয়েটিভ *</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('creatives')}
                    className="text-amber-600 hover:underline text-[11px] font-bold"
                  >
                    + নতুন ব্যানার আপলোড করুন
                  </button>
                </div>
                {creatives.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 text-amber-800 dark:text-amber-300 text-[11px]">
                    আপনার কোনো অনুমোদিত বা আপলোডকৃত ব্যানার নেই। অনুগ্রহ করে প্রথমে ব্যানার তৈরি করুন।
                  </div>
                ) : (
                  <select
                    value={selectedCreativeId}
                    onChange={(e) => setSelectedCreativeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  >
                    {creatives.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name} [{cr.format}] — {cr.approvalStatus}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Pricing Package Selection */}
              <div className="space-y-2 pt-2">
                <label className="font-bold text-stone-700 dark:text-stone-300">মূল্য ও সময়সীমা প্যাকেজ *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availablePackages.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${isSelected
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{pkg.name}</span>
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            ৳{toBengaliNumber(pkg.price)}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">{pkg.description}</p>
                        <div className="mt-2 text-[10px] font-semibold text-stone-500 flex items-center gap-2">
                          <span>⏱️ {toBengaliNumber(pkg.durationDays)} দিন প্রচার</span>
                          <span>• অগ্রাধিকার: {toBengaliNumber(pkg.priority)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingCamp || creatives.length === 0}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 mt-4"
              >
                {submittingCamp ? 'প্রসেসিং হচ্ছে...' : 'ক্যাম্পেইন সাবমিট করুন ও ইনভয়েস তৈরি করুন'}
              </button>
            </form>
          </div>

          {/* Live Preview Side */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              নির্বাচিত বিজ্ঞাপনের লাইভ ডিসপ্লে
            </h3>
            {activeSelectedCreative ? (
              <AdLivePreview
                format={activeSelectedCreative.format}
                mediaUrl={activeSelectedCreative.mediaUrl}
                headline={activeSelectedCreative.headline}
                description={activeSelectedCreative.description}
                ctaText={activeSelectedCreative.ctaText}
                destinationUrl={activeSelectedCreative.destinationUrl}
                advertiserName={advertiser.companyName}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-400">
                বিজ্ঞাপন ব্যানার নির্বাচন করলে এখানে তার লাইভ প্রিভিউ দেখতে পাবেন।
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CREATIVES & BANNERS (Advanced Full Control) */}
      {activeTab === 'creatives' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Creator Form */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                নতুন ব্যানার ও ক্রিয়েটিভ তৈরি
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                বিজ্ঞাপনের ছবি ও লিংক যুক্ত করুন। টাইপ করার সাথে সাথে ডানে লাইভ প্রিভিউ প্রদর্শিত হবে।
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">বিজ্ঞাপনের নাম *</label>
                <input
                  type="text"
                  value={creativeName}
                  onChange={(e) => setCreativeName(e.target.value)}
                  placeholder="যেমন: হাদিস সংকলন প্রধান ব্যানার"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ব্যানার ফরম্যাট *</label>
                <select
                  value={creativeFormat}
                  onChange={(e) => setCreativeFormat(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  <option value="LEADERBOARD_BANNER">লিডারবোর্ড ব্যানার (728×90)</option>
                  <option value="LARGE_LEADERBOARD">লার্জ লিডারবোর্ড (970×90/250)</option>
                  <option value="MEDIUM_RECTANGLE">মিডিয়াম রেক্টেঙ্গেল (300×250)</option>
                  <option value="HALF_PAGE">হাফ পেজ টাওয়ার (300×600)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">শিরোনাম (Headline)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="যেমন: তাহক্বীক্বী তাফসীরুল কুরআন বিশেষ ছাড়"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">সংক্ষিপ্ত বিবরণ (Description)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: সীমিত সময়ের জন্য ৩৫% ছাড় সহ সংগ্রহ করুন"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">বাটন টেক্সট (CTA)</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="এখনই অর্ডার করুন"
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">গন্তব্য লিঙ্ক *</label>
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://atrbd.com/books"
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ব্যানার ইমেজ আপলোড *</label>
                <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-4 text-center space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                    id="ad-creative-upload"
                  />
                  <label
                    htmlFor="ad-creative-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold cursor-pointer hover:bg-amber-500/20 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ছবি নির্বাচন করুন</span>
                  </label>
                  <span className="text-[10px] text-stone-400 block">
                    JPG, PNG, WebP (স্বয়ংক্রিয়ভাবে শার্প ইঞ্জিনে WebP অপটিমাইজেশন হবে)
                  </span>
                  {uploadingFile && <span className="text-[11px] text-amber-600 block animate-pulse">প্রসেস হচ্ছে...</span>}
                  {uploadedMediaUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden max-h-24 bg-stone-100 flex items-center justify-center">
                      <img src={uploadedMediaUrl} alt="Uploaded" className="max-h-24 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateCreative}
                disabled={submittingCreative || !uploadedMediaUrl || !creativeName || !destinationUrl}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow transition-all disabled:opacity-50"
              >
                {submittingCreative ? 'সংরক্ষণ হচ্ছে...' : 'ক্রিয়েটিভ সংরক্ষণ ও পর্যালোচনার জন্য জমা দিন'}
              </button>
            </div>
          </div>

          {/* Creatives List & Interactive Preview */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Interactive Preview Box */}
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                লাইভ ব্যানার প্রিভিউ
              </h3>
              <AdLivePreview
                format={creativeFormat}
                mediaUrl={uploadedMediaUrl}
                headline={headline}
                description={description}
                ctaText={ctaText}
                destinationUrl={destinationUrl}
                advertiserName={advertiser.companyName}
              />
            </div>

            {/* Saved Creatives Grid */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                আপনার সংরক্ষিত ক্রিয়েটিভস ({toBengaliNumber(creatives.length)})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creatives.map((cr) => (
                  <div
                    key={cr.id}
                    className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-3"
                  >
                    <div className="w-full h-28 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden flex items-center justify-center">
                      {cr.mediaUrl ? (
                        <img src={cr.mediaUrl} alt={cr.name} className="max-h-28 object-contain" />
                      ) : (
                        <span className="text-xs text-stone-400">কোনো ছবি নেই</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">{cr.name}</h4>
                      <span className="text-[10px] text-stone-400 font-mono block">{cr.format}</span>
                      <a
                        href={cr.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-600 hover:underline truncate block mt-0.5"
                      >
                        {cr.destinationUrl}
                      </a>
                      {cr.approvalStatus === 'REJECTED' && cr.rejectionReason && (
                        <div className="mt-1 text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded-lg">
                          কারণ: {cr.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${cr.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : cr.approvalStatus === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-700'
                              : 'bg-amber-500/10 text-amber-700'
                          }`}
                      >
                        {cr.approvalStatus === 'APPROVED'
                          ? 'অনুমোদিত'
                          : cr.approvalStatus === 'REJECTED'
                            ? 'প্রত্যাখ্যাত'
                            : 'পর্যালোচনাধীন'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCreative(cr)}
                          className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                          title="এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'creative', id: cr.id, name: cr.name })}
                          className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVOICES & PAYMENTS */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              বিলিং ইনভয়েস ও রসিদ
            </h3>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-400">কোনো ইনভয়েস পাওয়া যায়নি।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bengali">
                <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500">
                  <tr>
                    <th className="p-4">ইনভয়েস নম্বর</th>
                    <th className="p-4">ক্যাম্পেইন</th>
                    <th className="p-4">টাকার পরিমাণ</th>
                    <th className="p-4">মেয়াদ তারিখ</th>
                    <th className="p-4">স্ট্যাটাস</th>
                    <th className="p-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-stone-50/50">
                      <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-4">{inv.campaign?.name || 'বিজ্ঞাপন সার্ভিস'}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600">
                        ৳{toBengaliNumber(inv.totalAmount)}
                      </td>
                      <td className="p-4 text-stone-500">
                        {new Date(inv.dueDate).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${inv.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-amber-500/10 text-amber-700'
                            }`}
                        >
                          {inv.status === 'PAID' ? 'পরিশোধিত' : 'অপরিশোধিত'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setPrintInvoice(inv)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>রসিদ</span>
                        </button>
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => setPayModalInvoice(inv)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
                          >
                            পেমেন্ট করুন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROFILE EDIT */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            বিজ্ঞাপনদাতা সংস্থা ও যোগাযোগের তথ্য হালনাগাদ
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-300">প্রতিষ্ঠানের নাম</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-300">যোগাযোগকারীর নাম</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ফোন নম্বর</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ট্যাক্স / ট্রেড লাইসেন্স আইডি</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 dark:text-stone-300">অফিসিয়াল ওয়েবসাইট</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow transition-all disabled:opacity-50"
            >
              {savingProfile ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: EDIT CAMPAIGN */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                ক্যাম্পেইন সম্পাদন (Edit Campaign)
              </h3>
              <button onClick={() => setEditingCampaign(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaignEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ক্যাম্পেইন নাম *</label>
                <input
                  type="text"
                  required
                  value={editCampName}
                  onChange={(e) => setEditCampName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ক্যাম্পেইন অবজেক্টিভ</label>
                <select
                  value={editCampObjective}
                  onChange={(e) => setEditCampObjective(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  <option value="BRAND_AWARENESS">ব্র্যান্ড পরিচিতি</option>
                  <option value="TRAFFIC">ওয়েবসাইটে ট্রাফিক</option>
                  <option value="SALES">পণ্য বিক্রয় বৃদ্ধি</option>
                  <option value="BOOK_LAUNCH">নতুন গ্রন্থ উন্মোচন</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">প্লেসমেন্ট স্লট</label>
                <select
                  value={editCampPlacementId}
                  onChange={(e) => setEditCampPlacementId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  {availablePlacements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.desktopWidth}×{p.desktopHeight})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">বিজ্ঞাপন ব্যানার</label>
                <select
                  value={editCampCreativeId}
                  onChange={(e) => setEditCampCreativeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  {creatives.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name} [{cr.format}]
                    </option>
                  ))}
                </select>
              </div>

              {editingCampaign.approvalStatus === 'REJECTED' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-300 text-[11px]">
                  💡 তথ্য সংশোধন করে সংরক্ষণ করলে ক্যাম্পেইনটি স্বয়ংক্রিয়ভাবে পুনরায় অ্যাডমিন পর্যালোচনার জন্য জমা হয়ে যাবে।
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingCampEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shadow"
                >
                  {savingCampEdit ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CREATIVE */}
      {editingCreative && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                ব্যানার সম্পাদন (Edit Creative)
              </h3>
              <button onClick={() => setEditingCreative(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreativeEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">বিজ্ঞাপনের নাম *</label>
                <input
                  type="text"
                  required
                  value={editCrName}
                  onChange={(e) => setEditCrName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">শিরোনাম (Headline)</label>
                <input
                  type="text"
                  value={editCrHeadline}
                  onChange={(e) => setEditCrHeadline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">বিবরণ (Description)</label>
                <input
                  type="text"
                  value={editCrDescription}
                  onChange={(e) => setEditCrDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">বাটন টেক্সট</label>
                  <input
                    type="text"
                    value={editCrCtaText}
                    onChange={(e) => setEditCrCtaText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-stone-300">গন্তব্য লিঙ্ক *</label>
                  <input
                    type="url"
                    required
                    value={editCrDestUrl}
                    onChange={(e) => setEditCrDestUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">ব্যানার ছবি পরিবর্তন</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="text-xs"
                />
                {editCrMediaUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden max-h-24 bg-stone-100 flex items-center justify-center">
                    <img src={editCrMediaUrl} alt="Preview" className="max-h-24 object-contain" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCreative(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingCrEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shadow"
                >
                  {savingCrEdit ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CAMPAIGN ANALYTICS */}
      {analyticsCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {analyticsCampaign.name}
                </h3>
                <span className="text-[10px] text-stone-400 font-mono">{analyticsCampaign.campaignNumber}</span>
              </div>
              <button onClick={() => setAnalyticsCampaign(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-bold">মোট ইম্প্রেশন</span>
                <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                  {toBengaliNumber(analyticsCampaign._count?.impressions || 0)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-bold">মোট ক্লিক</span>
                <span className="text-xl font-bold font-mono text-amber-600">
                  {toBengaliNumber(analyticsCampaign._count?.clicks || 0)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-bold">ক্লিক রেট (CTR)</span>
                <span className="text-xl font-bold font-mono text-emerald-600">
                  {toBengaliNumber(
                    (analyticsCampaign._count?.impressions || 0) > 0
                      ? (((analyticsCampaign._count?.clicks || 0) / analyticsCampaign._count.impressions) * 100).toFixed(2)
                      : '0.00'
                  )}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-bold">বাজেট</span>
                <span className="text-xl font-bold font-mono text-purple-600">
                  ৳{toBengaliNumber(analyticsCampaign.agreedPrice || analyticsCampaign.budget)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div>প্রচার সময়কাল: {new Date(analyticsCampaign.startDate).toLocaleDateString('bn-BD')} থেকে {new Date(analyticsCampaign.endDate).toLocaleDateString('bn-BD')}</div>
              <div>স্ট্যাটাস: <span className="font-bold text-amber-700">{analyticsCampaign.status}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
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
                আপনি কি নিশ্চিতভাবে &quot;<span className="font-bold text-stone-800 dark:text-stone-200">{deleteTarget.name}</span>&quot; মুছে ফেলতে চান?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300"
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

      {/* MODAL 5: PAYMENT MODAL */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                বিজ্ঞাপন বিল পেমেন্ট
              </h3>
              <button onClick={() => setPayModalInvoice(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-center">
              <span className="text-xs text-stone-500">পরিশোধের মোট পরিমাণ</span>
              <div className="text-3xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                ৳{toBengaliNumber(payModalInvoice.totalAmount)}
              </div>
              <span className="text-[11px] text-stone-400 font-mono mt-1 block">
                ইনভয়েস: {payModalInvoice.invoiceNumber}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                পেমেন্ট মেথড নির্বাচন করুন
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['BKASH', 'NAGAD', 'SSLCOMMERZ', 'BANK_TRANSFER'].map((gw) => (
                  <button
                    key={gw}
                    type="button"
                    onClick={() => setPayGateway(gw)}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${payGateway === gw
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    {gw === 'BKASH' ? 'বিকাশ (bKash)' : gw === 'NAGAD' ? 'নগদ (Nagad)' : gw === 'SSLCOMMERZ' ? 'কার্ড / নেট ব্যাংকিং' : 'ব্যাংক ট্রান্সফার'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePayInvoice}
              disabled={isPaying}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isPaying ? 'পেমেন্ট প্রসেসিং হচ্ছে...' : 'নিশ্চিত পেমেন্ট সম্পন্ন করুন'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: PRINTABLE INVOICE RECEIPT */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                  শুভ্বান লাইব্রেরি অ্যাডস নেটওয়ার্ক
                </h3>
                <span className="text-xs text-stone-400">অফিসিয়াল ইনভয়েস ও ক্যাশ মেমো</span>
              </div>
              <button onClick={() => setPrintInvoice(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">ইনভয়েস নম্বর:</span>
                <span className="font-mono font-bold">{printInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">গ্রাহক সংস্থা:</span>
                <span className="font-bold">{advertiser.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">ক্যাম্পেইন:</span>
                <span>{printInvoice.campaign?.name || 'বিজ্ঞাপন সার্ভিস'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">তারিখ:</span>
                <span>{new Date(printInvoice.createdAt).toLocaleDateString('bn-BD')}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-bold">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span className="font-mono text-emerald-600">৳{toBengaliNumber(printInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">স্ট্যাটাস:</span>
                <span className="font-bold text-emerald-600">{printInvoice.status === 'PAID' ? 'পরিশোধিত (PAID)' : 'অপরিশোধিত'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
