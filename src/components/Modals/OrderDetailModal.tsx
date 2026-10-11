import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  MapPin,
  User,
  Truck,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Shield,
  Trash2,
  Sparkles,
  Gift,
  Clock,
  Check,
  AlertCircle,
  Smartphone,
  CreditCard,
  Building2,
  Leaf,
  CheckSquare,
  Square,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { OrderStatus } from '../../types';
import { resolveProductImage } from '../../utils/productImages';
import { ProduceItemInspectModal, type ProduceItemInspectionData } from './ProduceItemInspectModal';

export const OrderDetailModal: React.FC = () => {
  const {
    selectedOrder,
    setSelectedOrder,
    updateOrderStatus,
    assignDriverToOrder,
    approveDelivery,
    rejectDelivery,
    drivers,
    isOrderDetailModalOpen,
    setIsOrderDetailModalOpen,
    deleteOrder,
    confirmAction,
    setActiveTab
  } = useApp();

  const [isApproving, setIsApproving] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [inspectProduceData, setInspectProduceData] = useState<ProduceItemInspectionData | null>(null);
  const [verifiedItemIds, setVerifiedItemIds] = useState<Record<string, boolean>>({});

  if (!isOrderDetailModalOpen || !selectedOrder) return null;

  const statuses: OrderStatus[] = ['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const grandTotal = Number(selectedOrder.grandTotal ?? selectedOrder.amount ?? selectedOrder.totalAmount ?? 0);
  const subtotal = Number(selectedOrder.subtotal ?? selectedOrder.amount ?? grandTotal);
  const deliveryCharge = Number(selectedOrder.deliveryCharge ?? 0);
  const discount = Number(selectedOrder.discount ?? 0);

  const isDelivered = selectedOrder.status === 'Delivered';
  const isApproved = Boolean(selectedOrder.adminApproved);
  const isCredited = selectedOrder.commissionStatus === 'credited' || Boolean(selectedOrder.walletCredited);

  const handleDelete = () => {
    confirmAction({
      title: 'Delete Order',
      message: `Are you sure you want to permanently delete Order #${selectedOrder.orderId || selectedOrder.id}?`,
      entityName: `Order #${selectedOrder.orderId || selectedOrder.id} (${selectedOrder.customerName || selectedOrder.hotelName})`,
      confirmLabel: 'Delete Order',
      type: 'danger',
      onConfirm: () => {
        deleteOrder(selectedOrder.orderId || selectedOrder.id);
        setIsOrderDetailModalOpen(false);
        setSelectedOrder(null);
      }
    });
  };

  const handleApproveDelivery = async () => {
    try {
      setIsApproving(true);
      const res = await approveDelivery(selectedOrder.orderId || selectedOrder.id);
      if (!res.success) {
        alert(res.message);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectDelivery = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    await rejectDelivery(selectedOrder.orderId || selectedOrder.id, rejectReason.trim());
    setShowRejectInput(false);
  };

  const handleDriverChange = (driverName: string) => {
    const matched = drivers.find(d => d.name === driverName);
    assignDriverToOrder(
      selectedOrder.orderId || selectedOrder.id,
      driverName,
      matched?.mobile,
      matched?.id,
      selectedOrder.status === 'Pending' ? 'Out for Delivery' : selectedOrder.status
    );
  };

  // Timeline Step calculation
  const getTimelineSteps = () => {
    const st = String(selectedOrder.status || selectedOrder.orderStatus || '').toLowerCase();
    const hasDriver = Boolean(selectedOrder.driver && selectedOrder.driver !== 'Not Assigned' && selectedOrder.driver !== 'Unassigned');

    return [
      { label: 'Order Created', done: true, time: selectedOrder.time || '10:00 AM' },
      { label: 'Admin Accepted', done: st !== 'pending' && st !== 'cancelled', time: 'In System' },
      { label: 'Delivery Partner Assigned', done: hasDriver || st === 'out for delivery' || st === 'delivered', time: selectedOrder.driver || 'Driver' },
      { label: 'Out for Delivery', done: st === 'out for delivery' || st === 'delivered', time: 'En Route' },
      { label: 'Delivered', done: st === 'delivered', time: selectedOrder.deliveredAt ? 'Delivered' : 'Pending Delivery' },
      { label: 'Admin Verified & Approved', done: isApproved, time: isApproved ? 'Verified' : 'Awaiting Approval' },
      { label: '₹100 Commission Credited', done: isCredited, time: isCredited ? 'Credited to Wallet' : 'Pending Release' }
    ];
  };

  const timelineSteps = getTimelineSteps();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-slate-900 font-mono">
                  {selectedOrder.orderId || selectedOrder.id}
                </h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                  isDelivered 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : selectedOrder.status === 'Out for Delivery'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {selectedOrder.status}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold uppercase">
                  {selectedOrder.orderSource || 'mobile'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedOrder.date} • {selectedOrder.time} ({selectedOrder.timeSlot || '8 AM - 10 AM'})
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOrderDetailModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Cards Overview Grid with Stakeholder Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setIsOrderDetailModalOpen(false);
              setActiveTab('Hotels');
            }}
            className="text-left bg-white p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer group"
            title="Open Hotel Management"
          >
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" /> Hotel
            </span>
            <span className="font-extrabold text-slate-900 text-xs block mt-0.5 truncate group-hover:text-emerald-700">
              {selectedOrder.customerName || selectedOrder.hotelName}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">ID: {selectedOrder.customerId || selectedOrder.hotelId || 'CUST_001'}</span>
          </button>

          <button
            onClick={() => {
              setIsOrderDetailModalOpen(false);
              setActiveTab('Hotel Joiners');
            }}
            className="text-left bg-white p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer group"
            title="Open Joiner Partner Management"
          >
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" /> Joiner Partner
            </span>
            <span className="font-extrabold text-slate-900 text-xs block mt-0.5 truncate group-hover:text-emerald-700">
              {selectedOrder.partnerName || selectedOrder.joiner}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">ID: {selectedOrder.partnerId || selectedOrder.joinerId || 'PARTNER_001'}</span>
          </button>

          <button
            onClick={() => {
              setIsOrderDetailModalOpen(false);
              setActiveTab('Zones');
            }}
            className="text-left bg-white p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer group"
            title="Open Zones Management"
          >
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" /> Zone Location
            </span>
            <span className="font-extrabold text-emerald-800 text-xs block mt-0.5 truncate group-hover:underline">
              {selectedOrder.zoneName || selectedOrder.zone || 'Kharadi'}
            </span>
            <span className="text-[10px] text-slate-500 block">ID: {selectedOrder.zoneId || 'ZONE_001'}</span>
          </button>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Grand Total</span>
            <span className="font-black text-emerald-700 text-sm block mt-0.5 font-mono">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">{selectedOrder.paymentMode} • {selectedOrder.paymentStatus}</span>
          </div>
        </div>

        {/* Delivery Verification & ₹100 Partner Commission Release */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isApproved && isCredited
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : isDelivered
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                ₹100
              </div>
              <div>
                <h4 className="font-black text-xs">
                  {isApproved
                    ? '✅ Delivery Verified & ₹100 Partner Commission Released'
                    : isDelivered
                    ? '⚠️ Delivery Marked — Admin Verification Required'
                    : 'Partner Commission Policy (₹100 upon Delivery Approval)'}
                </h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isApproved
                    ? `₹100 credited to ${selectedOrder.partnerName || selectedOrder.joiner}'s wallet (Transaction Status: credited).`
                    : isDelivered
                    ? `Driver marked as delivered. Click "Approve Delivery" to verify and release ₹100 to ${selectedOrder.partnerName || selectedOrder.joiner}'s wallet.`
                    : `After driver delivers order, Admin approves delivery to release ₹100 to ${selectedOrder.partnerName || selectedOrder.joiner}'s wallet.`}
                </p>
              </div>
            </div>

            {/* Verification Actions */}
            {isDelivered && !isApproved && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleApproveDelivery}
                  disabled={isApproving}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  {isApproving ? 'Approving...' : '✓ Approve Delivery (+₹100)'}
                </button>
                <button
                  onClick={() => setShowRejectInput(prev => !prev)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}
          </div>

          {/* Rejection input box */}
          {showRejectInput && (
            <div className="mt-3 pt-3 border-t border-amber-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Reason for delivery rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
              />
              <button
                onClick={handleRejectDelivery}
                className="px-3 py-1.5 bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          )}
        </div>

        {/* Order Lifecycle Timeline */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
            Order Lifecycle Timeline:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {timelineSteps.slice(0, 4).map((step, idx) => (
              <div key={idx} className={`p-2 rounded-xl border text-[11px] ${
                step.done ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-1">
                  {step.done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="truncate">{step.label}</span>
                </div>
                <p className="text-[10px] font-normal opacity-70 mt-0.5 truncate">{step.time}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {timelineSteps.slice(4).map((step, idx) => (
              <div key={idx} className={`p-2 rounded-xl border text-[11px] ${
                step.done ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-1">
                  {step.done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="truncate">{step.label}</span>
                </div>
                <p className="text-[10px] font-normal opacity-70 mt-0.5 truncate">{step.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Driver Selector */}
        <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-purple-600" /> Delivery Driver Assignment:
            </label>
            {selectedOrder.driverPhone && (
              <span className="text-purple-800 text-xs font-semibold font-mono">
                📞 {selectedOrder.driverPhone}
              </span>
            )}
          </div>
          <select
            value={selectedOrder.driver || ''}
            onChange={e => handleDriverChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:outline-emerald-600 cursor-pointer text-xs"
          >
            <option value="" disabled>-- Select Delivery Partner --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.name}>
                {d.name} • {d.zone} ({d.vehicleNo}) {d.mobile ? `— ${d.mobile}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Produce Line Items Table with Inspection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-600" /> Ordered Produce Items ({selectedOrder.items?.length || 0}) • Inspect Quality
            </span>
            <span className="text-emerald-800 font-black text-xs font-mono">
              Items Total: ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50 max-h-56 overflow-y-auto">
            {(selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : []).map((item, idx) => {
              const pName = item.productName || item.name || `Produce Item ${idx + 1}`;
              const pQty = Number(item.quantity || item.qty || 1);
              const pUnit = item.unit || 'kg';
              const pPrice = Number(item.price || 0);
              const pTotal = Number(item.total || (pQty * pPrice));
              const img = item.image || resolveProductImage(pName, 'Vegetables');
              const itemKey = `${selectedOrder.orderId || selectedOrder.id}_${item.productId || item.id || idx}`;
              const isVerified = Boolean(verifiedItemIds[itemKey]);

              return (
                <div key={item.id || idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50 text-xs transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => setVerifiedItemIds(prev => ({ ...prev, [itemKey]: !prev[itemKey] }))}
                      className="text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                      title="Verify Quality & Packing"
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <img src={img} alt={pName} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate text-xs">{pName}</p>
                      <p className="text-[10.5px] text-slate-500">₹{pPrice}/{pUnit} • Qty: <strong className="text-slate-800">{pQty} {pUnit}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <span className="font-mono font-black text-slate-900 text-xs">
                      ₹{pTotal.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => setInspectProduceData({
                        item: {
                          ...item,
                          inspected: isVerified
                        },
                        orderId: selectedOrder.orderId || selectedOrder.id,
                        customerName: selectedOrder.customerName || selectedOrder.hotelName || 'Customer',
                        partnerName: selectedOrder.partnerName || selectedOrder.joiner || 'Partner',
                        zoneName: selectedOrder.zoneName || selectedOrder.zone || 'Kharadi'
                      })}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#15803d] font-bold text-[10px] rounded-lg border border-emerald-200 cursor-pointer flex items-center gap-1"
                    >
                      <Leaf className="w-3 h-3" /> Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Charge</span>
            <span className="font-mono font-semibold">₹{deliveryCharge}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount</span>
              <span className="font-mono">-₹{discount}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-200">
            <span>Grand Total</span>
            <span className="font-mono text-emerald-800">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Update Order Status Selector */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 text-xs">Change Order Status:</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {statuses.map(st => (
              <button
                key={st}
                onClick={() => updateOrderStatus(selectedOrder.orderId || selectedOrder.id, st)}
                className={`py-1.5 px-1 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
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

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" /> Delete Order
          </button>
          <button
            onClick={() => setIsOrderDetailModalOpen(false)}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
          >
            Close Details
          </button>
        </div>

        {/* Produce Item Inspection Sub-Modal */}
        {inspectProduceData && (
          <ProduceItemInspectModal
            data={inspectProduceData}
            onClose={() => setInspectProduceData(null)}
            onToggleInspected={(productId) => {
              const key = `${selectedOrder.orderId || selectedOrder.id}_${productId}`;
              setVerifiedItemIds(prev => ({ ...prev, [key]: !prev[key] }));
            }}
          />
        )}
      </div>
    </div>
  );
};
