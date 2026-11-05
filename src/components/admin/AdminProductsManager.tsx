'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import MediaPickerInput from '@/components/media/MediaPickerInput';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Minus,
  X,
  Save,
  Check,
  Eye,
  Store,
  Layers,
  Sparkles,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  Copy,
  LayoutGrid,
  List,
  RefreshCw,
  CheckSquare,
  Square,
  Flame,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface AdminProductItem {
  id: string;
  title: string;
  titleEn?: string | null;
  slug: string;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  coverImage: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  publisherId?: string | null;
  publisherName?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  isPhysicalAvailable: boolean;
  isDigitalAvailable: boolean;
  isFree: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isEditorsPick?: boolean;
  isbn?: string | null;
  edition?: string | null;
  pages?: number | null;
  bindingType?: string | null;
  variants?: Array<{
    id: string;
    name: string;
    sku?: string | null;
    price: number;
    stockQuantity: number;
  }>;
}

interface ManagerProps {
  initialProducts: AdminProductItem[];
  categories: Array<{ id: string; name: string; slug: string }>;
  authors: Array<{ id: string; name: string }>;
  publishers: Array<{ id: string; name: string }>;
  vendors: Array<{ id: string; name: string }>;
}

type SortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'stock_asc'
  | 'stock_desc'
  | 'title_asc';

export default function AdminProductsManager({
  initialProducts,
  categories,
  authors,
  publishers,
  vendors,
}: ManagerProps) {
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'adequate' | 'low' | 'out'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterFormat, setFilterFormat] = useState<'all' | 'physical' | 'digital' | 'featured' | 'bestseller' | 'discounted'>('all');

  // Sorting & Layout States
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Quick Inline Stock Editing State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<string>('');

  // Bulk Stock Modal State
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [bulkStockMode, setBulkStockMode] = useState<'add' | 'set'>('add');
  const [bulkStockAmount, setBulkStockAmount] = useState<string>('10');

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchOperating, setIsBatchOperating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    slug: '',
    price: '',
    discountPrice: '',
    stockQuantity: '10',
    categoryId: categories[0]?.id || '',
    authorId: authors[0]?.id || '',
    publisherId: publishers[0]?.id || '',
    vendorId: vendors[0]?.id || '',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    isbn: '',
    edition: '১ম সংস্করণ',
    pages: '250',
    bindingType: 'হার্ডকভার',
    isPhysicalAvailable: true,
    isDigitalAvailable: false,
    isFree: false,
    isFeatured: false,
    isBestSeller: false,
    isEditorsPick: false,
    variants: [] as Array<{ name: string; sku: string; price: string; stockQuantity: string }>,
  });

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<AdminProductItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ----------------------------------------------------
  // CATALOG KPI METRICS
  // ----------------------------------------------------
  const kpis = useMemo(() => {
    const total = products.length;
    const published = products.filter((p) => p.isPhysicalAvailable).length;
    const drafts = total - published;
    const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length;
    const vendorItems = products.filter((p) => Boolean(p.vendorId)).length;
    const digitalCount = products.filter((p) => p.isDigitalAvailable).length;
    const featuredCount = products.filter((p) => p.isFeatured).length;

    return { total, published, drafts, lowStock, outOfStock, vendorItems, digitalCount, featuredCount };
  }, [products]);

  // ----------------------------------------------------
  // FILTERING & SORTING LOGIC
  // ----------------------------------------------------
  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return products
      .filter((p) => {
        // Search
        if (searchLower) {
          const titleMatch = p.title.toLowerCase().includes(searchLower);
          const titleEnMatch = p.titleEn?.toLowerCase().includes(searchLower);
          const authorMatch = p.authorName.toLowerCase().includes(searchLower);
          const categoryMatch = p.categoryName.toLowerCase().includes(searchLower);
          const publisherMatch = p.publisherName?.toLowerCase().includes(searchLower);
          const vendorMatch = p.vendorName?.toLowerCase().includes(searchLower);
          const isbnMatch = p.isbn?.includes(searchLower);
          const slugMatch = p.slug.toLowerCase().includes(searchLower);

          if (!titleMatch && !titleEnMatch && !authorMatch && !categoryMatch && !publisherMatch && !vendorMatch && !isbnMatch && !slugMatch) {
            return false;
          }
        }

        // Category
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

        // Author
        if (selectedAuthor !== 'all' && p.authorId !== selectedAuthor) return false;

        // Vendor
        if (selectedVendor !== 'all') {
          if (selectedVendor === 'central' && p.vendorId) return false;
          if (selectedVendor !== 'central' && p.vendorId !== selectedVendor) return false;
        }

        // Publisher
        if (selectedPublisher !== 'all' && p.publisherId !== selectedPublisher) return false;

        // Stock
        if (filterStock === 'adequate' && p.stockQuantity <= 5) return false;
        if (filterStock === 'low' && (p.stockQuantity <= 0 || p.stockQuantity > 5)) return false;
        if (filterStock === 'out' && p.stockQuantity !== 0) return false;

        // Publish Status
        if (filterStatus === 'published' && !p.isPhysicalAvailable) return false;
        if (filterStatus === 'draft' && p.isPhysicalAvailable) return false;

        // Format & Feature Filter
        if (filterFormat === 'physical' && !p.isPhysicalAvailable) return false;
        if (filterFormat === 'digital' && !p.isDigitalAvailable) return false;
        if (filterFormat === 'featured' && !p.isFeatured) return false;
        if (filterFormat === 'bestseller' && !p.isBestSeller) return false;
        if (filterFormat === 'discounted' && (!p.discountPrice || p.discountPrice >= p.price)) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return (a.discountPrice || a.price) - (b.discountPrice || b.price);
          case 'price_desc':
            return (b.discountPrice || b.price) - (a.discountPrice || a.price);
          case 'stock_asc':
            return a.stockQuantity - b.stockQuantity;
          case 'stock_desc':
            return b.stockQuantity - a.stockQuantity;
          case 'title_asc':
            return a.title.localeCompare(b.title, 'bn');
          case 'oldest':
            return a.id.localeCompare(b.id);
          case 'newest':
          default:
            return b.id.localeCompare(a.id);
        }
      });
  }, [
    products,
    search,
    selectedCategory,
    selectedAuthor,
    selectedVendor,
    selectedPublisher,
    filterStock,
    filterStatus,
    filterFormat,
    sortBy,
  ]);

  // Has any active filter?
  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedAuthor !== 'all' ||
    selectedVendor !== 'all' ||
    selectedPublisher !== 'all' ||
    filterStock !== 'all' ||
    filterStatus !== 'all' ||
    filterFormat !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedAuthor('all');
    setSelectedVendor('all');
    setSelectedPublisher('all');
    setFilterStock('all');
    setFilterStatus('all');
    setFilterFormat('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // ----------------------------------------------------
  // PAGINATION CALCULATIONS
  // ----------------------------------------------------
  const totalItems = filtered.length;
  const isAllPages = itemsPerPage >= 9999;
  const effectiveItemsPerPage = isAllPages ? Math.max(1, totalItems) : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectiveItemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * effectiveItemsPerPage;
  const endIndex = isAllPages ? totalItems : Math.min(startIndex + effectiveItemsPerPage, totalItems);
  const paginatedItems = filtered.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }
  };

  // ----------------------------------------------------
  // MULTI-SELECTION HANDLERS
  // ----------------------------------------------------
  const isAllCurrentPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((p) => selectedIds.has(p.id));

  const handleToggleSelectAllCurrentPage = () => {
    const next = new Set(selectedIds);
    if (isAllCurrentPageSelected) {
      paginatedItems.forEach((p) => next.delete(p.id));
    } else {
      paginatedItems.forEach((p) => next.add(p.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectProduct = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // ----------------------------------------------------
  // BATCH ACTIONS VIA API
  // ----------------------------------------------------
  const executeBatchAction = async (action: string, value?: any) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBatchOperating(true);
    try {
      const res = await fetch('/api/admin/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIds: ids, value }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'বাল্ক অপারেশন ব্যর্থ হয়েছে।');
      }

      // Optimistically update local state
      setProducts((prev) =>
        prev.map((item) => {
          if (!ids.includes(item.id)) return item;

          switch (action) {
            case 'publish':
              return { ...item, isPhysicalAvailable: true };
            case 'draft':
              return { ...item, isPhysicalAvailable: false };
            case 'feature':
              return { ...item, isFeatured: true };
            case 'unfeature':
              return { ...item, isFeatured: false };
            case 'bestseller':
              return { ...item, isBestSeller: true };
            case 'unbestseller':
              return { ...item, isBestSeller: false };
            case 'stock_add':
              return { ...item, stockQuantity: Math.max(0, item.stockQuantity + parseInt(value, 10)) };
            case 'stock_set':
              return { ...item, stockQuantity: Math.max(0, parseInt(value, 10)) };
            default:
              return item;
          }
        }).filter((item) => action !== 'delete' || !ids.includes(item.id))
      );

      showToast('success', data.message || 'বাল্ক আপডেট সম্পন্ন হয়েছে!');
      handleClearSelection();
      setIsBulkStockModalOpen(false);
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      showToast('error', err.message || 'বাল্ক অ্যাকশনে ত্রুটি ঘটেছে।');
    } finally {
      setIsBatchOperating(false);
    }
  };

  // ----------------------------------------------------
  // SINGLE INLINE TOGGLE ACTIONS
  // ----------------------------------------------------
  const handleTogglePublish = async (p: AdminProductItem) => {
    const nextState = !p.isPhysicalAvailable;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPhysicalAvailable: nextState }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, isPhysicalAvailable: nextState } : item)));
        showToast('success', `“${p.title}” ${nextState ? 'প্রকাশিত (Live)' : 'অপ্রকাশিত (Draft)'} করা হয়েছে।`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFeature = async (p: AdminProductItem) => {
    const nextFeatured = !p.isFeatured;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, isFeatured: nextFeatured } : item)));
        showToast('success', `“${p.title}” ${nextFeatured ? 'ফিচার্ড তালিকায় যুক্ত' : 'ফিচার্ড থেকে বাদ'} হয়েছে।`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleBestSeller = async (p: AdminProductItem) => {
    const nextBest = !p.isBestSeller;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBestSeller: nextBest }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, isBestSeller: nextBest } : item)));
        showToast('success', `“${p.title}” বেস্টসেলার স্ট্যাটাস ${nextBest ? 'সক্রিয়' : 'নিষ্ক্রিয়'} হয়েছে।`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Stock Adjustment (+ / -)
  const handleQuickStock = async (id: string, delta: number) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const newStock = Math.max(0, target.stockQuantity + delta);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockQuantity: newStock } : p)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inline Direct Stock Edit
  const handleSaveInlineStock = async (id: string) => {
    const parsed = parseInt(editingStockValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setEditingStockId(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: parsed }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockQuantity: parsed } : p)));
        showToast('success', 'স্টক সফলভাবে হালনাগাদ হয়েছে!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditingStockId(null);
    }
  };

  // ----------------------------------------------------
  // CLONE / DUPLICATE PRODUCT
  // ----------------------------------------------------
  const handleCloneProduct = (p: AdminProductItem) => {
    setEditingProduct(null);
    setFormData({
      title: `${p.title} (কপি)`,
      titleEn: p.titleEn ? `${p.titleEn} (Copy)` : '',
      slug: `${p.slug}-copy-${Date.now().toString().slice(-4)}`,
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      stockQuantity: String(p.stockQuantity),
      categoryId: p.categoryId,
      authorId: p.authorId,
      publisherId: p.publisherId || '',
      vendorId: p.vendorId || '',
      coverImage: p.coverImage,
      isbn: '',
      edition: p.edition || '১ম সংস্করণ',
      pages: p.pages ? String(p.pages) : '200',
      bindingType: p.bindingType || 'হার্ডকভার',
      isPhysicalAvailable: p.isPhysicalAvailable,
      isDigitalAvailable: p.isDigitalAvailable,
      isFree: p.isFree,
      isFeatured: false,
      isBestSeller: false,
      isEditorsPick: false,
      variants: (p.variants || []).map((v) => ({
        name: v.name,
        sku: v.sku ? `${v.sku}-CP` : '',
        price: String(v.price),
        stockQuantity: String(v.stockQuantity),
      })),
    });
    setIsModalOpen(true);
  };

  // ----------------------------------------------------
  // CREATE & EDIT MODAL HANDLERS
  // ----------------------------------------------------
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      titleEn: '',
      slug: '',
      price: '',
      discountPrice: '',
      stockQuantity: '15',
      categoryId: categories[0]?.id || '',
      authorId: authors[0]?.id || '',
      publisherId: publishers[0]?.id || '',
      vendorId: vendors[0]?.id || '',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
      isbn: '',
      edition: '১ম সংস্করণ',
      pages: '250',
      bindingType: 'হার্ডকভার',
      isPhysicalAvailable: true,
      isDigitalAvailable: false,
      isFree: false,
      isFeatured: false,
      isBestSeller: false,
      isEditorsPick: false,
      variants: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: AdminProductItem) => {
    setEditingProduct(p);
    setFormData({
      title: p.title,
      titleEn: p.titleEn || '',
      slug: p.slug,
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      stockQuantity: String(p.stockQuantity),
      categoryId: p.categoryId,
      authorId: p.authorId,
      publisherId: p.publisherId || '',
      vendorId: p.vendorId || '',
      coverImage: p.coverImage,
      isbn: p.isbn || '',
      edition: p.edition || '১ম সংস্করণ',
      pages: p.pages ? String(p.pages) : '250',
      bindingType: p.bindingType || 'হার্ডকভার',
      isPhysicalAvailable: p.isPhysicalAvailable,
      isDigitalAvailable: p.isDigitalAvailable,
      isFree: p.isFree,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isEditorsPick: p.isEditorsPick || false,
      variants: (p.variants || []).map((v) => ({
        name: v.name,
        sku: v.sku || '',
        price: String(v.price),
        stockQuantity: String(v.stockQuantity),
      })),
    });
    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          name: '',
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          price: formData.price || '500',
          stockQuantity: '10',
        },
      ],
    });
  };

  const handleRemoveVariantRow = (idx: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== idx),
    });
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        titleEn: formData.titleEn.trim() || null,
        slug: formData.slug.trim() || undefined,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        categoryId: formData.categoryId,
        authorId: formData.authorId,
        publisherId: formData.publisherId || null,
        vendorId: formData.vendorId || null,
        coverImage: formData.coverImage.trim(),
        isbn: formData.isbn.trim() || null,
        edition: formData.edition.trim() || null,
        pages: formData.pages ? parseInt(formData.pages, 10) : null,
        bindingType: formData.bindingType,
        isPhysicalAvailable: formData.isPhysicalAvailable,
        isDigitalAvailable: formData.isDigitalAvailable,
        isFree: formData.isFree,
        isFeatured: formData.isFeatured,
        isBestSeller: formData.isBestSeller,
        isEditorsPick: formData.isEditorsPick,
        variants: formData.variants
          .filter((v) => v.name.trim() !== '')
          .map((v) => ({
            name: v.name.trim(),
            sku: v.sku.trim() || undefined,
            price: parseFloat(v.price) || parseFloat(formData.price),
            stockQuantity: parseInt(v.stockQuantity, 10) || 0,
          })),
      };

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
      }

      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                ...p,
                ...data.product,
                authorName: authors.find((a) => a.id === data.product.authorId)?.name || p.authorName,
                categoryName: categories.find((c) => c.id === data.product.categoryId)?.name || p.categoryName,
                publisherName: publishers.find((pub) => pub.id === data.product.publisherId)?.name || p.publisherName,
                vendorName: vendors.find((v) => v.id === data.product.vendorId)?.name || p.vendorName,
              }
              : p
          )
        );
        showToast('success', `“${data.product.title}” সফলভাবে আপডেট হয়েছে!`);
      } else {
        const fullItem: AdminProductItem = {
          ...data.product,
          authorName: authors.find((a) => a.id === data.product.authorId)?.name || 'লেখক',
          categoryName: categories.find((c) => c.id === data.product.categoryId)?.name || 'বিভাগ',
          publisherName: publishers.find((pub) => pub.id === data.product.publisherId)?.name || null,
          vendorName: vendors.find((v) => v.id === data.product.vendorId)?.name || null,
        };
        setProducts([fullItem, ...products]);
        showToast('success', `নতুন পণ্য “${data.product.title}” ক্যাটালগে সফলভাবে যুক্ত হয়েছে!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', err.message || 'ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Single Product Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        showToast('success', data.message || 'পণ্য সফলভাবে অপসারিত বা আর্কাইভ করা হয়েছে।');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteTarget(null);
    }
  };

  // ----------------------------------------------------
  // CSV EXPORT GENERATOR (UTF-8 with BOM for Excel)
  // ----------------------------------------------------
  const handleExportCSV = () => {
    const headers = [
      'আইডি (ID)',
      'শিরোনাম (Title)',
      'ইংরেজি শিরোনাম (Title EN)',
      'লেখক (Author)',
      'বিভাগ (Category)',
      'প্রকাশক (Publisher)',
      'বিক্রেতা (Vendor)',
      'মূল্য (Price)',
      'ছাড়ের মূল্য (Discount Price)',
      'স্টক সংখ্যা (Stock)',
      'আইএসবিএন (ISBN)',
      'স্ট্যাটাস (Status)',
      'ফিচার্ড (Featured)',
      'বেস্টসেলার (Best Seller)',
    ];

    const rows = filtered.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${(p.titleEn || '').replace(/"/g, '""')}"`,
      `"${p.authorName.replace(/"/g, '""')}"`,
      `"${p.categoryName.replace(/"/g, '""')}"`,
      `"${(p.publisherName || '').replace(/"/g, '""')}"`,
      `"${(p.vendorName || 'শুব্বান সেন্ট্রাল').replace(/"/g, '""')}"`,
      p.price,
      p.discountPrice || '',
      p.stockQuantity,
      p.isbn || '',
      p.isPhysicalAvailable ? 'প্রকাশিত (Live)' : 'ড্রাফট (Draft)',
      p.isFeatured ? 'হ্যাঁ' : 'না',
      p.isBestSeller ? 'হ্যাঁ' : 'না',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shubban-products-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `${toBengaliNumber(filtered.length)}টি পণ্যের CSV সফলভাবে ডাউনলোড হয়েছে!`);
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* 1. Header with Title and Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-shubban-gold" />
            <span>পণ্য ও ক্যাটালগ সেন্ট্রাল কন্ট্রোল (Product Management)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মোট {toBengaliNumber(products.length)}টি বই ও পণ্য ক্যাটালগে তালিকাভুক্ত। মূল্য, রিয়েল-টাইম ইনভেন্টরি, বাল্ক অ্যাকশন ও পেজিনেশন নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            title="বর্তমান ফিল্টারকৃত পণ্য CSV হিসেবে ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5 text-shubban-gold" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          {/* Print Catalog */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition hidden sm:inline-flex"
            title="ক্যাটালগ তালিকা প্রিন্ট করুন"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>প্রিন্ট</span>
          </button>

          {/* Create Product Button */}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পণ্য যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* 2. Global Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-sm animate-fadeIn ${feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Catalog KPI Metrics Strip (Click-to-Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => {
            handleResetFilters();
          }}
          className={`p-3 rounded-2xl border text-left transition-all shadow-xs ${!hasActiveFilters
              ? 'bg-shubban-gold/15 border-shubban-gold/40 text-stone-900 dark:text-stone-100 ring-2 ring-shubban-gold/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
            }`}
        >
          <span className="text-[11px] text-stone-500 block">মোট পণ্য</span>
          <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {toBengaliNumber(kpis.total)}
          </span>
        </button>

        <button
          onClick={() => {
            setFilterStatus('published');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all shadow-xs ${filterStatus === 'published'
              ? 'bg-emerald-500/15 border-emerald-500/40 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
            }`}
        >
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">
            সরাসরি লাইভ (Live)
          </span>
          <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            {toBengaliNumber(kpis.published)}
          </span>
        </button>

        <button
          onClick={() => {
            setFilterStatus('draft');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all shadow-xs ${filterStatus === 'draft'
              ? 'bg-stone-200/50 dark:bg-stone-800 border-stone-400 ring-2 ring-stone-400/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
        >
          <span className="text-[11px] text-stone-500 block">ড্রাফট / অপ্রকাশিত</span>
          <span className="text-xl font-bold font-mono text-stone-600 dark:text-stone-300">
            {toBengaliNumber(kpis.drafts)}
          </span>
        </button>

        <button
          onClick={() => {
            setFilterStock('low');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all shadow-xs ${filterStock === 'low'
              ? 'bg-amber-500/15 border-amber-500/40 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300'
            }`}
        >
          <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>স্বল্প স্টক (&le; ৫)</span>
          </span>
          <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
            {toBengaliNumber(kpis.lowStock)}
          </span>
        </button>

        <button
          onClick={() => {
            setFilterStock('out');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all shadow-xs ${filterStock === 'out'
              ? 'bg-rose-500/15 border-rose-500/40 ring-2 ring-rose-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-rose-300'
            }`}
        >
          <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>স্টক শূন্য (০)</span>
          </span>
          <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
            {toBengaliNumber(kpis.outOfStock)}
          </span>
        </button>

        <button
          onClick={() => {
            setFilterFormat('featured');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all shadow-xs ${filterFormat === 'featured'
              ? 'bg-purple-500/15 border-purple-500/40 ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-purple-300'
            }`}
        >
          <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-semibold flex items-center gap-1">
            <Star className="w-3 h-3" />
            <span>ফিচার্ড বই</span>
          </span>
          <span className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300">
            {toBengaliNumber(kpis.featuredCount)}
          </span>
        </button>
      </div>

      {/* 4. Search, Filter, Sort & View Controls Bar */}
      <div className="p-4 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        {/* Row 1: Search & Core Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="শিরোনাম, ইংরেজি নাম, লেখক, প্রকাশক, আইএসবিএন বা বিক্রেতা দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold text-stone-900 dark:text-stone-100"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-3 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 w-full md:w-44 focus:outline-none font-medium"
          >
            <option value="all">সকল বিভাগ (All Categories)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={(e) => {
              setSelectedAuthor(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 w-full md:w-40 focus:outline-none font-medium"
          >
            <option value="all">সকল লেখক (Authors)</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Vendor Filter */}
          <select
            value={selectedVendor}
            onChange={(e) => {
              setSelectedVendor(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 w-full md:w-40 focus:outline-none font-medium"
          >
            <option value="all">সকল বিক্রেতা / স্টোর</option>
            <option value="central">শুব্বান সেন্ট্রাল হাব</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Secondary Filters, Sorting & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Stock Filter */}
            <select
              value={filterStock}
              onChange={(e) => {
                setFilterStock(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none text-[11px]"
            >
              <option value="all">সব স্টক লেভেল</option>
              <option value="adequate">পর্যাপ্ত স্টক (&gt; ৫)</option>
              <option value="low">স্বল্প স্টক (&le; ৫)</option>
              <option value="out">স্টক শেষ (০)</option>
            </select>

            {/* Publication Status */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none text-[11px]"
            >
              <option value="all">সকল পাবলিকেশন স্ট্যাটাস</option>
              <option value="published">শুধুমাত্র প্রকাশিত (Live)</option>
              <option value="draft">শুধুমাত্র ড্রাফট (Draft)</option>
            </select>

            {/* Format / Type */}
            <select
              value={filterFormat}
              onChange={(e) => {
                setFilterFormat(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none text-[11px]"
            >
              <option value="all">সকল সংস্করণ ও ফিচার</option>
              <option value="physical">প্রিন্ট / হার্ডকভার কপি</option>
              <option value="digital">ডিজিটাল / ই-বুক</option>
              <option value="featured">ফিচার্ড বই</option>
              <option value="bestseller">বেস্টসেলার বই</option>
              <option value="discounted">ছাড়যুক্ত বই</option>
            </select>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1 hover:bg-rose-100 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>ফিল্টার রিসেট</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none text-[11px] font-semibold"
              >
                <option value="newest">নতুনতম আগে (Newest)</option>
                <option value="oldest">পুরাতন আগে (Oldest)</option>
                <option value="price_asc">মূল্য: কম থেকে বেশি</option>
                <option value="price_desc">মূল্য: বেশি থেকে কম</option>
                <option value="stock_asc">স্টক: কম থেকে বেশি (জরুরি)</option>
                <option value="stock_desc">স্টক: বেশি থেকে কম</option>
                <option value="title_asc">নামানুসারে (A-Z / অ-ঔ)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg p-0.5 bg-stone-50 dark:bg-stone-900">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table'
                    ? 'bg-white dark:bg-stone-800 text-shubban-primary dark:text-shubban-gold shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                  }`}
                title="টেবিল ভিউ"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid'
                    ? 'bg-white dark:bg-stone-800 text-shubban-primary dark:text-shubban-gold shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                  }`}
                title="গ্রিড কার্ড ভিউ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Product Content (Table or Grid View) */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
            কোনো পণ্য খুঁজে পাওয়া যায়নি
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            আপনার অনুসন্ধান বা ফিল্টার শর্তের সাথে মিলে এমন কোনো পণ্য নেই। ফিল্টার রিসেট করে পুনরায় চেষ্টা করুন।
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-shubban-gold text-shubban-green-950 text-xs font-bold shadow transition"
          >
            সকল ফিল্টার পরিষ্কার করুন
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={handleToggleSelectAllCurrentPage}
                      className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                      title={isAllCurrentPageSelected ? 'সব আনসিলেক্ট করুন' : 'পৃষ্ঠার সব সিলেক্ট করুন'}
                    >
                      {isAllCurrentPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-shubban-primary dark:text-shubban-gold" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">পণ্য ও শিরোনাম</th>
                  <th className="p-3.5">বিভাগ ও লেখক</th>
                  <th className="p-3.5">বিক্রেতা / স্টোর</th>
                  <th className="p-3.5">মূল্য ও অফার</th>
                  <th className="p-3.5 text-center">ইনভেন্টরি স্টক</th>
                  <th className="p-3.5 text-center">স্ট্যাটাস ও ব্যাজ</th>
                  <th className="p-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {paginatedItems.map((prod) => {
                  const isSelected = selectedIds.has(prod.id);
                  const isInlineEditingStock = editingStockId === prod.id;

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors ${isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelectProduct(prod.id)}
                          className="p-1 text-stone-400 hover:text-stone-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-shubban-primary dark:text-shubban-gold" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Title & Cover */}
                      <td className="p-3.5 font-bold font-serif text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 border border-stone-200 dark:border-stone-700 relative group">
                            <img src={prod.coverImage} alt={prod.title} className="w-full h-full object-cover" />
                            <Link
                              href={`/books/${prod.slug}`}
                              target="_blank"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              title="ওয়েবসাইটে দেখুন"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/books/${prod.slug}`}
                              target="_blank"
                              className="hover:text-shubban-gold block line-clamp-1 text-xs"
                            >
                              {prod.title}
                            </Link>
                            <span className="text-[10px] font-mono text-stone-400 block font-normal mt-0.5">
                              আইএসবিএন: {prod.isbn || 'নেই'} {prod.publisherName ? `• ${prod.publisherName}` : ''}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {prod.variants && prod.variants.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-normal">
                                  {toBengaliNumber(prod.variants.length)}টি ভ্যারিয়েন্ট
                                </span>
                              )}
                              {prod.isDigitalAvailable && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-normal">
                                  ই-বুক
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Author */}
                      <td className="p-3.5 text-stone-600 dark:text-stone-300">
                        <span className="font-semibold block text-stone-800 dark:text-stone-200">{prod.authorName}</span>
                        <span className="text-[10px] text-stone-400 block">{prod.categoryName}</span>
                      </td>

                      {/* Vendor / Seller */}
                      <td className="p-3.5 text-stone-600 dark:text-stone-300">
                        {prod.vendorName ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            <Store className="w-3 h-3" />
                            <span>{prod.vendorName}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-medium">শুব্বান সেন্ট্রাল হাব</span>
                        )}
                      </td>

                      {/* Price & Discount */}
                      <td className="p-3.5">
                        <span className="font-bold text-shubban-green dark:text-shubban-gold font-mono block">
                          {formatTaka(prod.discountPrice || prod.price)}
                        </span>
                        {prod.discountPrice && (
                          <span className="text-[10px] text-stone-400 line-through block font-mono">
                            {formatTaka(prod.price)}
                          </span>
                        )}
                      </td>

                      {/* Inventory Stock Quick Editor */}
                      <td className="p-3.5 text-center">
                        {isInlineEditingStock ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              autoFocus
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineStock(prod.id);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                              className="w-14 px-1 py-1 text-center font-mono font-bold border border-shubban-gold rounded bg-white dark:bg-stone-900 text-xs"
                            />
                            <button
                              onClick={() => handleSaveInlineStock(prod.id)}
                              className="p-1 rounded bg-emerald-600 text-white"
                              title="সংরক্ষণ"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="p-1 rounded bg-stone-200 text-stone-600"
                              title="বাতিল"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 border border-stone-200 dark:border-stone-700 rounded-lg p-1 bg-stone-50 dark:bg-stone-900">
                            <button
                              onClick={() => handleQuickStock(prod.id, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                              title="স্টক ১ কমান"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              onClick={() => {
                                setEditingStockId(prod.id);
                                setEditingStockValue(String(prod.stockQuantity));
                              }}
                              className={`w-9 text-center font-mono font-bold cursor-pointer hover:underline ${prod.stockQuantity === 0
                                  ? 'text-rose-600'
                                  : prod.stockQuantity <= 5
                                    ? 'text-amber-600'
                                    : 'text-stone-800 dark:text-stone-200'
                                }`}
                              title="ক্লিক করে সরাসরি নতুন স্টক টাইপ করুন"
                            >
                              {toBengaliNumber(prod.stockQuantity)}
                            </span>
                            <button
                              onClick={() => handleQuickStock(prod.id, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                              title="স্টক ১ বাড়ান"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status, Featured & BestSeller */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleTogglePublish(prod)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${prod.isPhysicalAvailable
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                              }`}
                            title="ক্লিক করে প্রকাশ/ড্রাফট পরিবর্তন করুন"
                          >
                            {prod.isPhysicalAvailable ? 'প্রকাশিত (Live)' : 'ড্রাফট (Draft)'}
                          </button>

                          <div className="flex items-center gap-1 mt-0.5">
                            {/* Featured Star Toggle */}
                            <button
                              onClick={() => handleToggleFeature(prod)}
                              className={`p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition ${prod.isFeatured
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-stone-300 dark:text-stone-600'
                                }`}
                              title={prod.isFeatured ? 'ফিচার্ড সক্রিয় (ক্লিক করে বাদ দিন)' : 'ফিচার্ড করুন'}
                            >
                              <Star className={`w-3.5 h-3.5 ${prod.isFeatured ? 'fill-amber-400' : ''}`} />
                            </button>

                            {/* Best Seller Flame Toggle */}
                            <button
                              onClick={() => handleToggleBestSeller(prod)}
                              className={`p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition ${prod.isBestSeller
                                  ? 'text-rose-500'
                                  : 'text-stone-300 dark:text-stone-600'
                                }`}
                              title={prod.isBestSeller ? 'বেস্টসেলার সক্রিয় (ক্লিক করে বাদ দিন)' : 'বেস্টসেলার করুন'}
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/books/${prod.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-shubban-gold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="লাইভ শপ পেজ দেখুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleCloneProduct(prod)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                            title="পণ্যটি ক্লোন / ডুপ্লিকেট করুন"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-shubban-green hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="সম্পাদনা করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(prod)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="মুছে ফেলুন বা আর্কাইভ করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedItems.map((prod) => {
            const isSelected = selectedIds.has(prod.id);

            return (
              <div
                key={prod.id}
                className={`bg-white dark:bg-shubban-darkCard rounded-3xl border transition-all p-4 flex flex-col justify-between shadow-xs ${isSelected
                    ? 'border-shubban-gold ring-2 ring-shubban-gold/40 bg-amber-50/20'
                    : 'border-stone-200 dark:border-stone-800 hover:shadow-md'
                  }`}
              >
                <div>
                  {/* Top Bar with Select & Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      onClick={() => handleToggleSelectProduct(prod.id)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-shubban-primary dark:text-shubban-gold" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(prod)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${prod.isPhysicalAvailable
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                      >
                        {prod.isPhysicalAvailable ? 'লাইভ' : 'ড্রাফট'}
                      </button>

                      {prod.isFeatured && (
                        <span className="p-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" title="ফিচার্ড">
                          <Star className="w-3 h-3 fill-amber-400" />
                        </span>
                      )}
                      {prod.isBestSeller && (
                        <span className="p-1 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" title="বেস্টসেলার">
                          <Flame className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative aspect-[3/4] max-h-48 w-full rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-3 border border-stone-200 dark:border-stone-700">
                    <img src={prod.coverImage} alt={prod.title} className="w-full h-full object-cover" />
                    <Link
                      href={`/books/${prod.slug}`}
                      target="_blank"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm text-stone-700 dark:text-stone-300 hover:text-shubban-gold transition"
                      title="ওয়েবসাইটে দেখুন"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Title & Author */}
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                      {prod.title}
                    </h3>
                    <p className="text-[11px] text-stone-500 line-clamp-1">{prod.authorName}</p>
                    <p className="text-[10px] text-stone-400">{prod.categoryName}</p>
                  </div>
                </div>

                {/* Bottom Row with Pricing & Stock */}
                <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm font-mono text-shubban-green dark:text-shubban-gold">
                        {formatTaka(prod.discountPrice || prod.price)}
                      </span>
                      {prod.discountPrice && (
                        <span className="text-[10px] text-stone-400 line-through block font-mono">
                          {formatTaka(prod.price)}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold block ${prod.stockQuantity <= 5 ? 'text-rose-600' : 'text-stone-700 dark:text-stone-300'
                          }`}
                      >
                        স্টক: {toBengaliNumber(prod.stockQuantity)}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {prod.vendorName || 'শুব্বান হাব'}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      onClick={() => handleCloneProduct(prod)}
                      className="px-2 py-1 text-[11px] rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>ক্লোন</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100"
                        title="সম্পাদনা"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(prod)}
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Unified Pagination & Page Size Toolbar */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        itemName="পণ্য"
        onPageChange={(newPage) => {
          handlePageChange(newPage);
        }}
        onPageSizeChange={(newSize) => {
          setItemsPerPage(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* 7. Floating Sticky Bulk Actions Bar (When items are selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-950/90 backdrop-blur-md text-white border border-stone-700 shadow-2xl rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3 animate-slideUp text-xs font-bold">
          <div className="flex items-center gap-2 border-r border-stone-700 pr-3">
            <CheckSquare className="w-4 h-4 text-shubban-gold" />
            <span>{toBengaliNumber(selectedIds.size)}টি পণ্য নির্বাচিত</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => executeBatchAction('publish')}
              disabled={isBatchOperating}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>প্রকাশ করুন (Live)</span>
            </button>

            <button
              onClick={() => executeBatchAction('draft')}
              disabled={isBatchOperating}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
            >
              <span>ড্রাফট (Draft)</span>
            </button>

            <button
              onClick={() => executeBatchAction('feature')}
              disabled={isBatchOperating}
              className="px-3 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
            >
              <Star className="w-3.5 h-3.5" />
              <span>ফিচার্ড করুন</span>
            </button>

            <button
              onClick={() => setIsBulkStockModalOpen(true)}
              disabled={isBatchOperating}
              className="px-3 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 transition flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>বাল্ক স্টক</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={isBatchOperating}
              className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছে ফেলুন</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="p-1.5 text-stone-400 hover:text-white transition ml-1"
              title="সিলেকশন বাতিল করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 8. BULK STOCK ADJUSTMENT MODAL */}
      {isBulkStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-shubban-gold" />
                <span>বাল্ক স্টক পরিবর্তন ({toBengaliNumber(selectedIds.size)}টি পণ্য)</span>
              </h3>
              <button onClick={() => setIsBulkStockModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                  পরিবর্তনের ধরন:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkStockMode('add')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold ${bulkStockMode === 'add'
                        ? 'border-shubban-gold bg-shubban-gold/15 text-shubban-primary dark:text-shubban-gold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600'
                      }`}
                  >
                    বিদ্যমান স্টকে যোগ / বিয়োগ
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStockMode('set')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold ${bulkStockMode === 'set'
                        ? 'border-shubban-gold bg-shubban-gold/15 text-shubban-primary dark:text-shubban-gold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600'
                      }`}
                  >
                    সরাসরি নতুন স্টক বসান
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                  {bulkStockMode === 'add' ? 'যোগ করার পরিমাণ (যেমন: +10 বা -5):' : 'নির্ধারিত নতুন স্টক সংখ্যা:'}
                </label>
                <input
                  type="number"
                  value={bulkStockAmount}
                  onChange={(e) => setBulkStockAmount(e.target.value)}
                  placeholder="১০"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBulkStockModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={() => executeBatchAction(bulkStockMode === 'add' ? 'stock_add' : 'stock_set', bulkStockAmount)}
                disabled={isBatchOperating}
                className="px-5 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 text-xs font-bold shadow-md"
              >
                {isBatchOperating ? 'আপডেট হচ্ছে...' : 'স্টক কার্যকর করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              নির্বাচিত {toBengaliNumber(selectedIds.size)}টি পণ্য মুছবেন?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              নির্বাচিত সকল পণ্য ও তাদের ভ্যারিয়েন্ট ডাটাবেস থেকে মুছে ফেলা হবে। এই কাজ অপরিবর্তনযোগ্য।
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 text-xs font-semibold"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => executeBatchAction('delete')}
                disabled={isBatchOperating}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                {isBatchOperating ? 'মোছা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. CREATE & EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-shubban-gold" />
                <span>{editingProduct ? 'পণ্য সম্পাদনা করুন' : 'নতুন পণ্য যুক্ত করুন'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProduct} className="space-y-5 text-xs">
              {/* Row 1: Title, English Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    পণ্যের বাংলা শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="যেমন: আর-রাহীকুল মাখতূম"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ইংরেজি শিরোনাম (Title EN)
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="e.g. Ar-Raheeq Al-Makhtum"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              {/* Row 2: Price, Discount Price, Stock Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    মূল্য (টাকা) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="৬৫০"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ছাড়কৃত মূল্য (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    placeholder="৪৮০"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    ইনভেন্টরি স্টক সংখ্যা *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="২০"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                </div>
              </div>

              {/* Row 3: Category, Author, Publisher, Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    বিভাগ (Category) *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    লেখক (Author) *
                  </label>
                  <select
                    value={formData.authorId}
                    onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রকাশনী (Publisher)
                  </label>
                  <select
                    value={formData.publisherId}
                    onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  >
                    <option value="">প্রকাশক ছাড়াই</option>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    মার্কেটপ্লেস বিক্রেতা (Seller)
                  </label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none"
                  >
                    <option value="">শুব্বান সেন্ট্রাল স্টোর</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Cover Image & ISBN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <MediaPickerInput
                    label="বই বা পণ্যের কভার ছবি (Cover Image) *"
                    required
                    value={formData.coverImage}
                    onChange={(url) => setFormData({ ...formData, coverImage: url })}
                    allowedTypes={['IMAGE']}
                    placeholder="ছবির লিংক লিখুন বা মিডিয়া লাইব্রেরি থেকে সিলেক্ট করুন"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    আইএসবিএন (ISBN)
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="978-984-..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Row 5: Dynamic Product Variants */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100">
                      পণ্য ভ্যারিয়েন্ট ব্যবস্থাপনা (Product Variants)
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      যেমন: ৬ মিলি বা ১২ মিলি আতর, হার্ডকভার বা পেপারব্যাক সংস্করণ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="px-3 py-1 rounded-lg bg-shubban-green text-shubban-gold font-bold text-[11px] flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>ভ্যারিয়েন্ট যোগ করুন</span>
                  </button>
                </div>

                {formData.variants.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {formData.variants.map((v, vIdx) => (
                      <div key={vIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="ভ্যারিয়েন্ট নাম (যেমন: ৬ মিলি)"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[vIdx].name = e.target.value;
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900"
                        />
                        <input
                          type="text"
                          placeholder="এসকেইউ (SKU)"
                          value={v.sku}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[vIdx].sku = e.target.value;
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-mono"
                        />
                        <input
                          type="number"
                          placeholder="মূল্য"
                          value={v.price}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[vIdx].price = e.target.value;
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-mono font-bold"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="স্টক"
                            value={v.stockQuantity}
                            onChange={(e) => {
                              const updated = [...formData.variants];
                              updated[vIdx].stockQuantity = e.target.value;
                              setFormData({ ...formData, variants: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantRow(vIdx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 6: Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPhysicalAvailable}
                    onChange={(e) => setFormData({ ...formData, isPhysicalAvailable: e.target.checked })}
                    className="rounded text-shubban-green focus:ring-shubban-gold"
                  />
                  <span>মুদ্রিত কপি (Physical / Delivery)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDigitalAvailable}
                    onChange={(e) => setFormData({ ...formData, isDigitalAvailable: e.target.checked })}
                    className="rounded text-shubban-green focus:ring-shubban-gold"
                  />
                  <span>ডিজিটাল সংস্করণ (e-Book)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="rounded text-shubban-green focus:ring-shubban-gold"
                  />
                  <span>জনপ্রিয় / বেস্ট-সেলার</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-shubban-green focus:ring-shubban-gold"
                  />
                  <span>নির্বাচিত ও ফিচার্ড</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'পণ্য সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. DELETE / ARCHIVE SINGLE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              আপনি কি নিশ্চিত?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              “{deleteTarget.title}” পণ্যটি ক্যাটালগ থেকে মুছে ফেলা বা আর্কাইভ করা হবে। যদি কোনো গ্রাহক ইতিপূর্বে এটি ক্রয় করে থাকেন, তবে অর্ডার ইতিহাস রক্ষার্থে পণ্যটি নিরাপদে আর্কাইভ হিসেবে সংরক্ষণ করা হবে।
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                মুছে ফেলুন / আর্কাইভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
