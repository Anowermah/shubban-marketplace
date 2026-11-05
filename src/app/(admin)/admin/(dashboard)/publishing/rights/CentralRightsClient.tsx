'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  Edit,
  ArrowRight,
  Loader2,
  Lock,
  Unlock,
  AlertOctagon,
} from 'lucide-react';

interface RightsItem {
  id: string;
  magazineId: string;
  rightsHolder: string;
  licenseType: string;
  allowPdfHosting: boolean;
  attributionRequirement: string | null;
  takedownStatus: string;
  notes: string | null;
  copyrightNotice: string | null;
  updatedAt: string;
  magazine: {
    id: string;
    title: string;
    slug: string;
    themeColor: string | null;
    publisher: { id: string; name: string } | null;
  };
}

interface Props {
  initialRights: RightsItem[];
}

const LICENSE_LABELS: Record<string, string> = {
  ALL_RIGHTS_RESERVED: 'সর্বস্বত্ব সংরক্ষিত (All Rights Reserved)',
  CREATIVE_COMMONS: 'ক্রিয়েটিভ কমন্স (CC BY-NC)',
  OPEN_ACCESS: 'ওপেন এক্সেস অ্যাকাডেমিক (Open Access)',
  PUBLIC_DOMAIN: 'পাবলিক ডোমেইন (Public Domain)',
  PROPRIETARY: 'প্রোপ্রাইটারি (Proprietary)',
};

export default function CentralRightsClient({ initialRights }: Props) {
  const [rightsList, setRightsList] = useState<RightsItem[]>(initialRights);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLicense, setFilterLicense] = useState('');
  const [filterTakedown, setFilterTakedown] = useState('');

  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RightsItem | null>(null);
  const [showTakedownModal, setShowTakedownModal] = useState(false);
  const [takedownReason, setTakedownReason] = useState('');

  const filtered = useMemo(() => {
    return rightsList.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.magazine.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rightsHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.copyrightNotice && item.copyrightNotice.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchLicense = !filterLicense || item.licenseType === filterLicense;
      const matchTakedown =
        !filterTakedown ||
        (filterTakedown === 'TAKEDOWN'
          ? item.takedownStatus === 'TAKEN_DOWN'
          : item.takedownStatus === 'ACTIVE');

      return matchSearch && matchLicense && matchTakedown;
    });
  }, [rightsList, searchTerm, filterLicense, filterTakedown]);

  const totalTakedowns = useMemo(
    () => rightsList.filter((r) => r.takedownStatus === 'TAKEN_DOWN').length,
    [rightsList]
  );
  const totalOpenAccess = useMemo(
    () => rightsList.filter((r) => r.licenseType === 'OPEN_ACCESS').length,
    [rightsList]
  );

  const handleToggleTakedown = async (item: RightsItem) => {
    if (item.takedownStatus !== 'TAKEN_DOWN') {
      setSelectedRecord(item);
      setTakedownReason('');
      setShowTakedownModal(true);
      return;
    }

    // Reinstate
    if (!confirm(`আপনি কি "${item.magazine.title}"-এর টেকডাউন বাতিল করে পুনরায় সক্রিয় করতে চান?`)) {
      return;
    }

    try {
      setSavingId(item.id);
      const res = await fetch('/api/publishing/rights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          takedownStatus: 'ACTIVE',
          notes: null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'টেকডাউন বাতিল করতে সমস্যা হয়েছে');

      setRightsList((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, takedownStatus: 'ACTIVE', notes: null } : r
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmTakedown = async () => {
    if (!selectedRecord) return;
    try {
      setSavingId(selectedRecord.id);
      const res = await fetch('/api/publishing/rights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          takedownStatus: 'TAKEN_DOWN',
          notes: takedownReason.trim() || 'কপিরাইট লঙ্ঘন অথবা আইনি অভিযোগের প্রেক্ষিতে স্থগিত',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'টেকডাউন সম্পন্ন করা যায়নি');

      setRightsList((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? {
                ...r,
                takedownStatus: 'TAKEN_DOWN',
                notes: takedownReason.trim() || 'কপিরাইট লঙ্ঘন অথবা আইনি অভিযোগের প্রেক্ষিতে স্থগিত',
              }
            : r
        )
      );
      setShowTakedownModal(false);
      setSelectedRecord(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <Link href="/admin/publishing" className="hover:text-emerald-700 transition">
              সেন্ট্রাল প্রকাশনা
            </Link>
            <span>/</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">কপিরাইট ও লাইসেন্স</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 text-white flex items-center justify-center shadow-md shadow-purple-700/20">
              <Shield className="w-5 h-5" />
            </div>
            সেন্ট্রাল কপিরাইট ও লিগ্যাল লাইসেন্স মনিটর
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            প্ল্যাটফর্মের সকল প্রকাশনার বুদ্ধিবৃত্তিক সম্পদ (IP), কপিরাইট শর্ত ও জরুরি টেকডাউন ব্যবস্থাপনা
          </p>
        </div>

        <Link
          href="/admin/publishing"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition self-start"
        >
          কন্ট্রোল সেন্টারে ফিরে যান
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">মোট কপিরাইট রেকর্ড</span>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{rightsList.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">নিবন্ধিত প্রকাশনা</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">ওপেন এক্সেস লাইসেন্স</span>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalOpenAccess}</p>
          <span className="text-[10px] text-blue-600 font-semibold">উন্মুক্ত গবেষণা</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">সক্রিয় টেকডাউন</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalTakedowns}</p>
          <span className="text-[10px] text-rose-500 font-semibold">আইনি প্রয়োজনে স্থগিত</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block mb-1">PDF হোস্টিং অনুমোদিত</span>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {rightsList.filter((r) => r.allowPdfHosting).length}
          </p>
          <span className="text-[10px] text-purple-600 font-semibold">ক্লাউড রেন্ডারিং সক্রিয়</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="প্রকাশনার নাম বা স্বত্বাধিকারী দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterLicense}
            onChange={(e) => setFilterLicense(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল লাইসেন্স টাইপ</option>
            {Object.entries(LICENSE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={filterTakedown}
            onChange={(e) => setFilterTakedown(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="ACTIVE">সক্রিয় প্রকাশনা</option>
            <option value="TAKEDOWN">স্থগিত (Takedown)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-stone-500 font-semibold">
                <th className="py-3.5 px-4">প্রকাশনা</th>
                <th className="py-3.5 px-4">স্বত্বাধিকারী (Rights Holder)</th>
                <th className="py-3.5 px-4">লাইসেন্স টাইপ</th>
                <th className="py-3.5 px-4 text-center">PDF হোস্টিং</th>
                <th className="py-3.5 px-4 text-center">টেকডাউন স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">জরুরি অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    কোনো কপিরাইট রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition ${
                      item.takedownStatus === 'TAKEN_DOWN' ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0"
                          style={{ backgroundColor: item.magazine.themeColor || '#0f3e2e' }}
                        >
                          {item.magazine.title.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/admin/publishing/workspaces/${item.magazineId}`}
                            className="font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 transition block"
                          >
                            {item.magazine.title}
                          </Link>
                          {item.magazine.publisher && (
                            <span className="text-[10px] text-stone-400 block">
                              {item.magazine.publisher.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                        {item.rightsHolder}
                      </span>
                      {item.copyrightNotice && (
                        <span className="text-[10px] text-stone-400 block max-w-xs truncate">
                          {item.copyrightNotice}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {LICENSE_LABELS[item.licenseType] || item.licenseType}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`text-[11px] font-bold ${
                          item.allowPdfHosting ? 'text-emerald-600' : 'text-stone-400'
                        }`}
                      >
                        {item.allowPdfHosting ? 'অনুমোদিত' : 'বন্ধ'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {item.takedownStatus === 'TAKEN_DOWN' ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            স্থগিত (Takedown)
                          </span>
                          {item.notes && (
                            <span className="text-[9px] text-rose-500 mt-0.5 max-w-xs truncate">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          স্বাভাবিক
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/publishing/workspaces/${item.magazineId}`}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600"
                          title="ওয়ার্কস্পেসে যান"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleToggleTakedown(item)}
                          disabled={savingId === item.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            item.takedownStatus === 'TAKEN_DOWN'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300'
                          }`}
                        >
                          {item.takedownStatus === 'TAKEN_DOWN' ? (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>পুনরায় চালু</span>
                            </>
                          ) : (
                            <>
                              <AlertOctagon className="w-3 h-3" />
                              <span>টেকডাউন</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Takedown Confirmation Modal */}
      {showTakedownModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                জরুরি টেকডাউন নোটিশ
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              আপনি কি নিশ্চিত যে <strong>&quot;{selectedRecord.magazine.title}&quot;</strong> প্রকাশনাটিকে পাবলিক
              এক্সেস থেকে সাময়িকভাবে প্রত্যাহার বা স্থগিত করতে চান?
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                টেকডাউনের কারণ বা আইনি কারণ
              </label>
              <textarea
                rows={3}
                value={takedownReason}
                onChange={(e) => setTakedownReason(e.target.value)}
                placeholder="যেমন: কপিরাইট অভিযোগ (DMCA notice) বা আদালতের নির্দেশনা..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowTakedownModal(false);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 text-xs font-semibold"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleConfirmTakedown}
                disabled={savingId === selectedRecord.id}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {savingId === selectedRecord.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <AlertOctagon className="w-3.5 h-3.5" />
                )}
                টেকডাউন কার্যকর করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
