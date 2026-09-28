import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
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
  ChevronLeft,
  ChevronRight,
  Phone,
  CheckCircle2,
  X,
  Shield,
  Layers,
  Sparkles,
  Compass,
  UserCheck
} from 'lucide-react';
import type { Zone } from '../types';
import { authService } from '../firebase/authService';

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
    id: 'pimpri-chinchwad',
    name: 'Pimpri Chinchwad',
    shortLabel: 'Pimpri Chinchwad',
    category: 'North-West Industrial Hub',
    path: 'M 40 40 C 100 25, 180 28, 250 40 C 270 70, 275 110, 260 150 C 210 160, 160 165, 100 150 C 60 120, 45 80, 40 40 Z',
    center: { x: 150, y: 95 },
    fill: '#ede9fe',
    activeFill: '#ddd6fe',
    stroke: '#a855f7',
    activeStroke: '#7e22ce',
    textColor: '#6b21a8',
    badgeBg: '#f3e8ff',
    badgeText: '#7e22ce',
    aliases: ['pimpri', 'chinchwad', 'pcmc', 'nigdi', 'bhosari', 'pimpri chinchwad']
  },
  {
    id: 'aundh',
    name: 'Aundh',
    shortLabel: 'Aundh',
    category: 'West-Central Tech Zone',
    path: 'M 100 150 C 160 165, 210 160, 260 150 C 270 175, 272 205, 255 240 C 195 245, 140 235, 90 215 C 85 185, 90 165, 100 150 Z',
    center: { x: 175, y: 195 },
    fill: '#dcfce7',
    activeFill: '#bbf7d0',
    stroke: '#22c55e',
    activeStroke: '#15803d',
    textColor: '#15803d',
    badgeBg: '#ecfdf5',
    badgeText: '#047857',
    aliases: ['aundh', 'baner', 'pashan', 'university']
  },
  {
    id: 'pune',
    name: 'Pune',
    shortLabel: 'Pune (Central)',
    category: 'Metropolitan Core Hub',
    path: 'M 90 215 C 140 235, 195 245, 255 240 C 295 235, 340 240, 380 255 C 400 295, 395 340, 370 380 C 310 395, 250 380, 200 350 C 140 330, 100 280, 90 215 Z',
    center: { x: 240, y: 305 },
    fill: '#fef3c7',
    activeFill: '#fde68a',
    stroke: '#f59e0b',
    activeStroke: '#b45309',
    textColor: '#92400e',
    badgeBg: '#fffbeb',
    badgeText: '#b45309',
    aliases: ['pune', 'shivajinagar', 'swargate', 'deccan', 'kothrud', 'camp', 'central']
  },
  {
    id: 'viman-nagar',
    name: 'Viman Nagar',
    shortLabel: 'Viman Nagar',
    category: 'North-East Airport Corridor',
    path: 'M 260 150 C 320 135, 390 130, 460 145 C 475 180, 470 215, 450 245 C 400 240, 345 230, 295 235 C 272 205, 270 175, 260 150 Z',
    center: { x: 365, y: 185 },
    fill: '#e0f2fe',
    activeFill: '#bae6fd',
    stroke: '#0ea5e9',
    activeStroke: '#0284c7',
    textColor: '#0369a1',
    badgeBg: '#f0f9ff',
    badgeText: '#0369a1',
    aliases: ['viman nagar', 'kalyani nagar', 'airport', 'vimannagar']
  },
  {
    id: 'kharadi',
    name: 'Kharadi',
    shortLabel: 'Kharadi',
    category: 'East EON IT Corridor',
    path: 'M 460 145 C 530 135, 600 145, 670 170 C 685 215, 675 265, 645 300 C 585 290, 525 275, 480 255 C 470 215, 475 180, 460 145 Z',
    center: { x: 570, y: 215 },
    fill: '#ffedd5',
    activeFill: '#fed7aa',
    stroke: '#f97316',
    activeStroke: '#c2410c',
    textColor: '#c2410c',
    badgeBg: '#fff7ed',
    badgeText: '#c2410c',
    aliases: ['kharadi', 'eon', 'wtc', 'nagar road']
  },
  {
    id: 'magarpatta',
    name: 'Magarpatta',
    shortLabel: 'Magarpatta',
    category: 'Cybercity & Township Hub',
    path: 'M 380 255 C 430 245, 480 255, 530 270 C 535 305, 520 345, 495 375 C 450 375, 410 365, 375 350 C 395 315, 390 280, 380 255 Z',
    center: { x: 455, y: 310 },
    fill: '#ccfbf1',
    activeFill: '#99f6e4',
    stroke: '#14b8a6',
    activeStroke: '#0f766e',
    textColor: '#0f766e',
    badgeBg: '#f0fdfa',
    badgeText: '#0f766e',
    aliases: ['magarpatta', 'cybercity', 'amanora', 'mundhwa']
  },
  {
    id: 'hadapsar',
    name: 'Hadapsar',
    shortLabel: 'Hadapsar',
    category: 'South-East Commercial Zone',
    path: 'M 370 380 C 410 365, 450 375, 495 375 C 520 345, 535 305, 530 270 C 580 285, 625 310, 660 350 C 655 395, 610 430, 540 435 C 460 430, 395 410, 370 380 Z',
    center: { x: 520, y: 380 },
    fill: '#ffe4e6',
    activeFill: '#fecdd3',
    stroke: '#f43f5e',
    activeStroke: '#be123c',
    textColor: '#be123c',
    badgeBg: '#fff1f2',
    badgeText: '#be123c',
    aliases: ['hadapsar', 'sp infocity', 'saswad', 'solapur road']
  }
];

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
    joiners,
    hotels,
    orders,
    isDatabaseConnected
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredMapZone, setHoveredMapZone] = useState<string | null>(null);
  const [showRiverLayer, setShowRiverLayer] = useState(true);

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

  const activeZone = useMemo(() => {
    if (selectedZone && zones.some(z => String(z.id) === String(selectedZone.id))) {
      return zones.find(z => String(z.id) === String(selectedZone.id)) || selectedZone;
    }
    return filteredZones[0] || zones[0] || null;
  }, [selectedZone, zones, filteredZones]);

  const totalSalesAmount = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  const getZoneStats = (zone: Zone | null) => {
    if (!zone) return { hotelsCount: 0, joinersCount: 0, ordersCount: 0, salesCount: 0 };
    const zName = (zone.name || '').toLowerCase();
    const zAreas = (zone.areaLocations || '').toLowerCase();

    const zHotels = hotels.filter(h => {
      const hZone = (h.zone || '').toLowerCase();
      return (zName && hZone === zName) || (zAreas && zAreas.includes(hZone));
    });

    const zJoiners = joiners.filter(j => {
      const jZone = (j.zone || '').toLowerCase();
      return (zName && jZone === zName) || (zAreas && zAreas.includes(jZone));
    });

    const zOrders = orders.filter(o => {
      const oZone = (o.zone || '').toLowerCase();
      return (zName && oZone === zName) || (zAreas && zAreas.includes(oZone));
    });

    const zSales = zOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    return {
      hotelsCount: isDatabaseConnected ? zHotels.length : (zHotels.length || zone.hotelsCount || 0),
      joinersCount: isDatabaseConnected ? zJoiners.length : (zJoiners.length || zone.joinersCount || 0),
      ordersCount: isDatabaseConnected ? zOrders.length : (zOrders.length || zone.ordersThisMonth || 0),
      salesCount: isDatabaseConnected ? zSales : (zSales || zone.salesThisMonth || 0)
    };
  };

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
      const fallbackZone: Zone = {
        id: Date.now(),
        name: geoZone.name,
        areaLocations: geoZone.category,
        hotelsCount: 15,
        joinersCount: 3,
        ordersThisMonth: 120,
        salesThisMonth: 125000,
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
      message: 'Are you sure you want to delete this zone? Assigned hotels and joiners will be unlinked from this zone.',
      entityName: zoneName,
      confirmLabel: 'Delete Zone',
      type: 'danger',
      onConfirm: () => deleteZone(Number(zoneId))
    });
  };

  const handleEditClick = (e: React.MouseEvent, zone: Zone) => {
    e.stopPropagation();
    setEditingZone({ ...zone });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;
    updateZone(editingZone.id, editingZone);
    setEditingZone(null);
  };

  const handleJoinerClick = (joinerName: string) => {
    const found = joiners.find(j => (j.name || '').toLowerCase().includes(joinerName.toLowerCase()));
    if (found) {
      setSelectedJoiner(found);
    }
    setActiveTab('Hotel Joiners');
  };

  const activeZoneJoiners = activeZone
    ? joiners.filter(j => {
        const jZone = (j.zone || '').toLowerCase();
        const aName = (activeZone.name || '').toLowerCase();
        const aAreas = (activeZone.areaLocations || '').toLowerCase();
        return (aName && jZone === aName) || (aAreas && aAreas.includes(jZone));
      })
    : [];

  const displayJoiners = activeZoneJoiners.length > 0
    ? activeZoneJoiners.map(j => ({
        name: j.name || 'Joiner',
        hotelsCount: hotels.filter(h => (h.joiner || '').toLowerCase() === (j.name || '').toLowerCase()).length || j.totalHotels || 0,
        phone: j.mobile || '—',
        status: j.status || 'Active'
      }))
    : (isDatabaseConnected ? [] : (activeZone?.assignedJoinersList || []));

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Zones</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{zones.length}</h3>
          </div>
        </div>

        <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Hotels</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{hotels.length}</h3>
          </div>
        </div>

        <div className="bg-orange-50/80 p-3.5 rounded-xl border border-orange-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Joiners</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{joiners.length}</h3>
          </div>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Orders</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{orders.length}</h3>
          </div>
        </div>

        <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Sales</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">₹{totalSalesAmount.toLocaleString('en-IN')}</h3>
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

      {/* Full-width Zones List Table Section (No Slider) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800 whitespace-nowrap">Zones List</h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 whitespace-nowrap">
              {filteredZones.length} {filteredZones.length === 1 ? 'Zone' : 'Zones'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search zone name or area..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
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
          <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-700">No zones match your filter criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="w-full">
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
                  const stats = getZoneStats(z);
                  const isSelected = activeZone && String(activeZone.id) === String(z.id);
                  return (
                    <tr
                      key={z.id}
                      onClick={() => setSelectedZone(z)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/80 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-500 whitespace-nowrap">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <span>{z.name}</span>
                          {z.addedBy === 'Admin' && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                              <Shield className="w-2 h-2 text-amber-600" /> Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap" title={z.areaLocations}>
                        {z.areaLocations || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">{stats.hotelsCount}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">{stats.joinersCount}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">{stats.ordersCount}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">₹{stats.salesCount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (z.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {z.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={e => handleEditClick(e, z)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit Zone"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleDelete(e, z.id, z.name)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
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

      {/* Selected Zone Details & Interactive Pune Map Section (Below Table) */}
      {activeZone && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border-2 border-emerald-600 shadow-xs shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800">{activeZone.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    (activeZone.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeZone.status || 'Active'}
                  </span>
                  {activeZone.addedBy === 'Admin' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{activeZone.areaLocations || 'Pune Supply Zone'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={e => handleEditClick(e, activeZone)}
                className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Edit className="w-3 h-3" /> Edit Zone
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
            {/* Left: Zone Stats, Zone Admin, and Assigned Joiners */}
            <div className="lg:col-span-6 space-y-4">
              {/* Zone Stats Grid */}
              {(() => {
                const activeStats = getZoneStats(activeZone);
                return (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                      <p className="text-[10px] text-slate-400 font-medium">Hotels</p>
                      <p className="font-bold text-sky-900 text-base">{activeStats.hotelsCount}</p>
                    </div>
                    <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                      <p className="text-[10px] text-slate-400 font-medium">Joiners</p>
                      <p className="font-bold text-orange-900 text-base">{activeStats.joinersCount}</p>
                    </div>
                    <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                      <p className="text-[10px] text-slate-400 font-medium">Orders</p>
                      <p className="font-bold text-purple-900 text-base">{activeStats.ordersCount}</p>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                      <p className="text-[10px] text-slate-400 font-medium">Total Sales</p>
                      <p className="font-bold text-rose-900 text-base">₹{activeStats.salesCount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })()}

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
                        className="text-[10.5px] text-emerald-800 font-bold hover:underline cursor-pointer"
                      >
                        Manage in Settings →
                      </button>
                    </div>

                    {zoneAdmin ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{zoneAdmin.name}</p>
                          <p className="text-[11px] text-slate-500">{zoneAdmin.email} • {zoneAdmin.phone}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
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

              {/* Assigned Joiners List */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">Assigned Field Joiners ({displayJoiners.length})</h4>
                  <button
                    onClick={() => setActiveTab('Hotel Joiners')}
                    className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  {displayJoiners.length === 0 ? (
                    <div className="text-center py-5 bg-slate-50 rounded-lg border border-slate-100 text-slate-400 text-xs">
                      No joiners assigned to this zone yet.
                    </div>
                  ) : (
                    displayJoiners.map((j, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleJoinerClick(j.name)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 cursor-pointer transition-colors"
                        title={`Click to view ${j.name}'s profile`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">{idx + 1}</span>
                          <span className="font-bold text-slate-800">{j.name}</span>
                          <span className="text-slate-400 text-[11px]">({j.hotelsCount} Hotels)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" /> {j.phone}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {j.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Zone Map - Pune Interactive Geo Canvas */}
            <div className="lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
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
                    title="Toggle Mula-Mutha River"
                  >
                    🌊 River
                  </button>
                </div>
              </div>

              {/* Zone Chips Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
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
              <div className="h-64 bg-white rounded-xl overflow-hidden relative border border-slate-200 shadow-inner flex items-center justify-center select-none">
                <svg
                  className="w-full h-full cursor-pointer"
                  viewBox="0 0 720 460"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="pune-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="2 2" />
                    </pattern>
                  </defs>

                  <rect width="720" height="460" fill="#f8fafc" />
                  <rect width="720" height="460" fill="url(#pune-grid)" />

                  {/* City Boundary */}
                  <path
                    d="M 30 30 C 120 10, 240 15, 340 30 C 470 50, 600 80, 690 140 C 715 220, 700 320, 670 380 C 620 440, 520 455, 420 450 C 330 440, 200 420, 130 360 C 60 300, 30 200, 30 110 Z"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* River Layer */}
                  {showRiverLayer && (
                    <path
                      d="M 60 170 C 120 190, 180 220, 240 225 C 300 230, 360 215, 430 220 C 500 225, 580 250, 680 270"
                      stroke="#38bdf8"
                      strokeWidth="6"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.7"
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
                          fill={isSelected ? gz.activeFill : gz.fill}
                          stroke={isSelected ? gz.activeStroke : gz.stroke}
                          strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                          className="transition-all"
                        />
                        <text
                          x={gz.center.x}
                          y={gz.center.y}
                          textAnchor="middle"
                          fill={gz.textColor}
                          fontSize="13"
                          fontWeight={isSelected ? 'bold' : '600'}
                          className="pointer-events-none select-none"
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
            Connecting Hotels with Fresh Produce • More Orders • Stronger Partnerships • A Healthier Tomorrow
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Area / Locations</label>
                <input
                  type="text"
                  required
                  value={editingZone.areaLocations || ''}
                  onChange={e => setEditingZone({ ...editingZone, areaLocations: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingZone.status || 'Active'}
                  onChange={e => setEditingZone({ ...editingZone, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-700"
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
