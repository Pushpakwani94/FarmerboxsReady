import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type {
  CustomerScreen,
  CustomerUser,
  CustomerAddress,
  CustomerCartItem,
  CustomerOrder,
  CustomerNotification,
  CustomerWalletTransaction,
  CustomerCoupon
} from './types';
import type { Product } from '../types';
import { initialProductsList } from '../data/productsData';
import { subscribeToCollection, saveRecord, deleteRecord } from '../firebase/dbService';
import { resolveProductImage } from '../utils/productImages';

interface CustomerAppContextType {
  currentScreen: CustomerScreen;
  setCurrentScreen: (screen: CustomerScreen) => void;
  navigateTo: (screen: CustomerScreen) => void;
  user: CustomerUser;
  isLoggedIn: boolean;
  loginPhone: string;
  setLoginPhone: (phone: string) => void;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<CustomerUser>) => void;

  // Products & Category
  products: Product[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (subCat: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (open: boolean) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  sortBy: 'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc';
  setSortBy: (sort: 'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc') => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;

  // Cart
  cart: CustomerCartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  itemTotal: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;

  // Coupon
  availableCoupons: CustomerCoupon[];
  appliedCoupon: CustomerCoupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  // Addresses
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  setSelectedAddress: (addr: CustomerAddress) => void;
  addAddress: (addr: Omit<CustomerAddress, 'id'>) => void;
  deleteAddress: (id: string) => void;

  // Payment & Checkout
  selectedPaymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'COD';
  setSelectedPaymentMethod: (method: 'UPI' | 'Card' | 'NetBanking' | 'COD') => void;
  placeOrder: () => Promise<CustomerOrder>;
  lastPlacedOrder: CustomerOrder | null;

  // Orders
  orders: CustomerOrder[];
  cancelOrder: (orderId: string) => void;

  // Wishlist
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;

  // Wallet
  walletBalance: number;
  walletTransactions: CustomerWalletTransaction[];
  addWalletMoney: (amount: number) => void;

  // Notifications
  notifications: CustomerNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  unreadNotificationCount: number;
}

const defaultUser: CustomerUser = {
  id: 'cust_9876543210',
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  walletBalance: 500
};

const initialAddresses: CustomerAddress[] = [
  {
    id: 'addr_1',
    type: 'Home',
    label: 'Home',
    flat: 'Flat 402, Green Acres Residency',
    area: 'Baner Road',
    city: 'Pune',
    pincode: '411045',
    isDefault: true
  },
  {
    id: 'addr_2',
    type: 'Work',
    label: 'Work',
    flat: 'Canary Techsys, Tower 3, EON Free Zone',
    area: 'Kharadi',
    city: 'Pune',
    pincode: '411014',
    isDefault: false
  },
  {
    id: 'addr_3',
    type: 'Other',
    label: 'Parents House',
    flat: 'Bungalow 12, Pradhikaran',
    area: 'Nigdi',
    city: 'Pune',
    pincode: '411044',
    isDefault: false
  }
];

const initialCoupons: CustomerCoupon[] = [
  {
    code: 'FARM50',
    title: 'Flat 50% Off on Chikoo & Sapota',
    discountPercent: 50,
    minOrderAmount: 199,
    description: 'Special seasonal discount on sweet Dahanu Chikoos',
    tag: 'FLAT 50%'
  },
  {
    code: 'FREEDEL',
    title: 'Free Delivery on Orders above ₹299',
    discountAmount: 30,
    minOrderAmount: 299,
    description: 'Zero delivery fee for fresh farm vegetables and fruits',
    tag: 'FREE DELIVERY'
  },
  {
    code: 'GLOBAL20',
    title: '20% OFF on Exotic & Imported Fruits',
    discountPercent: 20,
    minOrderAmount: 349,
    description: 'Applicable on Kiwis, Washington Apples, Avocados & Dragon Fruits',
    tag: '20% OFF'
  }
];

const initialOrders: CustomerOrder[] = [
  {
    id: 'FB12345678',
    items: [
      {
        productId: 35,
        name: 'Jalgaon Orchard Robusta Bananas (1 Dozen)',
        category: 'Fruits',
        unit: '1 Dozen',
        price: 55,
        originalPrice: 70,
        image: '/products/banana.jpg',
        quantity: 1
      },
      {
        productId: 29,
        name: 'Washington Red Delicious Apple (Pack of 4 Pcs)',
        category: 'Fruits',
        unit: 'Pack (4 Pcs)',
        price: 175,
        originalPrice: 220,
        image: '/products/apple.jpg',
        quantity: 1
      },
      {
        productId: 1,
        name: 'Farm Fresh Red Tomato (1 KG Pack)',
        category: 'Vegetables',
        unit: '1 KG',
        price: 38,
        originalPrice: 50,
        image: '/products/tomato.jpg',
        quantity: 2
      }
    ],
    totalAmount: 306,
    itemTotal: 306,
    deliveryFee: 0,
    discountAmount: 30,
    couponCode: 'FREEDEL',
    paymentMethod: 'UPI',
    deliveryAddress: initialAddresses[0],
    status: 'Processing',
    orderDate: 'Today, 02:45 PM',
    estimatedDelivery: 'Today by 06:30 PM',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210'
  },
  {
    id: 'FB12345677',
    items: [
      {
        productId: 46,
        name: 'Mahabaleshwar Sweet Strawberries (250g Box)',
        category: 'Fruits',
        unit: '250g Box',
        price: 90,
        originalPrice: 120,
        image: '/products/strawberry.jpg',
        quantity: 2
      },
      {
        productId: 43,
        name: 'Ratnagiri Alphonso Mango (6 Pcs Box)',
        category: 'Fruits',
        unit: 'Box (6 Pcs)',
        price: 380,
        originalPrice: 480,
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
        quantity: 1
      }
    ],
    totalAmount: 560,
    itemTotal: 560,
    deliveryFee: 0,
    discountAmount: 0,
    paymentMethod: 'Card',
    deliveryAddress: initialAddresses[0],
    status: 'Delivered',
    orderDate: '20 Sep 2026, 11:20 AM',
    estimatedDelivery: 'Delivered on 20 Sep 2026',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210'
  },
  {
    id: 'FB12345676',
    items: [
      {
        productId: 2,
        name: 'Nashik Sweet Red Onion (1 KG Mesh Net)',
        category: 'Vegetables',
        unit: '1 KG',
        price: 32,
        image: '/products/onion.jpg',
        quantity: 3
      },
      {
        productId: 3,
        name: 'Agra Fresh Potato (1 KG Pouch)',
        category: 'Vegetables',
        unit: '1 KG',
        price: 28,
        image: '/products/potato.jpg',
        quantity: 2
      }
    ],
    totalAmount: 182,
    itemTotal: 152,
    deliveryFee: 30,
    discountAmount: 0,
    paymentMethod: 'COD',
    deliveryAddress: initialAddresses[1],
    status: 'Cancelled',
    orderDate: '18 Sep 2026, 09:15 AM',
    estimatedDelivery: 'Cancelled by customer',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210'
  }
];

const initialWalletTx: CustomerWalletTransaction[] = [
  {
    id: 'tx_1',
    title: 'Added Money to Wallet',
    date: '21 Sep 2026, 01:10 PM',
    amount: 500,
    type: 'credit',
    status: 'Success'
  },
  {
    id: 'tx_2',
    title: 'Order Payment #FB12345677',
    date: '20 Sep 2026, 11:20 AM',
    amount: 380,
    type: 'debit',
    status: 'Success'
  },
  {
    id: 'tx_3',
    title: 'Refund for Order #FB12345676',
    date: '18 Sep 2026, 10:00 AM',
    amount: 120,
    type: 'credit',
    status: 'Success'
  }
];

const initialNotifs: CustomerNotification[] = [
  {
    id: 'notif_1',
    title: 'Order Confirmed',
    message: 'Your order #FB12345678 has been confirmed and is being packed fresh.',
    type: 'order',
    time: '2m ago',
    read: false,
    orderId: 'FB12345678'
  },
  {
    id: 'notif_2',
    title: 'Out for Delivery',
    message: 'Driver Sunil Kamble is out for delivery with your fresh vegetables.',
    type: 'order',
    time: '1h ago',
    read: false,
    orderId: 'FB12345678'
  },
  {
    id: 'notif_3',
    title: 'Special Offer: Flat 50% Off',
    message: 'Enjoy 50% off on sweet Dahanu Chikoo & Sapota today only!',
    type: 'offer',
    time: '3h ago',
    read: true
  },
  {
    id: 'notif_4',
    title: 'New Arrivals: Fresh Strawberries',
    message: 'Mahabaleshwar ruby sweet strawberries are freshly stocked!',
    type: 'offer',
    time: '1d ago',
    read: true
  },
  {
    id: 'notif_5',
    title: 'Delivery Completed',
    message: 'Your order #FB12345677 has been safely delivered.',
    type: 'order',
    time: '1d ago',
    read: true,
    orderId: 'FB12345677'
  }
];

const CustomerAppContext = createContext<CustomerAppContextType | undefined>(undefined);

export const CustomerAppProvider: React.FC<{ children: ReactNode; initialScreen?: CustomerScreen }> = ({ children, initialScreen }) => {
  const [currentScreen, setCurrentScreen] = useState<CustomerScreen>(initialScreen || 'home');
  const [user, setUser] = useState<CustomerUser>(defaultUser);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loginPhone, setLoginPhone] = useState('9876543210');

  const navigateTo = (screen: CustomerScreen) => {
    setCurrentScreen(screen);
  };

  // Products from Firestore
  const [products, setProducts] = useState<Product[]>(initialProductsList);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc'>('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);

  // Cart
  const [cart, setCart] = useState<CustomerCartItem[]>([
    {
      productId: 35,
      name: 'Jalgaon Orchard Robusta Bananas (1 Dozen)',
      category: 'Fruits',
      unit: '1 Dozen',
      price: 55,
      originalPrice: 70,
      image: '/products/banana.jpg',
      quantity: 1
    },
    {
      productId: 29,
      name: 'Washington Red Delicious Apple (Pack of 4 Pcs)',
      category: 'Fruits',
      unit: 'Pack (4 Pcs)',
      price: 175,
      originalPrice: 220,
      image: '/products/apple.jpg',
      quantity: 1
    },
    {
      productId: 1,
      name: 'Farm Fresh Red Tomato (1 KG Pack)',
      category: 'Vegetables',
      unit: '1 KG',
      price: 38,
      originalPrice: 50,
      image: '/products/tomato.jpg',
      quantity: 2
    }
  ]);

  // Coupon
  const [availableCoupons] = useState<CustomerCoupon[]>(initialCoupons);
  const [appliedCoupon, setAppliedCoupon] = useState<CustomerCoupon | null>(null);

  // Addresses
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(initialAddresses[0]);

  // Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking' | 'COD'>('UPI');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<CustomerOrder | null>(null);

  // Orders - Clean dynamic state
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('farmerbox_customer_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<number[]>([43, 46, 17, 5]);

  // Wallet
  const [walletBalance, setWalletBalance] = useState(500);
  const [walletTransactions, setWalletTransactions] = useState<CustomerWalletTransaction[]>(initialWalletTx);

  // Notifications
  const [notifications, setNotifications] = useState<CustomerNotification[]>(initialNotifs);

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = subscribeToCollection<Product>('products', (data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
    }, () => {
      // Fallback already in state
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Cart calculation
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const itemTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const deliveryFee = useMemo(() => (itemTotal > 299 || itemTotal === 0 ? 0 : 30), [itemTotal]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent) {
      return Math.round((itemTotal * appliedCoupon.discountPercent) / 100);
    }
    if (appliedCoupon.discountAmount) {
      return appliedCoupon.discountAmount;
    }
    return 0;
  }, [appliedCoupon, itemTotal]);

  const grandTotal = useMemo(() => Math.max(0, itemTotal + deliveryFee - discountAmount), [itemTotal, deliveryFee, discountAmount]);

  // Auth Methods
  const sendOtp = async (phone: string) => {
    setLoginPhone(phone);
    return true;
  };

  const verifyOtp = async (_otp: string) => {
    setIsLoggedIn(true);
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('LOGIN');
  };

  const updateProfile = (data: Partial<CustomerUser>) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  // Cart Methods
  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const b2cPrice = product.b2cPrice || product.salePrice;
      const originalPrice = Math.round(b2cPrice * 1.25);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          unit: product.unit || '1 KG',
          price: b2cPrice,
          originalPrice,
          image: resolveProductImage(product.name, product.category, product.image),
          quantity: qty,
          isImported: product.isImported,
          originCountry: product.originCountry
        }
      ];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => (item.productId === productId ? { ...item, quantity: qty } : item)));
    }
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon Methods
  const applyCoupon = (code: string) => {
    const found = availableCoupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!found) {
      return { success: false, message: 'Invalid coupon code.' };
    }
    if (itemTotal < found.minOrderAmount) {
      return { success: false, message: `Minimum order value ₹${found.minOrderAmount} required.` };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Address Methods
  const addAddress = (addr: Omit<CustomerAddress, 'id'>) => {
    const newAddr: CustomerAddress = {
      ...addr,
      id: `addr_${Date.now()}`
    };
    setAddresses(prev => [newAddr, ...prev]);
    setSelectedAddress(newAddr);
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedAddress?.id === id) {
      setSelectedAddress(addresses.find(a => a.id !== id) || null);
    }
  };

  // Wishlist Methods
  const toggleWishlist = (productId: number) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: number) => wishlist.includes(productId);

  // Wallet
  const addWalletMoney = (amount: number) => {
    setWalletBalance(prev => prev + amount);
    const newTx: CustomerWalletTransaction = {
      id: `tx_${Date.now()}`,
      title: 'Added Money to Wallet',
      date: 'Just now',
      amount,
      type: 'credit',
      status: 'Success'
    };
    setWalletTransactions(prev => [newTx, ...prev]);
  };

  // Place Order
  const placeOrder = async (): Promise<CustomerOrder> => {
    const newOrder: CustomerOrder = {
      id: `FB${Math.floor(10000000 + Math.random() * 90000000)}`,
      items: [...cart],
      totalAmount: grandTotal,
      itemTotal,
      deliveryFee,
      discountAmount,
      couponCode: appliedCoupon?.code,
      paymentMethod: selectedPaymentMethod,
      deliveryAddress: selectedAddress || addresses[0],
      status: 'Processing',
      orderDate: 'Today, Just now',
      estimatedDelivery: 'Today by 06:30 PM',
      customerName: user.name,
      customerPhone: user.phone
    };

    // Save to Firestore so Admin Panel receives it in real-time!
    try {
      const adminOrderPayload = {
        id: newOrder.id,
        orderId: newOrder.id,
        hotelName: `${user.name} (B2C Customer)`,
        hotelId: 'cust_b2c',
        joiner: 'FarmerBox Direct B2C',
        joinerName: 'FarmerBox Direct B2C',
        zone: newOrder.deliveryAddress?.area || 'Baner',
        amount: newOrder.totalAmount,
        totalAmount: newOrder.totalAmount,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderDate: 'Today',
        deliveryDate: 'Today',
        itemsCount: cartItemCount,
        status: 'Pending',
        orderStatus: 'Pending',
        paymentStatus: selectedPaymentMethod === 'COD' ? 'Pending' : 'Paid',
        paymentMode: selectedPaymentMethod,
        driver: 'Assigned upon dispatch',
        commission: 100,
        walletCredited: false,
        items: cart.map(item => ({
          id: item.productId,
          productName: item.name,
          name: item.name,
          qty: item.quantity,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.price * item.quantity
        }))
      };
      await saveRecord('orders', adminOrderPayload, newOrder.id);
    } catch (e) {
      console.warn('Firestore order sync:', e);
    }

    // Save locally
    setOrders(prev => [newOrder, ...prev]);
    setLastPlacedOrder(newOrder);
    clearCart();

    // Add Notification
    setNotifications(prev => [
      {
        id: `notif_${Date.now()}`,
        title: 'Order Placed Successfully!',
        message: `Your order #${newOrder.id} of ₹${newOrder.totalAmount} has been placed.`,
        type: 'order',
        time: 'Just now',
        read: false,
        orderId: newOrder.id
      },
      ...prev
    ]);

    return newOrder;
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'Cancelled' } : o))
    );
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <CustomerAppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        navigateTo,
        user,
        isLoggedIn,
        loginPhone,
        setLoginPhone,
        sendOtp,
        verifyOtp,
        logout,
        updateProfile,
        products,
        selectedCategory,
        setSelectedCategory,
        selectedSubCategory,
        setSelectedSubCategory,
        selectedProduct,
        setSelectedProduct,
        searchQuery,
        setSearchQuery,
        isFilterModalOpen,
        setIsFilterModalOpen,
        filterCategory,
        setFilterCategory,
        sortBy,
        setSortBy,
        priceRange,
        setPriceRange,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartItemCount,
        itemTotal,
        deliveryFee,
        discountAmount,
        grandTotal,
        availableCoupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        addresses,
        selectedAddress,
        setSelectedAddress,
        addAddress,
        deleteAddress,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        placeOrder,
        lastPlacedOrder,
        orders,
        cancelOrder,
        wishlist,
        toggleWishlist,
        isInWishlist,
        walletBalance,
        walletTransactions,
        addWalletMoney,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        unreadNotificationCount
      }}
    >
      {children}
    </CustomerAppContext.Provider>
  );
};

export const useCustomerApp = (): CustomerAppContextType => {
  const context = useContext(CustomerAppContext);
  if (!context) {
    throw new Error('useCustomerApp must be used within a CustomerAppProvider');
  }
  return context;
};
