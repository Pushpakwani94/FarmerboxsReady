import React, { useState, useEffect, useRef } from 'react';
import {
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
  Calendar,
  Lock,
  Clock,
  Laptop,
  Check,
  Award,
  Bell,
  Sliders,
  FileText,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  LogOut,
  Upload
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminProfilePage: React.FC = () => {
  const { adminProfile, updateAdminProfile, logoutAdmin } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: adminProfile.name,
    email: adminProfile.email,
    phone: adminProfile.phone,
    avatar: adminProfile.avatar,
    location: adminProfile.location,
    department: adminProfile.department,
    zone: adminProfile.zone,
    bio: adminProfile.bio || 'Overseeing daily vegetable supply chain operations, hotel partner onboardings, and automated driver dispatch across Pune metropolitan area.',
    emergencyContact: adminProfile.emergencyContact || '+91 98220 11223 (Operations Manager)',
    timezone: adminProfile.timezone || '(GMT+05:30) Asia/Kolkata',
    language: adminProfile.language || 'English (India)'
  });

  useEffect(() => {
    setFormData({
      name: adminProfile.name,
      email: adminProfile.email,
      phone: adminProfile.phone,
      avatar: adminProfile.avatar,
      location: adminProfile.location,
      department: adminProfile.department,
      zone: adminProfile.zone,
      bio: adminProfile.bio || 'Overseeing daily vegetable supply chain operations, hotel partner onboardings, and automated driver dispatch across Pune metropolitan area.',
      emergencyContact: adminProfile.emergencyContact || '+91 98220 11223 (Operations Manager)',
      timezone: adminProfile.timezone || '(GMT+05:30) Asia/Kolkata',
      language: adminProfile.language || 'English (India)'
    });
  }, [adminProfile]);

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });

  const [activeSettingsTab, setActiveSettingsTab] = useState<'PERSONAL' | 'SECURITY' | 'NOTIFICATIONS'>('PERSONAL');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('Profile successfully updated!');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

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
        triggerToast('Profile photo updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatar: formData.avatar,
      location: formData.location,
      department: formData.department,
      zone: formData.zone,
      bio: formData.bio,
      emergencyContact: formData.emergencyContact,
      timezone: formData.timezone,
      language: formData.language
    });
    triggerToast('Profile successfully updated and saved!');
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.newPass || !passwords.confirmPass) {
      alert('Please fill all password fields');
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
    setPasswords({ current: '', newPass: '', confirmPass: '' });
    triggerToast('Password successfully changed!');
  };

  const handleApplyCustomAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    setFormData(prev => ({ ...prev, avatar: customAvatarUrl.trim() }));
    updateAdminProfile({ avatar: customAvatarUrl.trim() });
    setShowCustomAvatarInput(false);
    setCustomAvatarUrl('');
    triggerToast('Profile avatar updated!');
  };

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6 select-none">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-5 right-6 z-50 px-4 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Profile</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your personal profile, security credentials, and system administrator settings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => logoutAdmin()}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 font-bold rounded-xl flex items-center gap-2 cursor-pointer text-xs transition-all shadow-2xs self-start sm:self-auto"
          title="Sign Out / Logout to Login Page"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Admin</span>
        </button>
      </div>

      {/* Top Metric Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Access Level</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-1">Super Admin</h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Full System Authority</p>
          </div>
        </div>

        <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Account Status</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-1">Verified Active</h3>
            <p className="text-[10px] text-sky-700 font-semibold mt-1">2FA Protected</p>
          </div>
        </div>

        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Assigned Zone</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-1">{adminProfile.zone || 'All Zones (HQ)'}</h3>
            <p className="text-[10px] text-purple-700 font-semibold mt-1">Pune Central HQ</p>
          </div>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Session Uptime</p>
            <h3 className="text-xl font-black text-slate-900 leading-none mt-1">6h 45m</h3>
            <p className="text-[10px] text-amber-700 font-semibold mt-1">Last Login: Today 09:15 AM</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Profile Card & Right Column Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs text-center space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative inline-block mx-auto group cursor-pointer"
              title="Click to Upload New Photo"
            >
              <img
                src={adminProfile.avatar || formData.avatar}
                alt={adminProfile.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-emerald-100 shadow-md mx-auto group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="w-6 h-6" />
              </div>
              <div className="absolute bottom-0 right-1 w-8 h-8 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-white hover:scale-105 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{adminProfile.name}</h3>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">{adminProfile.role || 'Super Admin'}</p>
              <p className="text-[11px] text-slate-500 font-medium">{adminProfile.department || 'Operations & Management'}</p>
            </div>

            {/* Quick Contact & Zone Info List */}
            <div className="pt-3 border-t border-slate-100 text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900 truncate">{adminProfile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900">{adminProfile.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900">{adminProfile.department}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900">{adminProfile.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="font-semibold text-slate-900">{adminProfile.zone}</span>
              </div>
              {adminProfile.emergencyContact && (
                <div className="flex items-center gap-2 text-slate-600">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-800">{adminProfile.emergencyContact}</span>
                </div>
              )}
            </div>

            {/* Bio Box */}
            <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed italic">
              "{adminProfile.bio || formData.bio}"
            </div>

            {/* Quick Avatar Selector */}
            <div className="pt-3 border-t border-slate-100 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-800 font-bold text-xs">Profile Photo</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-3 h-3" /> Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                    className="text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <LinkIcon className="w-3 h-3" /> URL
                  </button>
                </div>
              </div>

              {showCustomAvatarInput && (
                <form onSubmit={handleApplyCustomAvatar} className="flex gap-1.5 animate-in fade-in">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={customAvatarUrl}
                    onChange={e => setCustomAvatarUrl(e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}

              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {avatarOptions.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, avatar: av }));
                      updateAdminProfile({ avatar: av });
                      triggerToast('Avatar updated!');
                    }}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform cursor-pointer shrink-0 ${
                      adminProfile.avatar === av
                        ? 'border-[#15803d] ring-2 ring-emerald-300 scale-105 shadow-xs'
                        : 'border-slate-200 hover:border-slate-400 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="Option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Device & Session Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Laptop className="w-4 h-4 text-slate-500" /> Current Login Session
            </h4>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Browser / Platform</span>
                <span className="font-bold text-slate-800">Chrome (Windows 11)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IP Address</span>
                <span className="font-mono text-slate-800 font-semibold">192.168.1.104</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-bold text-slate-800">Pune, MH, India</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authentication</span>
                <span className="text-emerald-700 font-bold">2-Factor Authenticated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Interactive Forms */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6 text-xs font-bold">
            <button
              onClick={() => setActiveSettingsTab('PERSONAL')}
              className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSettingsTab === 'PERSONAL'
                  ? 'border-[#15803d] text-[#15803d]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" /> Personal Information
            </button>
            <button
              onClick={() => setActiveSettingsTab('SECURITY')}
              className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSettingsTab === 'SECURITY'
                  ? 'border-[#15803d] text-[#15803d]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" /> Password & Security
            </button>
            <button
              onClick={() => setActiveSettingsTab('NOTIFICATIONS')}
              className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSettingsTab === 'NOTIFICATIONS'
                  ? 'border-[#15803d] text-[#15803d]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" /> Notifications & Alerts
            </button>
          </div>

          <div className="p-6">
            {/* 1. PERSONAL INFORMATION */}
            {activeSettingsTab === 'PERSONAL' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Admin Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Department / Organization</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">HQ Office Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary Operational Zone</label>
                    <input
                      type="text"
                      value={formData.zone}
                      onChange={e => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Admin Bio / Responsibility Scope</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    >
                      <option value="(GMT+05:30) Asia/Kolkata">(GMT+05:30) Asia/Kolkata (India Standard Time)</option>
                      <option value="(GMT+04:00) Asia/Dubai">(GMT+04:00) Asia/Dubai (Gulf Standard Time)</option>
                      <option value="(GMT+00:00) UTC">(GMT+00:00) UTC (Universal Coordinated Time)</option>
                      <option value="(GMT-05:00) America/New_York">(GMT-05:00) Eastern Time (US & Canada)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Emergency Escalation Contact</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer text-xs"
                  >
                    <Save className="w-4 h-4" /> Save Profile Details
                  </button>
                </div>
              </form>
            )}

            {/* 2. PASSWORD & SECURITY */}
            {activeSettingsTab === 'SECURITY' && (
              <form onSubmit={handlePasswordUpdate} className="space-y-4 text-xs">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-amber-900">
                  <div className="flex items-center gap-2 font-bold">
                    <Shield className="w-4 h-4 text-amber-600" /> Password Security Guidelines
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Use at least 8 characters with upper & lowercase letters, numbers, and symbols. Never share your Super Admin password.
                  </p>
                </div>

                <div className="space-y-3 max-w-lg">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Current Password *</label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="Enter current password"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">New Password *</label>
                    <input
                      type="password"
                      value={passwords.newPass}
                      onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                      placeholder="At least 6 characters"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      value={passwords.confirmPass}
                      onChange={e => setPasswords({ ...passwords, confirmPass: e.target.value })}
                      placeholder="Repeat new password"
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-[#15803d]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer text-xs"
                  >
                    <Key className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </form>
            )}

            {/* 3. NOTIFICATIONS & ALERTS */}
            {activeSettingsTab === 'NOTIFICATIONS' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900">
                  <h4 className="font-bold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-700" /> Admin Alert Preferences
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Select which events trigger push notifications, SMS alerts, and email summaries.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'New Hotel Registration Alert', desc: 'Notify immediately when a new hotel signs up via joiner', defaultChecked: true },
                    { title: 'Large Order Alerts (> ₹15,000)', desc: 'Real-time alert for high-value orders needing fleet prioritization', defaultChecked: true },
                    { title: 'Weekly Joiner Commission Disbursal Summary', desc: 'Receive payout status report every Monday morning', defaultChecked: true },
                    { title: 'Critical Stock / Mandi Price Volatility', desc: 'Alert when onion/potato wholesale rates shift by > 15%', defaultChecked: true },
                    { title: 'Driver Delivery Delay Escalations', desc: 'Notify if a delivery is delayed by more than 30 minutes', defaultChecked: false }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs">{item.title}</h5>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={item.defaultChecked}
                        className="w-4 h-4 accent-[#15803d] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 2500);
                    }}
                    className="px-6 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer text-xs"
                  >
                    <Save className="w-4 h-4" /> Save Alert Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
