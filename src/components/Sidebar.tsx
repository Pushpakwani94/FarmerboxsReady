import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Building2,
  ShoppingBag,
  Truck,
  Package,
  CircleDollarSign,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  User,
  Smartphone,
  ShieldCheck,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    notifications,
    logoutAdmin,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Customer Mobile App', label: 'Customer B2C App', icon: Smartphone, tag: 'B2C' },
    { id: 'Mobile App', label: 'Joiner Mobile App', icon: Smartphone, tag: 'B2B' },
    { id: 'Zones', label: 'Zones', icon: MapPin },
    { id: 'Hotel Joiners', label: 'Hotel Joiners', icon: Users },
    { id: 'Hotels', label: 'Hotels', icon: Building2 },
    { id: 'Orders', label: 'Orders', icon: ShoppingBag },
    { id: 'Delivery Drivers', label: 'Delivery Drivers', icon: Truck },
    { id: 'Products / Inventory', label: 'Products / Inventory', icon: Package },
    { id: 'B2C Catalog', label: 'B2C Catalog', icon: ShoppingBag, tag: 'Retail' },
    { id: 'Joiner Commission', label: 'Joiner Commission', icon: CircleDollarSign },
    { id: 'Payments', label: 'Payments', icon: CreditCard },
    { id: 'Reports', label: 'Reports', icon: BarChart3 },
    { id: 'Notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'Admins', label: 'Admin Management', icon: ShieldCheck, tag: 'Super' },
    { id: 'Settings', label: 'Settings', icon: Settings },
    { id: 'Profile', label: 'My Profile', icon: User },
    { id: 'Logout', label: 'Logout', icon: LogOut }
  ];

  const handleItemClick = (id: string) => {
    setIsMobileMenuOpen(false);
    if (id === 'Notifications') {
      setActiveTab('Notifications');
    } else if (id === 'Logout') {
      logoutAdmin();
    } else {
      setActiveTab(id);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen flex-shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header with solid green background */}
          <div className="bg-[#15803d] px-4 py-3.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <img
                src="/farmerbox_app_icon.png"
                alt="FarmerBoxs Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-sm shrink-0"
              />
              <div>
                <h1 className="font-black text-lg text-white tracking-tight leading-none flex items-center gap-1">
                  <span>FarmerBoxs</span>
                  <span className="text-[9px] bg-white/20 text-white font-bold px-1.5 py-0.2 rounded">v2.5</span>
                </h1>
                <p className="text-[10px] text-green-100/90 font-medium mt-1">Farm Fresh to Your Door</p>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'Dashboard' && activeTab === 'Dashboard');
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#16a34a] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(item as any).tag && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 text-[#15803d]'
                      }`}>
                        {(item as any).tag}
                      </span>
                    )}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
