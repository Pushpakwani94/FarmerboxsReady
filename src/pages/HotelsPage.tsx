import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Hotel } from '../types';
import {
  Building2,
  UserCheck,
  UserX,
  MapPin,
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Shield,
  FileText
} from 'lucide-react';

export const HotelsPage: React.FC = () => {
  const {
    hotels,
    orders,
    selectedHotel,
    setSelectedHotel,
    setIsAddHotelOpen,
    zones,
    joiners,
    isDatabaseConnected,
    deleteHotel,
    updateHotel,
    confirmAction,
    setActiveTab
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedJoiner, setSelectedJoiner] = useState('All Joiners');
  const [selectedTab, setSelectedTab] = useState<'Order History' | 'Payment History' | 'Hotel Info' | 'Documents'>('Order History');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit Hotel modal state
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    ownerName: '',
    mobile: '',
    zone: '',
    joiner: '',
    address: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const filteredHotels = hotels.filter(h => {
    const term = searchTerm.toLowerCase();
    const joinerStr = (h.joiner || h.assignedJoiner || '').toLowerCase();
    const ownerStr = (h.ownerName || h.contactPerson || '').toLowerCase();
    const phoneStr = String(h.mobile || h.phone || '');
    const nameMatch = (h.name || '').toLowerCase().includes(term);
    const ownerMatch = ownerStr.includes(term);
    const zoneMatch = (h.zone || '').toLowerCase().includes(term);
    const joinerMatch = joinerStr.includes(term);
    const phoneMatch = phoneStr.includes(term);
    const matchesSearch = !searchTerm || nameMatch || ownerMatch || zoneMatch || joinerMatch || phoneMatch;

    const matchesZone = selectedZone === 'All Zones' || h.zone === selectedZone;
    const matchesJoiner = selectedJoiner === 'All Joiners' || 
      (h.joiner && h.joiner.toLowerCase() === selectedJoiner.toLowerCase()) ||
      (h.assignedJoiner && h.assignedJoiner.toLowerCase() === selectedJoiner.toLowerCase());

    return matchesSearch && matchesZone && matchesJoiner;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedHotels = filteredHotels.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const activeHotel: Hotel | null =
    selectedHotel && hotels.some(h => String(h.id) === String(selectedHotel.id))
      ? selectedHotel
      : filteredHotels[0] || hotels[0] || null;

  const getHotelStats = (h: Hotel | null) => {
    if (!h) return { ordersCount: 0, totalSpent: 0, hotelOrders: [] as typeof orders };
    const hId = String(h.id || '');
    const hHotelId = String(h.hotelId || '');
    const hName = (h.name || '').trim().toLowerCase();

    const hotelOrders = orders.filter(o => {
      const oHotelId = String(o.hotelId || '');
      const oHotelName = (o.hotelName || '').trim().toLowerCase();
      return (
        (hId && oHotelId === hId) ||
        (hHotelId && oHotelId === hHotelId) ||
        (hName && oHotelName === hName) ||
        (hName && oHotelName.includes(hName)) ||
        (hName.length > 3 && hName.includes(oHotelName))
      );
    });

    const ordersCount = hotelOrders.length > 0 ? hotelOrders.length : Number(h.totalOrders ?? h.orders ?? 0);
    const totalSpent = hotelOrders.length > 0
      ? hotelOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
      : Number(h.totalSpent ?? 0);

    return { ordersCount, totalSpent, hotelOrders };
  };

  const activeHotelStats = getHotelStats(activeHotel);

  const totalHotelsCount = hotels.length;
  const activeHotelsCount = hotels.filter(h => (h.status || 'Active') === 'Active').length;
  const inactiveHotelsCount = hotels.filter(h => h.status === 'Inactive').length;
  const zonesCount = zones.length;
  const joinersCount = joiners.length;

  const handleOpenEdit = (h: Hotel) => {
    setEditingHotel(h);
    setEditForm({
      name: h.name || '',
      ownerName: h.ownerName || '',
      mobile: h.mobile || '',
      zone: h.zone || (zones[0]?.name || 'Kharadi'),
      joiner: h.joiner || (joiners[0]?.name || ''),
      address: h.address || '',
      status: h.status === 'Active' ? 'Active' : 'Inactive'
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    updateHotel(editingHotel.id, {
      name: editForm.name,
      ownerName: editForm.ownerName,
      mobile: editForm.mobile,
      zone: editForm.zone,
      joiner: editForm.joiner,
      address: editForm.address,
      status: editForm.status
    });
    setEditingHotel(null);
  };

  const handleDownloadReport = () => {
    const headers = ['ID', 'Hotel Name', 'Owner', 'Mobile', 'Zone', 'Joiner', 'Total Orders', 'Status', 'Address'];
    const rows = filteredHotels.map(h => [
      h.id,
      `"${(h.name || '').replace(/"/g, '""')}"`,
      `"${(h.ownerName || '').replace(/"/g, '""')}"`,
      h.mobile || '',
      `"${(h.zone || '').replace(/"/g, '""')}"`,
      `"${(h.joiner || '').replace(/"/g, '""')}"`,
      h.totalOrders ?? 0,
      h.status || 'Active',
      `"${(h.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmerbox_hotels_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Hotels</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{totalHotelsCount}</h3>
          </div>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Active Hotels</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{activeHotelsCount}</h3>
          </div>
        </div>

        <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Inactive Hotels</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{inactiveHotelsCount}</h3>
          </div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Zones</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{zonesCount}</h3>
          </div>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Hotel Joiners</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{joinersCount}</h3>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsAddHotelOpen(true)}
            className="w-full h-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Register Hotel
          </button>
        </div>
      </div>

      {/* Full-width Hotels List Table Section (No Slider) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800 whitespace-nowrap">Hotels List</h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 whitespace-nowrap">
              {filteredHotels.length} {filteredHotels.length === 1 ? 'Hotel' : 'Hotels'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search hotel, owner..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <select
              value={selectedZone}
              onChange={e => {
                setSelectedZone(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Zones">All Zones</option>
              {zones.map(z => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
            </select>

            <select
              value={selectedJoiner}
              onChange={e => {
                setSelectedJoiner(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Joiners">All Joiners</option>
              {joiners.map(j => (
                <option key={j.id} value={j.name}>{j.name}</option>
              ))}
            </select>

            <button
              onClick={() => setIsAddHotelOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Register Hotel
            </button>
          </div>
        </div>

        {/* Table Content */}
        {hotels.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">No Hotels Registered Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Register your partner hotels to assign field joiners and manage fresh supply deliveries.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsAddHotelOpen(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Register First Hotel
              </button>
            </div>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-700">No hotels match your filter criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedZone('All Zones');
                setSelectedJoiner('All Joiners');
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
                  <th className="py-2.5 px-3 whitespace-nowrap">Hotel Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Owner Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Mobile Number</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Zone</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Assigned Joiner</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Total Orders</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedHotels.map((h, idx) => {
                  const isSelected = activeHotel && String(activeHotel.id) === String(h.id);
                  return (
                    <tr
                      key={h.id}
                      onClick={() => setSelectedHotel(h)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/80 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {(safeCurrentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={h.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'}
                            alt={h.name || 'Hotel'}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100';
                            }}
                          />
                          <span>{h.name || 'Unnamed Hotel'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{h.ownerName || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">{h.mobile || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{h.zone || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {h.addedBy === 'Admin' || h.joiner === 'Admin' || h.assignedJoiner === 'Admin' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                          </span>
                        ) : (
                          h.joiner || '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                        {getHotelStats(h).ordersCount}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (h.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {h.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHotel(h);
                            }}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="View Hotel Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(h);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit Hotel"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmAction({
                                title: 'Delete Hotel',
                                message: 'Are you sure you want to delete this hotel? Their profile, active orders, and joiner linkages will be removed.',
                                entityName: h.name,
                                confirmLabel: 'Delete Hotel',
                                type: 'danger',
                                onConfirm: () => deleteHotel(h.id)
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="Delete Hotel"
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
        {filteredHotels.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-xs text-slate-500 gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span>
                Showing {filteredHotels.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(safeCurrentPage * itemsPerPage, filteredHotels.length)} of {filteredHotels.length} hotels
              </span>
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-[11px] text-slate-400">Rows:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700 focus:outline-emerald-600 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                    safeCurrentPage === pageNum ? 'bg-emerald-700 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Hotel Details & Information Section (Below Table) */}
      {activeHotel && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={activeHotel.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300'}
                alt={activeHotel.name || 'Hotel'}
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-600 shadow-xs shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300';
                }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800">{activeHotel.name || 'Unnamed Hotel'}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    (activeHotel.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeHotel.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Owner: <span className="font-semibold text-slate-700">{activeHotel.ownerName || 'Contact Person'}</span> • Registered {activeHotel.registrationDate || 'Recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenEdit(activeHotel)}
                className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Edit className="w-3 h-3" /> Edit Profile
              </button>
              <button
                onClick={() => {
                  confirmAction({
                    title: 'Delete Hotel',
                    message: 'Are you sure you want to permanently delete this hotel? All associated order records and delivery routing will be updated.',
                    entityName: activeHotel.name,
                    confirmLabel: 'Delete Hotel',
                    type: 'danger',
                    onConfirm: () => {
                      deleteHotel(activeHotel.id);
                      setSelectedHotel(null);
                    }
                  });
                }}
                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                title="Delete Hotel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Contact Details, Metadata & Stats */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="flex items-center gap-2 text-slate-700"><Phone className="w-3.5 h-3.5 text-slate-400" /> {activeHotel.mobile || 'Not provided'}</p>
                <p className="flex items-center gap-2 text-slate-700"><Mail className="w-3.5 h-3.5 text-slate-400" /> {activeHotel.email || 'Not provided'}</p>
                <p className="flex items-center gap-2 text-slate-700"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {activeHotel.zone || 'Kharadi'} Zone</p>
                <p className="flex items-center gap-2 text-slate-700">
                  <span className="text-slate-400">Assigned Joiner:</span>
                  <span className="font-bold text-slate-800">{activeHotel.joiner || 'Admin'}</span>
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                  <p className="text-[10px] text-slate-400 font-medium">Total Orders</p>
                  <p className="font-bold text-sky-900 text-base">{activeHotelStats.ordersCount}</p>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                  <p className="text-[10px] text-slate-400 font-medium">Order Value</p>
                  <p className="font-bold text-purple-900 text-base">₹{activeHotelStats.totalSpent.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-slate-400 font-medium">Rating</p>
                  <p className="font-bold text-amber-900 text-base flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{activeHotel.rating ?? 5.0}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-400">GST Registration</p>
                  <p className="font-bold text-slate-800 font-mono text-[11px] truncate">{activeHotel.gstNumber || '27ABCDE1234F9Z9'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-400">FSSAI License</p>
                  <p className="font-bold text-slate-800 font-mono text-[11px] truncate">{activeHotel.fssaiNumber || '11521007000999'}</p>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setIsAddHotelOpen(true)}
                  className="py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-emerald-100 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" /> Register
                </button>
                <button
                  onClick={() => setActiveTab('Hotel Joiners')}
                  className="py-2 bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-sky-100 cursor-pointer transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-sky-700" /> Joiners
                </button>
                <button
                  onClick={() => setActiveTab('Zones')}
                  className="py-2 bg-orange-50 border border-orange-200 text-orange-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-orange-100 cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-orange-700" /> Zones
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="py-2 bg-purple-50 border border-purple-200 text-purple-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-purple-100 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-purple-700" /> Export
                </button>
              </div>
            </div>

            {/* Right: Sub-Tabs for Order History, Documents, & Hotel Info */}
            <div className="lg:col-span-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 text-xs font-bold text-slate-600">
                {(['Order History', 'Payment History', 'Hotel Info', 'Documents'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`pb-2 transition-all cursor-pointer ${
                      selectedTab === tab ? 'text-emerald-700 border-b-2 border-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {selectedTab === 'Order History' && (
                <div className="overflow-hidden">
                  {activeHotelStats.hotelOrders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                      <p>No orders placed by this hotel partner yet.</p>
                      <button
                        onClick={() => setActiveTab('Orders')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Go to Orders Dispatch
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                          <th className="py-2 px-2">Order ID</th>
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2 text-right">Amount</th>
                          <th className="py-2 px-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeHotelStats.hotelOrders.map(ord => (
                          <tr key={ord.id} className="hover:bg-slate-100/60 transition-colors">
                            <td className="py-2 px-2 font-bold text-slate-800">{ord.id}</td>
                            <td className="py-2 px-2 text-slate-500">{ord.date}</td>
                            <td className="py-2 px-2 text-right font-bold text-slate-900">₹{(Number(ord.amount) || 0).toLocaleString('en-IN')}</td>
                            <td className="py-2 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {selectedTab === 'Payment History' && (
                <div className="py-10 text-center text-slate-400 text-xs">
                  All payment records are verified and settled up to date.
                </div>
              )}

              {selectedTab === 'Hotel Info' && (
                <div className="py-2 text-xs space-y-2 text-slate-600">
                  <p><strong>Full Address:</strong> {activeHotel.address || 'Pune, Maharashtra'}</p>
                  <p><strong>Assigned Zone:</strong> {activeHotel.zone || 'Kharadi'} Zone</p>
                  <p><strong>Key Account Executive:</strong> {activeHotel.joiner || 'Admin'}</p>
                </div>
              )}

              {selectedTab === 'Documents' && (
                <div className="py-2 text-xs space-y-2 text-slate-600">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium">FSSAI License Certificate</span>
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium">GST Registration Certificate</span>
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                </div>
              )}
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

      {/* Edit Hotel Modal */}
      {editingHotel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Edit Hotel Profile</h3>
                  <p className="text-xs text-slate-500">Update hotel details, zone, and partner joiner</p>
                </div>
              </div>
              <button
                onClick={() => setEditingHotel(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Hotel Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Owner / Manager Name</label>
                <input
                  type="text"
                  required
                  value={editForm.ownerName}
                  onChange={e => setEditForm({ ...editForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.mobile}
                  onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Zone</label>
                  <select
                    value={editForm.zone}
                    onChange={e => setEditForm({ ...editForm, zone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium cursor-pointer"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Joiner</label>
                  <select
                    value={editForm.joiner}
                    onChange={e => setEditForm({ ...editForm, joiner: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    {joiners.map(j => (
                      <option key={j.id} value={j.name}>{j.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Operational Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: 'Active' })}
                    className={`py-2 text-center rounded-lg font-bold border transition-colors cursor-pointer ${
                      editForm.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: 'Inactive' })}
                    className={`py-2 text-center rounded-lg font-bold border transition-colors cursor-pointer ${
                      editForm.status === 'Inactive'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHotel(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
