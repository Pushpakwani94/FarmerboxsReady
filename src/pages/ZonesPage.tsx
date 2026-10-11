import React, { useState, useMemo } from 'react';
import { useApp, deduplicateHotels, deduplicateJoiners, deduplicateOrders } from '../context/AppContext';
import {
  MapPin,
  Building2,
  Users,
  ShoppingBag,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  CheckCircle2,
  X,
  Shield,
  Layers,
  Sparkles,
  Compass,
  UserCheck,
  TrendingUp,
  ExternalLink,
  Store,
  Clock,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Truck
} from 'lucide-react';
import type { Zone, Hotel, Joiner, Order } from '../types';
import { authService } from '../firebase/authService';
import { calculateCommission } from '../utils/commission';

interface PuneZoneGeo {
  id: string;
  name: string;
  shortLabel: string;
  category: string;
  path: string;
  center: { x: number; y: number };
  fill: string;
  activeFill: string;
  stroke: string;
  activeStroke: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  aliases: string[];
}

const PUNE_ZONES_DATA: PuneZoneGeo[] = [
  {
    id: 'hinjawadi',
    name: 'Hinjawadi',
    shortLabel: 'Hinjawadi',
    category: 'North-West Tech Hub (Phase 1/2/3)',
    path: 'M 35 70 C 80 40, 130 45, 175 60 C 185 95, 180 130, 160 160 C 115 165, 75 160, 45 140 C 30 115, 25 90, 35 70 Z',
    center: { x: 105, y: 105 },
    fill: '#f3e8ff',
    activeFill: '#e9d5ff',
    stroke: '#a855f7',
    activeStroke: '#7e22ce',
    textColor: '#6b21a8',
    badgeBg: '#f3e8ff',
    badgeText: '#7e22ce',
    aliases: ['hinjawadi', 'hinjewadi', 'maan', 'phase 1', 'phase 2', 'phase 3', 'marunji']
  },
  {
    id: 'pimpri-chinchwad',
    name: 'Pimpri Chinchwad',
    shortLabel: 'PCMC / Wakad',
    category: 'North Industrial & Auto Cluster',
    path: 'M 175 60 C 240 45, 310 50, 370 70 C 375 110, 360 145, 330 165 C 275 170, 220 165, 160 160 C 180 130, 185 95, 175 60 Z',
    center: { x: 265, y: 110 },
    fill: '#ede9fe',
    activeFill: '#ddd6fe',
    stroke: '#8b5cf6',
    activeStroke: '#6d28d9',
    textColor: '#5b21b6',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    aliases: ['pimpri', 'chinchwad', 'pcmc', 'nigdi', 'bhosari', 'wakad', 'tathawade', 'dange chowk']
  },
  {
    id: 'baner',
    name: 'Baner',
    shortLabel: 'Baner',
    category: 'West IT & Commercial High Street',
    path: 'M 60 170 C 115 165, 160 160, 205 170 C 215 205, 210 240, 190 265 C 145 270, 100 260, 65 240 C 50 215, 50 190, 60 170 Z',
    center: { x: 135, y: 215 },
    fill: '#fce7f3',
    activeFill: '#fbcfe8',
    stroke: '#ec4899',
    activeStroke: '#be185d',
    textColor: '#9d174d',
    badgeBg: '#fdf2f8',
    badgeText: '#be185d',
    aliases: ['baner', 'balewadi', 'high street', 'sus', 'mahalunge']
  },
  {
    id: 'aundh',
    name: 'Aundh',
    shortLabel: 'Aundh',
    category: 'West-Central Tech Zone',
    path: 'M 205 170 C 260 165, 305 170, 345 185 C 340 220, 325 250, 290 265 C 250 270, 215 265, 190 265 C 210 240, 215 205, 205 170 Z',
    center: { x: 265, y: 215 },
    fill: '#dcfce7',
    activeFill: '#bbf7d0',
    stroke: '#22c55e',
    activeStroke: '#15803d',
    textColor: '#15803d',
    badgeBg: '#ecfdf5',
    badgeText: '#047857',
    aliases: ['aundh', 'pashan', 'university', 'bremen chowk', 'baner road']
  },
  {
    id: 'kothrud',
    name: 'Kothrud',
    shortLabel: 'Kothrud',
    category: 'South-West Prime Residential Hub',
    path: 'M 75 275 C 130 270, 185 270, 230 285 C 235 330, 215 375, 175 405 C 120 405, 75 385, 55 350 C 45 320, 55 295, 75 275 Z',
    center: { x: 145, y: 340 },
    fill: '#fef9c3',
    activeFill: '#fef08a',
    stroke: '#eab308',
    activeStroke: '#a16207',
    textColor: '#854d0e',
    badgeBg: '#fefce8',
    badgeText: '#a16207',
    aliases: ['kothrud', 'karve nagar', 'paud road', 'bavdhan', 'warje', 'chandani chowk']
  },
  {
    id: 'shivajinagar',
    name: 'Shivajinagar',
    shortLabel: 'Shivajinagar',
    category: 'Metropolitan Core & Central Hub',
    path: 'M 230 285 C 280 275, 335 275, 375 290 C 385 335, 365 380, 325 410 C 275 415, 225 405, 175 405 C 215 375, 235 330, 230 285 Z',
    center: { x: 280, y: 345 },
    fill: '#ffedd5',
    activeFill: '#fed7aa',
    stroke: '#f97316',
    activeStroke: '#c2410c',
    textColor: '#9a3412',
    badgeBg: '#fff7ed',
    badgeText: '#c2410c',
    aliases: ['shivajinagar', 'jm road', 'fc road', 'deccan', 'swargate', 'camp', 'pune', 'central']
  },
  {
    id: 'viman-nagar',
    name: 'Viman Nagar',
    shortLabel: 'Viman Nagar',
    category: 'North-East Airport Corridor',
    path: 'M 370 70 C 440 60, 515 65, 575 90 C 580 135, 565 175, 530 200 C 475 200, 420 190, 375 180 C 375 140, 375 105, 370 70 Z',
    center: { x: 470, y: 135 },
    fill: '#e0f2fe',
    activeFill: '#bae6fd',
    stroke: '#0ea5e9',
    activeStroke: '#0284c7',
    textColor: '#0369a1',
    badgeBg: '#f0f9ff',
    badgeText: '#0369a1',
    aliases: ['viman nagar', 'kalyani nagar', 'airport', 'tingre nagar', 'vimannagar', 'yerawada', 'koregaon park']
  },
  {
    id: 'kharadi',
    name: 'Kharadi',
    shortLabel: 'Kharadi',
    category: 'East EON IT Corridor & WTC',
    path: 'M 575 90 C 630 110, 680 145, 700 190 C 700 235, 675 270, 630 295 C 585 285, 545 265, 515 240 C 540 200, 565 150, 575 90 Z',
    center: { x: 615, y: 195 },
    fill: '#fae8ff',
    activeFill: '#f5d0fe',
    stroke: '#d946ef',
    activeStroke: '#a21caf',
    textColor: '#86198f',
    badgeBg: '#fdf4ff',
    badgeText: '#a21caf',
    aliases: ['kharadi', 'eon', 'wtc', 'chandan nagar', 'mundhwa', 'nagar road', 'wagholi']
  },
  {
    id: 'magarpatta',
    name: 'Magarpatta',
    shortLabel: 'Magarpatta',
    category: 'Cybercity & Township Hub',
    path: 'M 375 290 C 430 270, 490 265, 540 280 C 545 320, 530 360, 495 390 C 445 395, 395 385, 355 365 C 370 335, 375 310, 375 290 Z',
    center: { x: 450, y: 330 },
    fill: '#ccfbf1',
    activeFill: '#99f6e4',
    stroke: '#14b8a6',
    activeStroke: '#0f766e',
    textColor: '#0f766e',
    badgeBg: '#f0fdfa',
    badgeText: '#0f766e',
    aliases: ['magarpatta', 'cybercity', 'amanora township', 'hadapsar cybercity']
  },
  {
    id: 'hadapsar',
    name: 'Hadapsar',
    shortLabel: 'Hadapsar',
    category: 'South-East Commercial & Industrial Zone',
    path: 'M 495 390 C 545 365, 600 355, 650 375 C 660 415, 635 445, 580 455 C 510 455, 450 445, 400 425 C 440 405, 470 395, 495 390 Z',
    center: { x: 545, y: 415 },
    fill: '#ffe4e6',
    activeFill: '#fecdd3',
    stroke: '#f43f5e',
    activeStroke: '#be123c',
    textColor: '#be123c',
    badgeBg: '#fff1f2',
    badgeText: '#be123c',
    aliases: ['hadapsar', 'amanora', 'sasane nagar', 'sp infocity', 'saswad', 'solapur road', 'undri', 'nibm']
  }
];

// Helper: Normalize string for fuzzy zone matching
const normalizeStr = (s?: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[\s\-_,]+/g, ' ')
    .replace(/zone/g, '')
    .trim();

// Robust Zone Matcher
const isMatchZone = (entityZoneOrArea: string | undefined, zone: Zone): boolean => {
  if (!entityZoneOrArea || !zone) return false;
  const target = normalizeStr(entityZoneOrArea);
  const zName = normalizeStr(zone.name);
  if (!target || !zName) return false;

  // Direct exact or substring match
  if (target === zName || target.includes(zName) || zName.includes(target)) return true;

  // Match against coverage area locations
  if (zone.areaLocations) {
    const areas = zone.areaLocations
      .split(/[,/|•]/)
      .map(a => normalizeStr(a))
      .filter(Boolean);
    if (areas.some(a => target.includes(a) || a.includes(target))) {
      return true;
    }
  }

  return false;
};

export const ZonesPage: React.FC = () => {
  const {
    zones,
    selectedZone,
    setSelectedZone,
    setIsAddZoneOpen,
    updateZone,
    deleteZone,
    confirmAction,
    setActiveTab,
    setSelectedJoiner,
    setSelectedHotel,
    setSelectedOrder,
    joiners,
    hotels,
    orders,
    drivers
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [hoveredMapZone, setHoveredMapZone] = useState<string | null>(null);
  const [showRiverLayer, setShowRiverLayer] = useState(true);
  const [zoneDetailTab, setZoneDetailTab] = useState<'joiners' | 'hotels' | 'orders' | 'drivers'>('joiners');

  // Filtered Zones List
  const filteredZones = useMemo(() => {
    return zones.filter(z => {
      const term = searchTerm.trim().toLowerCase();
      const name = (z.name || '').toLowerCase();
      const areas = (z.areaLocations || '').toLowerCase();
      const matchesSearch = !term || name.includes(term) || areas.includes(term);
      const matchesStatus = statusFilter === 'All' || (z.status || 'Active') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [zones, searchTerm, statusFilter]);

  // Active Selected Zone
  const activeZone = useMemo(() => {
    if (selectedZone && zones.some(z => String(z.id) === String(selectedZone.id))) {
      return zones.find(z => String(z.id) === String(selectedZone.id)) || selectedZone;
    }
    return filteredZones[0] || zones[0] || null;
  }, [selectedZone, zones, filteredZones]);

  // Unique Deduplicated Entities
  const uniqueHotels = useMemo(() => deduplicateHotels(hotels), [hotels]);
  const uniqueJoiners = useMemo(() => deduplicateJoiners(joiners), [joiners]);
  const uniqueOrders = useMemo(() => deduplicateOrders(orders), [orders]);

  // Dynamic Zone Stats Calculator
  const getZoneLiveStats = (zone: Zone | null) => {
    if (!zone) {
      return {
        hotelsList: [],
        joinersList: [],
        ordersList: [],
        driversList: [],
        hotelsCount: 0,
        joinersCount: 0,
        ordersCount: 0,
        driversCount: 0,
        salesCount: 0,
        deliveredOrdersCount: 0,
        pendingOrdersCount: 0,
        commissionsTotal: 0
      };
    }

    // 1. Matched Hotels
    const zHotels = uniqueHotels.filter(h => isMatchZone(h.zone, zone) || isMatchZone(h.address, zone));

    // 2. Matched Joiners (Live real joiners assigned to this zone - supports 10+ joiners per zone)
    const zJoiners = uniqueJoiners.filter(j => isMatchZone(j.zone, zone));

    // 3. Matched Drivers assigned to this zone
    const zDrivers = (drivers || []).filter(d => isMatchZone(d.zone, zone) || isMatchZone((d as any).assignedZone, zone));

    // 4. Matched Orders: check order's zone, order's hotelZone, or if order's hotel belongs to this zone
    const zHotelIds = new Set(zHotels.map(h => String(h.id || (h as any).hotelCode || h.name)));
    const zOrders = uniqueOrders.filter(o => {
      if (isMatchZone(o.zone, zone) || isMatchZone(o.zoneName, zone) || isMatchZone(o.hotelZone, zone)) {
        return true;
      }
      if (o.hotelId && zHotelIds.has(String(o.hotelId))) return true;
      if (o.hotelName && zHotels.some(h => normalizeStr(h.name) === normalizeStr(o.hotelName))) return true;
      return false;
    });

    const zSales = zOrders.reduce((sum, o) => sum + (Number(o.amount || o.totalAmount) || 0), 0);
    const deliveredCount = zOrders.filter(o => o.status === 'Delivered' || o.orderStatus === 'Delivered').length;
    const pendingCount = zOrders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Accepted' || o.status === 'Out for Delivery').length;

    // 5. Zone Commission attributed across delivered orders
    const zCommissions = zOrders.filter(o => o.status === 'Delivered' || o.orderStatus === 'Delivered').reduce((sum, o) => {
      const comm = (o as any).commissionAmount !== undefined && (o as any).commissionAmount !== null
        ? Number((o as any).commissionAmount)
        : ((o as any).commission !== undefined && (o as any).commission !== null
          ? Number((o as any).commission)
          : calculateCommission(Number(o.totalAmount || (o as any).amount || 0)));
      return sum + comm;
    }, 0);

    return {
      hotelsList: zHotels,
      joinersList: zJoiners,
      ordersList: zOrders,
      driversList: zDrivers,
      hotelsCount: zHotels.length,
      joinersCount: zJoiners.length,
      ordersCount: zOrders.length,
      driversCount: zDrivers.length,
      salesCount: zSales,
      deliveredOrdersCount: deliveredCount,
      pendingOrdersCount: pendingCount,
      commissionsTotal: zCommissions
    };
  };

  // Top Aggregates
  const totalSalesAmount = useMemo(() => {
    return uniqueOrders.reduce((sum, o) => sum + (Number(o.amount || o.totalAmount) || 0), 0);
  }, [uniqueOrders]);

  const activeZonesCount = useMemo(() => {
    return zones.filter(z => (z.status || 'Active') === 'Active').length;
  }, [zones]);

  const activeHotelsCount = useMemo(() => {
    return uniqueHotels.filter(h => (h.status || 'Active') === 'Active').length;
  }, [uniqueHotels]);

  const activeJoinersCount = useMemo(() => {
    return uniqueJoiners.filter(j => (j.status || 'Active') === 'Active').length;
  }, [uniqueJoiners]);

  const deliveredOrdersCount = useMemo(() => {
    return uniqueOrders.filter(o => o.status === 'Delivered' || o.orderStatus === 'Delivered').length;
  }, [uniqueOrders]);

  // Selected Zone Live Data
  const activeZoneStats = useMemo(() => {
    return getZoneLiveStats(activeZone);
  }, [activeZone, uniqueHotels, uniqueJoiners, uniqueOrders]);

  // Map zone click handler
  const handleMapZoneClick = (geoZone: PuneZoneGeo) => {
    const found = zones.find(z => {
      const zName = (z.name || '').toLowerCase();
      return (
        geoZone.aliases.some(alias => zName.includes(alias)) ||
        zName.includes(geoZone.name.toLowerCase()) ||
        geoZone.name.toLowerCase().includes(zName)
      );
    });
    if (found) {
      setSelectedZone(found);
    } else {
      // Auto-focus or select if matched
      const fallbackZone: Zone = {
        id: Date.now(),
        name: geoZone.name,
        areaLocations: geoZone.category,
        hotelsCount: 0,
        joinersCount: 0,
        ordersThisMonth: 0,
        salesThisMonth: 0,
        status: 'Active',
        assignedJoinersList: []
      };
      setSelectedZone(fallbackZone);
    }
  };

  const isGeoZoneActive = (geoZone: PuneZoneGeo) => {
    if (!activeZone) return false;
    const activeName = (activeZone.name || '').toLowerCase();
    return (
      geoZone.aliases.some(alias => activeName.includes(alias)) ||
      activeName.includes(geoZone.name.toLowerCase()) ||
      geoZone.name.toLowerCase().includes(activeName)
    );
  };

  const handleDelete = (e: React.MouseEvent, zoneId: number | string, zoneName: string) => {
    e.stopPropagation();
    confirmAction({
      title: 'Delete Zone',
      message: `Are you sure you want to delete '${zoneName}'? Associated hotels and joiners will remain safe in the system.`,
      entityName: zoneName,
      confirmLabel: 'Delete Zone',
      type: 'danger',
      onConfirm: () => deleteZone(zoneId)
    });
  };

  const handleToggleStatus = async (e: React.MouseEvent, zone: Zone) => {
    e.stopPropagation();
    const newStatus: 'Active' | 'Inactive' = (zone.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    await updateZone(zone.id, { status: newStatus });
  };

  const handleEditClick = (e: React.MouseEvent, zone: Zone) => {
    e.stopPropagation();
    setEditingZone({ ...zone });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;
    await updateZone(editingZone.id, editingZone);
    setEditingZone(null);
  };

  const handleNavigateToJoiner = (joiner: Joiner) => {
    setSelectedJoiner(joiner);
    setActiveTab('Hotel Joiners');
  };

  const handleNavigateToHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setActiveTab('Hotels');
  };

  const handleNavigateToOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('Orders');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top 6 KPI Metric Cards (100% Dynamic & Interactive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3 transition-all hover:shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500">Total Zones</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-xl font-bold text-slate-900 leading-none">{zones.length}</h3>
              <span className="text-[10px] text-emerald-700 font-bold truncate">({activeZonesCount} Active)</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Hotels')}
          className="bg-sky-50/80 hover:bg-sky-100/70 p-3.5 rounded-xl border border-sky-100 flex items-center gap-3 cursor-pointer transition-all hover:shadow-xs"
          title="Click to view Hotels"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500">Total Hotels</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-xl font-bold text-slate-900 leading-none">{uniqueHotels.length}</h3>
              <span className="text-[10px] text-sky-700 font-bold truncate">({activeHotelsCount} Active)</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Hotel Joiners')}
          className="bg-orange-50/80 hover:bg-orange-100/70 p-3.5 rounded-xl border border-orange-100 flex items-center gap-3 cursor-pointer transition-all hover:shadow-xs"
          title="Click to view Hotel Joiners"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500">Total Joiners</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-xl font-bold text-slate-900 leading-none">{uniqueJoiners.length}</h3>
              <span className="text-[10px] text-orange-700 font-bold truncate">({activeJoinersCount} Active)</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Orders')}
          className="bg-purple-50/80 hover:bg-purple-100/70 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3 cursor-pointer transition-all hover:shadow-xs"
          title="Click to view Orders"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500">Total Orders</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-xl font-bold text-slate-900 leading-none">{uniqueOrders.length}</h3>
              <span className="text-[10px] text-purple-700 font-bold truncate">({deliveredOrdersCount} Delivered)</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Orders')}
          className="bg-rose-50/80 hover:bg-rose-100/70 p-3.5 rounded-xl border border-rose-100 flex items-center gap-3 cursor-pointer transition-all hover:shadow-xs"
          title="Click to view Orders & Sales Revenue"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500">Total Sales</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-xl font-bold text-slate-900 leading-none">₹{totalSalesAmount.toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsAddZoneOpen(true)}
            className="w-full h-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Zone
          </button>
        </div>
      </div>

      {/* Full-width Zones List Table Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base text-slate-800 whitespace-nowrap">Zones List</h3>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 whitespace-nowrap">
              {filteredZones.length} {filteredZones.length === 1 ? 'Zone' : 'Zones'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search zone name or area..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={() => setIsAddZoneOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> New Zone
            </button>
          </div>
        </div>

        {/* Table View */}
        {filteredZones.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No zones match your filter criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3 w-12 whitespace-nowrap">#</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Zone Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Coverage / Areas</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Hotels</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Joiners</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Orders</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Sales</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredZones.map((z, idx) => {
                  const stats = getZoneLiveStats(z);
                  const isSelected = activeZone && String(activeZone.id) === String(z.id);
                  const isActive = (z.status || 'Active') === 'Active';

                  return (
                    <tr
                      key={z.id}
                      onClick={() => setSelectedZone(z)}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/90 font-semibold border-l-4 border-l-emerald-600'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3 font-medium text-slate-500 whitespace-nowrap">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <span className={isSelected ? 'text-emerald-900' : 'text-slate-800'}>{z.name}</span>
                          {z.addedBy === 'Admin' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                              <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap max-w-xs truncate" title={z.areaLocations}>
                        {z.areaLocations || '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-xs">
                          {stats.hotelsCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-xs">
                          {stats.joinersCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-xs">
                          {stats.ordersCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{stats.salesCount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={e => handleToggleStatus(e, z)}
                          title="Click to toggle status"
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={e => handleEditClick(e, z)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-emerald-50 cursor-pointer transition-colors"
                            title="Edit Zone"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleDelete(e, z.id, z.name)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete Zone"
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
        )}
      </div>

      {/* Selected Zone Details & Interactive Pune Map Section */}
      {activeZone && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          {/* Header Banner for Selected Zone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border-2 border-emerald-600 shadow-xs shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900">{activeZone.name}</h3>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    (activeZone.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeZone.status || 'Active'}
                  </span>
                  {activeZone.addedBy === 'Admin' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin Added
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeZone.areaLocations || 'Pune Operational Supply Zone'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={e => handleEditClick(e, activeZone)}
                className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Zone
              </button>
              <button
                onClick={e => handleDelete(e, activeZone.id, activeZone.name)}
                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                title="Delete Zone"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Zone Metrics & Deep-Dive Tabs (Col 6) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Zone Metrics 6-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                <div
                  onClick={() => setZoneDetailTab('hotels')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    zoneDetailTab === 'hotels' ? 'bg-sky-100/70 border-sky-300 ring-2 ring-sky-400' : 'bg-sky-50 border-sky-100 hover:bg-sky-100/50'
                  }`}
                >
                  <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3 text-sky-600" /> Hotels
                  </p>
                  <p className="font-bold text-sky-900 text-base mt-0.5">{activeZoneStats.hotelsCount}</p>
                </div>

                <div
                  onClick={() => setZoneDetailTab('joiners')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    zoneDetailTab === 'joiners' ? 'bg-orange-100/70 border-orange-300 ring-2 ring-orange-400' : 'bg-orange-50 border-orange-100 hover:bg-orange-100/50'
                  }`}
                >
                  <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Users className="w-3 h-3 text-orange-600" /> Joiners
                  </p>
                  <p className="font-bold text-orange-900 text-base mt-0.5">{activeZoneStats.joinersCount}</p>
                </div>

                <div
                  onClick={() => setZoneDetailTab('drivers')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    zoneDetailTab === 'drivers' ? 'bg-emerald-100/70 border-emerald-300 ring-2 ring-emerald-400' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50'
                  }`}
                >
                  <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-600" /> Drivers
                  </p>
                  <p className="font-bold text-emerald-900 text-base mt-0.5">{activeZoneStats.driversCount}</p>
                </div>

                <div
                  onClick={() => setZoneDetailTab('orders')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    zoneDetailTab === 'orders' ? 'bg-purple-100/70 border-purple-300 ring-2 ring-purple-400' : 'bg-purple-50 border-purple-100 hover:bg-purple-100/50'
                  }`}
                >
                  <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-purple-600" /> Orders
                  </p>
                  <p className="font-bold text-purple-900 text-base mt-0.5">{activeZoneStats.ordersCount}</p>
                </div>

                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <IndianRupee className="w-3 h-3 text-rose-600" /> Sales
                  </p>
                  <p className="font-bold text-rose-900 text-base mt-0.5">₹{activeZoneStats.salesCount.toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" /> Commission
                  </p>
                  <p className="font-bold text-amber-900 text-base mt-0.5">₹{activeZoneStats.commissionsTotal.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Assigned Zone Admin Card */}
              {(() => {
                const subAdmins = authService.getSubAdminAccounts();
                const zoneAdmin = subAdmins.find(s =>
                  s.assignedZone.toLowerCase().includes(activeZone.name.toLowerCase()) ||
                  activeZone.name.toLowerCase().includes(s.assignedZone.toLowerCase())
                );
                return (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-700" />
                        <span className="font-extrabold text-xs text-slate-900">Zone Administrator</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Settings')}
                        className="text-[10.5px] text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        Manage in Settings <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {zoneAdmin ? (
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{zoneAdmin.name}</p>
                          <p className="text-[11px] text-slate-500">{zoneAdmin.email} • {zoneAdmin.phone}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {zoneAdmin.role}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-500 py-1">
                        <span>No dedicated Zone Admin assigned yet.</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('Settings')}
                          className="px-2.5 py-1 bg-[#15803d] hover:bg-[#166534] text-white text-[10.5px] font-bold rounded-lg shadow-2xs cursor-pointer transition-all"
                        >
                          + Create Zone Admin
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Dynamic Tabs Header */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setZoneDetailTab('joiners')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        zoneDetailTab === 'joiners'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Field Joiners ({activeZoneStats.joinersList.length})
                    </button>
                    <button
                      onClick={() => setZoneDetailTab('hotels')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        zoneDetailTab === 'hotels'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Hotels ({activeZoneStats.hotelsList.length})
                    </button>
                    <button
                      onClick={() => setZoneDetailTab('orders')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        zoneDetailTab === 'orders'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Orders ({activeZoneStats.ordersList.length})
                    </button>
                    <button
                      onClick={() => setZoneDetailTab('drivers')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        zoneDetailTab === 'drivers'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Drivers ({activeZoneStats.driversList.length})
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (zoneDetailTab === 'joiners') setActiveTab('Hotel Joiners');
                      else if (zoneDetailTab === 'hotels') setActiveTab('Hotels');
                      else if (zoneDetailTab === 'drivers') setActiveTab('Delivery Drivers');
                      else setActiveTab('Orders');
                    }}
                    className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    View in {zoneDetailTab === 'joiners' ? 'Joiners' : zoneDetailTab === 'hotels' ? 'Hotels' : zoneDetailTab === 'drivers' ? 'Drivers' : 'Orders'} →
                  </button>
                </div>

                {/* Tab 1: Assigned Field Joiners */}
                {zoneDetailTab === 'joiners' && (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {activeZoneStats.joinersList.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                        <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        No joiners assigned to {activeZone.name} yet.
                      </div>
                    ) : (
                      activeZoneStats.joinersList.map((j, idx) => {
                        const jHotelsCount = hotels.filter(h =>
                          (h.joiner || '').toLowerCase() === (j.name || '').toLowerCase() ||
                          (h.mobile || '').includes(j.mobile || '')
                        ).length;

                        return (
                          <div
                            key={j.id || idx}
                            onClick={() => handleNavigateToJoiner(j)}
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-100 cursor-pointer transition-colors"
                            title={`Click to view ${j.name}'s profile`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-slate-400 text-xs w-4">{idx + 1}</span>
                              <div>
                                <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                  {j.name}
                                  <span className="text-[10px] text-slate-500 font-medium">({j.joinerCode || 'JN'})</span>
                                </p>
                                <p className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" /> {j.mobile || j.phone || '—'} • {jHotelsCount} Hotels
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-800 font-bold text-xs">
                                ₹{(j.totalEarnings || j.commissionEarned || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {j.status || 'Active'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab 2: Registered Hotels */}
                {zoneDetailTab === 'hotels' && (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {activeZoneStats.hotelsList.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                        <Store className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        No hotels registered in {activeZone.name} yet.
                      </div>
                    ) : (
                      activeZoneStats.hotelsList.map((h, idx) => (
                        <div
                          key={h.id || idx}
                          onClick={() => handleNavigateToHotel(h)}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-sky-50/60 rounded-xl border border-slate-100 cursor-pointer transition-colors"
                          title={`Click to view ${h.name}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-slate-400 text-xs w-4">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{h.name}</p>
                              <p className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" /> {h.mobile || h.phone || '—'}
                                {h.joiner && <span className="text-emerald-700 font-semibold">• Joiner: {h.joiner}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                              {h.totalOrders || 0} Orders
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {h.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Recent Zone Orders */}
                {zoneDetailTab === 'orders' && (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {activeZoneStats.ordersList.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                        <ShoppingBag className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        No orders recorded from {activeZone.name} yet.
                      </div>
                    ) : (
                      activeZoneStats.ordersList.slice(0, 10).map((o, idx) => (
                        <div
                          key={o.id || o.orderId || idx}
                          onClick={() => handleNavigateToOrder(o)}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-purple-50/60 rounded-xl border border-slate-100 cursor-pointer transition-colors"
                          title={`Click to view Order #${o.orderId || o.id}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-slate-400 text-xs w-4">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">
                                #{o.orderId || o.id} • <span className="font-semibold text-slate-600">{o.hotelName || 'Hotel'}</span>
                              </p>
                              <p className="text-[10.5px] text-slate-500 mt-0.5">
                                {o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : 'Recent')} • {o.items?.length || 1} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              ₹{Number(o.amount || o.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              o.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'Out for Delivery'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {o.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 4: Assigned Delivery Drivers */}
                {zoneDetailTab === 'drivers' && (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {activeZoneStats.driversList.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                        <Truck className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        No delivery drivers assigned to {activeZone.name} yet.
                      </div>
                    ) : (
                      activeZoneStats.driversList.map((d, idx) => (
                        <div
                          key={d.id || idx}
                          onClick={() => setActiveTab('Delivery Drivers')}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-100 cursor-pointer transition-colors"
                          title={`Click to view Driver ${d.name}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-slate-400 text-xs w-4">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{d.name}</p>
                              <p className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" /> {d.mobile || '—'}
                                {d.vehicleNo && <span className="font-mono text-emerald-700 font-semibold">• {d.vehicleNo}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                              {d.vehicleType || 'Vehicle'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {d.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Zone Map - Pune Interactive Geo Canvas (Col 6) */}
            <div className="lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Pune Supply Corridors</h3>
                    <p className="text-[10px] text-slate-500">Interactive Geo Map • Click any area</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowRiverLayer(!showRiverLayer)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md border cursor-pointer transition-colors ${
                      showRiverLayer
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                    title="Toggle Mula-Mutha River Layer"
                  >
                    🌊 Mula-Mutha River
                  </button>
                </div>
              </div>

              {/* Zone Chips Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {PUNE_ZONES_DATA.map(gz => {
                  const isSelected = isGeoZoneActive(gz);
                  return (
                    <button
                      key={gz.id}
                      onClick={() => handleMapZoneClick(gz)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {gz.name}
                    </button>
                  );
                })}
              </div>

              {/* Vector SVG Map */}
              <div className="h-72 bg-white rounded-xl overflow-hidden relative border border-slate-200 shadow-inner flex items-center justify-center select-none">
                <svg
                  className="w-full h-full cursor-pointer"
                  viewBox="0 0 740 480"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="pune-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="2 2" />
                    </pattern>
                  </defs>

                  <rect width="740" height="480" fill="#f8fafc" />
                  <rect width="740" height="480" fill="url(#pune-grid)" />

                  {/* Outer Pune Boundary */}
                  <path
                    d="M 25 30 C 130 10, 260 15, 360 30 C 500 50, 630 75, 715 135 C 735 220, 720 330, 680 400 C 630 460, 520 475, 420 470 C 320 460, 190 435, 120 375 C 50 310, 20 200, 25 100 Z"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* River Layer (Mula-Mutha) */}
                  {showRiverLayer && (
                    <path
                      d="M 50 175 C 120 195, 190 225, 255 230 C 315 235, 375 220, 445 225 C 515 230, 600 255, 700 275"
                      stroke="#38bdf8"
                      strokeWidth="7"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.75"
                    />
                  )}

                  {/* Zone Polygon Paths */}
                  {PUNE_ZONES_DATA.map(gz => {
                    const isSelected = isGeoZoneActive(gz);
                    const isHovered = hoveredMapZone === gz.id;
                    return (
                      <g
                        key={gz.id}
                        onClick={() => handleMapZoneClick(gz)}
                        onMouseEnter={() => setHoveredMapZone(gz.id)}
                        onMouseLeave={() => setHoveredMapZone(null)}
                        className="transition-all duration-200"
                      >
                        <path
                          d={gz.path}
                          fill={isSelected ? gz.activeFill : isHovered ? gz.activeFill : gz.fill}
                          stroke={isSelected ? gz.activeStroke : isHovered ? gz.activeStroke : gz.stroke}
                          strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                          className="transition-all"
                        />
                        <text
                          x={gz.center.x}
                          y={gz.center.y}
                          textAnchor="middle"
                          fill={gz.textColor}
                          fontSize="12.5"
                          fontWeight={isSelected ? 'bold' : '600'}
                          className="pointer-events-none select-none drop-shadow-xs"
                        >
                          {gz.shortLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Promo Banner */}
      <div className="bg-emerald-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <h3 className="font-extrabold text-lg">Together We Grow</h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Connecting Pune Hotels with Fresh Farm Produce • Reliable Fast Supply • Stronger Partnerships • A Healthier Tomorrow
          </p>
        </div>
        <span className="text-3xl">🧺🥬🥕</span>
      </div>

      {/* Edit Zone Modal */}
      {editingZone && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Edit Zone</h3>
                  <p className="text-xs text-slate-500">Update zone details and coverage</p>
                </div>
              </div>
              <button
                onClick={() => setEditingZone(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={editingZone.name || ''}
                  onChange={e => setEditingZone({ ...editingZone, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Area / Locations Covered</label>
                <input
                  type="text"
                  required
                  value={editingZone.areaLocations || ''}
                  onChange={e => setEditingZone({ ...editingZone, areaLocations: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingZone.status || 'Active'}
                  onChange={e => setEditingZone({ ...editingZone, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold text-slate-700"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={e => {
                    if (editingZone) {
                      handleDelete(e, editingZone.id, editingZone.name);
                      setEditingZone(null);
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Zone</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingZone(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
