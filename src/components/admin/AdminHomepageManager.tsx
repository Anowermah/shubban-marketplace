'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  Sliders,
  Layers,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export interface HomepageSectionItem {
  id: string;
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  isEnabled: boolean;
  displayOrder: number;
  badge?: string | null;
  viewAllUrl?: string | null;
  config?: string | null;
}

interface AdminHomepageManagerProps {
  initialSections: HomepageSectionItem[];
}

export default function AdminHomepageManager({ initialSections }: AdminHomepageManagerProps) {
  const [sections, setSections] = useState<HomepageSectionItem[]>(initialSections);
  const [filterQuery, setFilterQuery] = useState('');
  const [editingSection, setEditingSection] = useState<HomepageSectionItem | null>(null);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [newSection, setNewSection] = useState({
    sectionKey: '',
    title: '',
    subtitle: '',
    badge: '',
    viewAllUrl: '',
    isEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Move Section Up
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newArr = [...sections];
    const temp = newArr[index];
    newArr[index] = newArr[index - 1];
    newArr[index - 1] = temp;

    // Recalculate displayOrders
    const updated = newArr.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    setSections(updated);
    await syncOrders(updated);
  };

  // Move Section Down
  const handleMoveDown = async (index: number) => {
    if (index === sections.length - 1) return;
    const newArr = [...sections];
    const temp = newArr[index];
    newArr[index] = newArr[index + 1];
    newArr[index + 1] = temp;

    // Recalculate displayOrders
    const updated = newArr.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    setSections(updated);
    await syncOrders(updated);
  };

  // Toggle Visibility
  const handleToggleEnabled = async (section: HomepageSectionItem) => {
    const newStatus = !section.isEnabled;
    const updated = sections.map((s) => (s.id === section.id ? { ...s, isEnabled: newStatus } : s));
    setSections(updated);

    try {
      const res = await fetch(`/api/admin/homepage/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: newStatus }),
      });
      if (!res.ok) throw new Error('স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।');
      showNotification(`"${section.title}" ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে।`);
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  // Sync Orders with Server
  const syncOrders = async (items: HomepageSectionItem[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/homepage/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: items.map((i) => ({ id: i.id, displayOrder: i.displayOrder })),
        }),
      });
      if (!res.ok) throw new Error('ক্রমানুসার সংরক্ষণ ব্যর্থ হয়েছে।');
      showNotification('সেকশনের ক্রমানুসার সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Edit Section
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/homepage/sections/${editingSection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingSection.title,
          subtitle: editingSection.subtitle,
          badge: editingSection.badge,
          viewAllUrl: editingSection.viewAllUrl,
          isEnabled: editingSection.isEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সেকশন তথ্য সেভ করা সম্ভব হয়নি।');

      setSections(sections.map((s) => (s.id === editingSection.id ? editingSection : s)));
      setEditingSection(null);
      showNotification('সেকশনের শিরোনাম ও তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Create Custom Section
  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.title || !newSection.sectionKey) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/homepage/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSection),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'নতুন সেকশন তৈরি ব্যর্থ হয়েছে।');

      setSections([...sections, data.section]);
      setIsCreatingCustom(false);
      setNewSection({ sectionKey: '', title: '', subtitle: '', badge: '', viewAllUrl: '', isEnabled: true });
      showNotification('নতুন সেকশন সফলভাবে যুক্ত করা হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Custom Section
  const handleDeleteCustom = async (id: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${title}" সেকশনটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/homepage/sections/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('সেকশন মুছতে সমস্যা হয়েছে।');
      setSections(sections.filter((s) => s.id !== id));
      showNotification('সেকশনটি সফলভাবে মুছে ফেলা হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.sectionKey.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (s.badge && s.badge.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <LayoutTemplate className="w-7 h-7 text-shubban-gold" />
            <span>হোমপেজ সেকশন বিল্ডার (Homepage Builder)</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            মূল ওয়েবসাইটের প্রতিটি সেকশনের শিরোনাম, উপশিরোনাম, দৃশ্যমানতা ও ক্রমানুসার সম্পূর্ণভাবে নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-shubban-gold" />
            <span>লাইভ হোমপেজ প্রিভিউ</span>
          </Link>

          <Link
            href="/admin/banners"
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>হিরো ব্যানার ম্যানেজার</span>
          </Link>

          <button
            onClick={() => setIsCreatingCustom(true)}
            className="px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold flex items-center gap-1.5 shadow transition-all"
          >
            <Plus className="w-4 h-4 text-shubban-gold" />
            <span>কাস্টম সেকশন যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border transition-all ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-shubban-darkCard p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Layers className="w-4 h-4 text-shubban-gold" />
          <span>
            সর্বমোট সেকশন: <strong className="text-stone-900 dark:text-stone-100">{toBengaliNumber(sections.length)}</strong> টি • সক্রিয়: <strong className="text-emerald-600">{toBengaliNumber(sections.filter((s) => s.isEnabled).length)}</strong> টি • নিষ্ক্রিয়: <strong className="text-stone-400">{toBengaliNumber(sections.filter((s) => !s.isEnabled).length)}</strong> টি
          </span>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="সেকশন খুঁজুন..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {filteredSections.map((sec, idx) => (
          <div
            key={sec.id}
            className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-shubban-darkCard border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              sec.isEnabled
                ? 'border-stone-200 dark:border-stone-800'
                : 'border-dashed border-stone-300 dark:border-stone-800 opacity-60 bg-stone-50/50 dark:bg-stone-900/40'
            }`}
          >
            {/* Left: Reorder Controls + Order Number */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-20 transition-colors"
                  title="উপরে নিন"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === sections.length - 1}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-20 transition-colors"
                  title="নিচে নিন"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
              </div>

              <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-xs text-stone-600 dark:text-stone-300">
                {sec.displayOrder}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {sec.title}
                  </h3>
                  {sec.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-shubban-gold/15 text-shubban-gold border border-shubban-gold/30">
                      {sec.badge}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500">
                    key: {sec.sectionKey}
                  </span>
                </div>
                {sec.subtitle && (
                  <p className="text-xs text-stone-500 max-w-xl">{sec.subtitle}</p>
                )}
                {sec.viewAllUrl && (
                  <span className="text-[11px] text-shubban-green dark:text-shubban-gold font-mono block">
                    ভিউ-অল লিংক: {sec.viewAllUrl}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              {/* Enable / Disable Toggle */}
              <button
                onClick={() => handleToggleEnabled(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  sec.isEnabled
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                }`}
              >
                {sec.isEnabled ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>সক্রিয়</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                    <span>নিষ্ক্রিয়</span>
                  </>
                )}
              </button>

              {/* Edit Button */}
              <button
                onClick={() => setEditingSection(sec)}
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
                title="এডিট করুন"
              >
                <Edit className="w-4 h-4" />
              </button>

              {/* Delete button if custom */}
              {sec.sectionKey.startsWith('custom_') && (
                <button
                  onClick={() => handleDeleteCustom(sec.id, sec.title)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 transition-colors"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  সেকশন সম্পাদনা করুন
                </h3>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  সেকশনের শিরোনাম (বাংলা)
                </label>
                <input
                  type="text"
                  required
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  উপশিরোনাম / বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাজ লেবেল (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="উদা: হট ডিল"
                    value={editingSection.badge || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, badge: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ভিউ-অল লিংক (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="উদা: /books"
                    value={editingSection.viewAllUrl || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, viewAllUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modal-enabled"
                  checked={editingSection.isEnabled}
                  onChange={(e) => setEditingSection({ ...editingSection, isEnabled: e.target.checked })}
                  className="rounded text-shubban-green focus:ring-shubban-gold"
                />
                <label htmlFor="modal-enabled" className="text-xs text-stone-700 dark:text-stone-300 font-semibold cursor-pointer">
                  হোমপেজে এই সেকশনটি দৃশ্যমান (Active) রাখুন
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-shubban-gold" />
                  <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Section Modal */}
      {isCreatingCustom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  নতুন কাস্টম সেকশন যুক্ত করুন
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingCustom(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  সেকশন কী (ইংরেজি ইউনিক আইডেন্টিফায়ার)
                </label>
                <input
                  type="text"
                  required
                  placeholder="custom_ramadan_deals"
                  value={newSection.sectionKey}
                  onChange={(e) => setNewSection({ ...newSection, sectionKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  সেকশন শিরোনাম (বাংলা)
                </label>
                <input
                  type="text"
                  required
                  placeholder="রমজান স্পেশাল হাদিস ও দোয়া গ্রন্থাবলী"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  উপশিরোনাম / বার্তা
                </label>
                <textarea
                  rows={2}
                  placeholder="রমজানের বিশেষ প্যাকেজে আকর্ষণীয় ছাড় ও উপহার..."
                  value={newSection.subtitle}
                  onChange={(e) => setNewSection({ ...newSection, subtitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ব্যাজ
                  </label>
                  <input
                    type="text"
                    placeholder="সীমিত অফার"
                    value={newSection.badge}
                    onChange={(e) => setNewSection({ ...newSection, badge: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ভিউ-অল লিংক
                  </label>
                  <input
                    type="text"
                    placeholder="/books"
                    value={newSection.viewAllUrl}
                    onChange={(e) => setNewSection({ ...newSection, viewAllUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-shubban-gold" />
                  <span>{isSaving ? 'তৈরি হচ্ছে...' : 'সেকশন তৈরি করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

