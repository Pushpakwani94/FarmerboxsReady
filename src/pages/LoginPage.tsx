import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { loginAdmin, isDatabaseConnected } = useApp();

  // Login Form State with saved email & remember-me restoration
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('farmerbox_saved_email') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('farmerbox_remember_me');
      return stored === 'true';
    }
    return false;
  });

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your admin email or phone number.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginAdmin(email.trim(), password, rememberMe);
    } catch (err: any) {
      setErrorMsg(err.message || 'Access Denied: Invalid credentials or unauthorized admin account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between select-none font-sans text-slate-800 relative overflow-y-auto">
      
      {/* Top Background Ambient Banner */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#15803d] via-emerald-800 to-slate-900 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 px-4 sm:px-6 py-3.5 sm:py-4 max-w-5xl mx-auto w-full flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <img
            src="/farmerbox_app_icon.png"
            alt="FarmerBoxs Logo"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-contain bg-white p-1.5 shadow-lg shrink-0 border border-white/20"
          />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-black text-lg sm:text-xl tracking-tight leading-none text-white">FarmerBoxs</h1>
              <span className="text-[10px] bg-white/20 text-white font-mono font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">v2.5</span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5">Farm Fresh to Your Door</p>
          </div>
        </div>

        {/* Security & Cloud Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[11px] sm:text-xs shadow-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${isDatabaseConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
            <span>{isDatabaseConnected ? 'System Secured' : 'Active'}</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-950/20 border border-slate-200 overflow-hidden">
          
          {/* Card Top Banner with Big Prominent Logo */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#15803d] p-6 sm:p-7 text-white text-center relative">
            {/* Big Centered FarmerBox Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2.5 shadow-2xl mx-auto mb-3.5 flex items-center justify-center border-2 border-white/90 ring-4 ring-white/20 transition-transform duration-300 hover:scale-105">
              <img
                src="/farmerbox_app_icon.png"
                alt="FarmerBox Big Logo"
                className="w-full h-full object-contain rounded-2xl drop-shadow-sm"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-400/40 text-[11px] font-bold text-emerald-200 mb-1.5 shadow-inner">
              <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
              <span>Administrative Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Super Admin Sign In</h2>
            <p className="text-xs text-emerald-100 font-medium mt-1">
              FarmerBox Operations & Supply Chain Console
            </p>
          </div>

          <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* ADMIN SIGN IN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Admin Email / Mobile</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@farmerbox.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-slate-600 font-medium">Keep me signed in</span>
                </label>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#15803d] hover:bg-[#166534] disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Admin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-10 p-4 text-center text-slate-400 text-[11px] border-t border-slate-200 bg-white">
        © 2026 FarmerBox Technologies Private Limited • Super Admin Operations Console create by CanaryTechsys
      </footer>
    </div>
  );
};
