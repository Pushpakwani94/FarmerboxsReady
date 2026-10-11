import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  IndianRupee,
  Layers,
  CheckCircle2,
  Upload,
  Loader2,
  Image as ImageIcon,
  Check,
  Sparkles,
  Building2,
  ShoppingBag,
  TrendingUp,
  Percent,
  Search,
  Zap,
  Globe,
  Award,
  Warehouse,
  Eye,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uploadImageToStorage } from '../../firebase/services/storageService';
import type { Product, CatalogType } from '../../types';
import { IMPORT_COUNTRIES, getCountryFlag } from '../../data/countriesData';
import { PRESET_PRODUCT_IMAGES, resolveProductImage, getProductImageFallback } from '../../utils/productImages';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCatalogType?: CatalogType;
  defaultCategory?: string;
}

const CATEGORIES = [
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

const QUICK_TEMPLATES = [
  {
    label: '🧅 Nashik Onion',
    name: 'Nashik Red Onion (Kanda)',
    category: 'Vegetables',
    unit: 'Bag (50 KG)',
    catalogType: 'Both' as CatalogType,
    cost: '22',
    sale: '34',
    b2b: '30',
    b2c: '36',
    stock: '500',
    minStock: '100',
    moq: '1',
    origin: 'Nashik, Maharashtra',
    grade: 'Grade A Export',
    image: '/products/onion.jpg',
    desc: 'Top grade Nashik red onions with thick skin and rich pungency. Farm-direct harvest.'
  },
  {
    label: '🍅 Hybrid Tomato',
    name: 'Fresh Hybrid Red Tomato (Tamatar)',
    category: 'Vegetables',
    unit: 'Crate (20 KG)',
    catalogType: 'Both' as CatalogType,
    cost: '18',
    sale: '30',
    b2b: '26',
    b2c: '32',
    stock: '350',
    minStock: '50',
    moq: '1',
    origin: 'Narayangaon, Pune',
    grade: 'Grade A Premium',
    image: '/products/tomato.jpg',
    desc: 'Firm, juicy hybrid red tomatoes ideal for hotel gravies, salads, and retail cooking.'
  },
  {
    label: '🥔 Agra Potato',
    name: 'Fresh Jyoti Potato (Aloo)',
    category: 'Root Veggies',
    unit: 'Bag (50 KG)',
    catalogType: 'Both' as CatalogType,
    cost: '16',
    sale: '26',
    b2b: '22',
    b2c: '28',
    stock: '600',
    minStock: '120',
    moq: '1',
    origin: 'Manchar, Pune',
    grade: 'Grade A Commercial',
    image: '/products/potato.jpg',
    desc: 'Unwashed, long-shelf-life Jyoti potatoes suitable for boiling, frying, and hotel curries.'
  },
  {
    label: '🥭 Alphonso Mango',
    name: 'Ratnagiri Alphonso Mango (Hapus)',
    category: 'Fruits',
    unit: 'Dozen',
    catalogType: 'Both' as CatalogType,
    cost: '550',
    sale: '850',
    b2b: '750',
    b2c: '899',
    stock: '150',
    minStock: '20',
    moq: '1',
    origin: 'Ratnagiri, Konkan',
    grade: 'GI Certified Hapus',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
    desc: 'Naturally ripened carbide-free authentic Ratnagiri Alphonso with sweet aroma and rich pulp.'
  },
  {
    label: '🥬 Baby Spinach',
    name: 'Fresh Farm Spinach (Palak)',
    category: 'Leafy Greens',
    unit: 'Bundle',
    catalogType: 'B2C' as CatalogType,
    cost: '12',
    sale: '22',
    b2b: '18',
    b2c: '22',
    stock: '250',
    minStock: '40',
    moq: '1',
    origin: 'Saswad, Pune',
    grade: 'Hydro-Washed Clean',
    image: '/products/spinach.jpg',
    desc: 'Tender baby green spinach leaves harvested early morning, free of roots and mud.'
  }
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  defaultCatalogType = 'B2C',
  defaultCategory = 'Vegetables'
}) => {
  const { addProduct } = useApp();

  const [activeTab, setActiveTab] = useState<'details' | 'pricing' | 'inventory' | 'images' | 'sourcing'>('details');

  const [name, setName] = useState('');
  const [catalogType, setCatalogType] = useState<CatalogType>(defaultCatalogType);
  const [category, setCategory] = useState(defaultCategory);
  const [unit, setUnit] = useState(defaultCatalogType === 'B2B' ? 'Crate (20 KG)' : '1 KG');
  const [purchasePrice, setPurchasePrice] = useState('25');
  const [salePrice, setSalePrice] = useState('40');
  const [b2bPrice, setB2bPrice] = useState('35');
  const [b2cPrice, setB2cPrice] = useState('40');
  const [minOrderQty, setMinOrderQty] = useState(defaultCatalogType === 'B2B' ? '5' : '1');
  const [stock, setStock] = useState('200');
  const [minimumStock, setMinimumStock] = useState('30');
  const [status, setStatus] = useState<'Active' | 'Low Stock' | 'Out of Stock'>('Active');
  const [qualityGrade, setQualityGrade] = useState('Grade A Export');
  const [farmOrigin, setFarmOrigin] = useState('Nashik, Maharashtra');
  const [isOrganic, setIsOrganic] = useState(false);

  // Fruit origin
  const [isImported, setIsImported] = useState(false);
  const [originCountry, setOriginCountry] = useState('New Zealand');

  // Media
  const [imageUrl, setImageUrl] = useState('/products/onion.jpg');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSource, setUploadSource] = useState<'storage' | 'url' | 'preset'>('preset');
  const [presetSearch, setPresetSearch] = useState('');
  const [presetFilterCategory, setPresetFilterCategory] = useState('All');
  const [showLivePreview, setShowLivePreview] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCatalogType(defaultCatalogType);
      setCategory(defaultCategory);
      setUnit(defaultCatalogType === 'B2B' ? 'Crate (20 KG)' : '1 KG');
      setMinOrderQty(defaultCatalogType === 'B2B' ? '5' : '1');
      setActiveTab('details');
    }
  }, [isOpen, defaultCatalogType, defaultCategory]);

  // Pricing calculations
  const costNum = Number(purchasePrice) || 0;
  const saleNum = Number(salePrice) || 0;
  const b2bNum = Number(b2bPrice) || saleNum;
  const b2cNum = Number(b2cPrice) || saleNum;
  const stockNum = Number(stock) || 0;

  const profitUnit = Math.max(0, saleNum - costNum);
  const marginPct = saleNum > 0 ? ((profitUnit / saleNum) * 100).toFixed(1) : '0';
  const b2bProfit = Math.max(0, b2bNum - costNum);
  const b2bMargin = b2bNum > 0 ? ((b2bProfit / b2bNum) * 100).toFixed(1) : '0';
  const b2cProfit = Math.max(0, b2cNum - costNum);
  const b2cMargin = b2cNum > 0 ? ((b2cProfit / b2cNum) * 100).toFixed(1) : '0';
  const totalStockValue = stockNum * costNum;

  // Filtered preset images
  const filteredPresets = useMemo(() => {
    return PRESET_PRODUCT_IMAGES.filter(p => {
      const matchSearch = !presetSearch || p.name.toLowerCase().includes(presetSearch.toLowerCase());
      const matchCat = presetFilterCategory === 'All' || p.category.toLowerCase() === presetFilterCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [presetSearch, presetFilterCategory]);

  const handleApplyTemplate = (tmpl: typeof QUICK_TEMPLATES[0]) => {
    setName(tmpl.name);
    setCategory(tmpl.category);
    setUnit(tmpl.unit);
    setCatalogType(tmpl.catalogType);
    setPurchasePrice(tmpl.cost);
    setSalePrice(tmpl.sale);
    setB2bPrice(tmpl.b2b);
    setB2cPrice(tmpl.b2c);
    setStock(tmpl.stock);
    setMinimumStock(tmpl.minStock);
    setMinOrderQty(tmpl.moq);
    setFarmOrigin(tmpl.origin);
    setQualityGrade(tmpl.grade);
    setImageUrl(tmpl.image);
    setDescription(tmpl.desc);
    setUploadSource('preset');
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadImageToStorage(file, 'products');
      setImageUrl(url);
      setUploadSource('storage');
    } catch (err) {
      console.error('Failed to upload image to storage:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalImage = imageUrl.trim() || '/products/onion.jpg';
    const isFruit = category === 'Fruits';
    const flag = isFruit && isImported ? getCountryFlag(originCountry) : '🇮🇳';

    addProduct({
      name: name.trim(),
      catalogType,
      targetCatalog: catalogType,
      category,
      unit,
      purchasePrice: costNum,
      salePrice: saleNum,
      b2bPrice: b2bNum,
      b2cPrice: b2cNum,
      minOrderQty: Number(minOrderQty) || 1,
      stock: stockNum,
      minimumStock: Number(minimumStock) || 0,
      status,
      qualityGrade,
      farmOrigin,
      isOrganic,
      isImported: isFruit ? isImported : false,
      originCountry: isFruit && isImported ? originCountry : 'India',
      countryFlag: flag,
      image: finalImage,
      description: description.trim() || `Fresh quality ${name} (${catalogType === 'B2B' ? 'Wholesale Commercial Pack' : catalogType === 'B2C' ? 'Retail Consumer Pack' : 'Dual Channel'}) sourced directly from ${farmOrigin}.`,
      images: [finalImage]
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">Add New Product</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Advance Catalog Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure dual-channel wholesale & retail pricing, inventory thresholds, and rich media
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                showLivePreview ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showLivePreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Autofill Presets Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-500 shrink-0 flex items-center gap-1 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Quick Template:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {QUICK_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 border-b border-slate-200 bg-white flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. General & Channel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>2. Smart Pricing & Margins</span>
            {Number(marginPct) > 0 && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${Number(marginPct) >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {marginPct}%
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>3. Inventory & Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'images'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>4. Media & Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sourcing')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sourcing'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>5. Sourcing & Origin</span>
          </button>
        </div>

        {/* Main Body */}
        {success ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-bounce" />
            <h4 className="mt-4 font-bold text-slate-900 text-lg">Product Added Successfully!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {name} has been published to the selected {catalogType} catalog and synced to warehouse inventory.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Input Columns (2 Cols) */}
              <div className={showLivePreview ? 'md:col-span-2 space-y-4' : 'md:col-span-3 space-y-4'}>
                
                {/* TAB 1: General & Channel */}
                {activeTab === 'details' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Catalog Channel Selector */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 text-xs">
                          Target Catalog Channel *
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">Controls visibility & buyer tier</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogType('B2B');
                            if (unit === '1 KG' || unit === 'KG') setUnit('Crate (20 KG)');
                          }}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all border ${
                            catalogType === 'B2B'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>B2B Wholesale</span>
                          </div>
                          <span className={`text-[10px] font-normal ${catalogType === 'B2B' ? 'text-blue-100' : 'text-slate-400'}`}>Hotels & Restaurants</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCatalogType('B2C');
                            if (unit.includes('Crate') || unit.includes('Bag')) setUnit('1 KG');
                          }}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all border ${
                            catalogType === 'B2C'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>B2C Retail</span>
                          </div>
                          <span className={`text-[10px] font-normal ${catalogType === 'B2C' ? 'text-emerald-100' : 'text-slate-400'}`}>Consumers & Homes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCatalogType('Both')}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all border ${
                            catalogType === 'Both'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Both (Dual)</span>
                          </div>
                          <span className={`text-[10px] font-normal ${catalogType === 'Both' ? 'text-purple-100' : 'text-slate-400'}`}>Universal Listing</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fresh Red Apple / Alphonso Mango / Nashik Red Onion"
                        value={name}
                        onChange={e => {
                          const val = e.target.value;
                          setName(val);
                          if (uploadSource === 'preset') {
                            setImageUrl(resolveProductImage(val, category));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Category *</label>
                        <select
                          value={category}
                          onChange={e => {
                            const cat = e.target.value;
                            setCategory(cat);
                            if (uploadSource === 'preset') {
                              setImageUrl(resolveProductImage(name, cat));
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Unit of Measurement *</label>
                        <select
                          value={unit}
                          onChange={e => setUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                        >
                          <option value="1 KG">1 KG Pack</option>
                          <option value="KG">KG (Kilogram)</option>
                          <option value="500g Pack">500g Pack / Tray</option>
                          <option value="250g Pack">250g Pack</option>
                          <option value="Crate (20 KG)">Crate (20 KG Wholesale)</option>
                          <option value="Bag (50 KG)">Bag (50 KG Wholesale)</option>
                          <option value="Sack (25 KG)">Sack (25 KG Bulk)</option>
                          <option value="Bundle">Bundle (Judi / Bunch)</option>
                          <option value="Pcs">Pcs (Pieces)</option>
                          <option value="Dozen">Dozen</option>
                          <option value="Box">Box (Crate)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                      <textarea
                        rows={3}
                        placeholder="Detail farm origin, harvest time, grading specifications, shelf life, and packaging format..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: Smart Pricing & Margins */}
                {activeTab === 'pricing' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Live Margin Performance Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-700" />
                          Live Profit & Margin Engine
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          Number(marginPct) >= 25 ? 'bg-emerald-200 text-emerald-900' : Number(marginPct) >= 15 ? 'bg-amber-200 text-amber-900' : 'bg-rose-200 text-rose-900'
                        }`}>
                          {Number(marginPct) >= 25 ? 'High Margin' : Number(marginPct) >= 15 ? 'Standard Margin' : 'Thin Margin'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                          <p className="text-[10px] text-slate-500 font-semibold">Unit Profit</p>
                          <p className="text-base font-extrabold text-emerald-700">₹{profitUnit.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                          <p className="text-[10px] text-slate-500 font-semibold">Gross Margin</p>
                          <p className="text-base font-extrabold text-teal-700">{marginPct}%</p>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                          <p className="text-[10px] text-slate-500 font-semibold">B2B Margin</p>
                          <p className="text-base font-extrabold text-blue-700">{b2bMargin}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Purchase / Sourcing Cost (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            value={purchasePrice}
                            onChange={e => setPurchasePrice(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Mandi purchase / procurement price</span>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Primary Default Sale Price (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            value={salePrice}
                            onChange={e => {
                              const val = e.target.value;
                              setSalePrice(val);
                              if (!b2bPrice) setB2bPrice(val);
                              if (!b2cPrice) setB2cPrice(val);
                            }}
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Standard baseline selling price</span>
                      </div>
                    </div>

                    {/* Dual Channel Pricing Breakdown */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">Channel-Specific Pricing & MOQ</span>
                        <span className="text-[10px] text-slate-500">Tiered pricing for hotels vs households</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-2.5 rounded-lg border border-blue-200 space-y-1">
                          <label className="block font-bold text-blue-800 text-[11px]">B2B Hotel Price (₹)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={b2bPrice}
                              onChange={e => setB2bPrice(e.target.value)}
                              placeholder="Wholesale"
                              className="w-full pl-6 pr-2 py-1.5 bg-blue-50/30 border border-blue-200 rounded-lg text-slate-800 font-bold text-xs"
                            />
                          </div>
                          <span className="text-[10px] text-blue-600 block">Profit: ₹{b2bProfit.toFixed(1)}/unit</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-emerald-200 space-y-1">
                          <label className="block font-bold text-emerald-800 text-[11px]">B2C Retail Price (₹)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={b2cPrice}
                              onChange={e => setB2cPrice(e.target.value)}
                              placeholder="Consumer"
                              className="w-full pl-6 pr-2 py-1.5 bg-emerald-50/30 border border-emerald-200 rounded-lg text-slate-800 font-bold text-xs"
                            />
                          </div>
                          <span className="text-[10px] text-emerald-600 block">Profit: ₹{b2cProfit.toFixed(1)}/unit</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <label className="block font-bold text-slate-700 text-[11px]">Min Order (MOQ)</label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setMinOrderQty(String(Math.max(1, (Number(minOrderQty) || 1) - 1)))}
                              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={minOrderQty}
                              onChange={e => setMinOrderQty(e.target.value)}
                              className="w-full text-center py-1 bg-white border border-slate-200 rounded font-bold text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setMinOrderQty(String((Number(minOrderQty) || 1) + 1))}
                              className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block text-center">Minimum Units</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Inventory & Warehouse */}
                {activeTab === 'inventory' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Initial Stock Quantity ({unit}) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={stock}
                          onChange={e => setStock(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Reorder Threshold ({unit}) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={minimumStock}
                          onChange={e => setMinimumStock(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Triggers low stock warnings</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-500 font-semibold">Total Stock Value</p>
                        <h4 className="text-base font-extrabold text-slate-900">₹{totalStockValue.toLocaleString('en-IN')}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500 font-semibold">Inventory Buffer</p>
                        <p className="text-xs font-bold text-emerald-700">{stockNum > Number(minimumStock) ? 'Healthy' : 'Near Low Stock'}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Listing Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Active', 'Low Stock', 'Out of Stock'] as const).map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatus(st)}
                            className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              status === st
                                ? st === 'Active'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : st === 'Low Stock'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Media & Presets */}
                {activeTab === 'images' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Image Preview & Upload Container */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Product Image Source
                        </span>
                        {imageUrl && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                            Active Preview
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt="Preview"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = getProductImageFallback(name, category);
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-xs cursor-pointer shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isUploading ? 'Uploading to Firebase...' : 'Upload Device Image'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                disabled={isUploading}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Or paste Direct Image URL..."
                            value={imageUrl}
                            onChange={e => {
                              setImageUrl(e.target.value);
                              setUploadSource('url');
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Searchable Preset Picker */}
                    <div className="space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Standard Catalog Image Presets ({filteredPresets.length})
                        </label>
                        <div className="relative w-full sm:w-48">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Filter produce..."
                            value={presetSearch}
                            onChange={e => setPresetSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                        {['All', 'Vegetables', 'Fruits', 'Leafy Greens', 'Root Veggies'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setPresetFilterCategory(cat)}
                            className={`px-2 py-0.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                              presetFilterCategory === cat
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                        {filteredPresets.map(item => {
                          const isSelected = imageUrl === item.url;
                          return (
                            <button
                              key={item.name + item.url}
                              type="button"
                              onClick={() => {
                                setImageUrl(item.url);
                                setUploadSource('preset');
                              }}
                              className={`p-1.5 rounded-xl border transition-all flex items-center gap-2 text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300'
                                  : 'bg-white border-slate-200 hover:border-emerald-300'
                              }`}
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/products/onion.jpg';
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 text-[11px] truncate">{item.name}</p>
                                <p className="text-[9px] text-slate-400">{item.category}</p>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: Sourcing & Quality */}
                {activeTab === 'sourcing' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Quality Grading</label>
                        <select
                          value={qualityGrade}
                          onChange={e => setQualityGrade(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                        >
                          <option value="Grade A Export">Grade A Export (Super Premium)</option>
                          <option value="Grade A Premium">Grade A Premium (Hotel Ready)</option>
                          <option value="Grade A Commercial">Grade A Commercial (Standard)</option>
                          <option value="GI Tagged Produce">GI Tagged Produce (Regional)</option>
                          <option value="Hydroponic Clean">Hydroponic Clean (Pesticide Free)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Farm Origin / Mandi</label>
                        <input
                          type="text"
                          value={farmOrigin}
                          onChange={e => setFarmOrigin(e.target.value)}
                          placeholder="e.g. Nashik, Junnar, Saswad, Sangli"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-xs">Organic / Natural Certification</span>
                        <p className="text-[10px] text-slate-500">Displays 100% Organic & Chemical-Free badge on catalog</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOrganic(!isOrganic)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                          isOrganic ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {isOrganic ? '✓ Certified Organic' : 'Conventional Produce'}
                      </button>
                    </div>

                    {/* Fruit Import Logic */}
                    {category === 'Fruits' && (
                      <div className="p-3.5 bg-gradient-to-br from-amber-50/90 to-orange-50/70 border border-amber-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                            🍎 Fruit Origin Sourcing
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {isImported ? '✈️ Imported Fruit' : '🇮🇳 Domestic Indian'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIsImported(false)}
                            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                              !isImported
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>🇮🇳</span> Domestic (India)
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsImported(true)}
                            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                              isImported
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>✈️</span> Imported
                          </button>
                        </div>

                        {isImported && (
                          <div className="pt-1 space-y-1.5">
                            <label className="block font-semibold text-slate-700 text-xs">
                              Country of Origin *
                            </label>
                            <select
                              value={originCountry}
                              onChange={e => setOriginCountry(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-800 font-bold text-xs"
                            >
                              {IMPORT_COUNTRIES.map(country => (
                                <option key={country.name} value={country.name}>
                                  {country.flag} {country.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live Preview Column (1 Col) */}
              {showLivePreview && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-slate-700 text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      Live Catalog Card Preview
                    </span>
                    <span className="text-[10px] text-slate-400">Buyer View</span>
                  </div>

                  {/* Card Simulation */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-2.5 p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden relative">
                        <img
                          src={imageUrl || '/products/onion.jpg'}
                          alt={name || 'Produce Preview'}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/products/onion.jpg';
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white shadow-xs ${
                            catalogType === 'B2B' ? 'bg-blue-600' : catalogType === 'B2C' ? 'bg-emerald-600' : 'bg-purple-600'
                          }`}>
                            {catalogType === 'Both' ? 'B2B & B2C' : catalogType}
                          </span>
                          {isOrganic && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              🌿 Organic
                            </span>
                          )}
                        </div>

                        {category === 'Fruits' && isImported && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/95 text-slate-800 shadow-xs flex items-center gap-1 border border-slate-200">
                            <span>{getCountryFlag(originCountry)}</span>
                            <span>{originCountry}</span>
                          </span>
                        )}
                      </div>

                      <div className="pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{category}</span>
                          <span className="text-[10px] font-semibold text-slate-500">{unit}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5 line-clamp-1">
                          {name || 'Product Title Preview'}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {farmOrigin ? `📍 ${farmOrigin}` : 'Farm Direct Sourced'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-extrabold text-slate-900">₹{saleNum}</span>
                          <span className="text-[10px] text-slate-400 ml-1">/ {unit}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {marginPct}% Margin
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1">
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                          <p className="text-slate-400">B2B Hotel</p>
                          <p className="font-bold text-blue-700">₹{b2bNum}</p>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                          <p className="text-slate-400">B2C Retail</p>
                          <p className="font-bold text-emerald-700">₹{b2cNum}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Graded as <strong className="text-emerald-900">{qualityGrade}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span>Tab {activeTab === 'details' ? '1/5' : activeTab === 'pricing' ? '2/5' : activeTab === 'inventory' ? '3/5' : activeTab === 'images' ? '4/5' : '5/5'}</span>
                <span>•</span>
                <span className="font-bold text-slate-700">{name || 'New Listing'}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                {activeTab !== 'sourcing' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'details') setActiveTab('pricing');
                      else if (activeTab === 'pricing') setActiveTab('inventory');
                      else if (activeTab === 'inventory') setActiveTab('images');
                      else if (activeTab === 'images') setActiveTab('sourcing');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Next Section</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>Publish Product</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
