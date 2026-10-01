import type {
  Order,
  Zone,
  Joiner,
  Driver,
  Hotel,
  Product,
  PaymentTransaction,
  NotificationItem
} from './types';

export const initialZones: Zone[] = [
  { id: 1, name: 'Kharadi', areaLocations: 'Kharadi, Mundhwa, Chandan Nagar', joinersCount: 2, hotelsCount: 2, ordersThisMonth: 25, salesThisMonth: 63500, status: 'Active', color: '#fb923c', assignedJoinersList: [] },
  { id: 2, name: 'Viman Nagar', areaLocations: 'Viman Nagar, Airport, Tingre Nagar', joinersCount: 1, hotelsCount: 1, ordersThisMonth: 8, salesThisMonth: 19200, status: 'Active', color: '#38bdf8', assignedJoinersList: [] },
  { id: 3, name: 'Hinjawadi', areaLocations: 'Hinjawadi, Phase 1/2/3, Maan', joinersCount: 1, hotelsCount: 1, ordersThisMonth: 16, salesThisMonth: 48000, status: 'Active', color: '#c084fc', assignedJoinersList: [] },
  { id: 4, name: 'Magarpatta', areaLocations: 'Magarpatta, Hadapsar, Cybercity', joinersCount: 1, hotelsCount: 1, ordersThisMonth: 12, salesThisMonth: 31000, status: 'Active', color: '#4ade80', assignedJoinersList: [] },
  { id: 5, name: 'Hadapsar', areaLocations: 'Hadapsar, Amanora, Sasane Nagar', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#f87171', assignedJoinersList: [] },
  { id: 6, name: 'Kothrud', areaLocations: 'Kothrud, Karve Nagar, Paud Road', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#facc15', assignedJoinersList: [] },
  { id: 7, name: 'Shivajinagar', areaLocations: 'Shivajinagar, JM Road, FC Road', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#fb923c', assignedJoinersList: [] },
  { id: 8, name: 'Aundh', areaLocations: 'Aundh, Baner Road, Bremen Chowk', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#4ade80', assignedJoinersList: [] },
  { id: 9, name: 'Baner', areaLocations: 'Baner, Balewadi, High Street', joinersCount: 1, hotelsCount: 1, ordersThisMonth: 10, salesThisMonth: 24500, status: 'Active', color: '#f472b6', assignedJoinersList: [] },
  { id: 10, name: 'Wakad', areaLocations: 'Wakad, Tathawade, Dange Chowk', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#60a5fa', assignedJoinersList: [] },
  { id: 11, name: 'Pimpri Chinchwad', areaLocations: 'Pimpri, Chinchwad, Nigdi', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#e879f9', assignedJoinersList: [] },
  { id: 12, name: 'Undri', areaLocations: 'Undri, NIBM, Mohammadwadi', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#38bdf8', assignedJoinersList: [] }
];

export const initialJoiners: Joiner[] = [
  {
    id: 'usr_9822011111',
    name: 'Rahul Patil',
    mobile: '9822011111',
    phone: '9822011111',
    email: 'rahul.patil@farmerbox.in',
    zone: 'Kharadi',
    joinerCode: 'JN1001',
    status: 'Active',
    totalHotels: 2,
    totalOrders: 25,
    totalEarnings: 2500,
    commissionEarned: 2500,
    walletBalance: 2500,
    paidAmount: 1500,
    pendingAmount: 1000,
    joinedDate: '15 Aug 2026',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    upiId: 'rahulpatil@okaxis',
    bankName: 'HDFC Bank',
    accountNo: '•••• •••• 4521',
    ifscCode: 'HDFC0001234'
  },
  {
    id: 'usr_9822022222',
    name: 'Amit Shinde',
    mobile: '9822022222',
    phone: '9822022222',
    email: 'amit.shinde@farmerbox.in',
    zone: 'Viman Nagar',
    joinerCode: 'JN1002',
    status: 'Active',
    totalHotels: 1,
    totalOrders: 8,
    totalEarnings: 800,
    commissionEarned: 800,
    walletBalance: 800,
    paidAmount: 500,
    pendingAmount: 300,
    joinedDate: '20 Aug 2026',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    upiId: 'amitshinde@okicici',
    bankName: 'ICICI Bank',
    accountNo: '•••• •••• 8892',
    ifscCode: 'ICIC0000456'
  },
  {
    id: 'usr_9822033333',
    name: 'Vikas Jadhav',
    mobile: '9822033333',
    phone: '9822033333',
    email: 'vikas.jadhav@farmerbox.in',
    zone: 'Hinjawadi',
    joinerCode: 'JN1003',
    status: 'Active',
    totalHotels: 1,
    totalOrders: 16,
    totalEarnings: 1600,
    commissionEarned: 1600,
    walletBalance: 1600,
    paidAmount: 1000,
    pendingAmount: 600,
    joinedDate: '01 Sep 2026',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    upiId: 'vikasjadhav@oksbi',
    bankName: 'SBI',
    accountNo: '•••• •••• 1123',
    ifscCode: 'SBIN0002345'
  }
];

export const initialDrivers: Driver[] = [
  {
    id: 1,
    name: 'Suresh Jadhav',
    phone: '9876543210',
    mobile: '9876543210',
    zone: 'Kharadi',
    vehicleNo: 'MH-12-FB-1001',
    vehicleNumber: 'MH-12-FB-1001',
    vehicleType: 'Tata Ace (Chota Hathi)',
    status: 'Active',
    totalDeliveries: 42,
    assignedOrdersCount: 2,
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
  },
  {
    id: 2,
    name: 'Ramesh Pawar',
    phone: '9876543211',
    mobile: '9876543211',
    zone: 'Viman Nagar',
    vehicleNo: 'MH-12-FB-1002',
    vehicleNumber: 'MH-12-FB-1002',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    status: 'Active',
    totalDeliveries: 28,
    assignedOrdersCount: 1,
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
  },
  {
    id: 3,
    name: 'Santosh Shinde',
    phone: '9876543212',
    mobile: '9876543212',
    zone: 'Hinjawadi',
    vehicleNo: 'MH-12-FB-1003',
    vehicleNumber: 'MH-12-FB-1003',
    vehicleType: 'Electric E-Loader 3W',
    status: 'Active',
    totalDeliveries: 15,
    assignedOrdersCount: 0,
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
  }
];

export const initialDriversList = initialDrivers;

export const initialHotels: Hotel[] = [];

export const initialOrders: Order[] = [];


export const initialProducts: Product[] = [];

export const initialPayments: PaymentTransaction[] = [];

export const initialNotifications: NotificationItem[] = [];
