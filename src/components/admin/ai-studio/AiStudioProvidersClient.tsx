'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Globe,
  Sliders,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface ProviderConfig {
  id: string;
  providerKey: string;
  name: string;
  apiEndpoint?: string | null;
  apiKey?: string | null;
  modelsSupported?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface AiStudioProvidersClientProps {
  initialProviders: ProviderConfig[];
}

export default function AiStudioProvidersClient({
  initialProviders,
}: AiStudioProvidersClientProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>(initialProviders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiEndpointInput, setApiEndpointInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/ai-studio/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      });
      if (res.ok) {
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/admin/ai-studio/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (res.ok) {
        setProviders((prev) =>
          prev.map((p) => ({ ...p, isDefault: p.id === id }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-studio/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          apiKey: apiKeyInput || undefined,
          apiEndpoint: apiEndpointInput || undefined,
        }),
      });
      if (res.ok) {
        setProviders((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  apiKey: apiKeyInput || p.apiKey,
                  apiEndpoint: apiEndpointInput || p.apiEndpoint,
                }
              : p
          )
        );
        setEditingId(null);
      } else {
        alert('কনফিগারেশন সংরক্ষণ করতে সমস্যা হয়েছে');
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
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Cpu className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                এআই প্রোভাইডার ও এলএলএম (LLM) মডেল সংযোগ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                MULTI-PROVIDER ENGINE
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              লোকাল আরএজি (Local Grounding), গুগল জেমিনাই (Gemini 1.5 Pro), ওপেনএআই (GPT-4o), অ্যানথ্রপিক (Claude) অথবা সেলফ-হোস্টেড ওলামা (Ollama) মডেলগুলোর মধ্যে সুইচ বা সংযোগ নিয়ন্ত্রণ করুন।
            </p>
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {providers.map((p) => {
          const supportedModels = p.modelsSupported
            ? JSON.parse(p.modelsSupported)
            : [];
          const isEditing = editingId === p.id;

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl bg-white dark:bg-stone-900 border transition-all flex flex-col justify-between ${
                p.isDefault
                  ? 'border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                  : 'border-stone-200 dark:border-stone-800 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-2 rounded-xl ${
                        p.isDefault
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <Server className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-mono text-stone-400">
                        {p.providerKey}
                      </span>
                    </div>
                  </div>

                  {/* Switch */}
                  <button
                    onClick={() => handleToggle(p.id, p.isActive)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                      p.isActive ? 'bg-blue-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {p.isDefault ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      ★ ডিফল্ট ইঞ্জিন
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(p.id)}
                      className="text-[10px] text-stone-500 hover:text-blue-600 font-semibold transition"
                    >
                      ডিফল্ট করুন
                    </button>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      p.isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    {p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>

                {/* Supported Models */}
                {supportedModels.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-400">
                      সমর্থিত মডেলসমূহ:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {supportedModels.map((m: string, mIdx: number) => (
                        <span
                          key={mIdx}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-mono"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* API Key details / edit mode */}
                {isEditing ? (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        API Key:
                      </label>
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-... বা এপিআই কী"
                        className="w-full p-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    {p.providerKey === 'OLLAMA' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                          Custom Endpoint:
                        </label>
                        <input
                          type="text"
                          value={apiEndpointInput}
                          onChange={(e) => setApiEndpointInput(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full p-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1"
                      >
                        {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showKey ? 'গোপন করুন' : 'দেখান'}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 rounded text-stone-500"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveConfig(p.id)}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold"
                        >
                          {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                    <span className="font-mono text-[11px]">
                      {p.apiKey ? '••••••••••••••••' : 'কোনো এপিআই কী সেট নেই'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setApiKeyInput(p.apiKey || '');
                        setApiEndpointInput(p.apiEndpoint || '');
                      }}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      কনফিগার
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

