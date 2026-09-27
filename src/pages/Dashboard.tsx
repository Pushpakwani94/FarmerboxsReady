import React from 'react';
import { MetricCards } from '../components/MetricCards';
import { OrdersOverviewChart } from '../components/OrdersOverviewChart';
import { SalesOverviewChart } from '../components/SalesOverviewChart';
import { ZonePerformanceTable } from '../components/ZonePerformanceTable';
import { TodaysOrdersTable } from '../components/TodaysOrdersTable';
import { DeliveryOverview } from '../components/DeliveryOverview';
import { QuickActions } from '../components/QuickActions';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-5">

      {/* 8 Metric Cards Grid (2 rows of 4) */}
      <MetricCards />

      {/* Middle Section: Orders Overview (4 cols) | Sales Overview (4 cols) | Zone Performance (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <OrdersOverviewChart />
        </div>
        <div className="lg:col-span-4">
          <SalesOverviewChart />
        </div>
        <div className="lg:col-span-4">
          <ZonePerformanceTable />
        </div>
      </div>

      {/* Bottom Section: Left (8 cols: Orders + QuickActions) | Right (4 cols: DeliveryOverview + Promo Banner) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Today's Orders + Action Buttons */}
        <div className="lg:col-span-8 space-y-4">
          <TodaysOrdersTable />
          <QuickActions />
        </div>

        {/* Right Column: Delivery Overview + Promo Banner */}
        <div className="lg:col-span-4 space-y-4">
          <DeliveryOverview />

          {/* Promo Banner matching exact screenshot artwork */}
          <div className="bg-[#dcfce7]/90 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <h4 className="font-extrabold text-sm text-[#14532d] tracking-tight">Fresh Vegetables</h4>
              <p className="font-extrabold text-xs text-[#16a34a]">Stronger Businesses</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300"
              alt="Crate of Fresh Vegetables"
              className="w-24 h-14 object-cover rounded-lg shadow-2xs flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
