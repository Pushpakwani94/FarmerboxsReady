import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
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
  Calendar,
  Layers,
  Tag,
  IndianRupee,
  CheckCircle2,
  Shield,
  X,
  TrendingUp,
  Sparkles,
  RefreshCw,
  LayoutGrid,
  List,
  ArrowUpDown,
  Check,
  Globe2,
  Percent,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import type { Product, CatalogType } from '../types';
import { AddProductModal } from '../components/Modals/AddProductModal';
import { EditProductModal } from '../components/Modals/EditProductModal';
import { getCountryFlag } from '../data/countriesData';
import { resolveProductImage, getProductImageFallback } from '../utils/productImages';

const B2C_CATEGORY_TABS = [
  'All B2C Produce',
  'Vegetables',
  'Fruits',
  'Leafy Greens',
  'Exotic Veggies',
  'Herbs & Seasoning',
  'Root Veggies'
];

export const B2CCatalogPage: React.FC = () => {
  const { products, selectedProduct, setSelectedProduct, deleteProduct, updateProduct, seedDatabaseToFirebase, confirmAction } = useApp();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All B2C Produce');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All Stock');
  const [selectedOriginFilter, setSelectedOriginFilter] = useState('All Origins');
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc' | 'stockDesc'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals & Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditProduct, setActiveEditProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);

  // Inline stock adjustment state
  const [quickStockEditingId, setQuickStockEditingId] = useState<number | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<string>('');

  // Helper to reliably check if a product belongs to B2C Retail
  const isB2CProduct = (p: Product): boolean => {
    const cat = p.catalogType || p.targetCatalog;
    if (cat === 'B2C' || cat === 'Both') return true;
    if (cat === 'B2B') return false;

    const nameLower = (p.name || '').toLowerCase();
    const unitLower = (p.unit || '').toLowerCase();

    // Wholesale sack indicators
    if (
      nameLower.startsWith('b2b') ||
      unitLower.includes('bag (50') ||
      unitLower.includes('sack') ||
      unitLower.includes('crate (20') ||
      unitLower.includes('crate (15')
    ) {
      return false;
    }

    // Default to B2C for consumer portions
    return true;
  };

  // Base B2C Products
  const b2cProducts = products.filter(isB2CProduct);

  // KPIs
  const totalB2C = b2cProducts.length;
  const vegCount = b2cProducts.filter(p => p.category === 'Vegetables' || p.category === 'Root Veggies' || p.category === 'Gourds & Squashes' || p.category === 'Beans & Peas').length;
  const fruitsCount = b2cProducts.filter(p => p.category === 'Fruits' || p.category === 'Citrus & Melons').length;
  const leafyCount = b2cProducts.filter(p => p.category === 'Leafy Greens' || p.category === 'Herbs & Seasoning').length;
  const lowStockCount = b2cProducts.filter(p => p.stock > 0 && p.stock <= p.minimumStock).length;
  const outOfStockCount = b2cProducts.filter(p => p.stock === 0).length;
  const inStockCount = b2cProducts.filter(p => p.stock > p.minimumStock).length;

  // Filtered B2C Products
  const filteredProducts = b2cProducts.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.originCountry && p.originCountry.toLowerCase().includes(term)) ||
      (p.unit && p.unit.toLowerCase().includes(term));

    let matchesCategory = true;
    if (selectedCategoryTab !== 'All B2C Produce') {
      const cleanTab = selectedCategoryTab.toLowerCase().replace('fresh ', '').replace(' veggies', '').replace(' produce', '').trim();
      const pCat = p.category.toLowerCase().trim();
      matchesCategory = pCat === selectedCategoryTab.toLowerCase().trim() || pCat.includes(cleanTab);
    }

    let matchesStock = true;
    if (selectedStockFilter === 'In Stock') matchesStock = p.stock > p.minimumStock;
    else if (selectedStockFilter === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= p.minimumStock;
    else if (selectedStockFilter === 'Out of Stock') matchesStock = p.stock === 0;

    let matchesOrigin = true;
    if (selectedOriginFilter === 'Local Farm Fresh') matchesOrigin = !p.isImported;
    else if (selectedOriginFilter === 'Imported Premium') matchesOrigin = !!p.isImported;

    return matchesSearch && matchesCategory && matchesStock && matchesOrigin;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceAsc') {
      const priceA = a.b2cPrice || a.salePrice;
      const priceB = b.b2cPrice || b.salePrice;
      return priceA - priceB;
    }
    if (sortBy === 'priceDesc') {
      const priceA = a.b2cPrice || a.salePrice;
      const priceB = b.b2cPrice || b.salePrice;
      return priceB - priceA;
    }
    if (sortBy === 'stockDesc') {
      return b.stock - a.stock;
    }
    return a.name.localeCompare(b.name);
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Bulk Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  // CRUD Actions
  const handleOpenDetails = (p: Product) => {
    setDrawerProduct(p);
    setSelectedProduct(p);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setActiveEditProduct(p);
    setSelectedProduct(p);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (p: Product) => {
    setDeleteConfirmProduct(p);
  };

  const confirmDeleteProduct = () => {
    if (deleteConfirmProduct) {
      deleteProduct(deleteConfirmProduct.id);
      if (drawerProduct?.id === deleteConfirmProduct.id) {
        setIsDetailsOpen(false);
      }
      setDeleteConfirmProduct(null);
    }
  };

  const handleToggleActiveStatus = (p: Product) => {
    const nextStatus = p.status === 'Active' ? 'Out of Stock' : 'Active';
    updateProduct(p.id, { status: nextStatus });
  };

  const handleSaveQuickStock = (p: Product) => {
    const newStock = parseInt(quickStockValue, 10);
    if (!isNaN(newStock) && newStock >= 0) {
      const newStatus = newStock === 0 ? 'Out of Stock' : newStock <= p.minimumStock ? 'Low Stock' : 'Active';
      updateProduct(p.id, { stock: newStock, status: newStatus });
    }
    setQuickStockEditingId(null);
    setQuickStockValue('');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    confirmAction({
      title: 'Delete Selected Products',
      message: `Are you sure you want to permanently delete these ${selectedIds.length} B2C products from the retail catalog?`,
      entityName: `${selectedIds.length} Products`,
      confirmLabel: 'Delete Products',
      type: 'danger',
      onConfirm: () => {
        selectedIds.forEach(id => deleteProduct(id));
        setSelectedIds([]);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Packaging Unit', 'Retail Price (₹)', 'Purchase Cost (₹)', 'Margin %', 'Stock Level', 'Min Stock Alert', 'Status', 'Origin'];
    const rows = sortedProducts.map(p => {
      const retPrice = p.b2cPrice || p.salePrice;
      const margin = retPrice > p.purchasePrice ? Math.round(((retPrice - p.purchasePrice) / retPrice) * 100) : 0;
      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        p.unit,
        retPrice,
        p.purchasePrice,
        `${margin}%`,
        p.stock,
        p.minimumStock,
        p.status,
        p.isImported ? (p.originCountry || 'Imported') : 'India'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmerbox_b2c_retail_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncCloud = async () => {
    try {
      setIsSyncing(true);
      if (seedDatabaseToFirebase) {
        await seedDatabaseToFirebase();
      }
      alert('B2C Catalog synchronized with Cloud Database successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-4 sm:p-6 text-white shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
            <span>Consumer & Retail Fresh Produce</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>B2C Fresh Retail Catalog</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/30 border border-emerald-400/40 text-emerald-100">
              {totalB2C} Items
            </span>
          </h1>
          <p className="text-emerald-100/80 text-xs lg:text-sm font-medium max-w-2xl leading-relaxed">
            Manage consumer household portion packs (1 KG, 500g, Pcs, Bunches) for fresh vegetables, leafy greens, and premium farm fruits with full real-time CRUD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-xs cursor-pointer shadow-2xs"
            title="Download CSV of B2C items"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSyncCloud}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-xs cursor-pointer shadow-2xs disabled:opacity-50"
            title="Synchronize catalog with cloud database"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-200 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Add B2C Produce</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total B2C</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{totalB2C}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Consumer packs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vegetables</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <span className="text-sm">🥦</span>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{vegCount}</div>
          <p className="text-[10px] text-green-600 font-bold mt-0.5">Farm fresh</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fruits</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <span className="text-sm">🍎</span>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{fruitsCount}</div>
          <p className="text-[10px] text-orange-600 font-bold mt-0.5">Local & Imported</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leafy Greens</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <span className="text-sm">🥬</span>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">{leafyCount}</div>
          <p className="text-[10px] text-teal-600 font-bold mt-0.5">Bunches & Herbs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low Stock</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 mt-2">{lowStockCount}</div>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">Needs reorder</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Stock</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2">{inStockCount}</div>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Ready to deliver</p>
        </div>
      </div>

      {/* Category Pills Tab Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {B2C_CATEGORY_TABS.map(tab => {
          const isSelected = selectedCategoryTab === tab;
          let count = totalB2C;
          if (tab === 'Vegetables') count = vegCount;
          else if (tab === 'Fruits') count = fruitsCount;
          else if (tab === 'Leafy Greens') count = leafyCount;
          else if (tab !== 'All B2C Produce') {
            count = b2cProducts.filter(p => p.category.toLowerCase().includes(tab.toLowerCase().replace('fresh ', '').replace(' veggies', ''))).length;
          }

          return (
            <button
              key={tab}
              onClick={() => {
                setSelectedCategoryTab(tab);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-[#15803d] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search B2C vegetables, fruits, origin, packaging..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stock Filter */}
            <select
              value={selectedStockFilter}
              onChange={e => {
                setSelectedStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter products by stock status"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-semibold cursor-pointer"
            >
              <option value="All Stock">All Stock Levels</option>
              <option value="In Stock">In Stock (&gt; Min)</option>
              <option value="Low Stock">Low Stock Alert</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {/* Origin Filter */}
            <select
              value={selectedOriginFilter}
              onChange={e => {
                setSelectedOriginFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter products by origin"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-semibold cursor-pointer"
            >
              <option value="All Origins">All Origins</option>
              <option value="Local Farm Fresh">🇮🇳 Local Farm Fresh</option>
              <option value="Imported Premium">✈️ Imported Premium</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Sort products by attribute"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-700 font-semibold cursor-pointer"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="priceAsc">Sort: Price (Low → High)</option>
              <option value="priceDesc">Sort: Price (High → Low)</option>
              <option value="stockDesc">Sort: Highest Stock</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (when items selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{selectedIds.length} B2C items selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Table or Grid View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="p-3.5">Produce Item</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Pack Unit</th>
                  <th className="p-3.5 text-center">B2C & B2B Pricing (₹)</th>
                  <th className="p-3.5">Cost & Margin</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No B2C Produce Found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter, or add a new B2C product.</p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-[#15803d] text-white font-bold rounded-xl text-xs hover:bg-[#166534] transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First B2C Item</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    const b2cPrice = p.b2cPrice || p.salePrice;
                    const margin = b2cPrice > p.purchasePrice ? Math.round(((b2cPrice - p.purchasePrice) / b2cPrice) * 100) : 0;
                    const flag = p.isImported ? getCountryFlag(p.originCountry) : '🇮🇳';
                    const stockRatio = Math.min(100, Math.round((p.stock / (p.minimumStock * 3 || 100)) * 100));

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? 'bg-emerald-50/50' : ''}`}
                      >
                        {/* Select checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(p.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Produce details */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group-hover:scale-105 transition-transform">
                              <img
                                src={resolveProductImage(p.name, p.category, p.image || (p as any).imageUrl)}
                                alt={p.name}
                                onError={e => {
                                  (e.target as HTMLElement).setAttribute('src', getProductImageFallback(p.category));
                                }}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 right-0 text-[10px] px-1 bg-black/60 rounded-tl text-white">
                                {flag}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {p.isImported && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                    Imported
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-slate-400">#{p.id}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">{p.originCountry || 'Pune Fresh'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                            {p.category}
                          </span>
                        </td>

                        {/* Packaging Unit */}
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            {p.unit || '1 KG'}
                          </span>
                        </td>

                        {/* B2C & B2B Price - Highlighted in bold in two distinct sections in same column */}
                        <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col gap-1 min-w-[130px]">
                            {/* Section 1: B2C Retail Price */}
                            <div className="flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-emerald-300/80 rounded-lg shadow-2xs">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" /> B2C
                              </span>
                              <span className="font-black text-emerald-950 text-xs">
                                ₹{b2cPrice}
                              </span>
                            </div>

                            {/* Section 2: B2B Wholesale Price */}
                            <div className="flex items-center justify-between px-2.5 py-1 bg-blue-50 border border-blue-300/80 rounded-lg shadow-2xs">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5 text-blue-600" /> B2B
                              </span>
                              <span className="font-black text-blue-950 text-xs">
                                ₹{p.b2bPrice ?? p.salePrice}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cost & Margin */}
                        <td className="p-3.5">
                          <div className="text-[11px] text-slate-600">
                            <span>Cost: ₹{p.purchasePrice}</span>
                            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                              <TrendingUp className="w-3 h-3" />
                              <span>+{margin}% Margin</span>
                            </div>
                          </div>
                        </td>

                        {/* Stock Level with inline quick edit */}
                        <td className="p-3.5">
                          {quickStockEditingId === p.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={quickStockValue}
                                onChange={e => setQuickStockValue(e.target.value)}
                                className="w-16 px-1.5 py-1 text-xs border border-emerald-500 rounded focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveQuickStock(p)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setQuickStockEditingId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setQuickStockEditingId(p.id);
                                setQuickStockValue(String(p.stock));
                              }}
                              className="cursor-pointer group/stock"
                              title="Click to edit stock level directly"
                            >
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <span>{p.stock} {p.unit}</span>
                                <Edit className="w-3 h-3 text-slate-300 group-hover/stock:text-emerald-600 opacity-0 group-hover/stock:opacity-100 transition-opacity" />
                              </div>
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200/60">
                                <div
                                  className={`h-full rounded-full ${
                                    p.stock === 0 ? 'bg-rose-500' : p.stock <= p.minimumStock ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${p.stock === 0 ? 5 : stockRatio}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-slate-400 mt-0.5">Min: {p.minimumStock} {p.unit}</p>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleActiveStatus(p)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              p.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                : p.status === 'Low Stock'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {p.status}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenDetails(p)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="View B2C Specifications"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit B2C Produce"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Produce"
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

          {/* Table Pagination */}
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-bold text-slate-800">
                {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)}
              </span>
              <span>of</span>
              <span className="font-bold text-slate-800">{filteredProducts.length}</span>
              <span>B2C items</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Items per page"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visual Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedProducts.map(p => {
            const b2cPrice = p.b2cPrice || p.salePrice;
            const flag = p.isImported ? getCountryFlag(p.originCountry) : '🇮🇳';
            const margin = b2cPrice > p.purchasePrice ? Math.round(((b2cPrice - p.purchasePrice) / b2cPrice) * 100) : 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={resolveProductImage(p.name, p.category, p.image || (p as any).imageUrl)}
                    alt={p.name}
                    onError={e => {
                      (e.target as HTMLElement).setAttribute('src', getProductImageFallback(p.category));
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                      B2C Retail
                    </span>
                    {p.isImported && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
                        <span>{flag}</span>
                        <span>{p.originCountry}</span>
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                      p.status === 'Active' ? 'bg-emerald-500 text-white' : p.status === 'Low Stock' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-emerald-700">{p.category}</span>
                      <span className="font-mono">#{p.id}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{p.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-normal">
                      {p.description || `Fresh premium ${p.name} packaged in standard consumer portions.`}
                    </p>
                  </div>

                  {/* Price & Stock info */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    <div className="space-y-1.5">
                      {/* B2C Price Pill */}
                      <div className="flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-lg">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                          <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" /> B2C Price
                        </span>
                        <span className="font-black text-emerald-950 text-xs">
                          ₹{b2cPrice} <span className="text-[10px] font-normal text-slate-500">/{p.unit}</span>
                        </span>
                      </div>

                      {/* B2B Price Pill */}
                      <div className="flex items-center justify-between px-2.5 py-1 bg-blue-50 border border-blue-300 rounded-lg">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5 text-blue-600" /> B2B Price
                        </span>
                        <span className="font-black text-blue-950 text-xs">
                          ₹{p.b2bPrice ?? p.salePrice} <span className="text-[10px] font-normal text-slate-500">/{p.unit}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Stock:</span>
                      <span className="font-bold text-slate-800">{p.stock} {p.unit}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenDetails(p)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="flex-1 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete B2C Product?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800">{deleteConfirmProduct.name}</strong> from the B2C Retail catalog? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Side Drawer */}
      {isDetailsOpen && drawerProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft">
            <div className="p-6 space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <ShoppingBag className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">B2C Produce Specs</h2>
                    <p className="text-xs text-slate-500 font-mono">Product #{drawerProduct.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Photo */}
              <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={resolveProductImage(drawerProduct.name, drawerProduct.category, drawerProduct.image || (drawerProduct as any).imageUrl)}
                  alt={drawerProduct.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-xs">
                    B2C Retail Item
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-black/60 text-white backdrop-blur-xs">
                    {drawerProduct.isImported ? getCountryFlag(drawerProduct.originCountry) : '🇮🇳'} {drawerProduct.originCountry || 'India'}
                  </span>
                </div>
              </div>

              {/* Basic Details */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{drawerProduct.category}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    drawerProduct.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {drawerProduct.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{drawerProduct.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">{drawerProduct.description}</p>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase">B2C Retail Price</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    ₹{drawerProduct.b2cPrice || drawerProduct.salePrice}
                    <span className="text-xs font-normal text-slate-500"> / {drawerProduct.unit}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Purchase Cost</span>
                  <div className="text-xl font-bold text-slate-700 mt-0.5">
                    ₹{drawerProduct.purchasePrice}
                    <span className="text-xs font-normal text-slate-500"> / {drawerProduct.unit}</span>
                  </div>
                </div>
              </div>

              {/* Stock & MOQ Specifications */}
              <div className="space-y-3 bg-white border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inventory & Order Limits</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Current Stock</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{drawerProduct.stock} {drawerProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Minimum Stock Alert</span>
                    <p className="font-bold text-amber-600 text-sm mt-0.5">{drawerProduct.minimumStock} {drawerProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Retail Pack Size</span>
                    <p className="font-bold text-slate-900 mt-0.5">{drawerProduct.unit || '1 KG'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">B2C MOQ</span>
                    <p className="font-bold text-emerald-700 mt-0.5">{drawerProduct.minOrderQty || 1} Unit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  handleOpenEdit(drawerProduct);
                }}
                className="flex-1 py-3 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Produce</span>
              </button>
              <button
                onClick={() => {
                  handleDeleteClick(drawerProduct);
                }}
                className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add B2C Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCatalogType="B2C"
        defaultCategory={selectedCategoryTab !== 'All B2C Produce' ? selectedCategoryTab : 'Vegetables'}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        product={activeEditProduct}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveEditProduct(null);
        }}
      />
    </div>
  );
};
