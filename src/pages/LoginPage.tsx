import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { loginAdmin, isDatabaseConnected } = useApp();

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
      await loginAdmin(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Access Denied: Invalid credentials or unauthorized admin account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuperAdminLogin = async () => {
    setEmail('admin@farmerbox.com');
    setPassword('Admin@123');
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginAdmin('admin@farmerbox.com', 'Admin@123');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between select-none font-sans text-slate-800 relative overflow-y-auto">
      
      {/* Top Background Ambient Banner */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#15803d] via-emerald-800 to-slate-900 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 px-4 sm:px-6 py-3 sm:py-4 max-w-5xl mx-auto w-full flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="/farmerbox_app_icon.png"
            alt="FarmerBoxs Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white p-1 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-black text-base sm:text-lg tracking-tight leading-none text-white">FarmerBoxs</h1>
              <span className="text-[9px] sm:text-[10px] bg-white/20 text-white font-mono font-bold px-1.5 py-0.2 rounded">v2.5</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-100 font-medium mt-0.5">Farm Fresh to Your Door</p>
          </div>
        </div>

        {/* Security & Cloud Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[10px] sm:text-[11px]">
            <span className={`w-2 h-2 rounded-full ${isDatabaseConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
            <span>{isDatabaseConnected ? 'System Secured' : 'Active'}</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-200 overflow-hidden">
          
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-[#15803d] p-4 sm:p-6 text-white text-center relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1 shadow-lg mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              <img
                src="/farmerbox_app_icon.png"
                alt="FarmerBox"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-[10px] sm:text-[10.5px] font-bold text-emerald-200 mb-1">
              <KeyRound className="w-3 h-3 text-emerald-300" />
              <span>Administrative Portal</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Super Admin Sign In</h2>
            <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5 sm:mt-1">
              FarmerBox Operations & Supply Chain Console
            </p>
          </div>

          <div className="p-4 sm:p-7 space-y-4 sm:space-y-5">
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
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>256-bit Encrypted</span>
                </span>
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

              {/* 1-Click Fast Login as Pushpak Wani (Super Admin) */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleQuickSuperAdminLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                      alt="Pushpak Wani"
                      className="w-6 h-6 rounded-full object-cover border border-emerald-600 shrink-0"
                    />
                    <div className="text-left leading-tight">
                      <p className="font-extrabold text-slate-900 text-[11px]">Pushpak Wani</p>
                      <p className="text-[9.5px] text-emerald-700 font-semibold">Super Admin (1-Click Login)</p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </form>

          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-10 p-4 text-center text-slate-400 text-[11px] border-t border-slate-200 bg-white">
        © 2026 FarmerBox Technologies Private Limited • Super Admin Console Governed by Pushpak Wani
      </footer>
    </div>
  );
};
