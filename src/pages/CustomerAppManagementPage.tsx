import React, { useState } from 'react';
import { 
  Smartphone, 
  RotateCw, 
  ExternalLink, 
  Layers, 
  ShoppingBag, 
  Sparkles, 
  RefreshCw,
  Sliders,
  ChevronRight,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Ruler,
  Eye,
  SlidersHorizontal,
  Home,
  LayoutGrid,
  Search,
  ClipboardList,
  User,
  Heart,
  Wallet,
  Tag
} from 'lucide-react';
import { CustomerMobileApp } from '../customerApp/CustomerMobileApp';
import { CustomerAppProvider } from '../customerApp/CustomerAppContext';
import type { CustomerScreenType } from '../customerApp/types';

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  radius: number;
  notchType: 'dynamic-island' | 'notch' | 'punch-hole';
}

const DEVICE_PRESETS: DevicePreset[] = [
  { name: 'iPhone 15 Pro', width: 393, height: 852, radius: 52, notchType: 'dynamic-island' },
  { name: 'iPhone 14 / 13', width: 390, height: 844, radius: 48, notchType: 'notch' },
  { name: 'Samsung S24 Ultra', width: 412, height: 915, radius: 42, notchType: 'punch-hole' },
  { name: 'Google Pixel 8', width: 412, height: 892, radius: 44, notchType: 'punch-hole' },
  { name: 'Compact (SE)', width: 375, height: 667, radius: 36, notchType: 'punch-hole' }
];

const allScreens: { id: CustomerScreenType; title: string; number: number; group: string }[] = [
  { id: 'splash', title: 'Splash Screen', number: 1, group: 'Auth & Onboarding' },
  { id: 'onboarding-1', title: 'Onboarding 1 (Farm Fresh)', number: 2, group: 'Auth & Onboarding' },
  { id: 'onboarding-2', title: 'Onboarding 2 (Express Delivery)', number: 3, group: 'Auth & Onboarding' },
  { id: 'onboarding-3', title: 'Onboarding 3 (Best Value)', number: 4, group: 'Auth & Onboarding' },
  { id: 'login-signup', title: 'Login / Sign Up', number: 5, group: 'Auth & Onboarding' },
  { id: 'otp-verify', title: 'OTP Verification', number: 6, group: 'Auth & Onboarding' },
  { id: 'home', title: 'Home Dashboard', number: 7, group: 'Browse & Catalog' },
  { id: 'categories', title: 'Categories Grid', number: 8, group: 'Browse & Catalog' },
  { id: 'product-listing', title: 'Product Listing', number: 9, group: 'Browse & Catalog' },
  { id: 'product-detail', title: 'Product Detail', number: 10, group: 'Browse & Catalog' },
  { id: 'search', title: 'Live Search', number: 11, group: 'Browse & Catalog' },
  { id: 'cart', title: 'Cart & Checkout', number: 12, group: 'Orders & Checkout' },
  { id: 'address-selection', title: 'Address Selection', number: 13, group: 'Orders & Checkout' },
  { id: 'payment-method', title: 'Payment Method', number: 14, group: 'Orders & Checkout' },
  { id: 'order-success', title: 'Order Confirmed', number: 15, group: 'Orders & Checkout' },
  { id: 'my-orders', title: 'My Orders & Tracking', number: 16, group: 'Orders & Checkout' },
  { id: 'wishlist', title: 'Saved Wishlist', number: 17, group: 'User & Account' },
  { id: 'wallet', title: 'FarmerBox Wallet', number: 18, group: 'User & Account' },
  { id: 'offers', title: 'Offers & Deals', number: 19, group: 'User & Account' },
  { id: 'notifications', title: 'Notifications Center', number: 20, group: 'User & Account' },
  { id: 'help-support', title: 'Help & 24/7 Support', number: 21, group: 'User & Account' },
  { id: 'settings', title: 'Settings & Privacy', number: 22, group: 'User & Account' },
  { id: 'profile', title: 'Customer Profile', number: 23, group: 'User & Account' },
];

export const CustomerAppManagementPage: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<CustomerScreenType>('home');
  const [selectedPreset, setSelectedPreset] = useState<string>('iPhone 14 / 13');
  const [customWidth, setCustomWidth] = useState<number>(390);
  const [customHeight, setCustomHeight] = useState<number>(844);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showBezel, setShowBezel] = useState<boolean>(true);
  const [phoneColor, setPhoneColor] = useState<'midnight' | 'silver' | 'emerald' | 'gold'>('midnight');
  const [deviceKey, setDeviceKey] = useState(0);

  const handleApplyPreset = (preset: DevicePreset) => {
    setSelectedPreset(preset.name);
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
  };

  const handleResetSimulator = () => {
    setActiveScreen('splash');
    setDeviceKey(prev => prev + 1);
  };

  const activePresetObj = DEVICE_PRESETS.find(p => p.name === selectedPreset) || DEVICE_PRESETS[1];

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              B2C
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Customer Mobile App Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              Live Interactive Simulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Test custom screen sizes, resolution rules, orientation, and bottom navigation bar in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetSimulator}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Flow
          </button>

          <a
            href="?app=customer"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Launch Standalone App
          </a>
        </div>
      </div>

      {/* Interactive Mobile Rules, Sizing & Bottom Nav Toolbar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Device Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Device:
            </span>
            {DEVICE_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPreset === preset.name && customWidth === preset.width && customHeight === preset.height
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {preset.name} <span className="text-[10px] opacity-75">({preset.width}×{preset.height})</span>
              </button>
            ))}
          </div>

          {/* Scale / Zoom Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 px-2">Zoom:</span>
            {[75, 90, 100, 110].map(zoom => (
              <button
                key={zoom}
                onClick={() => setZoomLevel(zoom)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  zoomLevel === zoom ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {zoom}%
              </button>
            ))}
          </div>
        </div>

        {/* Width, Height, Ruler, Bezel Controls & Bottom Nav Bar Jumpers */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          {/* Width & Height Sliders */}
          <div className="flex items-center gap-5 flex-wrap">
            {/* Width Control */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] font-bold text-slate-300">W:</span>
              <input
                type="range"
                min="320"
                max="480"
                step="5"
                value={customWidth}
                onChange={e => {
                  setCustomWidth(Number(e.target.value));
                  setSelectedPreset('Custom');
                }}
                className="w-24 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 w-12 text-right">{customWidth}px</span>
            </div>

            {/* Height Control */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] font-bold text-slate-300">H:</span>
              <input
                type="range"
                min="600"
                max="950"
                step="10"
                value={customHeight}
                onChange={e => {
                  setCustomHeight(Number(e.target.value));
                  setSelectedPreset('Custom');
                }}
                className="w-24 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 w-12 text-right">{customHeight}px</span>
            </div>

            {/* Toggle Rulers */}
            <button
              onClick={() => setShowRulers(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showRulers
                  ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Dimension Rules</span>
            </button>

            {/* Toggle Bezel Frame */}
            <button
              onClick={() => setShowBezel(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showBezel
                  ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Bezel</span>
            </button>
          </div>

          {/* Quick Bottom Nav Screen Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              Bottom Nav:
            </span>
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'categories', label: 'Categories', icon: LayoutGrid },
              { id: 'search', label: 'Search', icon: Search },
              { id: 'cart', label: 'Cart', icon: ShoppingBag },
              { id: 'my-orders', label: 'Orders', icon: ClipboardList },
              { id: 'profile', label: 'Profile', icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScreen(tab.id as CustomerScreenType)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area: Phone Canvas with Rules on Left, Directory on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Phone Simulator Canvas with Dimension Rules */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          {/* Top Horizontal Pixel Ruler */}
          {showRulers && (
            <div className="w-full flex flex-col items-center mb-2">
              <div 
                style={{ width: `${customWidth * (zoomLevel / 100)}px` }}
                className="h-6 bg-slate-800 text-emerald-300 rounded-md border border-slate-700 flex items-center justify-between px-2 text-[10px] font-mono shadow-xs select-none"
              >
                <span>0px</span>
                <span className="font-bold">⟵ Width: {customWidth}px ⟶</span>
                <span>{customWidth}px</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            {/* Left Vertical Pixel Ruler */}
            {showRulers && (
              <div 
                style={{ height: `${customHeight * (zoomLevel / 100)}px` }}
                className="w-6 bg-slate-800 text-emerald-300 rounded-md border border-slate-700 flex flex-col items-center justify-between py-2 text-[9px] font-mono shadow-xs select-none [writing-mode:vertical-lr]"
              >
                <span>0px</span>
                <span className="font-bold">Height: {customHeight}px</span>
                <span>{customHeight}px</span>
              </div>
            )}

            {/* Scaled Device Container */}
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                width: `${customWidth}px`,
                height: `${customHeight}px`,
                marginBottom: `${((zoomLevel / 100) - 1) * customHeight}px`
              }}
              className="transition-transform duration-200"
            >
              {/* Device Frame */}
              <div
                key={deviceKey}
                style={{
                  width: `${customWidth}px`,
                  height: `${customHeight}px`,
                  borderRadius: showBezel ? `${activePresetObj.radius}px` : '16px'
                }}
                className={`overflow-hidden relative flex flex-col shadow-2xl transition-all duration-300 ${
                  showBezel
                    ? phoneColor === 'midnight'
                      ? 'border-[12px] border-slate-950 bg-black shadow-slate-950/60'
                      : phoneColor === 'emerald'
                      ? 'border-[12px] border-emerald-950 bg-emerald-950 shadow-emerald-950/40'
                      : phoneColor === 'silver'
                      ? 'border-[12px] border-slate-400 bg-slate-300 shadow-slate-400/40'
                      : 'border-[12px] border-amber-800 bg-amber-950 shadow-amber-950/40'
                    : 'border border-slate-300 shadow-xl'
                }`}
              >
                {/* Dynamic Island / Notch centered in safe area */}
                {showBezel && activePresetObj.notchType === 'dynamic-island' && (
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-40 flex items-center justify-end px-2 pointer-events-none shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
                  </div>
                )}

                {showBezel && activePresetObj.notchType === 'notch' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-4 bg-black rounded-b-2xl z-40 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
                  </div>
                )}

                {showBezel && activePresetObj.notchType === 'punch-hole' && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-40 pointer-events-none border border-slate-800"></div>
                )}

                {/* Embedded Customer App Instance */}
                <div className="w-full h-full bg-white overflow-hidden flex flex-col relative">
                  <CustomerAppProvider key={`${activeScreen}-${deviceKey}`} initialScreen={activeScreen}>
                    <CustomerMobileApp isEmbedded={true} />
                  </CustomerAppProvider>
                </div>

                {/* Home Indicator Bar */}
                {showBezel && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/40 rounded-full z-40 pointer-events-none"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 23 Screen Directory & Testing Shortcuts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Bottom Navigation Bar Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Bottom Navigation Bar Tabs
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Persistent Tab Bar
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Directly jump to any core bottom navigation view:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'home', label: '🏠 Home Dashboard', color: 'hover:border-emerald-500' },
                { id: 'categories', label: '📂 Categories Grid', color: 'hover:border-emerald-500' },
                { id: 'search', label: '🔍 Live Search', color: 'hover:border-emerald-500' },
                { id: 'cart', label: '🛒 Cart & Checkout', color: 'hover:border-emerald-500' },
                { id: 'my-orders', label: '📋 My Orders', color: 'hover:border-emerald-500' },
                { id: 'profile', label: '👤 Profile & Settings', color: 'hover:border-emerald-500' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id as CustomerScreenType)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    activeScreen === item.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {activeScreen === item.id && <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Full Screen Directory */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                All 23 Screen Directory
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                100% Functional
              </span>
            </div>

            {/* Screen Groups */}
            {['Browse & Catalog', 'Orders & Checkout', 'User & Account', 'Auth & Onboarding'].map(group => {
              const screensInGroup = allScreens.filter(s => s.group === group);
              return (
                <div key={group} className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                    {group}
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {screensInGroup.map(screen => {
                      const isActive = activeScreen === screen.id;
                      return (
                        <button
                          key={screen.id}
                          onClick={() => setActiveScreen(screen.id)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'bg-white border-slate-200/80 text-slate-700 hover:border-emerald-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {screen.number}
                            </span>
                            <span>{screen.title}</span>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAppManagementPage;
