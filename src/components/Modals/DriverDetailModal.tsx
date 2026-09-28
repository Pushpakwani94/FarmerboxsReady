import React from 'react';
import { X, Truck, Phone, Mail, MapPin, Star, Shield, Award, Calendar, CheckCircle2, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Driver } from '../../types';

interface DriverDetailModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (driver: Driver) => void;
  onToggleStatus: (driver: Driver) => void;
}

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({
  driver,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus
}) => {
  const { deleteDriver, confirmAction } = useApp();
  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src={driver.avatar}
              alt={driver.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">{driver.name}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    driver.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : driver.status === 'On Leave'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {driver.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {driver.zone}, Pune
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {driver.rating}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Done</span>
            <span className="text-lg font-bold text-emerald-800">{driver.totalDeliveries}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Orders</span>
          </div>

          <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-100 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Today</span>
            <span className="text-lg font-bold text-sky-800">{driver.completedToday ?? 4}</span>
            <span className="text-[10px] text-sky-600 block mt-0.5">Completed</span>
          </div>

          <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-100 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Active Now</span>
            <span className="text-lg font-bold text-purple-800">{driver.activeDeliveries ?? 1}</span>
            <span className="text-[10px] text-purple-600 block mt-0.5">In Transit</span>
          </div>

          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-100 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">On-Time Rate</span>
            <span className="text-lg font-bold text-amber-700">{driver.onTimeRate ?? '96%'}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Success</span>
          </div>
        </div>

        {/* Contact & Vehicle Info */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-slate-400 block text-[11px]">Mobile Number</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> {driver.mobile}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Email Address</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5 truncate">
                <Mail className="w-3.5 h-3.5 text-sky-600" /> {driver.email || `${driver.name.toLowerCase().replace(/\s+/g, '')}@farmerbox.in`}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Vehicle Number</span>
              <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Truck className="w-3.5 h-3.5 text-purple-600" /> {driver.vehicleNo}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Vehicle Model</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" /> {driver.vehicleModel || 'Tata Ace Gold (CNG)'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Driving License No.</span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                {driver.licenseNumber || 'MH12-20180023411'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
              <span className="font-semibold text-slate-700 mt-0.5 block">
                {driver.emergencyContact || '9822114455'} (Family)
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Added By</span>
              <span className="font-semibold text-amber-800 mt-0.5 inline-flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                <Shield className="w-2.5 h-2.5 text-amber-600" /> {driver.addedBy || driver.createdBy || 'Admin'}
              </span>
            </div>
          </div>

          {/* Recent Orders / Deliveries */}
          <div className="space-y-1.5 pt-1">
            <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Today's Deliveries Handled</span>
              <span className="text-[11px] text-emerald-700 font-semibold">11 Sep 2026</span>
            </h4>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {(driver.recentOrders && driver.recentOrders.length > 0 ? driver.recentOrders : [
                { id: 'FB1001', hotelName: 'Hotel Spice Villa', zone: driver.zone, time: '10:24 AM', status: 'Delivered' as const, amount: 2500 },
                { id: 'FB1014', hotelName: `${driver.zone} Flavours`, zone: driver.zone, time: '09:10 AM', status: 'Delivered' as const, amount: 1850 },
                { id: 'FB1028', hotelName: `${driver.zone} Kitchen`, zone: driver.zone, time: '11:45 AM', status: 'In Transit' as const, amount: 3200 }
              ]).map((ord, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sky-600 text-[11px]">{ord.id}</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">{ord.hotelName}</p>
                      <p className="text-[10px] text-slate-400">{ord.zone} • {ord.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-[11px]">₹{ord.amount.toLocaleString('en-IN')}</span>
                    <div>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStatus(driver)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs border cursor-pointer ${
                driver.status === 'Active'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {driver.status === 'Active' ? 'Mark On Leave' : 'Set as Active'}
            </button>
            <button
              onClick={() => onEdit(driver)}
              className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
            >
              Edit Driver
            </button>
            <button
              onClick={() => {
                confirmAction({
                  title: 'Remove Delivery Driver',
                  message: 'Are you sure you want to remove this driver from the active delivery fleet?',
                  entityName: `${driver.name} (${driver.vehicleNo})`,
                  confirmLabel: 'Remove Driver',
                  type: 'danger',
                  onConfirm: () => {
                    deleteDriver(driver.id);
                    onClose();
                  }
                });
              }}
              className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
