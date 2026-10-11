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
  { id: 1, name: 'Kharadi', areaLocations: 'Kharadi, Mundhwa, Chandan Nagar', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#fb923c', assignedJoinersList: [] },
  { id: 2, name: 'Viman Nagar', areaLocations: 'Viman Nagar, Airport, Tingre Nagar', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#38bdf8', assignedJoinersList: [] },
  { id: 3, name: 'Hinjawadi', areaLocations: 'Hinjawadi, Phase 1/2/3, Maan', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#c084fc', assignedJoinersList: [] },
  { id: 4, name: 'Magarpatta', areaLocations: 'Magarpatta, Hadapsar, Cybercity', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#4ade80', assignedJoinersList: [] },
  { id: 5, name: 'Hadapsar', areaLocations: 'Hadapsar, Amanora, Sasane Nagar', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#f87171', assignedJoinersList: [] },
  { id: 6, name: 'Kothrud', areaLocations: 'Kothrud, Karve Nagar, Paud Road', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#facc15', assignedJoinersList: [] },
  { id: 7, name: 'Shivajinagar', areaLocations: 'Shivajinagar, JM Road, FC Road', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#fb923c', assignedJoinersList: [] },
  { id: 8, name: 'Aundh', areaLocations: 'Aundh, Baner Road, Bremen Chowk', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#4ade80', assignedJoinersList: [] },
  { id: 9, name: 'Baner', areaLocations: 'Baner, Balewadi, High Street', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#f472b6', assignedJoinersList: [] },
  { id: 10, name: 'Wakad', areaLocations: 'Wakad, Tathawade, Dange Chowk', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#60a5fa', assignedJoinersList: [] },
  { id: 11, name: 'Pimpri Chinchwad', areaLocations: 'Pimpri, Chinchwad, Nigdi', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#e879f9', assignedJoinersList: [] },
  { id: 12, name: 'Undri', areaLocations: 'Undri, NIBM, Mohammadwadi', joinersCount: 0, hotelsCount: 0, ordersThisMonth: 0, salesThisMonth: 0, status: 'Active', color: '#38bdf8', assignedJoinersList: [] }
];

export const initialJoiners: Joiner[] = [];

export const initialDrivers: Driver[] = [];

export const initialDriversList = initialDrivers;

export const initialHotels: Hotel[] = [];

export const initialOrders: Order[] = [];


export const initialProducts: Product[] = [];

export const initialPayments: PaymentTransaction[] = [];

export const initialNotifications: NotificationItem[] = [];
