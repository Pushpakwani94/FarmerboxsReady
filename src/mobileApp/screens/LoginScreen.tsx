import React, { useState } from 'react';
import {
  Lock,
  Smartphone,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useJoinerApp } from '../JoinerAppContext';

export const LoginScreen: React.FC = () => {
  const { loginUser } = useJoinerApp();

  // Username / Mobile & Password State
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearFeedback = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Password Login Submission
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const cleanInput = usernameOrPhone.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter your registered username or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(cleanInput, password);
      setSuccessMessage('Logged in successfully! Opening dashboard...');
    } catch (err: any) {
      setErrorMessage(err.message || 'Access Denied: Username or password is not present in database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFDFB] select-none justify-between overflow-y-auto overflow-x-hidden relative">
      {/* Top Header with Brand Logo */}
      <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center space-y-2">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xs border border-emerald-100 bg-white p-1">
          <img
            src="/images/farmerbox_brand_logo.png"
            alt="FarmerBox"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/farmerbox_partner_logo.png';
            }}
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            Hotel Joiner Login
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            FarmerBox Field Partner Network
          </p>
        </div>
      </div>

      {/* Main Form Sheet */}
      <div className="flex-1 bg-white rounded-t-3xl border-t border-slate-100 shadow-lg p-6 flex flex-col justify-between space-y-4">
        
        {/* Error / Success Feedback Banners */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-bold leading-tight">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* Dedicated Password Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
          {/* Username / Mobile Number */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Registered Mobile Number or Username <span className="text-rose-500">*</span>
            </label>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 bg-white">
              <span className="px-3.5 py-3 bg-slate-50 text-slate-500 font-bold border-r border-slate-200 text-xs flex items-center gap-1 shrink-0">
                {/^\d+$/.test(usernameOrPhone.trim()) ? (
                  <span className="text-slate-700 font-bold">+91</span>
                ) : (
                  <User className="w-4 h-4 text-emerald-600" />
                )}
              </span>
              <input
                type="text"
                placeholder="10-digit mobile number or username"
                value={usernameOrPhone}
                onChange={(e) => {
                  clearFeedback();
                  setUsernameOrPhone(e.target.value);
                }}
                required
                className="flex-1 px-3 py-3 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Password</span>
                <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 bg-white">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter login password (e.g. FarmerBox@123)"
                value={password}
                onChange={(e) => {
                  clearFeedback();
                  setPassword(e.target.value);
                }}
                required
                className="w-full pl-3.5 pr-10 py-3 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-1">
              Default password provided by Admin is <span className="font-mono font-semibold text-slate-600">FarmerBox@123</span>
            </p>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 text-xs font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-[#15803d]"
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          {/* Login Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#15803d] hover:bg-[#166534] active:scale-[0.99] disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Signing In...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Sign In to Dashboard
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Admin Onboarding Info Notice */}
        <div className="pt-4 pb-1 border-t border-slate-100 text-center space-y-1">
          <p className="text-[11px] font-bold text-slate-700">
            Need Joiner Account Access?
          </p>
          <p className="text-[10.5px] text-slate-500 leading-relaxed px-2">
            Joiner accounts are created and activated directly by the <strong>FarmerBox Administrator</strong>. Contact admin to receive your login mobile number and PIN.
          </p>
        </div>
      </div>
    </div>
  );
};
