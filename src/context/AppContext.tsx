import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type {
  Order,
  Zone,
  Joiner,
  Driver,
  Hotel,
  Product,
  PaymentTransaction,
  NotificationItem,
  OrderStatus
} from '../types';
import {
  subscribeToCollection,
  saveRecord,
  deleteRecord,
  seedFirestoreDatabase,
  clearLocalDummyCache
} from '../firebase/dbService';
import { db, isFirebaseConfigured } from '../firebase/config';
import { authService } from '../firebase/authService';
import { resolveProductImage } from '../utils/productImages';

export interface AdminProfile {
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  zone: string;
  location: string;
  department: string;
  joinedDate: string;
  bio?: string;
  emergencyContact?: string;
  timezone?: string;
  language?: string;
}

interface AppContextType {
  orders: Order[];
  zones: Zone[];
  joiners: Joiner[];
  drivers: Driver[];
  hotels: Hotel[];
  products: Product[];
  payments: PaymentTransaction[];
  notifications: NotificationItem[];
  isDatabaseConnected: boolean;
  firestoreError: string | null;
  seedDatabaseToFirebase: () => Promise<any>;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Selected State
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  selectedZone: Zone | null;
  setSelectedZone: (zone: Zone | null) => void;
  selectedJoiner: Joiner | null;
  setSelectedJoiner: (joiner: Joiner | null) => void;
  selectedHotel: Hotel | null;
  setSelectedHotel: (hotel: Hotel | null) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  selectedDriver: Driver | null;
  setSelectedDriver: (driver: Driver | null) => void;

  // Authentication & Session
  isAdminLoggedIn: boolean;
  loginAdmin: (email: string, password?: string, rememberMe?: boolean) => Promise<boolean>;
  logoutAdmin: () => void;

  // Modals
  isAddHotelOpen: boolean;
  setIsAddHotelOpen: (open: boolean) => void;
  isAddJoinerOpen: boolean;
  setIsAddJoinerOpen: (open: boolean) => void;
  isAddZoneOpen: boolean;
  setIsAddZoneOpen: (open: boolean) => void;
  isAddDriverOpen: boolean;
  setIsAddDriverOpen: (open: boolean) => void;
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isOrderDetailModalOpen: boolean;
  setIsOrderDetailModalOpen: (open: boolean) => void;
  isAdminProfileOpen: boolean;
  setIsAdminProfileOpen: (open: boolean) => void;
  isLogoutConfirmOpen: boolean;
  setIsLogoutConfirmOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Universal CRUD Confirmation & Action Modal
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    entityName?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  };
  confirmAction: (config: {
    title: string;
    message: string;
    entityName?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }) => void;
  closeConfirmModal: () => void;

  // Admin Profile
  adminProfile: AdminProfile;
  updateAdminProfile: (data: Partial<AdminProfile>) => void;
  markNotificationsAsRead: () => void;
  markNotificationAsRead: (id: number | string) => void;
  clearAllNotifications: () => void;

  // Actions
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  acceptOrder: (orderId: string, driverName?: string) => void;
  assignDriverToOrder: (orderId: string, driverName: string, driverPhone?: string, driverId?: string | number, newStatus?: OrderStatus) => void;
  addZone: (name: string, area?: string, status?: 'Active' | 'Inactive') => void;
  updateZone: (zoneId: number, data: Partial<Zone>) => void;
  deleteZone: (zoneId: number) => void;
  addJoiner: (name: string, mobile: string, zone: string, email?: string, status?: 'Active' | 'Inactive') => void;
  updateJoiner: (joinerId: number | string, data: Partial<Joiner>) => void;
  deleteJoiner: (joinerId: number | string) => void;
  addHotel: (
    nameOrData: string | { name: string; contactPerson?: string; ownerName?: string; phone?: string; mobile?: string; zone: string; joiner: string; address?: string; status?: 'Active' | 'Inactive' },
    owner?: string,
    mobile?: string,
    zone?: string,
    joiner?: string
  ) => void;
  updateHotel: (hotelId: number, data: Partial<Hotel>) => void;
  deleteHotel: (hotelId: number) => void;
  addDriver: (driver: Partial<Driver>) => void;
  updateDriver: (driverId: number, data: Partial<Driver>) => void;
  deleteDriver: (driverId: number) => void;
  addProduct: (product: Partial<Product>) => void;
  updateProduct: (productId: number, data: Partial<Product>) => void;
  deleteProduct: (productId: number) => void;
  addOrder: (order: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  addPayment: (payment: Partial<PaymentTransaction>) => void;
  deletePayment: (paymentId: number | string) => void;
  addNotification: (notification: Partial<NotificationItem>) => void;
  deleteNotification: (id: number | string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

import {
  initialOrders,
  initialZones,
  initialJoiners,
  initialHotels,
  initialPayments,
  initialNotifications
} from '../mockData';
import { initialDriversList } from '../data/driversData';
import { initialProductsList } from '../data/productsData';

// One-time purge of legacy mock data from browser storage
if (typeof window !== 'undefined') {
  const CLEAN_MOCK_VERSION = 'farmerbox_cleaned_dummy_data_v2';
  if (localStorage.getItem(CLEAN_MOCK_VERSION) !== 'true') {
    const keysToPurge = ['orders', 'joiners', 'drivers', 'hotels', 'payments', 'notifications'];
    keysToPurge.forEach((k) => localStorage.removeItem(`farmerbox_${k}`));
    localStorage.setItem(CLEAN_MOCK_VERSION, 'true');
  }
}

// Helper to read persisted local data with fallback
const getStoredOrFallback = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`farmerbox_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Error reading local storage for ${key}:`, e);
  }
  return fallback;
};

// Helper to save data to local storage
const saveToLocal = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`farmerbox_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error persisting ${key} to local storage:`, e);
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isConnected = isFirebaseConfigured();
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Primary application state — initialized from localStorage if available, otherwise empty dynamic array
  const [orders, setOrders] = useState<Order[]>(() => getStoredOrFallback('orders', []));
  const [zones, setZones] = useState<Zone[]>(() => getStoredOrFallback('zones', []));
  const [joiners, setJoiners] = useState<Joiner[]>(() => getStoredOrFallback('joiners', []));
  const [drivers, setDrivers] = useState<Driver[]>(() => getStoredOrFallback('drivers', []));
  const [hotels, setHotels] = useState<Hotel[]>(() => getStoredOrFallback('hotels', []));
  const [products, setProducts] = useState<Product[]>(() => getStoredOrFallback('products', initialProductsList));
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => getStoredOrFallback('payments', []));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStoredOrFallback('notifications', []));

  // Sync state changes to localStorage
  useEffect(() => { saveToLocal('orders', orders); }, [orders]);
  useEffect(() => { saveToLocal('zones', zones); }, [zones]);
  useEffect(() => { saveToLocal('joiners', joiners); }, [joiners]);
  useEffect(() => { saveToLocal('drivers', drivers); }, [drivers]);
  useEffect(() => { saveToLocal('hotels', hotels); }, [hotels]);
  useEffect(() => { saveToLocal('products', products); }, [products]);
  useEffect(() => { saveToLocal('payments', payments); }, [payments]);
  useEffect(() => { saveToLocal('notifications', notifications); }, [notifications]);

  // Subscriptions strictly to Cloud Firestore in real-time
  useEffect(() => {
    const handleErr = (err: Error) => {
      setFirestoreError(err.message || 'Firestore connection error');
    };

    const unsubOrders = subscribeToCollection<any>('orders', (data) => {
      const normalizedOrders: Order[] = (data || []).map((ord: any) => ({
        ...ord,
        id: String(ord.id || ord.orderId || `FB${Math.floor(1000 + Math.random() * 9000)}`),
        orderId: String(ord.orderId || ord.id || ''),
        hotelName: ord.hotelName || 'Hotel Partner',
        hotelId: ord.hotelId || '',
        joiner: ord.joiner || ord.joinerName || ord.assignedJoiner || 'Direct Partner',
        joinerId: ord.joinerId || ord.joinedBy || '',
        zone: ord.zone || ord.hotelZone || 'Baner',
        amount: Number(ord.amount || ord.totalAmount || ord.subtotal || 0),
        totalAmount: Number(ord.totalAmount || ord.amount || ord.subtotal || 0),
        date: ord.date || ord.orderDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: ord.time || '10:00 AM',
        status: ord.status || ord.orderStatus || 'Pending',
        orderStatus: ord.orderStatus || ord.status || 'Pending',
        paymentMode: ord.paymentMode || ord.paymentMethod || 'Online',
        paymentStatus: ord.paymentStatus || 'Pending',
        driver: ord.driver || 'Not Assigned',
        driverPhone: ord.driverPhone || '',
        commission: Number(ord.commission ?? 100),
        walletCredited: Boolean(ord.walletCredited || (ord.status === 'Delivered' && ord.bonusStatus?.includes('Credited'))),
        items: (ord.items && ord.items.length > 0)
          ? ord.items.map((item: any, i: number) => ({
              id: item.id || item.productId || i + 1,
              productName: item.productName || item.name || 'Produce Item',
              qty: Number(item.qty || item.quantity || (typeof item.qty === 'string' ? parseFloat(item.qty) : 1)),
              unit: item.unit || 'KG',
              price: Number(item.price || 0),
              total: Number(item.total || ((item.price || 0) * (item.quantity || item.qty || 1)))
            }))
          : []
      }));
      setOrders(normalizedOrders);
    }, handleErr);

    const unsubZones = subscribeToCollection<Zone>('zones', (z) => {
      const validZones = z || [];
      setZones(validZones);
      setSelectedZone(prev => prev ? (validZones.find(item => String(item.id) === String(prev.id)) || validZones[0] || null) : (validZones[0] || null));
    }, handleErr);

    const unsubJoiners = subscribeToCollection<any>('joiners', (j) => {
      const normalizedJoiners: Joiner[] = (j || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `usr_${idx + 1}`,
        name: item.name || 'Joiner Partner',
        mobile: item.mobile || item.phone || '',
        phone: item.phone || item.mobile || '',
        email: item.email || `${(item.name || 'joiner').toLowerCase().replace(/\s+/g, '')}@farmerbox.in`,
        zone: item.zone || 'Baner',
        joinerCode: item.joinerCode || `JB${String(item.id || '').replace(/\D/g, '').slice(-4) || (1001 + idx)}`,
        status: (item.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
        totalHotels: Number(item.totalHotels || item.hotelsCount || 0),
        totalOrders: Number(item.totalOrders || item.ordersCount || 0),
        totalEarnings: Number(item.totalEarnings || item.commissionEarned || (item.walletBalance || 0)),
        commissionEarned: Number(item.commissionEarned || item.totalEarnings || (item.walletBalance || 0)),
        walletBalance: Number(item.walletBalance ?? item.totalEarnings ?? 0),
        paidAmount: Number(item.paidAmount ?? 0),
        pendingAmount: Number(item.pendingAmount ?? item.walletBalance ?? 0),
        avatar: item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        upiId: item.upiId || `${(item.name || 'joiner').toLowerCase().replace(/\s+/g, '')}@okaxis`,
        bankName: item.bankName || 'HDFC Bank',
        accountNo: item.accountNo || '•••• •••• 4521',
        ifscCode: item.ifscCode || 'HDFC0001234'
      }));
      setJoiners(normalizedJoiners);
      setSelectedJoiner(prev => prev ? (normalizedJoiners.find(item => String(item.id) === String(prev.id)) || normalizedJoiners[0] || null) : (normalizedJoiners[0] || null));
    }, handleErr);

    const unsubDrivers = subscribeToCollection<Driver>('drivers', (d) => {
      const validDrivers = d || [];
      setDrivers(validDrivers);
      setSelectedDriver(prev => prev ? (validDrivers.find(item => String(item.id) === String(prev.id)) || validDrivers[0] || null) : (validDrivers[0] || null));
    }, handleErr);

    const unsubHotels = subscribeToCollection<any>('hotels', (h) => {
      const normalizedHotels: Hotel[] = (h || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `HT${Date.now().toString().slice(-6)}_${idx}`,
        name: item.name || 'Unnamed Hotel',
        ownerName: item.ownerName || item.contactPerson || 'Manager',
        contactPerson: item.contactPerson || item.ownerName || 'Manager',
        mobile: item.mobile || item.phone || '',
        phone: item.phone || item.mobile || '',
        email: item.email || '',
        zone: item.zone || 'Baner',
        joiner: item.joiner || item.assignedJoiner || 'Direct Partner',
        assignedJoiner: item.assignedJoiner || item.joiner || 'Direct Partner',
        joinedBy: item.joinedBy || item.joinerId || '',
        joinerId: item.joinerId || item.joinedBy || '',
        address: item.address || `${item.zone || 'Baner'}, Pune`,
        totalOrders: Number(item.totalOrders ?? item.orders ?? 0),
        orders: Number(item.orders ?? item.totalOrders ?? 0),
        dailyOrderKg: Number(item.dailyOrderKg ?? 0),
        type: item.type || 'Restaurant',
        totalSpent: Number(item.totalSpent ?? 0),
        registrationDate: item.registrationDate || item.joinedDate || item.createdAt?.slice?.(0, 10) || '2026-09-01',
        gstNumber: item.gstNumber || item.gst || '',
        fssaiNumber: item.fssaiNumber || item.fssai || '',
        rating: Number(item.rating || 4.8),
        status: (item.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
        image: item.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'
      }));
      setHotels(normalizedHotels);
      setSelectedHotel(prev => prev ? (normalizedHotels.find(item => String(item.id) === String(prev.id)) || normalizedHotels[0] || null) : (normalizedHotels[0] || null));
    }, handleErr);

    const unsubProducts = subscribeToCollection<Product>('products', (p) => {
      if (p && p.length > 0) {
        const initialMap = new Map(initialProductsList.map(item => [item.id, item]));
        const normalized = p.map(item => {
          const initialMatch = initialMap.get(item.id);
          const nameLower = (item.name || '').toLowerCase();
          const unitLower = (item.unit || '').toLowerCase();

          let catalog: 'B2C' | 'B2B' | 'Both' = initialMatch?.catalogType || item.catalogType || item.targetCatalog || 'Both';
          if (nameLower.startsWith('b2b') || unitLower.includes('bag (50') || unitLower.includes('sack')) {
            catalog = 'B2B';
          } else if (item.category === 'Fruits' || item.category === 'Citrus & Melons' || item.category === 'Vegetables' || item.category === 'Root Veggies' || item.category === 'Leafy Greens' || item.category === 'Exotic Veggies' || item.category === 'Herbs & Seasoning') {
            catalog = 'Both';
          }

          return {
            ...item,
            catalogType: catalog,
            targetCatalog: catalog,
            b2bPrice: item.b2bPrice ?? initialMatch?.b2bPrice ?? item.salePrice,
            b2cPrice: item.b2cPrice ?? initialMatch?.b2cPrice ?? item.salePrice,
            minOrderQty: item.minOrderQty ?? initialMatch?.minOrderQty ?? 1,
            image: resolveProductImage(item.name, item.category, item.image || (item as any).imageUrl),
            images: (item.images && item.images.length > 0)
              ? item.images.map(img => resolveProductImage(item.name, item.category, img))
              : [resolveProductImage(item.name, item.category, item.image || (item as any).imageUrl)]
          };
        });
        setProducts(normalized);
        setSelectedProduct(prev => prev ? (normalized.find(item => String(item.id) === String(prev.id)) || normalized[0] || null) : (normalized[0] || null));
      }
    }, handleErr);

    const unsubPayments = subscribeToCollection<PaymentTransaction>('payments', (data) => {
      if (data && data.length > 0) setPayments(data);
    }, handleErr);

    const unsubNotifs = subscribeToCollection<any>('notifications', (rawNotifs) => {
      if (rawNotifs && rawNotifs.length > 0) {
        const normalized: NotificationItem[] = rawNotifs.map((n: any) => ({
          id: n.id !== undefined && n.id !== null ? n.id : Date.now(),
          title: n.title || 'Notification',
          message: n.message || n.subtitle || 'No details provided',
          subtitle: n.subtitle || n.message || '',
          userType: n.userType || n.category || 'All Users',
          status: n.status || 'Sent',
          dateTime: n.dateTime || n.time || new Date().toLocaleString(),
          time: n.time || n.dateTime || 'Just now',
          read: Boolean(n.read),
          category: n.category || 'System',
          iconType: n.iconType || 'system'
        }));
        setNotifications(normalized);
      }
    }, handleErr);

    return () => {
      unsubOrders();
      unsubZones();
      unsubJoiners();
      unsubDrivers();
      unsubHotels();
      unsubProducts();
      unsubPayments();
      unsubNotifs();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<string>('Dashboard');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedJoiner, setSelectedJoiner] = useState<Joiner | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isRemembered = localStorage.getItem('farmerbox_remember_me') === 'true';
    const localLoggedIn = localStorage.getItem('farmerbox_admin_logged_in') === 'true';
    const sessionLoggedIn = sessionStorage.getItem('farmerbox_admin_logged_in') === 'true';

    // Persist login only if Remember Me is explicitly enabled AND local login flag is active
    if (isRemembered && localLoggedIn) {
      return true;
    }
    // Or if currently active in this browser session
    if (sessionLoggedIn) {
      return true;
    }
    // Default: Show login page for first time / unauthenticated users
    return false;
  });

  const [isAddHotelOpen, setIsAddHotelOpen] = useState(false);
  const [isAddJoinerOpen, setIsAddJoinerOpen] = useState(false);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  // Universal CRUD Confirmation & Action Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    entityName?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const confirmAction = (config: {
    title: string;
    message: string;
    entityName?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: config.title,
      message: config.message,
      entityName: config.entityName,
      confirmLabel: config.confirmLabel || 'Confirm',
      cancelLabel: config.cancelLabel || 'Cancel',
      type: config.type || 'danger',
      onConfirm: config.onConfirm
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const loginAdmin = async (email: string, password?: string, rememberMe: boolean = true): Promise<boolean> => {
    const user = await authService.loginWithPhoneOrEmail(email, password, 'admin');
    if (!user || user.role !== 'admin') {
      throw new Error('Access denied. Only authorized administrators can log in to FarmerBox Admin Panel.');
    }
    setIsAdminLoggedIn(true);

    // Dynamically set admin profile to the logged-in user's name and email
    const updatedProfile: AdminProfile = {
      ...adminProfile,
      name: user.name || 'Admin',
      email: user.email || (email.includes('@') ? email : `${email}@farmerbox.com`),
      phone: user.phone || user.phoneNumber || adminProfile.phone,
      role: (user.name && user.name.toLowerCase().includes('pushpak')) ? 'Super Admin' : 'Admin'
    };
    setAdminProfile(updatedProfile);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('farmerbox_admin_logged_in', 'true');
      sessionStorage.setItem('farmerbox_admin_email', user.email);
      localStorage.setItem('farmerbox_admin_profile', JSON.stringify(updatedProfile));

      if (rememberMe) {
        localStorage.setItem('farmerbox_admin_logged_in', 'true');
        localStorage.setItem('farmerbox_remember_me', 'true');
        localStorage.setItem('farmerbox_saved_email', user.email);
        localStorage.setItem('farmerbox_admin_email', user.email);
      } else {
        localStorage.setItem('farmerbox_admin_logged_in', 'false');
        localStorage.removeItem('farmerbox_remember_me');
        localStorage.removeItem('farmerbox_saved_email');
        localStorage.removeItem('farmerbox_admin_email');
      }
    }
    return true;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setIsLogoutConfirmOpen(false);
    setIsAdminProfileOpen(false);
    setActiveTab('Dashboard');
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmerbox_admin_logged_in', 'false');
      localStorage.removeItem('farmerbox_admin_email');
      localStorage.removeItem('farmerbox_remember_me');
      localStorage.removeItem('farmerbox_admin_profile');
      sessionStorage.removeItem('farmerbox_admin_logged_in');
      sessionStorage.removeItem('farmerbox_admin_email');
    }
    authService.logout().catch(() => {});
  };

  // Admin Profile stored in Firestore 'settings/admin_profile' + LocalStorage cache
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('farmerbox_admin_profile');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        // ignore
      }
    }
    return {
      name: 'Pushpak Wani',
      role: 'Super Admin',
      email: 'admin@farmerbox.com',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      zone: 'All Zones (HQ)',
      location: 'Pune, Maharashtra',
      department: 'Operations & Management',
      joinedDate: 'Jan 2025',
      bio: 'Overseeing daily vegetable supply chain operations, hotel partner onboardings, and automated driver dispatch across Pune metropolitan area.',
      emergencyContact: '+91 98220 11223 (Operations Manager)',
      timezone: '(GMT+05:30) Asia/Kolkata',
      language: 'English (India)'
    };
  });

  useEffect(() => {
    if (!isFirebaseConfigured() || !db) return;
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'admin_profile'), (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as AdminProfile;
          setAdminProfile(prev => {
            const currentEmail = typeof window !== 'undefined' ? (localStorage.getItem('farmerbox_admin_email') || '') : '';
            const isCustomUser = prev.name && prev.name !== 'Pushpak Wani' && !currentEmail.includes('pushpak');
            const merged = {
              ...prev,
              ...remoteData,
              name: isCustomUser ? prev.name : (remoteData.name || prev.name),
              email: isCustomUser ? prev.email : (remoteData.email || prev.email),
              role: isCustomUser ? prev.role : (remoteData.role || prev.role)
            };
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('farmerbox_admin_profile', JSON.stringify(merged));
              } catch (e) {}
            }
            return merged;
          });
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Admin profile subscription notice:', e);
    }
  }, []);

  const updateAdminProfile = async (data: Partial<AdminProfile>) => {
    const updated = { ...adminProfile, ...data };
    setAdminProfile(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('farmerbox_admin_profile', JSON.stringify(updated));
      } catch (e) {}
    }
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'settings', 'admin_profile'), updated, { merge: true });
      } catch (e: any) {
        console.error('Failed to update admin profile in Firestore:', e);
        setFirestoreError(e.message || 'Failed to save admin profile to Firestore');
      }
    }
  };

  const markNotificationsAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) {
        saveRecord('notifications', { ...n, read: true }, String(n.id));
      }
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id: number | string) => {
    const target = notifications.find(n => String(n.id) === String(id));
    if (target && !target.read) {
      saveRecord('notifications', { ...target, read: true }, String(target.id));
    }
    setNotifications(prev => prev.map(n => (String(n.id) === String(id) ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    notifications.forEach(n => {
      deleteRecord('notifications', n.id);
    });
    setNotifications([]);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const existing = orders.find(o => String(o.id) === String(orderId));
    if (existing) {
      const orderAmount = Number(existing.amount || existing.totalAmount || 0);
      const isAlreadyCredited = Boolean(existing.walletCredited);
      const shouldCreditWallet = newStatus === 'Delivered' && !isAlreadyCredited;

      const updated = {
        ...existing,
        status: newStatus,
        orderStatus: newStatus,
        isBonusEligible: true,
        bonusAmount: 100,
        bonusStatus: newStatus === 'Delivered' ? 'Approved & Credited to Wallet' : 'Pending Delivery Approval',
        commission: 100,
        walletCredited: isAlreadyCredited || shouldCreditWallet,
        updatedAt: new Date().toISOString()
      };
      await saveRecord('orders', updated);

      // If delivery is marked 'Delivered' by Admin or Driver, credit ₹100 to the Joiner / Hotel Partner's wallet
      if (shouldCreditWallet) {
        const joinerName = existing.joiner || 'Partner';
        const targetJoiner = joiners.find(j => 
          (j.name && joinerName && j.name.toLowerCase() === joinerName.toLowerCase()) || 
          (existing.joinerId && String(j.id) === String(existing.joinerId)) ||
          (existing.joinerPhone && j.mobile && j.mobile.replace(/\D/g, '') === existing.joinerPhone.replace(/\D/g, ''))
        );

        if (targetJoiner) {
          const newTotalEarnings = (Number(targetJoiner.totalEarnings) || 0) + 100;
          const newCommissionEarned = (Number(targetJoiner.commissionEarned) || 0) + 100;
          const newWalletBalance = (Number((targetJoiner as any).walletBalance) || 0) + 100;

          const updatedJoiner = {
            ...targetJoiner,
            totalEarnings: newTotalEarnings,
            commissionEarned: newCommissionEarned,
            walletBalance: newWalletBalance,
            updatedAt: new Date().toISOString()
          };

          setJoiners(prev => prev.map(j => String(j.id) === String(targetJoiner.id) ? updatedJoiner : j));
          await saveRecord('joiners', updatedJoiner, String(targetJoiner.id));

          // Also update Firestore 'users' doc if exists
          if (db && targetJoiner.id) {
            try {
              const cleanPhone = (targetJoiner.mobile || '').replace(/\D/g, '');
              const docId = String(targetJoiner.id).startsWith('usr_') ? String(targetJoiner.id) : `usr_${cleanPhone || targetJoiner.id}`;
              const userDocRef = doc(db, 'users', docId);
              setDoc(userDocRef, {
                walletBalance: newWalletBalance,
                totalEarnings: newTotalEarnings,
                commissionEarned: newCommissionEarned,
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            } catch (e) {
              // ignore
            }
          }
        }

        // Also add a Payment / Wallet Transaction Record
        const newPaymentTxn: PaymentTransaction = {
          id: Date.now(),
          dateTime: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
          referenceId: `PAY${Math.floor(100000 + Math.random() * 900000)}`,
          type: 'Joiner Commission',
          fromTo: existing.joiner || existing.hotelName,
          orderId: String(orderId),
          amount: 100,
          status: 'Success',
          paymentMode: 'Wallet'
        };
        addPayment(newPaymentTxn);

        // Notify Joiner & Admin of the ₹100 Wallet Credit
        addNotification({
          title: `₹100 Wallet Reward Credited! 🎉`,
          message: `Order #${orderId} delivered to ${existing.hotelName}. ₹100 has been credited to ${existing.joiner || 'Partner'}'s wallet account!`,
          subtitle: `${existing.hotelName} • ₹100 Wallet Balance Added`,
          userType: 'Joiners',
          status: 'Sent',
          category: 'Commission',
          iconType: 'commission',
          read: false
        });
      }

      addNotification({
        title: `Order #${orderId} ${newStatus}`,
        message: `Order status changed to ${newStatus} for ${existing.hotelName}`,
        subtitle: `${existing.hotelName} • ${newStatus}`,
        userType: 'All Users',
        status: 'Sent',
        category: 'Orders',
        iconType: 'order',
        read: false
      });
    }

    setOrders(prev =>
      prev.map(ord => {
        if (String(ord.id) === String(orderId)) {
          const isAlreadyCredited = Boolean(ord.walletCredited);
          const shouldCredit = newStatus === 'Delivered' && !isAlreadyCredited;
          return {
            ...ord,
            status: newStatus,
            orderStatus: newStatus,
            isBonusEligible: true,
            bonusAmount: 100,
            bonusStatus: newStatus === 'Delivered' ? 'Approved & Credited to Wallet' : 'Pending Delivery Approval',
            commission: 100,
            walletCredited: isAlreadyCredited || shouldCredit
          };
        }
        return ord;
      })
    );
  };

  const assignDriverToOrder = async (
    orderId: string,
    driverName: string,
    driverPhone?: string,
    driverId?: string | number,
    newStatus: OrderStatus = 'Out for Delivery'
  ) => {
    const existing = orders.find(o => String(o.id) === String(orderId));
    const matchedDriver = drivers.find(d => 
      (driverName && d.name && d.name.toLowerCase() === driverName.toLowerCase()) ||
      (driverId && String(d.id) === String(driverId))
    );

    const finalDriverName = driverName || matchedDriver?.name || 'Assigned Driver';
    const finalDriverPhone = driverPhone || matchedDriver?.mobile || '9876123456';
    const finalDriverId = driverId || matchedDriver?.id || 'DR01';

    if (existing) {
      const updated: Order = {
        ...existing,
        driver: finalDriverName,
        driverPhone: finalDriverPhone,
        driverId: finalDriverId,
        status: newStatus,
        orderStatus: newStatus,
        updatedAt: new Date().toISOString()
      };

      await saveRecord('orders', updated);

      addNotification({
        title: `Driver Assigned to Order #${orderId} 🚚`,
        message: `Order #${orderId} (${existing.hotelName}) has been assigned to driver ${finalDriverName}. Status: ${newStatus}.`,
        subtitle: `${finalDriverName} • ${newStatus}`,
        userType: 'Drivers',
        status: 'Sent',
        category: 'Orders',
        iconType: 'driver',
        read: false
      });
    }

    setOrders(prev =>
      prev.map(ord => {
        if (String(ord.id) === String(orderId)) {
          return {
            ...ord,
            driver: finalDriverName,
            driverPhone: finalDriverPhone,
            driverId: finalDriverId,
            status: newStatus,
            orderStatus: newStatus
          };
        }
        return ord;
      })
    );
  };

  const acceptOrder = async (orderId: string, driverName?: string) => {
    if (driverName) {
      await assignDriverToOrder(orderId, driverName, undefined, undefined, 'Out for Delivery');
    } else {
      await updateOrderStatus(orderId, 'Confirmed');
    }
  };

  const addZone = async (name: string, area?: string, status?: 'Active' | 'Inactive') => {
    const newZone: Zone = {
      id: Date.now(),
      name,
      areaLocations: area || `${name}, Pune`,
      joinersCount: 0,
      hotelsCount: 0,
      ordersThisMonth: 0,
      salesThisMonth: 0,
      status: status || 'Active',
      color: '#38bdf8',
      addedBy: 'Admin',
      createdBy: adminProfile.name || 'Super Admin'
    };
    await saveRecord('zones', newZone);
    setZones(prev => [newZone, ...prev]);
    addNotification({
      title: 'New Zone Added by Admin',
      message: `Zone '${name}' created by Admin (${adminProfile.name || 'Super Admin'})`,
      subtitle: `${name} • Added by Admin`,
      userType: 'Admins',
      status: 'Sent',
      category: 'System',
      iconType: 'system',
      read: false
    });
  };

  const updateZone = async (zoneId: number, data: Partial<Zone>) => {
    const existing = zones.find(z => z.id === zoneId);
    if (existing) {
      const updated = { ...existing, ...data };
      await saveRecord('zones', updated);
    }
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...data } : z));
    if (selectedZone && selectedZone.id === zoneId) {
      setSelectedZone(prev => (prev ? { ...prev, ...data } : null));
    }
  };

  const deleteZone = async (zoneId: number) => {
    setZones(prev => prev.filter(z => z.id !== zoneId));
    if (selectedZone && selectedZone.id === zoneId) {
      const remaining = zones.filter(z => z.id !== zoneId);
      setSelectedZone(remaining.length > 0 ? remaining[0] : null);
    }
    try {
      await deleteRecord('zones', zoneId);
    } catch (e) {
      console.warn('Could not delete zone from firestore:', e);
    }
  };

  const addJoiner = async (name: string, mobile: string, zone: string, email?: string, status?: 'Active' | 'Inactive') => {
    const newId = Date.now();
    const formattedCode = `JN${String(joiners.length + 1).padStart(3, '0')}`;
    const newJoiner: Joiner = {
      id: newId,
      joinerCode: formattedCode,
      name: name.trim(),
      mobile: mobile.trim(),
      email: (email || `${name.trim().toLowerCase().replace(/\s+/g, '')}@farmerbox.in`).trim(),
      zone: zone || 'Kharadi',
      totalHotels: 0,
      totalOrders: 0,
      totalEarnings: 0,
      paidAmount: 0,
      pendingAmount: 0,
      status: status || 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      joinedDate: 'Just now',
      addedBy: 'Admin',
      createdBy: adminProfile.name || 'Super Admin'
    };

    // Immediate optimistic state update
    setJoiners(prev => [newJoiner, ...prev.filter(j => String(j.id) !== String(newId))]);
    setSelectedJoiner(newJoiner);

    try {
      await saveRecord('joiners', newJoiner, String(newId));
    } catch (e) {
      console.warn('Could not persist joiner to firestore:', e);
    }

    addNotification({
      title: 'New Joiner Added by Admin',
      message: `${name} onboarded by Admin in ${zone} Zone`,
      subtitle: `${name} • Added by Admin`,
      userType: 'Admins',
      status: 'Sent',
      category: 'System',
      iconType: 'system',
      read: false
    });
  };

  const updateJoiner = async (joinerId: number | string, data: Partial<Joiner>) => {
    const existing = joiners.find(j => String(j.id) === String(joinerId));
    const oldName = existing?.name;

    // Immediate optimistic update
    setJoiners(prev => prev.map(j => String(j.id) === String(joinerId) ? { ...j, ...data } : j));
    if (selectedJoiner && String(selectedJoiner.id) === String(joinerId)) {
      setSelectedJoiner(prev => (prev ? { ...prev, ...data } : null));
    }

    // If joiner name updated, cascade to associated hotels
    if (data.name && oldName && data.name !== oldName) {
      setHotels(prev => prev.map(h => {
        if (h.joiner === oldName || h.assignedJoiner === oldName) {
          return { ...h, joiner: data.name!, assignedJoiner: data.name! };
        }
        return h;
      }));
    }

    if (existing) {
      const updated = { ...existing, ...data };
      try {
        await saveRecord('joiners', updated, String(joinerId));
      } catch (e) {
        console.warn('Could not update joiner in firestore:', e);
      }
    }
  };

  const deleteJoiner = async (joinerId: number | string) => {
    // Immediate optimistic update
    setJoiners(prev => prev.filter(j => String(j.id) !== String(joinerId)));
    if (selectedJoiner && String(selectedJoiner.id) === String(joinerId)) {
      const remaining = joiners.filter(j => String(j.id) !== String(joinerId));
      setSelectedJoiner(remaining.length > 0 ? remaining[0] : null);
    }

    try {
      await deleteRecord('joiners', joinerId);
    } catch (e) {
      console.warn('Could not delete joiner from firestore:', e);
    }
  };

  const addHotel = async (
    hotelOrName: string | any,
    ownerName?: string,
    mobile?: string,
    zone?: string,
    joiner?: string
  ) => {
    let nameVal = '';
    let ownerVal = '';
    let mobileVal = '';
    let zoneVal = '';
    let joinerVal = '';
    let addressVal = '';

    if (typeof hotelOrName === 'object' && hotelOrName !== null) {
      nameVal = hotelOrName.name || 'New Hotel';
      ownerVal = hotelOrName.contactPerson || hotelOrName.ownerName || 'Owner';
      mobileVal = hotelOrName.phone || hotelOrName.mobile || '9876543210';
      zoneVal = hotelOrName.zone || 'Kharadi';
      joinerVal = hotelOrName.joiner || 'Admin';
      addressVal = hotelOrName.address || `${zoneVal}, Pune`;
    } else {
      nameVal = hotelOrName;
      ownerVal = ownerName || 'Owner';
      mobileVal = mobile || '9876543210';
      zoneVal = zone || 'Kharadi';
      joinerVal = joiner || 'Admin';
      addressVal = `${zoneVal}, Pune`;
    }

    const newHotel: Hotel = {
      id: Date.now(),
      name: nameVal,
      ownerName: ownerVal,
      mobile: mobileVal,
      email: `${nameVal.toLowerCase().replace(/\s+/g, '')}@hotel.com`,
      zone: zoneVal,
      joiner: joinerVal || 'Admin',
      assignedJoiner: joinerVal || 'Admin',
      joinedBy: joinerVal === 'Admin' || !joinerVal ? 'Admin' : joinerVal,
      addedBy: 'Admin',
      createdBy: adminProfile.name || 'Super Admin',
      address: addressVal,
      totalOrders: 0,
      totalSpent: 0,
      registrationDate: 'Just now',
      gstNumber: '27ABCDE1234F9Z9',
      fssaiNumber: '11521007000999',
      rating: 5.0,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300'
    };
    await saveRecord('hotels', newHotel);
    setHotels(prev => [newHotel, ...prev]);
    addNotification({
      title: 'New Hotel Added by Admin',
      message: `${newHotel.name} registered by Admin in ${newHotel.zone} Zone`,
      subtitle: `${newHotel.name} • Added by Admin`,
      userType: 'Admins',
      status: 'Sent',
      category: 'Hotels',
      iconType: 'hotel',
      read: false
    });
  };

  const updateHotel = async (hotelId: number, data: Partial<Hotel>) => {
    const existing = hotels.find(h => h.id === hotelId);
    if (existing) {
      const updated = { ...existing, ...data };
      await saveRecord('hotels', updated);
    }
    setHotels(prev => prev.map(h => (h.id === hotelId ? { ...h, ...data } : h)));
    if (selectedHotel && selectedHotel.id === hotelId) {
      setSelectedHotel(prev => (prev ? { ...prev, ...data } : null));
    }
  };

  const deleteHotel = async (hotelId: number | string) => {
    setHotels(prev => prev.filter(h => String(h.id) !== String(hotelId)));
    if (selectedHotel && String(selectedHotel.id) === String(hotelId)) {
      const remaining = hotels.filter(h => String(h.id) !== String(hotelId));
      setSelectedHotel(remaining.length > 0 ? remaining[0] : null);
    }
    try {
      await deleteRecord('hotels', hotelId);
    } catch (e) {
      console.warn('Could not delete hotel from firestore:', e);
    }
  };

  const addDriver = async (driverData: Partial<Driver>) => {
    const newDriver: Driver = {
      id: Date.now(),
      name: driverData.name || 'New Driver',
      mobile: driverData.mobile || '9876543210',
      zone: driverData.zone || 'Kharadi',
      vehicleNo: driverData.vehicleNo || 'MH12 AB 9999',
      status: driverData.status || 'Active',
      totalDeliveries: 0,
      rating: 5.0,
      avatar: driverData.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      email: driverData.email || `${(driverData.name || 'driver').toLowerCase().replace(/\s+/g, '')}@farmerbox.in`,
      emergencyContact: driverData.emergencyContact || '9876543210',
      licenseNumber: driverData.licenseNumber || `MH12-${Date.now().toString().slice(-8)}`,
      vehicleModel: driverData.vehicleModel || 'Tata Ace Gold',
      joiningDate: 'Just now',
      completedToday: 0,
      activeDeliveries: 0,
      onTimeRate: '100%',
      addedBy: 'Admin',
      createdBy: adminProfile.name || 'Super Admin',
      recentOrders: []
    };
    try {
      await saveRecord('drivers', newDriver);
    } catch (e) {
      console.warn('Could not save driver to firestore:', e);
    }
    setDrivers(prev => [newDriver, ...prev]);
    addNotification({
      title: 'New Driver Added by Admin',
      message: `${newDriver.name} onboarded by Admin`,
      subtitle: `${newDriver.name} • Added by Admin`,
      userType: 'Admins',
      status: 'Sent',
      category: 'System',
      iconType: 'system',
      read: false
    });
  };

  const updateDriver = async (driverId: number | string, data: Partial<Driver>) => {
    const existing = drivers.find(d => String(d.id) === String(driverId));
    setDrivers(prev => prev.map(d => (String(d.id) === String(driverId) ? { ...d, ...data } : d)));
    if (selectedDriver && String(selectedDriver.id) === String(driverId)) {
      setSelectedDriver(prev => (prev ? { ...prev, ...data } : null));
    }
    if (existing) {
      const updated = { ...existing, ...data };
      try {
        await saveRecord('drivers', updated);
      } catch (e) {
        console.warn('Could not update driver in firestore:', e);
      }
    }
  };

  const deleteDriver = async (driverId: number | string) => {
    setDrivers(prev => prev.filter(d => String(d.id) !== String(driverId)));
    if (selectedDriver && String(selectedDriver.id) === String(driverId)) {
      const remaining = drivers.filter(d => String(d.id) !== String(driverId));
      setSelectedDriver(remaining.length > 0 ? remaining[0] : null);
    }
    try {
      await deleteRecord('drivers', driverId);
    } catch (e) {
      console.warn('Could not delete driver from firestore:', e);
    }
  };

  const addProduct = async (prodData: Partial<Product>) => {
    const resolvedImg = resolveProductImage(prodData.name, prodData.category, prodData.imageUrl || prodData.image);
    const newProduct: Product = {
      id: Date.now(),
      name: prodData.name || 'New Vegetable',
      catalogType: prodData.catalogType || prodData.targetCatalog || 'B2C',
      targetCatalog: prodData.catalogType || prodData.targetCatalog || 'B2C',
      category: prodData.category || 'Vegetables',
      unit: prodData.unit || 'KG',
      purchasePrice: Number(prodData.purchasePrice) || 30,
      salePrice: Number(prodData.salePrice) || 45,
      b2bPrice: Number(prodData.b2bPrice) || Number(prodData.salePrice) || 45,
      b2cPrice: Number(prodData.b2cPrice) || Number(prodData.salePrice) || 45,
      minOrderQty: Number(prodData.minOrderQty) || 1,
      stock: Number(prodData.stock) ?? 100,
      minimumStock: Number(prodData.minimumStock) ?? 25,
      status: (prodData.status as any) || 'Active',
      addedOn: 'Just now',
      addedBy: 'Admin',
      createdBy: adminProfile.name || 'Super Admin',
      isImported: prodData.isImported,
      originCountry: prodData.originCountry,
      countryFlag: prodData.countryFlag,
      image: resolvedImg,
      description: prodData.description || `Fresh farm-sourced ${prodData.name || 'produce'} direct from trusted growers.`,
      images: prodData.images && prodData.images.length > 0 ? prodData.images : [resolvedImg],
      stockHistory: [
        { date: 'Today', type: 'Stock In', qty: `+${prodData.stock ?? 100} ${prodData.unit || 'KG'}`, ref: `PO-${Date.now().toString().slice(-4)}`, user: 'Admin' }
      ]
    };
    try {
      await saveRecord('products', newProduct);
    } catch (e) {
      console.warn('Could not save product to firestore:', e);
    }
    setProducts(prev => [newProduct, ...prev]);
    setSelectedProduct(newProduct);
    addNotification({
      title: 'New Product Added by Admin',
      message: `${newProduct.name} added by Admin with ${newProduct.stock} ${newProduct.unit} stock`,
      subtitle: `${newProduct.name} • Added by Admin`,
      userType: 'Admins',
      status: 'Sent',
      category: 'System',
      iconType: 'product',
      read: false
    });
  };

  const updateProduct = async (productId: number | string, data: Partial<Product>) => {
    const existing = products.find(p => String(p.id) === String(productId));
    if (existing) {
      const resolvedImg = data.image ? resolveProductImage(data.name || existing.name, data.category || existing.category, data.image) : existing.image;
      const updated = { ...existing, ...data, image: resolvedImg };
      setProducts(prev => prev.map(p => (String(p.id) === String(productId) ? updated : p)));
      if (selectedProduct && String(selectedProduct.id) === String(productId)) {
        setSelectedProduct(updated);
      }
      try {
        await saveRecord('products', updated);
      } catch (e) {
        console.warn('Could not update product in firestore:', e);
      }
    } else {
      setProducts(prev => prev.map(p => (String(p.id) === String(productId) ? { ...p, ...data } : p)));
    }
  };

  const deleteProduct = async (productId: number | string) => {
    setProducts(prev => prev.filter(p => String(p.id) !== String(productId)));
    if (selectedProduct && String(selectedProduct.id) === String(productId)) {
      const remaining = products.filter(p => String(p.id) !== String(productId));
      setSelectedProduct(remaining.length > 0 ? remaining[0] : null);
    }
    try {
      await deleteRecord('products', productId);
    } catch (e) {
      console.warn('Could not delete product from firestore:', e);
    }
  };

  const addOrder = async (orderData: Partial<Order>) => {
    const newOrder: Order = {
      id: orderData.id || `FB${Math.floor(1000 + Math.random() * 9000)}`,
      date: orderData.date || new Date().toISOString().split('T')[0],
      time: orderData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hotelName: orderData.hotelName || 'New Hotel',
      hotelImage: orderData.hotelImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
      zone: orderData.zone || 'Kharadi',
      joiner: orderData.joiner || 'Admin',
      amount: orderData.amount || 0,
      paymentMode: orderData.paymentMode || 'Online',
      paymentStatus: orderData.paymentStatus || 'Pending',
      driver: orderData.driver || 'Suresh Jadhav',
      status: orderData.status || 'Pending',
      commission: orderData.commission || 0,
      items: orderData.items || [],
      addedBy: 'Admin',
      createdBy: adminProfile.name || 'Super Admin',
      ...orderData
    };
    try {
      await saveRecord('orders', newOrder);
    } catch (e) {
      console.warn('Could not save order to firestore:', e);
    }
    setOrders(prev => [newOrder, ...prev]);
    addNotification({
      title: 'New Order Created by Admin',
      message: `Order #${newOrder.id} created by Admin for ${newOrder.hotelName}`,
      subtitle: `${newOrder.hotelName} • Added by Admin`,
      userType: 'Admins',
      status: 'Sent',
      category: 'Orders',
      iconType: 'order',
      read: false
    });
  };

  const deleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => String(o.id) !== String(orderId) && String(o.orderId || '') !== String(orderId)));
    if (selectedOrder && (String(selectedOrder.id) === String(orderId) || String(selectedOrder.orderId || '') === String(orderId))) {
      setSelectedOrder(null);
    }
    try {
      await deleteRecord('orders', orderId);
    } catch (e) {
      console.warn('Could not delete order from firestore:', e);
    }
  };

  const addPayment = async (paymentData: Partial<PaymentTransaction>) => {
    const newPayment: PaymentTransaction = {
      id: paymentData.id || Date.now(),
      dateTime: paymentData.dateTime || new Date().toLocaleString(),
      referenceId: paymentData.referenceId || `TXN${Math.floor(100000 + Math.random() * 900000)}`,
      type: paymentData.type || 'Order Payment',
      fromTo: paymentData.fromTo || 'Customer',
      orderId: paymentData.orderId || `FB${Math.floor(1000 + Math.random() * 9000)}`,
      amount: paymentData.amount || 0,
      status: paymentData.status || 'Success',
      paymentMode: paymentData.paymentMode || 'Online',
      ...paymentData
    };
    try {
      await saveRecord('payments', newPayment);
    } catch (e) {
      console.warn('Could not save payment to firestore:', e);
    }
    setPayments(prev => [newPayment, ...prev]);
  };

  const deletePayment = async (paymentId: number | string) => {
    setPayments(prev => prev.filter(p => String(p.id) !== String(paymentId)));
    try {
      await deleteRecord('payments', paymentId);
    } catch (e) {
      console.warn('Could not delete payment from firestore:', e);
    }
  };

  const addNotification = async (notifData: Partial<NotificationItem>) => {
    const docId = notifData.id !== undefined && notifData.id !== null ? String(notifData.id) : String(Date.now());
    const nowStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const newNotif: NotificationItem = {
      id: notifData.id !== undefined && notifData.id !== null ? notifData.id : Date.now(),
      title: notifData.title || 'Notification',
      message: notifData.message || notifData.subtitle || 'System notification',
      subtitle: notifData.subtitle || notifData.message || '',
      userType: notifData.userType || notifData.category || 'All Users',
      status: notifData.status || 'Sent',
      dateTime: notifData.dateTime || nowStr,
      time: notifData.time || 'Just now',
      read: false,
      category: notifData.category || 'System',
      iconType: notifData.iconType || 'system',
      ...notifData
    };
    try {
      await saveRecord('notifications', newNotif, docId);
    } catch (e) {
      console.warn('Could not save notification to firestore:', e);
    }
    setNotifications(prev => [newNotif, ...prev.filter(n => String(n.id) !== docId)]);
  };

  const deleteNotification = async (id: number | string) => {
    setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
    try {
      await deleteRecord('notifications', id);
    } catch (e) {
      console.warn('Could not delete notification from firestore:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        zones,
        joiners,
        drivers,
        hotels,
        products,
        payments,
        deletePayment,
        notifications,
        isDatabaseConnected: isConnected,
        firestoreError,
        seedDatabaseToFirebase: seedFirestoreDatabase,
        activeTab,
        setActiveTab,
        selectedOrder,
        setSelectedOrder,
        selectedZone,
        setSelectedZone,
        selectedJoiner,
        setSelectedJoiner,
        selectedHotel,
        setSelectedHotel,
        selectedProduct,
        setSelectedProduct,
        selectedDriver,
        setSelectedDriver,
        isAdminLoggedIn,
        loginAdmin,
        logoutAdmin,
        isAddHotelOpen,
        setIsAddHotelOpen,
        isAddJoinerOpen,
        setIsAddJoinerOpen,
        isAddZoneOpen,
        setIsAddZoneOpen,
        isAddDriverOpen,
        setIsAddDriverOpen,
        isAddProductOpen,
        setIsAddProductOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isOrderDetailModalOpen,
        setIsOrderDetailModalOpen,
        isAdminProfileOpen,
        setIsAdminProfileOpen,
        isLogoutConfirmOpen,
        setIsLogoutConfirmOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        confirmModal,
        confirmAction,
        closeConfirmModal,
        adminProfile,
        updateAdminProfile,
        markNotificationsAsRead,
        markNotificationAsRead,
        clearAllNotifications,
        updateOrderStatus,
        acceptOrder,
        assignDriverToOrder,
        addZone,
        updateZone,
        deleteZone,
        addJoiner,
        updateJoiner,
        deleteJoiner,
        addHotel,
        updateHotel,
        deleteHotel,
        addDriver,
        updateDriver,
        deleteDriver,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        deleteOrder,
        addPayment,
        addNotification,
        deleteNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
