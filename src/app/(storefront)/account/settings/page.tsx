'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthContext';
import {
  Settings,
  Shield,
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Camera,
  Trash2,
  UploadCloud,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function AccountSettingsPage() {
  const { user: authUser, syncUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY'>('PROFILE');

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [division, setDivision] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [email, setEmail] = useState('');

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Avatar State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityFeedback, setSecurityFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load fresh profile authoritative data directly from API on mount
  useEffect(() => {
    let isMounted = true;

    async function loadFreshProfile() {
      try {
        const res = await fetch('/api/account/profile');
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          if (u && isMounted) {
            setName(u.name || '');
            setUsername(u.username || '');
            setEmail(u.email || '');
            setPhone(u.phone || '');
            setBio(u.bio || '');
            setGender(u.gender || '');
            if (u.dateOfBirth) {
              const d = new Date(u.dateOfBirth);
              if (!isNaN(d.getTime())) {
                setDateOfBirth(d.toISOString().split('T')[0]);
              } else if (typeof u.dateOfBirth === 'string') {
                setDateOfBirth(u.dateOfBirth.split('T')[0]);
              }
            }
            setCountry(u.country || 'Bangladesh');
            setDivision(u.division || '');
            setCity(u.city || '');
            setArea(u.area || '');
            setPostalCode(u.postalCode || '');
            setFullAddress(u.fullAddress || '');
            setAvatarPreview(u.avatarUrl || null);
            setIsDataLoaded(true);
          }
        } else if (authUser && isMounted && !isDataLoaded) {
          // Fallback to authUser if API fetch returned 401/error
          populateFromUser(authUser);
          setIsDataLoaded(true);
        }
      } catch (err) {
        if (authUser && isMounted && !isDataLoaded) {
          populateFromUser(authUser);
          setIsDataLoaded(true);
        }
      }
    }

    function populateFromUser(u: any) {
      setName(u.name || '');
      setUsername(u.username || '');
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setBio(u.bio || '');
      setGender(u.gender || '');
      setCountry(u.country || 'Bangladesh');
      setDivision(u.division || '');
      setCity(u.city || '');
      setArea(u.area || '');
      setPostalCode(u.postalCode || '');
      setFullAddress(u.fullAddress || '');
      setAvatarPreview(u.avatarUrl || null);
    }

    loadFreshProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setAvatarFeedback({ type: 'error', msg: 'ছবির সাইজ সর্বোচ্চ ৪ মেগাবাইট (4MB) হতে পারবে।' });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarFeedback({ type: 'error', msg: 'শুধুমাত্র JPG, JPEG, PNG বা WebP ফরম্যাটের ছবি গ্রহণযোগ্য।' });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarFeedback(null);
  };

  // Upload Avatar to server
  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    setAvatarLoading(true);
    setAvatarFeedback(null);

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setAvatarFeedback({ type: 'success', msg: data.message || 'প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!' });
        setAvatarPreview(data.avatarUrl);
        syncUser({ avatarUrl: data.avatarUrl });
        setSelectedFile(null);
        refreshUser();
      } else {
        setAvatarFeedback({ type: 'error', msg: data.error || 'ছবি আপলোড করতে ব্যর্থ হয়েছে।' });
      }
    } catch (err) {
      setAvatarFeedback({ type: 'error', msg: 'সার্ভার যোগাযোগে সমস্যা হয়েছে।' });
    } finally {
      setAvatarLoading(false);
    }
  };

  // Remove Avatar
  const handleAvatarRemove = async () => {
    if (!avatarPreview && !authUser?.avatarUrl) return;
    if (!confirm('আপনি কি নিশ্চিত যে আপনার বর্তমান প্রোফাইল ছবিটি মুছে ফেলতে চান?')) return;

    setAvatarLoading(true);
    setAvatarFeedback(null);

    try {
      const res = await fetch('/api/account/avatar', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setAvatarFeedback({ type: 'success', msg: data.message || 'ছবি সফলভাবে মুছে ফেলা হয়েছে।' });
        setAvatarPreview(null);
        setSelectedFile(null);
        syncUser({ avatarUrl: null });
        refreshUser();
      } else {
        setAvatarFeedback({ type: 'error', msg: data.error || 'ছবি মুছতে ব্যর্থ হয়েছে।' });
      }
    } catch (err) {
      setAvatarFeedback({ type: 'error', msg: 'সার্ভারে সংযোগ করতে সমস্যা হয়েছে।' });
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle Profile Update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileFeedback({ type: 'error', msg: 'আপনার পূর্ণ নাম আবশ্যক।' });
      return;
    }

    setProfileLoading(true);
    setProfileFeedback(null);

    try {
      const payload = {
        name: name.trim(),
        username: username.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        country: country.trim() || 'Bangladesh',
        division: division.trim() || null,
        city: city.trim() || null,
        area: area.trim() || null,
        postalCode: postalCode.trim() || null,
        fullAddress: fullAddress.trim() || null,
      };

      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileFeedback({ type: 'success', msg: data.message || 'প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!' });
        if (data.user) {
          syncUser(data.user);
        }
        refreshUser();
        setTimeout(() => setProfileFeedback(null), 4000);
      } else {
        setProfileFeedback({ type: 'error', msg: data.error || 'আপডেট করতে ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setProfileFeedback({ type: 'error', msg: 'সার্ভারে সংযোগ করতে সমস্যা হয়েছে।' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Update
  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setSecurityFeedback({ type: 'error', msg: 'নতুন পাসওয়ার্ড দুটি হুবহু মিলছে না।' });
      return;
    }

    if (newPassword.length < 6) {
      setSecurityFeedback({ type: 'error', msg: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
      return;
    }

    if (newPassword === currentPassword) {
      setSecurityFeedback({ type: 'error', msg: 'নতুন পাসওয়ার্ড এবং বর্তমান পাসওয়ার্ড একই হতে পারবে না।' });
      return;
    }

    setSecurityLoading(true);
    setSecurityFeedback(null);

    try {
      const res = await fetch('/api/account/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setSecurityFeedback({ type: 'success', msg: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSecurityFeedback(null), 4000);
      } else {
        setSecurityFeedback({ type: 'error', msg: data.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setSecurityFeedback({ type: 'error', msg: 'সার্ভারে সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Title */}
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-shubban-gold" />
          <span>অ্যাকাউন্ট সেটিংস ও প্রোফাইল ব্যবস্থাপনা</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          আপনার ব্যক্তিগত প্রোফাইল তথ্য, ছবি, যোগাযোগ নম্বর ও পাসওয়ার্ড নিরাপত্তা পরিচালনা করুন।
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl w-fit text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'PROFILE'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>প্রোফাইল ও ছবি</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SECURITY')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'SECURITY'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>পাসওয়ার্ড ও নিরাপত্তা</span>
        </button>
      </div>

      {/* Profile & Avatar Tab */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          {/* Avatar Management Card */}
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-shubban-gold" />
              <span>প্রোফাইল ছবি (Avatar)</span>
            </h2>

            {avatarFeedback && (
              <div
                className={`p-3 rounded-xl mb-4 flex items-center gap-2 text-xs font-semibold ${
                  avatarFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {avatarFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{avatarFeedback.msg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-shubban-green text-shubban-gold font-serif font-bold text-3xl flex items-center justify-center border-2 border-shubban-gold shadow-md">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(name || authUser?.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              {/* Upload Controls & Guidelines */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarLoading}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-stone-500" />
                    <span>নতুন ছবি নির্বাচন করুন</span>
                  </button>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={avatarLoading}
                      className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold text-xs font-bold shadow flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {avatarLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>আপলোড হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>আপলোড নিশ্চিত করুন</span>
                        </>
                      )}
                    </button>
                  )}

                  {(avatarPreview || authUser?.avatarUrl) && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      disabled={avatarLoading}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ছবি মুছুন</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-stone-400">
                  সমর্থিত ফরম্যাট: JPG, JPEG, PNG, WebP। সর্বোচ্চ সাইজ: ৪ মেগাবাইট (4MB)।
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <User className="w-4 h-4 text-shubban-gold" />
              <span>ব্যক্তিগত ও যোগাযোগ তথ্য</span>
            </h2>

            <form onSubmit={handleProfileUpdate} className="space-y-5 text-xs">
              {profileFeedback && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 font-semibold ${
                    profileFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {profileFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileFeedback.msg}</span>
                </div>
              )}

              {/* Row 1: Full Name & Display Name (Username) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    পূর্ণ নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="উদাঃ মোঃ আব্দুল্লাহ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ডিসপ্লে নাম / ইউজারনেম (Display Name / Handle)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-mono">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1 flex items-center justify-between">
                    <span>ইমেইল ঠিকানা (Email Address)</span>
                    <span className="text-[10px] text-stone-400 font-normal">পরিবর্তনযোগ্য নয়</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email || authUser?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    মোবাইল নম্বর (Phone Number)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              {/* Row 3: Gender & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    লিঙ্গ (Gender)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="MALE">পুরুষ (Male)</option>
                    <option value="FEMALE">নারী (Female)</option>
                    <option value="OTHER">অন্যান্য (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    জন্ম তারিখ (Date of Birth)
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Country, Division, City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    দেশ (Country)
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Bangladesh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    বিভাগ (Division)
                  </label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="ঢাকা, চট্টগ্রাম..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    জেলা / শহর (City)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ঢাকা, সিলেট..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              {/* Row 5: Area & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    এলাকা / থানা (Area)
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="মিরপুর, উত্তরা..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    পোস্টাল কোড (Postal Code)
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="১২১৬"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  পূর্ণ ঠিকানা (Full Address / Delivery Details)
                </label>
                <input
                  type="text"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="বাড়ি নং, রোড নং, মহাল্লা বা ল্যান্ডমার্ক..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  সংক্ষিপ্ত পরিচিতি ও আগ্রহ (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="আপনার পাঠক পরিচিতি, মননশীল আগ্রহ বা পছন্দের বিষয় সংক্ষেপে লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold shadow disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {profileLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পরিবর্তন সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Lock className="w-4 h-4 text-shubban-gold" />
            <span>পাসওয়ার্ড পরিবর্তন ও অ্যাকাউন্ট নিরাপত্তা</span>
          </h2>

          <form onSubmit={handleSecurityUpdate} className="space-y-4 max-w-lg text-xs">
            {securityFeedback && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 font-semibold ${
                  securityFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {securityFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{securityFeedback.msg}</span>
              </div>
            )}

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                বর্তমান পাসওয়ার্ড *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                নতুন পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={securityLoading}
                className="px-6 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-gold font-bold shadow disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {securityLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>পরিবর্তন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-shubban-gold" />
                    <span>পাসওয়ার্ড হালনাগাদ করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
