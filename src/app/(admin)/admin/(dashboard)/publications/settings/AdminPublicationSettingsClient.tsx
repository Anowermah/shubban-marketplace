'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Download,
  Lock,
  Eye,
  Activity,
  CheckCircle2,
  Sparkles,
  Save,
  Globe,
} from 'lucide-react';

interface AdminPublicationSettingsClientProps {
  initialSettings: Record<string, string>;
}

export default function AdminPublicationSettingsClient({
  initialSettings,
}: AdminPublicationSettingsClientProps) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    const current = settings[key] === 'true';
    handleChange(key, String(!current));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch('/api/publications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('প্রকাশনা সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ত্রুটি ঘটেছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>প্রকাশনা সিস্টেম ও নিরাপত্তা সেটিংস</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            ডিজিটাল প্রকাশনা, রিডার অ্যানালিটিক্স ও ডাউনলোড অ্যাক্সেস সংক্রান্ত বৈশ্বিক কনফিগারেশন
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Default Access & Permissions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>ডিফল্ট ডাউনলোড ও এক্সেস পলিসি (Default Permissions)</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                  সরাসরি ডাউনলোড অনুমোদন (Default Allow Download)
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  নতুন তৈরি করা সব পত্রিকা ও আর্টিকেলে ডিফল্টভাবে পিডিএফ ডাউনলোড সক্রিয় থাকবে কিনা
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('defaultAllowDownload')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.defaultAllowDownload === 'true' ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                  পড়া ও ডাউনলোডের জন্য লগইন আবশ্যক (Require Login)
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  সক্রিয় করলে শুধু সাইটে লগইন করা নিবন্ধিত সদস্যরা পিডিএফ পড়তে ও ডাউনলোড করতে পারবে
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('defaultRequireLogin')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.defaultRequireLogin === 'true' ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                  অনলাইন রিডার ভিউয়ার (Read Online By Default)
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  ব্রাউজারেই ফুলস্ক্রিন পিডিএফ পড়ার সুযোগ রাখা
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('defaultReadOnline')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.defaultReadOnline === 'true' ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Reader Analytics Engine Parameters */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <Activity className="w-4 h-4 text-amber-600" />
            <span>রিডার অ্যানালিটিক্স ও রিয়েল-টাইম ইঞ্জিন (Reader Analytics Engine)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                হার্টবিট ইন্টারভাল (সেকেন্ড)
              </label>
              <input
                type="number"
                value={settings.readerHeartbeatSeconds || '15'}
                onChange={(e) => handleChange('readerHeartbeatSeconds', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                কতক্ষণ পর পর ব্রাউজার থেকে পড়ার সেশন আপডেট পাঠানো হবে (ডিফল্ট: ১৫ সেকেন্ড)
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                সার্থক পাঠক সময় থ্রেশহোল্ড (সেকেন্ড)
              </label>
              <input
                type="number"
                value={settings.meaningfulReadSeconds || '30'}
                onChange={(e) => handleChange('meaningfulReadSeconds', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                কমপক্ষে কত সেকেন্ড পড়লে &quot;সার্থক পাঠক&quot; গণ্য হবে (ডিফল্ট: ৩০ সেকেন্ড)
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                ন্যূনতম দেখা পৃষ্ঠা সংখ্যা
              </label>
              <input
                type="number"
                value={settings.meaningfulPageCount || '3'}
                onChange={(e) => handleChange('meaningfulPageCount', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                কমপক্ষে কত পৃষ্ঠা উল্টালে পাঠক কাউন্ট বাড়বে (ডিফল্ট: ৩ পৃষ্ঠা)
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Watermark & Branding */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
          <h2 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>জলছাপ ও ব্র্যান্ডিং (Watermark & Branding)</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                  অনলাইন রিডারে জলছাপ প্রদর্শন (Watermark Enabled)
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  রিডারে পড়ার সময় হালকা ট্রান্সপারেন্ট ওয়াটারমার্ক টেক্সট প্রদর্শন
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('watermarkEnabled')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.watermarkEnabled === 'true' ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                জলছাপের লেখা (Watermark Text)
              </label>
              <input
                type="text"
                value={settings.watermarkText || ''}
                onChange={(e) => handleChange('watermarkText', e.target.value)}
                placeholder="যেমন: শুব্বান ডিজিটাল লাইব্রেরি"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সকল সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

