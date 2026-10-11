import React, { useState, useMemo } from 'react';
import {
  Bell,
  Sprout,
  Building2,
  ShoppingCart,
  ClipboardList,
  ShoppingBag,
  CircleDollarSign,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useJoinerApp, type MobileOrder } from '../JoinerAppContext';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { MobileOrderDetailModal } from '../components/MobileOrderDetailModal';
import { getISTDateString } from '../../firebase/services/walletService';

type TodayFilter = 'All' | 'Pending' | 'Approved' | 'Processing' | 'Delivered' | 'Cancelled';

export const DashboardScreen: React.FC = () => {
  const {
    userProfile,
    commissionBalance,
    walletState,
    hotels,
    orders,
    setCurrentScreen,
    hasUnreadNotifications
  } = useJoinerApp();

  const [todayFilter, setTodayFilter] = useState<TodayFilter>('All');
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<MobileOrder | null>(null);

  const activeHotelsCount = hotels.filter(h => h.status === 'Active').length;
  const pendingHotelsCount = hotels.filter(h => h.status === 'Pending').length;

  // Filter orders strictly created today in Asia/Kolkata (IST) timezone
  const todayIST = useMemo(() => getISTDateString(), []);

  const todayOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDateIST = getISTDateString(o.createdAt || o.date);
      // Fallback for orders created locally today with string 'Today'
      const isDateToday = orderDateIST === todayIST || o.date === 'Today';
      return isDateToday;
    });
  }, [orders, todayIST]);

  // Today's summary statistics
  const todayStats = useMemo(() => {
    let totalValue = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let processingCount = 0;
    let deliveredCount = 0;

    todayOrders.forEach(o => {
      const amt = Number(o.totalAmount ?? o.amount ?? 0);
      totalValue += amt;

      const st = String(o.status || o.orderStatus || 'Pending').toLowerCase();
      if (st === 'delivered') deliveredCount++;
      else if (st === 'out for delivery' || st === 'preparing' || st === 'processing') processingCount++;
      else if (st === 'confirmed' || st === 'approved' || st === 'accepted') approvedCount++;
      else if (st === 'pending') pendingCount++;
    });

    // Commission earned today directly from credited wallet transactions dated today
    const commissionToday = walletState?.todayCommission ?? commissionBalance.todayCommission ?? 0;

    return {
      totalOrdersToday: todayOrders.length,
      totalOrderValueToday: totalValue,
      pendingToday: pendingCount,
      approvedToday: approvedCount,
      processingToday: processingCount,
      deliveredToday: deliveredCount,
      commissionToday
    };
  }, [todayOrders, walletState, commissionBalance]);

  // Filtered Today's Orders list
  const filteredTodayOrders = useMemo(() => {
    if (todayFilter === 'All') return todayOrders;

    return todayOrders.filter(o => {
      const st = String(o.status || o.orderStatus || 'Pending').toLowerCase();
      if (todayFilter === 'Pending') return st === 'pending';
      if (todayFilter === 'Approved') return st === 'confirmed' || st === 'approved' || st === 'accepted';
      if (todayFilter === 'Processing') return st === 'preparing' || st === 'processing' || st === 'out for delivery';
      if (todayFilter === 'Delivered') return st === 'delivered';
      if (todayFilter === 'Cancelled') return st === 'cancelled' || st === 'rejected';
      return true;
    });
  }, [todayOrders, todayFilter]);

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-between select-none">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Top Header: Profile + Notification */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => setCurrentScreen('PROFILE')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            title="Open My Profile"
          >
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-10 h-10 rounded-full object-cover border border-emerald-600 shadow-2xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                {userProfile.name}
              </h3>
              <p className="text-[10.5px] text-slate-500 font-medium">
                {userProfile.role} • {userProfile.zone}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentScreen('NOTIFICATIONS')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center relative text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotifications && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Fresh Account Welcome Card if 0 Hotels */}
        {hotels.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="space-y-1 max-w-[210px]">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sprout className="w-3 h-3 text-emerald-700" /> Fresh Account
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-snug">
                Welcome, {userProfile.name}!
              </h4>
              <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed">
                Register your first hotel partner to start placing vegetable orders & earning ₹100 commission.
              </p>
            </div>
            <button
              onClick={() => setCurrentScreen('ADD_HOTEL')}
              className="px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              + Add Hotel
            </button>
          </div>
        )}

        {/* Wallet & Commission Master Hero Card */}
        <div
          onClick={() => setCurrentScreen('COMMISSION')}
          className="bg-gradient-to-br from-[#15803d] via-[#16a34a] to-emerald-700 rounded-2xl p-4 text-white shadow-md cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10.5px] text-emerald-100 font-semibold uppercase tracking-wider">
                  Available Wallet Balance
                </p>
                <h2 className="text-2xl font-black tracking-tight leading-none mt-0.5">
                  ₹{(walletState?.walletBalance ?? commissionBalance.paid ?? 0).toLocaleString('en-IN')}
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full font-extrabold inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> My Wallet
              </span>
            </div>
          </div>

          {/* Sub Stats: Today's Commission & Monthly Commission */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/20 text-xs">
            <div className="bg-black/10 rounded-xl p-2 backdrop-blur-2xs">
              <p className="text-[10px] text-emerald-100 font-medium">Today's Commission</p>
              <p className="text-base font-black mt-0.5 text-white">
                ₹{(walletState?.todayCommission ?? commissionBalance.todayCommission ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-black/10 rounded-xl p-2 backdrop-blur-2xs">
              <p className="text-[10px] text-emerald-100 font-medium">Monthly Commission</p>
              <p className="text-base font-black mt-0.5 text-white">
                ₹{(walletState?.monthlyCommission ?? commissionBalance.thisMonth ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Hotels Card */}
          <div
            onClick={() => setCurrentScreen('MY_HOTELS')}
            className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-3.5 rounded-2xl text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs text-white flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-white bg-white/20 px-2 py-0.5 rounded-full">
                HOTELS
              </span>
            </div>
            <h4 className="text-xl font-black text-white leading-none">
              {hotels.length}
            </h4>
            <p className="text-[10.5px] font-semibold text-blue-100 mt-1">My Hotels</p>
          </div>

          {/* Total Orders History Card */}
          <div
            onClick={() => setCurrentScreen('MY_ORDERS')}
            className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-3.5 rounded-2xl text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs text-white flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-white bg-white/20 px-2 py-0.5 rounded-full">
                ALL TIME
              </span>
            </div>
            <h4 className="text-xl font-black text-white leading-none">
              {orders.length}
            </h4>
            <p className="text-[10.5px] font-semibold text-purple-100 mt-1">Order History</p>
          </div>

          {/* Active Hotels */}
          <div
            onClick={() => setCurrentScreen('MY_HOTELS')}
            className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-3.5 rounded-2xl text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs text-white flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-white bg-white/20 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>
            <h4 className="text-xl font-black text-white leading-none">
              {activeHotelsCount}
            </h4>
            <p className="text-[10.5px] font-semibold text-emerald-100 mt-1">Active Hotels</p>
          </div>

          {/* Pending Hotels */}
          <div
            onClick={() => setCurrentScreen('MY_HOTELS')}
            className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-3.5 rounded-2xl text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs text-white flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-white bg-white/20 px-2 py-0.5 rounded-full">
                PENDING
              </span>
            </div>
            <h4 className="text-xl font-black text-white leading-none">
              {pendingHotelsCount}
            </h4>
            <p className="text-[10.5px] font-semibold text-amber-100 mt-1">Pending Approval</p>
          </div>
        </div>

        {/* 6 Quick Action Grid */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setCurrentScreen('MY_HOTELS')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">My Hotels</span>
          </button>

          <button
            onClick={() => setCurrentScreen('PLACE_ORDER')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Place Order</span>
          </button>

          <button
            onClick={() => setCurrentScreen('MY_ORDERS')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Order History</span>
          </button>

          <button
            onClick={() => setCurrentScreen('PLACE_ORDER')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Products</span>
          </button>

          <button
            onClick={() => setCurrentScreen('COMMISSION')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CircleDollarSign className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">My Wallet</span>
          </button>

          <button
            onClick={() => setCurrentScreen('PROFILE')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">My Profile</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* MANDATORY FEATURE: TODAY'S ORDERS DEDICATED SECTION      */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3.5">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#15803d] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Today's Orders</h3>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Asia/Kolkata (IST) • Midnight to Midnight
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentScreen('MY_ORDERS')}
              className="text-[11px] font-bold text-[#15803d] hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
            >
              Order History <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 7 Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* 1. Total Orders Today */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Orders</p>
              <p className="text-lg font-black text-slate-900 mt-0.5 leading-none">
                {todayStats.totalOrdersToday}
              </p>
              <p className="text-[9.5px] text-slate-400 mt-1">Today</p>
            </div>

            {/* 2. Total Order Value Today */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Total Order Value</p>
              <p className="text-lg font-black text-emerald-700 mt-0.5 leading-none">
                ₹{todayStats.totalOrderValueToday.toLocaleString('en-IN')}
              </p>
              <p className="text-[9.5px] text-emerald-600 mt-1">Today's sales</p>
            </div>

            {/* 3. Pending Orders Today */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Pending</p>
              <p className="text-lg font-black text-amber-700 mt-0.5 leading-none">
                {todayStats.pendingToday}
              </p>
              <p className="text-[9.5px] text-amber-600 mt-1">Awaiting approval</p>
            </div>

            {/* 4. Approved Orders Today */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Approved</p>
              <p className="text-lg font-black text-blue-700 mt-0.5 leading-none">
                {todayStats.approvedToday}
              </p>
              <p className="text-[9.5px] text-blue-600 mt-1">Admin accepted</p>
            </div>

            {/* 5. Processing Orders Today */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">Processing</p>
              <p className="text-lg font-black text-indigo-700 mt-0.5 leading-none">
                {todayStats.processingToday}
              </p>
              <p className="text-[9.5px] text-indigo-600 mt-1">Packing / transit</p>
            </div>

            {/* 6. Delivered Orders Today */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">Delivered</p>
              <p className="text-lg font-black text-teal-700 mt-0.5 leading-none">
                {todayStats.deliveredToday}
              </p>
              <p className="text-[9.5px] text-teal-600 mt-1">Delivered to hotels</p>
            </div>

            {/* 7. Commission Earned Today */}
            <div className="col-span-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl p-2.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wide">Commission Earned Today</p>
                <p className="text-xl font-black mt-0.5 leading-none">
                  ₹{todayStats.commissionToday.toLocaleString('en-IN')}
                </p>
                <p className="text-[9.5px] text-emerald-100 mt-1">Credited to wallet today</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {(['All', 'Pending', 'Approved', 'Processing', 'Delivered', 'Cancelled'] as TodayFilter[]).map(filter => (
              <button
                key={filter}
                onClick={() => setTodayFilter(filter)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                  todayFilter === filter
                    ? 'bg-[#15803d] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Today's Orders List */}
          <div className="space-y-2">
            {filteredTodayOrders.length > 0 ? (
              filteredTodayOrders.map(order => {
                const totalAmt = Number(order.totalAmount ?? order.amount ?? 0);
                const isBonusEligible = totalAmt > 1500;
                const commStatus = (order as any).commissionStatus;
                const isCommissionCredited = commStatus === 'credited' || (order as any).walletCredited;
                const rawStatus = String(order.status || order.orderStatus || 'Pending');

                // Items summary string
                const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
                const itemsSummary = Array.isArray(order.items) && order.items.length > 0
                  ? order.items.slice(0, 2).map((it: any) => `${it.productName || it.name} (${it.quantity || it.qty || 1}${it.unit || 'kg'})`).join(', ') + (itemsCount > 2 ? ` +${itemsCount - 2} more` : '')
                  : 'Produce items';

                return (
                  <div
                    key={order.id || order.orderId}
                    onClick={() => setSelectedDetailOrder(order)}
                    className="p-3 bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200 rounded-xl transition-all cursor-pointer group space-y-2"
                  >
                    {/* Top Row: Hotel Name & Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#15803d] flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-[#15803d] transition-colors">
                            {order.hotelName}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono">
                            #{order.orderId || order.id}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">
                          ₹{totalAmt.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[9.5px] text-slate-500">
                          {order.date}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Items preview */}
                    <div className="text-[11px] text-slate-600 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="truncate max-w-[230px] font-medium">{itemsSummary}</span>
                      <span className="text-[10px] font-bold text-slate-400">{itemsCount} items</span>
                    </div>

                    {/* Bottom Row: Status Badge & Commission Info */}
                    <div className="flex items-center justify-between pt-0.5 text-[10.5px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            rawStatus.toLowerCase() === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rawStatus.toLowerCase() === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : rawStatus.toLowerCase().includes('process') || rawStatus.toLowerCase().includes('out')
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rawStatus}
                        </span>

                        {(order as any).deliveryPartnerName && (
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Truck className="w-3 h-3 text-sky-600" />
                            {(order as any).deliveryPartnerName}
                          </span>
                        )}
                      </div>

                      {/* Commission badge */}
                      {isCommissionCredited ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> ₹100 Credited
                        </span>
                      ) : isBonusEligible ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          ₹100 Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                          ₹0 (≤ ₹1,500)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No orders received today.</p>
                <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto">
                  New orders created today by your registered hotels will automatically appear here.
                </p>
                <button
                  onClick={() => setCurrentScreen('PLACE_ORDER')}
                  className="mt-1 px-3 py-1.5 bg-[#15803d] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#166534] cursor-pointer"
                >
                  + Place an Order Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Promo Banner */}
        <div
          onClick={() => setCurrentScreen('ADD_HOTEL')}
          className="relative bg-gradient-to-r from-emerald-50 via-emerald-50/90 to-teal-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer overflow-hidden shadow-2xs group hover:shadow-xs transition-all min-h-[76px]"
        >
          <div className="absolute right-0 top-0 bottom-0 w-44 pointer-events-none overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80"
              alt="Fresh Organic Vegetables"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-transparent"></div>
          </div>

          <div className="space-y-0.5 z-10 relative">
            <h4 className="text-xs font-black text-slate-900 leading-tight">
              Add More Hotels<br />Earn ₹100 Per Order &gt; ₹1,500
            </h4>
            <p className="text-[10px] text-emerald-800 font-bold">Grow with FarmerBox</p>
          </div>

          <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#15803d] z-10 group-hover:scale-110 group-hover:bg-[#15803d] group-hover:text-white transition-all flex-shrink-0 border border-emerald-200">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Complete Order Detail Modal on Tap */}
      <MobileOrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
