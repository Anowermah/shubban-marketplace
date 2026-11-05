'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import type { IslamicAiSettings } from '@/lib/islamic-ai/types';

interface AiStudioSettingsClientProps {
  initialSettings: IslamicAiSettings;
}

export default function AiStudioSettingsClient({
  initialSettings,
}: AiStudioSettingsClientProps) {
  const [settings, setSettings] = useState<IslamicAiSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/islamic-ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('এআই স্টুডিও ও প্ল্যাটফর্ম গভর্ন্যান্স সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
        setSettings(data.settings);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (e) {
      alert('সার্ভার সংযোগ ত্রুটি');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Settings className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                সেন্ট্রাল এআই গভর্ন্যান্স ও নিরাপত্তা সেটিংস
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                SAFETY & GOVERNANCE
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              পাবলিক এআই এক্সেস কন্ট্রোল, দৈনিক কোটা সীমা, জিরো হ্যালুসিনেশন কঠোরতা ও মেইনটেন্যান্স মোড নীতিমালা।
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Access Controls */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <span>পাবলিক অ্যাক্সেস ও অ্যাক্সেসিবিলিটি</span>
            </h3>

            {/* Public AI Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <div>
                <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 block">
                  পাবলিক এআই সেবা সক্রিয়
                </span>
                <span className="text-[11px] text-stone-500">
                  সাধারণ ভিজিটরদের জন্য ওয়েবসাইট ইন্টারফেসে চ্যাটবট উন্মুক্ত রাখুন
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, publicAiEnabled: !settings.publicAiEnabled })}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  settings.publicAiEnabled ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Guest Access Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
              <div>
                <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 block">
                  লগইন ব্যতীত অতিথি অ্যাক্সেস
                </span>
                <span className="text-[11px] text-stone-500">
                  নিবন্ধন ছাড়াই নির্দিষ্ট সীমা পর্যন্ত প্রশ্ন করার অনুমতি প্রদান
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, guestAccessEnabled: !settings.guestAccessEnabled })}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  settings.guestAccessEnabled ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Strict Dalil-Only Guardrail */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 block">
                  কঠোর দলীল গার্ডরেইল (Zero Hallucination)
                </span>
                <span className="text-[11px] text-stone-500">
                  ডেটাবেজে সুনির্দিষ্ট কুরআন/সহীহ হাদিস না থাকলে কোনো উত্তর তৈরি করবে না
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, strictDalilOnly: !settings.strictDalilOnly })}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  settings.strictDalilOnly ? 'bg-emerald-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Card 2: Quota & Rate Limiting */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>দৈনিক কোটা ও হার নিয়ন্ত্রণ</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                অতিথিদের জন্য দৈনিক সর্বোচ্চ প্রশ্নসীমা:
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={settings.guestDailyLimit}
                onChange={(e) => setSettings({ ...settings, guestDailyLimit: parseInt(e.target.value, 10) || 1 })}
                className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                নিবন্ধিত ব্যবহারকারীদের দৈনিক প্রশ্নসীমা:
              </label>
              <input
                type="number"
                min={10}
                max={500}
                value={settings.registeredDailyLimit}
                onChange={(e) => setSettings({ ...settings, registeredDailyLimit: parseInt(e.target.value, 10) || 10 })}
                className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                মডেল টেম্পারেচার (রিসার্চে কম রাখা শ্রেয়):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="flex-1 accent-amber-600"
                />
                <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300 w-10 text-right">
                  {settings.temperature}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Maintenance Mode */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>মেইনটেন্যান্স মোড (Maintenance Mode)</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                চালু করলে সাময়িকভাবে সব পাবলিক এআই চ্যাট স্থগিত থাকবে এবং রক্ষণাবেক্ষণ বার্তা প্রদর্শিত হবে।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                settings.maintenanceMode ? 'bg-rose-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-md" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
              ব্যবহারকারীদের প্রদর্শিত রক্ষণাবেক্ষণ বার্তা:
            </label>
            <textarea
              rows={2}
              value={settings.maintenanceMessage}
              onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
              className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition active:scale-95"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>সেটিংস সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

