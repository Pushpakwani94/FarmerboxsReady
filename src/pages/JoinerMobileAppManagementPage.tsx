import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  Share2,
  Users,
  Building2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Send,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Package,
  Layers,
  Phone,
  MapPin,
  CircleDollarSign,
  ArrowUpRight,
  Sliders,
  Check,
  RotateCcw,
  Apple
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApkDownloadModal } from '../components/Modals/ApkDownloadModal';
import { MobileDeviceSimulator } from '../mobileApp/MobileDeviceSimulator';
import { JoinerAppProvider } from '../mobileApp/JoinerAppContext';
import type { OrderStatus } from '../types';

export const JoinerMobileAppManagementPage: React.FC = () => {
  const {
    joiners,
    hotels,
    orders,
    drivers,
    setActiveTab,
    setSelectedJoiner,
    setSelectedHotel,
    setSelectedOrder,
    updateOrderStatus,
    addNotification
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'joiners' | 'hotels' | 'orders' | 'simulator'
  >('overview');

  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<'android' | 'ios'>('android');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [otaBroadcastSuccess, setOtaBroadcastSuccess] = useState(false);
  const [dispatchedOrderId, setDispatchedOrderId] = useState<string | null>(null);

  const apkFileName = 'farmerbox-joiner-v2.5.0.apk';
  const iosFileName = 'farmerbox-joiner-ios.zip';

  // Trigger browser APK download
  const handleDownloadApk = () => {
    const link = document.createElement('a');
    link.href = `/${apkFileName}`;
    link.download = apkFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser iOS Zip download
  const handleDownloadIos = () => {
    const link = document.createElement('a');
    link.href = `/${iosFileName}`;
    link.download = iosFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Push OTA update trigger: Sends live update notification to all mobile app joiners
  const handleTriggerOta = () => {
    setOtaBroadcastSuccess(true);
    addNotification({
      title: '🚀 App Update v2.5.0 Available!',
      message: 'FarmerBox v2.5.0 is now live! Includes Dal & Pulses category, active hotel toggle, and reorder fixes.',
      subtitle: 'Tap to update to latest build v2.5.0',
      userType: 'Joiners',
      category: 'System',
      iconType: 'system',
      status: 'Sent',
      dateTime: new Date().toLocaleString(),
      isAppUpdate: true,
      hasUpdateFile: true,
      fileName: apkFileName,
      version: 'v2.5.0'
    });
    setTimeout(() => setOtaBroadcastSuccess(false), 3500);
  };

  // Filter joiners
  const filteredJoiners = useMemo(() => {
    return joiners.filter(j => {
      const matchSearch =
        j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.mobile.includes(searchTerm) ||
        j.zone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchZone = zoneFilter === 'All Zones' || j.zone === zoneFilter;
      return matchSearch && matchZone;
    });
  }, [joiners, searchTerm, zoneFilter]);

  // Filter hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const matchSearch =
        (h.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.joiner || h.assignedJoiner || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.zone || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchZone = zoneFilter === 'All Zones' || h.zone === zoneFilter;
      return matchSearch && matchZone;
    });
  }, [hotels, searchTerm, zoneFilter]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch =
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.joiner || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, orderStatusFilter]);

  const uniqueZones = ['All Zones', ...Array.from(new Set(joiners.map(j => j.zone)))];

  // Quick Dispatch vegetable order handler
  const handleDispatchVegetables = (orderId: string) => {
    updateOrderStatus(orderId, 'Out for Delivery');
    setDispatchedOrderId(orderId);
    setTimeout(() => setDispatchedOrderId(null), 3000);
  };

  const handleMarkDelivered = (orderId: string) => {
    updateOrderStatus(orderId, 'Delivered');
  };

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#15803d] to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-700/20 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                  Joiner Mobile App Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#15803d] text-xs font-black flex items-center gap-1 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Android APK & iOS v2.4.1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage hotels, joiners, vegetable orders and deliver fresh vegetables • Android & iOS app distribution
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadApk}
              className="px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download APK (v2.4.1)
            </button>

            <button
              onClick={handleDownloadIos}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Apple className="w-4 h-4 text-emerald-400" /> iOS App (.zip)
            </button>

            <button
              onClick={() => {
                setModalPlatform('android');
                setIsApkModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#15803d] border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> Scan QR
            </button>

            <button
              onClick={() => {
                setModalPlatform('android');
                setIsApkModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share Link
            </button>

            <button
              onClick={() => setActiveSubTab('simulator')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-200" /> Interactive Simulator
            </button>
          </div>
        </div>

        {/* 6 Key Operational KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-emerald-800 flex items-center justify-between">
              Total App Installs <Download className="w-3 h-3 text-emerald-600" />
            </p>
            <p className="text-base font-black text-slate-900 mt-1">3,480+</p>
            <span className="text-[10px] text-emerald-700 font-bold">↑ 18% this month</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
              Active Joiners <Users className="w-3 h-3 text-slate-400" />
            </p>
            <p className="text-base font-black text-slate-900 mt-1">{joiners.length}</p>
            <span className="text-[10px] text-slate-500 font-medium">842 online today</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
              Onboarded Hotels <Building2 className="w-3 h-3 text-slate-400" />
            </p>
            <p className="text-base font-black text-slate-900 mt-1">{hotels.length}</p>
            <span className="text-[10px] text-slate-500 font-medium">Across 6 Pune zones</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
              Daily Veg Orders <ShoppingBag className="w-3 h-3 text-slate-400" />
            </p>
            <p className="text-base font-black text-slate-900 mt-1">{orders.length}</p>
            <span className="text-[10px] text-emerald-700 font-bold">100% farm-fresh</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
              Fresh Veg Delivered <Package className="w-3 h-3 text-slate-400" />
            </p>
            <p className="text-base font-black text-slate-900 mt-1">12.8 Tons</p>
            <span className="text-[10px] text-emerald-700 font-bold">Tomatoes, Onions, Leafy</span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-amber-800 flex items-center justify-between">
              Joiner Commission <CircleDollarSign className="w-3 h-3 text-amber-600" />
            </p>
            <p className="text-base font-black text-amber-900 mt-1">₹3,48,000</p>
            <span className="text-[10px] text-amber-700 font-bold">₹100 / order delivered</span>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex border-b border-slate-200 pt-1 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" /> App Overview & APK Distribution
          </button>
          <button
            onClick={() => setActiveSubTab('joiners')}
            className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'joiners'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> Joiners Fleet ({joiners.length})
          </button>
          <button
            onClick={() => setActiveSubTab('hotels')}
            className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'hotels'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> Hotels Supply ({hotels.length})
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'orders'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" /> Fresh Vegetable Deliveries ({orders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'simulator'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> Live Mobile Simulator (14 Screens)
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: App Overview & APK Distribution */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5">
          {/* Big Hero APK Download Banner */}
          <div className="bg-gradient-to-br from-[#14532d] via-[#15803d] to-[#16a34a] rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
              <Smartphone className="w-80 h-80" />
            </div>

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold text-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Verified Release • Built with React Native & Capacitor iOS/Android Bridge</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                FarmerBox Joiner Mobile App (v2.4.1)
              </h2>

              <p className="text-sm text-emerald-100 font-medium leading-relaxed">
                Empower your field joiners to register local hotels, capture daily fresh vegetable demand (crates of Tomatoes, Onions, Potatoes, Greens), trigger immediate delivery dispatch from farm warehouses, and earn automatic ₹100 commissions per completed order.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadApk}
                  className="px-5 py-3.5 bg-white hover:bg-emerald-50 text-[#15803d] font-black text-sm rounded-2xl shadow-lg flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download APK (Android • 63.3 MB)
                </button>

                <button
                  onClick={handleDownloadIos}
                  className="px-5 py-3.5 bg-slate-900/90 hover:bg-slate-900 text-white font-black text-sm rounded-2xl shadow-lg border border-white/20 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Apple className="w-4 h-4 text-emerald-400" /> Download iOS App (.zip • 47.8 MB)
                </button>

                <button
                  onClick={() => {
                    setModalPlatform('android');
                    setIsApkModalOpen(true);
                  }}
                  className="px-4 py-3.5 bg-emerald-800/60 hover:bg-emerald-800/80 text-white font-bold text-sm rounded-2xl border border-emerald-400/40 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-300" /> Scan QR
                </button>

                <button
                  onClick={handleTriggerOta}
                  className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${otaBroadcastSuccess ? 'animate-spin text-emerald-300' : ''}`} />
                  {otaBroadcastSuccess ? 'Push Update Broadcast Sent!' : 'Push OTA Update'}
                </button>
              </div>

              {/* Version Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-emerald-600/40 text-xs">
                <div>
                  <span className="text-emerald-200/80 text-[11px] font-bold">App Identifier:</span>
                  <p className="font-mono font-bold text-white">com.farmerbox.joiner</p>
                </div>
                <div>
                  <span className="text-emerald-200/80 text-[11px] font-bold">Version & Build:</span>
                  <p className="font-mono font-bold text-white">v2.4.1 (Build 42)</p>
                </div>
                <div>
                  <span className="text-emerald-200/80 text-[11px] font-bold">Supported Platforms:</span>
                  <p className="font-mono font-bold text-white">Android 8+ & iOS 14+</p>
                </div>
                <div>
                  <span className="text-emerald-200/80 text-[11px] font-bold">Release Channel:</span>
                  <p className="font-mono font-bold text-emerald-200">Production (Signed)</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Column Information Grid: Release Notes, Device Stats, ADB & iOS Instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: What's New in App */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">v2.4.1 Release Highlights</h3>
                  <p className="text-[11px] text-slate-500">Live for all joiners</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <strong className="text-slate-900 block">🥦 Fresh Vegetable Express Ordering</strong>
                  <p className="text-slate-600 text-[11px]">
                    Joiners can select hotel, choose vegetable crates (Tomatoes, Onions, Potatoes, Chillies, Cabbage), and schedule morning kitchen delivery.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <strong className="text-slate-900 block">💰 Instant ₹100 Commission Payout</strong>
                  <p className="text-slate-600 text-[11px]">
                    Automatic balance credit upon hotel delivery confirmation with live withdrawal request support.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <strong className="text-slate-900 block">🚚 Real-time Delivery Vehicle Tracking</strong>
                  <p className="text-slate-600 text-[11px]">
                    Live driver assignment (Tata Ace vehicle #, driver contact) and delivery challan generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Distribution & Telemetry */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Mobile Device Telemetry</h3>
                    <p className="text-[11px] text-slate-500">Fleet health across devices</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  99.4% Crash-free
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>v2.4.1 (Latest Version)</span>
                    <span className="font-bold text-slate-900">88.4% (1,308 devices)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '88.4%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>v2.3.8 (Previous Build)</span>
                    <span className="font-bold text-slate-900">9.2% (136 devices)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '9.2%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Older Builds</span>
                    <span className="font-bold text-slate-900">2.4% (36 devices)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '2.4%' }}></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                  <p>• Supported Models: Android (Samsung, Redmi, Realme) & iOS (iPhone 11 - 16 Pro)</p>
                  <p>• Operating Systems: Android 12-15 • iOS 16-18</p>
                </div>
              </div>
            </div>

            {/* Column 3: Fast Developer ADB & iOS Setup */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <Download className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Physical Device Deployment</h3>
                    <p className="text-[11px] text-slate-500">Android USB & iOS Xcode</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1.5">
                <p className="text-emerald-400 font-bold flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> Android USB Install:
                </p>
                <p className="text-slate-300 select-all font-bold">adb install -r farmerbox-joiner-v2.4.1.apk</p>
                
                <p className="text-emerald-400 font-bold flex items-center gap-1 pt-2 border-t border-slate-800">
                  <Apple className="w-3.5 h-3.5" /> iOS Xcode Project:
                </p>
                <p className="text-slate-300 select-all font-bold">open ios/App/App.xcworkspace</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setModalPlatform('android');
                    setIsApkModalOpen(true);
                  }}
                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#15803d] border border-emerald-200 rounded-lg text-[11px] font-bold text-center cursor-pointer transition-colors"
                >
                  Android Guide
                </button>
                <button
                  onClick={() => {
                    setModalPlatform('ios');
                    setIsApkModalOpen(true);
                  }}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-bold text-center cursor-pointer transition-colors"
                >
                  iOS Xcode Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Joiners Fleet (Mobile App Users) */}
      {activeSubTab === 'joiners' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Joiners Fleet Management</h3>
              <p className="text-xs text-slate-500">
                Field agents using the mobile app to onboard hotels and place vegetable orders
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search joiner, phone, zone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 w-64"
                />
              </div>

              <select
                value={zoneFilter}
                onChange={e => setZoneFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                {uniqueZones.map(z => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Joiner</th>
                  <th className="py-3 px-3">Zone</th>
                  <th className="py-3 px-3">App Version</th>
                  <th className="py-3 px-3">Device Model</th>
                  <th className="py-3 px-3">Hotels Onboarded</th>
                  <th className="py-3 px-3">Orders Placed</th>
                  <th className="py-3 px-3">Commission Earned</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJoiners.map(joiner => (
                  <tr key={joiner.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={joiner.avatar}
                          alt={joiner.name}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-600/30"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{joiner.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{joiner.mobile}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {joiner.zone}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        v2.4.1 (Active)
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium">
                      Samsung Galaxy M34 (Android 14)
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{joiner.totalHotels} Hotels</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{joiner.totalOrders} Orders</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-extrabold text-[#15803d]">₹{joiner.totalEarnings.toLocaleString()}</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setIsApkModalOpen(true)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#15803d] rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          title="Send APK Link"
                        >
                          Send APK
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJoiner(joiner);
                            setActiveTab('Hotel Joiners');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Hotels Supply Management */}
      {activeSubTab === 'hotels' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hotels Supply Network</h3>
              <p className="text-xs text-slate-500">
                Hotels serviced with daily farm-fresh vegetables onboarded by Joiners
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search hotel, joiner, zone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 w-64"
                />
              </div>

              <button
                onClick={() => setActiveTab('Hotels')}
                className="px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" /> View Hotels Directory
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Hotel Name</th>
                  <th className="py-3 px-3">Owner / Contact</th>
                  <th className="py-3 px-3">Assigned Joiner</th>
                  <th className="py-3 px-3">Zone</th>
                  <th className="py-3 px-3">Daily Delivery Slot</th>
                  <th className="py-3 px-3">Fresh Veg Demand</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHotels.map(hotel => (
                  <tr key={hotel.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{hotel.name}</p>
                          <p className="text-[11px] text-slate-500">{hotel.address}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{hotel.ownerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{hotel.mobile}</p>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-600" /> {hotel.joiner}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {hotel.zone}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700">
                      6:00 AM - 8:00 AM Early Morning
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">4-6 Crates / Day</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Active Kitchen
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setActiveTab('Hotels');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Fresh Vegetable Deliveries */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Fresh Vegetable Orders & Dispatch Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Orders placed via Joiner Mobile App • Farm harvest to hotel kitchen fulfillment
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['All', 'Pending', 'Confirmed', 'Out for Delivery', 'Delivered'].map(st => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-[#15803d] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order ID & Hotel</th>
                  <th className="py-3 px-3">Joiner</th>
                  <th className="py-3 px-3">Fresh Vegetable Items</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Commission</th>
                  <th className="py-3 px-3">Delivery Status & Pipeline</th>
                  <th className="py-3 px-4 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-mono font-black text-[#15803d] text-xs block">{order.id}</span>
                        <span className="font-bold text-slate-900 text-xs">{order.hotelName}</span>
                        <span className="text-[11px] text-slate-500 block">{order.zone} • {order.time || 'Morning Delivery'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{order.joiner}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="max-w-xs space-y-0.5">
                        <span className="font-semibold text-slate-800 block truncate">
                          {order.items && order.items.length > 0
                            ? order.items.map(i => `${i.qty} ${i.unit} ${i.productName}`).join(', ')
                            : 'Fresh Vegetables (Tomatoes, Onions, Potatoes)'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          ✓ Farm Quality Tested & Grade A Graded
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-extrabold text-slate-900">₹{order.amount.toLocaleString()}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                        +₹{order.commission}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Out for Delivery'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'Confirmed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status === 'Delivered' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : order.status === 'Out for Delivery' ? (
                          <Truck className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status !== 'Delivered' && order.status !== 'Out for Delivery' && (
                          <button
                            onClick={() => handleDispatchVegetables(order.id)}
                            className="px-2.5 py-1 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" /> Dispatch Fresh Veg
                          </button>
                        )}

                        {order.status === 'Out for Delivery' && (
                          <button
                            onClick={() => handleMarkDelivered(order.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark Delivered
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveTab('Orders');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Live Interactive Mobile Simulator */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-xs font-black">Interactive 14-Screen Joiner App Simulator</p>
                <p className="text-[11px] text-emerald-200 font-medium">
                  Test full hotel registration, vegetable basket selection, delivery booking, and ₹100 commission crediting live in your browser.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadApk}
                className="px-3.5 py-1.5 bg-white text-[#15803d] font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download APK
              </button>
              <button
                onClick={handleDownloadIos}
                className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Apple className="w-3.5 h-3.5 text-emerald-400" /> iOS (.zip)
              </button>
              <button
                onClick={() => {
                  setModalPlatform('android');
                  setIsApkModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-xl border border-emerald-400/40 hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" /> Scan QR
              </button>
            </div>
          </div>

          <JoinerAppProvider>
            <MobileDeviceSimulator />
          </JoinerAppProvider>
        </div>
      )}

      {/* Shared APK & iOS Download & QR Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        defaultPlatform={modalPlatform}
      />
    </div>
  );
};
