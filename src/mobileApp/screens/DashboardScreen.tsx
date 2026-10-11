import React, { useState, useMemo, useRef } from 'react';
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
  FileText,
  Zap,
  Sparkles,
  Plus,
  Flame,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Package,
  Activity,
  Award,
  ChevronLeft
} from 'lucide-react';
import {
  useJoinerApp,
  deduplicateMobileHotels,
  resolveProductImage,
  type MobileOrder,
  type MobileHotel
} from '../JoinerAppContext';
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
    products,
    setCurrentScreen,
    setSelectedHotel,
    hasUnreadNotifications
  } = useJoinerApp();

  const [todayFilter, setTodayFilter] = useState<TodayFilter>('All');
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<MobileOrder | null>(null);
  const [activeHeroCard, setActiveHeroCard] = useState<number>(0);

  // Scroller refs for smooth navigation
  const heroScrollerRef = useRef<HTMLDivElement>(null);
  const hotelsScrollerRef = useRef<HTMLDivElement>(null);
  const mandiScrollerRef = useRef<HTMLDivElement>(null);

  // Clean deduplicated hotels list
  const uniqueHotels = useMemo(() => deduplicateMobileHotels(hotels), [hotels]);
  const activeHotelsCount = uniqueHotels.filter(h => h.status === 'Active').length;
  const pendingHotelsCount = uniqueHotels.filter(h => h.status === 'Pending').length;

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
    let bonusEligibleCount = 0;

    todayOrders.forEach(o => {
      const amt = Number(o.totalAmount ?? o.amount ?? 0);
      totalValue += amt;
      if (amt > 1500) bonusEligibleCount++;

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
      bonusEligibleToday: bonusEligibleCount,
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

  // Curated list of top daily wholesale produce for Mandi side-scroller
  const mandiStaples = useMemo(() => {
    if (products && products.length > 0) {
      return products.slice(0, 10);
    }
    // High-quality fallback items if catalog still loading
    return [
      { id: 'm1', name: 'Fresh Red Tomato', category: 'Vegetables', price: 38, b2bPrice: 28, unit: '1 KG', image: '/products/tomato.jpg', stock: 450 },
      { id: 'm2', name: 'Nashik Red Onion', category: 'Vegetables', price: 32, b2bPrice: 24, unit: '1 KG', image: '/products/onion.jpg', stock: 520 },
      { id: 'm3', name: 'Agra Jyoti Potato', category: 'Vegetables', price: 28, b2bPrice: 20, unit: '1 KG', image: '/products/potato.jpg', stock: 610 },
      { id: 'm4', name: 'Farm Green Coriander', category: 'Herbs', price: 25, b2bPrice: 18, unit: 'Bunch', image: '/products/coriander.jpg', stock: 180 },
      { id: 'm5', name: 'Fresh Green Capsicum', category: 'Vegetables', price: 55, b2bPrice: 42, unit: '1 KG', image: '/products/capsicum.jpg', stock: 120 },
      { id: 'm6', name: 'Fresh Dairy Paneer', category: 'Dairy', price: 340, b2bPrice: 280, unit: '1 KG', image: '/products/paneer.jpg', stock: 85 }
    ];
  }, [products]);

  const handleQuickOrderForHotel = (hotel: MobileHotel) => {
    setSelectedHotel(hotel);
    setCurrentScreen('PLACE_ORDER');
  };

  const handleScrollHero = (index: number) => {
    setActiveHeroCard(index);
    if (heroScrollerRef.current) {
      const cardWidth = 310;
      heroScrollerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollHotels = (direction: 'left' | 'right') => {
    if (hotelsScrollerRef.current) {
      const scrollAmt = direction === 'left' ? -180 : 180;
      hotelsScrollerRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-between select-none">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ======================================================== */}
        {/* TOP HEADER: JOINER PROFILE + LIVE TICKER + NOTIFICATIONS */}
        {/* ======================================================== */}
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
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600 shadow-2xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-slate-900 text-sm leading-tight">
                  {userProfile.name}
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-emerald-600" /> PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {userProfile.zone || 'Kharadi Zone'} • {userProfile.role || 'Hotel Joiner'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xs:flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[9.5px] font-extrabold text-emerald-700">Mandi Live</span>
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
        </div>

        {/* Fresh Account Welcome Card if 0 Hotels */}
        {uniqueHotels.length === 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="space-y-1 max-w-[210px]">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sprout className="w-3 h-3 text-emerald-700" /> Partner Onboarding
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-snug">
                Welcome, {userProfile.name}!
              </h4>
              <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed">
                Register your first hotel partner to start placing vegetable orders & earning ₹100 commission per qualifying order.
              </p>
            </div>
            <button
              onClick={() => setCurrentScreen('ADD_HOTEL')}
              className="px-3 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              + Add Hotel
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ADVANCE SIDE SCROLLER 1: MULTI-CARD HERO VAULT & TARGETS */}
        {/* ======================================================== */}
        <div className="space-y-2">
          <div
            ref={heroScrollerRef}
            className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
          >
            {/* Slide 1: Smart Wallet Vault */}
            <div
              onClick={() => setCurrentScreen('COMMISSION')}
              className="w-[300px] shrink-0 snap-center bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#15803d] rounded-2xl p-4 text-white shadow-md cursor-pointer relative overflow-hidden group border border-emerald-500/20"
            >
              {/* Subtle background glow */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-400/10 blur-xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-emerald-300">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-200">
                      Smart Wallet Vault
                    </span>
                    <h2 className="text-2xl font-black tracking-tight leading-none text-white mt-0.5">
                      ₹{(walletState?.walletBalance ?? commissionBalance.paid ?? 0).toLocaleString('en-IN')}
                    </h2>
                  </div>
                </div>

                <span className="text-[9.5px] bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 text-amber-300" /> Instant
                </span>
              </div>

              {/* Sub Stats Row */}
              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/15 text-xs relative z-10">
                <div className="bg-black/20 rounded-xl p-2 backdrop-blur-xs">
                  <p className="text-[9.5px] text-emerald-200 font-medium">Today's Earnings</p>
                  <p className="text-sm font-black mt-0.5 text-white">
                    ₹{(walletState?.todayCommission ?? commissionBalance.todayCommission ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-2 backdrop-blur-xs">
                  <p className="text-[9.5px] text-emerald-200 font-medium">This Month</p>
                  <p className="text-sm font-black mt-0.5 text-white">
                    ₹{(walletState?.monthlyCommission ?? commissionBalance.thisMonth ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-emerald-200 font-semibold relative z-10">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-300" /> Auto-Settlement Active
                </span>
                <span className="font-bold underline text-white flex items-center gap-0.5">
                  Ledger <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Slide 2: Daily ₹100 Incentive & Target Progress */}
            <div
              onClick={() => setCurrentScreen('COMMISSION')}
              className="w-[300px] shrink-0 snap-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] rounded-2xl p-4 text-white shadow-md cursor-pointer relative overflow-hidden group border border-indigo-400/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-indigo-300">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-indigo-200">
                      Daily ₹100 Incentive Tracker
                    </span>
                    <h3 className="text-base font-black tracking-tight text-white mt-0.5">
                      {todayStats.bonusEligibleToday} Orders Qualified
                    </h3>
                  </div>
                </div>
                <span className="text-[9.5px] bg-indigo-300/20 text-indigo-200 border border-indigo-300/30 px-2 py-0.5 rounded-full font-bold">
                  Orders &gt; ₹1,500
                </span>
              </div>

              {/* Progress Bar towards 5 Orders Daily Target */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-indigo-200 font-semibold">
                  <span>Daily Target: 5 Orders</span>
                  <span className="font-bold text-white">
                    {Math.min(todayStats.bonusEligibleToday, 5)} / 5 Completed
                  </span>
                </div>
                <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((todayStats.bonusEligibleToday / 5) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-indigo-200 pt-2 border-t border-white/15">
                <span className="font-medium text-indigo-100">
                  Earned today: <strong className="text-emerald-300">₹{todayStats.commissionToday}</strong>
                </span>
                <span className="font-bold text-white underline flex items-center gap-0.5">
                  Commission Rules <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Slide 3: Farm-to-Hotel Morning Dispatch Hub */}
            <div
              onClick={() => setCurrentScreen('MY_ORDERS')}
              className="w-[300px] shrink-0 snap-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] rounded-2xl p-4 text-white shadow-md cursor-pointer relative overflow-hidden group border border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-teal-300">
                    <Truck className="w-4 h-4 text-teal-300" />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-teal-300">
                      Mandi Dispatch Route
                    </span>
                    <h3 className="text-base font-black tracking-tight text-white mt-0.5">
                      05:30 AM Morning Slot
                    </h3>
                  </div>
                </div>
                <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  99.4% On-Time
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                  <p className="text-[9px] text-slate-300 font-medium">Assigned Hub</p>
                  <p className="text-xs font-black text-white mt-0.5 truncate">Wagholi Central Mandi</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                  <p className="text-[9px] text-slate-300 font-medium">Delivery Fleet</p>
                  <p className="text-xs font-black text-emerald-400 mt-0.5">Temp-Controlled EV</p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-300 pt-2 border-t border-white/15">
                <span className="text-teal-200">Fresh Produce Guaranteed</span>
                <span className="font-bold text-white underline flex items-center gap-0.5">
                  Track Dispatches <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {[0, 1, 2].map(idx => (
              <button
                key={idx}
                onClick={() => handleScrollHero(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeHeroCard === idx ? 'w-5 bg-[#15803d]' : 'w-1.5 bg-slate-300'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* ADVANCE SIDE SCROLLER 2: PARTNER HOTELS CAROUSEL         */}
        {/* ======================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#15803d]" />
              <h3 className="font-black text-slate-900 text-xs tracking-tight">
                My Partner Hotels ({uniqueHotels.length})
              </h3>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-[#15803d] text-[9.5px] font-black rounded-full">
                {activeHotelsCount} Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('MY_HOTELS')}
                className="text-[11px] font-extrabold text-[#15803d] hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
              >
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Horizontal Snap Rail for Hotels */}
          <div
            ref={hotelsScrollerRef}
            className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
          >
            {/* Quick Add Hotel Card */}
            <div
              onClick={() => setCurrentScreen('ADD_HOTEL')}
              className="w-[150px] shrink-0 snap-start bg-emerald-50/70 hover:bg-emerald-100/60 border-2 border-dashed border-emerald-300 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform mb-2">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                + Onboard Hotel
              </h4>
              <p className="text-[9.5px] text-emerald-800 font-semibold mt-1">
                Register New Partner
              </p>
            </div>

            {/* Hotel Cards */}
            {uniqueHotels.map(hotel => {
              const isActive = hotel.status === 'Active';
              const hotelOrdersCount = orders.filter(o =>
                (o.hotelId && (String(o.hotelId) === String(hotel.id) || String(o.hotelId) === String(hotel.hotelId))) ||
                (o.hotelName && hotel.name && o.hotelName.trim().toLowerCase() === hotel.name.trim().toLowerCase())
              ).length;
              const displayOrdersCount = Math.max(hotel.orders || 0, hotelOrdersCount);

              return (
                <div
                  key={hotel.id}
                  onClick={() => handleQuickOrderForHotel(hotel)}
                  className={`w-[170px] shrink-0 snap-start bg-white rounded-2xl border transition-all cursor-pointer p-2.5 flex flex-col justify-between shadow-2xs group relative hover:shadow-md ${
                    isActive
                      ? 'border-slate-200/90 hover:border-emerald-500'
                      : 'border-slate-200/60 opacity-85'
                  }`}
                >
                  <div>
                    {/* Hotel Image with Status Indicator */}
                    <div className="relative w-full h-20 rounded-xl overflow-hidden mb-2 bg-slate-100 border border-slate-100">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                          !isActive ? 'grayscale-[40%]' : ''
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300';
                        }}
                      />
                      <span
                        className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-black shadow-xs ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {isActive ? '● Active' : 'Offline'}
                      </span>
                    </div>

                    {/* Hotel Name & Zone */}
                    <h4 className="font-black text-slate-900 text-xs leading-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {hotel.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                      {hotel.zone}
                    </p>
                  </div>

                  {/* Bottom Action: Orders count + Quick Order button */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9.5px] font-bold text-slate-500">
                      {displayOrdersCount} orders
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickOrderForHotel(hotel);
                      }}
                      className="px-2 py-1 bg-[#15803d] hover:bg-[#166534] text-white text-[10px] font-black rounded-lg flex items-center gap-0.5 shadow-2xs transition-colors"
                    >
                      <ShoppingCart className="w-2.5 h-2.5" /> Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* ADVANCE SIDE SCROLLER 3: LIVE MANDI WHOLESALE STAPLES    */}
        {/* ======================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-slate-900 text-xs tracking-tight">
                Live Mandi Wholesale Produce
              </h3>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-black rounded-full">
                05:00 AM IST
              </span>
            </div>

            <button
              onClick={() => setCurrentScreen('PLACE_ORDER')}
              className="text-[11px] font-extrabold text-[#15803d] hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
            >
              All Items <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Horizontal Snap Rail for Wholesale Produce */}
          <div
            ref={mandiScrollerRef}
            className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
          >
            {mandiStaples.map((prod, pIdx) => {
              const wholesalePrice = prod.b2bPrice || prod.price;
              const retailPrice = prod.price;
              const hasDiscount = retailPrice > wholesalePrice;
              const badgeLabel = pIdx === 0 ? 'Top Pick' : pIdx === 1 ? 'Best Price' : pIdx === 2 ? 'Grade A' : 'Fresh Daily';

              return (
                <div
                  key={prod.id}
                  onClick={() => setCurrentScreen('PLACE_ORDER')}
                  className="w-[145px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-col justify-between cursor-pointer group hover:border-emerald-500 hover:shadow-xs transition-all"
                >
                  <div>
                    {/* Produce Image */}
                    <div className="relative w-full h-20 rounded-xl overflow-hidden mb-2 bg-slate-100">
                      <img
                        src={resolveProductImage(prod.image, prod.name)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300';
                        }}
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-slate-900/80 backdrop-blur-xs text-white">
                        {badgeLabel}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-xs leading-tight line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Wholesale / {prod.unit || '1 KG'}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-emerald-700 leading-none">
                        ₹{wholesalePrice}
                      </p>
                      {hasDiscount && (
                        <p className="text-[9px] text-slate-400 line-through leading-none mt-0.5">
                          ₹{retailPrice}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentScreen('PLACE_ORDER');
                      }}
                      className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white flex items-center justify-center transition-colors"
                      title="Add to Hotel Order"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* ADVANCE SIDE SCROLLER 4: QUICK ACTION COMMAND PILLS      */}
        {/* ======================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => setCurrentScreen('MY_HOTELS')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs font-extrabold text-slate-700 flex items-center gap-1.5 whitespace-nowrap hover:bg-slate-50 hover:border-emerald-500 transition-all cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Hotels</span>
            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-full text-[9px] font-black">
              {uniqueHotels.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentScreen('PLACE_ORDER')}
            className="px-3.5 py-2 rounded-xl bg-[#15803d] text-white shadow-2xs font-extrabold flex items-center gap-1.5 whitespace-nowrap hover:bg-[#166534] transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
            <span>Place Order</span>
          </button>

          <button
            onClick={() => setCurrentScreen('MY_ORDERS')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs font-extrabold text-slate-700 flex items-center gap-1.5 whitespace-nowrap hover:bg-slate-50 hover:border-emerald-500 transition-all cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dispatches</span>
            <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black">
              {todayStats.totalOrdersToday}
            </span>
          </button>

          <button
            onClick={() => setCurrentScreen('COMMISSION')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs font-extrabold text-slate-700 flex items-center gap-1.5 whitespace-nowrap hover:bg-slate-50 hover:border-emerald-500 transition-all cursor-pointer"
          >
            <CircleDollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span>₹100 Wallet</span>
          </button>

          <button
            onClick={() => setCurrentScreen('PROFILE')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs font-extrabold text-slate-700 flex items-center gap-1.5 whitespace-nowrap hover:bg-slate-50 hover:border-emerald-500 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Profile</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* ADVANCE SIDE SCROLLER 5: ACTIVE DISPATCHES SHOWCASE      */}
        {/* ======================================================== */}
        {todayOrders.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="font-black text-slate-900 text-xs tracking-tight">
                  Active Dispatches Today ({todayOrders.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                Swipe to view dispatches
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1">
              {todayOrders.map(order => {
                const totalAmt = Number(order.totalAmount ?? order.amount ?? 0);
                const rawStatus = String(order.status || order.orderStatus || 'Pending');
                const isBonus = totalAmt > 1500;
                const itemsCount = Array.isArray(order.items) ? order.items.length : 0;

                return (
                  <div
                    key={order.id || order.orderId}
                    onClick={() => setSelectedDetailOrder(order)}
                    className="w-[260px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#15803d] flex items-center justify-center font-bold text-xs">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xs line-clamp-1">
                            {order.hotelName}
                          </h4>
                          <p className="text-[9.5px] text-slate-400 font-mono">
                            #{order.orderId || order.id}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs font-black text-slate-900">
                        ₹{totalAmt.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
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
                        ● {rawStatus}
                      </span>

                      {isBonus ? (
                        <span className="text-emerald-700 font-extrabold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-2.5 h-2.5" /> ₹100 Comm
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          {itemsCount} items
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                <p className="text-[10px] text-slate-500 font-medium">
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
              <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">Total Orders</p>
              <p className="text-lg font-black text-slate-900 mt-0.5 leading-none">
                {todayStats.totalOrdersToday}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">Today</p>
            </div>

            {/* 2. Total Order Value Today */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
              <p className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wide">Total Order Value</p>
              <p className="text-lg font-black text-emerald-700 mt-0.5 leading-none">
                ₹{todayStats.totalOrderValueToday.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] text-emerald-600 mt-1">Today's sales</p>
            </div>

            {/* 3. Pending Orders Today */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              <p className="text-[9.5px] font-bold text-amber-800 uppercase tracking-wide">Pending</p>
              <p className="text-lg font-black text-amber-700 mt-0.5 leading-none">
                {todayStats.pendingToday}
              </p>
              <p className="text-[9px] text-amber-600 mt-1">Awaiting approval</p>
            </div>

            {/* 4. Approved Orders Today */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
              <p className="text-[9.5px] font-bold text-blue-800 uppercase tracking-wide">Approved</p>
              <p className="text-lg font-black text-blue-700 mt-0.5 leading-none">
                {todayStats.approvedToday}
              </p>
              <p className="text-[9px] text-blue-600 mt-1">Admin accepted</p>
            </div>

            {/* 5. Processing Orders Today */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
              <p className="text-[9.5px] font-bold text-indigo-800 uppercase tracking-wide">Processing</p>
              <p className="text-lg font-black text-indigo-700 mt-0.5 leading-none">
                {todayStats.processingToday}
              </p>
              <p className="text-[9px] text-indigo-600 mt-1">Packing / transit</p>
            </div>

            {/* 6. Delivered Orders Today */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5">
              <p className="text-[9.5px] font-bold text-teal-800 uppercase tracking-wide">Delivered</p>
              <p className="text-lg font-black text-teal-700 mt-0.5 leading-none">
                {todayStats.deliveredToday}
              </p>
              <p className="text-[9px] text-teal-600 mt-1">Delivered to hotels</p>
            </div>

            {/* 7. Commission Earned Today */}
            <div className="col-span-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl p-2.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[9.5px] font-bold text-emerald-100 uppercase tracking-wide">Commission Earned Today</p>
                <p className="text-xl font-black mt-0.5 leading-none">
                  ₹{todayStats.commissionToday.toLocaleString('en-IN')}
                </p>
                <p className="text-[9px] text-emerald-100 mt-1">Credited to wallet today</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
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

        {/* ======================================================== */}
        {/* PROMO BANNER                                             */}
        {/* ======================================================== */}
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
