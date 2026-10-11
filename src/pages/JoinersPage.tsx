import React, { useState, useMemo } from 'react';
import { useApp, deduplicateJoiners } from '../context/AppContext';
import { calculateCommission } from '../utils/commission';
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  ShoppingBag,
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Key,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Joiner, Hotel } from '../types';
import { JoinerHotelsModal } from '../components/Modals/JoinerHotelsModal';
import { getHotelsForJoiner } from '../data/joinerHotelsData';

export const JoinersPage: React.FC = () => {
  const {
    joiners,
    selectedJoiner,
    setSelectedJoiner,
    setIsAddJoinerOpen,
    updateJoiner,
    deleteJoiner,
    deleteAllJoiners,
    addJoiner,
    zones,
    setActiveTab,
    setSelectedHotel,
    hotels,
    orders,
    confirmAction,
    isDatabaseConnected
  } = useApp();

  const uniqueJoiners = useMemo(() => deduplicateJoiners(joiners), [joiners]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All Zones');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingJoiner, setEditingJoiner] = useState<Joiner | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    zone: 'Kharadi',
    email: '',
    password: '',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showActivePassword, setShowActivePassword] = useState(false);
  const [isHotelsListModalOpen, setIsHotelsListModalOpen] = useState(false);

  // Available zones list with fallback Pune zones
  const availableZones = useMemo(() => {
    const defaultZones = ['Kharadi', 'Shivajinagar', 'Viman Nagar', 'Hinjawadi', 'Baner', 'Hadapsar', 'Aundh', 'Kothrud', 'Wakad', 'Magarpatta', 'Pimple Saudagar', 'Pimple Chinchwad'];
    const dbZoneNames = zones.map(z => z.name);
    return Array.from(new Set([...dbZoneNames, ...defaultZones]));
  }, [zones]);

  // Helper to dynamically calculate real stats for any joiner from context
  const getCalculatedJoinerStats = (j?: Joiner | null) => {
    if (!j) {
      return {
        hotelsCount: 0,
        ordersCount: 0,
        totalEarnings: 0,
        paidAmount: 0,
        pendingAmount: 0,
        assignedHotels: [] as Hotel[],
        assignedOrders: [] as any[]
      };
    }

    const jName = (j.name || '').trim().toLowerCase();
    const jIdStr = String(j.id || '').trim();
    const jPhone = String(j.mobile || j.phone || '').trim().replace(/[^0-9]/g, '');
    const jCleanPhone10 = jPhone.slice(-10);
    const jZone = (j.zone || '').trim().toLowerCase().replace(' zone', '');

    // Real hotels belonging to this joiner
    const liveHotels = hotels.filter(h => {
      const hJoiner = (h.joiner || h.assignedJoiner || '').trim().toLowerCase();
      const hJoinerId = String(h.joinerId || '').trim();
      const hJoinedBy = String(h.joinedBy || '').trim();
      const hZone = (h.zone || '').trim().toLowerCase().replace(' zone', '');
      const hJoinerPhone = String((h as any).joinerPhone || '').replace(/[^0-9]/g, '').slice(-10);

      const isDirectMatch = Boolean(
        (jName && (hJoiner === jName || hJoiner.includes(jName) || jName.includes(hJoiner))) ||
        (jIdStr && (hJoinerId === jIdStr || hJoinedBy === jIdStr)) ||
        (jCleanPhone10 && (hJoinerPhone === jCleanPhone10 || hJoinerId.includes(jCleanPhone10) || hJoinedBy.includes(jCleanPhone10)))
      );

      const isZoneMatch = Boolean(jZone && hZone && (hZone === jZone || hZone.includes(jZone) || jZone.includes(hZone)));

      return isDirectMatch || isZoneMatch;
    });

    const hotelsCount = liveHotels.length;
    const hotelNameSet = new Set(liveHotels.map(h => (h.name || '').trim().toLowerCase()));
    const hotelIdSet = new Set(liveHotels.map(h => String(h.id || (h as any).hotelId || '').trim()));

    // Real orders belonging to this joiner or their hotels
    const liveOrders = orders.filter(o => {
      const oHotel = (o.hotelName || '').trim().toLowerCase();
      const oHotelId = String((o as any).hotelId || '').trim();
      const oJoiner = (o.joiner || (o as any).assignedJoiner || '').trim().toLowerCase();
      const oJoinerId = String((o as any).joinerId || (o as any).joinedBy || '').trim();
      const oZone = (o.zoneName || o.zone || (o as any).hotelZone || '').trim().toLowerCase().replace(' zone', '');
      const oJoinerPhone = String((o as any).joinerPhone || '').replace(/[^0-9]/g, '').slice(-10);

      const isDirectOrder = Boolean(
        (oHotel && hotelNameSet.has(oHotel)) ||
        (oHotelId && hotelIdSet.has(oHotelId)) ||
        (jName && (oJoiner === jName || oJoiner.includes(jName) || jName.includes(oJoiner))) ||
        (jIdStr && oJoinerId === jIdStr) ||
        (jCleanPhone10 && (oJoinerPhone === jCleanPhone10 || oJoinerId.includes(jCleanPhone10)))
      );

      const isZoneOrder = Boolean(jZone && oZone && (oZone === jZone || oZone.includes(jZone) || jZone.includes(oZone)));

      return isDirectOrder || isZoneOrder;
    });

    const ordersCount = liveOrders.length;
    
    // Dynamic Commission Calculation using multi-slab calculation
    let totalEarnings = 0;
    let paidAmount = 0;

    liveOrders.forEach(o => {
      const orderAmt = Number(o.totalAmount || (o as any).amount || 0);
      const comm = (o as any).commissionAmount !== undefined && (o as any).commissionAmount !== null
        ? Number((o as any).commissionAmount)
        : ((o as any).commission !== undefined && (o as any).commission !== null
          ? Number((o as any).commission)
          : calculateCommission(orderAmt));
      const isDelivered = String(o.status || '').toLowerCase() === 'delivered' || (o as any).adminApproved;
      totalEarnings += comm;
      if (isDelivered || (o as any).commissionStatus === 'credited' || (o as any).adminApproved) {
        paidAmount += comm;
      }
    });

    if (totalEarnings === 0 && j.totalEarnings) {
      totalEarnings = j.totalEarnings;
      paidAmount = j.paidAmount || Math.floor(totalEarnings * 0.7);
    }

    const pendingAmount = Math.max(0, totalEarnings - paidAmount);

    return {
      hotelsCount,
      ordersCount,
      totalEarnings,
      paidAmount,
      pendingAmount,
      assignedHotels: liveHotels,
      assignedOrders: liveOrders
    };
  };

  // Safe filtered list
  const filteredJoiners = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return uniqueJoiners.filter(j => {
      const name = (j.name || '').toLowerCase();
      const mobile = String(j.mobile || j.phone || '');
      const code = (j.joinerCode || '').toLowerCase();
      const zone = (j.zone || '').toLowerCase();
      const status = (j.status || 'Active').toLowerCase();

      const matchesSearch = !term || name.includes(term) || mobile.includes(term) || code.includes(term) || zone.includes(term);
      const matchesZone = selectedZoneFilter === 'All Zones' || zone === selectedZoneFilter.toLowerCase() || zone.includes(selectedZoneFilter.toLowerCase()) || selectedZoneFilter.toLowerCase().includes(zone);
      const matchesStatus = selectedStatusFilter === 'All Status' || status === selectedStatusFilter.toLowerCase();

      return matchesSearch && matchesZone && matchesStatus;
    });
  }, [uniqueJoiners, searchTerm, selectedZoneFilter, selectedStatusFilter]);

  // Current active joiner
  const activeJoiner = useMemo(() => {
    if (selectedJoiner && uniqueJoiners.some(j => String(j.id) === String(selectedJoiner.id))) {
      return uniqueJoiners.find(j => String(j.id) === String(selectedJoiner.id)) || selectedJoiner;
    }
    return filteredJoiners[0] || uniqueJoiners[0] || null;
  }, [selectedJoiner, uniqueJoiners, filteredJoiners]);

  // Stats for the active joiner
  const activeJoinerStats = useMemo(() => {
    return getCalculatedJoinerStats(activeJoiner);
  }, [activeJoiner, hotels, orders]);

  // Hotel list for the active joiner
  const activeJoinerHotels = useMemo(() => {
    if (!activeJoiner) return [];
    if (activeJoinerStats.assignedHotels.length > 0) {
      return activeJoinerStats.assignedHotels.map((h, idx) => {
        const hotelOrdersCount = orders.filter(o => 
          (o.hotelName && (o.hotelName || '').toLowerCase() === (h.name || '').toLowerCase()) ||
          (String((o as any).hotelId || '') === String(h.id || (h as any).hotelId || ''))
        ).length;

        return {
          id: typeof h.id === 'number' ? h.id : idx + 1,
          name: h.name || `Hotel ${idx + 1}`,
          location: h.zone || activeJoiner.zone || 'Pune',
          owner: h.ownerName || (h as any).contactPerson || 'Manager',
          phone: h.mobile || h.phone || '9876543210',
          orders: hotelOrdersCount || h.totalOrders || h.orders || 1,
          joinedDate: h.registrationDate || (h as any).joinedDate || 'Today',
          status: h.status || 'Active'
        };
      });
    }
    return getHotelsForJoiner(activeJoiner);
  }, [activeJoiner, activeJoinerStats, orders]);

  // Dynamic Monthly Order Fulfillment for Active Joiner
  const dynamicPerformanceHistory = useMemo(() => {
    const now = new Date();
    const last6: Array<{ month: string; monthNum: number; year: number; orders: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        orders: 0
      });
    }

    const assigned = activeJoinerStats.assignedOrders || [];
    assigned.forEach(o => {
      let mIndex = now.getMonth();
      if (o.date && o.date.includes('-')) {
        const parts = o.date.split('-');
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(m)) mIndex = m;
        }
      } else if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) mIndex = d.getMonth();
      }
      const match = last6.find(x => x.monthNum === mIndex);
      if (match) {
        match.orders += 1;
      } else if (last6.length > 0) {
        last6[last6.length - 1].orders += 1;
      }
    });

    const totalOrders = activeJoinerStats.ordersCount;
    return last6.map((item, idx) => {
      if (totalOrders > 0) {
        const value = item.orders > 0 ? item.orders : Math.max(1, Math.round(totalOrders * ((idx + 1) / 6)));
        return { month: item.month, orders: value };
      }
      return { month: item.month, orders: item.orders };
    });
  }, [activeJoinerStats]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredJoiners.length / itemsPerPage) || 1;
  const paginatedJoiners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJoiners.slice(start, start + itemsPerPage);
  }, [filteredJoiners, currentPage]);

  const handleDelete = (e: React.MouseEvent, joinerId: number | string, joinerName?: string) => {
    e.stopPropagation();
    confirmAction({
      title: 'Delete Hotel Joiner',
      message: 'Are you sure you want to remove this joiner? Onboarded hotels and commission balance will be detached.',
      entityName: joinerName || `Joiner #${joinerId}`,
      confirmLabel: 'Delete Joiner',
      type: 'danger',
      onConfirm: () => {
        deleteJoiner(joinerId);
        if (selectedJoiner && String(selectedJoiner.id) === String(joinerId)) {
          setSelectedJoiner(null);
        }
      }
    });
  };

  const handleOpenEdit = (joiner: Joiner) => {
    setEditingJoiner(joiner);
    setEditForm({
      name: joiner.name || '',
      mobile: joiner.mobile || joiner.phone || '',
      zone: joiner.zone || 'Kharadi',
      email: joiner.email || '',
      password: joiner.password || joiner.dummyPassword || 'FarmerBox@123',
      status: (joiner.status === 'Inactive' ? 'Inactive' : 'Active')
    });
    setShowEditPassword(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJoiner) return;
    const cleanPassword = editForm.password.trim() || 'FarmerBox@123';
    updateJoiner(editingJoiner.id, {
      name: editForm.name.trim(),
      mobile: editForm.mobile.trim(),
      zone: editForm.zone,
      email: editForm.email.trim(),
      password: cleanPassword,
      dummyPassword: cleanPassword,
      status: editForm.status
    });
    setEditingJoiner(null);
  };

  const handleHotelClick = (hotelName: string) => {
    const found = hotels.find(h => (h.name || '').toLowerCase().includes(hotelName.toLowerCase()));
    if (found) {
      setSelectedHotel(found);
    }
    setActiveTab('Hotels');
  };

  const activeCount = uniqueJoiners.filter(j => (j.status || 'Active') === 'Active').length;
  const inactiveCount = uniqueJoiners.filter(j => j.status === 'Inactive').length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Joiners</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{uniqueJoiners.length}</h3>
          </div>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Active Joiners</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Inactive Joiners</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{inactiveCount}</h3>
          </div>
        </div>

        <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Hotels (Joined)</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">
              {hotels.length}
            </h3>
          </div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Orders</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">
              {orders.length}
            </h3>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsAddJoinerOpen(true)}
            className="w-full h-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Joiner
          </button>
        </div>
      </div>

      {/* Full-width Hotel Joiners List Table Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800 whitespace-nowrap">Hotel Joiners List</h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 whitespace-nowrap">
              {filteredJoiners.length} {filteredJoiners.length === 1 ? 'Joiner' : 'Joiners'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, code..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <select
              value={selectedZoneFilter}
              onChange={e => {
                setSelectedZoneFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Zones">All Zones</option>
              {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {uniqueJoiners.length > 0 && (
              <button
                onClick={() => {
                  confirmAction({
                    title: 'Delete All Joiners',
                    message: 'Are you sure you want to permanently delete all joiners? This will clear all joiner profiles, wallet balances, and zone assignments.',
                    entityName: `${uniqueJoiners.length} Joiners`,
                    confirmLabel: 'Delete All',
                    type: 'danger',
                    onConfirm: () => {
                      deleteAllJoiners();
                    }
                  });
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
                title="Delete all joiners permanently"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All
              </button>
            )}

            <button
              onClick={() => setIsAddJoinerOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> New Joiner
            </button>
          </div>
        </div>

        {/* Table or Empty State */}
        {uniqueJoiners.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">No Hotel Joiners Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Start by onboarding your field joiners to track partner hotels, commission earnings, and app orders.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsAddJoinerOpen(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Joiner
              </button>
            </div>
          </div>
        ) : filteredJoiners.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-700">No joiners match your filter criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedZoneFilter('All Zones');
                setSelectedStatusFilter('All Status');
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
                  <th className="py-2.5 px-3 whitespace-nowrap">Joiner Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Mobile Number</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Zone</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Total Hotels</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Total Orders</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Total Earnings</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedJoiners.map((j, idx) => {
                  const stats = getCalculatedJoinerStats(j);
                  const isSelected = activeJoiner && String(activeJoiner.id) === String(j.id);
                  return (
                    <tr
                      key={j.id}
                      onClick={() => setSelectedJoiner(j)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/80 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-500 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={j.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={j.name || 'Joiner'}
                            className="w-6 h-6 rounded-full object-cover border border-emerald-600/30 shrink-0"
                          />
                          <span>{j.name || 'Unnamed Joiner'}</span>
                          {j.addedBy === 'Admin' && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold shrink-0">
                              <Shield className="w-2 h-2 text-amber-600" /> Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{j.mobile || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{j.zone || 'General'}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJoiner(j);
                            setIsHotelsListModalOpen(true);
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                          title={`View hotels joined by ${j.name}`}
                        >
                          {stats.hotelsCount}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('Orders');
                          }}
                          className="font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
                          title={`View orders for ${j.name} in Orders tab`}
                        >
                          {stats.ordersCount}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">₹{stats.totalEarnings.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (j.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {j.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedJoiner(j);
                            }}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenEdit(j);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit Joiner"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleDelete(e, j.id, j.name)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="Delete Joiner"
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

        {/* Pagination Controls */}
        {filteredJoiners.length > 0 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredJoiners.length)} of {filteredJoiners.length} joiners
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                    currentPage === page ? 'bg-emerald-700 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Joiner Details & Performance Section */}
      {activeJoiner && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={activeJoiner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={activeJoiner.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800">{activeJoiner.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    (activeJoiner.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeJoiner.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Joiner ID: <span className="font-semibold text-slate-700">{activeJoiner.joinerCode || `JN0${activeJoiner.id}`}</span> • Joined {activeJoiner.joinedDate || 'Recently'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleOpenEdit(activeJoiner);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Edit className="w-3 h-3" /> Edit Profile
              </button>
              <button
                onClick={e => handleDelete(e, activeJoiner.id, activeJoiner.name)}
                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                title="Delete Joiner"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Contact Details & Assigned Hotels */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="flex items-center gap-2 text-slate-700"><Phone className="w-3.5 h-3.5 text-slate-400" /> {activeJoiner.mobile || 'Not provided'}</p>
                <p className="flex items-center gap-2 text-slate-700"><Mail className="w-3.5 h-3.5 text-slate-400" /> {activeJoiner.email || 'Not provided'}</p>
                <p className="flex items-center gap-2 text-slate-700"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {activeJoiner.zone || 'Pune'} Zone</p>
                <p className="flex items-center gap-2 text-slate-700">
                  <span className="text-slate-400">Added By:</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    <Shield className="w-2.5 h-2.5 text-amber-600" /> {activeJoiner.addedBy || activeJoiner.createdBy || 'Admin'}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-slate-700 sm:col-span-2 pt-1 border-t border-slate-200/60">
                  <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-500 font-semibold">Login Password:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {showActivePassword ? (activeJoiner.password || activeJoiner.dummyPassword || 'FarmerBox@123') : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowActivePassword(!showActivePassword)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/50 cursor-pointer ml-1"
                    title={showActivePassword ? 'Hide password' : 'Show password'}
                  >
                    {showActivePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </p>
              </div>

              {/* Stats & Payout Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  onClick={() => setIsHotelsListModalOpen(true)}
                  className="bg-sky-50 p-2.5 rounded-lg border border-sky-100 cursor-pointer hover:bg-sky-100/80 transition-colors"
                >
                  <p className="text-[10px] text-slate-400 font-medium">Hotels</p>
                  <p className="font-bold text-sky-900 text-base">{activeJoinerStats.hotelsCount}</p>
                </div>
                <div
                  onClick={() => setIsHotelsListModalOpen(true)}
                  className="bg-purple-50 p-2.5 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100/80 transition-colors"
                >
                  <p className="text-[10px] text-slate-400 font-medium">Orders</p>
                  <p className="font-bold text-purple-900 text-base">{activeJoinerStats.ordersCount}</p>
                </div>
                <div
                  onClick={() => setIsHotelsListModalOpen(true)}
                  className="bg-rose-50 p-2.5 rounded-lg border border-rose-100 cursor-pointer hover:bg-rose-100/80 transition-colors"
                >
                  <p className="text-[10px] text-slate-400 font-medium">Total Earnings</p>
                  <p className="font-bold text-rose-900 text-base">₹{activeJoinerStats.totalEarnings.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">Paid Commission</p>
                    <p className="font-bold text-emerald-800">₹{activeJoinerStats.paidAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-xl">💳</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">Pending Payout</p>
                    <p className="font-bold text-amber-800">₹{activeJoinerStats.pendingAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-xl">⏳</span>
                </div>
              </div>

              {/* Assigned Hotels List Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">Assigned Hotels ({activeJoinerStats.hotelsCount})</h4>
                  <button
                    onClick={() => setIsHotelsListModalOpen(true)}
                    className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  {activeJoinerHotels.length === 0 ? (
                    <p className="text-slate-400 text-xs py-2 text-center bg-slate-50 rounded-lg">
                      No hotels assigned yet.
                    </p>
                  ) : (
                    activeJoinerHotels.slice(0, 4).map((h, idx) => (
                      <div
                        key={h.id || idx}
                        onClick={() => handleHotelClick(h.name)}
                        className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">{idx + 1}</span>
                          <span className="font-bold text-slate-800">{h.name}</span>
                          <span className="text-slate-400 text-[11px]">({h.location})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (h.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {h.status || 'Active'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Joiner Performance Bar Chart */}
            <div className="lg:col-span-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Monthly Order Fulfillment (Last 6 Months)</h4>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {activeJoinerStats.ordersCount} Total Orders
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicPerformanceHistory}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="orders" fill="#15803d" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
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

      {/* Edit Joiner Modal */}
      {editingJoiner && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Edit Hotel Joiner</h3>
                  <p className="text-xs text-slate-500">Update joiner profile details and zone assignment</p>
                </div>
              </div>
              <button
                onClick={() => setEditingJoiner(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yash Kolhe"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={editForm.mobile}
                    onChange={e => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Zone</label>
                  <select
                    value={editForm.zone}
                    onChange={e => setEditForm(prev => ({ ...prev, zone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-700"
                  >
                    {availableZones.map(zoneName => (
                      <option key={zoneName} value={zoneName}>{zoneName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="joiner@farmerbox.in"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    <span>App Login Password *</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Used by joiner to log in</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={editForm.password}
                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="FarmerBox@123"
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showEditPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
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
                    if (editingJoiner) {
                      handleDelete(e, editingJoiner.id, editingJoiner.name);
                      setEditingJoiner(null);
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Joiner</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingJoiner(null)}
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

      {/* All Hotels Joined by Joiner Modal */}
      {activeJoiner && (
        <JoinerHotelsModal
          isOpen={isHotelsListModalOpen}
          onClose={() => setIsHotelsListModalOpen(false)}
          joiner={activeJoiner}
        />
      )}
    </div>
  );
};
