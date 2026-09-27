import React from 'react';
import {
  Building2,
  Users,
  MapPin,
  ShoppingCart,
  FileText,
  Truck,
  IndianRupee,
  Coins
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MetricCards: React.FC = () => {
  const { setActiveTab, hotels, joiners, zones, orders, isDatabaseConnected } = useApp();

  const activeHotels = hotels.filter(h => (h.status || 'Active') === 'Active').length;
  const activeJoiners = joiners.filter(j => (j.status || 'Active') === 'Active').length;
  const activeZones = zones.filter(z => (z.status || 'Active') === 'Active').length;
  const pendingOrders = orders.filter(o => (o.status as string) === 'Pending' || o.orderStatus === 'Pending' || (o.status as string) === 'Processing').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered' || o.orderStatus === 'Delivered').length;
  const totalSales = orders.reduce((sum, o) => sum + (Number(o.amount || o.totalAmount) || 0), 0);
  
  const deliveredCommissionOrders = orders.filter(o => (o.status === 'Delivered' || o.orderStatus === 'Delivered'));
  const totalCommission = deliveredCommissionOrders.reduce((sum, o) => {
    const comm = Number(o.commission || 0);
    if (comm > 0) return sum + comm;
    const amt = Number(o.amount || o.totalAmount || 0);
    if (amt >= 1500 || (o as any).isBonusEligible) return sum + 100;
    return sum + 100;
  }, 0);

  const cards = [
    {
      title: 'Total Hotels',
      value: hotels.length.toLocaleString('en-IN'),
      subtext: `${activeHotels} Active`,
      bgColor: 'bg-[#edfcf2]',
      iconBg: 'bg-[#bbf7d0] text-[#15803d]',
      icon: Building2,
      subtextColor: 'text-[#15803d] font-semibold',
      tab: 'Hotels'
    },
    {
      title: 'Hotel Joiners',
      value: joiners.length.toLocaleString('en-IN'),
      subtext: `${activeJoiners} Active`,
      bgColor: 'bg-[#eff6ff]',
      iconBg: 'bg-[#bfdbfe] text-[#1d4ed8]',
      icon: Users,
      subtextColor: 'text-[#15803d] font-semibold',
      tab: 'Hotel Joiners'
    },
    {
      title: 'Total Zones',
      value: zones.length.toLocaleString('en-IN'),
      subtext: `${activeZones} Active`,
      bgColor: 'bg-[#fff7ed]',
      iconBg: 'bg-[#fed7aa] text-[#ea580c]',
      icon: MapPin,
      subtextColor: 'text-[#15803d] font-semibold',
      tab: 'Zones'
    },
    {
      title: "Today's Orders",
      value: orders.length.toLocaleString('en-IN'),
      subtext: `${orders.length} total orders`,
      bgColor: 'bg-[#f5f3ff]',
      iconBg: 'bg-[#ddd6fe] text-[#7c3aed]',
      icon: ShoppingCart,
      subtextColor: 'text-[#15803d] font-semibold',
      tab: 'Orders'
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.toLocaleString('en-IN'),
      subtext: `${pendingOrders} awaiting delivery`,
      bgColor: 'bg-[#fefce8]',
      iconBg: 'bg-[#fef08a] text-[#ca8a04]',
      icon: FileText,
      subtextColor: 'text-amber-700 font-medium',
      tab: 'Orders'
    },
    {
      title: 'Delivered Orders',
      value: deliveredOrders.toLocaleString('en-IN'),
      subtext: `${deliveredOrders} completed`,
      bgColor: 'bg-[#ecfdf5]',
      iconBg: 'bg-[#a7f3d0] text-[#15803d]',
      icon: Truck,
      subtextColor: 'text-[#15803d] font-semibold',
      tab: 'Orders'
    },
    {
      title: "Today's Sales",
      value: `₹${totalSales.toLocaleString('en-IN')}`,
      subtext: `From ${orders.length} orders`,
      bgColor: 'bg-[#fff1f2]',
      iconBg: 'bg-[#fecdd3] text-[#e11d48]',
      icon: IndianRupee,
      subtextColor: 'text-[#15803d] font-semibold',
      tab: 'Reports'
    },
    {
      title: 'Joiner Commission',
      value: `₹${totalCommission.toLocaleString('en-IN')}`,
      subtext: `${deliveredOrders} orders × ₹100 daily new orders`,
      bgColor: 'bg-[#f0f9ff]',
      iconBg: 'bg-[#bae6fd] text-[#0284c7]',
      icon: Coins,
      subtextColor: 'text-slate-500 font-normal',
      tab: 'Joiner Commission'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={() => setActiveTab(card.tab)}
            className={`${card.bgColor} p-3.5 rounded-xl border border-black/5 shadow-2xs flex items-center gap-3.5 transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer`}
          >
            <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0 shadow-2xs`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 leading-none">{card.title}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight leading-none">{card.value}</h3>
              <p className={`text-[11px] mt-1.5 leading-none ${card.subtextColor}`}>{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
