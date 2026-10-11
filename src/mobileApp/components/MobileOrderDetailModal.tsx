import React from 'react';
import { X, Building2, Calendar, Clock, Truck, CheckCircle2, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import type { MobileOrder } from '../JoinerAppContext';
import { calculateCommission } from '../../utils/commission';

interface MobileOrderDetailModalProps {
  order: MobileOrder | null;
  onClose: () => void;
}

export const MobileOrderDetailModal: React.FC<MobileOrderDetailModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const totalAmt = Number(order.totalAmount ?? order.amount ?? 0);
  const commAmount = Number((order as any).commissionAmount || calculateCommission(totalAmt));
  const isEligible = commAmount > 0;
  const rawStatus = String(order.status || order.orderStatus || 'Pending');
  const isDelivered = rawStatus.toLowerCase() === 'delivered';

  const getStatusBadge = () => {
    switch (rawStatus.toLowerCase()) {
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Delivered</span>;
      case 'out for delivery':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">Out for Delivery</span>;
      case 'preparing':
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Processing</span>;
      case 'confirmed':
      case 'approved':
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Approved</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Admin Approval</span>;
    }
  };

  const getCommissionBadge = () => {
    const commStatus = (order as any).commissionStatus;
    const isCredited = commStatus === 'credited' || (order as any).walletCredited;

    if (isCredited) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold">₹{commAmount} Commission Credited</p>
            <p className="text-[10px] text-emerald-600">Successfully credited to your wallet based on order slab</p>
          </div>
        </div>
      );
    }

    if (!isEligible) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
          <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold">₹0 Commission</p>
            <p className="text-[10px] text-slate-500">Order amount ₹0 is not eligible for commission</p>
          </div>
        </div>
      );
    }

    if (isDelivered) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold">₹{commAmount} Commission Pending Verification</p>
            <p className="text-[10px] text-amber-600">Will be credited upon delivery approval</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold">Eligible for ₹{commAmount} Commission</p>
          <p className="text-[10px] text-blue-600">Order amount ₹{totalAmt.toLocaleString('en-IN')}. Credited upon delivery.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Order Details</h3>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">#{order.orderId || order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Hotel Info Card */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-slate-900 text-sm">{order.hotelName}</h4>
              <p className="text-slate-600 text-xs mt-0.5">{order.hotelZone || order.zone || 'Kharadi'}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {order.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {order.timeSlot || '8 AM - 10 AM'}
                </span>
              </div>
            </div>
          </div>

          {/* Commission Status Card */}
          {getCommissionBadge()}

          {/* Delivery Partner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivery Partner</p>
                <p className="font-extrabold text-slate-800 text-xs">
                  {(order as any).deliveryPartnerName || (order as any).driver || 'Not Assigned Yet'}
                </p>
              </div>
            </div>
            {(order as any).driverPhone && (
              <a
                href={`tel:${(order as any).driverPhone}`}
                className="px-2.5 py-1 bg-sky-600 text-white font-bold text-[11px] rounded-lg shadow-2xs hover:bg-sky-700"
              >
                Call Driver
              </a>
            )}
          </div>

          {/* Ordered Produce Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Ordered Items ({Array.isArray(order.items) ? order.items.length : 0})
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((it: any, idx: number) => {
                  const itemQty = Number(it.quantity || it.qty || 1);
                  const itemPrice = Number(it.price || 0);
                  const itemTotal = Number(it.total || itemQty * itemPrice);
                  const itemName = it.productName || it.name || `Item ${idx + 1}`;
                  const itemUnit = it.unit || 'kg';

                  return (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        {it.image && (
                          <img
                            src={it.image}
                            alt={itemName}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{itemName}</p>
                          <p className="text-[11px] text-slate-500">
                            {itemQty} {itemUnit} × ₹{itemPrice.toLocaleString('en-IN')}/{itemUnit}
                          </p>
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-xs">
                        ₹{itemTotal.toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">No item details available.</div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Subtotal</span>
              <span>₹{Number(order.subtotal || totalAmt).toLocaleString('en-IN')}</span>
            </div>
            {Number(order.deliveryCharge || 0) > 0 && (
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Delivery Charge</span>
                <span>₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
              <span>Total Amount</span>
              <span className="text-[#15803d]">₹{totalAmt.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Payment Mode</span>
              <span className="font-semibold text-slate-700">{order.paymentMode || 'Online'}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-white flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
