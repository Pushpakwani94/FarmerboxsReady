import React, { useState } from 'react';
import { X, Package, CheckCircle2, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AssignOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedOrderId?: string;
}

export const AssignOrderModal: React.FC<AssignOrderModalProps> = ({ isOpen, onClose, preSelectedOrderId }) => {
  const { orders, drivers, assignDriverToOrder } = useApp();

  const dispatchableOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Preparing');
  const activeDrivers = drivers.filter(d => d.status === 'Active');

  const [selectedOrderId, setSelectedOrderId] = useState<string>(preSelectedOrderId || dispatchableOrders[0]?.id || orders[0]?.id || 'FB1004');
  const [selectedDriverName, setSelectedDriverName] = useState<string>(activeDrivers[0]?.name || 'Rohit Sharma');
  const [success, setSuccess] = useState(false);

  // Sync if preSelectedOrderId changes
  React.useEffect(() => {
    if (preSelectedOrderId) {
      setSelectedOrderId(preSelectedOrderId);
    }
  }, [preSelectedOrderId]);

  if (!isOpen) return null;

  const currentOrder = orders.find(o => String(o.id) === String(selectedOrderId));
  const currentDriver = drivers.find(d => d.name === selectedDriverName);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedDriverName) return;

    assignDriverToOrder(selectedOrderId, selectedDriverName, currentDriver?.mobile, currentDriver?.id, 'Out for Delivery');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Assign Order to Driver</h3>
              <p className="text-xs text-slate-500">Dispatch fresh produce order for delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
            <p className="mt-2 font-bold text-slate-800 text-sm">Order Dispatched Successfully!</p>
            <p className="text-xs text-slate-500">Order {selectedOrderId} assigned to {selectedDriverName} (Out for Delivery)</p>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Order to Dispatch</label>
              <select
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} - {o.hotelName} ({o.zone}) - ₹{o.amount} [{o.status}]
                  </option>
                ))}
              </select>
            </div>

            {currentOrder && (
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                  <span>{currentOrder.hotelName}</span>
                  <span className="text-emerald-700 font-black">₹{currentOrder.amount}</span>
                </div>
                <p className="text-[11px] text-slate-600">Destination: {currentOrder.zone}, Pune</p>
                <div className="flex items-center justify-between pt-1 border-t border-purple-200/60 text-[10.5px]">
                  <span className="text-slate-500">Partner: <strong>{currentOrder.joiner || 'Hotel Partner'}</strong></span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">₹100 Wallet Reward on Delivery</span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign to Active Driver</label>
              <select
                value={selectedDriverName}
                onChange={e => setSelectedDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                {activeDrivers.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} • {d.zone} ({d.vehicleNo})
                  </option>
                ))}
              </select>
            </div>

            {currentDriver && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                <img
                  src={currentDriver.avatar}
                  alt={currentDriver.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <p className="font-bold text-slate-800 text-xs">{currentDriver.name}</p>
                  <p className="text-[11px] text-slate-500">Operating in {currentDriver.zone} • Vehicle {currentDriver.vehicleNo}</p>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" /> Dispatch Order
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
