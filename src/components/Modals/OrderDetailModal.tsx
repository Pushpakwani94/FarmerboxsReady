import React from 'react';
import { X, ShoppingBag, MapPin, User, Truck, Calendar, IndianRupee, CheckCircle2, Shield, Trash2, Sparkles, Gift } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { OrderStatus } from '../../types';

export const OrderDetailModal: React.FC = () => {
  const { selectedOrder, setSelectedOrder, updateOrderStatus, isOrderDetailModalOpen, setIsOrderDetailModalOpen, deleteOrder, confirmAction } = useApp();

  if (!isOrderDetailModalOpen || !selectedOrder) return null;

  const statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const orderAmount = Number(selectedOrder.amount || 0);
  const isBonusEligible = orderAmount >= 1500;
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
      commission: isBonusEligible ? 100 : selectedOrder.commission
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
                <h3 className="font-bold text-lg text-slate-800">Order {selectedOrder.id}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isDelivered 
                    ? 'bg-emerald-100 text-emerald-800' 
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
              <span className="text-slate-400 block text-[10px]">Hotel Joiner</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-sky-600" /> {selectedOrder.joiner}
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
                <Truck className="w-3.5 h-3.5 text-orange-600" /> {selectedOrder.driver}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Order Value</span>
              <span className="font-bold text-emerald-700 text-sm flex items-center mt-0.5">
                ₹{orderAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ₹100 Wallet Bonus Policy Card */}
          {isBonusEligible ? (
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              isDelivered 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  isDelivered ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  ₹100
                </div>
                <div>
                  <h4 className="font-black text-xs">
                    {isDelivered ? '₹100 Wallet Bonus Credited to Joiner' : 'Eligible for ₹100 Joiner Wallet Bonus'}
                  </h4>
                  <p className="text-[10.5px] opacity-80 mt-0.5">
                    {isDelivered 
                      ? `Delivery approved by Admin. ₹100 credited to ${selectedOrder.joiner}'s wallet.` 
                      : `Order above ₹1,500. ₹100 will be credited when marked 'Delivered'.`}
                  </p>
                </div>
              </div>

              {!isDelivered && (
                <button
                  onClick={handleApproveDelivery}
                  className="px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white font-extrabold text-[11px] rounded-lg shadow-xs cursor-pointer whitespace-nowrap"
                >
                  Approve Delivery
                </button>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-500">
              <span>Order Value under ₹1,500 (Standard Order)</span>
              <span className="font-semibold text-[11px]">No ₹100 Wallet Bonus</span>
            </div>
          )}

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
