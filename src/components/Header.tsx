import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Calendar, X, Building2, ShoppingBag, Users, LogOut, ChevronDown, User, Settings, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FirebaseStatusBadge } from './FirebaseStatusBadge';

export const Header: React.FC = () => {
  const {
    setIsNotificationsOpen,
    activeTab,
    setActiveTab,
    hotels,
    orders,
    joiners,
    setSelectedOrder,
    setSelectedJoiner,
    setSelectedHotel,
    adminProfile,
    setIsAdminProfileOpen,
    logoutAdmin,
    notifications,
    toggleMobileMenu
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = searchQuery.trim().toLowerCase();
  const matchingHotels = trimmed ? hotels.filter(h => h.name.toLowerCase().includes(trimmed) || h.zone.toLowerCase().includes(trimmed)).slice(0, 3) : [];
  const matchingOrders = trimmed ? orders.filter(o => o.id.toLowerCase().includes(trimmed) || o.hotelName.toLowerCase().includes(trimmed)).slice(0, 3) : [];
  const matchingJoiners = trimmed ? joiners.filter(j => j.name.toLowerCase().includes(trimmed) || j.zone.toLowerCase().includes(trimmed)).slice(0, 3) : [];

  const hasResults = matchingHotels.length > 0 || matchingOrders.length > 0 || matchingJoiners.length > 0;

  return (
    <header className="bg-white border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 z-20">
      {/* Left: Hamburger & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            {activeTab === 'Dashboard' ? 'Admin Dashboard' : activeTab === 'B2C Catalog' ? 'B2C Fresh Retail Catalog' : `${activeTab} Management`}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-normal leading-tight hidden sm:block truncate">
            {activeTab === 'B2C Catalog' ? 'Manage consumer household portions, retail vegetables & fruits' : 'Manage hotels, joiners, orders and deliver fresh vegetables'}
          </p>
        </div>
      </div>

      {/* Right: Search, Notifications, Profile, Date */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Search Bar with live search dropdown */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search hotels, orders, joiners..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {isSearchOpen && trimmed && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
              {!hasResults ? (
                <div className="p-3 text-center text-xs text-slate-500">No matching hotels, orders or joiners found</div>
              ) : (
                <div className="space-y-2">
                  {matchingOrders.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Orders</p>
                      {matchingOrders.map(o => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setSelectedOrder(o);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-slate-800">{o.id}</span>
                            <span className="text-slate-600">({o.hotelName})</span>
                          </div>
                          <span className="text-emerald-700 font-bold">₹{o.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingHotels.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Hotels</p>
                      {matchingHotels.map(h => (
                        <div
                          key={h.id}
                          onClick={() => {
                            setSelectedHotel(h);
                            setActiveTab('Hotels');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-semibold text-slate-800">{h.name}</span>
                          </div>
                          <span className="text-slate-500 text-[11px]">{h.zone}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingJoiners.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Joiners</p>
                      {matchingJoiners.map(j => (
                        <div
                          key={j.id}
                          onClick={() => {
                            setSelectedJoiner(j);
                            setActiveTab('Hotel Joiners');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-orange-600" />
                            <span className="font-semibold text-slate-800">{j.name}</span>
                          </div>
                          <span className="text-slate-500 text-[11px]">{j.zone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Firebase Cloud Database Status */}
        <FirebaseStatusBadge />

        {/* Notification Bell */}
        <button
          onClick={() => setActiveTab('Notifications')}
          className="relative p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Open Notifications Full Page"
        >
          <Bell className="w-5 h-5" />
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>

        {/* Pushpak Wani Profile Chip with Dropdown Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(prev => !prev)}
            className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-left"
            title="Pushpak Wani (Super Admin) - Click for options"
          >
            <div className="relative shrink-0">
              <img
                src={adminProfile.avatar}
                alt={adminProfile.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-600 shadow-2xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{adminProfile.name}</p>
              <p className="text-[10px] text-emerald-700 font-semibold leading-tight">{adminProfile.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
              {/* Profile Header */}
              <div className="px-3 py-2.5 bg-emerald-50/70 rounded-xl mb-1 border border-emerald-100/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs font-extrabold text-slate-900 truncate">{adminProfile.name}</p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-emerald-700 font-bold">{adminProfile.role}</span>
                  <span className="text-[9px] bg-white px-1.5 py-0.5 rounded text-slate-500 font-mono border border-slate-200">HQ</span>
                </div>
              </div>

              {/* Action items */}
              <div className="space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setActiveTab('Profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsAdminProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Admin Settings</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logoutAdmin();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Quick Logout Icon Button in Header */}
        <button
          type="button"
          onClick={() => logoutAdmin()}
          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-400 rounded-lg transition-all cursor-pointer shadow-2xs"
          title="Sign Out / Logout to Login Page"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    </header>
  );
};
