import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  Key,
  CheckCircle2,
  Save,
  Camera,
  LogOut,
  ExternalLink,
  Eye,
  EyeOff,
  Activity,
  Calendar,
  Lock,
  Globe,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Check,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminProfileModal: React.FC = () => {
  const {
  isAdminProfileOpen,
  setIsAdminProfileOpen,
  adminProfile,
  updateAdminProfile,
  setActiveTab,
  logoutAdmin
} = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'DETAILS' | 'SECURITY' | 'PERMISSIONS' | 'ACTIVITY'>('DETAILS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: adminProfile.name || 'Pushpak Wani',
    email: adminProfile.email || 'admin@farmerbox.com',
    phone: adminProfile.phone || '+91 98765 43210',
    avatar: adminProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    location: adminProfile.location || 'Pune, Maharashtra',
    department: adminProfile.department || 'Operations & Management',
    zone: adminProfile.zone || 'All Zones (HQ)'
  });

  useEffect(() => {
    if (adminProfile) {
      setFormData({
        name: adminProfile.name || 'Pushpak Wani',
        email: adminProfile.email || 'admin@farmerbox.com',
        phone: adminProfile.phone || '+91 98765 43210',
        avatar: adminProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        location: adminProfile.location || 'Pune, Maharashtra',
        department: adminProfile.department || 'Operations & Management',
        zone: adminProfile.zone || 'All Zones (HQ)'
      });
    }
  }, [adminProfile, isAdminProfileOpen]);

  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Status message
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAdminProfileOpen) return null;

  const avatarOptions = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=300'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (base64) {
        setFormData(prev => ({ ...prev, avatar: base64 }));
        updateAdminProfile({ avatar: base64 });
        setSuccessMsg('Profile photo updated successfully!');
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    setFormData(prev => ({ ...prev, avatar: customAvatarUrl.trim() }));
    updateAdminProfile({ avatar: customAvatarUrl.trim() });
    setShowCustomUrlInput(false);
    setCustomAvatarUrl('');
    setSuccessMsg('Profile photo link applied successfully!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile(formData);
    setSuccessMsg('Profile details updated successfully!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.newPass || !passwords.confirmPass) {
      alert('Please fill out all password fields');
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      alert('New passwords do not match');
      return;
    }
    if (passwords.newPass.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setSuccessMsg('Password updated successfully!');
    setPasswords({ current: '', newPass: '', confirmPass: '' });
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleGoToFullProfile = () => {
    setIsAdminProfileOpen(false);
    setActiveTab('Profile');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 text-white relative border-b border-emerald-800/40 select-none">
          {/* Decorative ambient lights */}
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => setIsAdminProfileOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
            {/* Avatar with Status Ring & Upload Trigger */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group shrink-0 cursor-pointer"
              title="Click to Upload New Profile Photo"
            >
              <img
                src={formData.avatar}
                alt={formData.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-emerald-400/80 shadow-lg shadow-black/40 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-xs text-white">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-1 text-left min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold tracking-tight text-white">{adminProfile.name || 'Pushpak Wani'}</h2>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {adminProfile.role || 'Super Admin'}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                {adminProfile.email} • <span className="text-emerald-300">{adminProfile.department}</span>
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-400">
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/80">
                  <MapPin className="w-3 h-3 text-emerald-400" /> {adminProfile.location || 'Pune, Maharashtra'}
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/80">
                  <Globe className="w-3 h-3 text-emerald-400" /> {adminProfile.zone || 'All Zones (HQ)'}
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/80">
                  <Calendar className="w-3 h-3 text-emerald-400" /> Joined {adminProfile.joinedDate || 'Jan 2025'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Sub-Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/90 px-4 sm:px-6 text-xs font-bold gap-1 overflow-x-auto select-none">
          <button
            onClick={() => setActiveSubTab('DETAILS')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'DETAILS'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Personal Info
          </button>
          <button
            onClick={() => setActiveSubTab('SECURITY')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'SECURITY'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Security & Password
          </button>
          <button
            onClick={() => setActiveSubTab('PERMISSIONS')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'PERMISSIONS'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Role Privileges
          </button>
          <button
            onClick={() => setActiveSubTab('ACTIVITY')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'ACTIVITY'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Activity Log
          </button>
        </div>

        {/* Notification Toast */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* 1. PERSONAL INFO TAB */}
          {activeSubTab === 'DETAILS' && (
            <form onSubmit={handleSaveDetails} className="space-y-4 text-left">
              
              {/* Avatar Selector Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>Change Profile Photo</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Upload className="w-3 h-3" /> Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomUrlInput(prev => !prev)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <LinkIcon className="w-3 h-3" /> Link
                    </button>
                  </div>
                </div>

                {/* Custom URL Input Accordion */}
                {showCustomUrlInput && (
                  <div className="flex gap-2 animate-in fade-in duration-150">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={customAvatarUrl}
                      onChange={e => setCustomAvatarUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Preset Avatars Selection */}
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold mb-1.5">Or choose a preset avatar:</p>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {avatarOptions.map((av, idx) => {
                      const isSelected = formData.avatar === av;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, avatar: av }));
                            updateAdminProfile({ avatar: av });
                            setSuccessMsg('Avatar updated!');
                            setTimeout(() => setSuccessMsg(''), 2000);
                          }}
                          className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 ring-2 ring-emerald-400/50 scale-105 shadow-xs'
                              : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                          }`}
                          title={`Select Avatar ${idx + 1}`}
                        >
                          <img src={av} alt="Avatar option" className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                              <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Office Location</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Operational Zone</label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.zone}
                      onChange={e => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleGoToFullProfile}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Full Profile Page
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminProfileOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. SECURITY & PASSWORD TAB */}
          {activeSubTab === 'SECURITY' && (
            <form onSubmit={handleSavePassword} className="space-y-4 text-left">
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Shield className="w-4 h-4 text-amber-600" /> Account Security Guidance
                </div>
                <p className="text-[11px] text-amber-700">
                  Ensure your password has at least 6 characters with a combination of uppercase letters, numbers, and symbols.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                      required
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">New Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.newPass}
                      onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                      required
                      placeholder="At least 6 chars"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Confirm New Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.confirmPass}
                      onChange={e => setPasswords({ ...passwords, confirmPass: e.target.value })}
                      required
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Two-Factor Authentication Status */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Two-Factor Authentication (2FA)</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Extra security layer for super admin logins</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-lg text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled via SMS
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminProfileOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> Update Password
                </button>
              </div>
            </form>
          )}

          {/* 3. ROLE PERMISSIONS TAB */}
          {activeSubTab === 'PERMISSIONS' && (
            <div className="space-y-3 text-left">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-blue-900">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Super Admin Access Scope
                </h4>
                <p className="text-[11px] text-blue-700 mt-1">
                  You possess full administrative privileges with read, write, update, and deletion rights across all operations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { title: 'Hotels & Onboarding', desc: 'Create, verify and approve hotel partner accounts' },
                  { title: 'Joiners & Commissions', desc: 'Manage commission rates, payouts, and joiner performance' },
                  { title: 'Orders & Dispatch', desc: 'Create, assign, monitor, and override daily delivery orders' },
                  { title: 'Product & Pricing', desc: 'Manage mandi stock, daily wholesale prices, categories' },
                  { title: 'Delivery Fleet', desc: 'Driver allocation, live route monitoring, proof of delivery' },
                  { title: 'Financial Settlements', desc: 'Weekly payout batching, ledger logs, dispute resolution' },
                  { title: 'System Configurations', desc: 'Manage platform branding, zones, user roles, backups' },
                  { title: 'Data Export & Reports', desc: 'Export full database records, GST invoices, CSV sheets' }
                ].map((perm, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{perm.title}</h5>
                      <p className="text-[10.5px] text-slate-500 font-medium leading-tight mt-0.5">{perm.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. ACTIVITY LOG TAB */}
          {activeSubTab === 'ACTIVITY' && (
            <div className="space-y-2.5 text-left">
              {[
                { action: 'Updated onion wholesale price to ₹32/kg', time: '10 mins ago', category: 'Inventory', badge: 'bg-emerald-100 text-emerald-800' },
                { action: 'Approved weekly commission payout of ₹45,200', time: '1 hour ago', category: 'Finance', badge: 'bg-blue-100 text-blue-800' },
                { action: 'Verified new hotel: Hotel Taj Vivanta (Kharadi)', time: '3 hours ago', category: 'Hotels', badge: 'bg-purple-100 text-purple-800' },
                { action: 'Assigned 8 delivery orders to Driver Nilesh Shinde', time: '5 hours ago', category: 'Dispatch', badge: 'bg-amber-100 text-amber-800' },
                { action: 'Created new operational zone: Undri Zone', time: 'Yesterday at 04:20 PM', category: 'Zones', badge: 'bg-teal-100 text-teal-800' },
                { action: 'Exported monthly sales GST report (PDF/Excel)', time: 'Yesterday at 11:30 AM', category: 'Reports', badge: 'bg-slate-100 text-slate-800' }
              ].map((log, idx) => (
                <div key={idx} className="p-3 bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 text-xs">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{log.time}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.badge}`}>
                    {log.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer with Redesigned Sign Out Pill */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active Session: <strong className="text-slate-700">FB-ADMIN-8921</strong></span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAdminProfileOpen(false);
              logoutAdmin();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
