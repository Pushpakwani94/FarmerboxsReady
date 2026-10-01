import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  Gift,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useJoinerApp, getProductImageFallback } from '../JoinerAppContext';

export const CartScreen: React.FC = () => {
  const {
    cart,
    updateCartQty,
    clearCart,
    selectedHotel,
    selectedOrderForReorder,
    hotels,
    cartTotal,
    setCurrentScreen,
    addOrder
  } = useJoinerApp();

  const [deliveryDate, setDeliveryDate] = useState('Today (Morning)');
  const [timeSlot, setTimeSlot] = useState('6 AM - 8 AM');
  const [notes, setNotes] = useState('');

  const timeSlots = ['6 AM - 8 AM', '8 AM - 10 AM', '10 AM - 12 PM', '4 PM - 6 PM'];
  const currentHotel = selectedHotel || (hotels.length > 0 ? hotels[0] : null);

  const bonusThreshold = 1500;
  const isBonusQualified = cartTotal >= bonusThreshold;
  const amountNeededForBonus = Math.max(0, bonusThreshold - cartTotal);
  const bonusProgressPercent = Math.min(100, Math.round((cartTotal / bonusThreshold) * 100));

  const handlePlaceOrder = () => {
    if (!currentHotel) {
      alert('Please select or add a hotel partner first.');
      setCurrentScreen('ADD_HOTEL');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      addOrder({
        hotelId: currentHotel.id,
        hotelName: currentHotel.name,
        hotelZone: currentHotel.zone,
        date: deliveryDate,
        timeSlot: timeSlot,
        amount: cartTotal
      });

      setCurrentScreen('ORDER_SUCCESS');
    } catch (err: any) {
      alert(err?.message || 'Failed to place order. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-between select-none">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-6 no-scrollbar">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen(selectedOrderForReorder ? 'REORDER' : 'PLACE_ORDER')}
              className="p-1.5 -ml-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">My Order Cart</h2>
              <p className="text-[10px] text-slate-500 font-medium">Hotel Produce Order</p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              title="Clear Cart"
              className="p-1.5 text-rose-500 hover:text-rose-700 bg-white border border-slate-200 rounded-xl cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Hotel Banner */}
        {currentHotel ? (
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentHotel.image}
                alt={currentHotel.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-black text-slate-900 text-xs truncate">
                  {currentHotel.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {currentHotel.zone}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentScreen('MY_HOTELS')}
              className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between shadow-2xs">
            <span className="text-xs font-bold text-amber-800">No Hotel Selected</span>
            <button
              onClick={() => setCurrentScreen('ADD_HOTEL')}
              className="px-2.5 py-1 bg-[#15803d] text-white text-[10px] font-bold rounded-lg cursor-pointer"
            >
              + Add Hotel
            </button>
          </div>
        )}

        {/* ₹100 Wallet Reward Milestone Meter Card */}
        {cart.length > 0 && (
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isBonusQualified 
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/15 border-emerald-300 shadow-xs' 
              : 'bg-amber-50/80 border-amber-200 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{isBonusQualified ? '🎉' : '🎁'}</span>
                <span className={`text-xs font-black ${isBonusQualified ? 'text-emerald-950' : 'text-amber-950'}`}>
                  {isBonusQualified ? '₹100 Wallet Bonus Qualified!' : 'Unlock ₹100 Joiner Wallet Bonus'}
                </span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isBonusQualified ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-amber-200 text-amber-900'
              }`}>
                {isBonusQualified ? 'EARN ₹100' : `${bonusProgressPercent}%`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden my-2">
              <div
                style={{ width: `${bonusProgressPercent}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isBonusQualified ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
            </div>

            <p className={`text-[10.5px] font-medium leading-tight ${
              isBonusQualified ? 'text-emerald-900 font-semibold' : 'text-amber-900'
            }`}>
              {isBonusQualified ? (
                <>
                  ✅ Order is above ₹1,500! <strong>₹100 will be added to your Joiner Wallet</strong> once Delivery is Done & Approved by Admin.
                </>
              ) : (
                <>
                  Add <strong>₹{amountNeededForBonus}</strong> more to qualify for <strong>₹100 Wallet Cashback</strong> upon delivery approval!
                </>
              )}
            </p>
          </div>
        )}

        {/* Cart Item Rows */}
        {cart.length === 0 ? (
          <div className="py-10 text-center bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-600">Your Cart is Empty</p>
            <button
              onClick={() => setCurrentScreen('PLACE_ORDER')}
              className="px-4 py-2 bg-[#15803d] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-2">
          {cart.map(item => (
            <div
              key={item.product.id}
              className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getProductImageFallback(item.product.name, item.product.category);
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h5 className="font-extrabold text-slate-900 text-sm truncate">
                    {item.product.name}
                  </h5>
                  <p className="text-xs text-slate-700 font-extrabold mt-0.5">
                    ₹{item.product.price} <span className="text-slate-400 font-normal text-[11px]">/ {item.product.unit}</span>
                  </p>
                </div>
              </div>

              {/* Stepper + Subtotal */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <button
                    onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                    className="text-slate-600 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 min-w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                    className="text-slate-600 hover:text-emerald-700 p-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-extrabold text-xs text-slate-900 min-w-12 text-right">
                  ₹{item.product.price * item.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Delivery Preferences */}
        <div className="space-y-2.5 pt-1">
          {/* Delivery Date */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Delivery Date</p>
                <p className="text-xs font-bold text-slate-800">{deliveryDate}</p>
              </div>
            </div>
          </div>

          {/* Time Slot */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <p className="text-[10px] text-slate-400 font-medium">Preferred Time Slot</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {timeSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer ${
                    timeSlot === slot
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="block text-[10.5px] font-bold text-slate-700">
              Add Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Any special request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar: Total + Place Order */}
      <div className="bg-white border-t border-slate-200 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-600">Total Order Amount</span>
            {isBonusQualified && (
              <span className="block text-[10px] font-extrabold text-emerald-700">
                + ₹100 Wallet Bonus on Delivery Approval
              </span>
            )}
          </div>
          <span className="text-lg font-black text-slate-900">₹{cartTotal}</span>
        </div>

        <button
          onClick={handlePlaceOrder}
          className="w-full py-3 bg-[#15803d] hover:bg-[#166534] text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
        >
          {isBonusQualified ? 'Place Order (Earn ₹100 Wallet Bonus)' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};
