import React from 'react';
import { X, ShoppingBag, MapPin, User, Truck, Calendar, IndianRupee, CheckCircle2, Shield, Trash2, Sparkles, Gift } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { OrderStatus } from '../../types';
import { resolveProductImage } from '../../utils/productImages';

export const OrderDetailModal: React.FC = () => {
  const { selectedOrder, setSelectedOrder, updateOrderStatus, assignDriverToOrder, drivers, isOrderDetailModalOpen, setIsOrderDetailModalOpen, deleteOrder, confirmAction } = useApp();

  if (!isOrderDetailModalOpen || !selectedOrder) return null;

  const statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const orderAmount = Number(selectedOrder.amount || 0);
  const isDelivered = selectedOrder.status === 'Delivered';

  const handleDelete = () => {
    confirmAction({
      title: 'Delete Order',
      message: `Are you sure you want to delete Order #${selectedOrder.id}?`,
      entityName: `Order #${selectedOrder.id} (${selectedOrder.hotelName})`,
      confirmLabel: 'Delete Order',
      type: 'danger',
      onConfirm: () => {
        deleteOrder(selectedOrder.id);
        setIsOrderDetailModalOpen(false);
        setSelectedOrder(null);
      }
    });
  };

  const handleApproveDelivery = () => {
    updateOrderStatus(selectedOrder.id, 'Delivered');
    setSelectedOrder({ 
      ...selectedOrder, 
      status: 'Delivered',
      orderStatus: 'Delivered',
      walletCredited: true,
      commission: 100
    });
  };

  const handleDriverChange = (driverName: string) => {
    const matched = drivers.find(d => d.name === driverName);
    assignDriverToOrder(selectedOrder.id, driverName, matched?.mobile, matched?.id, selectedOrder.status === 'Pending' ? 'Out for Delivery' : selectedOrder.status);
    setSelectedOrder({
      ...selectedOrder,
      driver: driverName,
      driverPhone: matched?.mobile || selectedOrder.driverPhone,
      status: selectedOrder.status === 'Pending' ? 'Out for Delivery' : selectedOrder.status
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800">Order #{selectedOrder.id}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isDelivered 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : selectedOrder.status === 'Out for Delivery'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">{selectedOrder.hotelName} • {selectedOrder.date}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOrderDetailModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Delivery Zone</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {selectedOrder.zone}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Hotel Joiner / Partner</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-sky-600" /> {selectedOrder.joiner || 'Hotel Partner'}
                {selectedOrder.addedBy === 'Admin' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold ml-1">
                    <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Delivery Driver</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Truck className="w-3.5 h-3.5 text-orange-600" /> {selectedOrder.driver || 'Not Assigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Order Value</span>
              <span className="font-bold text-emerald-700 text-sm flex items-center mt-0.5">
                ₹{orderAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Driver Assignment Dropdown */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-600" /> Assign / Change Delivery Driver:
            </label>
            <select
              value={selectedOrder.driver || ''}
              onChange={e => handleDriverChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-emerald-600 cursor-pointer text-xs"
            >
              <option value="" disabled>-- Select Driver --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name} • {d.zone} ({d.vehicleNo})
                </option>
              ))}
            </select>
          </div>

          {/* ₹100 Wallet Reward Policy Card */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            isDelivered 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                isDelivered ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-500 text-white shadow-xs'
              }`}>
                ₹100
              </div>
              <div>
                <h4 className="font-black text-xs">
                  {isDelivered ? '₹100 Wallet Reward Credited to Partner' : '₹100 Delivery Wallet Reward'}
                </h4>
                <p className="text-[10.5px] opacity-80 mt-0.5">
                  {isDelivered 
                    ? `Delivery marked Delivered. ₹100 credited to ${selectedOrder.joiner || 'Partner'}'s wallet account!` 
                    : `Upon driver delivery completion, ₹100 is credited instantly to ${selectedOrder.joiner || 'Partner'}'s wallet account.`}
                </p>
              </div>
            </div>

            {!isDelivered && (
              <button
                onClick={handleApproveDelivery}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-lg shadow-xs cursor-pointer whitespace-nowrap"
              >
                Mark Delivered (+₹100)
              </button>
            )}
          </div>

          {/* Order Produce Items Table */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Produce Items in Order</span>
              <span className="text-emerald-700 font-bold text-[11px]">
                Total: ₹{orderAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
              {((selectedOrder.items && selectedOrder.items.length > 0)
                ? selectedOrder.items
                : [
                    { id: 1, productName: 'Fresh Red Tomatoes (Grade A)', qty: 25, unit: 'KG', price: 40, total: 1000 },
                    { id: 2, productName: 'Farm Fresh Onions (Nashik)', qty: 30, unit: 'KG', price: 35, total: 1050 },
                    { id: 3, productName: 'Green Coriander & Herbs', qty: 15, unit: 'Bunch', price: 30, total: 450 }
                  ]
              ).map((item: any, idx: number) => {
                const pName = item.productName || item.name || item.title || `Item ${idx + 1}`;
                const pQty = Number(item.qty ?? item.quantity ?? 1);
                const pUnit = item.unit || 'KG';
                const pPrice = Number(item.price ?? 30);
                const pTotal = Number(item.total ?? (pQty * pPrice));
                const itemImg = item.image || resolveProductImage(pName, 'Vegetables');

                return (
                  <div key={item.id || idx} className="p-2 flex items-center justify-between bg-white text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <img
                        src={itemImg}
                        alt={pName}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate text-[11.5px]">{pName}</p>
                        <p className="text-[10px] text-slate-500">₹{pPrice}/{pUnit} • Qty: {pQty} {pUnit}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 font-mono text-xs">₹{pTotal.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold">Delivery Address:</span>
            <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              {selectedOrder.deliveryAddress || `${selectedOrder.hotelName}, ${selectedOrder.zone}, Pune`}
            </p>
          </div>

          {/* Status Workflow Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Update Order Workflow Status:</label>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map(st => (
                <button
                  key={st}
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, st);
                    setSelectedOrder({ ...selectedOrder, status: st });
                  }}
                  className={`py-2 px-2 rounded-lg font-semibold border transition-all text-[11px] cursor-pointer ${
                    selectedOrder.status === st
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-600" /> Delete Order
          </button>
          <button
            onClick={() => setIsOrderDetailModalOpen(false)}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
