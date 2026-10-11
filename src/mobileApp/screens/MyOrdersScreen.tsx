import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Building2,
  Calendar,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useJoinerApp, deduplicateMobileOrders, type MobileOrder } from '../JoinerAppContext';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { MobileOrderDetailModal } from '../components/MobileOrderDetailModal';
import { getISTDateString, getISTMonthString } from '../../firebase/services/walletService';

type StatusFilter = 'All' | 'Pending' | 'Approved' | 'Processing' | 'Delivered' | 'Cancelled';
type DateFilter = 'All Time' | 'Today' | 'Yesterday' | 'This Month';

export const MyOrdersScreen: React.FC = () => {
  const {
    orders,
    hotels,
    setCurrentScreen,
    setSelectedOrderForReorder,
    setSelectedHotel
  } = useJoinerApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All Time');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>('All');
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<MobileOrder | null>(null);

  const uniqueOrders = useMemo(() => deduplicateMobileOrders(orders), [orders]);

  const todayIST = useMemo(() => getISTDateString(), []);
  const currentMonthIST = useMemo(() => getISTMonthString(), []);

  // Compute yesterday IST date string
  const yesterdayIST = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getISTDateString(d);
  }, []);

  // Filter orders by search, status, date, and hotel
  const filteredOrders = useMemo(() => {
    return uniqueOrders.filter(o => {
      // 1. Search Query filter (orderId, hotelName)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const oId = String(o.orderId || o.id || '').toLowerCase();
        const hName = String(o.hotelName || '').toLowerCase();
        if (!oId.includes(query) && !hName.includes(query)) {
          return false;
        }
      }

      // 2. Status filter
      const st = String(o.status || o.orderStatus || 'Pending').toLowerCase();
      if (statusFilter === 'Pending' && st !== 'pending') return false;
      if (statusFilter === 'Approved' && (st !== 'confirmed' && st !== 'approved' && st !== 'accepted')) return false;
      if (statusFilter === 'Processing' && (st !== 'preparing' && st !== 'processing' && st !== 'out for delivery')) return false;
      if (statusFilter === 'Delivered' && st !== 'delivered') return false;
      if (statusFilter === 'Cancelled' && (st !== 'cancelled' && st !== 'rejected')) return false;

      // 3. Date filter
      const oDateIST = getISTDateString(o.createdAt || o.date);
      const isDateToday = oDateIST === todayIST || o.date === 'Today';
      if (dateFilter === 'Today' && !isDateToday) return false;
      if (dateFilter === 'Yesterday' && oDateIST !== yesterdayIST) return false;
      if (dateFilter === 'This Month' && !oDateIST.startsWith(currentMonthIST)) return false;

      // 4. Hotel filter
      if (selectedHotelFilter !== 'All') {
        const hId = String(o.hotelId || '');
        const hName = String(o.hotelName || '');
        if (hId !== selectedHotelFilter && hName !== selectedHotelFilter) {
          return false;
        }
      }

      return true;
    });
  }, [uniqueOrders, searchQuery, statusFilter, dateFilter, selectedHotelFilter, todayIST, yesterdayIST, currentMonthIST]);

  const handleReorder = (order: MobileOrder) => {
    setSelectedOrderForReorder(order);
    if (order.hotelName) {
      const matched = hotels.find(
        h => h.name.toLowerCase() === order.hotelName.toLowerCase() || (order.hotelId && h.id === order.hotelId)
      );
      if (matched) {
        setSelectedHotel(matched);
      } else {
        setSelectedHotel({
          id: order.hotelId || `HT_${Date.now().toString().slice(-4)}`,
          name: order.hotelName,
          zone: order.hotelZone || 'Kharadi',
          status: 'Active',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100',
          orders: 1,
          contactPerson: 'Manager'
        });
      }
    }
    setCurrentScreen('REORDER');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-between select-none">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 no-scrollbar">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen('DASHBOARD')}
              className="p-1 -ml-1 text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">Permanent Order History</h2>
              <p className="text-[10px] text-slate-500 font-medium">All historical orders preserved permanently</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentScreen('PLACE_ORDER')}
            className="px-2.5 py-1.5 bg-[#15803d] text-white text-[11px] font-bold rounded-xl shadow-xs hover:bg-[#166534] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Order
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID or Hotel name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Row: Date Range & Hotel Dropdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-emerald-600 cursor-pointer shadow-2xs"
          >
            <option value="All Time">📅 All Dates</option>
            <option value="Today">☀️ Today</option>
            <option value="Yesterday">🌙 Yesterday</option>
            <option value="This Month">🗓️ This Month</option>
          </select>

          {/* Hotel Filter */}
          <select
            value={selectedHotelFilter}
            onChange={(e) => setSelectedHotelFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-emerald-600 cursor-pointer shadow-2xs truncate"
          >
            <option value="All">🏨 All Hotels</option>
            {hotels.map(h => (
              <option key={h.id} value={String(h.id)}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5 no-scrollbar">
          {(['All', 'Pending', 'Approved', 'Processing', 'Delivered', 'Cancelled'] as StatusFilter[]).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#15803d] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Order Cards List or Empty State */}
        <div className="space-y-2.5 pt-1">
          {orders.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3.5 bg-white rounded-2xl border border-dashed border-slate-300 shadow-2xs mt-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#15803d] flex items-center justify-center mx-auto shadow-xs">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  You haven't placed any orders yet. Place orders above ₹1,500 for hotel partners to earn ₹100 for every successfully delivered order.
                </p>
              </div>
              <button
                onClick={() => setCurrentScreen(hotels.length > 0 ? 'PLACE_ORDER' : 'ADD_HOTEL')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {hotels.length > 0 ? 'Place Order' : 'Add Hotel First'}
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-700">No orders found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const amt = Number(order.amount || order.totalAmount || 0);
              const isEligible = amt > 1500;
              const commStatus = (order as any).commissionStatus;
              const isCommissionCredited = commStatus === 'credited' || (order as any).walletCredited;
              const rawStatus = String(order.status || order.orderStatus || 'Pending');
              const isDelivered = rawStatus.toLowerCase() === 'delivered';

              return (
                <div
                  key={order.id || order.orderId}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 font-mono">
                      #{order.orderId || order.id}
                    </span>
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-md font-extrabold ${
                        isDelivered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rawStatus.toLowerCase() === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : rawStatus.toLowerCase().includes('process') || rawStatus.toLowerCase().includes('out')
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rawStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-xs text-slate-900">{order.hotelName}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {order.date} • Total: <strong className="text-slate-900">₹{amt.toLocaleString('en-IN')}</strong>
                    </p>
                  </div>

                  {/* ₹100 Wallet Bonus Indicator Badge */}
                  {isCommissionCredited ? (
                    <div className="p-2 rounded-xl text-[10px] font-bold flex items-center justify-between border bg-emerald-50 text-emerald-900 border-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>₹100 Wallet Commission Credited</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-black text-[9px] bg-emerald-600 text-white">
                        +₹100
                      </span>
                    </div>
                  ) : isEligible ? (
                    <div className="p-2 rounded-xl text-[10px] font-bold flex items-center justify-between border bg-blue-50 text-blue-900 border-blue-200">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>₹100 Bonus on Admin Delivery Approval</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-black text-[9px] bg-blue-600 text-white">
                        ELIGIBLE
                      </span>
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg text-[10px] font-semibold text-slate-500 bg-slate-100 flex items-center justify-between">
                      <span>Order ≤ ₹1,500</span>
                      <span className="text-[9px] font-bold text-slate-600">₹0 Commission</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setSelectedDetailOrder(order)}
                      className="px-3 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10.5px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Details
                    </button>
                    <button
                      onClick={() => handleReorder(order)}
                      className="px-3 py-1 bg-emerald-50 hover:bg-[#15803d] text-[#15803d] hover:text-white border border-emerald-200 font-bold rounded-lg text-[10.5px] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reorder
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <MobileOrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
