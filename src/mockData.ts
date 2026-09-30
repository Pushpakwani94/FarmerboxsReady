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
  { id: 1, name: 'Kharadi', areaLocations: 'Kharadi, Mundhwa', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#fb923c', assignedJoinersList: [] },
  { id: 2, name: 'Viman Nagar', areaLocations: 'Viman Nagar, Airport', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#38bdf8', assignedJoinersList: [] },
  { id: 3, name: 'Hinjawadi', areaLocations: 'Hinjawadi, Phase 1/2/3', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#c084fc', assignedJoinersList: [] },
  { id: 4, name: 'Magarpatta', areaLocations: 'Magarpatta, Hadapsar', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#4ade80', assignedJoinersList: [] },
  { id: 5, name: 'Hadapsar', areaLocations: 'Hadapsar, Amanora', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#f87171', assignedJoinersList: [] },
  { id: 6, name: 'Kothrud', areaLocations: 'Kothrud, Karve Nagar', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#facc15', assignedJoinersList: [] },
  { id: 7, name: 'Shivajinagar', areaLocations: 'Shivajinagar, JM Road', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#fb923c', assignedJoinersList: [] },
  { id: 8, name: 'Aundh', areaLocations: 'Aundh, Baner', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#4ade80', assignedJoinersList: [] },
  { id: 9, name: 'Baner', areaLocations: 'Baner, Balewadi', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#f472b6', assignedJoinersList: [] },
  { id: 10, name: 'Wakad', areaLocations: 'Wakad, Tathawade', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#60a5fa', assignedJoinersList: [] },
  { id: 11, name: 'Pimpri Chinchwad', areaLocations: 'Pimpri, Chinchwad', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#e879f9', assignedJoinersList: [] },
  { id: 12, name: 'Undri', areaLocations: 'Undri, NIBM', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#38bdf8', assignedJoinersList: [] }
];

export const initialJoiners: Joiner[] = [];

export const initialDrivers: Driver[] = [];

export const initialOrders: Order[] = [];

export const initialHotels: Hotel[] = [];

export const initialProducts: Product[] = [];

export const initialPayments: PaymentTransaction[] = [];

export const initialNotifications: NotificationItem[] = [];
