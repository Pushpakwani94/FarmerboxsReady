import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Hourglass,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Plus,
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  X,
  Phone,
  MapPin,
  Check,
  Shield,
  Trash2,
  Sparkles
} from 'lucide-react';
import type { Order } from '../types';
import { AssignOrderModal } from '../components/Modals/AssignOrderModal';
import { resolveProductImage } from '../utils/productImages';

export const OrdersPage: React.FC = () => {
  const {
    orders,
    selectedOrder,
    setSelectedOrder,
    zones,
    joiners,
    drivers,
    hotels,
    products,
    setActiveTab,
    setSelectedHotel,
    isDatabaseConnected,
    addOrder,
    deleteOrder,
    confirmAction,
    updateOrderStatus,
    acceptOrder,
    assignDriverToOrder
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('All Hotels');
  const [selectedJoinerFilter, setSelectedJoinerFilter] = useState('All Joiners');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('All Drivers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [paymentFilter, setPaymentFilter] = useState('All Payments');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalOrderId, setAssignModalOrderId] = useState<string | undefined>(undefined);

  // New Order Form state
  const [newHotelName, setNewHotelName] = useState(hotels[0]?.name || 'Hotel Maharaja Executive');
  const [newPaymentMode, setNewPaymentMode] = useState<'Online' | 'COD'>('Online');
  const [newDriver, setNewDriver] = useState(drivers[0]?.name || 'Ramesh Pawar');
  const defaultItems = [
    { id: 1, productName: 'Fresh Potatoes (Jyoti Special)', qty: 40, unit: 'KG', price: 30, total: 1200 },
    { id: 2, productName: 'Crisp Green Capsicum', qty: 20, unit: 'KG', price: 60, total: 1200 },
    { id: 3, productName: 'Fresh Ginger & Garlic Paste Pack', qty: 10, unit: 'KG', price: 80, total: 800 }
  ];
  const [newOrderItems, setNewOrderItems] = useState(defaultItems);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState('');

  const filteredOrders = orders.filter(o => {
    const searchLower = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      (o.hotelName || '').toLowerCase().includes(searchLower) ||
      (o.id || '').toLowerCase().includes(searchLower) ||
      (o.orderId || '').toLowerCase().includes(searchLower) ||
      (o.joiner || '').toLowerCase().includes(searchLower) ||
      (o.driver || '').toLowerCase().includes(searchLower) ||
      (o.zone || '').toLowerCase().includes(searchLower);

    const cleanOrdZone = (o.zone || '').trim().toLowerCase().replace(' zone', '');
    const cleanFilterZone = selectedZone.trim().toLowerCase().replace(' zone', '');
    const matchesZone = selectedZone === 'All Zones' || cleanOrdZone === cleanFilterZone || cleanOrdZone.includes(cleanFilterZone) || cleanFilterZone.includes(cleanOrdZone);

    const matchesHotel = selectedHotelFilter === 'All Hotels' || (o.hotelName || '').trim().toLowerCase() === selectedHotelFilter.trim().toLowerCase();
    const matchesJoiner = selectedJoinerFilter === 'All Joiners' || (o.joiner || '').trim().toLowerCase() === selectedJoinerFilter.trim().toLowerCase();
    const matchesDriver = selectedDriverFilter === 'All Drivers' || (o.driver || '').trim().toLowerCase() === selectedDriverFilter.trim().toLowerCase();
    const matchesStatus = statusFilter === 'All Status' || (o.status || '').trim().toLowerCase() === statusFilter.trim().toLowerCase();

    const ordPayment = (o.paymentMode || '').toLowerCase();
    const filterPayment = paymentFilter.toLowerCase();
    const matchesPayment = paymentFilter === 'All Payments' || ordPayment.includes(filterPayment) || filterPayment.includes(ordPayment);

    return matchesSearch && matchesZone && matchesHotel && matchesJoiner && matchesDriver && matchesStatus && matchesPayment;
  });

  const totalFiltered = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const activeOrder: Order | null =
    selectedOrder && orders.some(o => String(o.id) === String(selectedOrder.id))
      ? selectedOrder
      : filteredOrders[0] || orders[0] || null;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(paginatedOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedOrderIds(prev => [...prev, id]);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedZone('All Zones');
    setSelectedHotelFilter('All Hotels');
    setSelectedJoinerFilter('All Joiners');
    setSelectedDriverFilter('All Drivers');
    setStatusFilter('All Status');
    setPaymentFilter('All Payments');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Time', 'Hotel Name', 'Zone', 'Joiner', 'Amount', 'Payment Mode', 'Driver', 'Status', 'Commission'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.date,
      o.time,
      `"${o.hotelName}"`,
      o.zone,
      `"${o.joiner}"`,
      o.amount,
      o.paymentMode,
      `"${o.driver}"`,
      o.status,
      o.commission
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FarmerBox_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadInvoice = () => {
    window.print();
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hotelObj = hotels.find(h => h.name.toLowerCase() === newHotelName.toLowerCase()) || hotels[0];
    const assignedDriverObj = drivers.find(d => d.name.toLowerCase() === newDriver.toLowerCase()) || drivers[0];
    const calculatedTotal = newOrderItems.reduce((sum, it) => sum + Number(it.qty * it.price), 0);
    const finalAmount = calculatedTotal > 0 ? calculatedTotal : 3200;

    const orderNum = 1000 + orders.length + 1;
    const orderId = `#FB${orderNum}`;

    const newOrderRecord: Order = {
      id: orderId,
      orderId: orderId,
      hotelId: hotelObj?.id || hotelObj?.hotelId || 'HT01',
      hotelName: newHotelName || (hotelObj ? hotelObj.name : 'Hotel Maharaja Executive'),
      hotelImage: hotelObj?.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
      zone: hotelObj?.zone || 'Kharadi',
      hotelZone: hotelObj?.zone || 'Kharadi',
      joiner: hotelObj?.joiner || 'Rahul Patil',
      joinerId: hotelObj?.joinerId || 'JN1001',
      amount: finalAmount,
      totalAmount: finalAmount,
      subtotal: finalAmount,
      deliveryCharge: 0,
      status: 'Pending',
      orderStatus: 'Pending',
      date: 'Today',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      timeSlot: '8 AM - 10 AM',
      paymentMode: newPaymentMode,
      paymentStatus: newPaymentMode === 'Online' ? 'Paid' : 'Pending',
      driver: newDriver || (assignedDriverObj ? assignedDriverObj.name : 'Ramesh Pawar'),
      driverPhone: assignedDriverObj?.mobile || '9876543210',
      commission: 100,
      deliveryAddress: hotelObj?.address || `${hotelObj?.zone || 'Kharadi'}, Pune`,
      items: newOrderItems.map(it => ({
        id: it.id,
        productId: it.id,
        productName: it.productName,
        name: it.productName,
        qty: Number(it.qty),
        quantity: Number(it.qty),
        unit: it.unit || 'KG',
        price: Number(it.price),
        total: Number(it.qty * it.price)
      }))
    };

    addOrder(newOrderRecord);
    setSelectedOrder(newOrderRecord);
    setIsCreateOrderOpen(false);
  };

  const handleAddItemToNewOrder = (productName: string, price: number, unit: string = 'KG') => {
    setNewOrderItems(prev => [
      ...prev,
      {
        id: Date.now(),
        productName,
        qty: 10,
        unit,
        price,
        total: 10 * price
      }
    ]);
  };

  const handleRemoveItemFromNewOrder = (id: number) => {
    setNewOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemQty = (id: number, delta: number) => {
    setNewOrderItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextQty = Math.max(1, item.qty + delta);
          return {
            ...item,
            qty: nextQty,
            total: nextQty * item.price
          };
        }
        return item;
      })
    );
  };

  const handleViewHotel = (hotelName: string) => {
    const found = hotels.find(h => h.name.toLowerCase() === hotelName.toLowerCase());
    if (found) {
      setSelectedHotel(found);
    }
    setActiveTab('Hotels');
  };

  const activeHotelObj = activeOrder ? hotels.find(h => h.name.toLowerCase() === activeOrder.hotelName.toLowerCase()) : null;
  const hotelImg = activeOrder?.hotelImage || activeHotelObj?.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100';

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const confirmedOrdersCount = orders.filter(o => o.status === 'Confirmed' || o.status === 'Preparing').length;
  const outForDeliveryOrdersCount = orders.filter(o => o.status === 'Out for Delivery').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Orders</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{totalOrdersCount}</h3>
          </div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Pending</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{pendingOrdersCount}</h3>
          </div>
        </div>

        <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Confirmed</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{confirmedOrdersCount}</h3>
          </div>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Out for Delivery</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{outForDeliveryOrdersCount}</h3>
          </div>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Delivered</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{deliveredOrdersCount}</h3>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsCreateOrderOpen(true)}
            className="w-full h-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>
      </div>

      {/* Full-width Orders List Table Section (No Slider) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800 whitespace-nowrap">Orders List</h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 whitespace-nowrap">
              {totalFiltered} {totalFiltered === 1 ? 'Order' : 'Orders'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-44 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search order, hotel..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <select
              value={selectedZone}
              onChange={e => {
                setSelectedZone(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Zones">All Zones</option>
              {zones.map(z => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
            </select>

            <select
              value={selectedJoinerFilter}
              onChange={e => {
                setSelectedJoinerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Joiners">All Joiners</option>
              {joiners.map(j => (
                <option key={j.id} value={j.name}>{j.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Preparing">Preparing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={e => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="All Payments">All Payments</option>
              <option value="Online">Online</option>
              <option value="COD">COD</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer transition-colors shrink-0"
              title="Export Orders CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsCreateOrderOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Create Order
            </button>
          </div>
        </div>

        {/* Selected Orders Actions Bar */}
        {selectedOrderIds.length > 0 && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900">
              {selectedOrderIds.length} orders selected
            </span>
            <button
              onClick={() => {
                confirmAction({
                  title: 'Delete Selected Orders',
                  message: `Are you sure you want to permanently delete these ${selectedOrderIds.length} orders?`,
                  entityName: `${selectedOrderIds.length} Orders`,
                  confirmLabel: 'Delete Orders',
                  type: 'danger',
                  onConfirm: () => {
                    selectedOrderIds.forEach(id => deleteOrder(id));
                    setSelectedOrderIds([]);
                  }
                });
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        )}

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-bold text-sm text-slate-800">
                {orders.length === 0 ? 'No Orders in System Yet' : 'No Orders Match Your Filter'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {orders.length === 0
                  ? 'Orders placed by hotel partners via the mobile app or created by administrators will appear here in real time.'
                  : 'Try resetting the zone, status, or search filters to view all available orders.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {orders.length === 0 ? (
                <button
                  onClick={() => setIsCreateOrderOpen(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Create First Order
                </button>
              ) : (
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-2 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-2 w-8 text-center whitespace-nowrap">#</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Order ID</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Date & Time</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Hotel Name</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Zone</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Joiner</th>
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Amount</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Payment</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Driver</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((ord, idx) => {
                  const isSelected = activeOrder && String(activeOrder.id) === String(ord.id);
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/80 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(ord.id)}
                          onChange={() => handleSelectRow(ord.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-500 whitespace-nowrap">
                        {startIndex + idx + 1}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-sky-700 whitespace-nowrap">
                        {ord.id}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{ord.date}</div>
                        <div className="text-[10px] text-slate-400">{ord.time}</div>
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={ord.hotelImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'}
                            alt=""
                            aria-hidden="true"
                            className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
                          />
                          <span className="font-bold text-slate-800">{ord.hotelName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">{ord.zone}</td>
                      <td className="py-2.5 px-2.5 text-slate-700 whitespace-nowrap font-medium">
                        {ord.addedBy === 'Admin' || ord.joiner === 'Admin' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                          </span>
                        ) : (
                          ord.joiner || '—'
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                        ₹{Number(ord.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          ord.paymentMode === 'Online'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.paymentMode}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap font-medium">
                        {ord.driver && ord.driver !== 'Not Assigned' && ord.driver !== 'Unassigned' && ord.driver !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-slate-800 font-bold">
                              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[110px]">{ord.driver}</span>
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setAssignModalOrderId(ord.id);
                                setIsAssignModalOpen(true);
                              }}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-purple-100 text-purple-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Reassign Driver"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setAssignModalOrderId(ord.id);
                              setIsAssignModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Truck className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>+ Assign Driver</span>
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          ord.status === 'Out for Delivery' ? 'bg-sky-100 text-sky-800' :
                          ord.status === 'Preparing' ? 'bg-amber-100 text-amber-800' :
                          ord.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {ord.status === 'Pending' && (
                            <button
                              onClick={() => {
                                setAssignModalOrderId(ord.id);
                                setIsAssignModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10.5px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Accept Order & Assign Driver"
                            >
                              <Truck className="w-3 h-3" /> Accept & Assign
                            </button>
                          )}

                          {(ord.status === 'Confirmed' || ord.status === 'Preparing') && (
                            <button
                              onClick={() => {
                                setAssignModalOrderId(ord.id);
                                setIsAssignModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10.5px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Assign Driver for Dispatch"
                            >
                              <Truck className="w-3 h-3" /> Assign Driver
                            </button>
                          )}

                          {ord.status === 'Out for Delivery' && (
                            <button
                              onClick={() => updateOrderStatus(ord.id, 'Delivered')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Mark Delivered (+ ₹100 Wallet Reward to Partner)"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Mark Delivered
                            </button>
                          )}

                          {ord.status === 'Delivered' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> ₹100 Credited
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              confirmAction({
                                title: 'Delete Order',
                                message: `Are you sure you want to delete order #${ord.id}?`,
                                entityName: `Order #${ord.id} (${ord.hotelName})`,
                                confirmLabel: 'Delete Order',
                                type: 'danger',
                                onConfirm: () => deleteOrder(ord.id)
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-xs text-slate-500 gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span>
                Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {endIndex} of {totalFiltered} orders
              </span>
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-[11px] text-slate-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700 focus:outline-emerald-600 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                    safeCurrentPage === p ? 'bg-emerald-700 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Order Details Section (Full-width Below Table) */}
      {activeOrder && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border-2 border-emerald-600 shadow-xs shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800">Order #{activeOrder.id}</h3>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    activeOrder.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                    activeOrder.status === 'Out for Delivery' ? 'bg-sky-100 text-sky-800' :
                    activeOrder.status === 'Preparing' ? 'bg-amber-100 text-amber-800' :
                    activeOrder.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {activeOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {activeOrder.date} 2026, {activeOrder.time} • Partner: <strong className="text-slate-700">{activeOrder.hotelName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowTimeline(prev => !prev)}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-600 text-emerald-700 font-bold text-xs rounded-lg shadow-2xs cursor-pointer transition-colors"
              >
                {showTimeline ? 'Hide Timeline' : 'View Timeline'}
              </button>
              <button
                onClick={handleDownloadInvoice}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Invoice
              </button>
              <button
                onClick={() => {
                  confirmAction({
                    title: 'Delete Order',
                    message: `Are you sure you want to permanently delete order #${activeOrder.id}?`,
                    entityName: `Order #${activeOrder.id} (${activeOrder.hotelName})`,
                    confirmLabel: 'Delete Order',
                    type: 'danger',
                    onConfirm: () => {
                      deleteOrder(activeOrder.id);
                    }
                  });
                }}
                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                title="Delete Order"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Hotel Details, Payment Info, Delivery Information & Commission */}
            <div className="lg:col-span-6 space-y-4">
              {/* Hotel & Joiner Details Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={hotelImg}
                    alt={activeOrder.hotelName}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                  />
                  <div>
                    <h4
                      onClick={() => handleViewHotel(activeOrder.hotelName)}
                      className="font-bold text-sm text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
                    >
                      {activeOrder.hotelName}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{activeOrder.hotelPhone || '9876543210'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{activeOrder.zone}, Pune</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                    alt={activeOrder.joiner}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-600"
                  />
                  <div className="text-left">
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      {activeOrder.joiner}
                      {activeOrder.addedBy === 'Admin' && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold">
                          <Shield className="w-2.5 h-2.5 text-amber-600" /> Admin
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {activeOrder.addedBy === 'Admin' ? 'Created by Admin' : 'Hotel Joiner'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment & Delivery Information Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-800">Payment</h5>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Paid
                    </span>
                  </div>
                  <p className="text-slate-600">Mode: <strong>{activeOrder.paymentMode}</strong> ({activeOrder.paymentMode === 'Online' ? 'Razorpay' : 'COD'})</p>
                  <p className="text-slate-500 font-mono text-[11px]">Txn: {activeOrder.transactionId || 'pay_N7d9K2h8L1'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-800">Delivery & Driver</h5>
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                      <Truck className="w-3 h-3" /> {activeOrder.status}
                    </span>
                  </div>
                  <p className="text-slate-600">Driver: <strong>{activeOrder.driver || 'Not Assigned'}</strong></p>
                  <p className="text-slate-500 text-[11px]">Contact: {activeOrder.driverPhone || '—'}</p>
                  <div className="pt-2 flex items-center gap-1.5">
                    {activeOrder.status !== 'Delivered' && (
                      <button
                        onClick={() => {
                          setAssignModalOrderId(activeOrder.id);
                          setIsAssignModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10.5px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Truck className="w-3 h-3" /> {activeOrder.driver ? 'Change Driver' : 'Assign Driver'}
                      </button>
                    )}
                    {activeOrder.status !== 'Delivered' && activeOrder.status !== 'Cancelled' && (
                      <button
                        onClick={() => updateOrderStatus(activeOrder.id, 'Delivered')}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10.5px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark Delivered (+₹100)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Joiner Wallet Bonus / Commission Box */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                activeOrder.status === 'Delivered' 
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                    activeOrder.status === 'Delivered' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-500 text-white shadow-xs'
                  }`}>
                    ₹100
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm">
                        {activeOrder.status === 'Delivered' ? '₹100 Wallet Reward Credited' : '₹100 Delivery Wallet Reward'}
                      </span>
                      <span className={`px-2 py-0.5 font-bold text-[10px] rounded-full ${
                        activeOrder.status === 'Delivered' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {activeOrder.status === 'Delivered' ? 'Credited to Wallet' : 'Pending Delivery'}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {activeOrder.status === 'Delivered' 
                        ? `₹100 bonus has been credited to ${activeOrder.joiner || 'Partner'}'s digital wallet account.` 
                        : `Once driver delivers the produce, ₹100 will be instantly added to ${activeOrder.joiner || 'Partner'}'s wallet account.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable Order Tracking Timeline */}
              {showTimeline && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 animate-in fade-in duration-200">
                  <h5 className="font-bold text-slate-800 mb-2">Order Tracking Timeline</h5>
                  <div className="relative pl-5 border-l-2 border-emerald-600 space-y-3">
                    <div>
                      <span className="absolute -left-1.5 top-0 w-3 h-3 bg-emerald-600 rounded-full"></span>
                      <p className="font-bold text-slate-800">Delivered Successfully</p>
                      <p className="text-[11px] text-slate-400">11 Sep 2026, 12:10 PM • By {activeOrder.driver}</p>
                    </div>
                    <div>
                      <span className="absolute -left-1.5 top-8 w-3 h-3 bg-emerald-600 rounded-full"></span>
                      <p className="font-bold text-slate-800">Out for Delivery</p>
                      <p className="text-[11px] text-slate-400">11 Sep 2026, 10:45 AM • Loaded into vehicle</p>
                    </div>
                    <div>
                      <span className="absolute -left-1.5 top-16 w-3 h-3 bg-emerald-600 rounded-full"></span>
                      <p className="font-bold text-slate-800">Order Confirmed & Packed</p>
                      <p className="text-[11px] text-slate-400">11 Sep 2026, 10:24 AM • Verified fresh produce</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order Items & Price Summary */}
            <div className="lg:col-span-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-bold text-xs text-slate-800">Order Items</h4>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="py-1 px-1">#</th>
                    <th className="py-1 px-1">Product</th>
                    <th className="py-1 px-1 text-center">Qty</th>
                    <th className="py-1 px-1 text-center">Unit</th>
                    <th className="py-1 px-1 text-right">Price</th>
                    <th className="py-1 px-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const orderItemsList = (activeOrder.items && activeOrder.items.length > 0)
                      ? activeOrder.items
                      : [
                          { id: 1, productName: 'Fresh Red Tomatoes (Grade A)', qty: 25, unit: 'KG', price: 40, total: 1000 },
                          { id: 2, productName: 'Farm Fresh Onions (Nashik)', qty: 30, unit: 'KG', price: 35, total: 1050 },
                          { id: 3, productName: 'Green Coriander & Herbs', qty: 15, unit: 'Bunch', price: 30, total: 450 }
                        ];

                    return orderItemsList.map((item: any, idx: number) => {
                      const pName = item.productName || item.name || item.title || `Produce Item ${idx + 1}`;
                      const pQty = Number(item.qty ?? item.quantity ?? 1);
                      const pUnit = item.unit || 'KG';
                      const pPrice = Number(item.price ?? 30);
                      const pTotal = Number(item.total ?? (pQty * pPrice));
                      const itemImg = item.image || resolveProductImage(pName, 'Vegetables');

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-100/60 transition-colors">
                          <td className="py-2.5 px-1 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-1">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={itemImg}
                                alt={pName}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200';
                                }}
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">{pName}</span>
                                <span className="text-[10px] text-slate-400">Fresh Produce</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-1 text-center font-bold text-slate-800">{pQty}</td>
                          <td className="py-2.5 px-1 text-center text-slate-500 font-medium">{pUnit}</td>
                          <td className="py-2.5 px-1 text-right text-slate-700 font-semibold">₹{pPrice}</td>
                          <td className="py-2.5 px-1 text-right font-bold text-slate-900">₹{pTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">
                    ₹{((activeOrder.items && activeOrder.items.length > 0)
                      ? activeOrder.items.reduce((sum: number, it: any) => sum + Number(it.total ?? ((it.qty ?? it.quantity ?? 1) * (it.price ?? 0))), 0)
                      : (activeOrder.subtotal || activeOrder.amount || 2500)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-slate-700">₹{activeOrder.deliveryCharge || 0}</span>
                </div>
                {Boolean(activeOrder.discount && activeOrder.discount > 0) && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount</span>
                    <span className="font-semibold text-rose-600">- ₹{activeOrder.discount}</span>
                  </div>
                )}
                
                {/* Total Amount Green Highlight */}
                <div className="flex justify-between items-center bg-emerald-50 text-emerald-900 font-extrabold text-sm py-2 px-3 rounded-lg border border-emerald-100">
                  <span>Total Amount</span>
                  <span className="text-base text-emerald-800">₹{Number(activeOrder.totalAmount ?? activeOrder.amount ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Promo Banner */}
      <div className="bg-emerald-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <h3 className="font-extrabold text-lg">Together We Grow</h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Connecting Hotels with Fresh Produce • More Orders • Stronger Partnerships • A Healthier Tomorrow
          </p>
        </div>
        <span className="text-3xl">🧺🥬🥕</span>
      </div>

      {/* Create Order Modal */}
      {isCreateOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Create New Order</h3>
                  <p className="text-[11px] text-slate-500">Generate fresh vegetable produce order for partner hotel</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOrderOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="mt-3 space-y-3 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Hotel Partner *</label>
                <select
                  value={newHotelName}
                  onChange={e => setNewHotelName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-800 cursor-pointer"
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.name}>{h.name} — {h.zone} ({h.joiner || 'Partner'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={newPaymentMode}
                    onChange={e => setNewPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="Online">Online (Razorpay / UPI)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Delivery Driver</label>
                  <select
                    value={newDriver}
                    onChange={e => setNewDriver(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-800 cursor-pointer"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.zone})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Produce Items Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Order Items</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {newOrderItems.length} Products
                    </span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Total: ₹{newOrderItems.reduce((s, i) => s + (i.qty * i.price), 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Items List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                  {newOrderItems.map(item => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 bg-white">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate text-xs">{item.productName}</p>
                        <p className="text-[10.5px] text-slate-500">₹{item.price}/{item.unit} • Subtotal: <strong className="text-slate-800">₹{item.qty * item.price}</strong></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, -5)}
                            className="px-2 py-0.5 text-slate-600 hover:text-emerald-700 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono font-bold text-slate-800 text-[11px]">{item.qty} {item.unit}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, 5)}
                            className="px-2 py-0.5 text-slate-600 hover:text-emerald-700 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        {newOrderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromNewOrder(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add Product */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={selectedCatalogProduct}
                    onChange={e => setSelectedCatalogProduct(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-emerald-600"
                  >
                    <option value="">+ Add from catalog...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name} (₹{p.price}/{p.unit || 'KG'})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedCatalogProduct) return;
                      const foundProd = products.find(p => p.name === selectedCatalogProduct);
                      if (foundProd) {
                        const prodPrice = Number(foundProd.price || 30);
                        handleAddItemToNewOrder(foundProd.name, prodPrice, foundProd.unit || 'KG');
                        setSelectedCatalogProduct('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-800 text-[11px] font-medium flex items-center justify-between">
                <span>🥬 <strong>4:00 AM Fresh Harvest Guarantee</strong></span>
                <span className="font-bold">₹100 Joiner Bonus Eligible</span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <p className="text-[10.5px] text-slate-500">Order Total</p>
                  <p className="text-base font-black text-emerald-800">
                    ₹{newOrderItems.reduce((s, i) => s + (i.qty * i.price), 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOrderOpen(false)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-bold shadow-xs cursor-pointer text-xs transition-all active:scale-[0.98]"
                  >
                    Create & Place Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      <AssignOrderModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignModalOrderId(undefined);
        }}
        preSelectedOrderId={assignModalOrderId}
      />
    </div>
  );
};
