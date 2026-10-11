import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  CheckCircle2,
  Shield,
  X,
  Building2,
  ShoppingBag,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import type { Product } from '../types';
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
  const { products, selectedProduct, setSelectedProduct, deleteProduct, seedDatabaseToFirebase, confirmAction } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState('All Stock');
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

  // Helper to reliably determine catalog channel for any product
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
    return 'Both';
  };

  // Dynamic counts
  const totalCount = products.length;
  const inStockCount = products.filter(p => (Number(p.stock) || 0) > (Number(p.minimumStock) || 20)).length;
  const lowStockCount = products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.minimumStock) || 20)).length;
  const outOfStockCount = products.filter(p => (Number(p.stock) || 0) <= 0).length;

  // Filter products cleanly
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const pChannel = getProductCatalogType(p);

    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      String(p.id).includes(term);

    // Category filter
    let matchesCategory = true;
    if (selectedCategory !== 'All Categories') {
      const cleanFilterCat = selectedCategory.toLowerCase().replace('fresh ', '').replace(' veggies', '').replace('farm ', '').trim();
      const pCat = p.category.toLowerCase().trim();
      matchesCategory = pCat === selectedCategory.toLowerCase().trim() || pCat.includes(cleanFilterCat);
    }

    // Channel tab filter
    let matchesChannel = true;
    if (activeCatalogTab === 'B2B') {
      matchesChannel = pChannel === 'B2B' || pChannel === 'Both';
    } else if (activeCatalogTab === 'B2C') {
      matchesChannel = pChannel === 'B2C' || pChannel === 'Both';
    }

    // Stock status filter
    let matchesStock = true;
    if (selectedStockFilter === 'In Stock') matchesStock = p.stock > (p.minimumStock || 20);
    else if (selectedStockFilter === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= (p.minimumStock || 20);
    else if (selectedStockFilter === 'Out of Stock') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesChannel && matchesStock;
  });

  const activeProduct = drawerProduct || selectedProduct || filteredProducts[0] || products[0];

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => Number(p.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number | string) => {
    const numId = Number(id);
    setSelectedIds(prev => (prev.includes(numId) ? prev.filter(i => i !== numId) : [...prev, numId]));
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
    confirmAction({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${p.name}"? This item will be permanently removed from Firebase Firestore.`,
      entityName: p.name,
      confirmLabel: 'Delete Product',
      type: 'danger',
      onConfirm: () => {
        deleteProduct(p.id);
        if (drawerProduct?.id === p.id) {
          setIsDetailsOpen(false);
        }
      }
    });
  };

  const handleSyncCatalog = async () => {
    try {
      setIsSyncing(true);
      if (seedDatabaseToFirebase) {
        await seedDatabaseToFirebase();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Channel', 'Unit', 'Cost Price (INR)', 'Selling Price (INR)', 'Stock', 'Status'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      getProductCatalogType(p),
      p.unit,
      p.purchasePrice,
      p.salePrice,
      p.stock,
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `products_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-5">
      
      {/* 1. CLEAN HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Products Catalog</h1>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {totalCount} Total Products
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage fresh produce, live stock inventory, pricing, and product details.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncCatalog}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Sync products with Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Catalog'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4 METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Products</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none mt-0.5">{totalCount}</h3>
            <p className="text-[10px] text-emerald-800 font-bold mt-1">Active in Catalog</p>
          </div>
        </div>

        <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">In Stock Ready</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none mt-0.5">{inStockCount}</h3>
            <p className="text-[10px] text-sky-700 font-bold mt-1">Available for Orders</p>
          </div>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Low Stock</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none mt-0.5">{lowStockCount}</h3>
            <p className="text-[10px] text-amber-700 font-bold mt-1">Restock Required</p>
          </div>
        </div>

        <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
            <X className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Out of Stock</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none mt-0.5">{outOfStockCount}</h3>
            <p className="text-[10px] text-rose-700 font-bold mt-1">0 Available</p>
          </div>
        </div>
      </div>

      {/* 3. STREAMLINED SEARCH & FILTER BAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search produce by name, SKU, or category..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          {/* Channel Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-600">
            <button
              onClick={() => {
                setActiveCatalogTab('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCatalogTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              All Items ({totalCount})
            </button>
            <button
              onClick={() => {
                setActiveCatalogTab('B2C');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeCatalogTab === 'B2C'
                  ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>B2C Retail</span>
            </button>
            <button
              onClick={() => {
                setActiveCatalogTab('B2B');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeCatalogTab === 'B2B'
                  ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>B2B Wholesale</span>
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stock Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedStockFilter}
              onChange={e => {
                setSelectedStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            >
              <option value="All Stock">All Stock Levels</option>
              <option value="In Stock">In Stock Ready</option>
              <option value="Low Stock">Low Stock Alert</option>
              <option value="Out of Stock">Out of Stock (0)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All Categories');
              setActiveCatalogTab('ALL');
              setSelectedStockFilter('All Stock');
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <span>Products List</span>
            <span className="text-slate-400 font-medium text-sm">({filteredProducts.length} items found)</span>
          </h3>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            Live Database
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-3 text-center w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 font-semibold text-slate-400">#</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Product</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Category</th>
                <th className="py-3 px-3 text-center font-semibold text-slate-600">Channel</th>
                <th className="py-3 px-3 text-center font-semibold text-slate-600">Unit</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-600">Cost (₹)</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-600">Selling Price (₹)</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-600">Stock Level</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-600">Status</th>
                <th className="py-3 px-4 text-center font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No products match your filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting filters or click "+ Add Product" to add items.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const displayIndex = (currentPage - 1) * pageSize + idx + 1;
                  const isSelected = activeProduct?.id === p.id;
                  const pChannel = getProductCatalogType(p);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenDetails(p)}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-slate-50/80 ${
                        isSelected && isDetailsOpen ? 'bg-emerald-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(Number(p.id))}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-400 text-xs">{displayIndex}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveProductImage(p.name, p.category, p.image)}
                            alt={p.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getProductImageFallback(p.name, p.category);
                            }}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs tracking-tight">
                                {p.name}
                              </span>
                              {p.addedBy === 'Admin' && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] font-semibold">
                                  <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {p.unit}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium text-xs">{p.category}</td>

                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        {pChannel === 'B2C' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" /> B2C Retail
                          </span>
                        )}
                        {pChannel === 'B2B' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            <Building2 className="w-2.5 h-2.5 text-blue-600" /> B2B Wholesale
                          </span>
                        )}
                        {pChannel === 'Both' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            <Sparkles className="w-2.5 h-2.5 text-purple-600" /> Dual (B2B + B2C)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-bold text-xs">
                          {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right text-slate-600 font-medium text-xs">₹{p.purchasePrice}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 text-xs">₹{p.salePrice}</td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
                            p.stock === 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : p.stock <= (p.minimumStock || 20)
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-block ${
                            p.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Product"
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
                      ? 'bg-emerald-700 text-white shadow-2xs'
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

      {/* 5. SLIDE-OVER PRODUCT DETAILS DRAWER */}
      {isDetailsOpen && drawerProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
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
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
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
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white group max-w-xs mx-auto">
                  <img
                    src={resolveProductImage(drawerProduct.name, drawerProduct.category, drawerProduct.image)}
                    alt={drawerProduct.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getProductImageFallback(drawerProduct.name, drawerProduct.category);
                    }}
                    className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-xs ${
                        drawerProduct.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {drawerProduct.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="font-black text-2xl text-slate-900 tracking-tight">
                    {drawerProduct.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{drawerProduct.category}</span>
                    <span>•</span>
                    <span>Unit: {drawerProduct.unit}</span>
                  </p>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {drawerProduct.description || `Fresh produce sourced directly for hotels and retail customers.`}
                  </p>
                </div>

                {/* Price & Economics Card */}
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Pricing & Unit</span>
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
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
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
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
