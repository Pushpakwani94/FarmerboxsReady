import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { saveRecord } from '../firebase/dbService';
import {
  CircleDollarSign,
  Wallet,
  Clock,
  Users,
  Search,
  Eye,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  RefreshCw,
  Filter,
  Plus,
  Edit,
  Shield,
  Trash2
} from 'lucide-react';
import {
  initialCommissionList,
  initialPayoutRequests,
  initialPaymentHistory
} from '../data/commissionData';
import type {
  JoinerCommissionRecord,
  PayoutRequest,
  CommissionTransaction
} from '../data/commissionData';
import { MakePayoutModal } from '../components/Modals/MakePayoutModal';
import { JoinerCommissionHistoryModal } from '../components/Modals/JoinerCommissionHistoryModal';
import { EditCommissionModal } from '../components/Modals/EditCommissionModal';

export const CommissionPage: React.FC = () => {
  const { joiners, orders, isDatabaseConnected, updateJoiner } = useApp();

  // Dynamically compute commission list from live Firestore / state data
  const dynamicCommissionList = useMemo<JoinerCommissionRecord[]>(() => {
    const sourceJoiners = joiners.length > 0 ? joiners : (isDatabaseConnected ? [] : initialCommissionList);

    return sourceJoiners.map((j: any, idx: number) => {
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
            (oJoinerId.length >= 6 && (oJoinerId.includes(cleanPhone) || cleanPhone.includes(oJoinerId)))
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

      // Count completed / delivered orders ONLY for commission
      const deliveredOrdersCount = jOrders.filter(o => o.status === 'Delivered' || (o.status as string) === 'Completed').length;
      // Pending orders (awaiting delivery / in progress)
      const pendingOrdersCount = jOrders.filter(o => o.status !== 'Delivered' && (o.status as string) !== 'Completed' && o.status !== 'Cancelled').length;

      const totalOrdersCount = jOrders.length > 0 ? jOrders.length : Number(j.totalOrders || 0);
      const completedCount = jOrders.length > 0 ? deliveredOrdersCount : Number(j.completedOrders || j.deliveredOrders || 0);
      const pendingCount = jOrders.length > 0 ? pendingOrdersCount : Math.max(0, totalOrdersCount - completedCount);
      const commissionRate = 100;
      
      // Dynamic cumulative commission
      const liveDeliveredEarnings = completedCount * commissionRate;
      const recordedEarnings = Number(j.totalEarnings ?? j.commission ?? j.accumulatedCommission ?? 0);
      const totalCommission = Math.max(recordedEarnings, liveDeliveredEarnings);

      // Paid Amount & Dynamic Pending reduction
      const paidAmount = Number(j.paidAmount || 0);
      const pendingAmount = Math.max(0, totalCommission - paidAmount);
      const status: 'Paid' | 'Pending' = pendingAmount <= 0 && (totalCommission > 0 || paidAmount > 0) ? 'Paid' : 'Pending';

      const recentTransactions: CommissionTransaction[] = jOrders.length > 0
        ? jOrders.slice(0, 5).map(o => ({
            id: `TXN-${o.id}`,
            date: o.date || 'Today',
            orderId: String(o.id || o.orderId),
            hotelName: o.hotelName || 'Partner Hotel',
            amount: Number((o as any).commission || commissionRate),
            status: (o.status === 'Delivered' || (o.status as string) === 'Completed') ? 'Paid' : 'Pending'
          }))
        : (j.recentTransactions && j.recentTransactions.length > 0
            ? j.recentTransactions
            : [
                {
                  id: `TXN-${Date.now().toString().slice(-4)}`,
                  date: 'Today',
                  orderId: `FB${Math.floor(1000 + Math.random() * 9000)}`,
                  hotelName: 'Hotel Partner',
                  amount: 100,
                  status: 'Paid'
                }
              ]
          );

      return {
        id: j.id || (idx + 1),
        name: j.name || 'Joiner',
        mobile: j.mobile || j.phone || '9876543210',
        zone: j.zone || 'Kharadi',
        totalOrders: totalOrdersCount,
        completedOrders: completedCount,
        deliveredOrders: completedCount,
        pendingOrders: pendingCount,
        commissionRate,
        commission: totalCommission,
        paidAmount,
        pendingAmount,
        status,
        avatar: j.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        upiId: j.upiId || `${(j.name || 'joiner').toLowerCase().replace(/\s+/g, '')}@okaxis`,
        bankName: j.bankName || 'HDFC Bank',
        accountNo: j.accountNo || '•••• •••• 4521',
        ifscCode: j.ifscCode || 'HDFC0001234',
        walletBalance: pendingAmount,
        recentTransactions
      };
    });
  }, [joiners, orders, isDatabaseConnected]);

  // Master state
  const [commissionList, setCommissionList] = useState<JoinerCommissionRecord[]>(dynamicCommissionList);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(isDatabaseConnected ? [] : initialPayoutRequests);
  const [paymentHistory, setPaymentHistory] = useState(isDatabaseConnected ? [] : initialPaymentHistory);

  useEffect(() => {
    setCommissionList(dynamicCommissionList);
  }, [dynamicCommissionList]);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'Commission List' | 'Joiner Wallets' | 'Payment History' | 'Payout Requests'>('Commission List');

  // Selected Joiner
  const [selectedJoinerId, setSelectedJoinerId] = useState<number | string>(1);
  const activeJoiner = commissionList.find(j => String(j.id) === String(selectedJoinerId)) || commissionList[0];

  // Specific target for Payout modal
  const [payoutTargetJoiner, setPayoutTargetJoiner] = useState<JoinerCommissionRecord | null>(null);

  // Filters
  const [zoneFilter, setZoneFilter] = useState<string>('All Zones');
  const [joinerFilter, setJoinerFilter] = useState<string>('All Joiners');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Selected IDs for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Zones & Joiners filter options
  const zones = useMemo(() => ['All Zones', ...Array.from(new Set(commissionList.map(j => j.zone)))], [commissionList]);
  const joinerNames = useMemo(() => ['All Joiners', ...Array.from(new Set(commissionList.map(j => j.name)))], [commissionList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return commissionList.filter(j => {
      const matchesZone = zoneFilter === 'All Zones' || j.zone === zoneFilter;
      const matchesJoiner = joinerFilter === 'All Joiners' || j.name === joinerFilter;
      const matchesStatus = statusFilter === 'All Status' || j.status === statusFilter;
      const matchesSearch =
        searchTerm === '' ||
        j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.mobile.includes(searchTerm);

      return matchesZone && matchesJoiner && matchesStatus && matchesSearch;
    });
  }, [commissionList, zoneFilter, joinerFilter, statusFilter, searchTerm]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredList.length);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedList.map(j => j.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: number | string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Mobile", "Zone", "Total Orders", "Delivered Orders", "Pending Orders", "Rate", "Total Commission", "Paid Amount", "Pending Payout", "Status"];
    const rows = filteredList.map(j => [
      j.id,
      `"${j.name}"`,
      `"${j.mobile}"`,
      `"${j.zone}"`,
      j.totalOrders,
      j.completedOrders ?? j.deliveredOrders,
      j.pendingOrders ?? 0,
      `"₹${j.commissionRate}"`,
      `"₹${j.commission}"`,
      `"₹${j.paidAmount}"`,
      `"₹${j.pendingAmount}"`,
      j.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Joiner_Commission_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Commission List to CSV successfully!');
  };

  // Payment Success Handler
  const handlePaymentSuccess = async (joinerId: number | string, amount: number, mode: string, txnRef: string) => {
    const targetJoiner = commissionList.find(j => String(j.id) === String(joinerId)) || payoutTargetJoiner || activeJoiner;
    const targetName = targetJoiner?.name || 'Joiner';
    const currentPaid = Number(targetJoiner?.paidAmount || 0);
    const newPaid = currentPaid + amount;
    const currentTotalComm = Number(targetJoiner?.commission || 0);
    const newTotalComm = Math.max(currentTotalComm, newPaid);
    const newPending = Math.max(0, newTotalComm - newPaid);

    const newTx: CommissionTransaction = {
      id: txnRef,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      orderId: `FB${Math.floor(1000 + Math.random() * 9000)}`,
      amount: amount,
      status: 'Paid',
      paymentMode: mode,
      utr: txnRef
    };

    setCommissionList(prev =>
      prev.map(j => {
        if (String(j.id) === String(joinerId)) {
          return {
            ...j,
            commission: newTotalComm,
            paidAmount: newPaid,
            pendingAmount: newPending,
            walletBalance: newPending,
            status: newPending === 0 ? 'Paid' : 'Pending',
            recentTransactions: [newTx, ...(j.recentTransactions || []).slice(0, 4)]
          };
        }
        return j;
      })
    );

    // Save payment in Firestore 'payments' collection
    const dateTimeStr = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const paymentRecord = {
      id: txnRef,
      transactionId: txnRef,
      joinerId: String(joinerId),
      joinerName: targetName,
      mobile: targetJoiner?.mobile || '',
      zone: targetJoiner?.zone || 'Kharadi',
      amount: amount,
      paymentMethod: mode,
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateTime: dateTimeStr
    };
    saveRecord('payments', paymentRecord, txnRef);

    // Update Joiner in Firestore 'joiners' collection and AppContext
    const joinerUpdateData = {
      paidAmount: newPaid,
      pendingAmount: newPending,
      totalEarnings: newTotalComm,
      commission: newTotalComm,
      status: (newPending === 0 ? 'Paid' : 'Pending') as any
    };
    
    if (updateJoiner) {
      updateJoiner(joinerId, joinerUpdateData);
    }
    saveRecord('joiners', { id: joinerId, ...joinerUpdateData }, String(joinerId));

    // Add to Payment History
    const historyItem = {
      id: txnRef,
      date: dateTimeStr,
      joinerName: targetName,
      mobile: targetJoiner?.mobile || '',
      zone: targetJoiner?.zone || '',
      amount: amount,
      mode: mode,
      utr: txnRef,
      status: 'Completed' as const
    };
    setPaymentHistory(prev => [historyItem, ...prev]);

    showToast(`Payment of ₹${amount.toLocaleString('en-IN')} disbursed to ${targetName}! Pending reduced to ₹${newPending.toLocaleString('en-IN')}`);
  };

  // Edit Joiner Save Handler
  const handleEditSave = (updated: Partial<JoinerCommissionRecord>) => {
    setCommissionList(prev =>
      prev.map(j => (j.id === selectedJoinerId ? { ...j, ...updated } : j))
    );
    showToast(`Updated details for ${activeJoiner.name}`);
  };

  // Payout Request Actions
  const handleApprovePayout = (req: PayoutRequest) => {
    setPayoutRequests(prev =>
      prev.map(r => (r.id === req.id ? { ...r, status: 'Approved' } : r))
    );
    handlePaymentSuccess(req.joinerId, req.amount, req.paymentMethod, `PAY-REQ-${req.id}`);
  };

  const handleRejectPayout = (reqId: string) => {
    setPayoutRequests(prev =>
      prev.map(r => (r.id === reqId ? { ...r, status: 'Rejected' } : r))
    );
    showToast('Payout request rejected');
  };

  // Bulk Payment for selected
  const handleBulkPay = () => {
    if (selectedIds.length === 0) return;
    setCommissionList(prev =>
      prev.map(j => {
        if (selectedIds.includes(j.id) && j.status === 'Pending') {
          return {
            ...j,
            paidAmount: j.commission,
            pendingAmount: 0,
            status: 'Paid',
            walletBalance: 0
          };
        }
        return j;
      })
    );
    setSelectedIds([]);
    showToast(`Successfully processed payouts for ${selectedIds.length} joiners!`);
  };

  // Metrics computed dynamically
  const totalCommissionSum = commissionList.reduce((sum, j) => sum + (Number(j.commission) || 0), 0);
  const paidCommissionSum = commissionList.reduce((sum, j) => sum + (Number(j.paidAmount) || 0), 0);
  const pendingCommissionSum = commissionList.reduce((sum, j) => sum + (Number(j.pendingAmount) || 0), 0);
  const totalJoinersCount = isDatabaseConnected ? joiners.length : (joiners.length || commissionList.length);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Commission</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">₹{totalCommissionSum.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Paid Commission</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">₹{paidCommissionSum.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Pending Commission</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">₹{pendingCommissionSum.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Joiners</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">{totalJoinersCount}</h3>
          </div>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Commission Rate</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none mt-0.5">₹100 / order</h3>
          </div>
        </div>

        <div>
          <button
            onClick={() => {
              setPayoutTargetJoiner(activeJoiner);
              setIsPayoutModalOpen(true);
            }}
            className="w-full h-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Send className="w-4 h-4" /> Make Payout
          </button>
        </div>
      </div>

      {/* Full-width Commission Management Section (No Slider) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* 4 Sub-Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-bold text-slate-600 overflow-x-auto pb-1">
          {(['Commission List', 'Joiner Wallets', 'Payment History', 'Payout Requests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`pb-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'text-emerald-700 border-b-2 border-emerald-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              {tab === 'Payout Requests' && payoutRequests.filter(r => r.status === 'Pending').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                  {payoutRequests.filter(r => r.status === 'Pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: COMMISSION LIST */}
        {activeTab === 'Commission List' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800 whitespace-nowrap">Joiner Commission List</h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 whitespace-nowrap">
                  {filteredList.length} {filteredList.length === 1 ? 'Joiner' : 'Joiners'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative w-full sm:w-44 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search name/mobile..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <select
                  value={zoneFilter}
                  onChange={e => {
                    setZoneFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer shrink-0"
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
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
                  <option value="Paid">Paid</option>
                </select>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer transition-colors shrink-0"
                  title="Export Commission CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => {
                    setPayoutTargetJoiner(activeJoiner);
                    setIsPayoutModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" /> Make Payout
                </button>
              </div>
            </div>

            {/* Bulk Action Banner */}
            {selectedIds.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in">
                <span className="font-bold text-emerald-900">
                  {selectedIds.length} joiner(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkPay}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-2xs cursor-pointer"
                  >
                    Bulk Pay Commission
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            {filteredList.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-700">No joiners match your filter criteria.</p>
                <button
                  onClick={() => {
                    setZoneFilter('All Zones');
                    setJoinerFilter('All Joiners');
                    setStatusFilter('All Status');
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                      <th className="py-2.5 px-2 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === paginatedList.length}
                          onChange={handleSelectAll}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-2 w-8 text-center whitespace-nowrap">#</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Joiner Name</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Mobile</th>
                      <th className="py-2.5 px-2.5 whitespace-nowrap">Zone</th>
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">Total Orders</th>
                      <th className="py-2.5 px-2 text-center text-emerald-800 whitespace-nowrap">Completed</th>
                      <th className="py-2.5 px-2 text-center text-amber-700 whitespace-nowrap">Pending Orders</th>
                      <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Total Comm</th>
                      <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Paid</th>
                      <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Pending</th>
                      <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedList.map((j, idx) => {
                      const isSelected = selectedJoinerId === j.id;
                      const isChecked = selectedIds.includes(j.id);
                      const completedCount = j.completedOrders ?? j.deliveredOrders ?? 0;
                      const pendingCount = j.pendingOrders ?? Math.max(0, j.totalOrders - completedCount);
                      return (
                        <tr
                          key={j.id}
                          onClick={() => setSelectedJoinerId(j.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/80 font-semibold'
                              : isChecked
                              ? 'bg-emerald-50/30'
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRow(j.id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center font-medium text-slate-500 whitespace-nowrap">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img
                                src={j.avatar}
                                alt={j.name}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                              />
                              <span className="font-bold text-slate-800">{j.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">{j.mobile}</td>
                          <td className="py-2.5 px-2.5 text-slate-700 font-medium whitespace-nowrap">{j.zone}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800 whitespace-nowrap">{j.totalOrders}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-emerald-800 whitespace-nowrap">{completedCount}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-amber-800 whitespace-nowrap">{pendingCount}</td>
                          <td className="py-2.5 px-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                            ₹{j.commission.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                            ₹{j.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-bold text-amber-700 whitespace-nowrap">
                            ₹{j.pendingAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              j.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {j.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedJoinerId(j.id);
                                  setPayoutTargetJoiner(j);
                                  setIsPayoutModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                              >
                                Pay
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedJoinerId(j.id);
                                  setIsHistoryModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                                title="Ledger"
                              >
                                <Eye className="w-3.5 h-3.5" />
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

            {/* Pagination Bar */}
            {filteredList.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-xs text-slate-500 gap-3 border-t border-slate-100">
                <span>
                  Showing {startIndex} to {endIndex} of {filteredList.length} joiners
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                        currentPage === page
                          ? 'bg-emerald-700 text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: JOINER WALLETS */}
        {activeTab === 'Joiner Wallets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Joiner Digital Wallets</h4>
              <p className="text-xs text-slate-500">Live ledger balance available for instant withdrawal</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {commissionList.map(j => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJoinerId(j.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedJoinerId === j.id
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <img src={j.avatar} alt={j.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-800">{j.name}</p>
                        <p className="text-[10px] text-slate-500">{j.zone} Zone • {j.mobile}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      ₹{j.walletBalance.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 text-[10px] text-center">
                    <div>
                      <span className="text-slate-400 block">Total Earned</span>
                      <strong className="text-slate-700">₹{j.commission.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Paid</span>
                      <strong className="text-emerald-700">₹{j.paidAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Pending</span>
                      <strong className="text-amber-700">₹{j.pendingAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="pt-2.5 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJoinerId(j.id);
                        setPayoutTargetJoiner(j);
                        setIsPayoutModalOpen(true);
                      }}
                      className="flex-1 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                    >
                      Payout
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJoinerId(j.id);
                        setIsHistoryModalOpen(true);
                      }}
                      className="py-1 px-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] rounded-lg cursor-pointer"
                    >
                      Ledger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT HISTORY */}
        {activeTab === 'Payment History' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Disbursement & Payment History</h4>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export All
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Joiner Name</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3">UTR / Ref</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{item.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{item.joinerName}</td>
                      <td className="py-2 px-3 text-slate-600">{item.zone}</td>
                      <td className="py-2 px-3 font-medium text-slate-700">{item.mode}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.utr}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PAYOUT REQUESTS */}
        {activeTab === 'Payout Requests' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800">Joiner Payout Requests</h4>
                <p className="text-xs text-slate-500">Withdrawal requests requested directly by hotel joiners</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Joiner</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Requested Date</th>
                    <th className="py-2.5 px-3">Transfer Details</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{req.id}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{req.joinerName}</td>
                      <td className="py-2 px-3 text-slate-600">{req.zone}</td>
                      <td className="py-2 px-3 text-slate-500">{req.requestDate}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                        {req.paymentMethod} • {req.upiOrAccount}
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-slate-900">
                        ₹{req.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApprovePayout(req)}
                              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[10px] cursor-pointer"
                            >
                              Approve & Pay
                            </button>
                            <button
                              onClick={() => handleRejectPayout(req.id)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Selected Joiner Commission Details Section (Full-width Below Table) */}
      {activeJoiner && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={activeJoiner.avatar}
                alt={activeJoiner.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800">{activeJoiner.name}</h3>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    activeJoiner.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activeJoiner.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Joiner • Mobile: <span className="font-semibold text-slate-700">{activeJoiner.mobile}</span> • Zone: <span className="font-semibold text-slate-700">{activeJoiner.zone}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setPayoutTargetJoiner(activeJoiner);
                  setIsPayoutModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Send className="w-3 h-3" /> Make Commission Payment
              </button>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                View Full History
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                title="Edit Details"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: 6-Grid Stats and Settlement Info */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-medium">Total Orders</span>
                  <p className="font-bold text-slate-900 text-base mt-0.5">{activeJoiner.totalOrders}</p>
                  <span className="text-[10px] text-slate-400">Assigned 📦</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 font-medium">Completed</span>
                  <p className="font-bold text-emerald-900 text-base mt-0.5">{activeJoiner.completedOrders ?? activeJoiner.deliveredOrders ?? 0}</p>
                  <span className="text-[10px] text-emerald-700">Earned comm ✅</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-slate-400 font-medium">Pending Orders</span>
                  <p className="font-bold text-amber-900 text-base mt-0.5">{activeJoiner.pendingOrders ?? 0}</p>
                  <span className="text-[10px] text-amber-700">Awaiting ⏳</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                  <span className="text-[10px] text-slate-400 font-medium">Total Comm</span>
                  <p className="font-bold text-sky-900 text-base mt-0.5">₹{activeJoiner.commission.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-sky-700">Lifetime 💰</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 font-medium">Paid Amount</span>
                  <p className="font-bold text-emerald-900 text-base mt-0.5">₹{activeJoiner.paidAmount.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-emerald-700">Disbursed 💳</span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-400 font-medium">Pending Comm</span>
                  <p className="font-bold text-rose-900 text-base mt-0.5">₹{activeJoiner.pendingAmount.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-rose-700">To pay ⚖️</span>
                </div>
              </div>

              {/* Settlement Bank Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">UPI VPA:</span>
                  <span className="font-mono font-bold text-slate-800">{activeJoiner.upiId || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bank Account:</span>
                  <span className="font-medium text-slate-700">{activeJoiner.bankName} ({activeJoiner.accountNo})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">IFSC Code:</span>
                  <span className="font-mono text-slate-700">{activeJoiner.ifscCode}</span>
                </div>
              </div>
            </div>

            {/* Right: Recent Commission Transactions */}
            <div className="lg:col-span-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800">Recent Commission Transactions</h4>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Order ID</th>
                      <th className="py-2 px-2 text-right">Amount</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeJoiner.recentTransactions || []).slice(0, 5).map((tx, idx) => (
                      <tr key={tx.id || idx} className="hover:bg-slate-100/60 transition-colors">
                        <td className="py-2 px-2 text-slate-600">{tx.date}</td>
                        <td className="py-2 px-2 font-bold text-slate-800">{tx.orderId}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">₹{tx.amount.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            tx.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Modals */}
      <MakePayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        joiner={payoutTargetJoiner || activeJoiner}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <JoinerCommissionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        joiner={activeJoiner}
      />

      <EditCommissionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        joiner={activeJoiner}
        onSave={handleEditSave}
      />
    </div>
  );
};
