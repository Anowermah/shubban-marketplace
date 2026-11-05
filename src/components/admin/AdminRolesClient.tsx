'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Users,
  Settings,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export interface AdminRoleItem {
  role: string;
  name: string;
  description: string;
  level: number;
  userCount: number;
  permissions: string[];
  isProtected?: boolean;
}

export interface PermissionGroup {
  category: string;
  permissions: { key: string; label: string }[];
}

export default function AdminRolesClient({
  initialRoles,
  permissionGroups,
  operatorRole,
}: {
  initialRoles: AdminRoleItem[];
  permissionGroups: PermissionGroup[];
  operatorRole: string;
}) {
  const [roles, setRoles] = useState<AdminRoleItem[]>(initialRoles);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>(
    initialRoles[0]?.role || 'SUPER_ADMIN'
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    initialRoles[0]?.permissions || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [roleSearch, setRoleSearch] = useState('');

  const selectedRole = roles.find((r) => r.role === selectedRoleKey) || roles[0];
  const isSuper = operatorRole === 'SUPER_ADMIN';

  const handleSelectRole = (r: AdminRoleItem) => {
    setSelectedRoleKey(r.role);
    setSelectedPermissions(r.permissions);
    setFeedback(null);
  };

  const togglePermission = (key: string) => {
    if (selectedRole.isProtected) return;
    if (!isSuper) {
      setFeedback({
        type: 'error',
        message: 'শুধুমাত্র সুপার অ্যাডমিন পারমিশন সংশোধন করতে পারেন।',
      });
      return;
    }

    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSelectAllPermissions = () => {
    if (selectedRole.isProtected || !isSuper) return;
    const allKeys = permissionGroups.flatMap((g) => g.permissions.map((p) => p.key));
    setSelectedPermissions(Array.from(new Set(allKeys)));
  };

  const handleClearAllPermissions = () => {
    if (selectedRole.isProtected || !isSuper) return;
    setSelectedPermissions([]);
  };

  const handleResetDefaultPermissions = async () => {
    if (selectedRole.isProtected || !isSuper) return;
    if (!confirm(`আপনি কি নিশ্চিত যে "${selectedRole.name}" এর সকল অনুমতি ডিফল্ট সেটিংসে ফিরিয়ে নিতে চান?`)) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/roles?role=${selectedRoleKey}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSelectedPermissions(data.permissions || []);
        setRoles((prev) =>
          prev.map((r) =>
            r.role === selectedRoleKey ? { ...r, permissions: data.permissions || [] } : r
          )
        );
        setFeedback({
          type: 'success',
          message: data.message || 'ভূমিকার অনুমতি সফলভাবে রিসেট করা হয়েছে!',
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'রিসেট করতে ব্যর্থ হয়েছে।',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে ত্রুটি ঘটেছে।' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (selectedRole.isProtected) return;
    if (!isSuper) {
      setFeedback({
        type: 'error',
        message: 'শুধুমাত্র সুপার অ্যাডমিন পারমিশন সংশোধন করতে পারেন।',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRoleKey,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRoles((prev) =>
          prev.map((r) =>
            r.role === selectedRoleKey ? { ...r, permissions: selectedPermissions } : r
          )
        );
        setFeedback({
          type: 'success',
          message: data.message || 'অনুমতি সফলভাবে সংরক্ষণ করা হয়েছে!',
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'সংরক্ষণ ব্যর্থ হয়েছে।',
        });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'সার্ভারে সংযোগে ত্রুটি ঘটেছে।' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      r.role.toLowerCase().includes(roleSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-bengali">
      {/* Overview Header banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-shubban-gold" />
            <span>সিস্টেমের মোট ভূমিকা: {toBengaliNumber(roles.length)}টি</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            ভূমিকা নির্বাচন করে অনুমোদিত সুবিধাসমূহ পর্যালোচনা বা পরিবর্তন করুন।
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="রোল বা নাম খুঁজুন..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Roles List + Permissions Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Roles list */}
        <div className="lg:col-span-5 space-y-2">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2 px-1">
            ভূমিকা তালিকা (Role Selector)
          </span>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredRoles.map((r) => {
              const isSelected = r.role === selectedRoleKey;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white dark:bg-shubban-green dark:text-shubban-ivory border-stone-900 shadow-md scale-[1.01]'
                      : 'bg-white dark:bg-shubban-darkCard text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:border-shubban-gold/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs truncate max-w-[200px]">{r.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isSelected
                          ? 'bg-shubban-gold text-stone-950'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      স্তর {toBengaliNumber(r.level)}
                    </span>
                  </div>

                  <p
                    className={`text-[11px] line-clamp-1 mb-2 ${
                      isSelected ? 'text-stone-300 dark:text-stone-200/80' : 'text-stone-500'
                    }`}
                  >
                    {r.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono opacity-70">ROLE_{r.role}</span>
                    <span className="flex items-center gap-1 font-bold">
                      <Users className="w-3 h-3" />
                      <span>{toBengaliNumber(r.userCount)} জন ব্যবহারকারী</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix for selected role */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-6">
            {/* Header info for selected role */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                    {selectedRole.name}
                  </h3>
                  {selectedRole.isProtected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>সুরক্ষিত রোল</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">{selectedRole.description}</p>
              </div>

              <Link
                href={`/admin/users?role=${selectedRole.role}`}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>সংশ্লিষ্ট ইউজার ({toBengaliNumber(selectedRole.userCount)})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Quick Batch Permission Actions */}
            {!selectedRole.isProtected && isSuper && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 text-xs">
                <span className="font-semibold text-stone-600 dark:text-stone-300">
                  অনুমতি কুইক অ্যাকশন:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold transition-colors"
                  >
                    সকল নির্বাচন
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllPermissions}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition-colors"
                  >
                    সকল অনুমতি মুছুন
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaultPermissions}
                    className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold transition-colors"
                  >
                    ডিফল্ট রিস্টোর
                  </button>
                </div>
              </div>
            )}

            {/* Permission Groups */}
            <div className="space-y-5 max-h-[480px] overflow-y-auto pr-2">
              {permissionGroups.map((group) => (
                <div key={group.category} className="space-y-2.5">
                  <span className="text-[11px] font-bold text-shubban-gold uppercase tracking-wider block">
                    {group.category}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.permissions.map((perm) => {
                      const isGranted = selectedPermissions.includes(perm.key);
                      return (
                        <button
                          key={perm.key}
                          type="button"
                          onClick={() => togglePermission(perm.key)}
                          disabled={selectedRole.isProtected || !isSuper}
                          className={`p-2.5 rounded-xl border text-left text-xs flex items-start gap-2.5 transition-colors ${
                            isGranted
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                          } ${selectedRole.isProtected || !isSuper ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                              isGranted
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-stone-300 dark:border-stone-600'
                            }`}
                          >
                            {isGranted && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate">{perm.label}</span>
                            <span className="text-[9px] font-mono opacity-60 block">{perm.key}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with action buttons */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                মোট সক্রিয় অনুমতি:{' '}
                <strong className="text-stone-900 dark:text-stone-100">
                  {toBengaliNumber(selectedPermissions.length)}
                </strong>
              </span>

              {!selectedRole.isProtected && isSuper && (
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold text-xs shadow flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>অনুমতি হালনাগাদ সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

