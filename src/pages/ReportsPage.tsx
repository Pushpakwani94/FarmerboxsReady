import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  IndianRupee,
  ShoppingBag,
  Building2,
  Users,
  CircleDollarSign,
  Wallet,
  TrendingUp,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { orders, hotels, joiners, products, zones, payments, setActiveTab: setMainTab } = useApp();
  const [activeTab, setActiveTab] = useState<
    'Sales Report' | 'Commission Report' | 'Orders Report' | 'Hotel Report' | 'Products Report' | 'Drivers Report' | 'Joiner Report' | 'Payment Report'
  >('Commission Report');

  // Search & Filter in Commission Report tab
  const [commissionSearch, setCommissionSearch] = useState('');
  const [commissionZoneFilter, setCommissionZoneFilter] = useState('All Zones');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('All Status');
  const [reportFormat, setReportFormat] = useState<'Sales Report' | 'Commission Report' | 'Orders Report' | 'Hotel Report'>('Commission Report');

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const totalOrders = orders.length;
  const totalHotels = hotels.length;
  const activeJoinersCount = joiners.filter(j => j.status === 'Active').length || joiners.length;

  // ---------------------------------------------------------------------------
  // 1. Dynamic Joiner Commission Analytics
  // ---------------------------------------------------------------------------
  const joinerCommissionData = useMemo(() => {
    return joiners.map((j: any, idx: number) => {
      const cleanName = (j.name || '').trim().toLowerCase();
      const cleanPhone = (j.mobile || j.phone || '').trim().replace(/\D/g, '');
      const cleanId = String(j.id || '').trim().toLowerCase();

      const jOrders = orders.filter(o => {
        const oJoiner = (o.joiner || (o as any).assignedJoiner || '').trim().toLowerCase();
        const oJoinerId = String((o as any).joinerId || (o as any).joinedBy || '').trim().toLowerCase();
        const oPhone = String((o as any).joinerPhone || (o as any).mobile || '').trim().replace(/\D/g, '');

        const nameMatch = Boolean(
          cleanName.length >= 2 && oJoiner.length >= 2 && (
            oJoiner === cleanName ||
            (cleanName.length >= 3 && oJoiner.includes(cleanName)) ||
            (oJoiner.length >= 3 && cleanName.includes(oJoiner))
          )
        );
        const phoneMatch = Boolean(
          cleanPhone.length >= 6 && (
            (oPhone.length >= 6 && (oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone))) ||
            (oJoinerId.length >= 6 && (oJoinerId.includes(cleanPhone) || cleanPhone.includes(oPhone)))
          )
        );
        const idMatch = Boolean(
          cleanId.length >= 1 && oJoinerId.length >= 1 && (
            oJoinerId === cleanId ||
            oJoiner === cleanId ||
            (cleanId.length >= 4 && oJoinerId.includes(cleanId))
          )
        );
        return nameMatch || phoneMatch || idMatch;
      });

      const completedOrders = jOrders.filter(o => o.status === 'Delivered' || (o.status as string) === 'Completed').length;
      const pendingOrders = jOrders.filter(o => o.status !== 'Delivered' && (o.status as string) !== 'Completed' && o.status !== 'Cancelled').length;
      const totalOrdersCount = jOrders.length > 0 ? jOrders.length : Number(j.totalOrders || 0);
      const deliveredCount = jOrders.length > 0 ? completedOrders : Number(j.completedOrders || j.deliveredOrders || 0);
      const commissionRate = 100;
      
      const liveEarnings = deliveredCount * commissionRate;
      const recordedEarnings = Number(j.totalEarnings ?? j.commission ?? j.accumulatedCommission ?? 0);
      const totalCommission = Math.max(recordedEarnings, liveEarnings);
      const paidAmount = Number(j.paidAmount || 0);
      const pendingAmount = Math.max(0, totalCommission - paidAmount);

      return {
        id: j.id || (idx + 1),
        name: j.name || 'Joiner',
        mobile: j.mobile || j.phone || '9876543210',
        zone: j.zone || 'Kharadi',
        totalOrders: totalOrdersCount,
        deliveredOrders: deliveredCount,
        pendingOrders: jOrders.length > 0 ? pendingOrders : Math.max(0, totalOrdersCount - deliveredCount),
        commissionRate,
        totalCommission,
        paidAmount,
        pendingAmount,
        status: pendingAmount <= 0 && (totalCommission > 0 || paidAmount > 0) ? 'Paid' : 'Pending',
        avatar: j.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      };
    });
  }, [joiners, orders]);

  const totalCommissionEarned = useMemo(() => {
    return joinerCommissionData.reduce((sum, j) => sum + j.totalCommission, 0);
  }, [joinerCommissionData]);

  const totalCommissionPaid = useMemo(() => {
    return joinerCommissionData.reduce((sum, j) => sum + j.paidAmount, 0);
  }, [joinerCommissionData]);

  const totalCommissionPending = useMemo(() => {
    return joinerCommissionData.reduce((sum, j) => sum + j.pendingAmount, 0);
  }, [joinerCommissionData]);

  const filteredCommissionData = useMemo(() => {
    return joinerCommissionData.filter(j => {
      const matchSearch =
        !commissionSearch ||
        j.name.toLowerCase().includes(commissionSearch.toLowerCase()) ||
        j.mobile.includes(commissionSearch) ||
        j.zone.toLowerCase().includes(commissionSearch.toLowerCase());
      const matchZone = commissionZoneFilter === 'All Zones' || j.zone === commissionZoneFilter;
      const matchStatus = commissionStatusFilter === 'All Status' || j.status === commissionStatusFilter;
      return matchSearch && matchZone && matchStatus;
    });
  }, [joinerCommissionData, commissionSearch, commissionZoneFilter, commissionStatusFilter]);

  const commissionPieData = useMemo(() => {
    return [
      { name: 'Paid Out', value: totalCommissionPaid, color: '#16a34a' },
      { name: 'Pending Balance', value: totalCommissionPending, color: '#f59e0b' }
    ].filter(item => item.value > 0);
  }, [totalCommissionPaid, totalCommissionPending]);

  const commissionBarChart = useMemo(() => {
    return joinerCommissionData.slice(0, 6).map(j => ({
      name: j.name.split(' ')[0] || j.name,
      earned: j.totalCommission,
      paid: j.paidAmount,
      pending: j.pendingAmount
    }));
  }, [joinerCommissionData]);

  // ---------------------------------------------------------------------------
  // 2. Sales & Orders Trend Analytics
  // ---------------------------------------------------------------------------
  const salesTrend = useMemo(() => {
    if (orders.length === 0) return [];
    const dateMap: Record<string, number> = {};
    orders.forEach(o => {
      const d = o.date || 'Today';
      dateMap[d] = (dateMap[d] || 0) + (Number(o.amount) || 0);
    });
    return Object.entries(dateMap).slice(-7).map(([date, sales]) => ({ date, sales }));
  }, [orders]);

  const pieOrdersStatus = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    const pending = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Preparing').length;
    const cancelled = orders.filter(o => o.status === 'Cancelled').length;
    const outForDelivery = orders.filter(o => o.status === 'Out for Delivery').length;
    return [
      { name: 'Delivered', value: delivered, color: '#16a34a' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Out for Delivery', value: outForDelivery, color: '#3b82f6' },
      { name: 'Cancelled', value: cancelled, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [orders]);

  const topProducts = useMemo(() => {
    if (orders.length > 0) {
      const prodMap: Record<string, number> = {};
      orders.forEach(o => {
        if (o.items && o.items.length > 0) {
          o.items.forEach(it => {
            prodMap[it.productName] = (prodMap[it.productName] || 0) + (Number(it.total) || (Number(it.price) * Number(it.qty)) || 0);
          });
        }
      });
      const entries = Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (entries.length > 0) {
        return entries.map(([name, sales]) => ({ name, sales: `₹${sales.toLocaleString('en-IN')}`, icon: '🥬' }));
      }
    }
    return products.slice(0, 5).map(p => ({
      name: p.name,
      sales: `₹${((Number(p.stock) || 10) * (Number(p.salePrice) || 30)).toLocaleString('en-IN')}`,
      icon: '🥬'
    }));
  }, [orders, products]);

  const topHotels = useMemo(() => {
    if (orders.length > 0) {
      const hotelCounts: Record<string, number> = {};
      orders.forEach(o => {
        hotelCounts[o.hotelName] = (hotelCounts[o.hotelName] || 0) + 1;
      });
      const sorted = Object.entries(hotelCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (sorted.length > 0) {
        return sorted.map(([name, count]) => ({
          name,
          count,
          code: (name || 'HP').slice(0, 2).toUpperCase()
        }));
      }
    }
    return hotels.slice(0, 5).map(h => ({
      name: h.name,
      count: h.totalOrders || 0,
      code: (h.name || 'HP').slice(0, 2).toUpperCase()
    }));
  }, [orders, hotels]);

  const ordersByZone = useMemo(() => {
    if (orders.length > 0) {
      const zoneMap: Record<string, number> = {};
      orders.forEach(o => {
        if (o.zone) zoneMap[o.zone] = (zoneMap[o.zone] || 0) + 1;
      });
      const entries = Object.entries(zoneMap).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0) {
        return entries.map(([name, count]) => ({ name, count }));
      }
    }
    return zones.map(z => ({ name: z.name, count: z.ordersThisMonth || 0 }));
  }, [orders, zones]);

  const recentReportData = useMemo(() => {
    if (orders.length > 0) {
      const dateGroups: Record<string, typeof orders> = {};
      orders.forEach(o => {
        const d = o.date || 'Today';
        if (!dateGroups[d]) dateGroups[d] = [];
        dateGroups[d].push(o);
      });
      return Object.entries(dateGroups).slice(-5).reverse().map(([date, groupOrders], idx) => {
        const rev = groupOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        const del = groupOrders.filter(o => o.status === 'Delivered').length;
        const pen = groupOrders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Preparing').length;
        const can = groupOrders.filter(o => o.status === 'Cancelled').length;
        return {
          id: idx + 1,
          date,
          totalOrders: groupOrders.length,
          rev: rev.toLocaleString('en-IN'),
          del,
          pen,
          can,
          top: groupOrders[0]?.hotelName || 'Fresh Vegetables'
        };
      });
    }
    return [];
  }, [orders]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (activeTab === 'Commission Report') {
      const headers = ['ID', 'Joiner Name', 'Phone', 'Zone', 'Total Orders', 'Delivered Orders', 'Rate', 'Total Commission', 'Paid Amount', 'Pending Amount', 'Status'];
      const rows = filteredCommissionData.map(j => [
        j.id,
        `"${j.name}"`,
        j.mobile,
        `"${j.zone}"`,
        j.totalOrders,
        j.deliveredOrders,
        `₹${j.commissionRate}`,
        `₹${j.totalCommission}`,
        `₹${j.paidAmount}`,
        `₹${j.pendingAmount}`,
        j.status
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `farmerbox_commission_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Date', 'Total Orders', 'Revenue', 'Delivered', 'Pending', 'Cancelled'];
      const rows = recentReportData.map(r => [
        r.date,
        r.totalOrders,
        r.rev,
        r.del,
        r.pen,
        r.can
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csv);
      link.download = `farmerbox_sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const distinctZones = useMemo(() => {
    return ['All Zones', ...Array.from(new Set(joiners.map(j => j.zone || 'Kharadi')))];
  }, [joiners]);

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      
      {/* Top Header Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-center">
        {/* Total Revenue */}
        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-0.5 truncate">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10.5px] text-emerald-700 font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live Gross Sales
            </p>
          </div>
        </div>

        {/* Joiner Commission Earned (HIGHLIGHT) */}
        <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Joiner Commission</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-0.5 truncate">
              ₹{totalCommissionEarned.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10.5px] text-amber-800 font-bold mt-1">
              ₹{totalCommissionPaid.toLocaleString('en-IN')} Paid • ₹{totalCommissionPending.toLocaleString('en-IN')} Due
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-0.5">{totalOrders}</h3>
            <p className="text-[10.5px] text-sky-700 font-bold mt-1">Hotel Deliveries</p>
          </div>
        </div>

        {/* Total Hotels */}
        <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Hotels</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-0.5">{totalHotels}</h3>
            <p className="text-[10.5px] text-indigo-700 font-bold mt-1">Commercial Kitchens</p>
          </div>
        </div>

        {/* Active Joiners */}
        <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-100 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Joiners</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-0.5">{activeJoinersCount}</h3>
            <p className="text-[10.5px] text-purple-700 font-bold mt-1">Field Partners</p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs for Reports Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
          {(
            [
              'Commission Report',
              'Sales Report',
              'Orders Report',
              'Hotel Report',
              'Products Report',
              'Drivers Report',
              'Joiner Report',
              'Payment Report'
            ] as const
          ).map(t => {
            const isSelected = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#16a34a] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t === 'Commission Report' && <CircleDollarSign className="w-3.5 h-3.5" />}
                {t === 'Sales Report' && <TrendingUp className="w-3.5 h-3.5" />}
                {t === 'Orders Report' && <ShoppingBag className="w-3.5 h-3.5" />}
                <span>{t}</span>
                {t === 'Commission Report' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    Live ₹
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export Report CSV
        </button>
      </div>

      {/* =========================================================================
          TAB 1: COMMISSION REPORT SECTION (MAIN FOCUS)
         ========================================================================= */}
      {activeTab === 'Commission Report' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Commission KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Commission Earned</span>
                <span className="p-2 rounded-xl bg-white/20 text-white"><CircleDollarSign className="w-4 h-4" /></span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">₹{totalCommissionEarned.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-emerald-100 font-medium">₹100 per delivered hotel order</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Paid Out</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-700">₹{totalCommissionPaid.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 font-medium">Settled via UPI / Bank transfer</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Joiner Payouts</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><Clock className="w-4 h-4" /></span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600">₹{totalCommissionPending.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 font-medium">Due in partner wallets</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Operations</span>
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-600"><Wallet className="w-4 h-4" /></span>
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                  Manage individual payouts, adjust rates, or view full joiner wallet histories.
                </p>
              </div>
              <button
                onClick={() => setMainTab('Joiner Commission')}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Open Joiner Commission Section</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Charts Row: Joiner Earnings Distribution & Payout Status Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Joiner Commission Bar Chart */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Joiner Commission Breakdown</h3>
                  <p className="text-xs text-slate-400">Total earned, paid, and pending balance per partner</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  Rate: ₹100 / Order
                </span>
              </div>

              <div className="h-60 w-full pt-3">
                {commissionBarChart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No commission transactions recorded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={commissionBarChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      />
                      <Bar dataKey="earned" name="Total Earned" fill="#16a34a" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="paid" name="Paid Out" fill="#0284c7" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="pending" name="Pending Balance" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Payout Status Donut */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Payout Status Ratio</h3>
                <p className="text-xs text-slate-400">Settled vs un-settled commission balances</p>
              </div>

              <div className="h-44 w-full relative flex items-center justify-center">
                {commissionPieData.length === 0 ? (
                  <p className="text-slate-400 text-xs">No payout records.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={commissionPieData}
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {commissionPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center pointer-events-none">
                      <p className="font-black text-slate-800 text-sm">
                        ₹{totalCommissionEarned.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">Total Pool</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-800 font-bold block">Paid Out</span>
                  <span className="font-extrabold text-emerald-700 text-sm">₹{totalCommissionPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-amber-800 font-bold block">Pending Due</span>
                  <span className="font-extrabold text-amber-700 text-sm">₹{totalCommissionPending.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Joiner Commission Detailed Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Joiner Commission Report Ledger</h3>
                <p className="text-xs text-slate-400">Live breakdown of orders delivered and payout status for each field joiner</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search joiner or phone..."
                    value={commissionSearch}
                    onChange={e => setCommissionSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <select
                  value={commissionZoneFilter}
                  onChange={e => setCommissionZoneFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {distinctZones.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>

                <select
                  value={commissionStatusFilter}
                  onChange={e => setCommissionStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="All Status">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-4">Joiner Partner</th>
                    <th className="py-3 px-4">Zone</th>
                    <th className="py-3 px-3 text-center">Total Orders</th>
                    <th className="py-3 px-3 text-center">Delivered (Eligible)</th>
                    <th className="py-3 px-3 text-right">Commission Rate</th>
                    <th className="py-3 px-4 text-right">Total Earned</th>
                    <th className="py-3 px-4 text-right">Paid Out</th>
                    <th className="py-3 px-4 text-right">Pending Balance</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCommissionData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No matching joiners found.
                      </td>
                    </tr>
                  ) : (
                    filteredCommissionData.map((j, idx) => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={j.avatar}
                              alt={j.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{j.name}</p>
                              <p className="text-[10.5px] text-slate-400">{j.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" /> {j.zone}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{j.totalOrders}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {j.deliveredOrders} orders
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-medium">₹{j.commissionRate}/order</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">₹{j.totalCommission.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{j.paidAmount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-black text-amber-600 text-sm">₹{j.pendingAmount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold inline-block ${
                              j.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setMainTab('Joiner Commission')}
                            className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold border border-emerald-200 cursor-pointer transition-colors"
                          >
                            Manage Payout
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SALES & OTHER REPORTS (Standard Overview)
         ========================================================================= */}
      {activeTab !== 'Commission Report' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Grid Row 1: Sales Overview (Line), Orders Status (Donut), Generate Report Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">Sales Overview</h3>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Daily Trend</span>
              </div>
              <div className="h-48 w-full flex items-center justify-center">
                {salesTrend.length === 0 ? (
                  <p className="text-slate-400 text-xs">No sales data recorded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val: any) => [`₹${val}`, 'Sales']} />
                      <Area type="monotone" dataKey="sales" stroke="#16a34a" fill="#dcfce7" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Orders Status</h3>
              <div className="h-48 w-full relative flex items-center justify-center">
                {pieOrdersStatus.length === 0 ? (
                  <p className="text-slate-400 text-xs">No order status data available.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieOrdersStatus} innerRadius={50} outerRadius={70} dataKey="value">
                          {pieOrdersStatus.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <p className="font-extrabold text-slate-800 text-sm">{totalOrders}</p>
                      <p className="text-[10px] text-slate-400">Total Orders</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">Generate Report</h3>
              <p className="text-xs text-slate-500">Export customized reports in CSV format</p>

              <select
                value={reportFormat}
                onChange={e => setReportFormat(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium"
              >
                <option value="Commission Report">Joiner Commission Report</option>
                <option value="Sales Report">Sales & Revenue Report</option>
                <option value="Orders Report">Orders Fulfillment Report</option>
                <option value="Hotel Report">Hotel Consumption Report</option>
              </select>

              <div className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 font-medium">
                📅 {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs mt-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Export CSV
              </button>
            </div>
          </div>

          {/* Grid Row 2: Top Products, Top Hotels, Orders by Zone, Quick Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Top Products by Sales</h4>
                <span className="text-[10px] text-slate-400">{topProducts.length} items</span>
              </div>
              <div className="space-y-2 text-xs">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                    <span className="flex items-center gap-2 font-medium"><span>{p.icon}</span>{p.name}</span>
                    <span className="font-bold text-slate-800">{p.sales}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Top Hotels by Orders</h4>
                <span className="text-[10px] text-slate-400">{topHotels.length} hotels</span>
              </div>
              <div className="space-y-2 text-xs">
                {topHotels.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">{h.code}</span>
                      {h.name}
                    </span>
                    <span className="font-bold text-slate-800">{h.count} orders</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Orders by Zone</h4>
                <span className="text-[10px] text-slate-400">{ordersByZone.length} zones</span>
              </div>
              <div className="space-y-2 text-xs">
                {ordersByZone.map((z, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-800">{z.name}</span>
                    <span className="font-bold text-purple-800">{z.count} orders</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-xs text-slate-800">Quick Reports</h4>
              <div className="space-y-1.5 text-xs">
                {[
                  { name: 'Joiner Commission Report', tab: 'Commission Report' },
                  { name: 'Sales & Revenue Report', tab: 'Sales Report' },
                  { name: 'Hotel Orders Report', tab: 'Hotel Report' },
                  { name: 'Product Wise Report', tab: 'Products Report' },
                  { name: 'Driver Performance Report', tab: 'Drivers Report' }
                ].map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveTab(r.tab as any)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer border border-slate-100 transition-colors font-medium text-slate-700"
                  >
                    <span>{r.name}</span>
                    <span className="text-slate-400">›</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Table: Recent Sales Ledger */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Recent Report Data (Sales)</h3>
              <span className="text-xs text-slate-500">{recentReportData.length} records</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Total Orders</th>
                    <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                    <th className="py-2.5 px-3 text-center">Delivered</th>
                    <th className="py-2.5 px-3 text-center">Pending</th>
                    <th className="py-2.5 px-3 text-center">Cancelled</th>
                    <th className="py-2.5 px-3">Top Client / Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentReportData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No report records available.
                      </td>
                    </tr>
                  ) : (
                    recentReportData.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500">{row.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{row.date}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">{row.totalOrders}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-800">₹{row.rev}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{row.del}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-600">{row.pen}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-600">{row.can}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{row.top}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
