import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
  Calendar,
  Layers,
  Tag,
  IndianRupee,
  History,
  CheckCircle2,
  Shield,
  X,
  TrendingUp,
  Sparkles,
  Building2,
  ShoppingBag,
  Store,
  RefreshCw
} from 'lucide-react';
import type { Product, CatalogType } from '../types';
import { AddProductModal } from '../components/Modals/AddProductModal';
import { EditProductModal } from '../components/Modals/EditProductModal';
import { getCountryFlag } from '../data/countriesData';
import { resolveProductImage, getProductImageFallback } from '../utils/productImages';

const CATEGORIES = [
  'All Categories',
  'Vegetables',
  'Leafy Greens',
  'Fruits',
  'Exotic Veggies',
  'Herbs & Seasoning',
  'Root Veggies',
  'Gourds & Squashes',
  'Beans & Peas',
  'Mushrooms',
  'Chillies & Peppers',
  'Citrus & Melons',
  'Dal & Pulses',
  'Dairy & Supplies'
];

export const InventoryPage: React.FC = () => {
  const { products, selectedProduct, setSelectedProduct, deleteProduct, setIsAddProductOpen, seedDatabaseToFirebase } = useApp();

  // Catalog tab & filter states
  const [activeCatalogTab, setActiveCatalogTab] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCatalogFilter, setSelectedCatalogFilter] = useState('All Catalogs');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedStockFilter, setSelectedStockFilter] = useState('Stock Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals & Drawer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);

  // Helper to reliably determine catalog type for every product
  const getProductCatalogType = (p: Product): 'B2C' | 'B2B' | 'Both' => {
    if (p.catalogType === 'B2C' || p.catalogType === 'B2B' || p.catalogType === 'Both') {
      return p.catalogType;
    }
    if (p.targetCatalog === 'B2C' || p.targetCatalog === 'B2B' || p.targetCatalog === 'Both') {
      return p.targetCatalog;
    }
    const nameLower = (p.name || '').toLowerCase();
    const unitLower = (p.unit || '').toLowerCase();
    if (
      nameLower.startsWith('b2b') ||
      unitLower.includes('bag (50') ||
      unitLower.includes('sack')
    ) {
      return 'B2B';
    }
    // All fresh fruits, vegetables, leafy greens and dual-channel produce are available in Both B2C and B2B
    return 'Both';
  };

  // Dynamic counts for Catalogs
  const totalCount = products.length;
  const b2bCount = products.filter(p => {
    const c = getProductCatalogType(p);
    return c === 'B2B' || c === 'Both';
  }).length;
  const b2cCount = products.filter(p => {
    const c = getProductCatalogType(p);
    return c === 'B2C' || c === 'Both';
  }).length;
  const dualCount = products.filter(p => getProductCatalogType(p) === 'Both').length;

  // Filter calculation
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const pCatType = getProductCatalogType(p);

    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      pCatType.toLowerCase().includes(term);

    // Flexible Category Match
    let matchesCategory = true;
    if (selectedCategory !== 'All Categories') {
      const cleanFilterCat = selectedCategory.toLowerCase().replace('fresh ', '').replace(' veggies', '').replace('farm ', '').trim();
      const pCat = p.category.toLowerCase().trim();
      matchesCategory = pCat === selectedCategory.toLowerCase().trim() || pCat.includes(cleanFilterCat);
    }

    const matchesStatus = selectedStatus === 'All Status' || p.status === selectedStatus;

    let matchesStock = true;
    if (selectedStockFilter === 'In Stock') matchesStock = p.stock > p.minimumStock;
    else if (selectedStockFilter === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= p.minimumStock;
    else if (selectedStockFilter === 'Out of Stock') matchesStock = p.stock === 0;

    // Segment Tab Filter
    let matchesCatalogTab = true;
    if (activeCatalogTab === 'B2B') {
      matchesCatalogTab = pCatType === 'B2B' || pCatType === 'Both';
    } else if (activeCatalogTab === 'B2C') {
      matchesCatalogTab = pCatType === 'B2C' || pCatType === 'Both';
    }

    // Dropdown Catalog Filter
    let matchesCatalogDropdown = true;
    if (selectedCatalogFilter === 'B2B Wholesale Only') {
      matchesCatalogDropdown = pCatType === 'B2B';
    } else if (selectedCatalogFilter === 'B2C Retail Only') {
      matchesCatalogDropdown = pCatType === 'B2C';
    } else if (selectedCatalogFilter === 'Dual-Channel (Both)') {
      matchesCatalogDropdown = pCatType === 'Both';
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesStock && matchesCatalogTab && matchesCatalogDropdown;
  });

  // Active product
  const activeProduct = drawerProduct || selectedProduct || filteredProducts[0] || products[0];

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleOpenDetails = (p: Product) => {
    setDrawerProduct(p);
    setSelectedProduct(p);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setActiveModalProduct(p);
    setSelectedProduct(p);
    setIsEditModalOpen(true);
  };

  const handleDelete = (p: Product) => {
    if (window.confirm(`Are you sure you want to delete ${p.name} from catalog?`)) {
      deleteProduct(p.id);
      if (drawerProduct?.id === p.id) {
        setIsDetailsOpen(false);
      }
    }
  };

  const handleSyncCatalog = async () => {
    try {
      setIsSyncing(true);
      if (seedDatabaseToFirebase) {
        await seedDatabaseToFirebase();
      }
      alert('Products catalog synced successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = (catalogScope?: 'ALL' | 'B2B' | 'B2C') => {
    const scope = catalogScope || activeCatalogTab;
    const itemsToExport = scope === 'B2B'
      ? products.filter(p => getProductCatalogType(p) === 'B2B' || getProductCatalogType(p) === 'Both')
      : scope === 'B2C'
      ? products.filter(p => getProductCatalogType(p) === 'B2C' || getProductCatalogType(p) === 'Both')
      : filteredProducts;

    const headers = ['ID', 'Name', 'Catalog Channel', 'Category', 'Unit', 'Purchase Price (INR)', 'Sale Price (INR)', 'B2B Price (INR)', 'B2C Price (INR)', 'Stock', 'Status'];
    const rows = itemsToExport.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      getProductCatalogType(p),
      p.category,
      p.unit,
      p.purchasePrice,
      p.salePrice,
      p.b2bPrice || p.salePrice,
      p.b2cPrice || p.salePrice,
      p.stock,
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmerbox_${scope.toLowerCase()}_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics count computed dynamically
  const inStockCount = products.filter(p => (Number(p.stock) || 0) > (Number(p.minimumStock) || 20)).length;
  const lowStockCount = products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.minimumStock) || 20)).length;
  const outOfStockCount = products.filter(p => (Number(p.stock) || 0) <= 0).length;

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1700px] mx-auto space-y-4 sm:space-y-6">
      
      {/* 1. TOP DUAL CATALOG SWITCHER BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/farmerbox_app_icon.png"
                alt="FarmerBox App Icon"
                className="w-12 h-12 rounded-xl object-contain border border-slate-200 shadow-xs p-0.5 bg-white shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Products Catalog ({totalCount})</h2>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Dual B2B & B2C Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Two segregated catalogs: <strong>🛍️ B2C Fresh Retail</strong> (Households, Veggies & Fruits) & <strong>🏢 B2B Wholesale</strong> (Hotels, Commercial Crates & Sacks)
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Catalog Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 self-start lg:self-auto">
            {/* All Products Tab */}
            <button
              onClick={() => {
                setActiveCatalogTab('ALL');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCatalogTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Products</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  activeCatalogTab === 'ALL'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {totalCount}
              </span>
            </button>

            {/* B2C Retail Tab (Fresh Vegetables & Fruits) */}
            <button
              onClick={() => {
                setActiveCatalogTab('B2C');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCatalogTab === 'B2C'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${activeCatalogTab === 'B2C' ? 'text-emerald-100' : 'text-emerald-600'}`} />
              <span>🛍️ B2C (Retail)</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  activeCatalogTab === 'B2C'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {b2cCount}
              </span>
            </button>

            {/* B2B Wholesale Tab */}
            <button
              onClick={() => {
                setActiveCatalogTab('B2B');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCatalogTab === 'B2B'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${activeCatalogTab === 'B2B' ? 'text-blue-100' : 'text-blue-600'}`} />
              <span>🏢 B2B (Wholesale)</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  activeCatalogTab === 'B2B'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {b2bCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-[#F0FDF4] p-4 rounded-xl border border-emerald-100/80 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Active View Count</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-0.5">
              {filteredProducts.length}
            </h3>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">
              {activeCatalogTab === 'ALL' ? 'Total Catalog items' : activeCatalogTab === 'B2C' ? 'B2C Retail Items' : 'B2B Wholesale Items'}
            </p>
          </div>
        </div>

        {/* Card 2: B2C Retail Items */}
        <div className="bg-[#ECFDF5] p-4 rounded-xl border border-emerald-200/80 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">B2C Retail</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-0.5">{b2cCount}</h3>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">Fresh Veggies & Fruits</p>
          </div>
        </div>

        {/* Card 3: B2B Wholesale Items */}
        <div className="bg-[#EFF6FF] p-4 rounded-xl border border-blue-100/80 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">B2B Wholesale</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-0.5">{b2bCount}</h3>
            <p className="text-[10px] text-blue-700 font-bold mt-1">Hotel Sacks & Crates</p>
          </div>
        </div>

        {/* Card 4: Low Stock Attention */}
        <div className="bg-[#FFF7ED] p-4 rounded-xl border border-amber-100/80 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Low Stock</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-0.5">{lowStockCount}</h3>
            <p className="text-[10px] text-amber-700 font-bold mt-1">Needs reordering</p>
          </div>
        </div>

        {/* Card 5: In Stock Items */}
        <div className="bg-[#FAF5FF] p-4 rounded-xl border border-purple-100/80 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">In Stock Ready</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-0.5">{inStockCount}</h3>
            <p className="text-[10px] text-purple-700 font-bold mt-1">Ready for dispatch</p>
          </div>
        </div>
      </div>

      {/* 3. VISUAL CATEGORY FILTER BAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" /> Browse Categories
          </span>
          <span className="text-[11px] font-bold text-emerald-700">
            {filteredProducts.length} items in view
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'All Categories', label: 'All Items', emoji: '🌟', img: null },
            { id: 'Vegetables', label: 'Vegetables', emoji: '🥦', img: '/images/categories/vegetables.jpg' },
            { id: 'Fruits', label: 'Fresh Fruits', emoji: '🍎', img: '/images/categories/fresh_fruits.jpg' },
            { id: 'Leafy Greens', label: 'Leafy Greens', emoji: '🥬', img: null },
            { id: 'Herbs & Seasoning', label: 'Herbs & Spices', emoji: '🌿', img: '/images/categories/herbs_spices.jpg' },
            { id: 'Exotic Veggies', label: 'Exotic & Global', emoji: '✈️', img: '/images/categories/exotic_global.jpg' },
            { id: 'Dal & Pulses', label: 'Dal & Pulses', emoji: '🌾', img: '/images/categories/dal_pulses.jpg' },
            { id: 'Dairy & Supplies', label: 'Dairy & Paneer', emoji: '🧀', img: null },
            { id: 'Root Veggies', label: 'Root Veggies', emoji: '🥕', img: null },
            { id: 'Chillies & Peppers', label: 'Chillies & Peppers', emoji: '🌶️', img: null }
          ].map(cat => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'All Categories'
              ? products.length
              : products.filter(p => {
                  const clean = cat.id.toLowerCase().replace('fresh ', '').replace(' veggies', '').trim();
                  return p.category.toLowerCase().includes(clean);
                }).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer border shadow-2xs ${
                  isSelected
                    ? 'bg-[#15803d] text-white border-[#15803d] shadow-xs scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300'
                }`}
              >
                {cat.img ? (
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="w-6 h-6 rounded-md object-cover shadow-2xs shrink-0 border border-black/5"
                  />
                ) : (
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {cat.emoji}
                  </div>
                )}
                <div className="text-left leading-none pr-0.5">
                  <p className={`text-[11px] font-black whitespace-nowrap ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {cat.label}
                  </p>
                  <span
                    className={`text-[9px] font-semibold inline-block mt-0.5 ${
                      isSelected ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {count} items
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeCatalogTab === 'ALL' ? 'all' : activeCatalogTab} produce (e.g. Tomato, Kiwi, Onion, Apple)...`}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          {/* Catalog Channel Filter */}
          <div className="relative">
            <select
              value={selectedCatalogFilter}
              onChange={e => {
                setSelectedCatalogFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            >
              <option value="All Catalogs">All Catalog Channels</option>
              <option value="B2C Retail Only">🛍️ B2C Retail Only</option>
              <option value="B2B Wholesale Only">🏢 B2B Wholesale Only</option>
              <option value="Dual-Channel (Both)">⚡ Dual-Channel (Both)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stock Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStockFilter}
              onChange={e => {
                setSelectedStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            >
              <option value="Stock Status">Stock Status</option>
              <option value="In Stock">In Stock (&gt;50)</option>
              <option value="Low Stock">Low Stock (&lt;50)</option>
              <option value="Out of Stock">Out of Stock (0)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All Categories');
              setSelectedCatalogFilter('All Catalogs');
              setSelectedStatus('All Status');
              setSelectedStockFilter('Stock Status');
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncCatalog}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Sync latest 61 products into real-time database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Catalog'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* 5. FULL WIDTH PRODUCTS TABLE SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <span>
                {activeCatalogTab === 'ALL'
                  ? 'All Products Catalog'
                  : activeCatalogTab === 'B2C'
                  ? '🛍️ B2C Fresh Retail Catalog (Vegetables & Fruits)'
                  : '🏢 B2B Wholesale Catalog'}
              </span>
              <span className="text-slate-500 font-medium text-base">({filteredProducts.length})</span>
            </h3>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Real-Time
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCSV('B2C')}
              className="px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export only B2C Retail items"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Export B2C
            </button>
            <button
              onClick={() => handleExportCSV('B2B')}
              className="px-3 py-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export only B2B Wholesale items"
            >
              <Building2 className="w-3.5 h-3.5" /> Export B2B
            </button>
            <button
              onClick={() => handleExportCSV('ALL')}
              className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 font-sans">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 font-semibold text-slate-500">#</th>
                <th className="py-3 px-3 font-semibold text-slate-600 text-center">Catalog Channel</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Image</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Product Name & SKU</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Category</th>
                <th className="py-3 px-3 text-center font-semibold text-slate-600">Unit / Pack</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-600">Cost (₹)</th>
                <th className="py-3 px-3 text-center font-semibold text-slate-600">B2C & B2B Pricing (₹)</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-600">Stock Level</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-600">Status</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    No matching products found in {activeCatalogTab === 'ALL' ? 'catalog' : `${activeCatalogTab} catalog`}.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const displayIndex = (currentPage - 1) * pageSize + idx + 1;
                  const isSelected = activeProduct?.id === p.id;
                  const profitMargin = Math.round(((p.salePrice - p.purchasePrice) / p.salePrice) * 100);
                  const pChannel = getProductCatalogType(p);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenDetails(p)}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-slate-50/80 ${
                        isSelected && isDetailsOpen ? 'bg-emerald-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-400 text-xs">{displayIndex}</td>
                      
                      {/* Catalog Type Badge */}
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        {pChannel === 'B2C' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold shadow-2xs">
                            <ShoppingBag className="w-3 h-3 text-emerald-600" /> B2C Retail
                          </span>
                        )}
                        {pChannel === 'B2B' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold shadow-2xs">
                            <Building2 className="w-3 h-3 text-blue-600" /> B2B Wholesale
                          </span>
                        )}
                        {pChannel === 'Both' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold shadow-2xs">
                            <Sparkles className="w-3 h-3 text-purple-600" /> Dual (B2B + B2C)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <img
                          src={resolveProductImage(p.name, p.category, p.image)}
                          alt={p.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getProductImageFallback(p.name, p.category);
                          }}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-white shrink-0 shadow-2xs hover:scale-105 transition-transform duration-200"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm tracking-tight hover:text-emerald-700 transition-colors">
                              {p.name}
                            </span>
                            {p.addedBy === 'Admin' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                              </span>
                            )}
                            {p.category === 'Fruits' && (
                              p.isImported ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold shadow-2xs">
                                  <span>{p.countryFlag || getCountryFlag(p.originCountry)}</span>
                                  <span>{p.originCountry || 'Imported'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                                  <span>🇮🇳</span>
                                  <span>Domestic</span>
                                </span>
                              )
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-normal">
                            SKU #{p.id} • {p.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium text-xs">{p.category}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-bold text-xs border border-slate-200/60">
                          {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-medium text-xs">₹{p.purchasePrice}</td>
                      <td className="py-3 px-3 text-center text-xs" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 min-w-[130px]">
                          {/* Section 1: B2C Retail Price */}
                          <div className="flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-emerald-300/80 rounded-lg shadow-2xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                              <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" /> B2C
                            </span>
                            <span className="font-black text-emerald-950 text-xs">
                              ₹{p.b2cPrice ?? p.salePrice}
                            </span>
                          </div>

                          {/* Section 2: B2B Wholesale Price */}
                          <div className="flex items-center justify-between px-2.5 py-1 bg-blue-50 border border-blue-300/80 rounded-lg shadow-2xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5 text-blue-600" /> B2B
                            </span>
                            <span className="font-black text-blue-950 text-xs">
                              ₹{p.b2bPrice ?? p.salePrice}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-block ${
                            p.stock === 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : p.stock <= p.minimumStock
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block ${
                            p.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => handleOpenDetails(p)}
                            className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 flex items-center justify-center cursor-pointer transition-colors border border-sky-100 shadow-2xs"
                            title="View Product Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center cursor-pointer transition-colors border border-emerald-100 shadow-2xs"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(p)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center cursor-pointer transition-colors border border-rose-100 shadow-2xs"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 text-xs text-slate-500 gap-3 border-t border-slate-100">
          <span>
            Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-7 h-7 px-2 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#16A34A] text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. SLIDE-OVER PRODUCT DETAILS DRAWER */}
      {isDetailsOpen && drawerProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsDetailsOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-base text-slate-800">Product Details</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(drawerProduct)}
                    className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Hero Image & Badges */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white group max-w-xs mx-auto">
                  <img
                    src={resolveProductImage(drawerProduct.name, drawerProduct.category, drawerProduct.image)}
                    alt={drawerProduct.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getProductImageFallback(drawerProduct.name, drawerProduct.category);
                    }}
                    className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Catalog Badge Overlay */}
                  <div className="absolute top-2.5 left-2.5">
                    {getProductCatalogType(drawerProduct) === 'B2C' && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" /> B2C Retail
                      </span>
                    )}
                    {getProductCatalogType(drawerProduct) === 'B2B' && (
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> B2B Wholesale
                      </span>
                    )}
                    {getProductCatalogType(drawerProduct) === 'Both' && (
                      <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Dual Channel
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-xs ${
                        drawerProduct.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : drawerProduct.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {drawerProduct.status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                      {drawerProduct.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">
                    SKU #{drawerProduct.id} • {drawerProduct.category}
                  </p>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {drawerProduct.description || `Fresh high quality ${drawerProduct.name} sourced directly for commercial kitchens and retail.`}
                  </p>
                </div>

                {/* Catalog Channel Information Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Catalog Target Channel</span>
                    <span className="text-[11px] font-extrabold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                      Channel: {getProductCatalogType(drawerProduct)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">B2C Retail Price</span>
                      <span className="text-sm font-extrabold text-emerald-700">₹{drawerProduct.b2cPrice || drawerProduct.salePrice}</span>
                      <span className="text-[10px] text-slate-400 block">per {drawerProduct.unit}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">B2B Wholesale Price</span>
                      <span className="text-sm font-extrabold text-blue-700">₹{drawerProduct.b2bPrice || drawerProduct.salePrice}</span>
                      <span className="text-[10px] text-slate-400 block">per {drawerProduct.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Fruit Origin & Import Banner */}
                {(drawerProduct.category === 'Fruits' || drawerProduct.isImported) && (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-sky-50/90 border border-blue-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl filter drop-shadow-xs">
                        {drawerProduct.countryFlag || (drawerProduct.isImported ? getCountryFlag(drawerProduct.originCountry) : '🇮🇳')}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                          {drawerProduct.isImported ? '✈️ Imported Fruit Produce' : '🇮🇳 Domestic Farm Produce'}
                        </span>
                        <h5 className="font-extrabold text-slate-900 text-sm">
                          {drawerProduct.originCountry || (drawerProduct.isImported ? 'Imported' : 'India')}
                        </h5>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${
                        drawerProduct.isImported
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {drawerProduct.isImported ? 'Imported' : 'Domestic'}
                    </span>
                  </div>
                )}

                {/* Price & Economics Card */}
                <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Sale & Pricing</span>
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                      Unit: {drawerProduct.unit}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Selling Price</span>
                      <span className="text-xl font-black text-emerald-700">₹{drawerProduct.salePrice}</span>
                      <span className="text-[10px] text-slate-500 block">per {drawerProduct.unit}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cost Price</span>
                      <span className="text-xl font-black text-slate-700">₹{drawerProduct.purchasePrice}</span>
                      <span className="text-[10px] text-slate-500 block">per {drawerProduct.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Inventory Stock Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                    <span className="text-emerald-800/80 block text-[10.5px] font-bold">Current Stock</span>
                    <span className="font-extrabold text-emerald-950 text-base mt-0.5 block">
                      {drawerProduct.stock} {drawerProduct.unit}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10.5px] font-bold">Minimum Stock</span>
                    <span className="font-extrabold text-slate-800 text-base mt-0.5 block">
                      {drawerProduct.minimumStock} {drawerProduct.unit}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10.5px] font-bold">Category</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{drawerProduct.category}</span>
                  </div>

                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
                    <span className="text-amber-800/80 block text-[10.5px] font-bold">Added By</span>
                    <span className="font-bold text-amber-900 mt-0.5 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-600" /> {drawerProduct.addedBy || 'Admin'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleDelete(drawerProduct)}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleOpenEdit(drawerProduct)}
                    className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Product
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Product Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditProductModal
        product={activeModalProduct}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
