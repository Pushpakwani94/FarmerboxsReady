import React, { useState, useEffect } from 'react';
import { X, Truck, User, Phone, MapPin, CheckCircle2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Driver } from '../../types';

interface EditDriverModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditDriverModal: React.FC<EditDriverModalProps> = ({ driver, isOpen, onClose }) => {
  const { updateDriver, deleteDriver, zones, confirmAction } = useApp();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [zone, setZone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (driver) {
      setName(driver.name);
      setMobile(driver.mobile);
      setZone(driver.zone);
      setVehicleNo(driver.vehicleNo);
      setVehicleModel(driver.vehicleModel || 'Tata Ace Gold');
      setStatus(driver.status);
    }
  }, [driver]);

  if (!isOpen || !driver) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !vehicleNo.trim()) return;

    updateDriver(driver.id, {
      name: name.trim(),
      mobile: mobile.trim(),
      zone,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      vehicleModel,
      status
    });

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Edit Driver</h3>
              <p className="text-xs text-slate-500">Update {driver.name}'s profile & vehicle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
            <p className="mt-2 font-bold text-slate-800 text-sm">Driver Updated Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Driver Full Name *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Zone *</label>
                <select
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-600 font-medium"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.name}>{z.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Number *</label>
                <input
                  type="text"
                  required
                  value={vehicleNo}
                  onChange={e => setVehicleNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Model</label>
                <select
                  value={vehicleModel}
                  onChange={e => setVehicleModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-600"
                >
                  <option value="Tata Ace Gold">Tata Ace Gold (CNG)</option>
                  <option value="Mahindra Bolero Maxi Truck">Mahindra Bolero</option>
                  <option value="Piaggio Ape Extra">Piaggio Ape 3-Wheeler</option>
                  <option value="Tata Ace EV">Tata Ace EV</option>
                  <option value="Two-Wheeler Express">Two-Wheeler Express</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'Active' | 'On Leave' | 'Inactive')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
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
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
