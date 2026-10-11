import React from 'react';
import { useApp } from '../context/AppContext';

const normalizeStr = (s?: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[\s\-_,]+/g, ' ')
    .replace(/zone/g, '')
    .trim();

export const ZonePerformanceTable: React.FC = () => {
  const { setActiveTab, zones, setSelectedZone, hotels, joiners, orders } = useApp();

  const handleZoneClick = (zoneName: string) => {
    const matched = zones.find(z => normalizeStr(z.name) === normalizeStr(zoneName));
    if (matched) {
      setSelectedZone(matched);
    }
    setActiveTab('Zones');
  };

  const zonesData = zones.map(z => {
    const zName = normalizeStr(z.name);
    const zAreas = (z.areaLocations || '').toLowerCase();

    const zoneHotels = hotels.filter(h => {
      const hZone = normalizeStr(h.zone);
      return hZone === zName || (zName && hZone.includes(zName)) || (zAreas && zAreas.includes(hZone));
    }).length;

    const zoneJoiners = joiners.filter(j => {
      const jZone = normalizeStr(j.zone);
      return jZone === zName || (zName && jZone.includes(zName)) || (zAreas && zAreas.includes(jZone));
    }).length;

    const zoneOrders = orders.filter(o => {
      const oZone = normalizeStr(o.zone || o.zoneName || o.hotelZone);
      return oZone === zName || (zName && oZone.includes(zName)) || (zAreas && zAreas.includes(oZone));
    });

    const deliveredCount = zoneOrders.filter(o => o.status === 'Delivered' || o.orderStatus === 'Delivered').length;
    const totalSales = zoneOrders.reduce((acc, o) => acc + (Number(o.amount || o.totalAmount) || 0), 0);

    return {
      zone: z.name,
      hotels: zoneHotels,
      joiners: zoneJoiners,
      orders: zoneOrders.length,
      delivered: deliveredCount,
      sales: `₹${totalSales.toLocaleString('en-IN')}`
    };
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-xs text-slate-800">Zone Performance</h3>
        <button
          onClick={() => setActiveTab('Zones')}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
        >
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="py-2 px-1.5 font-semibold">Zone</th>
              <th className="py-2 px-1.5 font-semibold text-center">Hotels</th>
              <th className="py-2 px-1.5 font-semibold text-center">Joiners</th>
              <th className="py-2 px-1.5 font-semibold text-center">Orders</th>
              <th className="py-2 px-1.5 font-semibold text-center">Delivered</th>
              <th className="py-2 px-1.5 font-semibold text-right">Sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {zonesData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                  No zones yet in database.
                </td>
              </tr>
            ) : (
              zonesData.map((item, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleZoneClick(item.zone)}
                  className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                  title={`Click to view ${item.zone} details`}
                >
                  <td className="py-2 px-1.5 font-medium text-slate-800 hover:text-emerald-700">{item.zone}</td>
                  <td className="py-2 px-1.5 text-center text-slate-600">{item.hotels}</td>
                  <td className="py-2 px-1.5 text-center text-slate-600">{item.joiners}</td>
                  <td className="py-2 px-1.5 text-center text-slate-600">{item.orders}</td>
                  <td className="py-2 px-1.5 text-center text-slate-600">{item.delivered}</td>
                  <td className="py-2 px-1.5 text-right font-semibold text-slate-800">{item.sales}</td>
                </tr>
              ))
            )}

            {zonesData.length > 0 && (
              <tr className="bg-[#eaf7ed] font-bold text-slate-900 border-t border-emerald-200">
                <td className="py-2 px-1.5 text-[#168a44]">Total</td>
                <td className="py-2 px-1.5 text-center">
                  {zonesData.reduce((acc, z) => acc + z.hotels, 0)}
                </td>
                <td className="py-2 px-1.5 text-center">
                  {zonesData.reduce((acc, z) => acc + z.joiners, 0)}
                </td>
                <td className="py-2 px-1.5 text-center">
                  {zonesData.reduce((acc, z) => acc + z.orders, 0)}
                </td>
                <td className="py-2 px-1.5 text-center">
                  {zonesData.reduce((acc, z) => acc + z.delivered, 0)}
                </td>
                <td className="py-2 px-1.5 text-right text-[#168a44]">
                  ₹{orders.reduce((acc, o) => acc + (Number(o.amount || o.totalAmount) || 0), 0).toLocaleString('en-IN')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
