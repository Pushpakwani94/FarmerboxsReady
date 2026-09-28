import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  UserCheck,
  UserX,
  CheckCircle2,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  Clock,
  Package,
  Layers
} from 'lucide-react';
import type { Driver } from '../types';
import { DriverDetailModal } from '../components/Modals/DriverDetailModal';
import { AddDriverModal } from '../components/Modals/AddDriverModal';
import { EditDriverModal } from '../components/Modals/EditDriverModal';
import { AssignZoneModal } from '../components/Modals/AssignZoneModal';
import { AssignOrderModal } from '../components/Modals/AssignOrderModal';
import { ViewDeliveriesModal } from '../components/Modals/ViewDeliveriesModal';

const ZONE_MAP_COORDS: Record<string, { cx: number; cy: number; color: string; ping?: boolean }> = {
  'kharadi': { cx: 340, cy: 75, color: '#16a34a', ping: true },
  'viman nagar': { cx: 280, cy: 65, color: '#2563eb' },
  'hadapsar': { cx: 320, cy: 155, color: '#ea580c' },
  'magarpatta': { cx: 260, cy: 140, color: '#dc2626' },
  'hinjawadi': { cx: 80, cy: 80, color: '#9333ea' },
  'baner': { cx: 140, cy: 60, color: '#0284c7' },
  'kothrud': { cx: 120, cy: 150, color: '#ca8a04' },
  'shivajinagar': { cx: 200, cy: 100, color: '#059669' },
  'wakad': { cx: 100, cy: 110, color: '#e11d48' },
  'aundh': { cx: 160, cy: 80, color: '#0891b2' },
  'pimple saudagar': { cx: 150, cy: 40, color: '#7c3aed' },
  'pimpri chinchwad': { cx: 110, cy: 30, color: '#db2777' },
  'pimple chinchwad': { cx: 110, cy: 30, color: '#db2777' }
};

export const DriversPage: React.FC = () => {
  const { drivers, zones, orders, deleteDriver, updateDriver, confirmAction } = useApp();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All Zones');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [zoneTableFilter, setZoneTableFilter] = useState('All Zones');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected driver for details & modals
  const [selectedDriverState, setSelectedDriverState] = useState<Driver | null>(null);
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignZoneOpen, setIsAssignZoneOpen] = useState(false);
  const [isAssignOrderOpen, setIsAssignOrderOpen] = useState(false);
  const [isViewDeliveriesOpen, setIsViewDeliveriesOpen] = useState(false);
  const [hoveredMapPin, setHoveredMapPin] = useState<string | null>(null);

  // Filter drivers
  const filteredDrivers = drivers.filter(d => {
    const term = searchTerm.toLowerCase().trim();
    const name = (d.name || '').toLowerCase();
    const mobile = String(d.mobile || '');
    const vehicle = (d.vehicleNo || '').toLowerCase();
    const zone = (d.zone || '').toLowerCase();
    const status = (d.status || 'Active').toLowerCase();

    const matchesSearch =
      !term ||
      name.includes(term) ||
      mobile.includes(term) ||
      vehicle.includes(term) ||
      zone.includes(term);

    const matchesZone =
      selectedZoneFilter === 'All Zones' ||
      zone === selectedZoneFilter.toLowerCase() ||
      zone.includes(selectedZoneFilter.toLowerCase()) ||
      selectedZoneFilter.toLowerCase().includes(zone);

    const matchesStatus =
      selectedStatusFilter === 'All Status' ||
      status === selectedStatusFilter.toLowerCase();

    return matchesSearch && matchesZone && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / itemsPerPage));
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeDriverItem: Driver | null =
    selectedDriverState && drivers.some(d => String(d.id) === String(selectedDriverState.id))
      ? selectedDriverState
      : filteredDrivers[0] || drivers[0] || null;

  // Dynamic counts
  const activeDriversCount = drivers.filter(d => (d.status || 'Active') === 'Active').length;
  const onLeaveCount = drivers.filter(d => d.status === 'On Leave').length;
  const inactiveDriversCount = drivers.filter(d => d.status === 'Inactive').length;
  const totalInactive = inactiveDriversCount + onLeaveCount;

  const liveDeliveredOrders = orders.filter(o => o.status === 'Delivered' || o.orderStatus === 'Delivered').length;
  const totalDeliveriesCount = orders.length > 0
    ? orders.length
    : drivers.reduce((sum, d) => sum + (d.totalDeliveries || 0), 0);
  const completedDeliveriesCount = orders.length > 0
    ? liveDeliveredOrders
    : drivers.reduce((sum, d) => sum + (d.completedToday || d.totalDeliveries || 0), 0);
  const successRate = totalDeliveriesCount > 0 ? Math.round((completedDeliveriesCount / totalDeliveriesCount) * 100) : 100;

  // Zone statistics dynamically computed from zones & drivers state
  const zoneStatsList = zones.length > 0
    ? zones.map(z => {
        const zDrivers = drivers.filter(d =>
          (d.zone || '').toLowerCase().includes(z.name.toLowerCase()) ||
          z.name.toLowerCase().includes((d.zone || '').toLowerCase())
        );
        return {
          zone: z.name,
          total: zDrivers.length,
          active: zDrivers.filter(d => (d.status || 'Active') === 'Active').length,
          inactive: zDrivers.filter(d => (d.status || 'Active') !== 'Active').length
        };
      })
    : [];

  const topActiveZones = zoneStatsList.filter(z => z.total > 0).length > 0
    ? zoneStatsList.filter(z => z.total > 0)
    : zoneStatsList.slice(0, 4);

  // Handlers
  const handleOpenView = (driver: Driver) => {
    setActiveDriver(driver);
    setSelectedDriverState(driver);
    setIsViewModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setActiveDriver(driver);
    setSelectedDriverState(driver);
    setIsEditModalOpen(true);
  };

  const handleDeleteDriver = (driver: Driver) => {
    confirmAction({
      title: 'Remove Delivery Driver',
      message: 'Are you sure you want to remove this driver from the active delivery fleet?',
      entityName: `${driver.name} (${driver.vehicleNo})`,
      confirmLabel: 'Remove Driver',
      type: 'danger',
      onConfirm: () => {
        deleteDriver(driver.id);
        if (selectedDriverState && selectedDriverState.id === driver.id) {
          setSelectedDriverState(null);
        }
      }
    });
  };

  const handleToggleStatus = (driver: Driver) => {
    const nextStatus: Driver['status'] = (driver.status || 'Active') === 'Active' ? 'On Leave' : 'Active';
    updateDriver(driver.id, { status: nextStatus });
    setSelectedDriverState(prev => (prev && prev.id === driver.id ? { ...prev, status: nextStatus } : prev));
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Drivers</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{drivers.length}</h3>
          </div>
        </div>

        <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Active Drivers</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{activeDriversCount}</h3>
          </div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">On Leave</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{onLeaveCount}</h3>
          </div>
        </div>

        <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Inactive Drivers</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{inactiveDriversCount}</h3>
          </div>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Deliveries Done</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{completedDeliveriesCount}</h3>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full h-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Driver
          </button>
        </div>
      </div>

      {/* Full-width Delivery Drivers List Table Section (No Slider) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800 whitespace-nowrap">Delivery Drivers</h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 whitespace-nowrap">
              {filteredDrivers.length} {filteredDrivers.length === 1 ? 'Driver' : 'Drivers'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search driver, vehicle..."
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
              {zones.map(z => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
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
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Add Driver
            </button>
          </div>
        </div>

        {/* Table View */}
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-700">No drivers match your filter criteria.</p>
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
                  <th className="py-2.5 px-3 whitespace-nowrap">Driver Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Mobile Number</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Zone</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Vehicle Number</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Total Deliveries</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Rating</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDrivers.map((driver, idx) => {
                  const displayIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isSelected = activeDriverItem && String(activeDriverItem.id) === String(driver.id);
                  const driverOrders = orders.filter(o =>
                    (o.driver && driver.name && o.driver.toLowerCase() === driver.name.toLowerCase()) ||
                    (o.driverPhone && driver.mobile && o.driverPhone === driver.mobile)
                  );
                  const driverDeliveries = driverOrders.length > 0 ? driverOrders.length : (driver.totalDeliveries || 0);

                  return (
                    <tr
                      key={driver.id}
                      onClick={() => setSelectedDriverState(driver)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/80 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-500 whitespace-nowrap">{displayIndex}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={driver.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={driver.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <span>{driver.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">{driver.mobile}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{driver.zone}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px] uppercase font-semibold whitespace-nowrap">
                        {driver.vehicleNo}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block ${
                            (driver.status || 'Active') === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : driver.status === 'On Leave'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {driver.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800 text-xs whitespace-nowrap">
                        {driverDeliveries}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-600 whitespace-nowrap">
                        <span className="flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{(driver.rating || 4.8).toFixed(1)}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenView(driver)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="View Driver Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(driver)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit Driver"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(driver)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="Delete Driver"
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
        {filteredDrivers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-xs text-slate-500 gap-3 border-t border-slate-100">
            <span>
              Showing {filteredDrivers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} of {filteredDrivers.length} drivers
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                    currentPage === p ? 'bg-emerald-700 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Driver Details & Zone Breakdown Section (Below Table) */}
      {activeDriverItem && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={activeDriverItem.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={activeDriverItem.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800">{activeDriverItem.name}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      (activeDriverItem.status || 'Active') === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeDriverItem.status === 'On Leave'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {activeDriverItem.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Vehicle: <span className="font-bold text-slate-800 uppercase font-mono">{activeDriverItem.vehicleNo}</span> • Rating: {(activeDriverItem.rating || 4.8).toFixed(1)} ★
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenView(activeDriverItem)}
                className="px-3.5 py-1.5 bg-sky-700 text-white text-xs font-semibold rounded-lg hover:bg-sky-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Eye className="w-3 h-3" /> Full Profile
              </button>
              <button
                onClick={() => handleOpenEdit(activeDriverItem)}
                className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Edit className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => handleDeleteDriver(activeDriverItem)}
                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                title="Delete Driver"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Driver Information & Quick Actions */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="flex items-center gap-2 text-slate-700"><Phone className="w-3.5 h-3.5 text-slate-400" /> {activeDriverItem.mobile || 'Not provided'}</p>
                <p className="flex items-center gap-2 text-slate-700"><Truck className="w-3.5 h-3.5 text-slate-400" /> {activeDriverItem.vehicleNo} ({activeDriverItem.vehicleType || 'Tempo / Van'})</p>
                <p className="flex items-center gap-2 text-slate-700"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {activeDriverItem.zone || 'Kharadi'} Zone</p>
                <p className="flex items-center gap-2 text-slate-700">
                  <span className="text-slate-400">License:</span>
                  <span className="font-mono font-bold text-slate-800">{(activeDriverItem as any)?.licenseNo || (activeDriverItem as any)?.licenseNumber || 'MH12 20210049281'}</span>
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                  <p className="text-[10px] text-slate-400 font-medium">Total Runs</p>
                  <p className="font-bold text-sky-900 text-base">{activeDriverItem.totalDeliveries || 0}</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-medium">Completed</p>
                  <p className="font-bold text-emerald-900 text-base">{activeDriverItem.completedToday || activeDriverItem.totalDeliveries || 0}</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-slate-400 font-medium">Rating</p>
                  <p className="font-bold text-amber-900 text-base">{(activeDriverItem.rating || 4.8).toFixed(1)} ★</p>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-emerald-100 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" /> Driver
                </button>
                <button
                  onClick={() => {
                    setActiveDriver(activeDriverItem);
                    setIsAssignZoneOpen(true);
                  }}
                  className="py-2 bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-sky-100 cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-700" /> Zone
                </button>
                <button
                  onClick={() => {
                    setActiveDriver(activeDriverItem);
                    setIsAssignOrderOpen(true);
                  }}
                  className="py-2 bg-purple-50 border border-purple-200 text-purple-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-purple-100 cursor-pointer transition-colors"
                >
                  <Package className="w-3.5 h-3.5 text-purple-700" /> Order
                </button>
                <button
                  onClick={() => handleToggleStatus(activeDriverItem)}
                  className="py-2 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-amber-100 cursor-pointer transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" /> Toggle Status
                </button>
              </div>
            </div>

            {/* Right: Zone-wise Breakdown & Pune Driver Map */}
            <div className="lg:col-span-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Zone-Wise Fleet Coverage</h4>
                <span className="text-[11px] text-slate-500 font-medium">Live Delivery Pins</span>
              </div>

              {/* Map Canvas */}
              <div className="h-56 bg-white rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 420 220">
                  <defs>
                    <linearGradient id="driverMapRiverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="driverPinShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.2" />
                    </filter>
                  </defs>

                  <rect width="420" height="220" fill="#f8fafc" />
                  <path d="M 0 110 Q 120 100 240 115 T 420 110" stroke="#e2e8f0" strokeWidth="5" fill="none" />
                  <path d="M 160 0 Q 180 90 210 220" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                  <path d="M 230 0 Q 250 110 320 220" stroke="#e2e8f0" strokeWidth="3" fill="none" />

                  {/* River */}
                  <path
                    d="M 20 60 Q 100 90 180 95 T 290 85 T 410 130"
                    stroke="url(#driverMapRiverGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                  />

                  <text x="185" y="138" fill="#94a3b8" fontSize="13" fontWeight="bold">Pune</text>

                  {/* Dynamic Zone Pins */}
                  {topActiveZones.map((z, idx) => {
                    const zKey = z.zone.toLowerCase().trim();
                    const coords = ZONE_MAP_COORDS[zKey] || { cx: 160 + (idx * 40), cy: 90 + ((idx % 3) * 35), color: '#16a34a' };
                    return (
                      <g
                        key={z.zone}
                        className="cursor-pointer transition-transform hover:scale-110"
                        onClick={() => { setSelectedZoneFilter(z.zone); setCurrentPage(1); }}
                        onMouseEnter={() => setHoveredMapPin(`${z.zone}: ${z.total} Drivers (${z.active} Active)`)}
                        onMouseLeave={() => setHoveredMapPin(null)}
                      >
                        {coords.ping && <circle cx={coords.cx} cy={coords.cy} r="14" fill={coords.color} fillOpacity="0.2" className="animate-ping" />}
                        <circle cx={coords.cx} cy={coords.cy} r="12" fill={coords.color} fillOpacity="0.2" />
                        <path
                          d={`M ${coords.cx} ${coords.cy - 13} C ${coords.cx - 7} ${coords.cy - 13} ${coords.cx - 12} ${coords.cy - 8} ${coords.cx - 12} ${coords.cy - 1} C ${coords.cx - 12} ${coords.cy + 8} ${coords.cx} ${coords.cy + 19} ${coords.cx} ${coords.cy + 19} C ${coords.cx} ${coords.cy + 19} ${coords.cx + 12} ${coords.cy + 8} ${coords.cx + 12} ${coords.cy - 1} C ${coords.cx + 12} ${coords.cy - 8} ${coords.cx + 7} ${coords.cy - 13} ${coords.cx} ${coords.cy - 13} Z`}
                          fill={coords.color}
                          filter="url(#driverPinShadow)"
                        />
                        <circle cx={coords.cx} cy={coords.cy - 2} r="4" fill="#ffffff" />
                      </g>
                    );
                  })}
                </svg>

                {hoveredMapPin && (
                  <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[11px] px-2.5 py-1 rounded-lg font-medium shadow-md pointer-events-none">
                    {hoveredMapPin}
                  </div>
                )}
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

      {/* Modals */}
      <AddDriverModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        driver={activeDriver}
      />

      <DriverDetailModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        driver={activeDriver}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
      />

      <AssignZoneModal
        isOpen={isAssignZoneOpen}
        onClose={() => setIsAssignZoneOpen(false)}
      />

      <AssignOrderModal
        isOpen={isAssignOrderOpen}
        onClose={() => setIsAssignOrderOpen(false)}
      />

      <ViewDeliveriesModal
        isOpen={isViewDeliveriesOpen}
        onClose={() => setIsViewDeliveriesOpen(false)}
      />
    </div>
  );
};
