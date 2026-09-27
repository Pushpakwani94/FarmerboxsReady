import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Send,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  CheckCheck,
  Trash2,
  CheckCircle2,
  Calendar,
  Users,
  Building2,
  ShoppingBag
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    addNotification,
    deleteNotification,
    markNotificationsAsRead,
    markNotificationAsRead,
    clearAllNotifications
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
    setSendFeedback(isUpdate ? `App update broadcast sent with file ${selectedFile}!` : 'Notification sent successfully without file attachment!');
    setTimeout(() => setSendFeedback(null), 3500);
  };

  const handleDelete = (id: number | string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      deleteNotification(id);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
      {/* Header Metric Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 shadow-2xs">
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

        <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-100 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Sent</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{sentCount}</h3>
            <p className="text-[10px] text-sky-700 font-semibold mt-1">{deliveryRate}% delivery rate</p>
          </div>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-100 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Scheduled</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{scheduledCount}</h3>
            <p className="text-[10px] text-amber-700 font-semibold mt-1">Queued alerts</p>
          </div>
        </div>

        <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-100 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Failed</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mt-1">{failedCount}</h3>
            <p className="text-[10px] text-rose-700 font-semibold mt-1">{failureRate}% failure rate</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Table + Right Create Form & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Notifications List Table (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 overflow-x-auto">
              {(['All Notifications', 'Unread', 'Sent', 'Scheduled', 'Failed'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`pb-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === t ? 'text-emerald-700 border-b-2 border-emerald-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t} {t === 'Unread' && unreadCount > 0 && `(${unreadCount})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                    if (confirm('Clear all notifications?')) {
                      clearAllNotifications();
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="Delete all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="relative w-48">
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
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-emerald-600"
              >
                <option value="All User Types">All User Types</option>
                <option value="Hotels">Hotels</option>
                <option value="Drivers">Drivers</option>
                <option value="Joiners">Joiners</option>
                <option value="Admins">Admins</option>
                <option value="All Users">All Users</option>
              </select>

              <button
                onClick={() => { setSearchTerm(''); setFilterUserType('All User Types'); }}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Title</th>
                  <th className="py-2.5 px-2">Message</th>
                  <th className="py-2.5 px-2">Target</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2">Date & Time</th>
                  <th className="py-2.5 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                        <p className="font-medium">No notifications found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((n, idx) => (
                    <tr
                      key={n.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !n.read ? 'bg-emerald-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-2.5 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />}
                            <span>{n.title || 'Notification'}</span>
                            {(n.hasUpdateFile || n.isAppUpdate) && (
                              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 border border-purple-200 font-extrabold text-[9px] rounded flex items-center gap-1">
                                📦 {n.fileName || 'Update File'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 max-w-xs truncate">
                        {n.message || n.subtitle || '—'}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                          {n.userType || n.category || 'All Users'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (n.status || 'Sent') === 'Sent' ? 'bg-emerald-100 text-emerald-800' :
                          n.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {n.status || 'Sent'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                        {n.dateTime || n.time || 'Just now'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!n.read && (
                            <button
                              onClick={() => markNotificationAsRead(n.id)}
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="Delete notification"
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

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>Showing 1 to {filteredNotifications.length} of {filteredNotifications.length} notifications</span>
          </div>
        </div>

        {/* Right Column: Create New Notification Form & Recent Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <form onSubmit={handleSendNotification} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Create New Notification</h3>
              <Send className="w-4 h-4 text-emerald-700" />
            </div>

            {sendFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
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
                  <option value="Standard Alert">Standard Alert (Text Only - No File)</option>
                  <option value="Order Notice">Order / Delivery Notice (Text Only)</option>
                  <option value="Commission Notice">Commission Notice (Text Only)</option>
                  <option value="App Update Release">🚀 App Update Release (Attach APK/File)</option>
                </select>
              </div>

              {notificationType === 'App Update Release' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-xs">Select Update Release File</span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.2 rounded-full font-bold">APK File</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium text-[11px] mb-0.5">Choose File *</label>
                    <select
                      value={selectedFile}
                      onChange={e => setSelectedFile(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-purple-200 rounded-lg bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
                    >
                      <option value="farmerbox-joiner-v2.5.0.apk">farmerbox-joiner-v2.5.0.apk (Latest Android Build)</option>
                      <option value="farmerbox-joiner-latest.apk">farmerbox-joiner-latest.apk (Production Stable)</option>
                      <option value="farmerbox-joiner-ios.zip">farmerbox-joiner-ios.zip (iOS Package)</option>
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
                  placeholder={notificationType === 'App Update Release' ? 'e.g. 🚀 App Update v2.5.0 Available!' : 'e.g. Price Drop on Fresh Tomatoes'}
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
                  placeholder={notificationType === 'App Update Release' ? 'What is new in this release (e.g. New pulses catalog, faster ordering)...' : 'Enter message details for clients/joiners...'}
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
                  <option value="All Users">All Users</option>
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-2 ${
                  notificationType === 'App Update Release'
                    ? 'bg-purple-700 hover:bg-purple-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                <Send className="w-4 h-4" />
                {notificationType === 'App Update Release' ? 'Broadcast App Update with File' : 'Send Notification'}
              </button>
            </div>
          </form>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Recent Feed</h3>
              <span className="text-xs text-slate-400">{notifications.length} total</span>
            </div>

            <div className="space-y-2 text-xs">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No notifications yet.</div>
              ) : (
                notifications.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markNotificationAsRead(item.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      !item.read ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <span className="text-base mt-0.5">📢</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-slate-500 text-[11px] truncate">{item.message || item.subtitle}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.userType || item.category} • {item.dateTime || item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
