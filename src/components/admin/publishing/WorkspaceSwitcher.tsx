'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ChevronDown,
  Search,
  Check,
  Plus,
  ExternalLink,
  Shield,
  Newspaper,
  Home,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface WorkspaceSwitcherProps {
  currentMagazineId?: string;
  currentMagazineTitle?: string;
  currentMagazineFrequency?: string;
}

export default function WorkspaceSwitcher({
  currentMagazineId,
  currentMagazineTitle,
  currentMagazineFrequency,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [magazines, setMagazines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && magazines.length === 0) {
      setLoading(true);
      fetch('/api/publishing/magazines')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setMagazines(data.magazines || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, magazines.length]);

  const filteredMagazines = magazines.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.publisher?.name && m.publisher.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative font-bengali">
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500 shadow-2xs transition group"
        title="অন্যান্য সাময়িকীর ওয়ার্কস্পেসে যান"
      >
        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
          <Newspaper className="w-3.5 h-3.5" />
        </div>
        <div className="text-left min-w-0 max-w-[180px] sm:max-w-xs">
          <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100 block truncate group-hover:text-amber-600 transition">
            {currentMagazineTitle || 'ওয়ার্কস্পেস নির্বাচন করুন'}
          </span>
          {currentMagazineFrequency && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold uppercase block">
              {currentMagazineFrequency}
            </span>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 transition flex-shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="p-3 border-b border-stone-100 dark:border-stone-800">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="সাময়িকী বা প্রকাশনী খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Magazines List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {loading ? (
                <div className="p-4 text-center text-xs text-stone-400">
                  ওয়ার্কস্পেস লোড হচ্ছে...
                </div>
              ) : filteredMagazines.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400">
                  কোনো সাময়িকী পাওয়া যায়নি
                </div>
              ) : (
                filteredMagazines.map((mag) => {
                  const isCurrent = mag.id === currentMagazineId;
                  return (
                    <button
                      key={mag.id}
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/admin/publishing/workspaces/${mag.id}`);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-2xl text-left text-xs transition ${isCurrent
                          ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold border border-amber-500/30'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {mag.coverImage ? (
                          <img
                            src={mag.coverImage}
                            alt=""
                            className="w-7 h-9 rounded object-cover flex-shrink-0 border border-stone-200 dark:border-stone-700"
                          />
                        ) : (
                          <div className="w-7 h-9 rounded bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <Newspaper className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold block truncate">
                            {mag.title}
                          </span>
                          <span className="text-[10px] text-stone-400 block truncate">
                            {mag.publisher?.name || 'স্বতন্ত্র প্রকাশনা'} • {mag.frequency}
                          </span>
                        </div>
                      </div>
                      {isCurrent && (
                        <Check className="w-4 h-4 text-amber-600 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Links Footer */}
            <div className="p-2 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-100 dark:border-stone-800 space-y-1">
              <Link
                href="/admin/publishing"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>সেন্ট্রাল প্রকাশনা কন্ট্রোল প্যানেল</span>
              </Link>
              <Link
                href="/admin/publishing/magazines/create"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন সাময়িকী ও ওয়ার্কস্পেস তৈরি করুন</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


