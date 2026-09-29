import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { soundEngine } from './utils/sound';
import { subscribeToCollection, saveRecord } from '../firebase/dbService';
import { hotelService } from '../firebase/services/hotelService';
import { orderService } from '../firebase/services/orderService';
import { authService, type AppUser } from '../firebase/authService';
import { db, isFirebaseConfigured } from '../firebase/config';

import { initialProductsList } from '../data/productsData';

export type MobileScreen =
  | 'SPLASH'
  | 'WELCOME'
  | 'LOGIN'
  | 'REGISTER'
  | 'DASHBOARD'
  | 'MY_HOTELS'
  | 'ADD_HOTEL'
  | 'PLACE_ORDER'
  | 'CART'
  | 'MY_ORDERS'
  | 'REORDER'
  | 'ORDER_SUCCESS'
  | 'COMMISSION'
  | 'NOTIFICATIONS'
  | 'PROFILE';

export interface MobileHotel {
  id: number | string;
  hotelId?: string;
  name: string;
  zone: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  gst?: string;
  fssai?: string;
  orders: number;
  status: 'Active' | 'Pending' | 'Inactive';
  image: string;
  joinedBy?: string;
  joinerId?: string;
  assignedJoiner?: string;
}

export interface MobileProduct {
  id: number | string;
  name: string;
  category: string;
  price: number;
  b2bPrice?: number;
  b2cPrice?: number;
  catalogType?: 'B2C' | 'B2B' | 'Both';
  unit: string;
  image: string;
  stock: number;
  status?: 'Active' | 'Inactive';
  isImported?: boolean;
  originCountry?: string;
  countryFlag?: string;
}

import { resolveProductImage, getProductImageFallback } from '../utils/productImages';
export { resolveProductImage, getProductImageFallback };

export interface CartItem {
  product: MobileProduct;
  quantity: number;
}

export interface MobileOrder {
  id: string;
  orderId?: string;
  hotelId?: string | number;
  hotelName: string;
  hotelZone: string;
  zone?: string;
  joiner?: string;
  joinerId?: string | number;
  joinedBy?: string;
  date: string;
  timeSlot: string;
  amount: number;
  subtotal?: number;
  totalAmount?: number;
  deliveryCharge?: number;
  paymentMode?: string;
  paymentStatus?: string;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Out for Delivery' | 'Preparing' | 'Cancelled';
  orderStatus?: string;
  items: any[];
}

export interface MobileNotification {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  category: 'Orders' | 'Hotels' | 'Commission' | 'System';
  iconType: 'order' | 'hotel' | 'commission' | 'product' | 'system';
  hasUpdateFile?: boolean;
  isAppUpdate?: boolean;
  fileName?: string;
  version?: string;
}

export interface JoinerUserProfile {
  uid: string;
  name: string;
  role: string;
  zone: string;
  phone: string;
  email: string;
  avatar: string;
  totalHotels: number;
  totalOrders: number;
}

interface JoinerAppContextType {
  currentScreen: MobileScreen;
  setCurrentScreen: (screen: MobileScreen) => void;
  selectedHotel: MobileHotel | null;
  setSelectedHotel: (hotel: MobileHotel | null) => void;
  hotels: MobileHotel[];
  addHotel: (hotel: Omit<MobileHotel, 'id'> & { [key: string]: any }) => Promise<void>;
  updateHotel: (hotelId: string | number, data: Partial<MobileHotel>) => Promise<void>;
  deleteHotel: (hotelId: string | number) => Promise<void>;
  updateHotelStatus: (hotelId: string | number, newStatus: 'Active' | 'Inactive') => Promise<void>;
  products: MobileProduct[];
  cart: CartItem[];
  addToCart: (product: MobileProduct) => void;
  updateCartQty: (productId: number | string, qty: number, fallbackProduct?: MobileProduct) => void;
  setCartItems: (items: CartItem[]) => void;
  removeFromCart: (productId: number | string) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: MobileOrder[];
  addOrder: (orderData: Partial<MobileOrder>) => MobileOrder;
  lastPlacedOrder: MobileOrder | null;
  selectedOrderForReorder: MobileOrder | null;
  setSelectedOrderForReorder: (order: MobileOrder | null) => void;
  notifications: MobileNotification[];
  hasUnreadNotifications: boolean;
  unreadNotificationsCount: number;
  markNotificationsRead: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playNotificationSound: (type?: 'notification' | 'commission' | 'pop') => void;
  addNotification: (notification: Omit<MobileNotification, 'id'>) => void;
  clearNotifications: () => void;
  activeToast: { id: string; title: string; subtitle?: string; category?: string; iconType?: string } | null;
  triggerInAppToast: (title: string, subtitle?: string, category?: string, iconType?: string) => void;
  dismissToast: () => void;
  requestPushPermission: () => Promise<boolean>;
  pushPermissionGranted: boolean;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (open: boolean) => void;
  appVersion: string;
  checkForAppUpdates: () => void;
  commissionBalance: {
    thisMonth: number;
    totalEarned?: number;
    growth: number;
    paid: number;
    pending: number;
    totalEligibleOrders?: number;
    deliveredEligibleOrders?: number;
  };
  commissionHistory: Array<{
    date: string;
    orderId: string;
    hotelName?: string;
    amount: number;
    orderAmount?: number;
    isBonusEligible?: boolean;
    status: 'Paid' | 'Pending Approval' | 'Standard' | 'Pending';
  }>;
  userProfile: JoinerUserProfile;
  sendPhoneOtp: (phone: string, containerId?: string) => Promise<{ success: boolean; message: string; formattedPhone: string; isFallback?: boolean }>;
  verifyPhoneOtp: (otp: string, phone: string, name?: string, zone?: string) => Promise<void>;
  resendPhoneOtp: (phone: string, containerId?: string) => Promise<{ success: boolean; message: string; formattedPhone: string; isFallback?: boolean }>;
  registerUser: (data: { name: string; phone: string; email: string; zone: string; password?: string }) => Promise<void>;
  loginUser: (phone: string, password?: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (data: Partial<JoinerUserProfile>) => Promise<void>;
}

const JoinerAppContext = createContext<JoinerAppContextType | undefined>(undefined);

const MOBILE_JOINER_SESSION_KEY = 'farmerbox_mobile_joiner_session';
const MOBILE_ORDERS_STORAGE_KEY = 'farmerbox_mobile_orders';
const NOTIFICATIONS_READ_KEY = 'farmerbox_last_read_notifications';

const getInitialOrders = (): MobileOrder[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(MOBILE_ORDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read stored orders session:', e);
    }
  }
  return [];
};

const getInitialJoinerProfile = (): JoinerUserProfile => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(MOBILE_JOINER_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read mobile joiner session:', e);
    }
  }

  return {
    uid: '',
    name: '',
    role: 'Hotel Joiner',
    zone: 'Kharadi Zone',
    phone: '',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    totalHotels: 0,
    totalOrders: 0
  };
};

const initialNotificationsList: MobileNotification[] = [];

export const JoinerAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [screenState, setScreenState] = useState<MobileScreen>('SPLASH');
  const [hotels, setHotels] = useState<MobileHotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<MobileHotel | null>(null);
  const [products, setProducts] = useState<MobileProduct[]>(() =>
    initialProductsList.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.b2bPrice || p.salePrice || 30),
      b2bPrice: p.b2bPrice,
      b2cPrice: p.b2cPrice,
      catalogType: p.catalogType || 'B2B',
      unit: (p.unit || 'kg').toLowerCase(),
      image: resolveProductImage(p.name, p.category, p.image),
      stock: Number(p.stock || 100),
      isImported: p.isImported,
      originCountry: p.originCountry,
      countryFlag: p.countryFlag
    }))
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<MobileOrder[]>(() => getInitialOrders());
  const [lastPlacedOrder, setLastPlacedOrder] = useState<MobileOrder | null>(null);
  const [selectedOrderForReorder, setSelectedOrderForReorder] = useState<MobileOrder | null>(null);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_READ_KEY);
        return stored ? Number(stored) : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const appVersion = 'v2.5.0';

  const markNotificationsRead = useCallback(() => {
    const now = Date.now();
    setLastReadTimestamp(now);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(NOTIFICATIONS_READ_KEY, String(now));
      } catch (e) {}
    }
  }, []);

  const unreadNotificationsCount = useMemo(() => {
    if (notifications.length === 0) return 0;
    if (lastReadTimestamp === 0) return notifications.length;
    return notifications.filter(n => {
      const notifTime = Number(n.id) || 0;
      return notifTime > lastReadTimestamp;
    }).length;
  }, [notifications, lastReadTimestamp]);

  const hasUnreadNotifications = unreadNotificationsCount > 0;

  const checkForAppUpdates = () => {
    // Only open update modal if an update notification actually exists from admin
    const updateNotif = notifications.find(n => n.title.toLowerCase().includes('update') || n.title.toLowerCase().includes('app update'));
    if (updateNotif) {
      setIsUpdateModalOpen(true);
      playNotificationSound('pop');
    }
  };

  // User Profile loaded exclusively from mobile joiner session
  const [userProfile, setUserProfile] = useState<JoinerUserProfile>(() =>
    getInitialJoinerProfile()
  );

  // Strict Screen Navigation Guard
  const setCurrentScreen = (screen: MobileScreen) => {
    const publicScreens: MobileScreen[] = ['SPLASH', 'WELCOME', 'LOGIN', 'REGISTER'];
    if (!userProfile.uid && !publicScreens.includes(screen)) {
      // User is not logged in: strictly block dashboard/private screens and redirect to LOGIN
      setScreenState('LOGIN');
      return;
    }
    if (screen === 'NOTIFICATIONS') {
      markNotificationsRead();
    }
    setScreenState(screen);
  };

  const currentScreen = screenState;

  const [joinerDocData, setJoinerDocData] = useState<any>(null);

  // Sync user profile document from Firestore 'users/{uid}' and 'joiners/{uid}'
  useEffect(() => {
    if (!isFirebaseConfigured() || !db || !userProfile.uid) return;
    try {
      const cleanPhone = (userProfile.phone || '').replace(/\D/g, '');
      const docId = userProfile.uid.startsWith('usr_') ? userProfile.uid : `usr_${cleanPhone || userProfile.uid}`;

      const unsubUsers = onSnapshot(doc(db, 'users', userProfile.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserProfile(prev => ({
            ...prev,
            name: data.name || prev.name,
            phone: data.phone || data.phoneNumber?.replace('+91', '') || prev.phone,
            email: data.email || prev.email,
            zone: data.zone || prev.zone,
            avatar: data.avatar || prev.avatar
          }));
        }
      });

      const unsubJoiners = onSnapshot(doc(db, 'joiners', docId), (snap) => {
        if (snap.exists()) {
          const jData = snap.data();
          setJoinerDocData(jData);
          if (jData.name && (!userProfile.name || userProfile.name.startsWith('Joiner '))) {
            setUserProfile(prev => ({
              ...prev,
              name: jData.name || prev.name,
              zone: jData.zone ? (jData.zone.includes('Zone') ? jData.zone : `${jData.zone} Zone`) : prev.zone
            }));
          }
        }
      });

      return () => {
        unsubUsers();
        unsubJoiners();
      };
    } catch (e) {
      console.warn('User profile subscription notice:', e);
    }
  }, [userProfile.uid, userProfile.phone]);

  // 1. Live Products and Notifications Subscriptions (Global / Catalog)
  useEffect(() => {
    const unsubProducts = subscribeToCollection<any>('products', (rawProducts) => {
      if (rawProducts && rawProducts.length > 0) {
        const mapped: MobileProduct[] = rawProducts.map((p: any) => {
          const resolvedImg = resolveProductImage(p.name, p.category, p.imageUrl || p.image);
          return {
            id: p.id !== undefined ? p.id : Date.now(),
            name: p.name || 'Unnamed Product',
            category: p.category || 'Vegetables',
            price: Number(p.b2bPrice ?? p.salePrice ?? p.price ?? 30),
            b2bPrice: p.b2bPrice,
            b2cPrice: p.b2cPrice,
            catalogType: p.catalogType || 'B2B',
            unit: p.unit ? String(p.unit).toLowerCase() : 'kg',
            image: resolvedImg,
            stock: Number(p.stock ?? 100),
            status: p.status === 'Inactive' ? 'Inactive' : 'Active',
            isImported: p.isImported,
            originCountry: p.originCountry,
            countryFlag: p.countryFlag
          };
        });
        setProducts(mapped);
      }
    });

    const unsubNotifs = subscribeToCollection<any>('notifications', (rawNotifs) => {
      if (!rawNotifs || rawNotifs.length === 0) {
        setNotifications([]);
        return;
      }

      const allMapped: MobileNotification[] = rawNotifs.map((n: any) => ({
        id: String(n.id || Date.now()),
        title: n.title || 'Notification',
        subtitle: n.subtitle || n.message || 'New alert',
        time: n.time || n.dateTime || 'Just now',
        category: (n.category || (n.userType === 'Hotels' ? 'Hotels' : n.userType === 'Joiners' ? 'Commission' : 'Orders')) as any,
        iconType: (n.iconType || (n.category === 'Hotels' ? 'hotel' : n.category === 'Commission' ? 'commission' : 'order')) as any,
        hasUpdateFile: Boolean(n.hasUpdateFile || n.isAppUpdate),
        isAppUpdate: Boolean(n.isAppUpdate || n.hasUpdateFile),
        fileName: n.fileName,
        version: n.version
      }));

      // Separate update notifications (ONLY those with hasUpdateFile or isAppUpdate explicitly sent by admin)
      const updateNotifs = allMapped.filter(n => n.hasUpdateFile || n.isAppUpdate);
      const regularNotifs = allMapped.filter(n => !n.hasUpdateFile && !n.isAppUpdate);

      // Strictly take ONLY the latest single app update notification sent by admin (if any)
      const latestUpdateNotif = updateNotifs.length > 0 ? [updateNotifs[updateNotifs.length - 1]] : [];

      const finalNotifications = [...latestUpdateNotif, ...regularNotifs];
      setNotifications(finalNotifications);

      // If a new update notification was sent by admin and not dismissed yet, open update modal
      if (latestUpdateNotif.length > 0) {
        const updateItem = latestUpdateNotif[0];
        const dismissedId = typeof window !== 'undefined' ? localStorage.getItem('farmerbox_dismissed_update') : null;
        if (dismissedId !== updateItem.id) {
          setIsUpdateModalOpen(true);
        }
      }
    });

    return () => {
      unsubProducts();
      unsubNotifs();
    };
  }, []);

  // Sync Cart Items whenever live products update from Admin Panel (pricing, stock, name changes)
  useEffect(() => {
    if (cart.length === 0 || products.length === 0) return;
    setCart(prevCart =>
      prevCart.map(item => {
        const liveProd = products.find(p => String(p.id) === String(item.product.id));
        if (liveProd && (liveProd.price !== item.product.price || liveProd.stock !== item.product.stock || liveProd.name !== item.product.name)) {
          return {
            ...item,
            product: liveProd
          };
        }
        return item;
      })
    );
  }, [products]);

  // 2. User-Scoped Hotels and Orders Subscriptions — live sync with Admin updates
  useEffect(() => {
    if (!userProfile.uid) {
      setHotels([]);
      setSelectedHotel(null);
      setOrders([]);
      return;
    }

    const unsubHotels = hotelService.subscribeForJoiner(
      {
        uid: userProfile.uid,
        name: userProfile.name,
        zone: userProfile.zone,
        phone: userProfile.phone
      },
      (mappedHotels) => {
        const transformed: MobileHotel[] = mappedHotels.map((item: any) => ({
          id: item.id ?? item.hotelId ?? Date.now(),
          hotelId: item.hotelId ?? String(item.id ?? ''),
          name: item.name || 'Unnamed Hotel',
          zone: item.zone || 'Kharadi',
          contactPerson: item.contactPerson || item.ownerName || '',
          phone: item.phone || item.mobile || '',
          address: item.address || '',
          gst: item.gst || item.gstNumber || '',
          fssai: item.fssai || item.fssaiNumber || '',
          orders: Number(item.orders || item.totalOrders || 0),
          status: (item.status === 'Active' || item.status === 'Pending' || item.status === 'Inactive') ? item.status : 'Active',
          image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
          joinedBy: item.joinedBy,
          joinerId: item.joinerId,
          assignedJoiner: item.assignedJoiner || item.joiner
        }));

        setHotels(transformed);
        setSelectedHotel(prev => {
          if (!prev && transformed.length > 0) return transformed[0];
          if (prev) {
            const found = transformed.find(item => String(item.id) === String(prev.id));
            return found || (transformed.length > 0 ? transformed[0] : null);
          }
          return null;
        });
      },
      (error) => {
        console.error('Mobile hotels Firestore error:', error);
      }
    );

    const unsubOrders = orderService.subscribeForJoiner(
      {
        uid: userProfile.uid,
        name: userProfile.name,
        zone: userProfile.zone,
        phone: userProfile.phone
      },
      (rawOrders) => {
        const mapped: MobileOrder[] = (rawOrders || []).map((o: any) => ({
          id: String(o.id || o.orderId || '#FB0000'),
          orderId: String(o.orderId || o.id || '#FB0000'),
          hotelId: o.hotelId,
          hotelName: o.hotelName || 'Partner Hotel',
          hotelZone: o.hotelZone || o.zone || 'Kharadi',
          zone: o.zone || o.hotelZone || 'Kharadi',
          joiner: o.joiner || userProfile.name,
          joinerId: o.joinerId || userProfile.uid,
          joinedBy: o.joinedBy || userProfile.uid,
          date: o.date || 'Today',
          timeSlot: o.timeSlot || '8 AM - 10 AM',
          amount: Number(o.totalAmount ?? o.amount ?? 0),
          subtotal: Number(o.subtotal ?? o.amount ?? 0),
          totalAmount: Number(o.totalAmount ?? o.amount ?? 0),
          deliveryCharge: Number(o.deliveryCharge ?? 0),
          paymentMode: o.paymentMode || o.paymentMethod || 'Online',
          paymentStatus: o.paymentStatus || 'Pending',
          status: o.status || o.orderStatus || 'Pending',
          orderStatus: o.orderStatus || o.status || 'Pending',
          items: o.items || []
        }));
        setOrders(mapped);
      },
      (error) => {
        console.error('Mobile orders Firestore error:', error);
      }
    );

    return () => {
      unsubHotels();
      unsubOrders();
    };
  }, [userProfile.uid, userProfile.name, userProfile.zone, userProfile.phone]);

  // Dynamic Commission & Wallet calculation for orders above ₹1,500 approved by Admin
  const commissionBalance = useMemo(() => {
    let liveDeliveredCommission = 0;
    let livePendingCommission = 0;
    let totalEligibleOrders = orders.length;
    let deliveredEligibleOrders = 0;

    orders.forEach(o => {
      const comm = Number((o as any).commission ?? 100);
      const rewardAmt = comm > 0 ? comm : 100;
      const st = String(o.status || o.orderStatus || '').toLowerCase();

      if (st === 'delivered' || st === 'completed') {
        deliveredEligibleOrders += 1;
        liveDeliveredCommission += rewardAmt;
      } else if (st !== 'cancelled') {
        livePendingCommission += rewardAmt;
      }
    });

    const recordedEarnings = Number(joinerDocData?.totalEarnings ?? joinerDocData?.commissionEarned ?? joinerDocData?.walletBalance ?? 0);
    const recordedPaid = Number(joinerDocData?.paidAmount ?? 0);

    const totalCommission = Math.max(recordedEarnings, liveDeliveredCommission);
    const paid = recordedPaid > 0 ? recordedPaid : liveDeliveredCommission;
    const pending = livePendingCommission;

    return {
      thisMonth: totalCommission,
      totalEarned: totalCommission,
      paid,
      pending,
      growth: orders.length > 0 ? 18 : 0,
      totalEligibleOrders,
      deliveredEligibleOrders
    };
  }, [orders, joinerDocData]);

  const commissionHistory = useMemo(() => {
    return orders.map(o => {
      const amt = Number(o.amount || o.totalAmount || o.subtotal || 0);
      const st = String(o.status || o.orderStatus || '').toLowerCase();
      const isDelivered = st === 'delivered' || st === 'completed';
      const commAmount = Number((o as any).commission ?? 100);

      return {
        date: o.date || 'Today',
        orderId: o.id || o.orderId || '#FB0000',
        hotelName: o.hotelName || 'Hotel Partner',
        amount: commAmount > 0 ? commAmount : 100,
        orderAmount: amt,
        isBonusEligible: true,
        status: (isDelivered ? 'Paid' : 'Pending Approval') as 'Paid' | 'Pending Approval' | 'Standard' | 'Pending'
      };
    });
  }, [orders]);

  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    subtitle?: string;
    category?: 'Orders' | 'Hotels' | 'Commission' | 'System' | string;
    iconType?: 'order' | 'hotel' | 'commission' | 'product' | 'system' | string;
  } | null>(null);

  const [pushPermissionGranted, setPushPermissionGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const playNotificationSound = useCallback((type: 'notification' | 'commission' | 'pop' = 'notification') => {
    if (!soundEnabled) return;
    try {
      if (type === 'commission') {
        soundEngine.playCommissionChime();
      } else if (type === 'pop') {
        soundEngine.playPop();
      } else {
        soundEngine.playNotificationChime();
      }
    } catch (e) {
      console.warn('Audio play notice', e);
    }
  }, [soundEnabled]);

  const triggerInAppToast = useCallback((
    title: string,
    subtitle?: string,
    category: 'Orders' | 'Hotels' | 'Commission' | 'System' | string = 'System',
    iconType: 'order' | 'hotel' | 'commission' | 'product' | 'system' | string = 'system'
  ) => {
    setActiveToast({
      id: String(Date.now()),
      title,
      subtitle,
      category,
      iconType
    });

    if (category === 'Commission' || iconType === 'commission') {
      playNotificationSound('commission');
    } else {
      playNotificationSound('notification');
    }

    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: subtitle || 'FarmerBox live alert',
          icon: '/images/farmerbox_brand_logo.png'
        });
      }
    } catch (e) {
      // Non-critical
    }
  }, [playNotificationSound]);

  const requestPushPermission = async (): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        const granted = perm === 'granted';
        setPushPermissionGranted(granted);
        if (granted) {
          triggerInAppToast('🔔 Push Alerts Active!', 'You will now receive live alerts for orders, updates & payouts.', 'System', 'system');
          return true;
        }
      }
    } catch (e) {
      console.warn('Push permission notice', e);
    }
    return false;
  };

  const addNotification = (notifData: Omit<MobileNotification, 'id'>) => {
    const docId = String(Date.now());
    const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const newNotif = {
      id: docId,
      ...notifData,
      message: notifData.subtitle || notifData.title,
      dateTime: nowStr,
      userType: 'Joiners',
      status: 'Sent',
      read: false
    };
    saveRecord('notifications', newNotif, docId);
    setNotifications(prev => [newNotif as unknown as MobileNotification, ...prev]);
    triggerInAppToast(notifData.title, notifData.subtitle, notifData.category, notifData.iconType);
  };

  const clearNotifications = () => {
    setNotifications([]);
    playNotificationSound('pop');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const addToCart = (product: MobileProduct) => {
    setCart(prev => {
      const existing = prev.find(item => String(item.product.id) === String(product.id));
      if (existing) {
        return prev.map(item =>
          String(item.product.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: number | string, qty: number, fallbackProduct?: MobileProduct) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const exists = prev.some(item => String(item.product.id) === String(productId));
      if (exists) {
        return prev.map(item =>
          String(item.product.id) === String(productId) ? { ...item, quantity: qty } : item
        );
      }
      const prodToAdd = fallbackProduct || products.find(p => String(p.id) === String(productId));
      if (prodToAdd) {
        return [...prev, { product: prodToAdd, quantity: qty }];
      }
      return prev;
    });
  };

  const setCartItems = (items: CartItem[]) => {
    setCart(items);
  };

  const removeFromCart = (productId: number | string) => {
    setCart(prev => prev.filter(item => String(item.product.id) !== String(productId)));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Add Hotel: Inserts hotel directly into Cloud Firestore 'hotels' collection with joinedBy & joinerId set to currentUser.uid
  const addHotel = async (newHotel: Omit<MobileHotel, 'id'> & { [key: string]: any }) => {
    if (!userProfile.uid) {
      throw new Error('Please log in to register hotels.');
    }

    const docId = `HT${Date.now().toString().slice(-6)}`;
    const hotelToSave: any = {
      id: docId,
      hotelId: docId,
      name: newHotel.name,
      zone: newHotel.zone || userProfile.zone.replace(' Zone', ''),
      orders: 0,
      status: 'Active',
      image: newHotel.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100',
      contactPerson: newHotel.contactPerson || newHotel.ownerName || 'Manager',
      phone: newHotel.phone || newHotel.mobile || '',
      address: newHotel.address || '',
      gst: newHotel.gst || '',
      fssai: newHotel.fssai || '',
      type: newHotel.type || 'Restaurant',
      assignedJoiner: userProfile.name,
      joinedBy: userProfile.uid,
      joinerId: userProfile.uid,
      dailyOrderKg: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveRecord('hotels', hotelToSave, docId);
    setHotels(prev => [hotelToSave, ...prev]);
    setSelectedHotel(hotelToSave);

    const updatedProfile = { ...userProfile, totalHotels: (userProfile.totalHotels || 0) + 1 };
    setUserProfile(updatedProfile);

    addNotification({
      title: 'Hotel Partner Added!',
      subtitle: `${newHotel.name} • ${hotelToSave.zone}`,
      time: 'Just now',
      category: 'Hotels',
      iconType: 'hotel'
    });
  };

  // Update Hotel in-place (no duplicate documents)
  const updateHotel = async (hotelId: string | number, updatedData: Partial<MobileHotel>) => {
    const docId = String(hotelId);
    const existing = hotels.find(h => String(h.id) === docId);
    const updatedHotel = {
      ...(existing || {}),
      ...updatedData,
      id: docId,
      hotelId: docId,
      updatedAt: new Date().toISOString()
    } as MobileHotel;

    setHotels(prev => prev.map(h => String(h.id) === docId ? updatedHotel : h));
    if (selectedHotel && String(selectedHotel.id) === docId) {
      setSelectedHotel(updatedHotel);
    }

    try {
      if (isFirebaseConfigured() && db) {
        const hotelRef = doc(db, 'hotels', docId);
        await setDoc(hotelRef, {
          ...updatedData,
          id: docId,
          hotelId: docId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore hotel update error:', e);
    }

    addNotification({
      title: 'Hotel Details Updated',
      subtitle: `${updatedData.name || 'Hotel'} was updated successfully`,
      time: 'Just now',
      category: 'Hotels',
      iconType: 'hotel'
    });
  };

  // Delete Hotel
  const deleteHotel = async (hotelId: string | number) => {
    const docId = String(hotelId);
    const targetHotel = hotels.find(h => String(h.id) === docId);
    setHotels(prev => prev.filter(h => String(h.id) !== docId));
    if (selectedHotel && String(selectedHotel.id) === docId) {
      setSelectedHotel(null);
    }

    try {
      if (isFirebaseConfigured() && db) {
        const { deleteDoc: deleteFirestoreDoc } = await import('firebase/firestore');
        await deleteFirestoreDoc(doc(db, 'hotels', docId));
      }
    } catch (e) {
      console.warn('Firestore hotel delete error:', e);
    }

    if (targetHotel) {
      addNotification({
        title: 'Hotel Removed',
        subtitle: `${targetHotel.name} was removed from your partners`,
        time: 'Just now',
        category: 'Hotels',
        iconType: 'hotel'
      });
    }
  };

  // Update Hotel Status: Allows Joiners to toggle between Active and Inactive in-place
  const updateHotelStatus = async (hotelId: string | number, newStatus: 'Active' | 'Inactive') => {
    const docId = String(hotelId);
    const targetHotel = hotels.find(h => String(h.id) === docId);
    if (!targetHotel) return;

    const updatedHotel = {
      ...targetHotel,
      id: docId,
      hotelId: docId,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    // Update state immediately
    setHotels(prev => prev.map(h => String(h.id) === docId ? updatedHotel : h));
    if (selectedHotel && String(selectedHotel.id) === docId) {
      setSelectedHotel(updatedHotel);
    }

    // Save to Firestore in-place (merge: true with exact document ID)
    try {
      if (isFirebaseConfigured() && db) {
        const hotelRef = doc(db, 'hotels', docId);
        await setDoc(hotelRef, {
          id: docId,
          hotelId: docId,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore hotel status update notice:', e);
    }

    addNotification({
      title: `Hotel Status: ${newStatus}`,
      subtitle: `${targetHotel.name} is now marked as ${newStatus}`,
      time: 'Just now',
      category: 'Hotels',
      iconType: 'hotel'
    });

    playNotificationSound('pop');
  };

  // Add Order: Inserts order directly into Cloud Firestore 'orders' collection with joinerId set to currentUser.uid
  const addOrder = (orderData: Partial<MobileOrder>): MobileOrder => {
    if (!userProfile.uid) {
      throw new Error('Please log in to place orders.');
    }

    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `#FB${orderNum}`;

    const mappedItems = cart.map(item => ({
      id: item.product.id,
      productId: item.product.id,
      name: item.product.name,
      productName: item.product.name,
      category: item.product.category,
      image: item.product.image,
      qty: item.quantity,
      quantity: item.quantity,
      unit: item.product.unit,
      price: item.product.price,
      total: item.quantity * item.product.price,
      isImported: item.product.isImported,
      originCountry: item.product.originCountry,
      countryFlag: item.product.countryFlag
    }));

    const hotelObj = selectedHotel || (hotels.length > 0 ? hotels[0] : null);
    const calculatedCartAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const finalAmount = orderData.amount !== undefined && orderData.amount > 0 ? Number(orderData.amount) : calculatedCartAmount;

    const newOrder: any = {
      id: orderId,
      orderId: orderId,
      hotelId: hotelObj ? hotelObj.id : 'HT01',
      hotelName: orderData.hotelName || (hotelObj ? hotelObj.name : 'Selected Hotel'),
      hotelZone: orderData.hotelZone || (hotelObj ? hotelObj.zone : userProfile.zone.replace(' Zone', '')),
      zone: orderData.hotelZone || (hotelObj ? hotelObj.zone : userProfile.zone.replace(' Zone', '')),
      joiner: userProfile.name || '',
      joinerId: userProfile.uid,
      joinedBy: userProfile.uid,
      joinerPhone: userProfile.phone || '',
      date: orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeSlot: orderData.timeSlot || '8 AM - 10 AM',
      amount: finalAmount,
      totalAmount: finalAmount,
      subtotal: finalAmount,
      deliveryCharge: 0,
      paymentMode: 'Online',
      paymentMethod: 'Online',
      paymentStatus: 'Pending',
      driver: 'Assigned upon dispatch',
      deliveryPartnerId: 'DR01',
      status: 'Pending',
      orderStatus: 'Pending',
      isBonusEligible: true,
      bonusAmount: 100,
      bonusStatus: 'Pending Delivery Approval',
      commission: 100,
      walletCredited: false,
      items: mappedItems,
      rawItems: [...cart],
      ...orderData
    };

    saveRecord('orders', newOrder, orderId);

    // Increment joiner totalOrders count in Firestore
    if (db && userProfile.uid) {
      try {
        const cleanPhone = (userProfile.phone || '').replace(/\D/g, '');
        const docId = userProfile.uid.startsWith('usr_') ? userProfile.uid : `usr_${cleanPhone || userProfile.uid}`;
        const joinerRef = doc(db, 'joiners', docId);
        getDoc(joinerRef).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const currentOrders = Number(data.totalOrders || 0);
            setDoc(joinerRef, {
              totalOrders: currentOrders + 1,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }).catch(() => {});
      } catch (e) {
        // ignore
      }
    }

    setOrders(prev => [newOrder, ...prev]);
    setLastPlacedOrder(newOrder);
    clearCart();

    const updatedProfile = { ...userProfile, totalOrders: (userProfile.totalOrders || 0) + 1 };
    setUserProfile(updatedProfile);

    addNotification({
      title: 'New Order Placed! 🥦',
      subtitle: `${newOrder.hotelName} • ₹${newOrder.amount}`,
      time: 'Just now',
      category: 'Orders',
      iconType: 'order'
    });

    playNotificationSound('notification');

    return newOrder;
  };

  // Phone OTP Flow Methods
  const sendPhoneOtp = async (phone: string, containerId?: string) => {
    return await authService.sendPhoneOtp(phone, containerId);
  };

  const verifyPhoneOtp = async (otp: string, phone: string, name?: string, zone?: string) => {
    const user = await authService.verifyPhoneOtp(otp, phone, name, zone);
    const profile: JoinerUserProfile = {
      uid: user.uid,
      name: user.name || 'Hotel Joiner',
      role: 'Hotel Joiner',
      zone: user.zone || 'Kharadi Zone',
      phone: user.phone || phone,
      email: user.email || '',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      totalHotels: 0,
      totalOrders: 0
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOBILE_JOINER_SESSION_KEY, JSON.stringify(profile));
    }
    setUserProfile(profile);
    setScreenState('DASHBOARD');
  };

  const resendPhoneOtp = async (phone: string, containerId?: string) => {
    return await authService.resendPhoneOtp(phone, containerId);
  };

  const registerUser = async (data: { name: string; phone: string; email: string; zone: string; password?: string }) => {
    const user = await authService.registerJoiner(data);
    const profile: JoinerUserProfile = {
      uid: user.uid,
      name: user.name,
      role: 'Hotel Joiner',
      zone: user.zone,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      totalHotels: 0,
      totalOrders: 0
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOBILE_JOINER_SESSION_KEY, JSON.stringify(profile));
    }
    setUserProfile(profile);
    setScreenState('DASHBOARD');
  };

  const loginUser = async (identifier: string, password?: string) => {
    const user = await authService.loginWithPhoneOrEmail(identifier, password, 'joiner');
    const profile: JoinerUserProfile = {
      uid: user.uid,
      name: user.name,
      role: 'Hotel Joiner',
      zone: user.zone,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      totalHotels: 0,
      totalOrders: 0
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOBILE_JOINER_SESSION_KEY, JSON.stringify(profile));
    }
    setUserProfile(profile);
    setScreenState('DASHBOARD');
  };

  const logoutUser = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOBILE_JOINER_SESSION_KEY);
    }
    setUserProfile({
      uid: '',
      name: '',
      role: 'Hotel Joiner',
      zone: '',
      phone: '',
      email: '',
      avatar: '',
      totalHotels: 0,
      totalOrders: 0
    });
    setHotels([]);
    setOrders([]);
    setSelectedHotel(null);
    setCart([]);
    setLastPlacedOrder(null);
    setScreenState('WELCOME');
  };

  const updateUserProfile = async (data: Partial<JoinerUserProfile>) => {
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    await authService.saveUserProfile({
      uid: userProfile.uid,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: 'joiner',
      zone: updated.zone,
      avatar: updated.avatar
    });
  };

  return (
    <JoinerAppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedHotel,
        setSelectedHotel,
        hotels,
        addHotel,
        updateHotel,
        deleteHotel,
        updateHotelStatus,
        products,
        cart,
        addToCart,
        updateCartQty,
        setCartItems,
        removeFromCart,
        clearCart,
        cartTotal,
        orders,
        addOrder,
        lastPlacedOrder,
        selectedOrderForReorder,
        setSelectedOrderForReorder,
        notifications,
        hasUnreadNotifications,
        unreadNotificationsCount,
        markNotificationsRead,
        soundEnabled,
        setSoundEnabled,
        playNotificationSound,
        addNotification,
        clearNotifications,
        activeToast,
        triggerInAppToast,
        dismissToast,
        requestPushPermission,
        pushPermissionGranted,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        appVersion,
        checkForAppUpdates,
        commissionBalance,
        commissionHistory,
        userProfile,
        sendPhoneOtp,
        verifyPhoneOtp,
        resendPhoneOtp,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile
      }}
    >
      {children}
    </JoinerAppContext.Provider>
  );
};

export const useJoinerApp = () => {
  const context = useContext(JoinerAppContext);
  if (!context) {
    throw new Error('useJoinerApp must be used within a JoinerAppProvider');
  }
  return context;
};
