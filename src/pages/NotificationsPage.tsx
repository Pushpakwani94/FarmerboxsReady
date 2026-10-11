import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Send,
  Clock,
  AlertTriangle,
  Search,
  CheckCheck,
  Trash2,
  CheckCircle2,
  Calendar,
  Users,
  Building2,
  ShoppingBag,
  Eye,
  Mail,
  MailOpen,
  ArrowRight,
  X,
  Sparkles,
  RefreshCw,
  Layers,
  Smartphone,
  Check
} from 'lucide-react';
import type { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    addNotification,
    deleteNotification,
    markNotificationsAsRead,
    markNotificationAsRead,
    toggleNotificationRead,
    clearAllNotifications,
    setActiveTab: setGlobalActiveTab
  } = useApp();

  const [activeTab, setActiveTab] = useState<'All Notifications' | 'Unread' | 'Scheduled' | 'Sent' | 'Failed'>('All Notifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserType, setFilterUserType] = useState('All User Types');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [userType, setUserType] = useState<'Hotels' | 'Drivers' | 'Joiners' | 'Admins' | 'All Users'>('All Users');
  const [scheduleDate, setScheduleDate] = useState('');
  const [notificationType, setNotificationType] = useState<'Standard Alert' | 'Order Notice' | 'Commission Notice' | 'App Update Release'>('Standard Alert');
  const [selectedFile, setSelectedFile] = useState('farmerbox-joiner-v2.5.0.apk');
  const [targetVersion, setTargetVersion] = useState('v2.5.0');
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  // Counts computed dynamically
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const sentCount = notifications.filter(n => (n.status || 'Sent') === 'Sent').length;
  const scheduledCount = notifications.filter(n => n.status === 'Scheduled').length;
  const failedCount = notifications.filter(n => n.status === 'Failed').length;
  const deliveryRate = totalNotifications > 0 ? Math.round((sentCount / totalNotifications) * 100) : 100;
  const failureRate = totalNotifications > 0 ? Math.round((failedCount / totalNotifications) * 100) : 0;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'Unread' && n.read) return false;
    if (activeTab === 'Sent' && (n.status || 'Sent') !== 'Sent') return false;
    if (activeTab === 'Scheduled' && n.status !== 'Scheduled') return false;
    if (activeTab === 'Failed' && n.status !== 'Failed') return false;

    const actualUserType = n.userType || n.category || 'All Users';
    if (filterUserType !== 'All User Types' && actualUserType !== filterUserType) return false;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const titleMatch = (n.title || '').toLowerCase().includes(s);
      const msgMatch = (n.message || n.subtitle || '').toLowerCase().includes(s);
      const userMatch = actualUserType.toLowerCase().includes(s);
      return titleMatch || msgMatch || userMatch;
    }
    return true;
  });

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert('Please enter both title and message.');
      return;
    }

    const nowStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isUpdate = notificationType === 'App Update Release';

    addNotification({
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      subtitle: notifMessage.trim(),
      userType: userType,
      status: scheduleDate ? 'Scheduled' : 'Sent',
      dateTime: scheduleDate ? new Date(scheduleDate).toLocaleString('en-IN') : nowStr,
      time: 'Just now',
      read: false,
      category: isUpdate ? 'System' : notificationType === 'Order Notice' ? 'Orders' : notificationType === 'Commission Notice' ? 'Commission' : 'System',
      iconType: isUpdate ? 'system' : notificationType === 'Order Notice' ? 'order' : notificationType === 'Commission Notice' ? 'commission' : 'system',
      isAppUpdate: isUpdate,
      hasUpdateFile: isUpdate,
      fileName: isUpdate ? selectedFile : undefined,
      version: isUpdate ? targetVersion : undefined
    });

    setNotifTitle('');
    setNotifMessage('');
    setScheduleDate('');
    setNotificationType('Standard Alert');
    setSendFeedback(isUpdate ? `🚀 App update broadcast sent with file ${selectedFile}!` : '✓ Notification broadcasted successfully!');
    setTimeout(() => setSendFeedback(null), 3500);
  };

  const handleDelete = (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this notification?')) {
      deleteNotification(id);
      if (selectedNotif && String(selectedNotif.id) === String(id)) {
        setSelectedNotif(null);
      }
    }
  };

  const handleToggleRead = (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (toggleNotificationRead) {
      toggleNotificationRead(id);
    } else {
      markNotificationAsRead(id);
    }
    if (selectedNotif && String(selectedNotif.id) === String(id)) {
      setSelectedNotif(prev => prev ? { ...prev, read: !prev.read } : null);
    }
  };

  const handleRowClick = (n: NotificationItem) => {
    setSelectedNotif(n);
    if (!n.read) {
      markNotificationAsRead(n.id);
    }
  };

  const handleQuickPreset = (preset: {
    title: string;
    msg: string;
    target: 'Hotels' | 'Drivers' | 'Joiners' | 'Admins' | 'All Users';
    type: 'Standard Alert' | 'Order Notice' | 'Commission Notice' | 'App Update Release';
  }) => {
    setNotifTitle(preset.title);
    setNotifMessage(preset.msg);
    setUserType(preset.target);
    setNotificationType(preset.type);
  };

  const jumpToRelatedTab = (category?: string, title?: string) => {
    const text = `${category || ''} ${title || ''}`.toLowerCase();
    if (text.includes('order')) {
      setGlobalActiveTab('Orders');
    } else if (text.includes('hotel')) {
      setGlobalActiveTab('Hotels');
    } else if (text.includes('joiner') || text.includes('commission')) {
      setGlobalActiveTab('Hotel Joiners');
    } else if (text.includes('driver')) {
      setGlobalActiveTab('Delivery Drivers');
    } else {
      setGlobalActiveTab('Dashboard');
    }
  };

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
      {/* Header Metric Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
        <div
          onClick={() => setActiveTab('All Notifications')}
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'All Notifications' ? 'bg-emerald-100/70 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-emerald-50/80 border-emerald-100 hover:bg-emerald-100/50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Notifications</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{totalNotifications}</h3>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Sent')}
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'Sent' ? 'bg-sky-100/70 border-sky-300 ring-2 ring-sky-500/20' : 'bg-sky-50/80 border-sky-100 hover:bg-sky-100/50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Sent</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{sentCount}</h3>
            <p className="text-[10px] text-sky-700 font-semibold mt-1">{deliveryRate}% delivery rate</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Scheduled')}
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'Scheduled' ? 'bg-amber-100/70 border-amber-300 ring-2 ring-amber-500/20' : 'bg-amber-50/80 border-amber-100 hover:bg-amber-100/50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Scheduled</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{scheduledCount}</h3>
            <p className="text-[10px] text-amber-700 font-semibold mt-1">Queued alerts</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Failed')}
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-2xs cursor-pointer transition-all ${
            activeTab === 'Failed' ? 'bg-rose-100/70 border-rose-300 ring-2 ring-rose-500/20' : 'bg-rose-50/80 border-rose-100 hover:bg-rose-100/50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Failed</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{failedCount}</h3>
            <p className="text-[10px] text-rose-700 font-semibold mt-1">{failureRate}% failure rate</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Notifications List & Send Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Notification Table (8 cols) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              {(['All Notifications', 'Unread', 'Sent', 'Scheduled', 'Failed'] as const).map(tab => {
                const count =
                  tab === 'All Notifications' ? totalNotifications :
                  tab === 'Unread' ? unreadCount :
                  tab === 'Sent' ? sentCount :
                  tab === 'Scheduled' ? scheduledCount : failedCount;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                      activeTab === tab
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markNotificationsAsRead}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Read All
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Permanently delete all notifications? This will clear all records from database.')) {
                      clearAllNotifications();
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="Delete all notifications permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <select
                value={filterUserType}
                onChange={e => setFilterUserType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-emerald-600 cursor-pointer"
              >
                <option value="All User Types">All User Types</option>
                <option value="Hotels">Hotels</option>
                <option value="Drivers">Drivers</option>
                <option value="Joiners">Joiners</option>
                <option value="Admins">Admins</option>
                <option value="All Users">All Users</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterUserType('All User Types');
                  setActiveTab('All Notifications');
                }}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <span className="text-[11px] text-slate-500">
              Showing {filteredNotifications.length} of {totalNotifications}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">No notifications found.</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters or send a new notification.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((n, idx) => (
                    <tr
                      key={n.id}
                      onClick={() => handleRowClick(n)}
                      className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                        !n.read ? 'bg-emerald-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" title="Unread" />}
                          <span>{n.title || 'Notification'}</span>
                          {(n.hasUpdateFile || n.isAppUpdate) && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 border border-purple-200 font-extrabold text-[9px] rounded flex items-center gap-1">
                              📦 {n.fileName || 'Update APK'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={n.message || n.subtitle || ''}>
                        {n.message || n.subtitle || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                          {n.userType || n.category || 'All Users'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (n.status || 'Sent') === 'Sent' ? 'bg-emerald-100 text-emerald-800' :
                          n.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {n.status || 'Sent'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {n.dateTime || n.time || 'Just now'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          {/* View details */}
                          <button
                            onClick={() => setSelectedNotif(n)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                            title="View notification details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle read/unread */}
                          <button
                            onClick={e => handleToggleRead(n.id, e)}
                            className={`p-1 rounded hover:bg-slate-100 cursor-pointer transition-colors ${
                              n.read ? 'text-slate-400 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'
                            }`}
                            title={n.read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {n.read ? <Mail className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={e => handleDelete(n.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Delete notification permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
            <span>Showing 1 to {filteredNotifications.length} of {filteredNotifications.length} notifications</span>
            <span className="text-[11px] text-slate-400">Click any row to view full payload</span>
          </div>
        </div>

        {/* Right Column: Quick Presets & Create New Notification Form (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Presets */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Broadcast Presets
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => handleQuickPreset({
                  title: '🚀 App Update v2.5.0 Available!',
                  msg: 'Enhanced catalog search, instant sync, and faster hotel ordering now live. Update your app today.',
                  target: 'Joiners',
                  type: 'App Update Release'
                })}
                className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-left border border-purple-200/60 font-semibold cursor-pointer transition-colors truncate"
              >
                🚀 App Update v2.5.0
              </button>
              <button
                onClick={() => handleQuickPreset({
                  title: '📦 High Order Volume Alert',
                  msg: 'Today early morning vegetable harvest dispatch starting at 5:00 AM. Please keep vehicles ready.',
                  target: 'Drivers',
                  type: 'Order Notice'
                })}
                className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-lg text-left border border-sky-200/60 font-semibold cursor-pointer transition-colors truncate"
              >
                📦 Morning Dispatch
              </button>
              <button
                onClick={() => handleQuickPreset({
                  title: '💰 Commission Payout Processed',
                  msg: 'Weekly commission credits have been settled to your wallet accounts.',
                  target: 'Joiners',
                  type: 'Commission Notice'
                })}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-left border border-emerald-200/60 font-semibold cursor-pointer transition-colors truncate"
              >
                💰 Weekly Payout
              </button>
              <button
                onClick={() => handleQuickPreset({
                  title: '⚡ Fresh Onion & Potato Mandi Arrival',
                  msg: 'Special wholesale rates available for Grade-A Nashik Onions and Agra Potatoes.',
                  target: 'Hotels',
                  type: 'Standard Alert'
                })}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-left border border-amber-200/60 font-semibold cursor-pointer transition-colors truncate"
              >
                ⚡ Fresh Mandi Rates
              </button>
            </div>
          </div>

          {/* Create Form */}
          <form onSubmit={handleSendNotification} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Broadcast Notification</h3>
              <Send className="w-4 h-4 text-emerald-700" />
            </div>

            {sendFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {sendFeedback}
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Notification Type *</label>
                <select
                  value={notificationType}
                  onChange={e => setNotificationType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="Standard Alert">Standard Alert (Text Only)</option>
                  <option value="Order Notice">Order / Delivery Notice</option>
                  <option value="Commission Notice">Commission Notice</option>
                  <option value="App Update Release">🚀 App Update Release (Attach APK)</option>
                </select>
              </div>

              {notificationType === 'App Update Release' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-xs">Release Package Details</span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.2 rounded-full font-bold">APK File</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium text-[11px] mb-0.5">Package File *</label>
                    <select
                      value={selectedFile}
                      onChange={e => setSelectedFile(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-purple-200 rounded-lg bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
                    >
                      <option value="farmerbox-joiner-v2.5.0.apk">farmerbox-joiner-v2.5.0.apk (Latest Android Build)</option>
                      <option value="FarmerBox.apk">FarmerBox.apk (Public Build)</option>
                      <option value="farmerbox-joiner-latest.apk">farmerbox-joiner-latest.apk (Production Stable)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium text-[11px] mb-0.5">Version String</label>
                    <input
                      type="text"
                      placeholder="e.g. v2.5.0"
                      value={targetVersion}
                      onChange={e => setTargetVersion(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-purple-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Title *</label>
                <input
                  type="text"
                  placeholder={notificationType === 'App Update Release' ? 'e.g. 🚀 App Update v2.5.0 Available!' : 'e.g. Fresh Red Onions Back In Stock'}
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Message *</label>
                <textarea
                  rows={3}
                  placeholder={notificationType === 'App Update Release' ? 'Describe release highlights for joiners...' : 'Enter message details for clients/joiners/drivers...'}
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Target Audience *</label>
                <select
                  value={userType}
                  onChange={e => setUserType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="All Users">All Users (Fleet & Partners)</option>
                  <option value="Joiners">Joiners (Mobile App Fleet)</option>
                  <option value="Hotels">Hotels (Restaurant Partners)</option>
                  <option value="Drivers">Drivers (Delivery Fleet)</option>
                  <option value="Admins">Admins Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-0.5">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Send className="w-3.5 h-3.5" />
                {scheduleDate ? 'Schedule Notification' : 'Broadcast Now'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inspect Notification Modal */}
      {selectedNotif && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedNotif.title}</h3>
                  <p className="text-xs text-slate-400">{selectedNotif.dateTime || selectedNotif.time || 'Just now'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {selectedNotif.message || selectedNotif.subtitle || 'No message content provided.'}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Target Audience</span>
                <span className="font-bold text-slate-800">{selectedNotif.userType || selectedNotif.category || 'All Users'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Delivery Status</span>
                <span className="font-bold text-emerald-700">{selectedNotif.status || 'Sent'}</span>
              </div>
            </div>

            {(selectedNotif.hasUpdateFile || selectedNotif.isAppUpdate) && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Attached Package File</span>
                  <span className="font-mono text-[11px] text-purple-700">{selectedNotif.fileName || 'farmerbox-joiner-v2.5.0.apk'}</span>
                </div>
                <span className="px-2 py-0.5 bg-purple-200 font-bold rounded text-[10px]">
                  {selectedNotif.version || 'v2.5.0'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <button
                onClick={() => handleDelete(selectedNotif.id)}
                className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleRead(selectedNotif.id)}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {selectedNotif.read ? <Mail className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  {selectedNotif.read ? 'Mark as Unread' : 'Mark as Read'}
                </button>

                <button
                  onClick={() => {
                    const cat = selectedNotif.category;
                    const tit = selectedNotif.title;
                    setSelectedNotif(null);
                    jumpToRelatedTab(cat, tit);
                  }}
                  className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  View Related Screen <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
