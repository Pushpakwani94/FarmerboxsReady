import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  ChevronDown,
  Building2,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  Globe,
  Tag,
  Check
} from 'lucide-react';
import { useJoinerApp, getProductImageFallback, deduplicateMobileHotels } from '../JoinerAppContext';
import type { MobileProduct } from '../JoinerAppContext';

interface CategoryOption {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  gradient: string;
  borderActive: string;
  iconBg: string;
}

export const PlaceOrderScreen: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQty,
    selectedHotel,
    hotels,
    setSelectedHotel,
    setCurrentScreen,
    cartTotal
  } = useJoinerApp();

  const uniqueHotels = useMemo(() => deduplicateMobileHotels(hotels), [hotels]);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedCatalogMode, setSelectedCatalogMode] = useState<'ALL' | 'B2B' | 'B2C'>('B2B');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);

  useEffect(() => {
    if (!selectedHotel && uniqueHotels.length > 0) {
      setSelectedHotel(uniqueHotels[0]);
    }
  }, [uniqueHotels, selectedHotel, setSelectedHotel]);

  const currentHotel = selectedHotel || (uniqueHotels.length > 0 ? uniqueHotels[0] : null);

  const categories: CategoryOption[] = [
    {
      id: 'All',
      name: 'All Items',
      emoji: '🌟',
      gradient: 'from-emerald-600 to-green-700 text-white',
      borderActive: 'border-emerald-600 shadow-emerald-200/50',
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'Vegetables',
      name: 'Vegetables',
      emoji: '🥦',
      image: '/images/categories/vegetables.jpg',
      gradient: 'from-emerald-600 to-teal-700 text-white',
      borderActive: 'border-emerald-600 shadow-emerald-200/50',
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'Fruits',
      name: 'Fresh Fruits',
      emoji: '🍎',
      image: '/images/categories/fresh_fruits.jpg',
      gradient: 'from-rose-500 to-red-600 text-white',
      borderActive: 'border-rose-600 shadow-rose-200/50',
      iconBg: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'Eggs',
      name: 'Farm Eggs',
      emoji: '🥚',
      image: '/images/categories/eggs.jpg',
      gradient: 'from-amber-500 to-yellow-600 text-white',
      borderActive: 'border-amber-600 shadow-amber-200/50',
      iconBg: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'Herbs & Seasoning',
      name: 'Herbs & Spices',
      emoji: '🌿',
      image: '/images/categories/herbs_spices.jpg',
      gradient: 'from-emerald-700 to-green-800 text-white',
      borderActive: 'border-emerald-700 shadow-emerald-200/50',
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'Dal & Pulses',
      name: 'Dal & Pulses',
      emoji: '🌾',
      image: '/images/categories/dal_pulses.jpg',
      gradient: 'from-amber-600 to-orange-700 text-white',
      borderActive: 'border-amber-600 shadow-amber-200/50',
      iconBg: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'Imported',
      name: 'Exotic & Global',
      emoji: '✈️',
      image: '/images/categories/exotic_global.jpg',
      gradient: 'from-blue-600 to-indigo-700 text-white',
      borderActive: 'border-blue-600 shadow-blue-200/50',
      iconBg: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'Leafy Greens',
      name: 'Leafy Greens',
      emoji: '🥬',
      gradient: 'from-green-600 to-emerald-800 text-white',
      borderActive: 'border-green-700 shadow-green-200/50',
      iconBg: 'bg-green-100 text-green-800'
    }
  ];

  const isProductInCategory = (product: MobileProduct, catId: string): boolean => {
    if (catId === 'All') return true;
    if (catId === 'Imported') {
      return Boolean(product.isImported || product.originCountry);
    }
    const productCategory = product.category || '';
    const c = productCategory.toLowerCase();
    const n = (product.name || '').toLowerCase();

    if (catId === 'Eggs') {
      return productCategory === 'Eggs' || productCategory === 'Dairy & Supplies' || c.includes('egg') || n.includes('egg');
    }

    if (catId === 'Vegetables') {
      return (
        productCategory === 'Vegetables' ||
        productCategory === 'Root Veggies' ||
        productCategory === 'Gourds & Squashes' ||
        productCategory === 'Chillies & Peppers' ||
        c.includes('veg') ||
        c.includes('root') ||
        c.includes('gourd') ||
        c.includes('chilli') ||
        c.includes('potato') ||
        c.includes('onion') ||
        c.includes('tomato')
      );
    }
    if (catId === 'Fruits') {
      return (
        productCategory === 'Fruits' ||
        productCategory === 'Fruit' ||
        productCategory === 'Citrus & Melons' ||
        c.includes('fruit') ||
        c.includes('melon') ||
        c.includes('citrus') ||
        n.includes('apple') ||
        n.includes('banana') ||
        n.includes('orange') ||
        n.includes('grape') ||
        n.includes('mango') ||
        n.includes('kiwi') ||
        n.includes('dragon') ||
        n.includes('papaya') ||
        n.includes('watermelon') ||
        n.includes('muskmelon') ||
        n.includes('guava') ||
        n.includes('strawberry') ||
        n.includes('custard') ||
        n.includes('sitaphal') ||
        n.includes('pear') ||
        n.includes('nashpati') ||
        n.includes('cherry') ||
        n.includes('chikoo') ||
        n.includes('avocado') ||
        n.includes('coconut') ||
        n.includes('pineapple') ||
        n.includes('lemon')
      );
    }
    if (catId === 'Leafy Greens') {
      return productCategory === 'Leafy Greens' || productCategory === 'Leafy' || c.includes('leaf') || c.includes('spinach') || c.includes('methi') || c.includes('palak');
    }
    if (catId === 'Herbs & Seasoning' || catId === 'Herbs & Spices') {
      return (
        productCategory === 'Herbs & Seasoning' ||
        productCategory === 'Herbs & Spices' ||
        productCategory === 'Herbs' ||
        c.includes('herb') ||
        c.includes('spice') ||
        c.includes('seasoning') ||
        n.includes('coriander') ||
        n.includes('mint') ||
        n.includes('ginger') ||
        n.includes('garlic') ||
        n.includes('turmeric') ||
        n.includes('chilli')
      );
    }
    if (catId === 'Dal & Pulses') {
      return (
        productCategory === 'Dal & Pulses' ||
        productCategory === 'Pulses' ||
        productCategory === 'Dal' ||
        c.includes('dal') ||
        c.includes('pulse') ||
        c.includes('chana') ||
        c.includes('moong') ||
        c.includes('toor') ||
        c.includes('urad') ||
        c.includes('masoor') ||
        c.includes('rajma')
      );
    }
    return c === catId.toLowerCase();
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.id] = products.filter(p => isProductInCategory(p, cat.id)).length;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = isProductInCategory(p, activeCategory);
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCatalog = true;
      if (selectedCatalogMode === 'B2B') {
        matchesCatalog = p.catalogType === 'B2B' || p.catalogType === 'Both' || !p.catalogType;
      } else if (selectedCatalogMode === 'B2C') {
        matchesCatalog = p.catalogType === 'B2C' || p.catalogType === 'Both';
      }

      return matchesCategory && matchesSearch && matchesCatalog;
    });
  }, [products, activeCategory, searchQuery, selectedCatalogMode]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-[#F4F8F5] select-none relative">
      {/* Top Header */}
      <div className="bg-[#15803d] px-4 pt-3 pb-3 text-white flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentScreen('DASHBOARD')}
            className="p-1 -ml-1 text-white/90 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black tracking-tight flex items-center gap-1.5">
              <span>Select Products</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {products.length} Items
              </span>
            </h2>
            <p className="text-[10px] text-emerald-100 font-medium">Daily Farm Fresh Catalogue</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentScreen('CART')}
          className="relative p-2.5 bg-emerald-800 hover:bg-emerald-700 rounded-xl cursor-pointer text-white shadow-xs transition-transform active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 pb-24">
        
        {/* Hotel Selector Card */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Ordering For Hotel
            </span>
            <button
              onClick={() => setIsHotelDropdownOpen(!isHotelDropdownOpen)}
              className="text-[11px] font-bold text-[#15803d] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Change</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHotelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {currentHotel && (
            <div className="flex items-center gap-3 mt-1.5">
              <img
                src={currentHotel.image}
                alt={currentHotel.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-slate-900 text-sm truncate">
                  {currentHotel.name}
                </h3>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  {currentHotel.zone} Zone
                </p>
              </div>
            </div>
          )}

          {/* Hotel Dropdown */}
          {isHotelDropdownOpen && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold text-slate-400 mb-1">Select Hotel:</p>
              {uniqueHotels.map(h => (
                <button
                  key={h.id}
                  onClick={() => {
                    setSelectedHotel(h);
                    setIsHotelDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentHotel?.id === h.id
                      ? 'bg-emerald-50 text-emerald-900 font-black'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <img src={h.image} alt={h.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">{h.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{h.zone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${selectedCatalogMode === 'ALL' ? 'all' : selectedCatalogMode} produce...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'GRID' ? 'bg-[#15803d] text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'LIST' ? 'bg-[#15803d] text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Catalog Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setSelectedCatalogMode('B2B')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-black text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
              selectedCatalogMode === 'B2B'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🏢 B2B Wholesale</span>
          </button>
          <button
            onClick={() => setSelectedCatalogMode('B2C')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-black text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
              selectedCatalogMode === 'B2C'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🛍️ B2C Retail</span>
          </button>
          <button
            onClick={() => setSelectedCatalogMode('ALL')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-black text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
              selectedCatalogMode === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🌟 All</span>
          </button>
        </div>

        {/* ================= BROWSE CATEGORIES SECTION ================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Browse Categories
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {filteredProducts.length} Products
            </span>
          </div>

          {/* Horizontal Category Cards Slider */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
            {categories.map(cat => {
              const isSelected = activeCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center justify-between p-2 rounded-2xl shrink-0 min-w-[86px] transition-all cursor-pointer border relative shadow-2xs group ${
                    isSelected
                      ? 'bg-emerald-50/90 border-2 border-[#15803d] shadow-md scale-[1.03]'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Category Image or Emoji Container */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xs border border-slate-100 flex items-center justify-center bg-slate-50 shrink-0 relative">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center text-2xl ${
                          isSelected ? 'bg-emerald-600 text-white' : cat.iconBg
                        }`}
                      >
                        {cat.emoji}
                      </div>
                    )}

                    {/* Active Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#15803d] text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-2 h-2 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Name & Count */}
                  <div className="text-center w-full mt-1.5 px-0.5">
                    <p className={`text-[11px] font-black truncate leading-tight ${isSelected ? 'text-emerald-900 font-black' : 'text-slate-800'}`}>
                      {cat.name}
                    </p>
                    <span
                      className={`text-[9px] font-bold inline-block mt-0.5 px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-emerald-200/70 text-emerald-900' : 'bg-slate-100 text-slate-500'
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

        {/* ================= PRODUCTS DISPLAY ================= */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <span className="text-3xl">🔍</span>
            <h4 className="text-sm font-black text-slate-800">No products found</h4>
            <p className="text-xs text-slate-500">Try changing your search or category filter</p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'GRID' ? (
          /* ================= 2-COLUMN MODERN PRODUCT GRID ================= */
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  {/* Product Visual Container */}
                  <div className="relative w-full h-32 bg-slate-50 overflow-hidden group">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getProductImageFallback(product.name, product.category);
                      }}
                    />
                    
                    {/* Unit Badge */}
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                      1 {product.unit}
                    </span>

                    {/* Catalog Channel Badge */}
                    <span className={`absolute bottom-2 left-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md backdrop-blur-xs text-white ${
                      product.catalogType === 'B2B' ? 'bg-blue-600/90' : product.catalogType === 'B2C' ? 'bg-emerald-600/90' : 'bg-purple-600/90'
                    }`}>
                      {product.catalogType === 'B2B' ? '🏢 B2B' : product.catalogType === 'B2C' ? '🛍️ B2C' : '⚡ Dual'}
                    </span>

                    {/* Origin Badge */}
                    {product.isImported || product.originCountry ? (
                      <span className="absolute top-2 right-2 bg-blue-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-0.5">
                        {product.countryFlag || '✈️'} {product.originCountry || 'Import'}
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 bg-emerald-700/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        🇮🇳 Fresh
                      </span>
                    )}
                  </div>

                  {/* Product Details & Action */}
                  <div className="p-2.5 flex flex-col justify-between flex-1 space-y-2">
                    <div>
                      <span className="text-[8.5px] font-bold text-emerald-800 uppercase tracking-tight block">
                        {product.category}
                      </span>
                      <h4 className="font-black text-slate-900 text-xs tracking-tight line-clamp-1 mt-0.5">
                        {product.name}
                      </h4>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-sm font-black text-slate-900">
                          ₹{product.price}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          / {product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Stepper / Add Button */}
                    <div>
                      {inCart ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                          <button
                            onClick={() => updateCartQty(product.id, inCart.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs border border-slate-100"
                            title="Reduce"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-emerald-900 min-w-5 text-center">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(product.id, inCart.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-[#15803d] text-[#15803d] hover:text-white border border-emerald-200 flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= COMPACT LIST VIEW ================= */
          <div className="space-y-2 pt-1">
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white p-2.5 rounded-2xl border border-slate-200/90 flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-all gap-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Image */}
                    <div className="w-13 h-13 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-0.5 shrink-0 overflow-hidden relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/products/tomato.jpg';
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-slate-900 text-xs truncate">
                          {product.name}
                        </h4>
                        <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                          {product.category}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 mt-0.5">
                        ₹{product.price} <span className="text-slate-400 font-normal text-[10px]">/ {product.unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stepper / Add */}
                  <div className="flex items-center shrink-0">
                    {inCart ? (
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                        <button
                          onClick={() => updateCartQty(product.id, inCart.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center cursor-pointer shadow-2xs border border-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-emerald-900 min-w-5 text-center">
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(product.id, inCart.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-[#15803d] text-white flex items-center justify-center cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#15803d] text-[#15803d] hover:text-white border border-emerald-200 flex items-center gap-1 text-xs font-black transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="absolute bottom-3 left-3.5 right-3.5 z-20 space-y-1.5">
          {cartTotal >= 1500 ? (
            <div className="bg-emerald-950/90 text-emerald-200 text-[10.5px] font-bold px-3 py-1 rounded-xl flex items-center justify-between border border-emerald-400/30 shadow-md backdrop-blur-md">
              <span className="flex items-center gap-1">
                <span>🎉</span>
                <span>Order Above ₹1,500: <strong>₹100 Wallet Bonus Unlocked!</strong></span>
              </span>
              <span className="text-[9px] bg-emerald-700 text-white font-extrabold px-1.5 py-0.2 rounded">
                +₹100
              </span>
            </div>
          ) : (
            <div className="bg-amber-950/90 text-amber-200 text-[10px] font-bold px-3 py-1 rounded-xl flex items-center justify-between border border-amber-400/30 shadow-md backdrop-blur-md">
              <span>Add <strong>₹{1500 - cartTotal}</strong> more to unlock <strong>₹100 Wallet Bonus</strong> on delivery!</span>
              <span className="text-[9px] bg-amber-600 text-white font-black px-1.5 py-0.2 rounded">
                ₹100 CASHBACK
              </span>
            </div>
          )}

          <button
            onClick={() => setCurrentScreen('CART')}
            className="w-full py-3 bg-[#15803d] hover:bg-[#166534] text-white font-black text-xs rounded-2xl shadow-xl flex items-center justify-between px-4 transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>View Cart ({totalCartCount} items)</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span>₹{cartTotal}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
