import React from 'react';
import { ArrowLeft, ShieldCheck, UserCheck, Key, LogIn, PhoneCall, HelpCircle } from 'lucide-react';
import { useJoinerApp } from '../JoinerAppContext';

export const RegisterScreen: React.FC = () => {
  const { setCurrentScreen } = useJoinerApp();

  return (
    <div className="flex flex-col h-full bg-slate-50 select-none">
      {/* Top Header */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shadow-2xs">
        <button
          onClick={() => setCurrentScreen('LOGIN')}
          className="p-1 -ml-1 text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/images/farmerbox_brand_logo.png"
            alt="FarmerBox"
            className="w-6 h-6 object-contain rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/farmerbox_partner_logo.png';
            }}
          />
          <span className="font-black text-sm text-[#0D472B] tracking-tight">FarmerBox Partner</span>
        </div>
        <div className="w-5"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4 pt-2">
          {/* Hero Card */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3 border border-rose-200">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">Self-Registration Closed</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Public registration for <strong>Hotel Joiners</strong> is not available. Accounts are strictly registered, assigned to zones, and activated by <strong>FarmerBox Administration</strong>.
            </p>
          </div>

          {/* How to Get Access */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>How to Get Access:</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
                  1
                </span>
                <p className="text-[11.5px] leading-snug">
                  Contact FarmerBox Admin via email or support phone to request partner onboarding.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
                  2
                </span>
                <p className="text-[11.5px] leading-snug">
                  Admin adds your profile, registers your mobile number, and assigns your active operational Zone.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
                  3
                </span>
                <p className="text-[11.5px] leading-snug">
                  Log in directly on the Login screen using your registered 10-digit mobile number and password.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Support Contact Box */}
          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start gap-2.5">
            <PhoneCall className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                FarmerBox Support & Admin Contact:
              </p>
              <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                📞 +91 98765 43210 &nbsp;|&nbsp; ✉️ admin@farmerbox.in
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login Button */}
        <div className="pt-4">
          <button
            onClick={() => setCurrentScreen('LOGIN')}
            className="w-full py-3.5 bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
          >
            <LogIn className="w-4 h-4" />
            <span>Go to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
