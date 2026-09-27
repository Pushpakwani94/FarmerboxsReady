import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { ZonesPage } from './pages/ZonesPage';
import { JoinersPage } from './pages/JoinersPage';
import { HotelsPage } from './pages/HotelsPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { B2CCatalogPage } from './pages/B2CCatalogPage';
import { CommissionPage } from './pages/CommissionPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { JoinerMobileAppManagementPage } from './pages/JoinerMobileAppManagementPage';
import { CustomerAppManagementPage } from './pages/CustomerAppManagementPage';
import { DriversPage } from './pages/DriversPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerMobileApp } from './customerApp/CustomerMobileApp';

// Modals
import { AddHotelModal } from './components/Modals/AddHotelModal';
import { AddJoinerModal } from './components/Modals/AddJoinerModal';
import { AddZoneModal } from './components/Modals/AddZoneModal';
import { OrderDetailModal } from './components/Modals/OrderDetailModal';
import { NotificationsDrawer } from './components/Modals/NotificationsDrawer';
import { AdminProfileModal } from './components/AdminProfileModal';
import { LogoutConfirmModal } from './components/Modals/LogoutConfirmModal';

import { Capacitor } from '@capacitor/core';
import { StandaloneMobileApp } from './mobileApp/StandaloneMobileApp';
import { SplashScreen } from './components/SplashScreen';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, toggleMobileMenu } = useApp();

  const renderTab = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Customer Mobile App':
      case 'Customer App':
      case 'Customer B2C App':
        return <CustomerAppManagementPage />;
      case 'Joiner Mobile App':
      case 'Joiner App Management':
      case 'Mobile App':
        return <JoinerMobileAppManagementPage />;
      case 'Zones':
        return <ZonesPage />;
      case 'Joiners':
      case 'Hotel Joiners':
        return <JoinersPage />;
      case 'Hotels':
        return <HotelsPage />;
      case 'Orders':
        return <OrdersPage />;
      case 'Drivers':
      case 'Delivery Drivers':
        return <DriversPage />;
      case 'Inventory':
      case 'Products / Inventory':
        return <InventoryPage />;
      case 'B2C Catalog':
      case 'B2C Products':
        return <B2CCatalogPage />;
      case 'Commission':
      case 'Joiner Commission':
        return <CommissionPage />;
      case 'Payments':
        return <PaymentsPage />;
      case 'Reports':
        return <ReportsPage />;
      case 'Admins':
      case 'Admin Management':
      case 'Sub-Admins':
      case 'Admin & Sub-Admins':
        return <SettingsPage initialTab="User Management" />;
      case 'Settings':
        return <SettingsPage initialTab="Backup & Security" />;
      case 'Profile':
      case 'Admin Profile':
      case 'My Profile':
        return <AdminProfilePage />;
      case 'Notifications':
        return <NotificationsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100/70 flex relative">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 pb-20 lg:pb-8 overflow-y-auto">
          {renderTab()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-lg safe-area-inset-bottom">
        <button
          onClick={() => setActiveTab('Dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-bold cursor-pointer transition-colors ${
            activeTab === 'Dashboard' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'Dashboard' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            📊
          </span>
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('Orders')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-bold cursor-pointer transition-colors ${
            activeTab === 'Orders' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'Orders' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            🛍️
          </span>
          <span>Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('Hotels')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-bold cursor-pointer transition-colors ${
            activeTab === 'Hotels' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'Hotels' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            🏨
          </span>
          <span>Hotels</span>
        </button>

        <button
          onClick={() => setActiveTab('Hotel Joiners')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-bold cursor-pointer transition-colors ${
            activeTab === 'Hotel Joiners' || activeTab === 'Joiners' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'Hotel Joiners' || activeTab === 'Joiners' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            👥
          </span>
          <span>Joiners</span>
        </button>

        <button
          onClick={toggleMobileMenu}
          className="flex flex-col items-center gap-0.5 p-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
        >
          <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
            ☰
          </span>
          <span>Menu</span>
        </button>
      </nav>

      {/* Interactive Modals */}
      <AddHotelModal />
      <AddJoinerModal />
      <AddZoneModal />
      <OrderDetailModal />
      <NotificationsDrawer />
      <AdminProfileModal />
      <LogoutConfirmModal />
    </div>
  );
};

const AdminAppRoot: React.FC = () => {
  const { isAdminLoggedIn } = useApp();

  if (!isAdminLoggedIn) {
    return <LoginPage />;
  }

  return <MainContent />;
};

export default function App() {
  const isCustomerAppMode = 
    typeof window !== 'undefined' &&
    (window.location.search.includes('app=customer') ||
      window.location.hash.includes('customer-app') ||
      window.location.search.includes('mode=b2c') ||
      localStorage.getItem('farmerbox_mobile_mode') === 'customer' ||
      (Capacitor.isNativePlatform() && localStorage.getItem('farmerbox_mobile_mode') !== 'joiner'));

  const isMobileMode =
    !isCustomerAppMode &&
    typeof window !== 'undefined' &&
    (Capacitor.isNativePlatform() ||
      window.location.search.includes('mode=mobile') ||
      window.location.search.includes('app=joiner') ||
      navigator.userAgent.includes('FarmerBox'));

  const [showSplash, setShowSplash] = useState(!isMobileMode && !isCustomerAppMode);

  if (isCustomerAppMode) {
    return <CustomerMobileApp isEmbedded={false} />;
  }

  return (
    <>
      {showSplash && !isMobileMode && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {isMobileMode ? (
        <StandaloneMobileApp />
      ) : (
        <AppProvider>
          <AdminAppRoot />
        </AppProvider>
      )}
    </>
  );
}
