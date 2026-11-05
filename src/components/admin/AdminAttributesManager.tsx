'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sliders,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  ArrowUpDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  Filter,
  Sparkles,
  AlertTriangle,
  X,
  Save,
  Check,
  Tag,
  Layers,
  HelpCircle,
  MoveRight,
  CheckSquare,
  Square,
  Package,
  Palette,
  Grid,
  Hash,
  Type,
  ToggleLeft,
  ListFilter,
  Copy,
  Boxes,
  ArrowRight,
  Maximize2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { toBengaliNumber, formatTaka } from '@/lib/utils';
import Pagination from '@/components/ui/Pagination';

export interface AttributeGroup {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  status: string;
  _count?: {
    attributes: number;
  };
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  name: string;
  slug: string;
  code?: string | null;
  colorHex?: string | null;
  swatchImage?: string | null;
  displayOrder: number;
  status: string;
  metadata?: string | null;
}

export interface AttributeItem {
  id: string;
  name: string;
  slug: string;
  code: string;
  description?: string | null;
  type: string;
  displayLabel?: string | null;
  displayOrder: number;
  status: string;
  isRequired: boolean;
  isVariant: boolean;
  showOnProduct: boolean;
  useInFilter: boolean;
  groupId?: string | null;
  group?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  values: AttributeValue[];
  createdAt: string | Date;
  updatedAt: string | Date;
  _count: {
    assignments: number;
    values: number;
  };
}

export interface AttributeStats {
  totalAttributes: number;
  totalAttributeValues: number;
  totalProductVariants: number;
  activeAttributes: number;
  productsUsingAttributes: number;
}

export interface ProductVariantItem {
  id: string;
  bookId: string;
  name: string;
  sku: string | null;
  barcode?: string | null;
  price: number;
  salePrice?: number | null;
  costPrice?: number | null;
  wholesalePrice?: number | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  manageStock?: boolean;
  stockStatus?: string;
  allowBackorders?: boolean;
  image?: string | null;
  description?: string | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  shippingClass?: string | null;
  taxClass?: string | null;
  status: string;
  attributes: string | null; // JSON
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AdminAttributesManagerProps {
  initialAttributes: AttributeItem[];
  initialStats: AttributeStats;
  initialGroups: AttributeGroup[];
}

export const ATTRIBUTE_TYPES = [
  { value: 'SELECT', label: 'ড্রপডাউন (Dropdown / Select)', icon: ListFilter, desc: 'একটি মান বাছাই করার ড্রপডাউন' },
  { value: 'MULTI_SELECT', label: 'মাল্টিপল সিলেক্ট (Multi Select)', icon: CheckSquare, desc: 'একাধিক মান একসাথে নির্বাচনের জন্য' },
  { value: 'BUTTON', label: 'বাটন / লেবেল (Button Selector)', icon: Grid, desc: 'সাইজ ও স্টোরেজের মতো ক্লিকযোগ্য বোতাম' },
  { value: 'COLOR_SWATCH', label: 'কালার সোয়াচ (Color Swatch)', icon: Palette, desc: 'রং নির্বাচনের কালার সার্কেল বা বক্স' },
  { value: 'IMAGE_SWATCH', label: 'ইমেজ সোয়াচ (Image Swatch)', icon: Package, desc: 'ছোট ছবির মাধ্যমে ভ্যারিয়েন্ট প্রদর্শন' },
  { value: 'RADIO', label: 'রেডিও বাটন (Radio Button)', icon: ToggleLeft, desc: 'একক বিকল্প নির্বাচনের রেডিও বোতাম' },
  { value: 'CHECKBOX', label: 'চেকবক্স (Checkbox)', icon: CheckSquare, desc: 'হ্যাঁ/না বা চেকবক্স ভিত্তিক নির্বাচন' },
  { value: 'TEXT', label: 'টেক্সট ইনপুট (Text Input)', icon: Type, desc: 'কাস্টম টেক্সট স্পেসিফিকেশন' },
  { value: 'NUMBER', label: 'সংখ্যা ইনপুট (Number Input)', icon: Hash, desc: 'পরিমাপ বা সংখ্যাসূচক বৈশিষ্ট্য' },
];

export default function AdminAttributesManager({
  initialAttributes,
  initialStats,
  initialGroups,
}: AdminAttributesManagerProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'attributes' | 'groups' | 'generator'>('attributes');

  // Stats & Groups State
  const [stats, setStats] = useState<AttributeStats>(initialStats);
  const [groups, setGroups] = useState<AttributeGroup[]>(initialGroups);

  // Attributes List State
  const [attributes, setAttributes] = useState<AttributeItem[]>(initialAttributes);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(initialStats.totalAttributes);
  const [totalPages, setTotalPages] = useState(Math.ceil(initialStats.totalAttributes / 25) || 1);

  // Selection & Expand State
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modals State
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [attrFormTab, setAttrFormTab] = useState<'basic' | 'config' | 'values' | 'advanced'>('basic');
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);

  // Detail View Modal
  const [viewingAttribute, setViewingAttribute] = useState<AttributeItem | null>(null);

  // Values Quick Manager Modal
  const [valManagerAttr, setValManagerAttr] = useState<AttributeItem | null>(null);
  const [newValName, setNewValName] = useState('');
  const [newValCode, setNewValCode] = useState('');
  const [newValColor, setNewValColor] = useState('#000000');
  const [newValSwatch, setNewValSwatch] = useState('');
  const [bulkValText, setBulkValText] = useState('');
  const [showBulkValInput, setShowBulkValInput] = useState(false);

  // Group Modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<'create' | 'edit'>('create');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    status: 'ACTIVE',
  });

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'attribute' | 'value' | 'group' | 'variant' | 'bulk_attributes' | 'bulk_variants';
    id?: string;
    parentAttrId?: string;
    name?: string;
  } | null>(null);

  // Form State for Add/Edit Attribute
  const [attrForm, setAttrForm] = useState({
    name: '',
    slug: '',
    code: '',
    description: '',
    type: 'SELECT',
    displayLabel: '',
    displayOrder: 0,
    status: 'ACTIVE',
    isRequired: false,
    isVariant: true,
    showOnProduct: true,
    useInFilter: true,
    groupId: '',
    values: [] as Array<{
      name: string;
      code: string;
      colorHex: string;
      swatchImage: string;
      displayOrder: number;
    }>,
  });

  // ==========================================
  // VARIANT STUDIO / GENERATOR STATE (Tab 3)
  // ==========================================
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productAssignments, setProductAssignments] = useState<any[]>([]);
  const [allStoreAttributes, setAllStoreAttributes] = useState<AttributeItem[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariantItem[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // Variant Generation Config
  const [selectedVariantAttrIds, setSelectedVariantAttrIds] = useState<string[]>([]);
  const [combinationPreview, setCombinationPreview] = useState<any[]>([]);
  const [excludedCombos, setExcludedCombos] = useState<Record<string, boolean>>({});
  const [generatorDefaultPrice, setGeneratorDefaultPrice] = useState<number>(0);
  const [generatorDefaultStock, setGeneratorDefaultStock] = useState<number>(10);
  const [generatorBaseSku, setGeneratorBaseSku] = useState<string>('');
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

  // Individual Variant Edit Modal
  const [editingVariant, setEditingVariant] = useState<ProductVariantItem | null>(null);
  const [variantForm, setVariantForm] = useState<Partial<ProductVariantItem>>({});

  // Variant Bulk Edit Modal
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [showBulkVariantModal, setShowBulkVariantModal] = useState(false);
  const [bulkVariantAction, setBulkVariantAction] = useState<
    'bulk_price' | 'bulk_stock' | 'bulk_status' | 'bulk_sku' | 'bulk_delete'
  >('bulk_price');
  const [bulkPriceType, setBulkPriceType] = useState<'set' | 'adjust_fixed' | 'adjust_percent'>('set');
  const [bulkPriceValue, setBulkPriceValue] = useState<number>(0);
  const [bulkStockType, setBulkStockType] = useState<'set' | 'adjust'>('set');
  const [bulkStockValue, setBulkStockValue] = useState<number>(0);
  const [bulkStatusValue, setBulkStatusValue] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Single Custom Variant Add Modal
  const [showSingleVariantModal, setShowSingleVariantModal] = useState(false);
  const [singleVariantForm, setSingleVariantForm] = useState({
    name: '',
    sku: '',
    price: 0,
    stockQuantity: 10,
    status: 'ACTIVE',
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Fetch Attributes from Backend API
  const fetchAttributes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (groupFilter !== 'all') params.set('groupId', groupFilter);
      if (usageFilter !== 'all') params.set('usage', usageFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/admin/attributes?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAttributes(data.attributes);
        setStats(data.stats);
        if (data.groups) setGroups(data.groups);
        setTotalRecords(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        addToast('error', data.error || 'অ্যাট্রিবিউট লোড করতে ব্যর্থ।');
      }
    } catch (err: any) {
      addToast('error', 'সার্ভারে সংযোগ করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, statusFilter, groupFilter, usageFilter, sortBy, sortOrder, page, limit, addToast]);

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttributes();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAttributes]);

  // Fetch Groups
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/attributes/groups');
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Row Expand Toggle
  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttrIds(attributes.map((a) => a.id));
    } else {
      setSelectedAttrIds([]);
    }
  };

  const handleSelectAttr = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAttrIds((prev) => [...prev, id]);
    } else {
      setSelectedAttrIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingAttrId(null);
    setAttrFormTab('basic');
    setAttrForm({
      name: '',
      slug: '',
      code: '',
      description: '',
      type: 'SELECT',
      displayLabel: '',
      displayOrder: attributes.length + 1,
      status: 'ACTIVE',
      isRequired: false,
      isVariant: true,
      showOnProduct: true,
      useInFilter: true,
      groupId: groups[0]?.id || '',
      values: [
        { name: '', code: '', colorHex: '#000000', swatchImage: '', displayOrder: 1 },
      ],
    });
    setShowAttrModal(true);
  };

  // Open Edit Modal
  const openEditModal = (attr: AttributeItem) => {
    setModalMode('edit');
    setEditingAttrId(attr.id);
    setAttrFormTab('basic');
    setAttrForm({
      name: attr.name,
      slug: attr.slug,
      code: attr.code,
      description: attr.description || '',
      type: attr.type,
      displayLabel: attr.displayLabel || '',
      displayOrder: attr.displayOrder,
      status: attr.status,
      isRequired: attr.isRequired,
      isVariant: attr.isVariant,
      showOnProduct: attr.showOnProduct,
      useInFilter: attr.useInFilter,
      groupId: attr.groupId || '',
      values: attr.values.map((v) => ({
        name: v.name,
        code: v.code || '',
        colorHex: v.colorHex || '#000000',
        swatchImage: v.swatchImage || '',
        displayOrder: v.displayOrder,
      })),
    });
    setShowAttrModal(true);
  };

  // Save Attribute
  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.name.trim()) {
      addToast('error', 'অ্যাট্রিবিউটের নাম আবশ্যক।');
      return;
    }

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/admin/attributes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attrForm),
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message || 'অ্যাট্রিবিউট সফলভাবে তৈরি হয়েছে!');
          setShowAttrModal(false);
          fetchAttributes();
        } else {
          addToast('error', data.error || 'তৈরি করতে ব্যর্থ।');
        }
      } else if (editingAttrId) {
        const res = await fetch(`/api/admin/attributes/${editingAttrId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attrForm),
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message || 'অ্যাট্রিবিউট সফলভাবে আপডেট হয়েছে!');
          setShowAttrModal(false);
          fetchAttributes();
        } else {
          addToast('error', data.error || 'আপডেট করতে ব্যর্থ।');
        }
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // Toggle Status directly from table
  const handleToggleStatus = async (attr: AttributeItem) => {
    const newStatus = attr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/attributes/${attr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `${attr.name} এখন ${newStatus === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}!`);
        fetchAttributes();
      }
    } catch (err) {
      addToast('error', 'স্ট্যাটাস পরিবর্তন ব্যর্থ।');
    }
  };

  // Duplicate Attribute
  const handleDuplicateAttribute = async (attr: AttributeItem) => {
    try {
      const payload = {
        name: `${attr.name} (কপি)`,
        slug: `${attr.slug}-copy-${Date.now().toString().slice(-4)}`,
        code: `${attr.code}_COPY`,
        description: attr.description,
        type: attr.type,
        displayLabel: attr.displayLabel,
        displayOrder: attr.displayOrder + 1,
        status: 'ACTIVE',
        isRequired: attr.isRequired,
        isVariant: attr.isVariant,
        showOnProduct: attr.showOnProduct,
        useInFilter: attr.useInFilter,
        groupId: attr.groupId,
        values: attr.values.map((v) => ({
          name: v.name,
          code: v.code,
          colorHex: v.colorHex,
          swatchImage: v.swatchImage,
          displayOrder: v.displayOrder,
        })),
      };

      const res = await fetch('/api/admin/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `'${attr.name}' সফলভাবে ডুপ্লিকেট করা হয়েছে!`);
        fetchAttributes();
      } else {
        addToast('error', data.error || 'ডুপ্লিকেট ব্যর্থ।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // Bulk Actions on Attributes
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'export') => {
    if (action !== 'export' && selectedAttrIds.length === 0) {
      addToast('error', 'অন্তত একটি অ্যাট্রিবিউট নির্বাচন করুন।');
      return;
    }

    if (action === 'delete') {
      setDeleteConfirm({
        type: 'bulk_attributes',
        name: `${selectedAttrIds.length}টি নির্বাচিত অ্যাট্রিবিউট`,
      });
      return;
    }

    if (action === 'export') {
      window.open(`/api/admin/attributes/bulk?export=true`, '_blank');
      return;
    }

    try {
      const res = await fetch('/api/admin/attributes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedAttrIds }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setSelectedAttrIds([]);
        fetchAttributes();
      } else {
        addToast('error', data.error || 'বাল্ক একশন সম্পন্ন হয়নি।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // Quick Value Manager operations
  const openValueManager = (attr: AttributeItem) => {
    setValManagerAttr(attr);
    setNewValName('');
    setNewValCode('');
    setNewValColor('#000000');
    setNewValSwatch('');
    setBulkValText('');
    setShowBulkValInput(false);
  };

  const handleAddSingleValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valManagerAttr || !newValName.trim()) return;

    try {
      const res = await fetch(`/api/admin/attributes/${valManagerAttr.id}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newValName.trim(),
          code: newValCode.trim() || undefined,
          colorHex: valManagerAttr.type === 'COLOR_SWATCH' ? newValColor : undefined,
          swatchImage: valManagerAttr.type === 'IMAGE_SWATCH' ? newValSwatch : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setNewValName('');
        setNewValCode('');
        // Refresh local attribute values
        const updatedAttrRes = await fetch(`/api/admin/attributes/${valManagerAttr.id}`);
        const updatedData = await updatedAttrRes.json();
        if (updatedData.success) {
          setValManagerAttr(updatedData.attribute);
        }
        fetchAttributes();
      } else {
        addToast('error', data.error || 'ভ্যালু যোগ করতে ব্যর্থ।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  const handleBulkAddValues = async () => {
    if (!valManagerAttr || !bulkValText.trim()) return;
    try {
      const res = await fetch(`/api/admin/attributes/${valManagerAttr.id}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkText: bulkValText }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setBulkValText('');
        setShowBulkValInput(false);
        const updatedAttrRes = await fetch(`/api/admin/attributes/${valManagerAttr.id}`);
        const updatedData = await updatedAttrRes.json();
        if (updatedData.success) {
          setValManagerAttr(updatedData.attribute);
        }
        fetchAttributes();
      } else {
        addToast('error', data.error || 'বাল্ক যোগ ব্যর্থ।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  const handleDeleteValue = async (valId: string, attrId: string) => {
    try {
      const res = await fetch(`/api/admin/attributes/${attrId}/values?valueId=${valId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        if (valManagerAttr) {
          const updatedAttrRes = await fetch(`/api/admin/attributes/${attrId}`);
          const updatedData = await updatedAttrRes.json();
          if (updatedData.success) {
            setValManagerAttr(updatedData.attribute);
          }
        }
        fetchAttributes();
      } else {
        addToast('error', data.error || 'ভ্যালু মুছতে ব্যর্থ।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // Group Management Save
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      addToast('error', 'গ্রুপের নাম আবশ্যক।');
      return;
    }

    try {
      if (groupModalMode === 'create') {
        const res = await fetch('/api/admin/attributes/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupForm),
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message);
          setShowGroupModal(false);
          fetchGroups();
        } else {
          addToast('error', data.error || 'গ্রুপ তৈরি ব্যর্থ।');
        }
      } else if (editingGroupId) {
        const res = await fetch('/api/admin/attributes/groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...groupForm, id: editingGroupId }),
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message);
          setShowGroupModal(false);
          fetchGroups();
        } else {
          addToast('error', data.error || 'গ্রুপ আপডেট ব্যর্থ।');
        }
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // Execute Confirmed Delete
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'attribute' && deleteConfirm.id) {
        const res = await fetch(`/api/admin/attributes/${deleteConfirm.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message);
          fetchAttributes();
        } else {
          addToast('error', data.error);
        }
      } else if (deleteConfirm.type === 'bulk_attributes') {
        const res = await fetch('/api/admin/attributes/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', ids: selectedAttrIds }),
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message);
          setSelectedAttrIds([]);
          fetchAttributes();
        }
      } else if (deleteConfirm.type === 'group' && deleteConfirm.id) {
        const res = await fetch(`/api/admin/attributes/groups?id=${deleteConfirm.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message);
          fetchGroups();
        }
      } else if (deleteConfirm.type === 'variant' && deleteConfirm.id && selectedProduct) {
        const res = await fetch(`/api/admin/variants/${deleteConfirm.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message);
          loadProductDetails(selectedProduct.id);
        }
      } else if (deleteConfirm.type === 'bulk_variants' && selectedProduct) {
        const res = await fetch(`/api/admin/products/${selectedProduct.id}/variants`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_delete', variantIds: selectedVariantIds }),
        });
        const data = await res.json();
        if (data.success) {
          addToast('success', data.message);
          setSelectedVariantIds([]);
          loadProductDetails(selectedProduct.id);
        }
      }
    } catch (err) {
      addToast('error', 'অপারেশন সম্পন্ন করতে ব্যর্থ।');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ==========================================
  // VARIANT STUDIO FUNCTIONS (Tab 3)
  // ==========================================
  const searchProducts = async (q: string) => {
    setProductSearchQuery(q);
    if (!q.trim()) {
      setProductSearchResults([]);
      return;
    }
    setIsSearchingProduct(true);
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.success) {
        setProductSearchResults(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingProduct(false);
    }
  };

  const loadProductDetails = async (productId: string) => {
    setIsLoadingVariants(true);
    try {
      // 1. Fetch Product Attributes
      const attrRes = await fetch(`/api/admin/products/${productId}/attributes`);
      const attrData = await attrRes.json();
      if (attrData.success) {
        setSelectedProduct(attrData.product);
        setProductAssignments(attrData.product.attributeAssignments || []);
        setAllStoreAttributes(attrData.allAttributes || []);
        setGeneratorDefaultPrice(attrData.product.price || 0);
        setGeneratorBaseSku(attrData.product.slug || 'SKU');
      }

      // 2. Fetch Product Variants
      const varRes = await fetch(`/api/admin/products/${productId}/variants`);
      const varData = await varRes.json();
      if (varData.success) {
        setProductVariants(varData.variants || []);
      }
    } catch (err) {
      addToast('error', 'পণ্যের তথ্য লোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // Save product attribute assignment changes
  const handleSaveProductAttributes = async () => {
    if (!selectedProduct) return;
    try {
      const payload = {
        assignments: productAssignments.map((a, i) => ({
          attributeId: a.attributeId,
          isRequired: Boolean(a.isRequired),
          isVariant: Boolean(a.isVariant),
          defaultValue: a.defaultValue || null,
          displayOrder: i + 1,
          valueIds: (a.values || []).map((v: any) => v.valueId || v.id),
        })),
      };

      const res = await fetch(`/api/admin/products/${selectedProduct.id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'পণ্যের অ্যাট্রিবিউট সফলভাবে সংরক্ষিত হয়েছে!');
        loadProductDetails(selectedProduct.id);
      } else {
        addToast('error', data.error);
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সংরক্ষণ ব্যর্থ।');
    }
  };

  // Preview Combinations (Cartesian Product)
  const handlePreviewCombinations = async () => {
    if (!selectedProduct) return;

    // Filter assignments that are variant-generating and selected
    const variantAttrs = productAssignments.filter(
      (a) => a.isVariant && selectedVariantAttrIds.includes(a.attributeId)
    );

    if (variantAttrs.length === 0) {
      addToast('error', 'কম্বিনেশন তৈরির জন্য অন্তত একটি ভ্যারিয়েন্ট অ্যাট্রিবিউট টিক দিন।');
      return;
    }

    const attrPayload = variantAttrs.map((a) => {
      const fullAttr = allStoreAttributes.find((sa) => sa.id === a.attributeId);
      // Selected values or all values of this attribute
      const assignedValueIds = (a.values || []).map((v: any) => v.valueId || v.id);
      const values = (fullAttr?.values || []).filter(
        (v) => assignedValueIds.length === 0 || assignedValueIds.includes(v.id)
      );

      return {
        name: fullAttr?.name || a.attribute?.name || 'Attr',
        values: values.map((v) => ({ name: v.name, code: v.code })),
      };
    });

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'preview',
          attributes: attrPayload,
          defaultPrice: generatorDefaultPrice,
          defaultStock: generatorDefaultStock,
          baseSku: generatorBaseSku,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCombinationPreview(data.combinations || []);
        setExcludedCombos({});
      } else {
        addToast('error', data.error || 'কম্বিনেশন প্রিভিউ ব্যর্থ।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // Generate All Combinations in Database
  const handleGenerateVariants = async () => {
    if (!selectedProduct || combinationPreview.length === 0) return;
    setIsGeneratingVariants(true);

    try {
      const variantAttrs = productAssignments.filter(
        (a) => a.isVariant && selectedVariantAttrIds.includes(a.attributeId)
      );
      const attrPayload = variantAttrs.map((a) => {
        const fullAttr = allStoreAttributes.find((sa) => sa.id === a.attributeId);
        const assignedValueIds = (a.values || []).map((v: any) => v.valueId || v.id);
        const values = (fullAttr?.values || []).filter(
          (v) => assignedValueIds.length === 0 || assignedValueIds.includes(v.id)
        );

        return {
          name: fullAttr?.name || a.attribute?.name || 'Attr',
          values: values.map((v) => ({ name: v.name, code: v.code })),
        };
      });

      const excludedList = Object.keys(excludedCombos).filter((k) => excludedCombos[k]);

      const res = await fetch(`/api/admin/products/${selectedProduct.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          attributes: attrPayload,
          excludedCombinations: excludedList,
          preserveExisting: true,
          defaultPrice: generatorDefaultPrice,
          defaultStock: generatorDefaultStock,
          baseSku: generatorBaseSku,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setCombinationPreview([]);
        loadProductDetails(selectedProduct.id);
        fetchAttributes(); // Refresh variant counter
      } else {
        addToast('error', data.error || 'ভ্যারিয়েন্ট জেনারেশন ব্যর্থ।');
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  // Save Single Custom Variant
  const handleSaveSingleVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !singleVariantForm.name.trim()) return;

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          singleVariantData: singleVariantForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setShowSingleVariantModal(false);
        setSingleVariantForm({ name: '', sku: '', price: selectedProduct.price, stockQuantity: 10, status: 'ACTIVE' });
        loadProductDetails(selectedProduct.id);
        fetchAttributes();
      } else {
        addToast('error', data.error);
      }
    } catch (err) {
      addToast('error', 'সার্ভারে সমস্যা হয়েছে।');
    }
  };

  // Open Edit Modal for Single Variant
  const openEditVariantModal = (v: ProductVariantItem) => {
    setEditingVariant(v);
    setVariantForm({
      name: v.name,
      sku: v.sku || '',
      barcode: v.barcode || '',
      price: v.price,
      salePrice: v.salePrice || undefined,
      costPrice: v.costPrice || undefined,
      wholesalePrice: v.wholesalePrice || undefined,
      stockQuantity: v.stockQuantity,
      lowStockThreshold: v.lowStockThreshold || 5,
      manageStock: v.manageStock ?? true,
      stockStatus: v.stockStatus || 'IN_STOCK',
      allowBackorders: v.allowBackorders ?? false,
      image: v.image || '',
      description: v.description || '',
      weight: v.weight || undefined,
      length: v.length || undefined,
      width: v.width || undefined,
      height: v.height || undefined,
      shippingClass: v.shippingClass || '',
      taxClass: v.taxClass || '',
      status: v.status,
    });
  };

  // Save Individual Variant
  const handleSaveIndividualVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    try {
      const res = await fetch(`/api/admin/variants/${editingVariant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantForm),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setEditingVariant(null);
        if (selectedProduct) loadProductDetails(selectedProduct.id);
      } else {
        addToast('error', data.error);
      }
    } catch (err) {
      addToast('error', 'আপডেট ব্যর্থ।');
    }
  };

  // Execute Bulk Variant Action
  const handleExecuteBulkVariantAction = async () => {
    if (!selectedProduct || selectedVariantIds.length === 0) return;

    let payload: any = {};
    if (bulkVariantAction === 'bulk_price') {
      payload = { type: bulkPriceType, value: bulkPriceValue };
    } else if (bulkVariantAction === 'bulk_stock') {
      payload = { type: bulkStockType, value: bulkStockValue };
    } else if (bulkVariantAction === 'bulk_status') {
      payload = { status: bulkStatusValue };
    }

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/variants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkVariantAction,
          variantIds: selectedVariantIds,
          payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setShowBulkVariantModal(false);
        setSelectedVariantIds([]);
        loadProductDetails(selectedProduct.id);
      } else {
        addToast('error', data.error);
      }
    } catch (err) {
      addToast('error', 'বাল্ক অপারেশন ব্যর্থ।');
    }
  };

  return (
    <div className="space-y-6 font-bengali pb-16">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-slide-up ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : 'bg-stone-900/90 border-stone-700 text-stone-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <Link href="/admin" className="hover:text-shubban-primary transition-colors">
              ড্যাশবোর্ড
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>প্রোডাক্ট ক্যাটালগ</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-800 dark:text-stone-200 font-semibold">অ্যাট্রিবিউট ও ভ্যারিয়েন্ট</span>
          </div>
          <h1 className="font-serif font-bold text-2xl lg:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-shubban-gold" />
            <span>প্রোডাক্ট অ্যাট্রিবিউট ও ভ্যারিয়েন্ট সেন্ট্রাল কন্ট্রোল</span>
          </h1>
          <p className="text-xs lg:text-sm text-stone-500 dark:text-stone-400 mt-1">
            ই-কমার্স বৈশিষ্ট্য, সাইজ/রং সোয়াচ, ভ্যারিয়েন্ট কম্বিনেশন জেনারেটর এবং স্টক ও মূল্যের স্বয়ংক্রিয় নিয়ন্ত্রণ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              fetchAttributes();
              fetchGroups();
              addToast('info', 'তথ্য রিফ্রেশ করা হয়েছে।');
            }}
            disabled={isLoading}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>

          <button
            onClick={() => {
              setGroupModalMode('create');
              setEditingGroupId(null);
              setGroupForm({ name: '', slug: '', description: '', displayOrder: groups.length + 1, status: 'ACTIVE' });
              setShowGroupModal(true);
            }}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>নতুন গ্রুপ</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-shubban-primary hover:bg-shubban-primaryHover text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-shubban-primary/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন অ্যাট্রিবিউট তৈরি</span>
          </button>
        </div>
      </div>

      {/* 5 Real Database Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              মোট অ্যাট্রিবিউট
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-shubban-gold">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.totalAttributes)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> সক্রিয় সিস্টেম অ্যাট্রিবিউট
          </p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              মোট ভ্যালু (Values)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.totalAttributeValues)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
            <Palette className="w-3 h-3 text-blue-500" /> সাইজ, রং ও পরিমাপের মান
          </p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              মোট প্রোডাক্ট ভ্যারিয়েন্ট
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.totalProductVariants)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
            <Check className="w-3 h-3 text-purple-500" /> তৈরি হওয়া SKU ও অপশন
          </p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              সক্রিয় অ্যাট্রিবিউট
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {toBengaliNumber(stats.activeAttributes)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
            স্টোরফ্রন্ট ও ফিল্টারে চালু
          </p>
        </div>

        <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              সংযুক্ত পণ্য (Products)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
            {toBengaliNumber(stats.productsUsingAttributes)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
            অ্যাট্রিবিউট ব্যবহারকারী পণ্য
          </p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'attributes'
              ? 'bg-shubban-primary text-white shadow-md shadow-shubban-primary/20'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>অ্যাট্রিবিউট তালিকা ({toBengaliNumber(totalRecords)})</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'groups'
              ? 'bg-shubban-primary text-white shadow-md shadow-shubban-primary/20'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>অ্যাট্রিবিউট গ্রুপস ({toBengaliNumber(groups.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'generator'
              ? 'bg-shubban-primary text-white shadow-md shadow-shubban-primary/20'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>পণ্য ভ্যারিয়েন্ট জেনারেটর স্টুডিও</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ATTRIBUTES LIST & MANAGEMENT TABLE                 */}
      {/* ========================================================= */}
      {activeTab === 'attributes' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-shubban-darkCard p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Box */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="অ্যাট্রিবিউট নাম, কোড বা ভ্যালু দিয়ে খুঁজুন..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-shubban-gold/40"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-shubban-gold/40"
                >
                  <option value="all">সকল ধরন (All Types)</option>
                  {ATTRIBUTE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Filter */}
              <div>
                <select
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-shubban-gold/40"
                >
                  <option value="all">সকল গ্রুপ (All Groups)</option>
                  <option value="none">কোনো গ্রুপ ছাড়া</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-shubban-gold/40"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="ACTIVE">সক্রিয় (Active)</option>
                  <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/60 gap-3 text-xs">
              <div className="flex items-center gap-2">
                {selectedAttrIds.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-shubban-gold/10 px-3 py-1.5 rounded-xl border border-shubban-gold/30 text-shubban-gold font-bold">
                    <span>{toBengaliNumber(selectedAttrIds.length)}টি নির্বাচিত</span>
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 ml-2"
                    >
                      সক্রিয় করুন
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="px-2 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-700"
                    >
                      নিষ্ক্রিয় করুন
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700"
                    >
                      মুছুন
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBulkAction('export')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-shubban-gold" />
                  <span>CSV এক্সপোর্ট</span>
                </button>

                <div className="flex items-center gap-1 text-stone-500">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>সর্টিং:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-stone-800 dark:text-stone-200 font-bold focus:outline-none"
                  >
                    <option value="displayOrder">ক্রমিক নম্বর</option>
                    <option value="name">নাম (A-Z)</option>
                    <option value="createdAt">নতুন তৈরি</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-stone-900/80 text-stone-500 dark:text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={attributes.length > 0 && selectedAttrIds.length === attributes.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold cursor-pointer"
                      />
                    </th>
                    <th className="p-4">অ্যাট্রিবিউট নাম ও কোড</th>
                    <th className="p-4">ধরন (Type)</th>
                    <th className="p-4">সংযুক্ত গ্রুপ</th>
                    <th className="p-4">ভ্যালুসমূহ (Values)</th>
                    <th className="p-4 text-center">ব্যবহৃত পণ্য</th>
                    <th className="p-4 text-center">ক্রমিক</th>
                    <th className="p-4 text-center">স্ট্যাটাস</th>
                    <th className="p-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-shubban-gold" />
                        <p>অ্যাট্রিবিউট লোড হচ্ছে...</p>
                      </td>
                    </tr>
                  ) : attributes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-400">
                        <Sliders className="w-10 h-10 mx-auto mb-3 opacity-30 text-stone-400" />
                        <p className="font-semibold text-stone-600 dark:text-stone-300">
                          কোনো প্রোডাক্ট অ্যাট্রিবিউট পাওয়া যায়নি।
                        </p>
                        <p className="text-[11px] mt-1">অনুগ্রহ করে ফিল্টার পরিবর্তন করুন বা নতুন অ্যাট্রিবিউট যোগ করুন।</p>
                        <button
                          onClick={openCreateModal}
                          className="mt-4 px-4 py-2 bg-shubban-primary text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> নতুন অ্যাট্রিবিউট তৈরি করুন
                        </button>
                      </td>
                    </tr>
                  ) : (
                    attributes.map((attr) => {
                      const isExpanded = expandedRows[attr.id];
                      const isSelected = selectedAttrIds.includes(attr.id);

                      return (
                        <React.Fragment key={attr.id}>
                          <tr
                            className={`hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors ${
                              isSelected ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectAttr(attr.id, e.target.checked)}
                                className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold cursor-pointer"
                              />
                            </td>

                            {/* Name & Code */}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleRowExpand(attr.id)}
                                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 rounded transition-transform"
                                  title="ভ্যালু প্রিভিউ টগল করুন"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-shubban-gold" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                                <div>
                                  <div className="font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                    <span>{attr.name}</span>
                                    {attr.isVariant && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-sans font-semibold">
                                        ভ্যারিয়েন্ট
                                      </span>
                                    )}
                                    {attr.isRequired && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-sans font-semibold">
                                        আবশ্যক
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-stone-500 mt-0.5 flex items-center gap-2">
                                    <span className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300">
                                      {attr.code}
                                    </span>
                                    <span>{attr.slug}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 text-[11px] font-semibold">
                                {ATTRIBUTE_TYPES.find((t) => t.value === attr.type)?.label.split(' ')[0] || attr.type}
                              </span>
                            </td>

                            {/* Group */}
                            <td className="p-4">
                              {attr.group ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-[11px]">
                                  <Layers className="w-3 h-3" />
                                  <span>{attr.group.name}</span>
                                </span>
                              ) : (
                                <span className="text-stone-400 text-[11px] italic">কোনো গ্রুপ নেই</span>
                              )}
                            </td>

                            {/* Values Preview */}
                            <td className="p-4">
                              <div className="flex flex-wrap items-center gap-1 max-w-xs">
                                {attr.values.slice(0, 4).map((val) => (
                                  <span
                                    key={val.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-700 dark:text-stone-300 font-medium"
                                  >
                                    {val.colorHex && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-stone-300 dark:border-stone-600"
                                        style={{ backgroundColor: val.colorHex }}
                                      />
                                    )}
                                    <span>{val.name}</span>
                                  </span>
                                ))}
                                {attr.values.length > 4 && (
                                  <button
                                    onClick={() => toggleRowExpand(attr.id)}
                                    className="text-[10px] text-shubban-gold font-bold hover:underline"
                                  >
                                    +{toBengaliNumber(attr.values.length - 4)}টি আরো
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Product Usage */}
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-stone-700 dark:text-stone-300">
                                <Package className="w-3.5 h-3.5 text-stone-400" />
                                {toBengaliNumber(attr._count.assignments)}
                              </span>
                            </td>

                            {/* Order */}
                            <td className="p-4 text-center font-mono font-bold text-stone-600 dark:text-stone-300">
                              {toBengaliNumber(attr.displayOrder)}
                            </td>

                            {/* Status */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleStatus(attr)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all ${
                                  attr.status === 'ACTIVE'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                                    : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                                }`}
                              >
                                {attr.status === 'ACTIVE' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> সক্রিয়
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" /> নিষ্ক্রিয়
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingAttribute(attr)}
                                  className="p-1.5 text-stone-500 hover:text-shubban-gold hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                  title="বিবরণ দেখুন"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => openValueManager(attr)}
                                  className="p-1.5 text-stone-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                  title="ভ্যালু ম্যানেজ করুন"
                                >
                                  <Grid className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => openEditModal(attr)}
                                  className="p-1.5 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                                  title="এডিট করুন"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDuplicateAttribute(attr)}
                                  className="p-1.5 text-stone-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors"
                                  title="ডুপ্লিকেট করুন"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'attribute',
                                      id: attr.id,
                                      name: attr.name,
                                    })
                                  }
                                  className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Values Preview Row */}
                          {isExpanded && (
                            <tr className="bg-stone-50/80 dark:bg-stone-900/40">
                              <td colSpan={9} className="p-4 pl-12 border-b border-stone-200/60 dark:border-stone-800">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                                      <Palette className="w-3.5 h-3.5 text-shubban-gold" />
                                      <span>{attr.name}-এর সকল ভ্যালু তালিকা ({toBengaliNumber(attr.values.length)}টি):</span>
                                    </h4>
                                    <button
                                      onClick={() => openValueManager(attr)}
                                      className="text-xs text-shubban-gold hover:underline font-bold flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> ভ্যালু যোগ বা সম্পাদনা
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {attr.values.map((v) => (
                                      <div
                                        key={v.id}
                                        className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center gap-2 text-xs shadow-xs"
                                      >
                                        {v.colorHex && (
                                          <span
                                            className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-stone-600 shrink-0"
                                            style={{ backgroundColor: v.colorHex }}
                                          />
                                        )}
                                        {v.swatchImage && (
                                          <Image
                                            src={v.swatchImage}
                                            alt={v.name}
                                            width={16}
                                            height={16}
                                            className="w-4 h-4 rounded object-cover"
                                          />
                                        )}
                                        <span className="font-semibold text-stone-800 dark:text-stone-200">{v.name}</span>
                                        {v.code && (
                                          <span className="text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-900 px-1 rounded">
                                            {v.code}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Unified Pagination Bar */}
            <div className="p-4 bg-stone-50/60 dark:bg-stone-900/40 border-t border-stone-200 dark:border-stone-800">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalRecords}
                itemsPerPage={limit}
                itemName="বৈশিষ্ট্য"
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => {
                  setLimit(s);
                  setPage(1);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ATTRIBUTE GROUPS MANAGEMENT                        */}
      {/* ========================================================= */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                অ্যাট্রিবিউট গ্রুপ ব্যবস্থাপনা (Attribute Groups)
              </h3>
              <p className="text-xs text-stone-500">
                বৈশিষ্ট্যসমূহকে বিভাগ অনুযায়ী গুছিয়ে রাখুন (যেমন: ফিজিক্যাল মাপ, টেকনিক্যাল স্পেসিফিকেশন, ফেব্রিক ডিটেইল ইত্যাদি)
              </p>
            </div>
            <button
              onClick={() => {
                setGroupModalMode('create');
                setEditingGroupId(null);
                setGroupForm({ name: '', slug: '', description: '', displayOrder: groups.length + 1, status: 'ACTIVE' });
                setShowGroupModal(true);
              }}
              className="px-4 py-2 bg-shubban-primary hover:bg-shubban-primaryHover text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> নতুন গ্রুপ তৈরি
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-shubban-darkCard p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm relative group hover:border-shubban-gold/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-shubban-gold font-mono font-bold text-xs">
                      ক্রম #{toBengaliNumber(group.displayOrder)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        group.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {group.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base mb-1">{group.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 line-clamp-2">
                    {group.description || 'কোনো বিবরণ যোগ করা হয়নি।'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">
                    সংযুক্ত অ্যাট্রিবিউট: {toBengaliNumber(group._count?.attributes || 0)}টি
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setGroupModalMode('edit');
                        setEditingGroupId(group.id);
                        setGroupForm({
                          name: group.name,
                          slug: group.slug,
                          description: group.description || '',
                          displayOrder: group.displayOrder,
                          status: group.status,
                        });
                        setShowGroupModal(true);
                      }}
                      className="p-1.5 text-stone-500 hover:text-emerald-600 rounded-lg transition-colors"
                      title="এডিট"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'group',
                          id: group.id,
                          name: group.name,
                        })
                      }
                      className="p-1.5 text-stone-500 hover:text-rose-600 rounded-lg transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PRODUCT VARIANT STUDIO & COMBINATION GENERATOR     */}
      {/* ========================================================= */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Step 1: Product Selector */}
          <div className="bg-white dark:bg-shubban-darkCard p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-shubban-gold" />
                  <span>ধাপ ১: পণ্য নির্বাচন করুন (Select Product)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  যে পণ্যের জন্য অ্যাট্রিবিউট অ্যাসাইন করতে ও স্বয়ংক্রিয় ভ্যারিয়েন্ট তৈরি করতে চান তা সার্চ করে সিলেক্ট করুন
                </p>
              </div>

              {/* Product Live Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="পণ্যের নাম দিয়ে সার্চ করুন..."
                  value={productSearchQuery}
                  onChange={(e) => searchProducts(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-shubban-gold/40"
                />

                {/* Dropdown Search Results */}
                {productSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl max-h-64 overflow-y-auto z-40 divide-y divide-stone-100 dark:divide-stone-800">
                    {productSearchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          loadProductDetails(prod.id);
                          setProductSearchResults([]);
                          setProductSearchQuery(prod.title);
                        }}
                        className="p-3 hover:bg-stone-50 dark:hover:bg-stone-800/80 cursor-pointer flex items-center gap-3 transition-colors"
                      >
                        <Image
                          src={prod.coverImage || '/placeholder-book.png'}
                          alt={prod.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{prod.title}</p>
                          <p className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                            <span>মূল্য: {formatTaka(prod.price)}</span>
                            <span>ভ্যারিয়েন্ট: {toBengaliNumber(prod._count?.variants || 0)}টি</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Currently Selected Product Banner */}
            {selectedProduct && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-shubban-gold/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={selectedProduct.coverImage || '/placeholder-book.png'}
                    alt={selectedProduct.title}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-xl object-cover border border-amber-500/30"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-shubban-gold">
                      নির্বাচিত পণ্য
                    </span>
                    <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                      {selectedProduct.title}
                    </h4>
                    <p className="text-xs text-stone-500 flex items-center gap-3 mt-0.5">
                      <span>মূল মূল্য: {formatTaka(selectedProduct.price)}</span>
                      <span>বর্তমান স্টক: {toBengaliNumber(selectedProduct.stockQuantity)}</span>
                      <span>বিদ্যমান ভ্যারিয়েন্ট: {toBengaliNumber(productVariants.length)}টি</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSingleVariantModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>কাস্টম ভ্যারিয়েন্ট যোগ</span>
                  </button>
                  <button
                    onClick={handleSaveProductAttributes}
                    className="px-4 py-2 rounded-xl bg-shubban-primary hover:bg-shubban-primaryHover text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-shubban-primary/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>অ্যাসাইনমেন্ট সেভ করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 & 3: Only when product is selected */}
          {selectedProduct && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Product Attributes Assignment (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-shubban-darkCard p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <div>
                      <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                        ধাপ ২: পণ্যের অ্যাট্রিবিউট নির্ধারণ
                      </h4>
                      <p className="text-[11px] text-stone-400">এই পণ্যের জন্য কোন কোন বৈশিষ্ট্য প্রযোজ্য</p>
                    </div>

                    {/* Add attribute dropdown */}
                    <select
                      onChange={(e) => {
                        const attrId = e.target.value;
                        if (!attrId) return;
                        const fullAttr = allStoreAttributes.find((a) => a.id === attrId);
                        if (!fullAttr) return;

                        if (productAssignments.some((a) => a.attributeId === attrId)) {
                          addToast('error', 'এই অ্যাট্রিবিউটটি ইতিমধ্যে যুক্ত আছে।');
                          return;
                        }

                        setProductAssignments((prev) => [
                          ...prev,
                          {
                            attributeId: fullAttr.id,
                            attribute: fullAttr,
                            isRequired: fullAttr.isRequired,
                            isVariant: fullAttr.isVariant,
                            defaultValue: '',
                            values: fullAttr.values.map((v) => ({ valueId: v.id, value: v })),
                          },
                        ]);
                        e.target.value = '';
                      }}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none"
                    >
                      <option value="">+ অ্যাট্রিবিউট যোগ করুন</option>
                      {allStoreAttributes.map((sa) => (
                        <option key={sa.id} value={sa.id}>
                          {sa.name} ({sa.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {productAssignments.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <Sliders className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold">কোনো অ্যাট্রিবিউট যুক্ত করা হয়নি।</p>
                      <p className="text-[10px] mt-0.5">উপরের ড্রপডাউন থেকে সাইজ, কালার বা অন্যান্য বৈশিষ্ট্য যোগ করুন।</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {productAssignments.map((assignment, index) => {
                        const fullAttr = allStoreAttributes.find((a) => a.id === assignment.attributeId);
                        const assignedValIds = (assignment.values || []).map((v: any) => v.valueId || v.id);

                        return (
                          <div
                            key={assignment.attributeId}
                            className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                                  {fullAttr?.name || assignment.attribute?.name}
                                </span>
                                <span className="text-[10px] font-mono bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300">
                                  {fullAttr?.code}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  setProductAssignments((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                                className="text-stone-400 hover:text-rose-500 p-1"
                                title="বাদ দিন"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Toggles: Required & Is Variant */}
                            <div className="flex items-center gap-4 text-[11px] text-stone-600 dark:text-stone-400">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={assignment.isRequired}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setProductAssignments((prev) =>
                                      prev.map((a, i) => (i === index ? { ...a, isRequired: checked } : a))
                                    );
                                  }}
                                  className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold"
                                />
                                <span>আবশ্যক (Required)</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={assignment.isVariant}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setProductAssignments((prev) =>
                                      prev.map((a, i) => (i === index ? { ...a, isVariant: checked } : a))
                                    );
                                    if (checked) {
                                      setSelectedVariantAttrIds((prev) =>
                                        prev.includes(assignment.attributeId)
                                          ? prev
                                          : [...prev, assignment.attributeId]
                                      );
                                    }
                                  }}
                                  className="rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                  ভ্যারিয়েন্ট তৈরি করবে (Variant Generator)
                                </span>
                              </label>
                            </div>

                            {/* Values Selection for this Product */}
                            <div>
                              <label className="text-[10px] font-bold text-stone-400 block mb-1">
                                অনুমোদিত ভ্যালুসমূহ ({fullAttr?.values.length || 0}টির মধ্যে):
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {fullAttr?.values.map((v) => {
                                  const isSelected = assignedValIds.includes(v.id);
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        setProductAssignments((prev) =>
                                          prev.map((a, i) => {
                                            if (i !== index) return a;
                                            const currentValIds = (a.values || []).map(
                                              (val: any) => val.valueId || val.id
                                            );
                                            const newValIds = isSelected
                                              ? currentValIds.filter((id: string) => id !== v.id)
                                              : [...currentValIds, v.id];
                                            return {
                                              ...a,
                                              values: newValIds.map((id: string) => ({ valueId: id })),
                                            };
                                          })
                                        );
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                                        isSelected
                                          ? 'bg-shubban-primary text-white border-shubban-primary shadow-xs'
                                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-shubban-gold'
                                      }`}
                                    >
                                      {v.colorHex && (
                                        <span
                                          className="w-2.5 h-2.5 rounded-full border border-stone-300"
                                          style={{ backgroundColor: v.colorHex }}
                                        />
                                      )}
                                      <span>{v.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Combination Generator Controls */}
                <div className="bg-white dark:bg-shubban-darkCard p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                    <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-shubban-gold" />
                      <span>ধাপ ৩: ভ্যারিয়েন্ট কম্বিনেশন জেনারেটর</span>
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      ভ্যারিয়েন্ট-যোগ্য অ্যাট্রিবিউটগুলো টিক দিয়ে সব সম্ভাব্য কম্বিনেশন স্বয়ংক্রিয়ভাবে তৈরি করুন
                    </p>
                  </div>

                  {/* Pick which attributes to combine */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      কম্বিনেশনে অন্তর্ভুক্তির জন্য অ্যাট্রিবিউট টিক দিন:
                    </label>
                    <div className="space-y-1.5">
                      {productAssignments
                        .filter((a) => a.isVariant)
                        .map((a) => {
                          const fullAttr = allStoreAttributes.find((sa) => sa.id === a.attributeId);
                          const isChecked = selectedVariantAttrIds.includes(a.attributeId);
                          return (
                            <label
                              key={a.attributeId}
                              className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs cursor-pointer hover:bg-stone-100"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedVariantAttrIds((prev) => [...prev, a.attributeId]);
                                  } else {
                                    setSelectedVariantAttrIds((prev) =>
                                      prev.filter((id) => id !== a.attributeId)
                                    );
                                  }
                                }}
                                className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold"
                              />
                              <span className="font-bold text-stone-800 dark:text-stone-200">
                                {fullAttr?.name || a.attribute?.name}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                ({toBengaliNumber((a.values || []).length)}টি ভ্যালু)
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Defaults: Price, Stock, SKU */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 block mb-1">
                        ডিফল্ট মূল্য (BDT)
                      </label>
                      <input
                        type="number"
                        value={generatorDefaultPrice}
                        onChange={(e) => setGeneratorDefaultPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 block mb-1">
                        ডিফল্ট স্টক সংখ্যা
                      </label>
                      <input
                        type="number"
                        value={generatorDefaultStock}
                        onChange={(e) => setGeneratorDefaultStock(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePreviewCombinations}
                    className="w-full py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-shubban-gold font-bold text-xs flex items-center justify-center gap-2 border border-shubban-gold/30 transition-all"
                  >
                    <Grid className="w-4 h-4" />
                    <span>কম্বিনেশন প্রিভিউ দেখুন (Generate Combinations)</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Combination Preview & Generated Variants Table (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Combination Preview Box (If previewed) */}
                {combinationPreview.length > 0 && (
                  <div className="bg-white dark:bg-shubban-darkCard p-5 rounded-3xl border-2 border-shubban-gold/40 shadow-md space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                      <div>
                        <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-shubban-gold" />
                          <span>কম্বিনেশন প্রিভিউ ({toBengaliNumber(combinationPreview.length)}টি পাওয়া গেছে)</span>
                        </h4>
                        <p className="text-[11px] text-stone-400">
                          যে কম্বিনেশনগুলো তৈরি করতে চান না সেগুলো আন-চেক (Exclude) করতে পারেন
                        </p>
                      </div>

                      <button
                        onClick={handleGenerateVariants}
                        disabled={isGeneratingVariants}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isGeneratingVariants ? 'তৈরি হচ্ছে...' : 'সবগুলো তৈরি করুন'}</span>
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 border rounded-2xl">
                      {combinationPreview.map((combo) => {
                        const isExcluded = excludedCombos[combo.name];
                        return (
                          <div
                            key={combo.key}
                            className={`p-3 flex items-center justify-between text-xs transition-colors ${
                              isExcluded
                                ? 'bg-stone-100/60 dark:bg-stone-900/40 opacity-50'
                                : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!isExcluded}
                                onChange={(e) => {
                                  setExcludedCombos((prev) => ({
                                    ...prev,
                                    [combo.name]: !e.target.checked,
                                  }));
                                }}
                                className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold"
                              />
                              <div>
                                <span className="font-bold text-stone-900 dark:text-stone-100">{combo.name}</span>
                                <span className="text-[10px] font-mono text-stone-400 ml-2">SKU: {combo.sku}</span>
                              </div>
                            </label>

                            <div className="flex items-center gap-4 text-xs font-mono">
                              <span className="text-shubban-gold font-bold">{formatTaka(combo.price)}</span>
                              <span className="text-stone-500">স্টক: {toBengaliNumber(combo.stockQuantity)}</span>
                              {combo.isExisting && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-sans font-bold">
                                  বিদ্যমান
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Existing Variants Table for this Product */}
                <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-purple-600" />
                        <span>পণ্যের সকল ভ্যারিয়েন্ট ({toBengaliNumber(productVariants.length)}টি)</span>
                      </h4>
                      <p className="text-xs text-stone-500">মূল্য, স্টক, SKU ও ভ্যারিয়েন্ট স্ট্যাটাস নিয়ন্ত্রণ করুন</p>
                    </div>

                    {/* Bulk Variant Actions Trigger */}
                    {selectedVariantIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-600">
                          {toBengaliNumber(selectedVariantIds.length)}টি সিলেক্টেড
                        </span>
                        <button
                          onClick={() => setShowBulkVariantModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Settings className="w-3.5 h-3.5" /> বাল্ক এডিট
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800">
                        <tr>
                          <th className="p-3 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={
                                productVariants.length > 0 &&
                                selectedVariantIds.length === productVariants.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVariantIds(productVariants.map((v) => v.id));
                                } else {
                                  setSelectedVariantIds([]);
                                }
                              }}
                              className="rounded border-stone-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </th>
                          <th className="p-3">ভ্যারিয়েন্ট নাম</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">মূল্য</th>
                          <th className="p-3 text-center">স্টক</th>
                          <th className="p-3 text-center">স্ট্যাটাস</th>
                          <th className="p-3 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                        {isLoadingVariants ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-stone-400">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                              <p>ভ্যারিয়েন্ট লোড হচ্ছে...</p>
                            </td>
                          </tr>
                        ) : productVariants.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-stone-400">
                              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="font-semibold text-stone-600 dark:text-stone-300">
                                এই পণ্যের জন্য কোনো ভ্যারিয়েন্ট নেই।
                              </p>
                              <p className="text-[11px] mt-0.5">
                                বামপাশের জেনারেটর ব্যবহার করে বা কাস্টম ভ্যারিয়েন্ট যোগ করে তৈরি করুন।
                              </p>
                            </td>
                          </tr>
                        ) : (
                          productVariants.map((variant) => {
                            const isSelected = selectedVariantIds.includes(variant.id);
                            return (
                              <tr
                                key={variant.id}
                                className={`hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors ${
                                  isSelected ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''
                                }`}
                              >
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedVariantIds((prev) => [...prev, variant.id]);
                                      } else {
                                        setSelectedVariantIds((prev) =>
                                          prev.filter((id) => id !== variant.id)
                                        );
                                      }
                                    }}
                                    className="rounded border-stone-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                </td>

                                <td className="p-3">
                                  <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                    {variant.image && (
                                      <Image
                                        src={variant.image}
                                        alt={variant.name}
                                        width={24}
                                        height={24}
                                        className="w-6 h-6 rounded object-cover border"
                                      />
                                    )}
                                    <span>{variant.name}</span>
                                  </div>
                                </td>

                                <td className="p-3 font-mono font-bold text-stone-600 dark:text-stone-300">
                                  {variant.sku || 'N/A'}
                                </td>

                                <td className="p-3 font-bold font-mono text-shubban-green dark:text-shubban-gold">
                                  {formatTaka(variant.price)}
                                  {variant.salePrice && (
                                    <span className="block text-[10px] text-stone-400 line-through">
                                      {formatTaka(variant.salePrice)}
                                    </span>
                                  )}
                                </td>

                                <td className="p-3 text-center font-mono font-bold">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                                      variant.stockQuantity > 5
                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700'
                                        : variant.stockQuantity > 0
                                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700'
                                        : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700'
                                    }`}
                                  >
                                    {toBengaliNumber(variant.stockQuantity)}
                                  </span>
                                </td>

                                <td className="p-3 text-center">
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                      variant.status === 'ACTIVE'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700'
                                        : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {variant.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                  </span>
                                </td>

                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => openEditVariantModal(variant)}
                                      className="p-1.5 text-stone-500 hover:text-emerald-600 rounded-lg transition-colors"
                                      title="এডিট"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteConfirm({
                                          type: 'variant',
                                          id: variant.id,
                                          name: variant.name,
                                        })
                                      }
                                      className="p-1.5 text-stone-500 hover:text-rose-600 rounded-lg transition-colors"
                                      title="মুছুন"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT ATTRIBUTE FORM (TABBED MODAL)         */}
      {/* ========================================================= */}
      {showAttrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-shubban-gold" />
                  <span>{modalMode === 'create' ? 'নতুন প্রোডাক্ট অ্যাট্রিবিউট তৈরি' : 'অ্যাট্রিবিউট সম্পাদনা'}</span>
                </h3>
                <p className="text-xs text-stone-500">পণ্যের বৈশিষ্ট্য, ধরন ও ডিফল্ট মান নির্ধারণ করুন</p>
              </div>
              <button
                onClick={() => setShowAttrModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Section Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-stone-100 dark:border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setAttrFormTab('basic')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  attrFormTab === 'basic'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                ১. সাধারণ তথ্য
              </button>
              <button
                type="button"
                onClick={() => setAttrFormTab('config')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  attrFormTab === 'config'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                ২. কনফিগারেশন
              </button>
              <button
                type="button"
                onClick={() => setAttrFormTab('values')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  attrFormTab === 'values'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                ৩. প্রারম্ভিক ভ্যালুসমূহ
              </button>
              <button
                type="button"
                onClick={() => setAttrFormTab('advanced')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  attrFormTab === 'advanced'
                    ? 'border-shubban-gold text-shubban-gold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                ৪. অ্যাডভান্সড সেটিংস
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAttribute} className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* TAB A: BASIC INFO */}
              {attrFormTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        অ্যাট্রিবিউট নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: সাইজ, রং, বোতলের মাপ"
                        value={attrForm.name}
                        onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-shubban-gold/40"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        কোড (Code)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: SIZE, COLOR, VOLUME"
                        value={attrForm.code}
                        onChange={(e) => setAttrForm({ ...attrForm, code: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-shubban-gold/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        স্লাগ (Slug)
                      </label>
                      <input
                        type="text"
                        placeholder="অটো জেনারেট হবে (যেমন: size, color)"
                        value={attrForm.slug}
                        onChange={(e) => setAttrForm({ ...attrForm, slug: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        ডিসপ্লে লেবেল (Display Label)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: পছন্দের সাইজ নির্বাচন করুন"
                        value={attrForm.displayLabel}
                        onChange={(e) => setAttrForm({ ...attrForm, displayLabel: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      বিবরণ (Description)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="এই অ্যাট্রিবিউটের প্রয়োজনীয় ব্যাখ্যা..."
                      value={attrForm.description}
                      onChange={(e) => setAttrForm({ ...attrForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                </div>
              )}

              {/* TAB B: CONFIGURATION */}
              {attrFormTab === 'config' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                      অ্যাট্রিবিউটের ধরন (Supported Attribute Type)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ATTRIBUTE_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSelected = attrForm.type === t.value;
                        return (
                          <div
                            key={t.value}
                            onClick={() => setAttrForm({ ...attrForm, type: t.value })}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'bg-amber-500/10 border-shubban-gold text-stone-900 dark:text-stone-100 shadow-xs'
                                : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                isSelected ? 'bg-shubban-gold text-white' : 'bg-stone-200 dark:bg-stone-800'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">{t.label}</p>
                              <p className="text-[10px] text-stone-400 mt-0.5">{t.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        সংযুক্ত গ্রুপ (Attribute Group)
                      </label>
                      <select
                        value={attrForm.groupId}
                        onChange={(e) => setAttrForm({ ...attrForm, groupId: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                      >
                        <option value="">কোনো গ্রুপ নেই</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        ক্রমিক নম্বর (Display Order)
                      </label>
                      <input
                        type="number"
                        value={attrForm.displayOrder}
                        onChange={(e) => setAttrForm({ ...attrForm, displayOrder: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB C: VALUES MANAGEMENT */}
              {attrFormTab === 'values' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-500">
                      এই অ্যাট্রিবিউটের সম্ভাব্য মানগুলো যোগ করুন (যেমন: S, M, L বা লাল, নীল, কালো):
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setAttrForm({
                          ...attrForm,
                          values: [
                            ...attrForm.values,
                            {
                              name: '',
                              code: '',
                              colorHex: '#000000',
                              swatchImage: '',
                              displayOrder: attrForm.values.length + 1,
                            },
                          ],
                        })
                      }
                      className="px-3 py-1 rounded-xl bg-shubban-primary text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> ভ্যালু সারি যোগ
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {attrForm.values.map((v, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center gap-3 text-xs"
                      >
                        <span className="font-mono text-stone-400 font-bold">{i + 1}.</span>

                        {/* Name */}
                        <input
                          type="text"
                          placeholder="ভ্যালু নাম (যেমন: লাল / L)"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...attrForm.values];
                            updated[i].name = e.target.value;
                            setAttrForm({ ...attrForm, values: updated });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                        />

                        {/* Code */}
                        <input
                          type="text"
                          placeholder="কোড (ঐচ্ছিক)"
                          value={v.code}
                          onChange={(e) => {
                            const updated = [...attrForm.values];
                            updated[i].code = e.target.value;
                            setAttrForm({ ...attrForm, values: updated });
                          }}
                          className="w-24 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-[11px]"
                        />

                        {/* Color Picker if Color Swatch */}
                        {attrForm.type === 'COLOR_SWATCH' && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={v.colorHex || '#000000'}
                              onChange={(e) => {
                                const updated = [...attrForm.values];
                                updated[i].colorHex = e.target.value;
                                setAttrForm({ ...attrForm, values: updated });
                              }}
                              className="w-7 h-7 rounded border border-stone-300 cursor-pointer p-0"
                            />
                            <span className="font-mono text-[10px] text-stone-500">{v.colorHex}</span>
                          </div>
                        )}

                        {/* Image Swatch URL if Image Swatch */}
                        {attrForm.type === 'IMAGE_SWATCH' && (
                          <input
                            type="text"
                            placeholder="ইমেজ URL"
                            value={v.swatchImage}
                            onChange={(e) => {
                              const updated = [...attrForm.values];
                              updated[i].swatchImage = e.target.value;
                              setAttrForm({ ...attrForm, values: updated });
                            }}
                            className="w-28 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-[10px]"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const updated = attrForm.values.filter((_, idx) => idx !== i);
                            setAttrForm({ ...attrForm, values: updated });
                          }}
                          className="text-stone-400 hover:text-rose-500 p-1"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB D: ADVANCED CONFIGURATION */}
              {attrFormTab === 'advanced' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          ভ্যারিয়েন্ট তৈরি করবে (Use for Variant Generation)
                        </p>
                        <p className="text-[10px] text-stone-400">
                          অন থাকলে এটি দিয়ে বিভিন্ন SKU ও মূল্যের কম্বিনেশন তৈরি করা যাবে
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={attrForm.isVariant}
                        onChange={(e) => setAttrForm({ ...attrForm, isVariant: e.target.checked })}
                        className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-stone-200 dark:border-stone-800">
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          পণ্য পেইজে স্পেসিফিকেশন হিসেবে প্রদর্শন
                        </p>
                        <p className="text-[10px] text-stone-400">
                          গ্রাহক পণ্যের বিবরণ টেবিলে এই বৈশিষ্ট্যটি দেখতে পাবেন
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={attrForm.showOnProduct}
                        onChange={(e) => setAttrForm({ ...attrForm, showOnProduct: e.target.checked })}
                        className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-stone-200 dark:border-stone-800">
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          সাইট ফিল্টারে ব্যবহারযোগ্য (Use in Product Filters)
                        </p>
                        <p className="text-[10px] text-stone-400">
                          শপ পেইজের সাইডবারে এই বৈশিষ্ট্য দিয়ে গ্রাহক ফিল্টার করতে পারবেন
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={attrForm.useInFilter}
                        onChange={(e) => setAttrForm({ ...attrForm, useInFilter: e.target.checked })}
                        className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-stone-200 dark:border-stone-800">
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          আবশ্যক ফিল্ড (Is Required)
                        </p>
                        <p className="text-[10px] text-stone-400">
                          অর্ডারের সময় ক্রেতাকে অবশ্যই এটি নির্বাচন করতে হবে
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={attrForm.isRequired}
                        onChange={(e) => setAttrForm({ ...attrForm, isRequired: e.target.checked })}
                        className="rounded border-stone-300 text-shubban-gold focus:ring-shubban-gold w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAttrModal(false)}
                  className="px-4 py-2 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-600 text-xs font-bold hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-shubban-primary hover:bg-shubban-primaryHover text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{modalMode === 'create' ? 'সংরক্ষণ করুন' : 'আপডেট সম্পন্ন করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: VALUES QUICK MANAGER MODAL                       */}
      {/* ========================================================= */}
      {valManagerAttr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-shubban-gold" />
                  <span>{valManagerAttr.name}-এর ভ্যালুসমূহ পরিচালনা</span>
                </h3>
                <p className="text-xs text-stone-500">ভ্যালু যোগ, ক্রম পরিবর্তন, কালার সোয়াচ ও নিষ্ক্রিয়করণ</p>
              </div>
              <button onClick={() => setValManagerAttr(null)} className="text-stone-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Add Single Value Form */}
              <form onSubmit={handleAddSingleValue} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    নতুন ভ্যালু যোগ করুন:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBulkValInput(!showBulkValInput)}
                    className="text-[11px] text-shubban-gold hover:underline font-bold"
                  >
                    {showBulkValInput ? 'একক ফর্ম' : 'একসাথে একাধিক ভ্যালু (Bulk Add)'}
                  </button>
                </div>

                {!showBulkValInput ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="ভ্যালুর নাম (যেমন: XL)"
                      value={newValName}
                      onChange={(e) => setNewValName(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border bg-white dark:bg-stone-800"
                      required
                    />
                    <input
                      type="text"
                      placeholder="কোড (ঐচ্ছিক)"
                      value={newValCode}
                      onChange={(e) => setNewValCode(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border bg-white dark:bg-stone-800 font-mono"
                    />
                    {valManagerAttr.type === 'COLOR_SWATCH' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newValColor}
                          onChange={(e) => setNewValColor(e.target.value)}
                          className="w-8 h-8 rounded border p-0 cursor-pointer"
                        />
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-shubban-primary text-white text-xs font-bold rounded-xl"
                        >
                          যোগ করুন
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="py-2 bg-shubban-primary text-white text-xs font-bold rounded-xl"
                      >
                        যোগ করুন
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder="কমা বা নতুন লাইন দিয়ে ভ্যালুগুলো লিখুন (যেমন: XS, S, M, L, XL, XXL)"
                      value={bulkValText}
                      onChange={(e) => setBulkValText(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border bg-white dark:bg-stone-800"
                    />
                    <button
                      type="button"
                      onClick={handleBulkAddValues}
                      className="px-4 py-2 bg-shubban-primary text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      সবগুলো একসাথে যোগ করুন
                    </button>
                  </div>
                )}
              </form>

              {/* Existing Values List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-500">
                  বর্তমান ভ্যালু তালিকা ({toBengaliNumber(valManagerAttr.values.length)}টি):
                </span>
                <div className="divide-y divide-stone-100 dark:divide-stone-800 border rounded-2xl overflow-hidden">
                  {valManagerAttr.values.map((val) => (
                    <div
                      key={val.id}
                      className="p-3 flex items-center justify-between bg-white dark:bg-stone-900/60 hover:bg-stone-50 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {val.colorHex && (
                          <span
                            className="w-4 h-4 rounded-full border border-stone-300"
                            style={{ backgroundColor: val.colorHex }}
                          />
                        )}
                        <span className="font-bold text-stone-900 dark:text-stone-100">{val.name}</span>
                        {val.code && (
                          <span className="text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                            {val.code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteValue(val.id, valManagerAttr.id)}
                          className="text-stone-400 hover:text-rose-500 p-1"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ATTRIBUTE DETAILS MODAL                          */}
      {/* ========================================================= */}
      {viewingAttribute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-shubban-gold uppercase">অ্যাট্রিবিউট বিবরণ</span>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {viewingAttribute.name}
                </h3>
              </div>
              <button onClick={() => setViewingAttribute(null)} className="text-stone-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900">
                <span className="text-stone-400 block text-[10px]">কোড</span>
                <span className="font-mono font-bold">{viewingAttribute.code}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900">
                <span className="text-stone-400 block text-[10px]">ধরন</span>
                <span className="font-bold">{viewingAttribute.type}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900">
                <span className="text-stone-400 block text-[10px]">সংযুক্ত গ্রুপ</span>
                <span className="font-bold">{viewingAttribute.group?.name || 'কোনো গ্রুপ নেই'}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900">
                <span className="text-stone-400 block text-[10px]">মোট ভ্যালু</span>
                <span className="font-bold font-mono">{toBengaliNumber(viewingAttribute.values.length)}টি</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-stone-400 font-bold block text-[11px]">ভ্যালুসমূহ:</span>
              <div className="flex flex-wrap gap-1.5">
                {viewingAttribute.values.map((v) => (
                  <span
                    key={v.id}
                    className="px-2.5 py-1 rounded-lg border bg-stone-50 dark:bg-stone-800 text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    {v.colorHex && (
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.colorHex }} />
                    )}
                    <span>{v.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setViewingAttribute(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ATTRIBUTE GROUP ADD/EDIT MODAL                   */}
      {/* ========================================================= */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{groupModalMode === 'create' ? 'নতুন অ্যাট্রিবিউট গ্রুপ' : 'গ্রুপ সম্পাদনা'}</span>
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-stone-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">গ্রুপের নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: টেকনিক্যাল স্পেসিফিকেশন"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="গ্রুপের উদ্দেশ্য..."
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">ক্রমিক নম্বর</label>
                <input
                  type="number"
                  value={groupForm.displayOrder}
                  onChange={(e) => setGroupForm({ ...groupForm, displayOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-900"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border text-stone-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-shubban-primary text-white font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: INDIVIDUAL VARIANT EDIT MODAL                    */}
      {/* ========================================================= */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase">ভ্যারিয়েন্ট এডিটর</span>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {editingVariant.name}
                </h3>
              </div>
              <button onClick={() => setEditingVariant(null)} className="text-stone-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIndividualVariant} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">ভ্যারিয়েন্ট নাম *</label>
                  <input
                    type="text"
                    value={variantForm.name || ''}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={variantForm.sku || ''}
                    onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">বিক্রয় মূল্য (BDT) *</label>
                  <input
                    type="number"
                    value={variantForm.price || 0}
                    onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">অফার মূল্য (Sale)</label>
                  <input
                    type="number"
                    value={variantForm.salePrice || ''}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        salePrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">স্টক সংখ্যা *</label>
                  <input
                    type="number"
                    value={variantForm.stockQuantity || 0}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, stockQuantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">স্ট্যাটাস</label>
                  <select
                    value={variantForm.status}
                    onChange={(e) => setVariantForm({ ...variantForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border"
                  >
                    <option value="ACTIVE">সক্রিয় (Active)</option>
                    <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">স্টক স্ট্যাটাস</label>
                  <select
                    value={variantForm.stockStatus}
                    onChange={(e) => setVariantForm({ ...variantForm, stockStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border"
                  >
                    <option value="IN_STOCK">ইন স্টক (In Stock)</option>
                    <option value="OUT_OF_STOCK">স্টক শেষ (Out of Stock)</option>
                    <option value="BACKORDER">ব্যাকঅর্ডার (Backorder)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">ভ্যারিয়েন্ট ছবি URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/variant-image.jpg"
                  value={variantForm.image || ''}
                  onChange={(e) => setVariantForm({ ...variantForm, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-[11px]"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-3.5 py-1.5 rounded-xl border text-stone-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-shubban-primary text-white font-bold"
                >
                  আপডেট সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: VARIANT BULK EDIT MODAL                          */}
      {/* ========================================================= */}
      {showBulkVariantModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <span>বাল্ক ভ্যারিয়েন্ট এডিটর ({toBengaliNumber(selectedVariantIds.length)}টি নির্বাচিত)</span>
              </h3>
              <button onClick={() => setShowBulkVariantModal(false)} className="text-stone-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">অ্যাকশন নির্বাচন করুন:</label>
                <select
                  value={bulkVariantAction}
                  onChange={(e) => setBulkVariantAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border"
                >
                  <option value="bulk_price">মূল্য সমন্বয় (Bulk Price Update)</option>
                  <option value="bulk_stock">স্টক সমন্বয় (Bulk Stock Update)</option>
                  <option value="bulk_status">স্ট্যাটাস আপডেট (Bulk Status)</option>
                  <option value="bulk_sku">নতুন SKU জেনারেশন (Bulk SKU)</option>
                  <option value="bulk_delete">একসাথে মুছে ফেলা (Bulk Delete)</option>
                </select>
              </div>

              {/* Bulk Price Config */}
              {bulkVariantAction === 'bulk_price' && (
                <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={bulkPriceType}
                      onChange={(e) => setBulkPriceType(e.target.value as any)}
                      className="px-2 py-1.5 rounded-lg border text-xs"
                    >
                      <option value="set">নির্দিষ্ট মূল্যে সেট করুন</option>
                      <option value="adjust_fixed">টাকা বৃদ্ধি/হ্রাস (+/-)</option>
                      <option value="adjust_percent">শতাংশ বৃদ্ধি/হ্রাস (+/- %)</option>
                    </select>
                    <input
                      type="number"
                      placeholder="মান (BDT / %)"
                      value={bulkPriceValue}
                      onChange={(e) => setBulkPriceValue(Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg border font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Bulk Stock Config */}
              {bulkVariantAction === 'bulk_stock' && (
                <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={bulkStockType}
                      onChange={(e) => setBulkStockType(e.target.value as any)}
                      className="px-2 py-1.5 rounded-lg border text-xs"
                    >
                      <option value="set">নির্দিষ্ট স্টকে সেট করুন</option>
                      <option value="adjust">স্টক বৃদ্ধি/হ্রাস (+/-)</option>
                    </select>
                    <input
                      type="number"
                      placeholder="সংখ্যা"
                      value={bulkStockValue}
                      onChange={(e) => setBulkStockValue(Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg border font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Bulk Status Config */}
              {bulkVariantAction === 'bulk_status' && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900">
                  <select
                    value={bulkStatusValue}
                    onChange={(e) => setBulkStatusValue(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border"
                  >
                    <option value="ACTIVE">সক্রিয় করুন (ACTIVE)</option>
                    <option value="INACTIVE">নিষ্ক্রিয় করুন (INACTIVE)</option>
                  </select>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkVariantModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border text-stone-600"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkVariantAction}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold"
                >
                  কার্যকর করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: ADD SINGLE CUSTOM VARIANT                        */}
      {/* ========================================================= */}
      {showSingleVariantModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>কাস্টম ভ্যারিয়েন্ট যোগ</span>
              </h3>
              <button onClick={() => setShowSingleVariantModal(false)} className="text-stone-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleVariant} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">ভ্যারিয়েন্টের নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: ৬ মিলি সুবাস বা লাল সংস্করণ"
                  value={singleVariantForm.name}
                  onChange={(e) => setSingleVariantForm({ ...singleVariantForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">বিক্রয় মূল্য (BDT) *</label>
                  <input
                    type="number"
                    value={singleVariantForm.price}
                    onChange={(e) => setSingleVariantForm({ ...singleVariantForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">স্টক সংখ্যা *</label>
                  <input
                    type="number"
                    value={singleVariantForm.stockQuantity}
                    onChange={(e) =>
                      setSingleVariantForm({ ...singleVariantForm, stockQuantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">SKU (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="অটো জেনারেট হবে"
                  value={singleVariantForm.sku}
                  onChange={(e) => setSingleVariantForm({ ...singleVariantForm, sku: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border font-mono"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSingleVariantModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border text-stone-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-shubban-primary text-white font-bold"
                >
                  তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG (DELETE)                              */}
      {/* ========================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                মুছে ফেলার নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনি কি নিশ্চিতভাবে <span className="font-bold text-rose-600">&quot;{deleteConfirm.name}&quot;</span> মুছে ফেলতে চান?
              </p>
              <p className="text-[11px] text-stone-400 mt-1">এই অ্যাকশনটি অপরিবর্তনীয়।</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

