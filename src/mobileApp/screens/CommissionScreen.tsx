import React from 'react';
import {
  ArrowLeft,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  IndianRupee,
  TrendingUp,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { useJoinerApp } from '../JoinerAppContext';
import { MobileBottomNav } from '../components/MobileBottomNav';

export const CommissionScreen: React.FC = () => {
  const { walletState, commissionBalance, orders, setCurrentScreen } = useJoinerApp();

  const availableBalance = walletState?.walletBalance ?? commissionBalance.paid ?? 0;
  const totalEarned = walletState?.totalCommissionEarned ?? availableBalance;
  const todayCommission = walletState?.todayCommission ?? commissionBalance.todayCommission ?? 0;
  const monthlyCommission = walletState?.monthlyCommission ?? commissionBalance.thisMonth ?? 0;
  const eligibleDeliveredOrders = walletState?.eligibleDeliveredOrders ?? 0;

  // Pending Commission: eligible orders (> 1500) that are delivered but waiting for admin delivery approval
  const pendingDeliveredCommission = orders.filter(o => {
    const amt = Number(o.totalAmount ?? o.amount ?? 0);
    const st = String(o.status || o.orderStatus || '').toLowerCase();
    const isApproved = (o as any).adminApproved || (o as any).walletCredited || (o as any).commissionStatus === 'credited';
    return amt > 1500 && st === 'delivered' && !isApproved;
  }).length * 100;

  const transactions = walletState?.transactions || [];

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-between select-none">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-20 no-scrollbar">
        {/* Top Header */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentScreen('DASHBOARD')}
            className="p-1 -ml-1 text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">My Wallet & Commission</h2>
            <p className="text-[10px] text-slate-500 font-medium">Automatic ₹100 credited on Admin-approved orders &gt; ₹1,500</p>
          </div>
        </div>

        {/* Hero Card: Available Wallet Balance */}
        <div className="bg-gradient-to-br from-[#15803d] via-[#16a34a] to-emerald-700 rounded-3xl p-4.5 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-inner">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-100 font-semibold uppercase tracking-wider">
                  Available Wallet Balance
                </p>
                <h2 className="text-3xl font-black tracking-tight leading-none mt-0.5">
                  ₹{availableBalance.toLocaleString('en-IN')}
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] bg-emerald-950/60 text-emerald-200 px-2.5 py-1 rounded-full font-extrabold inline-flex items-center gap-1 border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" /> ₹100 / Eligible Order
              </span>
              <p className="text-[9.5px] text-emerald-100 font-medium mt-1.5">Asia/Kolkata IST Verified</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-400/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100">
              <span>Total Commission Earned:</span>
              <span className="font-extrabold text-white">₹{totalEarned.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-100">
              <span>Delivered Eligible Orders:</span>
              <span className="font-extrabold text-white">{eligibleDeliveredOrders}</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Today's Commission Card */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Commission</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-lg font-black text-slate-900 leading-tight">
              ₹{todayCommission.toLocaleString('en-IN')}
            </h4>
            <p className="text-[9.5px] text-emerald-600 font-medium">Credited today in IST</p>
          </div>

          {/* Monthly Commission Card */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Commission</span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-lg font-black text-slate-900 leading-tight">
              ₹{monthlyCommission.toLocaleString('en-IN')}
            </h4>
            <p className="text-[9.5px] text-blue-600 font-medium">Current calendar month</p>
          </div>

          {/* Eligible Delivered Orders */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered &gt; ₹1,500</span>
              <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-lg font-black text-slate-900 leading-tight">
              {eligibleDeliveredOrders}
            </h4>
            <p className="text-[9.5px] text-slate-500 font-medium">Orders credited ₹100</p>
          </div>

          {/* Pending Delivery Approval */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Commission</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-lg font-black text-amber-600 leading-tight">
              ₹{pendingDeliveredCommission.toLocaleString('en-IN')}
            </h4>
            <p className="text-[9.5px] text-amber-600 font-medium">Awaiting admin verification</p>
          </div>
        </div>

        {/* ₹100 Automatic Commission Policy Rule Card */}
        <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              ₹100
            </div>
            <h4 className="font-black text-xs text-amber-950">Automatic ₹100 Wallet Commission Policy</h4>
          </div>
          <p className="text-[11px] text-amber-900 leading-snug">
            Orders with an eligible total amount <strong>strictly greater than ₹1,500</strong> earn a fixed ₹100 commission credited automatically to your wallet upon Admin delivery approval.
          </p>
          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center font-bold">
            <span className="bg-amber-100/80 p-1 rounded-lg text-amber-800">₹1,500 = ₹0</span>
            <span className="bg-emerald-100 p-1 rounded-lg text-emerald-800">₹1,501 = ₹100</span>
            <span className="bg-emerald-100 p-1 rounded-lg text-emerald-800">₹2,000+ = ₹100</span>
          </div>
        </div>

        {/* Permanent Commission Transaction History Ledger */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-[#15803d]" />
              Commission Transaction Ledger
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              {transactions.length} Verified Transactions
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center space-y-2">
              <div className="text-3xl">🥦</div>
              <p className="text-xs font-bold text-slate-700">No Commission Transactions Yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Once an order above ₹1,500 is delivered and verified by Admin, a permanent ₹100 transaction record will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 text-xs overflow-hidden">
              {transactions.map((tx, idx) => {
                let txDate = 'Recent';
                let txTime = '';
                if (tx.createdAt) {
                  try {
                    const d = (tx.createdAt as any).toDate ? (tx.createdAt as any).toDate() : new Date(tx.createdAt);
                    txDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    txTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    txDate = 'Recent';
                  }
                }

                return (
                  <div key={tx.id || tx.transactionId || idx} className="p-3.5 flex items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs truncate">
                          {tx.hotelName || 'Partner Hotel'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">
                          #{tx.orderId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <span>{txDate} {txTime && `• ${txTime}`}</span>
                        <span>•</span>
                        <span>Order: <strong className="text-slate-800">₹{(tx.orderAmount || 0).toLocaleString('en-IN')}</strong></span>
                      </div>

                      <p className="text-[9.5px] font-mono text-slate-400 truncate max-w-[200px]">
                        TX: {tx.transactionId}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-sm text-[#15803d]">
                        +₹{Number(tx.commissionAmount ?? tx.amount ?? 100).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Credited
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
