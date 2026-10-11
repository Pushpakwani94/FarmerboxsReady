import React from 'react';
import {
  Handshake,
  TrendingUp,
  IndianRupee,
  MapPin,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useJoinerApp } from '../JoinerAppContext';

export const WelcomeScreen: React.FC = () => {
  const { setCurrentScreen } = useJoinerApp();

  const features = [
    { label: 'Build\nRelations', icon: Handshake },
    { label: 'Increase\nOrders', icon: TrendingUp },
    { label: 'Earn\nCommission', icon: IndianRupee },
    { label: 'Hotel\nNetwork', icon: MapPin }
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#FAFDFB] via-[#FFFFFF] to-[#EFF7F1] select-none justify-between overflow-y-auto overflow-x-hidden relative py-5 px-4">
      
      {/* Top Center Branding: FarmerBoxs PARTNER Official Logo */}
      <div className="z-10 flex flex-col items-center text-center space-y-1 pt-2">
        <div className="w-64 max-w-full px-2 py-1 flex items-center justify-center">
          <img
            src="/images/farmerbox_partner_official.png"
            alt="FarmerBoxs Partner Logo"
            className="w-full h-auto max-h-16 object-contain drop-shadow-xs"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/farmerbox_partner_logo.png';
            }}
          />
        </div>
        <p className="text-[10px] font-extrabold text-emerald-800 tracking-wider uppercase">
          Hotel Partner Supply Network
        </p>
      </div>

      {/* Clean Hero Visual Card */}
      <div className="relative z-10 my-auto py-1">
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-emerald-100 bg-white">
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src="/images/joiner_hotel_handshake.jpg"
              alt="FarmerBox Hotel Joiner"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </div>

      {/* 4 Feature Value Pillars */}
      <div className="z-10 py-1">
        <div className="grid grid-cols-4 gap-2 p-2.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#E8F8EE] border border-[#C5ECD0] text-[#15803D] flex items-center justify-center shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9.5px] font-bold text-slate-800 leading-tight whitespace-pre-line">
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="pt-2 pb-1 space-y-2.5 z-10">
        {/* Solid Green Login Button */}
        <button
          onClick={() => setCurrentScreen('LOGIN')}
          className="w-full py-4 bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-black text-base rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
        >
          <LogIn className="w-5 h-5" />
          <span>Login to Partner App</span>
        </button>

        {/* Security & Admin Onboarding Notice */}
        <div className="text-center pt-1">
          <p className="text-[11px] font-semibold text-slate-500">
            🔒 Field Joiners are onboarded by Admin
          </p>
        </div>
      </div>
    </div>
  );
};
