import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  ChevronRight,
  Building2,
  CheckCircle2,
  XCircle,
  Power,
  Edit2,
  Trash2,
  X,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  ShoppingCart,
  Star,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useJoinerApp, deduplicateMobileHotels } from '../JoinerAppContext';
import type { MobileHotel } from '../JoinerAppContext';
import { MobileBottomNav } from '../components/MobileBottomNav';

export const MyHotelsScreen: React.FC = () => {
  const { hotels, orders, setCurrentScreen, setSelectedHotel, updateHotelStatus, updateHotel, deleteHotel, userProfile } = useJoinerApp();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusChangeToast, setStatusChangeToast] = useState<{ hotelName: string; status: string } | null>(null);

  const uniqueHotels = useMemo(() => deduplicateMobileHotels(hotels), [hotels]);

  // Edit Hotel Modal State
  const [editingHotel, setEditingHotel] = useState<MobileHotel | null>(null);
  const [editName, setEditName] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGst, setEditGst] = useState('');
  const [editFssai, setEditFssai] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [hotelToDelete, setHotelToDelete] = useState<MobileHotel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const allCount = uniqueHotels.length;
  const activeCount = uniqueHotels.filter(h => h.status === 'Active').length;
  const inactiveCount = uniqueHotels.filter(h => h.status !== 'Active').length;

  // Extract distinct zones for horizontal filter pill slider
  const uniqueZones = useMemo(() => {
    const zones = new Set<string>();
    uniqueHotels.forEach(h => {
      if (h.zone && h.zone.trim()) {
        zones.add(h.zone.trim());
      }
    });
    return Array.from(zones);
  }, [uniqueHotels]);

  const filterTabs = useMemo(() => {
    const baseTabs = [
      { label: `All (${allCount})`, value: 'All' },
      { label: `Active (${activeCount})`, value: 'Active' },
      { label: `Inactive (${inactiveCount})`, value: 'Inactive' }
    ];

    const zoneTabs = uniqueZones.map(zone => {
      const count = uniqueHotels.filter(h => h.zone === zone).length;
      return { label: `${zone} (${count})`, value: `zone:${zone}` };
    });

    return [...baseTabs, ...zoneTabs];
  }, [allCount, activeCount, inactiveCount, uniqueZones, uniqueHotels]);

  // Top High-Volume Outlets for Featured Side Scroller
  const topOutlets = useMemo(() => {
    return [...uniqueHotels]
      .sort((a, b) => (b.orders || 0) - (a.orders || 0))
      .slice(0, 6);
  }, [uniqueHotels]);

  const filteredHotels = uniqueHotels.filter(h => {
    const isHotelActive = h.status === 'Active';

    let matchesFilter = true;
    if (activeFilter === 'All') matchesFilter = true;
    else if (activeFilter === 'Active') matchesFilter = isHotelActive;
    else if (activeFilter === 'Inactive') matchesFilter = !isHotelActive;
    else if (activeFilter.startsWith('zone:')) {
      const targetZone = activeFilter.replace('zone:', '');
      matchesFilter = h.zone === targetZone;
    }

    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.contactPerson && h.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleSelectHotel = (hotel: MobileHotel) => {
    setSelectedHotel(hotel);
    setCurrentScreen('PLACE_ORDER');
  };

  const handleToggleStatus = async (e: React.MouseEvent, hotel: MobileHotel) => {
    e.stopPropagation();
    const nextStatus: 'Active' | 'Inactive' = hotel.status === 'Active' ? 'Inactive' : 'Active';
    await updateHotelStatus(hotel.id, nextStatus);
    setStatusChangeToast({ hotelName: hotel.name, status: nextStatus });
    setTimeout(() => {
      setStatusChangeToast(null);
    }, 2000);
  };

  const handleOpenEdit = (e: React.MouseEvent, hotel: MobileHotel) => {
    e.stopPropagation();
    setEditingHotel(hotel);
    setEditName(hotel.name);
    setEditZone(hotel.zone || userProfile.zone.replace(' Zone', ''));
    setEditContact(hotel.contactPerson || '');
    setEditPhone(hotel.phone || '');
    setEditAddress(hotel.address || '');
    setEditGst(hotel.gst || '');
    setEditFssai(hotel.fssai || '');
    setEditStatus(hotel.status === 'Active' ? 'Active' : 'Inactive');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel || !editName.trim()) return;

    setIsSaving(true);
    try {
      await updateHotel(editingHotel.id, {
        name: editName.trim(),
        zone: editZone.trim(),
        contactPerson: editContact.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        gst: editGst.trim(),
        fssai: editFssai.trim(),
        status: editStatus
      });
      setEditingHotel(null);
    } catch (err) {
      console.error('Failed to update hotel:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (e: React.MouseEvent, hotel: MobileHotel) => {
    e.stopPropagation();
    setHotelToDelete(hotel);
  };

  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;
    setIsDeleting(true);
    try {
      await deleteHotel(hotelToDelete.id);
      setHotelToDelete(null);
    } catch (err) {
      console.error('Failed to delete hotel:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-between select-none relative">
      {/* Status Change Toast */}
      {statusChangeToast && (
        <div className="absolute top-3 left-4 right-4 z-50 p-2.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold rounded-xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            {statusChangeToast.status === 'Active' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-400" />
            )}
            <span>
              <strong>{statusChangeToast.hotelName}</strong> is now{' '}
              <span className={statusChangeToast.status === 'Active' ? 'text-emerald-300' : 'text-amber-300'}>
                {statusChangeToast.status}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen('DASHBOARD')}
              className="p-1 -ml-1 text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">My Partner Hotels</h2>
              <p className="text-[10px] text-slate-500 font-semibold">
                {uniqueHotels.length} Registered Outlets • {activeCount} Active
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentScreen('ADD_HOTEL')}
            className="px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] active:scale-[0.98] text-white text-xs font-black rounded-xl flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Hotel
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search hotel name, zone, manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600 shadow-2xs"
          />
        </div>

        {/* ======================================================== */}
        {/* ADVANCE SIDE SCROLLER: FEATURED VIP OUTLETS CAROUSEL     */}
        {/* ======================================================== */}
        {topOutlets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="font-black text-slate-900 text-xs">
                  Key Accounts & Quick Reorder
                </h3>
              </div>
              <span className="text-[9.5px] font-bold text-slate-400">
                Top Performing
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1">
              {topOutlets.map(hotel => {
                const isActive = hotel.status === 'Active';
                return (
                  <div
                    key={hotel.id}
                    onClick={() => handleSelectHotel(hotel)}
                    className="w-[180px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative w-full h-20 rounded-xl overflow-hidden mb-2 bg-slate-100">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300';
                          }}
                        />
                        <span
                          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-black text-white ${
                            isActive ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}
                        >
                          {isActive ? '● Active' : 'Offline'}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-xs line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {hotel.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {hotel.zone} • {hotel.contactPerson || 'Manager'}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-slate-600">
                        {hotel.orders || 0} orders
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHotel(hotel);
                        }}
                        className="px-2 py-1 bg-[#15803d] hover:bg-[#166534] text-white text-[10px] font-black rounded-lg flex items-center gap-0.5 shadow-2xs"
                      >
                        <ShoppingCart className="w-2.5 h-2.5" /> Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ADVANCE SIDE SCROLLER: HORIZONTAL ZONE & FILTER PILLS    */}
        {/* ======================================================== */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab.value
                  ? 'bg-[#15803d] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hotels List or Empty State */}
        <div className="space-y-2.5 pt-1">
          {uniqueHotels.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3.5 bg-white rounded-2xl border border-dashed border-slate-300/90 shadow-2xs mt-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#15803d] flex items-center justify-center mx-auto shadow-xs">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">No Hotels Added Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  You haven't onboarded any hotels yet. Add a partner hotel to start placing orders and toggle active status.
                </p>
              </div>
              <button
                onClick={() => setCurrentScreen('ADD_HOTEL')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add First Hotel
              </button>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-700">No matching hotels found</p>
              <p className="text-[11px] text-slate-400">Try changing your search query or filter</p>
            </div>
          ) : (
            filteredHotels.map(hotel => {
              const isActive = hotel.status === 'Active';
              const hotelOrdersCount = orders.filter(o =>
                (o.hotelId && (String(o.hotelId) === String(hotel.id) || String(o.hotelId) === String(hotel.hotelId))) ||
                (o.hotelName && hotel.name && o.hotelName.trim().toLowerCase() === hotel.name.trim().toLowerCase())
              ).length;
              const displayOrdersCount = Math.max(hotel.orders || 0, hotelOrdersCount);

              return (
                <div
                  key={hotel.id}
                  onClick={() => handleSelectHotel(hotel)}
                  className={`bg-white p-3 rounded-2xl border transition-all cursor-pointer shadow-2xs flex flex-col gap-2.5 ${
                    isActive
                      ? 'border-slate-200/90 hover:border-emerald-500'
                      : 'border-slate-200/70 opacity-80 hover:opacity-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left Hotel Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className={`w-12 h-12 rounded-xl object-cover border border-slate-200 ${
                            !isActive ? 'grayscale-[50%]' : ''
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100';
                          }}
                        />
                        <span
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-900 text-xs truncate">
                            {hotel.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {hotel.zone} • {hotel.contactPerson || 'Manager'}
                        </p>
                        <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                          Orders: <strong className="text-slate-900">{displayOrdersCount}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Right Status Switcher */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title={isActive ? 'Click to set Inactive' : 'Click to set Active'}
                        onClick={(e) => handleToggleStatus(e, hotel)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Power className={`w-3 h-3 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Hotel Action Bar: Edit, Delete, Place Order */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10.5px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, hotel)}
                        className="text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDelete(e, hotel)}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                      </button>

                      {hotel.phone && (
                        <a
                          href={`tel:${hotel.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition-colors"
                          title="Call Hotel Contact"
                        >
                          <Phone className="w-3 h-3 text-blue-500" /> Call
                        </a>
                      )}
                    </div>

                    <span className="text-emerald-700 font-black flex items-center gap-0.5">
                      Order Produce &rarr;
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= EDIT HOTEL MODAL ================= */}
      {editingHotel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#15803d]" />
                <h3 className="text-sm font-black text-slate-900">Edit Hotel Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingHotel(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hotel / Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zone</label>
                  <input
                    type="text"
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 bg-white focus:outline-emerald-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kitchen Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={editGst}
                    onChange={(e) => setEditGst(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 uppercase focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">FSSAI License (Optional)</label>
                  <input
                    type="text"
                    value={editFssai}
                    onChange={(e) => setEditFssai(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingHotel(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE HOTEL CONFIRMATION MODAL ================= */}
      {hotelToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 animate-in zoom-in-95 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-slate-900">Delete Partner Hotel?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{hotelToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHotelToDelete(null)}
                className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
