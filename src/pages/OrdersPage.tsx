import React, { useState, useMemo } from 'react';
import { useApp, deduplicateOrders } from '../context/AppContext';
import {
  FileText,
  CheckCircle2,
  Truck,
  Package,
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Phone,
  MapPin,
  Shield,
  Trash2,
  Sparkles,
  ShoppingBag,
  Bell,
  Check,
  X,
  Clock,
  IndianRupee,
  Smartphone,
  Filter,
  RefreshCw,
  Coins,
  AlertCircle,
  Leaf,
  Printer,
  CheckSquare,
  Square,
  Building2,
  User,
  ExternalLink
} from 'lucide-react';
import { AssignOrderModal } from '../components/Modals/AssignOrderModal';
import { ProduceItemInspectModal, type ProduceItemInspectionData } from '../components/Modals/ProduceItemInspectModal';
import { resolveProductImage } from '../utils/productImages';
import { calculateCommission } from '../utils/commission';
import type { OrderStatus, Order } from '../types';

export const OrdersPage: React.FC = () => {
  const {
    orders,
    zones,
    hotels,
    joiners,
    drivers,
    deleteOrder,
    confirmAction,
    updateOrderStatus,
    assignDriverToOrder,
    acceptOrder,
    approveDelivery,
    rejectDelivery,
    setSelectedOrder,
    setIsOrderDetailModalOpen,
    setActiveTab,
    newOrderAlert,
    dismissNewOrderAlert,
    simulateMultiMobileOrders
  } = useApp();

  const uniqueOrders = useMemo(() => deduplicateOrders(orders), [orders]);

  // Filters State
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('All');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>('All');
  const [selectedJoinerFilter, setSelectedJoinerFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Mobile' | 'Web'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Bulk Selection & Inspection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [inspectProduceData, setInspectProduceData] = useState<ProduceItemInspectionData | null>(null);
  const [verifiedItemIds, setVerifiedItemIds] = useState<Record<string, boolean>>({});

  // Pagination & Display State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalOrderId, setAssignModalOrderId] = useState<string | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Helper: Detect if order was placed via Mobile device / Joiner mobile app
  const isOrderFromMobile = (ord: Order): boolean => {
    const src = String(ord.orderSource || '').toLowerCase();
    const added = String(ord.addedBy || '').toLowerCase();
    const created = String(ord.createdBy || '').toLowerCase();
    return (
      src.includes('mobile') ||
      src.includes('joiner') ||
      src.includes('app') ||
      added.includes('mobile') ||
      added.includes('joiner') ||
      created.includes('joiner') ||
      Boolean(ord.clientOrderId) ||
      Boolean((ord as any).isMobile) ||
      Boolean((ord as any).deviceInfo)
    );
  };

  // Helper to resolve Partner Name
  const getJoinerNameForOrder = (ord: Order): string => {
    if (ord.partnerName && ord.partnerName !== 'Direct Partner' && ord.partnerName !== 'Admin') return ord.partnerName;
    if (ord.joiner && ord.joiner !== 'Direct Partner' && ord.joiner !== 'Admin' && ord.joiner !== '—') return ord.joiner;

    const matchedJoiner = joiners.find(j => 
      (ord.partnerId && String(j.id) === String(ord.partnerId)) ||
      (ord.joinerId && String(j.id) === String(ord.joinerId)) ||
      (ord.joinedBy && String(j.id) === String(ord.joinedBy))
    );
    if (matchedJoiner?.name) return matchedJoiner.name;

    return ord.joiner || 'Rahul Patil';
  };

  // Helper to resolve Customer / Hotel Name
  const getCustomerNameForOrder = (ord: Order): string => {
    return ord.customerName || ord.hotelName || 'Partner Hotel';
  };

  // Mobile Orders Count
  const mobileOrdersCount = useMemo(() => {
    return uniqueOrders.filter(o => isOrderFromMobile(o)).length;
  }, [uniqueOrders]);

  // Hotel Breakdown List
  const allHotelNames = useMemo(() => {
    const list = new Set<string>();
    hotels.forEach(h => { if (h.name) list.add(h.name); });
    uniqueOrders.forEach(o => {
      const hName = getCustomerNameForOrder(o);
      if (hName) list.add(hName);
    });
    return Array.from(list).sort();
  }, [hotels, uniqueOrders]);

  // Joiner Breakdown List
  const allJoinerNames = useMemo(() => {
    const list = new Set<string>();
    joiners.forEach(j => { if (j.name) list.add(j.name); });
    uniqueOrders.forEach(o => {
      const jName = getJoinerNameForOrder(o);
      if (jName) list.add(jName);
    });
    return Array.from(list).sort();
  }, [joiners, uniqueOrders]);

  // Zone Breakdown List
  const allZoneNames = useMemo(() => {
    const list = new Set<string>();
    zones.forEach(z => { if (z.name) list.add(z.name); });
    uniqueOrders.forEach(o => {
      const zName = o.zoneName || o.zone;
      if (zName) list.add(zName);
    });
    return Array.from(list).sort();
  }, [zones, uniqueOrders]);

  // Zone Metrics
  const zoneStats = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    uniqueOrders.forEach(o => {
      const zName = o.zoneName || o.zone || 'Kharadi';
      const existing = map.get(zName) || { count: 0, revenue: 0 };
      map.set(zName, {
        count: existing.count + 1,
        revenue: existing.revenue + (Number(o.amount || o.totalAmount) || 0)
      });
    });
    return map;
  }, [uniqueOrders]);

  // Metrics Bar
  const metrics = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const todayIso = new Date().toISOString().slice(0, 10);

    let todayOrdersCount = 0;
    let pendingCount = 0;
    let acceptedCount = 0;
    let outForDeliveryCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let todayRevenue = 0;
    let pendingCommission = 0;
    let releasedCommission = 0;

    uniqueOrders.forEach(o => {
      const isToday = o.date === 'Today' || o.date === todayStr || (o.createdAt && String(o.createdAt).includes(todayIso));
      const amount = Number(o.amount || o.totalAmount || o.subtotal || 0);
      const st = String(o.status || o.orderStatus || '').toLowerCase();

      if (isToday) {
        todayOrdersCount += 1;
        todayRevenue += amount;
      }

      if (st === 'pending') {
        pendingCount += 1;
      } else if (st === 'accepted' || st === 'confirmed' || st === 'preparing') {
        acceptedCount += 1;
      } else if (st === 'out for delivery') {
        outForDeliveryCount += 1;
      } else if (st === 'delivered') {
        deliveredCount += 1;
        if (o.adminApproved || o.commissionStatus === 'credited') {
          releasedCommission += Number(o.commissionAmount || 100);
        } else {
          pendingCommission += 100;
        }
      } else if (st === 'cancelled' || st === 'rejected') {
        cancelledCount += 1;
      }
    });

    return {
      todayOrdersCount,
      pendingCount,
      acceptedCount,
      outForDeliveryCount,
      deliveredCount,
      cancelledCount,
      todayRevenue,
      pendingCommission,
      releasedCommission
    };
  }, [uniqueOrders]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return uniqueOrders.filter(o => {
      // 1. Zone Filter
      if (selectedZoneFilter !== 'All') {
        const orderZone = (o.zoneName || o.zone || '').toLowerCase().replace(' zone', '');
        const targetZone = selectedZoneFilter.toLowerCase().replace(' zone', '');
        if (orderZone !== targetZone && !orderZone.includes(targetZone)) {
          return false;
        }
      }

      // 2. Source Filter (Mobile Device vs Web Admin)
      if (sourceFilter === 'Mobile' && !isOrderFromMobile(o)) return false;
      if (sourceFilter === 'Web' && isOrderFromMobile(o)) return false;

      // 3. Hotel Filter
      if (selectedHotelFilter !== 'All') {
        const orderHotel = getCustomerNameForOrder(o).toLowerCase();
        const targetHotel = selectedHotelFilter.toLowerCase();
        if (orderHotel !== targetHotel && !orderHotel.includes(targetHotel)) {
          return false;
        }
      }

      // 4. Joiner Filter
      if (selectedJoinerFilter !== 'All') {
        const orderJoiner = getJoinerNameForOrder(o).toLowerCase();
        const targetJoiner = selectedJoinerFilter.toLowerCase();
        if (orderJoiner !== targetJoiner && !orderJoiner.includes(targetJoiner)) {
          return false;
        }
      }

      // 5. Status Filter
      if (statusFilter !== 'All') {
        const st = String(o.status || o.orderStatus || '').toLowerCase();
        const targetSt = statusFilter.toLowerCase();
        if (targetSt === 'pending' && st !== 'pending') return false;
        if (targetSt === 'accepted' && st !== 'accepted' && st !== 'confirmed') return false;
        if (targetSt === 'preparing' && st !== 'preparing') return false;
        if (targetSt === 'out for delivery' && st !== 'out for delivery') return false;
        if (targetSt === 'delivered' && st !== 'delivered') return false;
        if (targetSt === 'cancelled' && st !== 'cancelled') return false;
        if (targetSt === 'rejected' && st !== 'rejected') return false;
      }

      // 6. Payment Filter
      if (paymentFilter !== 'All') {
        const mode = String(o.paymentMode || o.paymentMethod || '').toLowerCase();
        const payStatus = String(o.paymentStatus || '').toLowerCase();
        const targetPay = paymentFilter.toLowerCase();

        if (targetPay === 'cod' && mode !== 'cod') return false;
        if (targetPay === 'online' && mode !== 'online') return false;
        if (targetPay === 'wallet' && mode !== 'wallet') return false;
        if (targetPay === 'paid' && payStatus !== 'paid' && payStatus !== 'success') return false;
        if (targetPay === 'pending' && payStatus !== 'pending') return false;
        if (targetPay === 'failed' && payStatus !== 'failed' && payStatus !== 'refunded') return false;
      }

      // 7. Date Filter
      if (dateFilter !== 'All') {
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        if (dateFilter === 'Today') {
          if (o.date !== 'Today' && o.date !== todayStr) return false;
        } else if (dateFilter === 'Yesterday') {
          if (o.date !== yesterday && o.date !== 'Yesterday') return false;
        } else if (dateFilter === 'Custom' && customDate) {
          const ordDate = o.date;
          if (!ordDate.includes(customDate)) return false;
        }
      }

      // 8. Search Text Filter (Partner Name, Partner ID, Phone, Customer, Order ID)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const partnerName = getJoinerNameForOrder(o).toLowerCase();
        const partnerId = String(o.partnerId || o.joinerId || '').toLowerCase();
        const customerName = getCustomerNameForOrder(o).toLowerCase();
        const customerId = String(o.customerId || o.hotelId || '').toLowerCase();
        const orderId = String(o.orderId || o.id || '').toLowerCase();
        const phone = String(o.mobileNumber || o.hotelPhone || o.joinerPhone || '').toLowerCase();
        const driverName = String(o.driver || '').toLowerCase();
        const zoneName = String(o.zoneName || o.zone || '').toLowerCase();

        const matches = (
          orderId.includes(q) ||
          partnerName.includes(q) ||
          partnerId.includes(q) ||
          customerName.includes(q) ||
          customerId.includes(q) ||
          phone.includes(q) ||
          driverName.includes(q) ||
          zoneName.includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [uniqueOrders, selectedZoneFilter, sourceFilter, selectedHotelFilter, selectedJoinerFilter, statusFilter, paymentFilter, dateFilter, customDate, searchTerm]);

  // Pagination
  const totalOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalOrders);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const isAllExpanded = paginatedOrders.length > 0 && paginatedOrders.every(o => expandedOrderIds.includes(o.id));

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedOrderIds([]);
    } else {
      setExpandedOrderIds(paginatedOrders.map(o => o.id));
    }
  };

  const resetFilters = () => {
    setSelectedZoneFilter('All');
    setSourceFilter('All');
    setSelectedHotelFilter('All');
    setSelectedJoinerFilter('All');
    setStatusFilter('All');
    setPaymentFilter('All');
    setDateFilter('All');
    setCustomDate('');
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedOrderIds([]);
  };

  // Run Multi-Mobile Simulation
  const handleRunSimulation = async () => {
    try {
      setIsSimulating(true);
      const createdIds = await simulateMultiMobileOrders(5);
      setSimulationToast(`✅ 5 Mobile Device Orders created simultaneously across 5 zones! Order IDs: ${createdIds.slice(0, 2).join(', ')}...`);
      setTimeout(() => setSimulationToast(null), 6000);
    } catch (e: any) {
      alert(e?.message || 'Failed to simulate orders');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(paginatedOrders.map(o => o.orderId || o.id));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAccept = async () => {
    if (selectedOrderIds.length === 0) return;
    const pendingToAccept = orders.filter(o => selectedOrderIds.includes(o.orderId || o.id) && (o.status === 'Pending' || (o as any).orderStatus === 'pending'));
    if (pendingToAccept.length === 0) {
      alert('None of the selected orders are in Pending status.');
      return;
    }
    for (const ord of pendingToAccept) {
      await acceptOrder(ord.orderId || ord.id);
    }
    setSelectedOrderIds([]);
  };

  const handleBulkApproveDelivery = async () => {
    if (selectedOrderIds.length === 0) return;
    const deliveredToApprove = orders.filter(o => 
      selectedOrderIds.includes(o.orderId || o.id) && 
      (o.status === 'Delivered' || (o as any).orderStatus === 'delivered') && 
      !o.adminApproved
    );
    if (deliveredToApprove.length === 0) {
      alert('None of the selected orders are delivered and awaiting admin verification.');
      return;
    }
    for (const ord of deliveredToApprove) {
      await approveDelivery(ord.orderId || ord.id);
    }
    setSelectedOrderIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    confirmAction({
      title: 'Bulk Delete Orders',
      message: `Are you sure you want to permanently delete ${selectedOrderIds.length} selected orders from Firestore?`,
      entityName: `${selectedOrderIds.length} Orders`,
      confirmLabel: 'Delete Selected',
      type: 'danger',
      onConfirm: async () => {
        for (const id of selectedOrderIds) {
          await deleteOrder(id);
        }
        setSelectedOrderIds([]);
      }
    });
  };

  const handleToggleItemVerified = (itemKey: string) => {
    setVerifiedItemIds(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Source', 'Date', 'Time', 'Customer / Hotel', 'Partner Name', 'Zone', 'Grand Total', 'Payment Mode', 'Payment Status', 'Driver', 'Status', 'Admin Approved', 'Commission Status'];
    const rows = filteredOrders.map(o => [
      o.orderId || o.id,
      o.orderSource || 'mobile',
      o.date,
      o.time,
      `"${getCustomerNameForOrder(o)}"`,
      `"${getJoinerNameForOrder(o)}"`,
      o.zoneName || o.zone,
      o.amount,
      o.paymentMode,
      o.paymentStatus,
      `"${o.driver}"`,
      o.status,
      o.adminApproved ? 'Yes' : 'No',
      o.commissionStatus || 'pending'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FarmerBox_Central_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5 select-none">
      {/* 🔔 Real-Time Floating New Order Notification Banner */}
      {newOrderAlert?.visible && newOrderAlert.order && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-emerald-300 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-amber-300 animate-pulse">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-900 font-black text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  🔔 Real-Time Order Placed
                </span>
                <span className="font-mono font-bold text-xs bg-black/20 px-2 py-0.5 rounded">
                  {newOrderAlert.order.orderId || newOrderAlert.order.id}
                </span>
              </div>
              <p className="font-bold text-sm mt-0.5">
                {getCustomerNameForOrder(newOrderAlert.order)} • {newOrderAlert.order.zoneName || newOrderAlert.order.zone} Zone
              </p>
              <p className="text-xs text-emerald-100 font-medium">
                Partner: <strong className="text-white">{getJoinerNameForOrder(newOrderAlert.order)}</strong> • Grand Total: <strong className="text-amber-200">₹{newOrderAlert.order.amount}</strong> ({newOrderAlert.order.items?.length || 0} Items)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedOrder(newOrderAlert.order);
                setIsOrderDetailModalOpen(true);
                dismissNewOrderAlert();
              }}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              View Order Details
            </button>
            <button
              onClick={dismissNewOrderAlert}
              className="p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-xl cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Simulation Feedback Toast */}
      {simulationToast && (
        <div className="bg-purple-900 text-white px-4 py-3 rounded-xl shadow-lg border border-purple-400 flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-300" />
            <span>{simulationToast}</span>
          </div>
          <button onClick={() => setSimulationToast(null)} className="text-purple-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Orders Management</h1>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full border border-emerald-200">
              Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Manage hotels, joiners, orders and deliver fresh vegetables
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            title="Simulate 5 mobile devices placing orders simultaneously across zones"
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {isSimulating ? 'Placing Mobile Orders...' : '⚡ Test Mobile Orders'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* 9 Metrics Dashboard Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 truncate">Today's Orders</p>
          <h4 className="text-lg font-black text-slate-900 mt-0.5">{metrics.todayOrdersCount}</h4>
        </div>
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-800 truncate">Pending</p>
          <h4 className="text-lg font-black text-amber-900 mt-0.5">{metrics.pendingCount}</h4>
        </div>
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-800 truncate">Accepted</p>
          <h4 className="text-lg font-black text-blue-900 mt-0.5">{metrics.acceptedCount}</h4>
        </div>
        <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 shadow-2xs">
          <p className="text-[11px] font-bold text-sky-800 truncate">Out for Delivery</p>
          <h4 className="text-lg font-black text-sky-900 mt-0.5">{metrics.outForDeliveryCount}</h4>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-800 truncate">Delivered</p>
          <h4 className="text-lg font-black text-emerald-900 mt-0.5">{metrics.deliveredCount}</h4>
        </div>
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-800 truncate">Cancelled</p>
          <h4 className="text-lg font-black text-rose-900 mt-0.5">{metrics.cancelledCount}</h4>
        </div>
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-300 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-900 truncate">Today's Revenue</p>
          <h4 className="text-base font-black text-emerald-900 mt-0.5 font-mono">₹{metrics.todayRevenue.toLocaleString('en-IN')}</h4>
        </div>
        <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-300 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-900 truncate">Pending Comm.</p>
          <h4 className="text-base font-black text-amber-900 mt-0.5 font-mono">₹{metrics.pendingCommission.toLocaleString('en-IN')}</h4>
        </div>
        <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-300 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-900 truncate">Released Comm.</p>
          <h4 className="text-base font-black text-purple-900 mt-0.5 font-mono">₹{metrics.releasedCommission.toLocaleString('en-IN')}</h4>
        </div>
      </div>

      {/* Zone Quick-Selector Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Zone Dashboard & Real-Time Filter:
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Showing {filteredOrders.length} of {uniqueOrders.length} Total Orders
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedZoneFilter('All')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all cursor-pointer ${
              selectedZoneFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Zones ({uniqueOrders.length})
          </button>

          {allZoneNames.map(zName => {
            const zStat = zoneStats.get(zName) || { count: 0, revenue: 0 };
            const isSelected = selectedZoneFilter.toLowerCase().replace(' zone', '') === zName.toLowerCase().replace(' zone', '');

            return (
              <button
                key={zName}
                onClick={() => setSelectedZoneFilter(zName)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{zName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {zStat.count} • ₹{zStat.revenue.toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Filter & Search Toolbar (Allows Selecting Hotel, Joiner, Status, Payment, Date) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Order, Hotel, Joiner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-600"
            />
          </div>

          {/* Hotel Selector */}
          <div>
            <select
              value={selectedHotelFilter}
              onChange={(e) => {
                setSelectedHotelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-600 cursor-pointer text-slate-800"
            >
              <option value="All">All Hotels ({allHotelNames.length})</option>
              {allHotelNames.map(hName => (
                <option key={hName} value={hName}>{hName}</option>
              ))}
            </select>
          </div>

          {/* Joiner Selector */}
          <div>
            <select
              value={selectedJoinerFilter}
              onChange={(e) => {
                setSelectedJoinerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-600 cursor-pointer text-slate-800"
            >
              <option value="All">All Joiners ({allJoinerNames.length})</option>
              {allJoinerNames.map(jName => (
                <option key={jName} value={jName}>{jName}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-600 cursor-pointer text-slate-800"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Orders</option>
              <option value="Accepted">Accepted / Confirmed</option>
              <option value="Preparing">Preparing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-600 cursor-pointer text-slate-800"
            >
              <option value="All">All Payments</option>
              <option value="COD">COD (Cash on Delivery)</option>
              <option value="Online">Online Payment</option>
              <option value="Wallet">Wallet Payment</option>
              <option value="Paid">Payment Status: Paid</option>
              <option value="Pending">Payment Status: Pending</option>
              <option value="Failed">Payment Status: Failed</option>
            </select>
          </div>

          {/* Date Filter & Reset */}
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-emerald-600 cursor-pointer text-slate-800"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Custom">Custom Date</option>
            </select>
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Reset all filters"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Device Source Quick-Filter Buttons */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-purple-600" /> Device Source:
            </span>
            <button
              onClick={() => { setSourceFilter('All'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Sources ({uniqueOrders.length})
            </button>
            <button
              onClick={() => { setSourceFilter('Mobile'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sourceFilter === 'Mobile'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Mobile Device Orders</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                sourceFilter === 'Mobile' ? 'bg-white/30 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {mobileOrdersCount}
              </span>
            </button>
            <button
              onClick={() => { setSourceFilter('Web'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceFilter === 'Web'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              💻 Web Admin Orders ({uniqueOrders.length - mobileOrdersCount})
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Showing {filteredOrders.length} {sourceFilter === 'Mobile' ? 'Mobile Orders' : 'Orders'}
          </span>
        </div>

        {dateFilter === 'Custom' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Enter Date:</span>
            <input
              type="text"
              placeholder="e.g. 09 Oct 2026 or 2026-10-09"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="max-w-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        )}
      </div>

      {/* Bulk Selection Actions Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
              {selectedOrderIds.length}
            </span>
            <div>
              <p className="font-extrabold text-xs text-white">
                {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'Order' : 'Orders'} Selected
              </p>
              <p className="text-[10.5px] text-slate-400">Perform centralized bulk lifecycle actions</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkAccept}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Bulk Accept
            </button>
            <button
              onClick={handleBulkApproveDelivery}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Bulk Approve Delivery (+₹100)
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Export Manifest
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-900">Orders Roster</h3>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg">
              {filteredOrders.length} Orders
            </span>
          </div>

          <button
            onClick={toggleExpandAll}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            {isAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Empty State */}
        {paginatedOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="font-black text-slate-800 text-base">No Orders Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || selectedZoneFilter !== 'All' || statusFilter !== 'All'
                ? 'No orders match your current filters. Try resetting the filters.'
                : 'Orders placed from any mobile device or partner hotel in any zone will appear here instantly in real-time.'}
            </p>
            <button
              onClick={handleRunSimulation}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" /> Simulate 5 Mobile Device Orders
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-500 hover:text-slate-900 cursor-pointer"
                      title="Select all on this page"
                    >
                      {selectedOrderIds.length > 0 && selectedOrderIds.length === paginatedOrders.length ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Order ID & Date</th>
                  <th className="py-3 px-3">Customer / Hotel</th>
                  <th className="py-3 px-3">Partner & Zone</th>
                  <th className="py-3 px-3">Produce Items</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Delivery Driver</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Verification & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedOrders.map((ord) => {
                  const ordKey = ord.orderId || ord.id;
                  const isSelected = selectedOrderIds.includes(ordKey);
                  const partnerName = getJoinerNameForOrder(ord);
                  const customerName = getCustomerNameForOrder(ord);
                  const isDelivered = ord.status === 'Delivered';
                  const isPending = ord.status === 'Pending';
                  const isOutForDelivery = ord.status === 'Out for Delivery';
                  const isApproved = Boolean(ord.adminApproved);
                  const isExpanded = expandedOrderIds.includes(ord.id);
                  const itemsList = ord.items || [];

                  return (
                    <React.Fragment key={ord.id || ord.orderId}>
                      <tr className={`transition-colors ${isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'}`}>
                        {/* Checkbox */}
                        <td className="py-3 px-3 align-top text-center">
                          <button
                            onClick={() => handleToggleSelectOrder(ordKey)}
                            className="text-slate-400 hover:text-emerald-600 cursor-pointer mt-0.5"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* Order ID & Source */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-slate-900 text-xs">
                              {ord.orderId || ord.id}
                            </span>
                            {isOrderFromMobile(ord) ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSourceFilter('Mobile');
                                }}
                                className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-md font-black bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs cursor-pointer hover:bg-purple-200 transition-colors"
                                title="Placed via Mobile Device (Click to filter only mobile orders)"
                              >
                                <Smartphone className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                                <span>Mobile App</span>
                              </button>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Web Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                            {ord.date} • {ord.time}
                          </p>
                        </td>

                        {/* Customer / Hotel (Clickable to manage Hotel) */}
                        <td className="py-3 px-3 align-top">
                          <button
                            onClick={() => setActiveTab('Hotels')}
                            className="font-bold text-slate-900 text-xs hover:text-emerald-700 text-left flex items-center gap-1 cursor-pointer group"
                            title="Manage Hotel in Hotels Section"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                            <span>{customerName}</span>
                          </button>
                          {ord.mobileNumber && (
                            <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                              📞 {ord.mobileNumber}
                            </p>
                          )}
                        </td>

                        {/* Partner & Zone (Clickable to manage Joiner) */}
                        <td className="py-3 px-3 align-top">
                          <button
                            onClick={() => setActiveTab('Hotel Joiners')}
                            className="font-bold text-slate-800 hover:text-emerald-700 text-left flex items-center gap-1 text-xs cursor-pointer group"
                            title="Manage Joiner Partner"
                          >
                            <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                            <span>{partnerName}</span>
                          </button>
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {ord.zoneName || ord.zone || 'Kharadi'}
                          </span>
                        </td>

                        {/* Produce Items Summary */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">
                              {itemsList.length} {itemsList.length === 1 ? 'Item' : 'Items'}
                            </span>
                            <button
                              onClick={() => toggleExpandOrder(ord.id)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          </div>
                          <p className="text-[10.5px] text-slate-500 truncate max-w-[170px]">
                            {itemsList.map(i => i.productName || i.name).join(', ') || 'Produce goods'}
                          </p>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-3 align-top font-mono font-black text-slate-900 text-sm">
                          ₹{Number(ord.amount || ord.totalAmount || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Payment */}
                        <td className="py-3 px-3 align-top">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                            ord.paymentMode === 'COD'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {ord.paymentMode || 'Online'}
                          </span>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5 capitalize">
                            Status: {ord.paymentStatus || 'Pending'}
                          </p>
                        </td>

                        {/* Delivery Driver Column (Shows Driver Details or Unassigned status) */}
                        <td className="py-3 px-3 align-top">
                          {ord.driver && ord.driver !== 'Not Assigned' && ord.driver !== 'Unassigned' ? (
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => setActiveTab('Delivery Drivers')}
                                className="text-left group cursor-pointer"
                                title="Manage Delivery Driver"
                              >
                                <p className="font-bold text-slate-800 group-hover:text-emerald-700 text-xs flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                                  {ord.driver}
                                </p>
                                {ord.driverPhone && (
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">📞 {ord.driverPhone}</p>
                                )}
                              </button>
                              {!isDelivered && (
                                <button
                                  onClick={() => {
                                    setAssignModalOrderId(ord.id);
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline text-left cursor-pointer"
                                >
                                  Change Driver
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Order Status */}
                        <td className="py-3 px-3 align-top">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isOutForDelivery
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}>
                            {ord.status || 'Pending'}
                          </span>
                        </td>

                        {/* Verification & Actions Column */}
                        <td className="py-3 px-3 align-top text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* If Delivered: Admin Delivery Verification with exact slab commission */}
                            {isDelivered && (() => {
                              const totalAmt = Number(ord.totalAmount ?? ord.amount ?? 0);
                              const orderCommission = calculateCommission(totalAmt);
                              return isApproved ? (
                                <span className="font-black text-[10.5px] px-2 py-0.5 rounded-lg shadow-2xs inline-flex items-center gap-1 bg-emerald-600 text-white">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Delivery Approved (+₹{orderCommission} Paid)
                                </span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => approveDelivery(ord.id)}
                                    title={`Verify delivery and credit ₹${orderCommission} commission`}
                                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10.5px] rounded-lg shadow-xs cursor-pointer"
                                  >
                                    Approve Delivery (+₹{orderCommission})
                                  </button>
                                  <button
                                    onClick={() => rejectDelivery(ord.id)}
                                    title="Reject delivery"
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10.5px] rounded-lg border border-rose-200 cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              );
                            })()}

                            {/* If Pending: Accept Order and/or Assign Driver */}
                            {isPending && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => acceptOrder(ord.id)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10.5px] rounded-lg shadow-xs cursor-pointer"
                                >
                                  Accept Order
                                </button>
                                {(!ord.driver || ord.driver === 'Not Assigned' || ord.driver === 'Unassigned') && (
                                  <button
                                    onClick={() => {
                                      setAssignModalOrderId(ord.id);
                                      setIsAssignModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[10.5px] rounded-lg border border-purple-200 cursor-pointer"
                                  >
                                    Assign Driver
                                  </button>
                                )}
                              </div>
                            )}

                            {/* If Accepted but no driver assigned: Display single Assign Driver button */}
                            {(ord.status === 'Accepted' || ord.status === 'Confirmed' || ord.status === 'Preparing') &&
                              (!ord.driver || ord.driver === 'Not Assigned' || ord.driver === 'Unassigned') && (
                              <button
                                onClick={() => {
                                  setAssignModalOrderId(ord.id);
                                  setIsAssignModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10.5px] rounded-lg shadow-xs cursor-pointer"
                              >
                                Assign Driver
                              </button>
                            )}

                            {/* View Full Details Button */}
                            <button
                              onClick={() => {
                                setSelectedOrder(ord);
                                setIsOrderDetailModalOpen(true);
                              }}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Inspect Order
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Fresh Produce Items Preview with Item Inspection */}
                      {isExpanded && itemsList.length > 0 && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={10} className="py-2.5 px-6 border-b border-slate-100">
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                                  Fresh Produce Line Items ({itemsList.length}) • Click to Inspect Quality
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Check boxes to verify packing status
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {itemsList.map((item, iIdx) => {
                                  const pName = item.productName || item.name || `Item ${iIdx + 1}`;
                                  const pQty = Number(item.quantity || item.qty || 1);
                                  const pUnit = item.unit || 'kg';
                                  const pPrice = Number(item.price || 0);
                                  const pTotal = Number(item.total || (pQty * pPrice));
                                  const img = item.image || resolveProductImage(pName, 'Vegetables');
                                  const itemKey = `${ordKey}_${item.productId || item.id || iIdx}`;
                                  const isVerified = Boolean(verifiedItemIds[itemKey]);

                                  return (
                                    <div
                                      key={item.id || iIdx}
                                      className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                                        isVerified
                                          ? 'bg-emerald-50/70 border-emerald-200'
                                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <button
                                          onClick={() => handleToggleItemVerified(itemKey)}
                                          className="text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                                          title="Toggle Quality & Packing Verified"
                                        >
                                          {isVerified ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          ) : (
                                            <Square className="w-4 h-4 text-slate-300" />
                                          )}
                                        </button>

                                        <img
                                          src={img}
                                          alt={pName}
                                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                                        />

                                        <div className="min-w-0 flex-1">
                                          <p className="font-extrabold text-slate-800 text-[11.5px] truncate">
                                            {pName}
                                          </p>
                                          <p className="text-[10px] text-slate-500">
                                            {pQty} {pUnit} × ₹{pPrice} = <strong className="text-slate-900 font-mono">₹{pTotal}</strong>
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => setInspectProduceData({
                                          item: {
                                            ...item,
                                            inspected: isVerified
                                          },
                                          orderId: ordKey,
                                          customerName,
                                          partnerName,
                                          zoneName: ord.zoneName || ord.zone || 'Kharadi'
                                        })}
                                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold text-[10px] rounded-lg border border-emerald-200 shadow-2xs cursor-pointer shrink-0 flex items-center gap-1"
                                      >
                                        <Leaf className="w-3 h-3" /> Inspect
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{totalOrders > 0 ? startIndex + 1 : 0}</strong> to <strong className="text-slate-900">{endIndex}</strong> of <strong className="text-slate-900">{totalOrders}</strong> Orders
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800 px-2">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Produce Item Inspection Modal */}
      {inspectProduceData && (
        <ProduceItemInspectModal
          data={inspectProduceData}
          onClose={() => setInspectProduceData(null)}
          onToggleInspected={(productId) => {
            const key = `${inspectProduceData.orderId}_${productId}`;
            handleToggleItemVerified(key);
          }}
        />
      )}

      {/* Driver Assignment Modal */}
      {isAssignModalOpen && (
        <AssignOrderModal
          preSelectedOrderId={assignModalOrderId}
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setAssignModalOrderId(undefined);
          }}
        />
      )}
    </div>
  );
};
