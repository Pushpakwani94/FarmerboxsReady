import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type {
  Order,
  Zone,
  Joiner,
  Driver,
  Hotel,
  Product,
  PaymentTransaction,
  WalletTransaction,
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
import { orderService } from '../firebase/services/orderService';
import { hotelService } from '../firebase/services/hotelService';
import { resolveProductImage } from '../utils/productImages';
import { soundEngine } from '../mobileApp/utils/sound';

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
  walletTransactions: WalletTransaction[];
  notifications: NotificationItem[];
  isDatabaseConnected: boolean;
  firestoreError: string | null;
  seedDatabaseToFirebase: () => Promise<any>;

  // Real-time New Order Alert Popup
  newOrderAlert: { order: Order; visible: boolean } | null;
  dismissNewOrderAlert: () => void;
  simulateMultiMobileOrders: (devicesCount?: number) => Promise<string[]>;

  // Delivery Verification & Partner Commission
  approveDelivery: (orderId: string) => Promise<{ success: boolean; message: string }>;
  rejectDelivery: (orderId: string, reason?: string) => Promise<void>;

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
  updateZone: (zoneId: number | string, data: Partial<Zone>) => void;
  deleteZone: (zoneId: number | string) => void;
  addJoiner: (name: string, mobile: string, zone: string, email?: string, status?: 'Active' | 'Inactive', password?: string) => void;
  updateJoiner: (joinerId: number | string, data: Partial<Joiner>) => void;
  deleteJoiner: (joinerId: number | string) => void;
  deleteAllJoiners: () => void;
  addHotel: (
    nameOrData: string | { name: string; contactPerson?: string; ownerName?: string; phone?: string; mobile?: string; zone: string; joiner: string; address?: string; status?: 'Active' | 'Inactive' },
    owner?: string,
    mobile?: string,
    zone?: string,
    joiner?: string
  ) => void;
  updateHotel: (hotelId: number | string, data: Partial<Hotel>) => void;
  deleteHotel: (hotelId: number | string) => void;
  deleteAllHotels: () => void;
  addDriver: (driver: Partial<Driver>) => void;
  updateDriver: (driverId: number | string, data: Partial<Driver>) => void;
  deleteDriver: (driverId: number | string) => void;
  deleteAllDrivers: () => void;
  addProduct: (product: Partial<Product>) => void;
  updateProduct: (productId: number | string, data: Partial<Product>) => void;
  deleteProduct: (productId: number | string) => void;
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
  initialDrivers,
  initialHotels,
  initialPayments,
  initialNotifications
} from '../mockData';
import { initialDriversList } from '../data/driversData';
import { initialProductsList } from '../data/productsData';

// One-time purge of legacy mock data from browser storage
if (typeof window !== 'undefined') {
  const CLEAN_MOCK_VERSION = 'farmerbox_cleaned_dummy_joiners_v2';
  if (localStorage.getItem(CLEAN_MOCK_VERSION) !== 'true') {
    const keysToPurge = ['joiners', 'farmerbox_joiners', 'orders', 'hotels', 'drivers', 'zones', 'products'];
    keysToPurge.forEach((k) => {
      localStorage.removeItem(`farmerbox_${k}`);
      localStorage.removeItem(k);
    });
    localStorage.setItem(CLEAN_MOCK_VERSION, 'true');
  }
}

// Helper to read persisted local data with fallback
const getStoredOrFallback = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`farmerbox_${key}`);
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (key === 'joiners') {
          return parsed.filter((j: any) => {
            const ph = String(j.mobile || j.phone || '').replace(/\D/g, '');
            const id = String(j.id || j.uid || '');
            const name = String(j.name || '').toLowerCase();
            return ph !== '9822011111' && ph !== '9822022222' && ph !== '9822033333' &&
                   id !== 'usr_9822011111' && id !== 'usr_9822022222' && id !== 'usr_9822033333' &&
                   name !== 'rahul patil' && name !== 'amit shinde' && name !== 'vikas jadhav';
          }) as unknown as T[];
        }
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

// Dedicated Helper to Deduplicate and Normalize Hotels
export const deduplicateHotels = (list: any[]): Hotel[] => {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, any>();
  const phoneNameSet = new Set<string>();

  // Load deleted hotels blacklist from localStorage
  let deletedSet = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const delRaw = localStorage.getItem('farmerbox_deleted_hotel_ids');
      if (delRaw) {
        const parsed: string[] = JSON.parse(delRaw);
        deletedSet = new Set(parsed.map(x => String(x).toLowerCase().trim()));
      }
    } catch {}
  }

  list.forEach((item, idx) => {
    if (!item) return;
    const rawKey = String(item.hotelId || item.id || '').trim();
    const cleanPhone = String(item.mobile || item.phone || '').replace(/\D/g, '').slice(-10);
    const cleanName = String(item.name || item.hotelName || '').trim().toLowerCase();
    const phoneNameKey = cleanPhone && cleanName ? `${cleanName}_${cleanPhone}` : '';

    // Permanently filter out any deleted hotel
    if (
      (rawKey && deletedSet.has(rawKey.toLowerCase())) ||
      (cleanPhone && deletedSet.has(cleanPhone)) ||
      (phoneNameKey && deletedSet.has(phoneNameKey)) ||
      (cleanName && deletedSet.has(cleanName))
    ) {
      return;
    }

    if (rawKey && map.has(rawKey)) return;
    if (phoneNameKey && phoneNameSet.has(phoneNameKey)) return;

    if (rawKey) map.set(rawKey, item);
    if (phoneNameKey) phoneNameSet.add(phoneNameKey);
  });

  return Array.from(map.values()).map((item: any, idx: number) => {
    const idVal = item.id || item.hotelId || `HT${Date.now().toString().slice(-6)}_${idx}`;
    return {
      ...item,
      id: idVal,
      hotelId: item.hotelId || String(idVal),
      name: item.name || 'Unnamed Hotel',
      ownerName: item.ownerName || item.contactPerson || 'Manager',
      contactPerson: item.contactPerson || item.ownerName || 'Manager',
      mobile: item.mobile || item.phone || '',
      phone: item.phone || item.mobile || '',
      email: item.email || '',
      zone: (item.zone || 'Kharadi').replace(' Zone', ''),
      joiner: item.joiner || item.assignedJoiner || 'Direct Partner',
      assignedJoiner: item.assignedJoiner || item.joiner || 'Direct Partner',
      joinedBy: item.joinedBy || item.joinerId || '',
      joinerId: item.joinerId || item.joinedBy || '',
      address: item.address || `${(item.zone || 'Kharadi').replace(' Zone', '')}, Pune`,
      totalOrders: Number(item.totalOrders ?? item.orders ?? 0),
      orders: Number(item.orders ?? item.totalOrders ?? 0),
      dailyOrderKg: Number(item.dailyOrderKg ?? 0),
      type: item.type || 'Restaurant',
      totalSpent: Number(item.totalSpent ?? 0),
      registrationDate: item.registrationDate || item.joinedDate || 'Just now',
      gstNumber: item.gstNumber || item.gst || '',
      fssaiNumber: item.fssaiNumber || item.fssai || '',
      rating: Number(item.rating || 4.8),
      status: (item.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
      image: item.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'
    };
  });
};

// Dedicated Helper to Deduplicate and Normalize Orders
export const deduplicateOrders = (list: any[]): Order[] => {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, any>();

  list.forEach((item, idx) => {
    if (!item) return;
    const rawId = String(item.orderId || item.id || '');
    const cleanKey = rawId.replace(/^#/, '');
    if (!cleanKey) return;

    if (!map.has(cleanKey) && !map.has(rawId)) {
      map.set(cleanKey, item);
    }
  });

  const normalized = Array.from(map.values()).map((o, idx) => orderService.normalizeOrder(o, o.id || `ORD_${idx}`));
  normalized.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date || 0).getTime();
    const timeB = new Date(b.createdAt || b.date || 0).getTime();
    return timeB - timeA;
  });
  return normalized;
};

// Helper to load real initial orders from all mobile and admin sources
const getInitialOrdersState = (): Order[] => {
  if (typeof window === 'undefined') return [];
  const list: any[] = [];

  try {
    const mobRaw = localStorage.getItem('farmerbox_mobile_orders');
    if (mobRaw) {
      const parsed = JSON.parse(mobRaw);
      if (Array.isArray(parsed)) list.push(...parsed);
    }
  } catch {}

  try {
    const custRaw = localStorage.getItem('farmerbox_customer_orders');
    if (custRaw) {
      const parsed = JSON.parse(custRaw);
      if (Array.isArray(parsed)) list.push(...parsed);
    }
  } catch {}

  try {
    const adminRaw = localStorage.getItem('farmerbox_orders');
    if (adminRaw) {
      const parsed = JSON.parse(adminRaw);
      if (Array.isArray(parsed)) list.push(...parsed);
    }
  } catch {}

  return deduplicateOrders(list);
};

// Helper to load real initial hotels from mobile joiner app and admin
const getInitialHotelsState = (): Hotel[] => {
  if (typeof window === 'undefined') return [];
  const list: any[] = [];

  try {
    const mobRaw = localStorage.getItem('farmerbox_mobile_hotels');
    if (mobRaw) {
      const parsed = JSON.parse(mobRaw);
      if (Array.isArray(parsed)) list.push(...parsed);
    }
  } catch {}

  try {
    const adminRaw = localStorage.getItem('farmerbox_hotels');
    if (adminRaw) {
      const parsed = JSON.parse(adminRaw);
      if (Array.isArray(parsed)) list.push(...parsed);
    }
  } catch {}

  return deduplicateHotels(list);
};

// Dedicated Helper to Deduplicate and Normalize Joiners
export const deduplicateJoiners = (list: any[]): Joiner[] => {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, any>();
  const phoneSet = new Set<string>();
  const nameSet = new Set<string>();

  list.forEach((item, idx) => {
    if (!item) return;
    const cleanPhone = String(item.mobile || item.phone || item.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const cleanName = String(item.name || '').trim().toLowerCase();
    const rawKey = String(item.id || item.uid || '');

    // Strictly skip dummy seed joiners from database/storage
    if (
      cleanPhone === '9822011111' || cleanPhone === '9822022222' || cleanPhone === '9822033333' ||
      rawKey === 'usr_9822011111' || rawKey === 'usr_9822022222' || rawKey === 'usr_9822033333' ||
      cleanName === 'rahul patil' || cleanName === 'amit shinde' || cleanName === 'vikas jadhav'
    ) {
      return;
    }

    // Check against deleted joiners blacklist in localStorage
    if (typeof window !== 'undefined') {
      try {
        const deletedRaw = localStorage.getItem('farmerbox_deleted_joiner_ids');
        if (deletedRaw) {
          const deletedArr: string[] = JSON.parse(deletedRaw);
          if (
            (cleanPhone && deletedArr.includes(cleanPhone)) ||
            (rawKey && deletedArr.includes(rawKey)) ||
            (cleanPhone && deletedArr.includes(`usr_${cleanPhone}`))
          ) {
            return;
          }
        }
      } catch {}
    }

    // Check if phone or exact non-generic name is already registered
    if (cleanPhone && phoneSet.has(cleanPhone)) return;
    if (cleanName && cleanName !== 'joiner partner' && cleanName !== 'unnamed joiner' && nameSet.has(cleanName)) return;

    const primaryKey = cleanPhone ? `usr_${cleanPhone}` : (rawKey || `usr_${idx + 1}`);

    if (map.has(primaryKey)) return;

    map.set(primaryKey, item);
    if (cleanPhone) phoneSet.add(cleanPhone);
    if (cleanName && cleanName !== 'joiner partner' && cleanName !== 'unnamed joiner') nameSet.add(cleanName);
  });

  return Array.from(map.values()).map((item: any, idx: number) => {
    const cleanPhone = String(item.mobile || item.phone || item.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const primaryId = item.uid || item.id || (cleanPhone ? `usr_${cleanPhone}` : `usr_${idx + 1}`);
    const cleanName = item.name || (cleanPhone ? `Joiner ${cleanPhone.slice(-4)}` : 'Joiner Partner');

    return {
      ...item,
      id: primaryId,
      uid: item.uid || primaryId,
      name: cleanName,
      mobile: cleanPhone || item.mobile || item.phone || '',
      phone: cleanPhone || item.phone || item.mobile || '',
      email: item.email || `${cleanName.toLowerCase().replace(/\s+/g, '')}@farmerbox.in`,
      zone: (item.zone || 'Kharadi').replace(' Zone', ''),
      joinerCode: item.joinerCode || `JN${cleanPhone.slice(-4) || (1001 + idx)}`,
      status: (item.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
      totalHotels: Number(item.totalHotels || item.hotelsCount || 0),
      totalOrders: Number(item.totalOrders || item.ordersCount || 0),
      totalEarnings: Number(item.totalEarnings || item.commissionEarned || (item.walletBalance || 0)),
      commissionEarned: Number(item.commissionEarned || item.totalEarnings || (item.walletBalance || 0)),
      walletBalance: Number(item.walletBalance ?? item.totalEarnings ?? 0),
      paidAmount: Number(item.paidAmount ?? 0),
      pendingAmount: Number(item.pendingAmount ?? item.walletBalance ?? 0),
      avatar: item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      upiId: item.upiId || `${cleanName.toLowerCase().replace(/\s+/g, '')}@okaxis`,
      bankName: item.bankName || 'HDFC Bank',
      accountNo: item.accountNo || '•••• •••• 4521',
      ifscCode: item.ifscCode || 'HDFC0001234'
    };
  });
};

// Dedicated Helper to Deduplicate and Normalize Delivery Drivers
export const deduplicateDrivers = (list: any[]): Driver[] => {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, any>();
  const phoneSet = new Set<string>();

  // Load deleted drivers blacklist from localStorage
  let deletedSet = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const delRaw = localStorage.getItem('farmerbox_deleted_driver_ids');
      if (delRaw) {
        const parsed: string[] = JSON.parse(delRaw);
        deletedSet = new Set(parsed.map(x => String(x).toLowerCase().trim()));
      }
    } catch {}
  }

  list.forEach((item, idx) => {
    if (!item) return;
    const cleanPhone = String(item.mobile || item.phone || '').replace(/\D/g, '').slice(-10);
    const cleanName = String(item.name || '').trim().toLowerCase();
    const rawKey = String(item.id || '').trim();
    const vehicleNo = String(item.vehicleNo || item.vehicleNumber || '').trim().toUpperCase();

    // Strictly skip dummy seed drivers
    if (
      cleanPhone === '9876543210' || cleanPhone === '9876543211' || cleanPhone === '9876543212' ||
      rawKey === '1' || rawKey === '2' || rawKey === '3' ||
      cleanName === 'suresh jadhav' || cleanName === 'ramesh pawar' || cleanName === 'santosh shinde' ||
      vehicleNo === 'MH-12-FB-1001' || vehicleNo === 'MH-12-FB-1002' || vehicleNo === 'MH-12-FB-1003'
    ) {
      return;
    }

    // Check against deleted drivers blacklist
    if (
      (rawKey && deletedSet.has(rawKey.toLowerCase())) ||
      (cleanPhone && deletedSet.has(cleanPhone)) ||
      (cleanName && deletedSet.has(cleanName)) ||
      (vehicleNo && deletedSet.has(vehicleNo.toLowerCase()))
    ) {
      return;
    }

    if (cleanPhone && phoneSet.has(cleanPhone)) return;

    const primaryKey = cleanPhone ? `drv_${cleanPhone}` : (rawKey || `drv_${idx + 1}`);
    if (map.has(primaryKey)) return;

    map.set(primaryKey, item);
    if (cleanPhone) phoneSet.add(cleanPhone);
  });

  return Array.from(map.values()).map((item: any, idx: number) => {
    const cleanPhone = String(item.mobile || item.phone || '').replace(/\D/g, '').slice(-10);
    const idVal = item.id || (cleanPhone ? `DRV_${cleanPhone}` : idx + 1);

    return {
      ...item,
      id: idVal,
      name: item.name || 'Delivery Partner',
      phone: cleanPhone || item.phone || item.mobile || '',
      mobile: cleanPhone || item.mobile || item.phone || '',
      zone: (item.zone || 'Kharadi').replace(' Zone', ''),
      vehicleNo: item.vehicleNo || item.vehicleNumber || 'MH-12-FB-0000',
      vehicleNumber: item.vehicleNumber || item.vehicleNo || 'MH-12-FB-0000',
      vehicleType: item.vehicleType || 'Tata Ace (Chota Hathi)',
      status: item.status || 'Active',
      totalDeliveries: Number(item.totalDeliveries ?? item.deliveriesDone ?? 0),
      assignedOrdersCount: Number(item.assignedOrdersCount ?? 0),
      rating: Number(item.rating ?? 5.0),
      avatar: item.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
    };
  });
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isConnected = isFirebaseConfigured();
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Primary application state — initialized from central database
  const [orders, setOrders] = useState<Order[]>(() => getInitialOrdersState());
  const [zones, setZones] = useState<Zone[]>(() => getStoredOrFallback('zones', []));
  const [joiners, setJoiners] = useState<Joiner[]>(() => deduplicateJoiners(getStoredOrFallback('joiners', [])));
  const [drivers, setDrivers] = useState<Driver[]>(() => deduplicateDrivers(getStoredOrFallback('drivers', [])));
  const [hotels, setHotels] = useState<Hotel[]>(() => getInitialHotelsState());
  const [products, setProducts] = useState<Product[]>(() => getStoredOrFallback('products', []));
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => getStoredOrFallback('payments', []));
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStoredOrFallback('notifications', []));

  // Real-time New Order Banner Popup State
  const [newOrderAlert, setNewOrderAlert] = useState<{ order: Order; visible: boolean } | null>(null);
  const dismissNewOrderAlert = () => setNewOrderAlert(null);

  const isInitialOrderLoad = useRef(true);
  const knownOrderIds = useRef<Set<string>>(new Set());

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

    // Central Real-time Orders Listener (Firestore single source of truth)
    const unsubOrders = orderService.subscribe(
      (liveOrders) => {
        if (!liveOrders) {
          setOrders([]);
          return;
        }

        const cleanLiveOrders = deduplicateOrders(liveOrders);

        // Check for new orders placed from mobile devices in real-time
        if (!isInitialOrderLoad.current && cleanLiveOrders.length > 0) {
          const freshOrder = cleanLiveOrders.find(
            (o) => !knownOrderIds.current.has(o.orderId || o.id)
          );

          if (freshOrder) {
            try {
              soundEngine.playNotificationChime();
            } catch {}

            setNewOrderAlert({
              order: freshOrder,
              visible: true
            });

            // Automatically add top notification
            addNotification({
              title: `🔔 NEW ORDER #${freshOrder.orderId || freshOrder.id}`,
              message: `${freshOrder.customerName || freshOrder.hotelName} placed an order for ₹${freshOrder.amount} in ${freshOrder.zoneName || freshOrder.zone} Zone`,
              subtitle: `Partner: ${freshOrder.partnerName || freshOrder.joiner} • ${freshOrder.zoneName || freshOrder.zone}`,
              userType: 'Admins',
              status: 'Sent',
              category: 'Orders',
              iconType: 'order',
              read: false
            });
          }
        }

        // Record all current order IDs
        knownOrderIds.current = new Set(cleanLiveOrders.map(o => o.orderId || o.id));
        isInitialOrderLoad.current = false;
        setOrders(cleanLiveOrders);
      },
      (err) => {
        console.warn('Firestore orders live listener note:', err);
        handleErr(err);
      }
    );

    // Live Wallet Transactions Listener
    const unsubWalletTx = subscribeToCollection<WalletTransaction>('walletTransactions', (txList) => {
      if (txList) {
        setWalletTransactions(txList);
      }
    }, handleErr);

    // Listen for live mobile app order & hotel dispatch events in the current session
    const handleOrderCreatedEvent = (e: any) => {
      const newOrd = e?.detail;
      if (newOrd) {
        setOrders(prev => deduplicateOrders([newOrd, ...prev]));
      }
    };

    const handleHotelCreatedEvent = (e: any) => {
      const newHotel = e?.detail;
      if (newHotel) {
        setHotels(prev => deduplicateHotels([newHotel, ...prev]));
      }
    };

    let syncChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        syncChannel = new BroadcastChannel('farmerbox_sync');
        syncChannel.onmessage = (event) => {
          if (event.data?.type === 'ORDER_CREATED' && event.data.order) {
            const incoming = event.data.order;
            setOrders(prev => deduplicateOrders([incoming, ...prev]));
          } else if (event.data?.type === 'HOTEL_CREATED' && event.data.hotel) {
            const incomingHotel = event.data.hotel;
            setHotels(prev => deduplicateHotels([incomingHotel, ...prev]));
          }
        };
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('farmerbox_order_created', handleOrderCreatedEvent);
      window.addEventListener('farmerbox_hotel_created', handleHotelCreatedEvent);
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'farmerbox_mobile_orders' || e.key === 'farmerbox_orders' || e.key === 'farmerbox_customer_orders') {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setOrders(prev => deduplicateOrders([...parsed, ...prev]));
            }
          }
        } catch {}
      } else if (e.key === 'farmerbox_mobile_hotels' || e.key === 'farmerbox_hotels') {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setHotels(prev => deduplicateHotels([...parsed, ...prev]));
            }
          }
        } catch {}
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
    }

    const unsubZones = subscribeToCollection<Zone>('zones', (z) => {
      const validZones = z || [];
      setZones(validZones);
      setSelectedZone(prev => prev ? (validZones.find(item => String(item.id) === String(prev.id)) || validZones[0] || null) : (validZones[0] || null));
    }, handleErr);

    let rawJoiners: any[] = [];
    let rawUsers: any[] = [];

    const syncAndNormalizeJoiners = () => {
      const allRaw: any[] = [...rawJoiners];

      // Merge users where role is joiner
      rawUsers.forEach((u: any) => {
        const roleLower = String(u.role || '').toLowerCase();
        if (roleLower === 'joiner' || roleLower === 'hotel joiner' || roleLower.includes('joiner')) {
          allRaw.push(u);
        }
      });

      // Merge active mobile joiner session if present
      if (typeof window !== 'undefined') {
        try {
          const mobSessionRaw = localStorage.getItem('farmerbox_mobile_joiner_session');
          if (mobSessionRaw) {
            const ms = JSON.parse(mobSessionRaw);
            if (ms && (ms.name || ms.uid || ms.phone)) {
              allRaw.push(ms);
            }
          }
        } catch {}
      }

      const normalizedJoiners = deduplicateJoiners(allRaw);
      setJoiners(normalizedJoiners);
      setSelectedJoiner(prev => prev ? (normalizedJoiners.find(item => String(item.id) === String(prev.id) || (item.mobile && String(item.mobile).slice(-10) === String(prev.mobile || '').slice(-10))) || normalizedJoiners[0] || null) : (normalizedJoiners[0] || null));
    };

    // Clean up any legacy dummy joiners & drivers from Firestore collections
    if (isFirebaseConfigured() && db) {
      deleteRecord('joiners', 'usr_9822011111').catch(() => {});
      deleteRecord('joiners', 'usr_9822022222').catch(() => {});
      deleteRecord('joiners', 'usr_9822033333').catch(() => {});
      deleteRecord('users', 'usr_9822011111').catch(() => {});
      deleteRecord('users', 'usr_9822022222').catch(() => {});
      deleteRecord('users', 'usr_9822033333').catch(() => {});

      deleteRecord('drivers', '1').catch(() => {});
      deleteRecord('drivers', '2').catch(() => {});
      deleteRecord('drivers', '3').catch(() => {});
      deleteRecord('drivers', '9876543210').catch(() => {});
      deleteRecord('drivers', '9876543211').catch(() => {});
      deleteRecord('drivers', '9876543212').catch(() => {});
      deleteRecord('drivers', 'Santosh Shinde').catch(() => {});
      deleteRecord('drivers', 'Suresh Jadhav').catch(() => {});
      deleteRecord('drivers', 'Ramesh Pawar').catch(() => {});
    }

    const unsubJoiners = subscribeToCollection<any>('joiners', (j) => {
      rawJoiners = j || [];
      syncAndNormalizeJoiners();
    }, handleErr);

    const unsubUsers = subscribeToCollection<any>('users', (u) => {
      rawUsers = u || [];
      syncAndNormalizeJoiners();
    }, handleErr);

    const unsubDrivers = subscribeToCollection<Driver>('drivers', (d) => {
      const validDrivers = deduplicateDrivers(d || []);
      setDrivers(validDrivers);
      setSelectedDriver(prev => prev ? (validDrivers.find((item: Driver) => String(item.id) === String(prev.id)) || validDrivers[0] || null) : (validDrivers[0] || null));
    }, handleErr);

    const unsubHotels = subscribeToCollection<any>('hotels', (h) => {
      const list: any[] = Array.isArray(h) ? [...h] : [];
      if (typeof window !== 'undefined') {
        try {
          const mobHotelsRaw = localStorage.getItem('farmerbox_mobile_hotels');
          if (mobHotelsRaw) {
            const parsed = JSON.parse(mobHotelsRaw);
            if (Array.isArray(parsed)) list.push(...parsed);
          }
        } catch {}
      }

      const normalizedHotels = deduplicateHotels(list);
      setHotels(normalizedHotels);
      setSelectedHotel(prev => prev ? (normalizedHotels.find(item => String(item.id) === String(prev.id) || String(item.hotelId) === String(prev.id)) || normalizedHotels[0] || null) : (normalizedHotels[0] || null));
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
      if (typeof window !== 'undefined') {
        window.removeEventListener('farmerbox_order_created', handleOrderCreatedEvent);
        window.removeEventListener('farmerbox_hotel_created', handleHotelCreatedEvent);
        window.removeEventListener('storage', handleStorageEvent);
      }
      if (syncChannel) {
        try {
          syncChannel.close();
        } catch (e) {}
      }
      unsubOrders();
      unsubZones();
      unsubJoiners();
      unsubUsers();
      unsubDrivers();
      unsubHotels();
      unsubProducts();
      unsubPayments();
      unsubNotifs();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<string>('Orders');

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
    try {
      await orderService.updateStatus(orderId, newStatus);
    } catch (e) {
      console.warn('Notice updating status in firestore:', e);
    }

    setOrders(prev =>
      prev.map(ord => {
        if (String(ord.id) === String(orderId) || String(ord.orderId) === String(orderId)) {
          return {
            ...ord,
            status: newStatus,
            orderStatus: newStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return ord;
      })
    );

    if (selectedOrder && (String(selectedOrder.id) === String(orderId) || String(selectedOrder.orderId) === String(orderId))) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus, orderStatus: newStatus } : null);
    }

    addNotification({
      title: `Order #${orderId} ${newStatus}`,
      message: `Order status changed to ${newStatus}`,
      subtitle: `Status: ${newStatus}`,
      userType: 'All Users',
      status: 'Sent',
      category: 'Orders',
      iconType: 'order',
      read: false
    });
  };

  const assignDriverToOrder = async (
    orderId: string,
    driverName: string,
    driverPhone?: string,
    driverId?: string | number,
    newStatus: OrderStatus = 'Out for Delivery'
  ) => {
    const matchedDriver = drivers.find(d => 
      (driverName && d.name && d.name.toLowerCase() === driverName.toLowerCase()) ||
      (driverId && String(d.id) === String(driverId))
    );

    const finalDriverName = driverName || matchedDriver?.name || 'Assigned Driver';
    const finalDriverPhone = driverPhone || matchedDriver?.mobile || '9876123456';
    const finalDriverId = driverId || matchedDriver?.id || 'DR01';

    try {
      await orderService.assignDriver(orderId, finalDriverId, finalDriverName, finalDriverPhone, newStatus);
    } catch (e) {
      console.warn('Notice assigning driver in firestore:', e);
    }

    setOrders(prev =>
      prev.map(ord => {
        if (String(ord.id) === String(orderId) || String(ord.orderId) === String(orderId)) {
          return {
            ...ord,
            driver: finalDriverName,
            driverPhone: finalDriverPhone,
            driverId: finalDriverId,
            deliveryPartnerId: finalDriverId,
            deliveryPartnerName: finalDriverName,
            status: newStatus,
            orderStatus: newStatus
          };
        }
        return ord;
      })
    );

    if (selectedOrder && (String(selectedOrder.id) === String(orderId) || String(selectedOrder.orderId) === String(orderId))) {
      setSelectedOrder(prev => prev ? {
        ...prev,
        driver: finalDriverName,
        driverPhone: finalDriverPhone,
        driverId: finalDriverId,
        deliveryPartnerId: finalDriverId,
        deliveryPartnerName: finalDriverName,
        status: newStatus,
        orderStatus: newStatus
      } : null);
    }

    addNotification({
      title: `Driver Assigned to Order #${orderId} 🚚`,
      message: `Order #${orderId} assigned to driver ${finalDriverName}. Status: ${newStatus}.`,
      subtitle: `${finalDriverName} • ${newStatus}`,
      userType: 'Drivers',
      status: 'Sent',
      category: 'Orders',
      iconType: 'driver',
      read: false
    });
  };

  const acceptOrder = async (orderId: string, driverName?: string) => {
    if (driverName) {
      await assignDriverToOrder(orderId, driverName, undefined, undefined, 'Out for Delivery');
    } else {
      await updateOrderStatus(orderId, 'Accepted');
    }
  };

  // Delivery Verification & Commission Release (Admin Approves Delivery)
  const approveDelivery = async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const res = await orderService.approveDelivery(orderId, adminProfile.name || 'Super Admin');

    if (res.success) {
      setOrders(prev =>
        prev.map(ord => {
          if (String(ord.id) === String(orderId) || String(ord.orderId) === String(orderId)) {
            const totalAmt = Number(ord.totalAmount ?? ord.amount ?? 0);
            const isEligible = res.isBonusEligible !== undefined ? res.isBonusEligible : totalAmt > 1500;
            return {
              ...ord,
              adminApproved: true,
              status: 'Delivered',
              orderStatus: 'Delivered',
              commissionAmount: isEligible ? 100 : 0,
              commissionStatus: isEligible ? 'credited' : 'not_eligible',
              walletCredited: isEligible
            };
          }
          return ord;
        })
      );

      if (selectedOrder && (String(selectedOrder.id) === String(orderId) || String(selectedOrder.orderId) === String(orderId))) {
        setSelectedOrder(prev => {
          if (!prev) return null;
          const totalAmt = Number(prev.totalAmount ?? prev.amount ?? 0);
          const isEligible = res.isBonusEligible !== undefined ? res.isBonusEligible : totalAmt > 1500;
          return {
            ...prev,
            adminApproved: true,
            status: 'Delivered',
            orderStatus: 'Delivered',
            commissionAmount: isEligible ? 100 : 0,
            commissionStatus: isEligible ? 'credited' : 'not_eligible',
            walletCredited: isEligible
          };
        });
      }

      const isBonusGiven = res.isBonusEligible !== false;
      addNotification({
        title: `Delivery Approved: Order #${orderId} 🎉`,
        message: isBonusGiven
          ? `Delivery verified! ₹100 commission credited to partner's wallet.`
          : `Delivery verified! Order total is ₹1,500 or below (not eligible for ₹100 bonus).`,
        subtitle: isBonusGiven ? `₹100 Commission Credited` : `Order Delivered`,
        userType: 'Joiners',
        status: 'Sent',
        category: 'Commission',
        iconType: 'commission',
        read: false
      });
    }

    return res;
  };

  const rejectDelivery = async (orderId: string, reason?: string): Promise<void> => {
    await orderService.rejectDelivery(orderId, reason || 'Delivery verification rejected by Admin');
    setOrders(prev =>
      prev.map(ord => {
        if (String(ord.id) === String(orderId) || String(ord.orderId) === String(orderId)) {
          return {
            ...ord,
            adminApproved: false,
            commissionStatus: 'rejected',
            rejectionReason: reason || 'Delivery verification rejected by Admin'
          };
        }
        return ord;
      })
    );
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

  const updateZone = async (zoneId: number | string, data: Partial<Zone>) => {
    const existing = zones.find(z => String(z.id) === String(zoneId));
    if (existing) {
      const updated = { ...existing, ...data };
      await saveRecord('zones', updated, String(zoneId));
    }
    setZones(prev => prev.map(z => String(z.id) === String(zoneId) ? { ...z, ...data } : z));
    if (selectedZone && String(selectedZone.id) === String(zoneId)) {
      setSelectedZone(prev => (prev ? { ...prev, ...data } : null));
    }
  };

  const deleteZone = async (zoneId: number | string) => {
    setZones(prev => prev.filter(z => String(z.id) !== String(zoneId)));
    if (selectedZone && String(selectedZone.id) === String(zoneId)) {
      const remaining = zones.filter(z => String(z.id) !== String(zoneId));
      setSelectedZone(remaining.length > 0 ? remaining[0] : null);
    }
    try {
      await deleteRecord('zones', zoneId);
    } catch (e) {
      console.warn('Could not delete zone from firestore:', e);
    }
  };

  const addJoiner = async (name: string, mobile: string, zone: string, email?: string, status?: 'Active' | 'Inactive', password?: string) => {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const docId = `usr_${cleanMobile || Date.now()}`;
    const formattedCode = `JN${cleanMobile.slice(-4) || String(joiners.length + 1).padStart(3, '0')}`;
    const dummyPass = password?.trim() || 'FarmerBox@123';
    const cleanEmail = (email || `${name.trim().toLowerCase().replace(/\s+/g, '')}@farmerbox.in`).trim();

    const newJoiner: Joiner = {
      id: docId,
      uid: docId,
      joinerCode: formattedCode,
      name: name.trim(),
      mobile: cleanMobile,
      phone: cleanMobile,
      email: cleanEmail,
      password: dummyPass,
      dummyPassword: dummyPass,
      zone: (zone || 'Kharadi').replace(' Zone', ''),
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
    setJoiners(prev => deduplicateJoiners([newJoiner, ...prev]));
    setSelectedJoiner(newJoiner);

    try {
      await saveRecord('joiners', newJoiner, docId);
      // Save credentials in users collection for instant mobile login
      await saveRecord('users', {
        id: docId,
        uid: docId,
        name: name.trim(),
        phone: cleanMobile,
        mobile: cleanMobile,
        email: cleanEmail,
        role: 'joiner',
        password: dummyPass,
        zone: (zone || 'Kharadi').replace(' Zone', ''),
        status: status || 'Active',
        createdAt: new Date().toISOString()
      }, docId);
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
        // Keep users collection credentials in sync for mobile login
        const cleanMobile = (updated.mobile || updated.phone || '').replace(/\D/g, '').slice(-10);
        const docId = `usr_${cleanMobile || joinerId}`;
        await saveRecord('users', {
          id: docId,
          uid: docId,
          name: updated.name,
          phone: cleanMobile,
          mobile: cleanMobile,
          email: updated.email,
          role: 'joiner',
          password: updated.password || updated.dummyPassword || 'FarmerBox@123',
          zone: (updated.zone || 'Kharadi').replace(' Zone', ''),
          status: updated.status || 'Active',
          updatedAt: new Date().toISOString()
        }, docId);
      } catch (e) {
        console.warn('Could not update joiner in firestore:', e);
      }
    }
  };

  const deleteJoiner = async (joinerId: number | string) => {
    const idStr = String(joinerId);
    const target = joiners.find(j => 
      String(j.id) === idStr || 
      (j.mobile && String(j.mobile).replace(/\D/g, '') === idStr.replace(/\D/g, '')) ||
      (j.phone && String(j.phone).replace(/\D/g, '') === idStr.replace(/\D/g, ''))
    );

    const cleanPhone = target ? String(target.mobile || target.phone || '').replace(/\D/g, '').slice(-10) : idStr.replace(/\D/g, '').slice(-10);

    // Save to persistent blacklist so real-time Firestore listeners don't resurrect it
    if (typeof window !== 'undefined') {
      try {
        const deletedRaw = localStorage.getItem('farmerbox_deleted_joiner_ids') || '[]';
        const deletedArr: string[] = JSON.parse(deletedRaw);
        if (idStr) deletedArr.push(idStr);
        if (target?.id) deletedArr.push(String(target.id));
        if (cleanPhone) {
          deletedArr.push(cleanPhone);
          deletedArr.push(`usr_${cleanPhone}`);
        }
        localStorage.setItem('farmerbox_deleted_joiner_ids', JSON.stringify(Array.from(new Set(deletedArr))));
      } catch {}
    }

    // 1. Immediate in-memory filtering for joiners state
    setJoiners(prev => prev.filter(j => 
      String(j.id) !== idStr && 
      (!target || String(j.id) !== String(target.id)) &&
      (!cleanPhone || String(j.mobile || j.phone || '').replace(/\D/g, '').slice(-10) !== cleanPhone)
    ));

    if (selectedJoiner && (
      String(selectedJoiner.id) === idStr || 
      (target && String(selectedJoiner.id) === String(target.id)) ||
      (cleanPhone && String(selectedJoiner.mobile || selectedJoiner.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone)
    )) {
      setSelectedJoiner(null);
    }

    // 2. Remove from LocalStorage session caches
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('farmerbox_joiners');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const rem = parsed.filter((j: any) => 
              String(j.id || j.uid || '') !== idStr &&
              (!target || String(j.id || j.uid || '') !== String(target.id)) &&
              (!cleanPhone || String(j.mobile || j.phone || '').replace(/\D/g, '').slice(-10) !== cleanPhone)
            );
            localStorage.setItem('farmerbox_joiners', JSON.stringify(rem));
          }
        }
        const mobSessionRaw = localStorage.getItem('farmerbox_mobile_joiner_session');
        if (mobSessionRaw) {
          const ms = JSON.parse(mobSessionRaw);
          const msPhone = String(ms?.phone || ms?.mobile || '').replace(/\D/g, '').slice(-10);
          if (msPhone === cleanPhone || String(ms?.uid || ms?.id) === idStr) {
            localStorage.removeItem('farmerbox_mobile_joiner_session');
          }
        }
      } catch {}
    }

    // 3. Persistent Firestore Deletion across collections
    try {
      await deleteRecord('joiners', joinerId);
      await deleteRecord('users', joinerId);
      await deleteRecord('hotelJoiners', joinerId);
      if (target?.id && String(target.id) !== idStr) {
        await deleteRecord('joiners', target.id);
        await deleteRecord('users', target.id);
        await deleteRecord('hotelJoiners', target.id);
      }
      if (cleanPhone) {
        await deleteRecord('joiners', cleanPhone);
        await deleteRecord('joiners', `usr_${cleanPhone}`);
        await deleteRecord('users', cleanPhone);
        await deleteRecord('users', `usr_${cleanPhone}`);
        await deleteRecord('hotelJoiners', cleanPhone);
        await deleteRecord('hotelJoiners', `usr_${cleanPhone}`);
      }
    } catch (e) {
      console.warn('Could not delete joiner from firestore:', e);
    }
  };

  const deleteAllJoiners = async () => {
    // 1. In-memory reset
    const allCurrent = [...joiners];
    setJoiners([]);
    setSelectedJoiner(null);

    // 2. Local storage purge and blacklist
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('farmerbox_joiners');
        localStorage.removeItem('farmerbox_mobile_joiner_session');
        const deletedArr: string[] = allCurrent.flatMap(j => {
          const ph = String(j.mobile || j.phone || '').replace(/\D/g, '').slice(-10);
          const id = String(j.id || (j as any).uid || '');
          return [id, ph, `usr_${ph}`].filter(Boolean);
        });
        localStorage.setItem('farmerbox_deleted_joiner_ids', JSON.stringify(Array.from(new Set(deletedArr))));
      } catch {}
    }

    // 3. Persistent Firestore purge
    try {
      for (const j of allCurrent) {
        const idStr = String(j.id);
        const cleanPhone = String(j.mobile || j.phone || '').replace(/\D/g, '').slice(-10);
        deleteRecord('joiners', idStr).catch(() => {});
        deleteRecord('users', idStr).catch(() => {});
        deleteRecord('hotelJoiners', idStr).catch(() => {});
        if (cleanPhone) {
          deleteRecord('joiners', cleanPhone).catch(() => {});
          deleteRecord('joiners', `usr_${cleanPhone}`).catch(() => {});
          deleteRecord('users', cleanPhone).catch(() => {});
          deleteRecord('users', `usr_${cleanPhone}`).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Could not delete all joiners from firestore:', e);
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

    const docId = `HT${Date.now().toString().slice(-6)}`;
    const newHotel: Hotel = {
      id: docId,
      hotelId: docId,
      name: nameVal,
      ownerName: ownerVal,
      contactPerson: ownerVal,
      mobile: mobileVal,
      phone: mobileVal,
      email: `${nameVal.toLowerCase().replace(/\s+/g, '')}@hotel.com`,
      zone: zoneVal,
      joiner: joinerVal || 'Admin',
      assignedJoiner: joinerVal || 'Admin',
      joinedBy: joinerVal === 'Admin' || !joinerVal ? 'Admin' : joinerVal,
      addedBy: 'Admin',
      createdBy: adminProfile.name || 'Super Admin',
      address: addressVal,
      totalOrders: 0,
      orders: 0,
      totalSpent: 0,
      registrationDate: 'Just now',
      gstNumber: '27ABCDE1234F9Z9',
      fssaiNumber: '11521007000999',
      rating: 5.0,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300'
    };
    await saveRecord('hotels', newHotel, docId);
    setHotels(prev => deduplicateHotels([newHotel, ...prev]));
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

  const updateHotel = async (hotelId: number | string, data: Partial<Hotel>) => {
    const existing = hotels.find(h => String(h.id) === String(hotelId) || String(h.hotelId || '') === String(hotelId));
    if (existing) {
      const updated = { ...existing, ...data };
      await saveRecord('hotels', updated, String(existing.id || hotelId));
    }
    setHotels(prev => prev.map(h => (String(h.id) === String(hotelId) || String(h.hotelId || '') === String(hotelId)) ? { ...h, ...data } : h));
    if (selectedHotel && (String(selectedHotel.id) === String(hotelId) || String(selectedHotel.hotelId || '') === String(hotelId))) {
      setSelectedHotel(prev => (prev ? { ...prev, ...data } : null));
    }
  };

  const deleteHotel = async (hotelId: number | string) => {
    const idStr = String(hotelId).trim();
    const target = hotels.find(h => 
      String(h.id) === idStr || 
      String(h.hotelId || '') === idStr ||
      (h.mobile && String(h.mobile).replace(/\D/g, '').slice(-10) === idStr.replace(/\D/g, '').slice(-10)) ||
      (h.phone && String(h.phone).replace(/\D/g, '').slice(-10) === idStr.replace(/\D/g, '').slice(-10))
    );

    const targetHotelId = target?.hotelId ? String(target.hotelId).trim() : '';
    const cleanPhone = target ? String(target.mobile || target.phone || '').replace(/\D/g, '').slice(-10) : (idStr.replace(/\D/g, '').length >= 10 ? idStr.replace(/\D/g, '').slice(-10) : '');
    const cleanName = target ? String(target.name || (target as any).hotelName || '').trim().toLowerCase() : '';
    const phoneNameKey = cleanPhone && cleanName ? `${cleanName}_${cleanPhone}` : '';

    // 1. Add to persistent blacklist in localStorage so it can NEVER resurrect
    if (typeof window !== 'undefined') {
      try {
        const deletedRaw = localStorage.getItem('farmerbox_deleted_hotel_ids') || '[]';
        const deletedArr: string[] = JSON.parse(deletedRaw);
        if (idStr) deletedArr.push(idStr);
        if (targetHotelId) deletedArr.push(targetHotelId);
        if (target?.id) deletedArr.push(String(target.id));
        if (cleanPhone) deletedArr.push(cleanPhone);
        if (phoneNameKey) deletedArr.push(phoneNameKey);
        if (cleanName) deletedArr.push(cleanName);
        localStorage.setItem('farmerbox_deleted_hotel_ids', JSON.stringify(Array.from(new Set(deletedArr))));

        // Purge from farmerbox_hotels
        const storedAdmin = localStorage.getItem('farmerbox_hotels');
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((h: any) => {
              const hId = String(h.id || h.hotelId || '');
              const hPhone = String(h.mobile || h.phone || '').replace(/\D/g, '').slice(-10);
              const hName = String(h.name || h.hotelName || '').trim().toLowerCase();
              return hId !== idStr && hId !== targetHotelId && (!target || hId !== String(target.id)) && (!cleanPhone || hPhone !== cleanPhone) && (!cleanName || hName !== cleanName);
            });
            localStorage.setItem('farmerbox_hotels', JSON.stringify(filtered));
          }
        }

        // Purge from farmerbox_mobile_hotels
        const storedMob = localStorage.getItem('farmerbox_mobile_hotels');
        if (storedMob) {
          const parsed = JSON.parse(storedMob);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((h: any) => {
              const hId = String(h.id || h.hotelId || '');
              const hPhone = String(h.mobile || h.phone || '').replace(/\D/g, '').slice(-10);
              const hName = String(h.name || h.hotelName || '').trim().toLowerCase();
              return hId !== idStr && hId !== targetHotelId && (!target || hId !== String(target.id)) && (!cleanPhone || hPhone !== cleanPhone) && (!cleanName || hName !== cleanName);
            });
            localStorage.setItem('farmerbox_mobile_hotels', JSON.stringify(filtered));
          }
        }
      } catch (err) {
        console.warn('Error updating local hotel caches:', err);
      }
    }

    // 2. Immediate in-memory state update
    setHotels(prev => prev.filter(h => {
      const hId = String(h.id || h.hotelId || '');
      const hPhone = String(h.mobile || h.phone || '').replace(/\D/g, '').slice(-10);
      const hName = String(h.name || (h as any).hotelName || '').trim().toLowerCase();
      if (hId === idStr || hId === targetHotelId || (target && hId === String(target.id))) return false;
      if (cleanPhone && hPhone === cleanPhone) return false;
      if (cleanName && hName === cleanName) return false;
      return true;
    }));

    if (selectedHotel && (
      String(selectedHotel.id) === idStr || 
      String(selectedHotel.hotelId || '') === idStr ||
      (targetHotelId && String(selectedHotel.hotelId || '') === targetHotelId) ||
      (target && String(selectedHotel.id) === String(target.id)) ||
      (cleanPhone && String(selectedHotel.mobile || selectedHotel.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone)
    )) {
      setSelectedHotel(null);
    }

    // 3. Persistent Firestore Deletion across all document IDs & queries
    try {
      await deleteRecord('hotels', hotelId);
      if (target?.id && String(target.id) !== idStr) {
        await deleteRecord('hotels', target.id);
      }
      if (targetHotelId && targetHotelId !== idStr) {
        await deleteRecord('hotels', targetHotelId);
      }
      if (cleanPhone) {
        await deleteRecord('hotels', cleanPhone);
      }
      if (cleanName) {
        await deleteRecord('hotels', cleanName);
      }
      await hotelService.delete(hotelId);
      if (target?.id) await hotelService.delete(target.id);
      if (targetHotelId) await hotelService.delete(targetHotelId);
    } catch (e) {
      console.warn('Could not delete hotel from firestore:', e);
    }
  };

  const deleteAllHotels = async () => {
    const allCurrent = [...hotels];
    setHotels([]);
    setSelectedHotel(null);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('farmerbox_hotels');
        localStorage.removeItem('farmerbox_mobile_hotels');
        const deletedArr: string[] = allCurrent.flatMap(h => {
          const ph = String(h.mobile || h.phone || '').replace(/\D/g, '').slice(-10);
          const id = String(h.id || '');
          const hid = String(h.hotelId || '');
          const nm = String(h.name || (h as any).hotelName || '').trim().toLowerCase();
          const pnm = ph && nm ? `${nm}_${ph}` : '';
          return [id, hid, ph, nm, pnm].filter(Boolean);
        });
        localStorage.setItem('farmerbox_deleted_hotel_ids', JSON.stringify(Array.from(new Set(deletedArr))));
      } catch {}
    }

    try {
      for (const h of allCurrent) {
        const idStr = String(h.id);
        const cleanPhone = String(h.mobile || h.phone || '').replace(/\D/g, '').slice(-10);
        deleteRecord('hotels', idStr).catch(() => {});
        if (h.hotelId) deleteRecord('hotels', String(h.hotelId)).catch(() => {});
        if (cleanPhone) deleteRecord('hotels', cleanPhone).catch(() => {});
        if (h.name) deleteRecord('hotels', h.name).catch(() => {});
        hotelService.delete(idStr).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not delete all hotels from firestore:', e);
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
    const idStr = String(driverId).trim();
    const target = drivers.find(d => 
      String(d.id) === idStr || 
      (d.mobile && String(d.mobile).replace(/\D/g, '').slice(-10) === idStr.replace(/\D/g, '').slice(-10)) ||
      (d.phone && String(d.phone).replace(/\D/g, '').slice(-10) === idStr.replace(/\D/g, '').slice(-10)) ||
      (d.name && d.name.toLowerCase() === idStr.toLowerCase())
    );

    const cleanPhone = target ? String(target.mobile || target.phone || '').replace(/\D/g, '').slice(-10) : (idStr.replace(/\D/g, '').length >= 10 ? idStr.replace(/\D/g, '').slice(-10) : '');
    const cleanName = target ? String(target.name || '').trim().toLowerCase() : '';
    const vehicleNo = target ? String(target.vehicleNo || target.vehicleNumber || '').trim().toUpperCase() : '';

    // Save to persistent blacklist in localStorage
    if (typeof window !== 'undefined') {
      try {
        const deletedRaw = localStorage.getItem('farmerbox_deleted_driver_ids') || '[]';
        const deletedArr: string[] = JSON.parse(deletedRaw);
        if (idStr) deletedArr.push(idStr);
        if (target?.id) deletedArr.push(String(target.id));
        if (cleanPhone) deletedArr.push(cleanPhone);
        if (cleanName) deletedArr.push(cleanName);
        if (vehicleNo) deletedArr.push(vehicleNo);
        localStorage.setItem('farmerbox_deleted_driver_ids', JSON.stringify(Array.from(new Set(deletedArr))));

        // Purge from farmerbox_drivers
        const stored = localStorage.getItem('farmerbox_drivers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const rem = parsed.filter((d: any) => 
              String(d.id || '') !== idStr &&
              (!target || String(d.id || '') !== String(target.id)) &&
              (!cleanPhone || String(d.mobile || d.phone || '').replace(/\D/g, '').slice(-10) !== cleanPhone) &&
              (!cleanName || String(d.name || '').trim().toLowerCase() !== cleanName)
            );
            localStorage.setItem('farmerbox_drivers', JSON.stringify(rem));
          }
        }
      } catch {}
    }

    // 1. Immediate in-memory state update
    setDrivers(prev => prev.filter(d => 
      String(d.id) !== idStr && 
      (!target || String(d.id) !== String(target.id)) &&
      (!cleanPhone || String(d.mobile || d.phone || '').replace(/\D/g, '').slice(-10) !== cleanPhone) &&
      (!cleanName || String(d.name || '').trim().toLowerCase() !== cleanName)
    ));

    if (selectedDriver && (
      String(selectedDriver.id) === idStr || 
      (target && String(selectedDriver.id) === String(target.id)) ||
      (cleanPhone && String(selectedDriver.mobile || selectedDriver.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone) ||
      (cleanName && String(selectedDriver.name || '').trim().toLowerCase() === cleanName)
    )) {
      const remaining = drivers.filter(d => 
        String(d.id) !== idStr && 
        (!target || String(d.id) !== String(target.id)) &&
        (!cleanPhone || String(d.mobile || d.phone || '').replace(/\D/g, '').slice(-10) !== cleanPhone)
      );
      setSelectedDriver(remaining.length > 0 ? remaining[0] : null);
    }

    // 2. Persistent Firestore Deletion
    try {
      await deleteRecord('drivers', driverId);
      if (target?.id && String(target.id) !== idStr) {
        await deleteRecord('drivers', target.id);
      }
      if (cleanPhone) {
        await deleteRecord('drivers', cleanPhone);
      }
      if (target?.name) {
        await deleteRecord('drivers', target.name);
      }
      if (vehicleNo) {
        await deleteRecord('drivers', vehicleNo);
      }
    } catch (e) {
      console.warn('Could not delete driver from firestore:', e);
    }
  };

  const deleteAllDrivers = async () => {
    const allCurrent = [...drivers];
    setDrivers([]);
    setSelectedDriver(null);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('farmerbox_drivers');
        const deletedArr: string[] = allCurrent.flatMap(d => {
          const ph = String(d.mobile || d.phone || '').replace(/\D/g, '').slice(-10);
          const id = String(d.id || '');
          const nm = String(d.name || '').trim().toLowerCase();
          const vn = String(d.vehicleNo || d.vehicleNumber || '').trim().toUpperCase();
          return [id, ph, nm, vn].filter(Boolean);
        });
        localStorage.setItem('farmerbox_deleted_driver_ids', JSON.stringify(Array.from(new Set(deletedArr))));
      } catch {}
    }

    try {
      for (const d of allCurrent) {
        const idStr = String(d.id);
        const cleanPhone = String(d.mobile || d.phone || '').replace(/\D/g, '').slice(-10);
        deleteRecord('drivers', idStr).catch(() => {});
        if (cleanPhone) deleteRecord('drivers', cleanPhone).catch(() => {});
        if (d.name) deleteRecord('drivers', d.name).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not delete all drivers from firestore:', e);
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
    try {
      const orderId = await orderService.add(orderData);
      
      addNotification({
        title: 'New Order Created',
        message: `Order #${orderId} created for ${orderData.hotelName || orderData.customerName || 'Customer'}`,
        subtitle: `${orderData.hotelName || orderData.customerName || 'Customer'} • Order Added`,
        userType: 'Admins',
        status: 'Sent',
        category: 'Orders',
        iconType: 'order',
        read: false
      });
    } catch (e: any) {
      console.error('Failed to add order via orderService:', e);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await orderService.delete(orderId);
    } catch (e) {
      console.warn('Could not delete order from firestore:', e);
    }
    setOrders(prev => prev.filter(o => String(o.id) !== String(orderId) && String(o.orderId || '') !== String(orderId)));
    if (selectedOrder && (String(selectedOrder.id) === String(orderId) || String(selectedOrder.orderId || '') === String(orderId))) {
      setSelectedOrder(null);
    }
  };

  /**
   * Multi-Device Simulation Tool
   * Simulates up to 5 mobile devices from 5 different zones placing simultaneous orders into Firestore.
   */
  const simulateMultiMobileOrders = async (devicesCount: number = 5): Promise<string[]> => {
    const devices = [
      {
        mobileLabel: 'Mobile 1 (Kharadi)',
        zoneId: 'ZONE_001',
        zoneName: 'Kharadi',
        customerId: 'CUST_HOTEL_101',
        customerName: 'Kharadi Grand Palace Hotel',
        partnerId: 'PARTNER_001',
        partnerName: 'Rahul Patil',
        mobileNumber: '9822011001',
        items: [
          { productId: 'PROD_001', productName: 'Fresh Red Tomatoes (Grade A)', quantity: 20, unit: 'kg', price: 40, total: 800 },
          { productId: 'PROD_002', productName: 'Farm Fresh Banana (Robusta)', quantity: 10, unit: 'kg', price: 50, total: 500 }
        ]
      },
      {
        mobileLabel: 'Mobile 2 (Wagholi)',
        zoneId: 'ZONE_003',
        zoneName: 'Wagholi',
        customerId: 'CUST_HOTEL_102',
        customerName: 'Wagholi Spice Dining & Kitchen',
        partnerId: 'PARTNER_002',
        partnerName: 'Amit Shinde',
        mobileNumber: '9822022002',
        items: [
          { productId: 'PROD_003', productName: 'Nashik Red Onions (Dry)', quantity: 30, unit: 'kg', price: 35, total: 1050 },
          { productId: 'PROD_004', productName: 'Fresh Alphonso Mangoes', quantity: 5, unit: 'kg', price: 120, total: 600 }
        ]
      },
      {
        mobileLabel: 'Mobile 3 (Hadapsar)',
        zoneId: 'ZONE_004',
        zoneName: 'Hadapsar',
        customerId: 'CUST_HOTEL_103',
        customerName: 'Hadapsar Green Leaf Restaurant',
        partnerId: 'PARTNER_003',
        partnerName: 'Suresh Jadhav',
        mobileNumber: '9822033003',
        items: [
          { productId: 'PROD_005', productName: 'Fresh Green Seedless Grapes', quantity: 12, unit: 'kg', price: 80, total: 960 },
          { productId: 'PROD_006', productName: 'Organic Green Capsicum / Shimla Mirch', quantity: 8, unit: 'kg', price: 60, total: 480 }
        ]
      },
      {
        mobileLabel: 'Mobile 4 (Viman Nagar)',
        zoneId: 'ZONE_002',
        zoneName: 'Viman Nagar',
        customerId: 'CUST_HOTEL_104',
        customerName: 'Viman Nagar Gourmet Cafe & Resto',
        partnerId: 'PARTNER_004',
        partnerName: 'Priya Kulkarni',
        mobileNumber: '9822044004',
        items: [
          { productId: 'PROD_007', productName: 'Fresh Spinach & Farm Greens', quantity: 15, unit: 'bunch', price: 25, total: 375 },
          { productId: 'PROD_008', productName: 'Fresh Green Coriander (Kothimbir)', quantity: 20, unit: 'bunch', price: 20, total: 400 },
          { productId: 'PROD_009', productName: 'Tender Green Cucumbers', quantity: 10, unit: 'kg', price: 40, total: 400 }
        ]
      },
      {
        mobileLabel: 'Mobile 5 (Koregaon Park)',
        zoneId: 'ZONE_005',
        zoneName: 'Koregaon Park',
        customerId: 'CUST_HOTEL_105',
        customerName: 'Koregaon Park Olive Bistro',
        partnerId: 'PARTNER_005',
        partnerName: 'Vikram More',
        mobileNumber: '9822055005',
        items: [
          { productId: 'PROD_010', productName: 'Fresh Exotic Broccoli Florets', quantity: 10, unit: 'kg', price: 110, total: 1100 },
          { productId: 'PROD_011', productName: 'Hydroponic Sweet Cherry Tomatoes', quantity: 6, unit: 'kg', price: 90, total: 540 }
        ]
      }
    ];

    const targetDevices = devices.slice(0, Math.min(devicesCount, devices.length));
    const createdIds: string[] = [];

    for (const dev of targetDevices) {
      const subtotal = dev.items.reduce((sum, item) => sum + item.total, 0);
      const orderId = await orderService.add({
        customerId: dev.customerId,
        customerName: dev.customerName,
        hotelId: dev.customerId,
        hotelName: dev.customerName,
        hotelZone: dev.zoneName,
        zone: dev.zoneName,
        zoneId: dev.zoneId,
        zoneName: dev.zoneName,
        partnerId: dev.partnerId,
        partnerName: dev.partnerName,
        joiner: dev.partnerName,
        joinerId: dev.partnerId,
        mobileNumber: dev.mobileNumber,
        orderSource: 'mobile',
        items: dev.items,
        subtotal,
        deliveryCharge: 0,
        discount: 0,
        grandTotal: subtotal,
        amount: subtotal,
        totalAmount: subtotal,
        paymentMethod: dev.zoneName === 'Kharadi' || dev.zoneName === 'Hadapsar' ? 'COD' : 'Online',
        paymentMode: dev.zoneName === 'Kharadi' || dev.zoneName === 'Hadapsar' ? 'COD' : 'Online',
        paymentStatus: dev.zoneName === 'Kharadi' || dev.zoneName === 'Hadapsar' ? 'pending' : 'paid',
        status: 'Pending',
        orderStatus: 'Pending',
        adminApproved: false
      });
      createdIds.push(orderId);
    }

    return createdIds;
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
        walletTransactions,
        deletePayment,
        notifications,
        isDatabaseConnected: isConnected,
        firestoreError,
        seedDatabaseToFirebase: seedFirestoreDatabase,
        newOrderAlert,
        dismissNewOrderAlert,
        simulateMultiMobileOrders,
        approveDelivery,
        rejectDelivery,
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
        deleteAllJoiners,
        addHotel,
        updateHotel,
        deleteHotel,
        deleteAllHotels,
        addDriver,
        updateDriver,
        deleteDriver,
        deleteAllDrivers,
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
