'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Home,
  DollarSign,
  Package,
  Truck,
  TrendingUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Minus,
  Send,
  AlertCircle,
  Building,
  Star,
  Search,
  Filter,
  Edit,
  Trash2,
  Layers,
  FileText,
  Printer,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Receipt,
  User,
  Phone,
  MapPin,
  X,
  CreditCard,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { formatTaka, toBengaliNumber, formatBengaliDate } from '@/lib/utils';

export interface SubOrderData {
  id: string;
  subOrderNumber: string;
  subtotal: number;
  commissionAmt: number;
  payoutAmt: number;
  status: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    total: number;
  }>;
}

export interface ProductVariantData {
  id?: string;
  name: string;
  sku?: string | null;
  price: number;
  stockQuantity: number;
}

export interface ProductData {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  coverImage?: string | null;
  categoryName: string;
  categoryId: string;
  authorName: string;
  authorId: string;
  description?: string | null;
  isbn?: string | null;
  edition?: string | null;
  pageCount?: number | null;
  isPublished?: boolean;
  variants?: ProductVariantData[];
}

export interface PayoutData {
  id: string;
  payoutNumber: string;
  amount: number;
  method: string;
  accountDetails?: string;
  status: string;
  transactionRef?: string | null;
  requestedAt: string;
  notes?: string | null;
}

export interface LedgerEntryData {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface ReviewData {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customerName: string;
  bookTitle: string;
  bookSlug: string;
  bookImage?: string | null;
}

export interface SellerDashboardClientProps {
  vendor: {
    id: string;
    name: string;
    legalName?: string | null;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    email: string;
    phone: string;
    address: string;
    city: string;
    rating: number;
    ratingCount?: number;
    commissionRate?: number | null;
    isVerified?: boolean;
    status: string;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankRoutingNumber?: string | null;
    bkashMerchantNumber?: string | null;
  };
  isSuspended: boolean;
  initialSubOrders: SubOrderData[];
  initialProducts: ProductData[];
  initialPayouts: PayoutData[];
  initialLedger: LedgerEntryData[];
  initialReviews: ReviewData[];
  categories: Array<{ id: string; name: string; slug: string }>;
  authors: Array<{ id: string; name: string }>;
}

export default function SellerDashboardClient({
  vendor: initialVendor,
  isSuspended: initialIsSuspended,
  initialSubOrders,
  initialProducts,
  initialPayouts,
  initialLedger,
  initialReviews,
  categories,
  authors,
}: SellerDashboardClientProps) {
  const [vendor, setVendor] = useState(initialVendor);
  const [isSuspended, setIsSuspended] = useState(initialIsSuspended);

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'finance' | 'reviews' | 'settings'>('overview');
  const [subOrders, setSubOrders] = useState<SubOrderData[]>(initialSubOrders);
  const [products, setProducts] = useState<ProductData[]>(initialProducts);
  const [payouts, setPayouts] = useState<PayoutData[]>(initialPayouts);
  const [ledger, setLedger] = useState<LedgerEntryData[]>(initialLedger);
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('1000');
  const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Packing slip modal
  const [activeSlipOrder, setActiveSlipOrder] = useState<SubOrderData | null>(null);

  // Order status update state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [courierName, setCourierName] = useState('Pathao Courier');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Create Product Modal state
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    authorName: '',
    categoryId: categories[0]?.id || '',
    price: '',
    discountPrice: '',
    stockQuantity: '15',
    coverImage: '/placeholder.jpg',
    isbn: '',
    edition: '১ম সংস্করণ',
    pageCount: '',
    description: '',
  });

  // Edit Product Modal state
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [isSavingProductEdit, setIsSavingProductEdit] = useState(false);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: vendor.name || '',
    legalName: vendor.legalName || '',
    phone: vendor.phone || '',
    address: vendor.address || '',
    city: vendor.city || 'ঢাকা',
    description: vendor.description || '',
    logoUrl: vendor.logoUrl || '',
    bannerUrl: vendor.bannerUrl || '',
    bankName: vendor.bankName || 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি',
    bankAccountName: vendor.bankAccountName || '',
    bankAccountNumber: vendor.bankAccountNumber || '',
    bankRoutingNumber: vendor.bankRoutingNumber || '',
    bkashMerchantNumber: vendor.bkashMerchantNumber || '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Calculations
  const grossSales = subOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalCommission = subOrders.reduce((acc, o) => acc + o.commissionAmt, 0);
  const netEarnings = subOrders.reduce((acc, o) => acc + o.payoutAmt, 0);
  const pendingOrdersCount = subOrders.filter((o) => o.status === 'PROCESSING' || o.status === 'PACKED').length;
  const lowStockCount = products.filter((p) => p.stockQuantity <= 5).length;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Sub-Order Status Update Handler
  const handleUpdateSubOrderStatus = async (subOrderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/seller/orders/${subOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          courierName: courierName || 'Pathao Courier',
          trackingNumber: trackingNumber || `TRK-BD-${Date.now().toString().slice(-6)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'অর্ডার আপডেট ব্যর্থ হয়েছে।');

      setSubOrders(
        subOrders.map((o) =>
          o.id === subOrderId
            ? {
                ...o,
                status: newStatus,
                courierName: data.subOrder.courierName,
                trackingNumber: data.subOrder.trackingNumber,
              }
            : o
        )
      );
      setUpdatingOrderId(null);
      showNotification('সাব-অর্ডারের ডেলিভারি স্ট্যাটাস সফলভাবে হালনাগাদ করা হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  // Quick Stock Adjustment
  const handleStockChange = async (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stockQuantity + delta);

    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'স্টক আপডেট ব্যর্থ হয়েছে।');

      setProducts(products.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p)));
      showNotification(`“${prod.title}”-এর স্টক হালনাগাদ করা হয়েছে (${toBengaliNumber(newStock)} কপি)।`);
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  // Product Delete Handler
  const handleDeleteProduct = async (productId: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে “${title}” পণ্যটি মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'পণ্য মুছে ফেলতে সমস্যা হয়েছে।');

      setProducts(products.filter((p) => p.id !== productId));
      showNotification(`“${title}” সফলভাবে ক্যাটালগ থেকে মুছে ফেলা হয়েছে!`);
    } catch (e: any) {
      showNotification(e.message, 'error');
    }
  };

  // Create Product Submit Handler
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      alert('আপনার সেলার অ্যাকাউন্টটি স্থগিত রয়েছে। নতুন পণ্য যোগ করা সম্ভব নয়।');
      return;
    }
    setIsSubmittingProduct(true);

    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          discountPrice: newProduct.discountPrice ? parseFloat(newProduct.discountPrice) : null,
          stockQuantity: parseInt(newProduct.stockQuantity || '10', 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'পণ্য যোগ করতে সমস্যা হয়েছে।');

      const catName = categories.find((c) => c.id === newProduct.categoryId)?.name || 'বই';
      const createdItem: ProductData = {
        id: data.product.id,
        title: data.product.title,
        slug: data.product.slug,
        price: data.product.price,
        discountPrice: data.product.discountPrice,
        stockQuantity: data.product.stockQuantity,
        coverImage: data.product.coverImage,
        categoryName: catName,
        categoryId: data.product.categoryId,
        authorName: newProduct.authorName || 'সাধারণ লেখক',
        authorId: data.product.authorId,
        description: data.product.description,
        isbn: data.product.isbn,
        edition: data.product.edition,
        pageCount: data.product.pageCount,
        isPublished: true,
      };

      setProducts([createdItem, ...products]);
      setIsCreateProductModalOpen(false);
      setNewProduct({
        title: '',
        authorName: '',
        categoryId: categories[0]?.id || '',
        price: '',
        discountPrice: '',
        stockQuantity: '15',
        coverImage: '/placeholder.jpg',
        isbn: '',
        edition: '১ম সংস্করণ',
        pageCount: '',
        description: '',
      });
      showNotification('নতুন পণ্যটি সফলভাবে আপনার ক্যাটালগে তালিকাভুক্ত হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Save Product Edit
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSavingProductEdit(true);

    try {
      const res = await fetch(`/api/seller/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingProduct.title,
          price: editingProduct.price,
          discountPrice: editingProduct.discountPrice,
          stockQuantity: editingProduct.stockQuantity,
          coverImage: editingProduct.coverImage,
          description: editingProduct.description,
          isPublished: editingProduct.isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'পণ্য তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে।');

      setProducts(products.map((p) => (p.id === editingProduct.id ? editingProduct : p)));
      setEditingProduct(null);
      showNotification('পণ্যের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSavingProductEdit(false);
    }
  };

  // Payout Request Handler
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      alert('আপনার সেলার অ্যাকাউন্টটি স্থগিত রয়েছে। পেআউট আবেদন করা সম্ভব নয়।');
      return;
    }
    setIsSubmittingPayout(true);

    try {
      const res = await fetch('/api/seller/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          method: payoutMethod,
          notes: payoutNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'পেআউট অনুরোধে সমস্যা হয়েছে।');

      setPayouts([data.payout, ...payouts]);
      setIsPayoutModalOpen(false);
      showNotification('পেআউট উত্তোলনের আবেদন সফলভাবে পাঠানো হয়েছে!');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Settings Save Handler
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);

    try {
      const res = await fetch('/api/seller/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সেটিংস সেভ করতে ব্যর্থ।');

      setVendor(data.vendor);
      showNotification('দোকানের তথ্য ও ব্যাংকিং সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (e: any) {
      showNotification(e.message, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Filtered Orders
  const filteredOrders = subOrders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const matchesQuery =
      orderSearch === '' ||
      o.subOrderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    return (
      productSearch === '' ||
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.isbn && p.isbn.includes(productSearch))
    );
  });

  return (
    <div className="space-y-8 font-bengali">
      {/* Suspension Alert Banner */}
      {isSuspended && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="text-xs">
            <h4 className="font-bold text-sm">সতর্কবার্তা: আপনার বিক্রেতা অ্যাকাউন্ট স্থগিত (Suspended) রয়েছে</h4>
            <p className="mt-0.5">
              পলিসি লঙ্ঘন অথবা অসম্পূর্ণ তথ্যের কারণে শপটি বর্তমানে স্থগিত। আপনি অর্ডার ও আর্থিক তথ্য দেখতে পারবেন, তবে নতুন পণ্য যোগ ও পেআউট উত্তোলন সাময়িকভাবে নিষ্ক্রিয় করা হয়েছে। সমাধানের জন্য অ্যাডমিন সাপোর্টে যোগাযোগ করুন।
            </p>
          </div>
        </div>
      )}

      {/* Top Header & Store Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center font-serif font-bold text-xl">
              {vendor.logoUrl ? (
                <img src={vendor.logoUrl} alt={vendor.name} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <Store className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                  {vendor.name}
                </h1>
                {vendor.isVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ভেরিফায়েড বিক্রেতা</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                কমিশন হার: <strong className="text-shubban-green dark:text-shubban-gold font-mono">{vendor.commissionRate ?? 10}%</strong> • রেটিং: <strong className="text-amber-500 font-mono">★ {vendor.rating.toFixed(1)}</strong> ({toBengaliNumber(reviews.length)}টি রিভিউ)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Home className="w-3.5 h-3.5 text-shubban-green dark:text-shubban-gold" />
            <span>মূল ওয়েবসাইট</span>
          </Link>

          <Link
            href={`/sellers/${vendor.slug}`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>লাইভ স্টোরফ্রন্ট দেখুন</span>
          </Link>

          <button
            onClick={() => setIsCreateProductModalOpen(true)}
            disabled={isSuspended}
            className="px-4 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পণ্য যোগ করুন</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border transition-all ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 6 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-[11px] text-stone-400 block font-medium">মোট বিক্রিত মূল্য</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {formatTaka(grossSales)}
          </span>
          <span className="text-[10px] text-stone-400 block">গ্রস সেলস</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-[11px] text-stone-400 block font-medium">নেট বিক্রেতা আয়</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-shubban-green dark:text-shubban-gold">
            {formatTaka(netEarnings)}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium block">উত্তোলনযোগ্য</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-[11px] text-stone-400 block font-medium">প্ল্যাটফর্ম কমিশন</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-rose-600 font-mono">
            {formatTaka(totalCommission)}
          </span>
          <span className="text-[10px] text-stone-400 block">{vendor.commissionRate ?? 10}% হারে কর্তন</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-[11px] text-stone-400 block font-medium">পেন্ডিং অর্ডার</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-amber-600">
            {toBengaliNumber(pendingOrdersCount)}টি
          </span>
          <span className="text-[10px] text-stone-400 block">প্যাকিং ও শিপিং</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-[11px] text-stone-400 block font-medium">সক্রিয় পণ্য</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {toBengaliNumber(products.length)}টি
          </span>
          <span className="text-[10px] text-stone-400 block">
            {lowStockCount > 0 ? (
              <span className="text-red-500 font-bold">{toBengaliNumber(lowStockCount)}টি লো-স্টক</span>
            ) : (
              'পর্যাপ্ত স্টক'
            )}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-[11px] text-stone-400 block font-medium">গ্রাহক সন্তুষ্টি</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-amber-500 flex items-center gap-1 font-mono">
            ★ {vendor.rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-stone-400 block">{toBengaliNumber(reviews.length)}টি পর্যালোচনা</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 text-xs font-bold gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap px-1 ${
            activeTab === 'overview'
              ? 'border-shubban-green text-shubban-green dark:border-shubban-gold dark:text-shubban-gold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ওভারভিউ ও সারাংশ</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap px-1 ${
            activeTab === 'orders'
              ? 'border-shubban-green text-shubban-green dark:border-shubban-gold dark:text-shubban-gold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>অর্ডার ও শিপিং ({toBengaliNumber(subOrders.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap px-1 ${
            activeTab === 'products'
              ? 'border-shubban-green text-shubban-green dark:border-shubban-gold dark:text-shubban-gold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>পণ্য ও ইনভেন্টরি ({toBengaliNumber(products.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap px-1 ${
            activeTab === 'finance'
              ? 'border-shubban-green text-shubban-green dark:border-shubban-gold dark:text-shubban-gold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>আর্থিক লেজার ও পেআউট</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap px-1 ${
            activeTab === 'reviews'
              ? 'border-shubban-green text-shubban-green dark:border-shubban-gold dark:text-shubban-gold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>গ্রাহক রিভিউ ({toBengaliNumber(reviews.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3.5 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap px-1 ${
            activeTab === 'settings'
              ? 'border-shubban-green text-shubban-green dark:border-shubban-gold dark:text-shubban-gold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>দোকান সেটিংস ও ব্র্যান্ডিং</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions & Balance Card */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-shubban-green to-[#124236] text-shubban-ivory shadow-xl flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider block">
                  উত্তোলনযোগ্য ব্যালেন্স
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-bold text-shubban-gold">
                  {formatTaka(netEarnings)}
                </span>
                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-lg">
                  আপনার সফল ডেলিভারিকৃত সাব-অর্ডারের অর্থ স্বয়ংক্রিয়ভাবে ব্যালেন্সে জমা হয়েছে। সর্বনিম্ন ৫০০ টাকা হলে যে কোনো সময় পেআউট উত্তোলন রিকোয়েস্ট পাঠাতে পারেন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-6">
                <button
                  onClick={() => setIsPayoutModalOpen(true)}
                  disabled={isSuspended || netEarnings < 500}
                  className="px-5 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>পেআউট উত্তোলন রিকোয়েস্ট পাঠান</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-shubban-ivory font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>পেন্ডিং অর্ডার প্রসেস করুন</span>
                </button>
              </div>
            </div>

            {/* Store Snapshot Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-shubban-gold" />
                <span>দোকানের বিবরণ ও পরিচিতি</span>
              </h3>
              <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-400">
                <div className="flex justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                  <span>দোকানের নাম:</span>
                  <strong className="text-stone-900 dark:text-stone-100">{vendor.name}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                  <span>যোগাযোগ ফোন:</span>
                  <strong className="text-stone-900 dark:text-stone-100 font-mono">{vendor.phone}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                  <span>অফিস / ঠিকানা:</span>
                  <span className="text-stone-900 dark:text-stone-100 text-right truncate max-w-[160px]">
                    {vendor.address}, {vendor.city}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                  <span>মার্কেটপ্লেস স্ট্যাটাস:</span>
                  <span className={`font-bold ${isSuspended ? 'text-red-500' : 'text-emerald-600'}`}>
                    {isSuspended ? 'স্থগিত (Suspended)' : 'সক্রিয় ও সচল (Active)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>প্ল্যাটফর্ম কমিশন:</span>
                  <strong className="text-shubban-green dark:text-shubban-gold font-mono">{vendor.commissionRate ?? 10}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                সাম্প্রতিক সাব-অর্ডারসমূহ
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
              >
                <span>সকল অর্ডার দেখুন</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3">সাব-অর্ডার #</th>
                    <th className="p-3">আইটেম</th>
                    <th className="p-3">গ্রাহক</th>
                    <th className="p-3">মোট মূল্য</th>
                    <th className="p-3">প্রাপ্য নিট আয়</th>
                    <th className="p-3">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {subOrders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                        #{o.subOrderNumber}
                      </td>
                      <td className="p-3 text-stone-700 dark:text-stone-300">
                        {o.items.map((it, idx) => (
                          <span key={idx} className="block truncate max-w-xs font-medium">
                            {it.title} &times; {toBengaliNumber(it.quantity)}
                          </span>
                        ))}
                      </td>
                      <td className="p-3 text-stone-600 dark:text-stone-400">
                        {o.customerName || 'সম্মানিত গ্রাহক'}
                      </td>
                      <td className="p-3 font-bold">{formatTaka(o.subtotal)}</td>
                      <td className="p-3 font-bold text-shubban-green dark:text-shubban-gold">
                        {formatTaka(o.payoutAmt)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : o.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {o.status === 'PROCESSING' && 'প্রসেসিং'}
                          {o.status === 'PACKED' && 'প্যাকড'}
                          {o.status === 'SHIPPED' && 'শিপড'}
                          {o.status === 'DELIVERED' && 'ডেলিভার্ড'}
                          {o.status === 'CANCELLED' && 'বাতিল'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & SHIPPING */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Status Bar & Search Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {['ALL', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    orderStatusFilter === st
                      ? 'bg-shubban-green text-shubban-ivory dark:bg-shubban-gold dark:text-shubban-green-950 font-bold shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {st === 'ALL' && 'সকল'}
                  {st === 'PROCESSING' && 'প্রসেসিং'}
                  {st === 'PACKED' && 'প্যাকড'}
                  {st === 'SHIPPED' && 'শিপড'}
                  {st === 'DELIVERED' && 'ডেলিভার্ড'}
                  {st === 'CANCELLED' && 'বাতিল'}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="অর্ডার # বা গ্রাহকের নাম..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
          </div>

          {/* Sub-Orders Table */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3.5">সাব-অর্ডার নম্বর</th>
                    <th className="p-3.5">গ্রাহক ও শিপিং ঠিকানা</th>
                    <th className="p-3.5">আইটেম বিবরণ</th>
                    <th className="p-3.5">মূল্য ও কমিশন</th>
                    <th className="p-3.5">প্রাপ্য নেট আয়</th>
                    <th className="p-3.5">ডেলিভারি স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-stone-400">
                        কোনো অর্ডার পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                        <td className="p-3.5 font-bold font-mono text-stone-900 dark:text-stone-100">
                          #{o.subOrderNumber}
                          <span className="block text-[10px] text-stone-400 font-sans mt-0.5">
                            {formatBengaliDate(o.createdAt)}
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-sans">
                            {o.paymentMethod === 'COD' ? 'ক্যাশ অন ডেলিভারি' : 'অনলাইন পেমেন্ট'}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-700 dark:text-stone-300 max-w-xs">
                          <strong className="block text-stone-900 dark:text-stone-100">
                            {o.customerName || 'সম্মানিত গ্রাহক'}
                          </strong>
                          <span className="text-[10px] text-stone-500 font-mono block">
                            {o.customerPhone}
                          </span>
                          <span className="text-[10px] text-stone-400 block truncate">
                            {o.customerAddress}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-700 dark:text-stone-300">
                          {o.items.map((it, i) => (
                            <span key={i} className="block font-medium truncate max-w-xs">
                              {it.title} &times; {toBengaliNumber(it.quantity)} ({formatTaka(it.total)})
                            </span>
                          ))}
                        </td>
                        <td className="p-3.5">
                          <span className="block font-bold">{formatTaka(o.subtotal)}</span>
                          <span className="block text-[10px] text-red-500 font-mono">
                            -{formatTaka(o.commissionAmt)} (কমিশন)
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-shubban-green dark:text-shubban-gold font-mono text-sm">
                          {formatTaka(o.payoutAmt)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : o.status === 'SHIPPED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {o.status === 'PROCESSING' && 'প্রসেসিং'}
                            {o.status === 'PACKED' && 'প্যাকড'}
                            {o.status === 'SHIPPED' && 'শিপড'}
                            {o.status === 'DELIVERED' && 'ডেলিভার্ড'}
                            {o.status === 'CANCELLED' && 'বাতিল'}
                          </span>
                          {o.trackingNumber && (
                            <span className="block text-[10px] text-stone-400 font-mono mt-1">
                              {o.courierName}: {o.trackingNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {updatingOrderId === o.id ? (
                            <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl space-y-2 text-left min-w-[200px]">
                              <label className="text-[10px] font-bold block text-stone-600">কুরিয়ার পার্টনার:</label>
                              <select
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                className="w-full text-[11px] p-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900"
                              >
                                <option value="Pathao Courier">Pathao Courier</option>
                                <option value="Steadfast Courier">Steadfast Courier</option>
                                <option value="RedX Logistics">RedX Logistics</option>
                                <option value="eCourier">eCourier</option>
                                <option value="Sundarban Courier">সুন্দরবন কুরিয়ার</option>
                              </select>
                              <input
                                type="text"
                                placeholder="কুরিয়ার ট্র্যাকিং নম্বর *"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="w-full text-[11px] p-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-mono"
                              />
                              <div className="flex gap-1.5 pt-1">
                                <button
                                  onClick={() => handleUpdateSubOrderStatus(o.id, 'SHIPPED')}
                                  className="flex-1 py-1.5 bg-shubban-green text-shubban-ivory rounded-lg text-[10px] font-bold shadow"
                                >
                                  শিপ সম্পন্ন
                                </button>
                                <button
                                  onClick={() => setUpdatingOrderId(null)}
                                  className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-[10px]"
                                >
                                  বাতিল
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                              <button
                                onClick={() => setActiveSlipOrder(o)}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold text-[10px] flex items-center gap-1"
                                title="প্যাকিং স্লিপ দেখুন"
                              >
                                <Printer className="w-3 h-3" />
                                <span>স্লিপ</span>
                              </button>

                              {o.status === 'PROCESSING' && (
                                <button
                                  onClick={() => handleUpdateSubOrderStatus(o.id, 'PACKED')}
                                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px]"
                                >
                                  প্যাকড
                                </button>
                              )}

                              {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => {
                                    setUpdatingOrderId(o.id);
                                    setTrackingNumber(o.trackingNumber || '');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-[10px]"
                                >
                                  শিপিং তথ্য
                                </button>
                              )}

                              {o.status === 'SHIPPED' && (
                                <button
                                  onClick={() => handleUpdateSubOrderStatus(o.id, 'DELIVERED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px]"
                                >
                                  ডেলিভার্ড
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & INVENTORY */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="পণ্য বা বইয়ের নাম, ক্যাটাগরি বা ISBN..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>

            <button
              onClick={() => setIsCreateProductModalOpen(true)}
              disabled={isSuspended}
              className="px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বই / পণ্য যোগ করুন</span>
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3.5">পণ্য / বইয়ের বিবরণ</th>
                    <th className="p-3.5">ক্যাটাগরি</th>
                    <th className="p-3.5">লেখক</th>
                    <th className="p-3.5">মূল্য</th>
                    <th className="p-3.5 text-center">ইনভেন্টরি স্টক</th>
                    <th className="p-3.5 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-stone-400">
                        কোনো পণ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                              <img
                                src={p.coverImage || '/placeholder.jpg'}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <Link
                                href={`/books/${p.slug}`}
                                target="_blank"
                                className="font-serif font-bold text-stone-900 dark:text-stone-100 hover:text-shubban-gold block"
                              >
                                {p.title}
                              </Link>
                              {p.isbn && (
                                <span className="text-[10px] text-stone-400 font-mono block">
                                  ISBN: {p.isbn}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-stone-500">{p.categoryName}</td>
                        <td className="p-3.5 text-stone-600 dark:text-stone-400">{p.authorName}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-shubban-green dark:text-shubban-gold block">
                            {formatTaka(p.discountPrice || p.price)}
                          </span>
                          {p.discountPrice && (
                            <span className="text-[10px] text-stone-400 line-through">
                              {formatTaka(p.price)}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-2 border border-stone-200 dark:border-stone-700 rounded-lg p-1 bg-stone-50 dark:bg-stone-800">
                            <button
                              onClick={() => handleStockChange(p.id, -1)}
                              disabled={isSuspended}
                              className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded disabled:opacity-50"
                              title="১টি কমান"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              className={`font-mono font-bold px-2 text-xs ${
                                p.stockQuantity <= 5 ? 'text-red-600 font-black' : 'text-stone-900 dark:text-stone-100'
                              }`}
                            >
                              {toBengaliNumber(p.stockQuantity)}
                            </span>
                            <button
                              onClick={() => handleStockChange(p.id, 1)}
                              disabled={isSuspended}
                              className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded disabled:opacity-50"
                              title="১টি বাড়ান"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingProduct(p)}
                              disabled={isSuspended}
                              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 disabled:opacity-50"
                              title="পণ্য সম্পাদনা"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              disabled={isSuspended}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 disabled:opacity-50"
                              title="পণ্য মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TAB 4: FINANCE & PAYOUTS */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-shubban-green to-[#124236] text-shubban-ivory shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs text-stone-300 block">বর্তমান উত্তোলনযোগ্য নিট ব্যালেন্স</span>
              <span className="font-serif text-3xl sm:text-4xl font-bold text-shubban-gold">
                {formatTaka(netEarnings)}
              </span>
              <p className="text-[11px] text-stone-300">
                ব্যাংক বা বিকাশ মার্চেন্ট অ্যাকাউন্টে প্রতি কার্যদিবসে পেআউট ছাড় করা হয়।
              </p>
            </div>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              disabled={isSuspended || netEarnings < 500}
              className="px-6 py-3 rounded-2xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <DollarSign className="w-4 h-4" />
              <span>পেআউট উত্তোলনের আবেদন করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payout Requests History */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-shubban-gold" />
                <span>পেআউট উত্তোলনের ইতিহাস</span>
              </h3>
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-3">উত্তোলন #</th>
                      <th className="p-3">পরিমাণ</th>
                      <th className="p-3">মাধ্যম</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3 text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-stone-400">
                          এখনও কোনো উত্তোলনের ইতিহাস নেই।
                        </td>
                      </tr>
                    ) : (
                      payouts.map((po) => (
                        <tr key={po.id}>
                          <td className="p-3 font-mono font-bold">{po.payoutNumber}</td>
                          <td className="p-3 font-bold font-serif text-shubban-green dark:text-shubban-gold">
                            {formatTaka(po.amount)}
                          </td>
                          <td className="p-3 font-medium text-[11px]">{po.method}</td>
                          <td className="p-3 text-stone-400 text-[10px]">{formatBengaliDate(po.requestedAt)}</td>
                          <td className="p-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                po.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {po.status === 'PAID' ? 'পরিশোধিত' : 'অপেক্ষমাণ'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger Log */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-shubban-gold" />
                <span>আর্থিক লেজার ট্রানজেকশন লগ</span>
              </h3>
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-3">বিবরণ</th>
                      <th className="p-3">টাইপ</th>
                      <th className="p-3">পরিমাণ</th>
                      <th className="p-3 text-right">অবশিষ্ট ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-stone-400">
                          লেজারে কোনো এন্ট্রি নেই।
                        </td>
                      </tr>
                    ) : (
                      ledger.map((l) => (
                        <tr key={l.id}>
                          <td className="p-3">
                            <span className="font-medium text-stone-900 dark:text-stone-100 block">
                              {l.description}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-mono">
                              {formatBengaliDate(l.createdAt)}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[10px]">{l.type}</td>
                          <td
                            className={`p-3 font-bold font-serif ${
                              l.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {l.amount >= 0 ? `+${formatTaka(l.amount)}` : formatTaka(l.amount)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-stone-700 dark:text-stone-300">
                            {formatTaka(l.balanceAfter)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                গ্রাহক পর্যালোচনা ও রেটিং
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনার প্রকাশিত বই ও পণ্যে পাঠকদের মতামত
              </p>
            </div>
            <div className="text-right">
              <span className="font-serif text-3xl font-bold text-amber-500 font-mono">
                ★ {vendor.rating.toFixed(1)}
              </span>
              <span className="block text-[11px] text-stone-400">মোট {toBengaliNumber(reviews.length)}টি রিভিউ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-stone-400 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
                এখনও কোনো গ্রাহক রিভিউ জমা দেননি।
              </div>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500 font-mono text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400">{formatBengaliDate(r.createdAt)}</span>
                  </div>

                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">
                    “{r.comment || 'গ্রাহক কোনো মন্তব্য করেননি।' }”
                  </p>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800 dark:text-stone-200">{r.customerName}</span>
                    <Link
                      href={`/books/${r.bookSlug}`}
                      target="_blank"
                      className="text-stone-500 hover:text-shubban-gold text-[11px] truncate max-w-[200px]"
                    >
                      বই: {r.bookTitle}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: STORE SETTINGS & BRANDING */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                দোকানের পরিচিতি ও ব্র্যান্ডিং
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনার পাবলিক স্টোরফ্রন্টে প্রদর্শিত লোগো, ব্যানার ও বিবরণ সাজান।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  দোকানের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  আইনি বা প্রাতিষ্ঠানিক নাম
                </label>
                <input
                  type="text"
                  value={settingsForm.legalName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, legalName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  যোগাযোগ ফোন নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  শহর / জেলা
                </label>
                <input
                  type="text"
                  value={settingsForm.city}
                  onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  পূর্ণ ঠিকানা *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  দোকান সম্পর্কে বিবরণ (About Store)
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  লোগো ইমেজ URL
                </label>
                <input
                  type="text"
                  value={settingsForm.logoUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                  placeholder="/images/logo.png"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  স্টোর ব্যানার ইমেজ URL
                </label>
                <input
                  type="text"
                  value={settingsForm.bannerUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bannerUrl: e.target.value })}
                  placeholder="/images/banner.jpg"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bank & Payout Settings */}
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-shubban-gold" />
                <span>ব্যাংকিং ও পেআউট তথ্য</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনার বিক্রয়লব্ধ অর্থ ট্রান্সফার করার জন্য নির্ভুল ব্যাংক ও মোবাইল ফাইন্যান্সিয়াল তথ্য প্রদান করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  ব্যাংকের নাম
                </label>
                <input
                  type="text"
                  value={settingsForm.bankName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  অ্যাকাউন্টধারীর নাম
                </label>
                <input
                  type="text"
                  value={settingsForm.bankAccountName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankAccountName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  ব্যাংক অ্যাকাউন্ট নম্বর
                </label>
                <input
                  type="text"
                  value={settingsForm.bankAccountNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankAccountNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  রাউটিং নম্বর
                </label>
                <input
                  type="text"
                  value={settingsForm.bankRoutingNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankRoutingNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  বিকাশ মার্চেন্ট / পার্সোনাল নম্বর
                </label>
                <input
                  type="text"
                  value={settingsForm.bkashMerchantNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bkashMerchantNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                  placeholder="017xxxxxxxx"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow transition-all disabled:opacity-50"
              >
                {isSavingSettings ? 'সংরক্ষণ করা হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* CREATE PRODUCT MODAL */}
      {isCreateProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                নতুন পণ্য / বই যুক্ত করুন
              </h3>
              <button
                onClick={() => setIsCreateProductModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    বই বা পণ্যের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    placeholder="উদাঃ কুরআন মাজীদ সহজ সরল বাংলা অনুবাদ"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    লেখক / অনুবাদকের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.authorName}
                    onChange={(e) => setNewProduct({ ...newProduct, authorName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    placeholder="উদাঃ শাইখুল ইসলাম মুফতী তাকী উসমানী"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ক্যাটাগরি *
                  </label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    নিয়মিত মূল্য (টাকা) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ডিসকাউন্ট মূল্য (টাকা)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.discountPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, discountPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                    placeholder="420"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রারম্ভিক ইনভেন্টরি স্টক (কপি) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProduct.stockQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    কভার ইমেজ URL
                  </label>
                  <input
                    type="text"
                    value={newProduct.coverImage}
                    onChange={(e) => setNewProduct({ ...newProduct, coverImage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ISBN নম্বর
                  </label>
                  <input
                    type="text"
                    value={newProduct.isbn}
                    onChange={(e) => setNewProduct({ ...newProduct, isbn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                    placeholder="978-xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    সংস্করণ ও পৃষ্ঠা সংখ্যা
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProduct.edition}
                      onChange={(e) => setNewProduct({ ...newProduct, edition: e.target.value })}
                      className="w-1/2 p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                      placeholder="সংস্করণ"
                    />
                    <input
                      type="number"
                      value={newProduct.pageCount}
                      onChange={(e) => setNewProduct({ ...newProduct, pageCount: e.target.value })}
                      className="w-1/2 p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                      placeholder="পৃষ্ঠা"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    বইয়ের সংক্ষিপ্ত পরিচিতি
                  </label>
                  <textarea
                    rows={3}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    placeholder="বইটির বিষয়বস্তু, অধ্যায় ও পাঠকদের উপকারিতা সম্পর্কে লিখুন..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="flex-1 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmittingProduct ? 'সংরক্ষণ হচ্ছে...' : 'পণ্য ক্যাটালগে যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                পণ্য সম্পাদনা করুন
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  পণ্যের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    মূল্য (টাকা) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ডিসকাউন্ট মূল্য
                  </label>
                  <input
                    type="number"
                    value={editingProduct.discountPrice ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  ইনভেন্টরি স্টক (কপি)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.stockQuantity}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stockQuantity: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  কভার ইমেজ লিঙ্ক
                </label>
                <input
                  type="text"
                  value={editingProduct.coverImage || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, coverImage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingProductEdit}
                  className="flex-1 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSavingProductEdit ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKING SLIP MODAL */}
      {activeSlipOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-stone-900 font-sans space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="font-serif font-black text-xl tracking-tight text-shubban-green">
                  শুব্বান মার্কেটপ্লেস
                </span>
                <span className="block text-[11px] text-stone-500 uppercase tracking-wider font-bold">
                  ভেন্ডর প্যাকিং ও ডেলিভারি চালান (Packing Slip)
                </span>
              </div>
              <button
                onClick={() => setActiveSlipOrder(null)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">প্রেরক (বিক্রেতা):</span>
                <strong className="block text-stone-900">{vendor.name}</strong>
                <span className="block text-stone-600">{vendor.address}, {vendor.city}</span>
                <span className="block font-mono text-stone-600">{vendor.phone}</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">প্রাপক (গ্রাহক):</span>
                <strong className="block text-stone-900">{activeSlipOrder.customerName}</strong>
                <span className="block text-stone-600">{activeSlipOrder.customerAddress}</span>
                <span className="block font-mono text-stone-600">{activeSlipOrder.customerPhone}</span>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-[10px] uppercase border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">আইটেম</th>
                    <th className="p-2.5 text-center">পরিমাণ</th>
                    <th className="p-2.5 text-right">মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {activeSlipOrder.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-medium">{it.title}</td>
                      <td className="p-2.5 text-center font-mono">{toBengaliNumber(it.quantity)}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{formatTaka(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <span className="text-stone-500">পেমেন্ট মেথড:</span>
              <strong className="font-mono text-stone-900">
                {activeSlipOrder.paymentMethod === 'COD' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'প্রিপেইড (Online Paid)'}
              </strong>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-shubban-green text-shubban-ivory text-xs font-bold shadow flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
              <button
                onClick={() => setActiveSlipOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYOUT MODAL */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
              পেআউট উত্তোলনের আবেদন
            </h3>
            <p className="text-xs text-stone-500">
              উত্তোলনকৃত অর্থ আপনার নিবন্ধিত ব্যাংক বা বিকাশ মার্চেন্ট অ্যাকাউন্টে দ্রুত ট্রান্সফার করা হবে।
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  উত্তোলনের পরিমাণ (টাকা) *
                </label>
                <input
                  type="number"
                  min="500"
                  max={netEarnings}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs bg-stone-50 dark:bg-stone-800 font-mono"
                />
                <span className="text-[10px] text-stone-400">
                  সর্বনিম্ন উত্তোলন: ৫০০ টাকা • সর্বোচ্চ উত্তোলনযোগ্য: {formatTaka(netEarnings)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  উত্তোলন মাধ্যম *
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs bg-stone-50 dark:bg-stone-800"
                >
                  <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার ({vendor.bankName || 'ইসলামী ব্যাংক'})</option>
                  <option value="BKASH_MERCHANT">বিকাশ মার্চেন্ট অ্যাকাউন্ট</option>
                  <option value="NAGAD">নগদ অ্যাকাউন্ট</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  মন্তব্য বা বিশেষ নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs bg-stone-50 dark:bg-stone-800"
                  placeholder="উদাঃ দ্রুত প্রসেস করার অনুরোধ..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout || netEarnings < 500}
                  className="flex-1 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmittingPayout ? 'অনুরোধ যাচ্ছে...' : 'আবেদন নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
