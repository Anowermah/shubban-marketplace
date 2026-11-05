'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  Home,
  Briefcase,
  X,
  Star,
} from 'lucide-react';

export interface UserAddress {
  id: string;
  title: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  zone: string;
  isDefault: boolean;
}

export default function AddressBookClient({ initialAddresses }: { initialAddresses: UserAddress[] }) {
  const [addresses, setAddresses] = useState<UserAddress[]>(initialAddresses);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('বাসার ঠিকানা');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('ঢাকা');
  const [zone, setZone] = useState('DHAKA_METRO');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const openNewModal = () => {
    setEditingId(null);
    setTitle('বাসার ঠিকানা');
    setName('');
    setPhone('');
    setAddress('');
    setCity('ঢাকা');
    setZone('DHAKA_METRO');
    setIsDefault(addresses.length === 0);
    setShowModal(true);
  };

  const openEditModal = (addr: UserAddress) => {
    setEditingId(addr.id);
    setTitle(addr.title);
    setName(addr.name);
    setPhone(addr.phone);
    setAddress(addr.address);
    setCity(addr.city);
    setZone(addr.zone);
    setIsDefault(addr.isDefault);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) return;

    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/account/addresses/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, name, phone, address, city, zone, isDefault }),
        });
        const data = await res.json();
        if (res.ok) {
          if (isDefault) {
            setAddresses(addresses.map((a) => (a.id === editingId ? data.address : { ...a, isDefault: false })));
          } else {
            setAddresses(addresses.map((a) => (a.id === editingId ? data.address : a)));
          }
          setShowModal(false);
          showBanner('ঠিকানা সফলভাবে আপডেট করা হয়েছে!');
        }
      } else {
        const res = await fetch('/api/account/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, name, phone, address, city, zone, isDefault }),
        });
        const data = await res.json();
        if (res.ok) {
          if (isDefault || addresses.length === 0) {
            setAddresses([data.address, ...addresses.map((a) => ({ ...a, isDefault: false }))]);
          } else {
            setAddresses([...addresses, data.address]);
          }
          setShowModal(false);
          showBanner('নতুন ঠিকানা সফলভাবে যুক্ত হয়েছে!');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই ঠিকানাটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAddresses(addresses.filter((a) => a.id !== id));
        showBanner('ঠিকানা মুছে ফেলা হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
        showBanner('ডিফল্ট ডেলিভারি ঠিকানা হিসেবে নির্ধারণ করা হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Top Action */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-stone-500">
          আপনার সংরক্ষিত ঠিকানাগুলো চেকআউটে ১-ক্লিকে নির্বাচন করতে পারবেন।
        </p>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ঠিকানা যোগ করুন</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      {addresses.length === 0 ? (
        <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-10 text-center text-xs text-stone-400 space-y-2">
          <MapPin className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="font-semibold text-stone-600 dark:text-stone-300">কোনো সংরক্ষিত ঠিকানা নেই</p>
          <p>সহজে বই ডেলিভারির জন্য আপনার বাসার বা অফিসের ঠিকানা যোগ করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all ${
                addr.isDefault
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-shubban-gold/70 shadow-sm'
                  : 'bg-white dark:bg-shubban-darkCard border-stone-200 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                    {addr.title.includes('অফিস') ? <Briefcase className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                  </div>
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                    {addr.title}
                  </span>
                </div>

                {addr.isDefault ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-shubban-gold/20 text-shubban-gold border border-shubban-gold/40 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-shubban-gold" />
                    <span>ডিফল্ট ঠিকানা</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[11px] text-stone-400 hover:text-shubban-gold font-medium"
                  >
                    ডিফল্ট করুন
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                <p className="font-bold text-stone-900 dark:text-stone-100">{addr.name}</p>
                <p className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{addr.phone}</span>
                </p>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
                  {addr.address}, {addr.city}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500">
                  {addr.zone === 'DHAKA_METRO' ? 'ঢাকা মেট্রো ডেলিভারি জোন' : 'ঢাকার বাইরে কুরিয়ার জোন'}
                </span>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3 text-xs">
                <button
                  onClick={() => openEditModal(addr)}
                  className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>সম্পাদনা</span>
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-stone-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছুন</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-shubban-gold" />
                <span>{editingId ? 'ঠিকানা সম্পাদনা' : 'নতুন ডেলিভারি ঠিকানা'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">ঠিকানার শিরোনাম</label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    <option value="বাসার ঠিকানা">বাসার ঠিকানা (Home)</option>
                    <option value="অফিসের ঠিকানা">অফিসের ঠিকানা (Office)</option>
                    <option value="অন্যান্য">অন্যান্য ঠিকানা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">প্রাপকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="পূর্ণ নাম"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">শহর / জেলা *</label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setCity(newCity);
                      setZone(newCity === 'ঢাকা' ? 'DHAKA_METRO' : 'OUTSIDE_DHAKA');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    <option value="ঢাকা">ঢাকা</option>
                    <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                    <option value="সিলেট">সিলেট</option>
                    <option value="রাজশাহী">রাজশাহী</option>
                    <option value="খুলনা">খুলনা</option>
                    <option value="বরিশাল">বরিশাল</option>
                    <option value="রংপুর">রংপুর</option>
                    <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                    <option value="অন্যান্য জেলা">অন্যান্য জেলা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">ডেলিভারি জোন</label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  >
                    <option value="DHAKA_METRO">ঢাকা মেট্রো (৳৬০)</option>
                    <option value="OUTSIDE_DHAKA">ঢাকার বাইরে (৳১১০)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">বিস্তারিত ডেলিভারি ঠিকানা *</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="বাড়ি/ফ্ল্যাট নম্বর, রোড নম্বর, এলাকা, পোস্ট কোড..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultAddress"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-shubban-green focus:ring-shubban-gold"
                />
                <label htmlFor="defaultAddress" className="text-stone-700 dark:text-stone-300 cursor-pointer">
                  এটিকে আমার ডিফল্ট ডেলিভারি ঠিকানা হিসেবে সংরক্ষণ করুন
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold shadow-sm disabled:opacity-50"
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'ঠিকানা সংরক্ষণ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

