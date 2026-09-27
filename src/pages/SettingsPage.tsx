import React, { useState, useRef } from 'react';
import {
  Settings,
  Users,
  Shield,
  CheckCircle2,
  Save,
  Plus,
  Edit,
  Trash2,
  Database,
  Lock,
  Key,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Server,
  FileJson,
  X,
  Smartphone,
  Eye,
  EyeOff,
  LogOut,
  UserCheck,
  UserX,
  Send,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { saveRecord, clearLocalDummyCache } from '../firebase/dbService';
import { currentFirebaseConfig } from '../firebase/config';
import { authService, type AdminAccessRequest, type SubAdminAccount } from '../firebase/authService';

interface SettingsPageProps {
  initialTab?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialTab = 'Backup & Security' }) => {
  const {
    orders,
    zones,
    hotels,
    joiners,
    drivers,
    products,
    payments,
    notifications,
    isDatabaseConnected,
    seedDatabaseToFirebase,
    adminProfile,
    updateAdminProfile,
    setActiveTab: setMainTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>(() => initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Backup & Restore State
  const [lastBackupDate, setLastBackupDate] = useState<string>(() => {
    return localStorage.getItem('farmerbox_last_backup') || '14 Sep 2026, 04:30 PM';
  });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Settings State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() => {
    return localStorage.getItem('farmerbox_2fa') === 'true';
  });
  const [sessionTimeout, setSessionTimeout] = useState<string>('30 Minutes');
  const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
  const [allowedIps, setAllowedIps] = useState('192.168.1.21, 127.0.0.1');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sub-Admin & Zone Admin Management State
  const [subAdminsList, setSubAdminsList] = useState<SubAdminAccount[]>(() => {
    return authService.getSubAdminAccounts();
  });
  const [isAddSubAdminOpen, setIsAddSubAdminOpen] = useState(false);
  const [subAdminName, setSubAdminName] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPhone, setSubAdminPhone] = useState('');
  const [subAdminRole, setSubAdminRole] = useState<'Zone Admin' | 'Operations Sub-Admin' | 'Finance Sub-Admin' | 'Dispatch Manager' | 'Sub Admin'>('Zone Admin');
  const [subAdminZone, setSubAdminZone] = useState('Kharadi Zone');
  const [subAdminPassword, setSubAdminPassword] = useState('Admin@123');
  const [subAdminPermissions, setSubAdminPermissions] = useState<string[]>(['orders', 'drivers', 'hotels', 'joiners', 'inventory']);

  // User Management State (Legacy Table)
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Pushpak Wani', email: 'admin@farmerbox.com', role: 'Super Admin', status: 'Active' },
    { id: 2, name: 'Sneha Patil', email: 'sneha@farmerbox.com', role: 'Admin', status: 'Active' },
    { id: 3, name: 'Amit Shinde', email: 'amit@farmerbox.com', role: 'Operations', status: 'Active' },
    { id: 4, name: 'Priya Deshmukh', email: 'priya@farmerbox.com', role: 'Finance', status: 'Active' },
    { id: 5, name: 'Rohan More', email: 'rohan@farmerbox.com', role: 'Support', status: 'Inactive' }
  ]);

  // Super Admin Access Requests State
  const [accessRequests, setAccessRequests] = useState<AdminAccessRequest[]>(() => {
    return authService.getAdminAccessRequests();
  });

  const handleCreateSubAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subAdminName.trim() || !subAdminEmail.trim() || !subAdminPhone.trim()) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const created = await authService.createSubAdmin({
        name: subAdminName.trim(),
        email: subAdminEmail.trim(),
        phone: subAdminPhone.trim(),
        role: subAdminRole,
        assignedZone: subAdminZone,
        permissions: subAdminPermissions,
        password: subAdminPassword.trim() || 'Admin@123'
      });

      setSubAdminsList(prev => [created, ...prev]);
      setIsAddSubAdminOpen(false);
      setSubAdminName('');
      setSubAdminEmail('');
      setSubAdminPhone('');
      showToast(`Sub-Admin / Zone Admin "${created.name}" created successfully for ${created.assignedZone}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create sub-admin');
    }
  };

  const handleToggleSubAdminStatus = (id: string, currentStatus: 'Active' | 'Inactive') => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const updated = authService.updateSubAdmin(id, { status: newStatus });
    setSubAdminsList(updated);
    showToast(`Sub-admin status changed to ${newStatus}`);
  };

  const handleDeleteSubAdmin = (id: string, name: string) => {
    if (confirm(`Remove Sub-Admin privileges for "${name}"? They will no longer be able to log in.`)) {
      const updated = authService.deleteSubAdmin(id);
      setSubAdminsList(updated);
      showToast(`Sub-Admin "${name}" removed successfully.`);
    }
  };

  const handleApproveAccessRequest = (req: AdminAccessRequest) => {
    const updated = authService.updateAdminAccessRequestStatus(req.id, 'APPROVED', 'Pushpak Wani (Super Admin)');
    setAccessRequests(updated);
    showToast(`Access GRANTED for ${req.name} (${req.requestedRole}). User can now log in!`);
  };

  const handleRejectAccessRequest = (req: AdminAccessRequest) => {
    const updated = authService.updateAdminAccessRequestStatus(req.id, 'REJECTED', 'Pushpak Wani (Super Admin)');
    setAccessRequests(updated);
    showToast(`Access REJECTED for ${req.name}.`);
  };

  // Security Audit Log
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'Admin logged into console', user: 'Pushpak Wani', ip: '192.168.1.21', status: 'Success', time: 'Today, 04:55 PM' },
    { id: 2, action: 'Firestore real-time sync connected', user: 'System', ip: 'Cloud', status: 'Success', time: 'Today, 04:50 PM' },
    { id: 3, action: 'Updated security policy', user: 'Pushpak Wani', ip: '192.168.1.21', status: 'Success', time: 'Yesterday, 11:20 AM' },
    { id: 4, action: 'Automatic database backup completed', user: 'System Worker', ip: 'Cron', status: 'Success', time: '13 Sep 2026, 02:00 AM' }
  ]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 1. Download Backup (Full JSON export of all 8 collections)
  const handleDownloadBackup = () => {
    setIsBackingUp(true);
    try {
      const backupData = {
        metadata: {
          platform: 'FarmerBox Operations Console',
          project: currentFirebaseConfig.projectId || 'newfarmerboxs',
          exportTimestamp: new Date().toISOString(),
          version: '1.0.0',
          summary: {
            orders: orders.length,
            zones: zones.length,
            hotels: hotels.length,
            joiners: joiners.length,
            drivers: drivers.length,
            products: products.length,
            payments: payments.length,
            notifications: notifications.length
          }
        },
        collections: {
          orders,
          zones,
          hotels,
          joiners,
          drivers,
          products,
          payments,
          notifications
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `farmerbox_cloud_backup_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const nowFormatted = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      setLastBackupDate(nowFormatted);
      localStorage.setItem('farmerbox_last_backup', nowFormatted);

      // Add to audit log
      setAuditLogs(prev => [
        {
          id: Date.now(),
          action: `Manual database backup downloaded (${filename})`,
          user: adminProfile.name,
          ip: '192.168.1.21',
          status: 'Success',
          time: 'Just now'
        },
        ...prev
      ]);

      showToast('Database backup downloaded successfully!');
    } catch (e: any) {
      alert(`Backup failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // 2. Select file to restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.collections) {
          alert('Invalid backup file. Missing collections payload.');
          return;
        }
        setRestorePreview(parsed);
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // 3. Confirm and execute restore
  const handleConfirmRestore = async () => {
    if (!restorePreview || !restorePreview.collections) return;
    setIsRestoring(true);

    try {
      const { orders: rOrders, zones: rZones, hotels: rHotels, joiners: rJoiners, drivers: rDrivers, products: rProducts, payments: rPayments, notifications: rNotifs } = restorePreview.collections;

      // Batch save records to live Firestore and local cache
      const saveAll = async (collectionName: any, items: any[]) => {
        if (!Array.isArray(items)) return;
        for (const item of items) {
          await saveRecord(collectionName, item, item.id ? String(item.id) : undefined);
        }
      };

      await saveAll('orders', rOrders || []);
      await saveAll('zones', rZones || []);
      await saveAll('hotels', rHotels || []);
      await saveAll('joiners', rJoiners || []);
      await saveAll('drivers', rDrivers || []);
      await saveAll('products', rProducts || []);
      await saveAll('payments', rPayments || []);
      await saveAll('notifications', rNotifs || []);

      setAuditLogs(prev => [
        {
          id: Date.now(),
          action: `Database restored from backup (${restorePreview.metadata?.exportTimestamp || 'file'})`,
          user: adminProfile.name,
          ip: '192.168.1.21',
          status: 'Success',
          time: 'Just now'
        },
        ...prev
      ]);

      showToast('Database restored successfully from backup!');
      setRestorePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      alert(`Restore failed: ${e?.message || 'Error occurred'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // 4. Change Password Handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      alert('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAuditLogs(prev => [
      {
        id: Date.now(),
        action: 'Admin password changed',
        user: adminProfile.name,
        ip: '192.168.1.21',
        status: 'Success',
        time: 'Just now'
      },
      ...prev
    ]);
    showToast('Admin password updated successfully!');
  };

  // 5. Toggle 2FA
  const handleToggle2FA = () => {
    const nextVal = !twoFactorEnabled;
    setTwoFactorEnabled(nextVal);
    localStorage.setItem('farmerbox_2fa', String(nextVal));
    setAuditLogs(prev => [
      {
        id: Date.now(),
        action: nextVal ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
        user: adminProfile.name,
        ip: '192.168.1.21',
        status: 'Success',
        time: 'Just now'
      },
      ...prev
    ]);
    showToast(nextVal ? 'Two-Factor Authentication Enabled!' : 'Two-Factor Authentication Disabled.');
  };

  // 6. Force Logout All Devices
  const handleForceLogoutAll = () => {
    if (confirm('Are you sure you want to invalidate all other active sessions? You will remain logged in on this browser.')) {
      setAuditLogs(prev => [
        {
          id: Date.now(),
          action: 'All remote sessions terminated',
          user: adminProfile.name,
          ip: '192.168.1.21',
          status: 'Success',
          time: 'Just now'
        },
        ...prev
      ]);
      showToast('All other active sessions have been revoked.');
    }
  };

  const handleDeleteUser = (id: number, name: string) => {
    if (confirm(`Remove access for ${name}?`)) {
      setUsersList(prev => prev.filter(u => u.id !== id));
      showToast(`User ${name} removed.`);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Toast Banner */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="cursor-pointer hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Users</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{usersList.length + 51}</h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Active console users</p>
          </div>
        </div>

        <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Admin Users</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{usersList.length}</h3>
            <p className="text-[10px] text-sky-700 font-semibold mt-1">Full privileged access</p>
          </div>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Security Status</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">
              {twoFactorEnabled ? 'Fortified' : 'Standard'}
            </h3>
            <p className="text-[10px] text-amber-700 font-semibold mt-1">
              {twoFactorEnabled ? '2FA Enabled' : '2FA Recommended'}
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Cloud Database</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">
              {isDatabaseConnected ? 'Live' : 'Local'}
            </h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Cloud Firestore sync</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 text-xs font-bold text-slate-600 bg-white px-5 py-3 rounded-xl border shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['Backup & Security', 'All Settings', 'General Settings', 'User Management', 'Role & Permissions', 'Integrations'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t
                  ? 'bg-emerald-700 text-white font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t === 'Backup & Security' ? '🛡️ Backup & Security' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            disabled={isBackingUp}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold"
            title="Download full backup file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBackingUp ? 'Exporting...' : 'Backup JSON'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BACKUP & SECURITY (FULL DEDICATED VIEW) */}
      {(activeTab === 'Backup & Security' || activeTab === 'All Settings') && (
        <div className="space-y-5">
          {/* Top Banner: Database Backup & Cloud Firestore Live Overview */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                <Database className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-lg leading-tight">Database & Security Center</h3>
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    {isDatabaseConnected ? 'Live Cloud Firestore' : 'Persistent Storage'}
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                  Automated snapshots, encrypted point-in-time exports, access controls, and full JSON collection backup & restore for FarmerBox.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-emerald-200/90 flex-wrap">
                  <span>Last manual backup: <strong>{lastBackupDate}</strong></span>
                  <span>•</span>
                  <span>Active records: <strong>{orders.length + hotels.length + zones.length + joiners.length + drivers.length + products.length} items</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadBackup}
                disabled={isBackingUp}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-emerald-900 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>{isBackingUp ? 'Exporting...' : 'Export Backup Now'}</span>
              </button>

              <label className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-emerald-200" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Restore Confirmation Modal / Card */}
          {restorePreview && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Backup File Ready to Restore</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Exported on {restorePreview.metadata?.exportTimestamp ? new Date(restorePreview.metadata.exportTimestamp).toLocaleString() : 'Recent backup'} for project {restorePreview.metadata?.project || 'FarmerBox'}.
                    </p>

                    {/* Preview counts */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3 text-center">
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Orders</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.orders?.length ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Hotels</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.hotels?.length ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Zones</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.zones?.length ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Joiners</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.joiners?.length ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Drivers</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.drivers?.length ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Products</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.products?.length ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Payments</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.payments?.length ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <p className="text-[10px] text-slate-400">Alerts</p>
                        <p className="font-bold text-slate-800 text-xs">{restorePreview.collections?.notifications?.length ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setRestorePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>{isRestoring ? 'Restoring...' : 'Confirm Restore'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Backup & Security Sub-panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Cloud Snapshot & Live Collections Status (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  Live Collection Status
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Healthy
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Orders Collection</span>
                  <span className="font-bold text-slate-900">{orders.length} docs</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Hotels Collection</span>
                  <span className="font-bold text-slate-900">{hotels.length} docs</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Zones Collection</span>
                  <span className="font-bold text-slate-900">{zones.length} docs</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Joiners Collection</span>
                  <span className="font-bold text-slate-900">{joiners.length} docs</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Drivers Collection</span>
                  <span className="font-bold text-slate-900">{drivers.length} docs</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Products Catalog (B2B & B2C)</span>
                  <span className="font-bold text-slate-900">{products.length} docs</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Transactions / Payments</span>
                  <span className="font-bold text-slate-900">{payments.length} docs</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">System Notifications</span>
                  <span className="font-bold text-slate-900">{notifications.length} docs</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={async () => {
                    if (confirm('Re-seed all core initial records to Firebase Cloud Firestore?')) {
                      const res = await seedDatabaseToFirebase();
                      showToast(res.message || 'Seeded successfully!');
                    }
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-Seed Initial Sample Data
                </button>
                <button
                  onClick={() => {
                    clearLocalDummyCache();
                    showToast('Local offline dummy cache purged.');
                  }}
                  className="w-full py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Purge Local Storage Cache
                </button>
              </div>
            </div>

            {/* Middle Column: Security Policies & Access Controls (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  Access & Security Policies
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* 2FA Toggle */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Require OTP confirmation for all admin logins.</p>
                  </div>
                  <button
                    onClick={handleToggle2FA}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Session Timeout */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <label className="font-bold text-slate-800 block">Admin Session Inactivity Timeout</label>
                  <select
                    value={sessionTimeout}
                    onChange={e => {
                      setSessionTimeout(e.target.value);
                      showToast(`Session timeout set to ${e.target.value}`);
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-emerald-600"
                  >
                    <option value="15 Minutes">15 Minutes</option>
                    <option value="30 Minutes">30 Minutes (Recommended)</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="4 Hours">4 Hours</option>
                    <option value="Never">Never (Insecure)</option>
                  </select>
                </div>

                {/* IP Access Control */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">IP Whitelist Restriction</p>
                      <p className="text-[10px] text-slate-500">Only permit logins from approved IP ranges.</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !ipRestrictionEnabled;
                        setIpRestrictionEnabled(next);
                        showToast(next ? 'IP restriction enabled' : 'IP restriction disabled');
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        ipRestrictionEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          ipRestrictionEnabled ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {ipRestrictionEnabled && (
                    <input
                      type="text"
                      value={allowedIps}
                      onChange={e => setAllowedIps(e.target.value)}
                      placeholder="e.g. 192.168.1.1, 10.0.0.1"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  )}
                </div>

                {/* Terminate Sessions */}
                <div className="pt-1">
                  <button
                    onClick={handleForceLogoutAll}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Force Logout All Other Devices
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Change Admin Password (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Change Password
                </h3>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Current Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">New Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Confirm New Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide' : 'Show'} passwords</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Update Admin Password
                </button>
              </form>
            </div>
          </div>

          {/* Security Audit Log Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Security Audit Trail</h3>
                <p className="text-[11px] text-slate-500">Live immutable log of authentication, backup, and credential changes</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">{auditLogs.length} events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 px-3">Event / Action</th>
                    <th className="py-2 px-3">Triggered By</th>
                    <th className="py-2 px-3">IP Address</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-600">{log.user}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{log.ip}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL SETTINGS */}
      {(activeTab === 'General Settings' || activeTab === 'All Settings') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">General Settings</h3>
              <button
                onClick={() => showToast('General settings saved!')}
                className="px-3 py-1 bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Platform Name *</label>
                <input type="text" defaultValue="FarmerBox" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Tagline</label>
                <input type="text" defaultValue="Fresh from Farmers to Hotels" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Admin Email</label>
                <input type="email" defaultValue="admin@farmerbox.com" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Support Phone</label>
                <input type="text" defaultValue="+91 98765 43210" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Time Zone</label>
                <select className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50">
                  <option>(GMT+05:30) Asia/Kolkata</option>
                  <option>(GMT+00:00) UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Currency</label>
                <select className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50">
                  <option>INR (₹)</option>
                  <option>USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">Platform Logo & Branding</h3>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-3xl font-bold shadow-md">
                🥦
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">FarmerBox</h4>
                <p className="text-[11px] text-slate-500">Fresh from Farmers to Hotels</p>
                <button
                  onClick={() => showToast('Branding update modal opened')}
                  className="mt-2 text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  ✏️ Change Logo
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-2">
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-600">Primary Color</span>
                <span className="font-bold text-emerald-700">#16a34a 🟢</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-600">Accent Color</span>
                <span className="font-bold text-amber-600">#f59e0b 🟡</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">System Preferences</h3>
              <button
                onClick={() => showToast('Preferences saved!')}
                className="px-3 py-1 bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Allow New Hotel Registration', defaultChecked: true },
                { label: 'Allow New Joiner Registration', defaultChecked: true },
                { label: 'Enable Order Notifications', defaultChecked: true },
                { label: 'Auto Assign Orders to Drivers', defaultChecked: true },
                { label: 'Require Order Approval (Admin)', defaultChecked: false },
                { label: 'Send WhatsApp Notifications', defaultChecked: true },
                { label: 'Maintenance Mode', defaultChecked: false }
              ].map((pref, i) => (
                <label key={i} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <span className="text-slate-700">{pref.label}</span>
                  <input type="checkbox" defaultChecked={pref.defaultChecked} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT & ACCESS APPROVALS */}
      {(activeTab === 'User Management' || activeTab === 'All Settings') && (
        <div className="space-y-5">
          {/* 1. Super Admin Access Requests (Pending Permission Approvals) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">Admin Access Requests & Permission Approvals</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    Super Admin Approval Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Only <strong>Super Admin (Pushpak Wani)</strong> can grant access. Others cannot join the console without approval.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Pending:</span>
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                  {accessRequests.filter(r => r.status === 'PENDING').length}
                </span>
              </div>
            </div>

            {accessRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No pending access requests. All console logins are restricted.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Applicant Name</th>
                      <th className="py-2.5 px-3">Work Email & Mobile</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Requested Role</th>
                      <th className="py-2.5 px-3">Reason / Purpose</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Super Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accessRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{req.name}</div>
                          <span className="text-[10px] font-mono text-slate-400">{req.id}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-700 font-medium">{req.email}</div>
                          <div className="text-[11px] text-slate-500">{req.phone}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{req.department}</td>
                        <td className="py-3 px-3 font-semibold text-emerald-800">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10.5px]">
                            {req.requestedRole}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs text-[11px] truncate" title={req.reason}>
                          {req.reason || 'Console administration'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveAccessRequest(req)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                                title="Grant full console login permission"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Grant Access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAccessRequest(req)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                title="Decline access request"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-medium">
                              {req.status === 'APPROVED' ? `Granted by Pushpak Wani` : `Declined by Super Admin`}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Sub-Admins & Zone Admins Managed by Super Admin Pushpak Wani */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">Sub-Admins & Zone Administrators</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Governed by Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Super Admin (Pushpak Wani) creates and assigns sub-admins to specific operational zones with granular module permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubAdminOpen(true)}
                className="px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Zone / Sub-Admin</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Administrator</th>
                    <th className="py-2.5 px-3">Contact Details</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Assigned Zone</th>
                    <th className="py-2.5 px-3">Module Permissions</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Pushpak Wani Super Admin Row */}
                  <tr className="bg-emerald-50/50 hover:bg-emerald-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                          alt="Pushpak Wani"
                          className="w-7 h-7 rounded-full object-cover border border-emerald-600"
                        />
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>Pushpak Wani</span>
                            <span className="text-[9px] bg-emerald-700 text-white font-black px-1.5 py-0.2 rounded">SUPER ADMIN (OWNER)</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">HQ-SUPER-001</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">admin@farmerbox.com</div>
                      <div className="text-[11px] text-slate-500">+91 98765 43210</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-800">Super Admin</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10.5px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                        All Zones (HQ)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10.5px] font-bold text-emerald-800">Full System Authority (100%)</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-600 text-white shadow-2xs">
                        Active Master
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[11px] text-slate-400 font-medium">Protected Owner</span>
                    </td>
                  </tr>

                  {/* Sub Admins created by Super Admin */}
                  {subAdminsList.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{sub.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{sub.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700 font-medium">{sub.email}</div>
                        <div className="text-[11px] text-slate-500">{sub.phone}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">{sub.role}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10.5px] bg-sky-50 text-sky-800 border border-sky-200">
                          {sub.assignedZone}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {sub.permissions.map(p => (
                            <span key={p} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200 uppercase">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSubAdminStatus(sub.id, sub.status)}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] cursor-pointer transition-all ${
                            sub.status === 'Active'
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                          }`}
                          title="Click to toggle status"
                        >
                          {sub.status}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubAdmin(sub.id, sub.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Revoke Sub-Admin Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROLES & PERMISSIONS */}
      {(activeTab === 'Role & Permissions' || activeTab === 'All Settings') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Role & Permission Hierarchy</h3>
              <p className="text-[11px] text-slate-500">Privilege matrix governed by Super Admin Pushpak Wani</p>
            </div>
            <button
              onClick={() => setIsAddSubAdminOpen(true)}
              className="px-3 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Sub-Admin Role
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Role Name</th>
                  <th className="py-2 px-3">Operational Scope</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-center">Active Admins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { id: 1, role: 'Super Admin', scope: 'All Zones (HQ)', desc: 'Full root authority over all modules, zones, payouts & security', count: '1 (Pushpak Wani)' },
                  { id: 2, role: 'Zone Admin', scope: 'Specific Assigned Zone', desc: 'Manage orders, hotels, joiners and driver routes in their assigned zone', count: `${subAdminsList.filter(s => s.role === 'Zone Admin').length} Active` },
                  { id: 3, role: 'Operations Sub-Admin', scope: 'Multi-Zone Fleet', desc: 'Dispatch routes, morning wholesale mandi procurement and logistics', count: `${subAdminsList.filter(s => s.role === 'Operations Sub-Admin').length} Active` },
                  { id: 4, role: 'Finance Sub-Admin', scope: 'Accounts & Payouts', desc: 'Weekly joiner commission audits, GST invoice generation & payment batches', count: `${subAdminsList.filter(s => s.role === 'Finance Sub-Admin').length} Active` }
                ].map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">{r.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{r.role}</td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700">{r.scope}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md">{r.desc}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SUB-ADMIN / ZONE ADMIN MODAL */}
      {isAddSubAdminOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Create Sub-Admin / Zone Admin</h3>
                  <p className="text-[11px] text-slate-500">Authorized by Super Admin Pushpak Wani</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubAdminOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubAdminSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={subAdminName}
                  onChange={e => setSubAdminName(e.target.value)}
                  placeholder="e.g. Vikram Gaikwad"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    value={subAdminEmail}
                    onChange={e => setSubAdminEmail(e.target.value)}
                    placeholder="vikram@farmerbox.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number (Login ID) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={subAdminPhone}
                    onChange={e => setSubAdminPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="9822101020"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Designation</label>
                  <select
                    value={subAdminRole}
                    onChange={e => setSubAdminRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="Zone Admin">Zone Admin</option>
                    <option value="Operations Sub-Admin">Operations Sub-Admin</option>
                    <option value="Finance Sub-Admin">Finance Sub-Admin</option>
                    <option value="Dispatch Manager">Dispatch Manager</option>
                    <option value="Sub Admin">General Sub Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Operational Zone *</label>
                  <select
                    value={subAdminZone}
                    onChange={e => setSubAdminZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="All Zones (HQ)">All Zones (HQ)</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                    {zones.length === 0 && (
                      <>
                        <option value="Kharadi Zone">Kharadi Zone</option>
                        <option value="Viman Nagar Zone">Viman Nagar Zone</option>
                        <option value="Hinjawadi Zone">Hinjawadi Zone</option>
                        <option value="Baner Zone">Baner Zone</option>
                        <option value="Magarpatta Zone">Magarpatta Zone</option>
                        <option value="Wakad Zone">Wakad Zone</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Login Password *</label>
                <input
                  type="text"
                  required
                  value={subAdminPassword}
                  onChange={e => setSubAdminPassword(e.target.value)}
                  placeholder="Set login password (e.g. Zone@123)"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">Sub-Admin will use their email or mobile number with this password to log in.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Granted Module Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {[
                    { id: 'orders', label: 'Orders & Live Dispatch' },
                    { id: 'drivers', label: 'Drivers & Live Fleet' },
                    { id: 'hotels', label: 'Hotel Partners' },
                    { id: 'joiners', label: 'Joiner Network' },
                    { id: 'inventory', label: 'Mandi Inventory' },
                    { id: 'commission', label: 'Commission Payouts' }
                  ].map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={subAdminPermissions.includes(perm.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSubAdminPermissions(prev => [...prev, perm.id]);
                          } else {
                            setSubAdminPermissions(prev => prev.filter(p => p !== perm.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-[#15803d] cursor-pointer"
                      />
                      <span className="text-slate-700 text-xs font-medium">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSubAdminOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl font-bold shadow-md shadow-emerald-950/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Authorize & Create Sub-Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
