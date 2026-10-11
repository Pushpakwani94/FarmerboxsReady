import React, { useState, useMemo } from 'react';
import { X, Building2, Search, Phone, Download, Calendar, ExternalLink, Filter } from 'lucide-react';
import type { Joiner, Hotel } from '../../types';
import { getHotelsForJoiner } from '../../data/joinerHotelsData';
import { useApp } from '../../context/AppContext';

interface JoinerHotelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  joiner: Joiner;
}

export const JoinerHotelsModal: React.FC<JoinerHotelsModalProps> = ({ isOpen, onClose, joiner }) => {
  const { setActiveTab, setSelectedHotel, hotels } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortBy, setSortBy] = useState<'orders-desc' | 'orders-asc' | 'name' | 'date'>('orders-desc');

  const allHotels = useMemo(() => {
    if (!joiner) return [];

    const jName = (joiner.name || '').trim().toLowerCase();
    const jIdStr = String(joiner.id || '').trim();
    const jPhone = String(joiner.mobile || joiner.phone || '').trim().replace(/[^0-9]/g, '');
    const jCleanPhone10 = jPhone.slice(-10);
    const jZone = (joiner.zone || '').trim().toLowerCase().replace(' zone', '');

    // Check if live hotels in AppContext belong to this joiner
    const liveJoinerHotels = hotels.filter(h => {
      const hJoiner = (h.joiner || (h as any).assignedJoiner || '').trim().toLowerCase();
      const hJoinerId = String((h as any).joinerId || (h as any).joinedBy || '').trim();
      const hZone = (h.zone || '').trim().toLowerCase().replace(' zone', '');
      const hJoinerPhone = String((h as any).joinerPhone || '').replace(/[^0-9]/g, '').slice(-10);

      const isDirectMatch = Boolean(
        (jName && (hJoiner === jName || hJoiner.includes(jName) || jName.includes(hJoiner))) ||
        (jIdStr && (hJoinerId === jIdStr)) ||
        (jCleanPhone10 && (hJoinerPhone === jCleanPhone10 || hJoinerId.includes(jCleanPhone10)))
      );

      const isZoneMatch = Boolean(jZone && hZone && (hZone === jZone || hZone.includes(jZone) || jZone.includes(hZone)));

      return isDirectMatch || isZoneMatch;
    });

    if (liveJoinerHotels.length > 0) {
      return liveJoinerHotels.map((h, idx) => ({
        id: typeof h.id === 'number' ? h.id : idx + 1,
        name: h.name || `Hotel ${idx + 1}`,
        location: h.zone || joiner.zone || 'Pune',
        owner: h.ownerName || (h as any).contactPerson || 'Hotel Manager',
        phone: h.mobile || h.phone || '9876543210',
        orders: h.totalOrders || h.orders || 1,
        joinedDate: h.registrationDate || (h as any).joinedDate || 'Today',
        status: h.status || 'Active'
      }));
    }

    return getHotelsForJoiner(joiner);
  }, [joiner, hotels]);

  const filteredHotels = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allHotels
      .filter(h => {
        const hName = (h.name || '').toLowerCase();
        const hLoc = (h.location || '').toLowerCase();
        const hOwner = (h.owner || '').toLowerCase();
        const hPhone = String(h.phone || '');
        const matchesSearch = !term || hName.includes(term) || hLoc.includes(term) || hOwner.includes(term) || hPhone.includes(term);
        const matchesStatus = statusFilter === 'All' || (h.status || 'Active') === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'orders-desc') return (b.orders || 0) - (a.orders || 0);
        if (sortBy === 'orders-asc') return (a.orders || 0) - (b.orders || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'date') return (b.joinedDate || '').localeCompare(a.joinedDate || '');
        return 0;
      });
  }, [allHotels, searchTerm, statusFilter, sortBy]);

  if (!isOpen || !joiner) return null;

  const activeCount = allHotels.filter(h => h.status === 'Active').length;
  const inactiveCount = allHotels.filter(h => h.status === 'Inactive').length;
  const totalOrders = allHotels.reduce((sum, h) => sum + (h.orders || 0), 0);
  const totalEarnings = totalOrders * 100;

  const handleExportCSV = () => {
    const headers = ['#', 'Hotel Name', 'Location', 'Owner', 'Phone', 'Orders', 'Earnings (₹)', 'Joined Date', 'Status'];
    const rows = filteredHotels.map((h, idx) => [
      idx + 1,
      `"${h.name}"`,
      `"${h.location}"`,
      `"${h.owner || ''}"`,
      `"${h.phone || ''}"`,
      h.orders || 0,
      (h.orders || 0) * 100,
      `"${h.joinedDate || ''}"`,
      h.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${joiner.name.replace(/\s+/g, '_')}_45_hotels_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewHotel = (hotelName: string) => {
    const existing = hotels.find(h => h.name.toLowerCase() === hotelName.toLowerCase()) || {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: hotelName,
      ownerName: 'Hotel Partner',
      mobile: '9876543210',
      email: `${hotelName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
      zone: joiner.zone,
      joiner: joiner.name,
      address: `${joiner.zone}, Pune`,
      totalOrders: 24,
      totalSpent: 48000,
      registrationDate: '2024-02-15',
      gstNumber: '27AABCF1234F1Z5',
      fssaiNumber: '11521083000456',
      rating: 4.8,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'
    } as Hotel;

    setSelectedHotel(existing);
    onClose();
    setActiveTab('Hotels');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3.5">
            <img
              src={joiner.avatar}
              alt={joiner.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  All {allHotels.length} Hotels Joined by {joiner.name}
                </h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  joiner.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {joiner.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Joiner Code: <span className="font-semibold text-slate-700">{joiner.joinerCode}</span> • Zone: <span className="font-semibold text-slate-700">{joiner.zone}</span> • Contact: <span className="font-semibold text-slate-700">{joiner.mobile}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Download CSV report of all 45 hotels"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-emerald-50/40 border-b border-emerald-100/60">
          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Total Joined Hotels</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span>{allHotels.length}</span>
              <span className="text-[11px] font-medium text-emerald-700">Hotels</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Active / Inactive Hotels</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-700">{activeCount}</span>
              <span className="text-slate-400 font-normal">/</span>
              <span className="text-rose-600">{inactiveCount}</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Total Orders from Hotels</p>
            <p className="text-xl font-extrabold text-purple-900 mt-0.5 flex items-center gap-1.5">
              <span>{totalOrders}</span>
              <span className="text-[11px] font-medium text-purple-600">Delivered</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Commission Earned (₹100/Order)</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
              ₹{totalEarnings.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hotel name, location, owner..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                All ({allHotels.length})
              </button>
              <button
                onClick={() => setStatusFilter('Active')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'Active' ? 'bg-white text-emerald-800 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('Inactive')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'Inactive' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent focus:outline-none cursor-pointer font-medium"
              >
                <option value="orders-desc">Most Orders</option>
                <option value="orders-asc">Least Orders</option>
                <option value="name">Name (A-Z)</option>
                <option value="date">Newest Joined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Hotels Table */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[480px]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Hotel Name</th>
                <th className="py-2.5 px-3">Location / Area</th>
                <th className="py-2.5 px-3">Owner / Contact</th>
                <th className="py-2.5 px-3 text-center">Joined Date</th>
                <th className="py-2.5 px-3 text-center">Orders</th>
                <th className="py-2.5 px-3 text-right">Commission Earned</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No hotels match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredHotels.map((hotel, index) => (
                  <tr
                    key={hotel.id || index}
                    className="hover:bg-emerald-50/40 transition-colors group"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                          {hotel.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {hotel.location}
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium text-slate-800">{hotel.owner || 'Manager'}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {hotel.phone || '9876543210'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{hotel.joinedDate || '15 Jan 2024'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-100">
                        {hotel.orders || 0} orders
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-800">
                      ₹{((hotel.orders || 0) * 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        hotel.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {hotel.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleViewHotel(hotel.name)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                        title="View Hotel Details in Hotels Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-800">{filteredHotels.length}</strong> of <strong className="text-slate-800">{allHotels.length}</strong> hotels onboarded by {joiner.name}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
