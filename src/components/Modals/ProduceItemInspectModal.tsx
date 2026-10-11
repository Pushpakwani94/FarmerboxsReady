import React from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Package,
  MapPin,
  Calendar,
  Building2,
  User,
  IndianRupee,
  Leaf,
  Scale,
  Award
} from 'lucide-react';
import { resolveProductImage } from '../../utils/productImages';

export interface ProduceItemInspectionData {
  item: {
    productId?: number | string;
    productName?: string;
    name?: string;
    quantity?: number;
    qty?: number;
    unit?: string;
    price?: number;
    total?: number;
    image?: string;
    category?: string;
    grade?: string;
    origin?: string;
    harvestDate?: string;
    inspected?: boolean;
  };
  orderId: string;
  customerName: string;
  partnerName: string;
  zoneName: string;
}

interface ProduceItemInspectModalProps {
  data: ProduceItemInspectionData | null;
  onClose: () => void;
  onToggleInspected?: (productId: number | string) => void;
}

export const ProduceItemInspectModal: React.FC<ProduceItemInspectModalProps> = ({
  data,
  onClose,
  onToggleInspected
}) => {
  if (!data) return null;

  const { item, orderId, customerName, partnerName, zoneName } = data;
  const itemName = item.productName || item.name || 'Fresh Vegetable';
  const itemCategory = item.category || (itemName.toLowerCase().includes('apple') || itemName.toLowerCase().includes('banana') || itemName.toLowerCase().includes('mango') ? 'Fresh Fruits' : 'Farm Fresh Vegetables');
  const itemImg = resolveProductImage(itemName, itemCategory, item.image);
  const qty = item.quantity ?? item.qty ?? 1;
  const unit = item.unit || 'kg';
  const price = item.price || 0;
  const total = item.total || price * qty;
  const grade = item.grade || 'Grade A+ Premium Export';
  const origin = item.origin || 'Direct Nashik / Saswad Organic Mandi Hub';
  const harvestDate = item.harvestDate || 'Today, 04:30 AM Fresh Harvest';
  const isInspected = Boolean(item.inspected);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#15803d] flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">Produce Inspection</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-[#15803d] font-extrabold border border-emerald-200">
                  {grade}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Order #{orderId} • Quality & Freshness Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Produce Card */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-4 p-4">
          <img
            src={itemImg}
            alt={itemName}
            className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-xl shadow-xs border border-white"
          />
          <div className="flex-1 text-center sm:text-left space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
              {itemCategory}
            </span>
            <h4 className="text-lg font-black text-slate-900 leading-snug">{itemName}</h4>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs font-semibold text-slate-600 pt-1">
              <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                {qty} {unit}
              </span>
              <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs text-[#15803d] font-bold">
                <IndianRupee className="w-3.5 h-3.5" />
                {price}/{unit}
              </span>
            </div>
            <p className="text-xs font-black text-slate-800 pt-0.5">
              Line Total: <span className="text-[#15803d]">₹{total.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        {/* Quality Audit Specifications */}
        <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
          <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#15803d]" />
            Farm Fresh Quality Parameters
          </h5>
          <div className="grid grid-cols-2 gap-2 text-[11.5px]">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Harvest Batch</span>
              <p className="font-bold text-slate-800">{harvestDate}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Source Mandi</span>
              <p className="font-bold text-slate-800 truncate" title={origin}>{origin}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Moisture & Crispness</span>
              <p className="font-bold text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                100% Crisp & Farm-Dew
              </p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-0.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Storage Temp</span>
              <p className="font-bold text-slate-800">4°C - 8°C Cool Air Crate</p>
            </div>
          </div>
        </div>

        {/* Destination & Stakeholders Info */}
        <div className="space-y-2 text-xs">
          <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-sky-600" />
            Dispatch Destination
          </h5>
          <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Hotel / Customer:
              </span>
              <span className="font-extrabold text-slate-900">{customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Joiner Partner:
              </span>
              <span className="font-extrabold text-slate-900">{partnerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Delivery Zone:
              </span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{zoneName}</span>
            </div>
          </div>
        </div>

        {/* Inspection Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          {onToggleInspected && item.productId && (
            <button
              onClick={() => {
                onToggleInspected(item.productId!);
                onClose();
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                isInspected
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-[#15803d] hover:bg-[#166534] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isInspected ? 'Mark as Unverified' : 'Approve & Pass Freshness Audit'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
