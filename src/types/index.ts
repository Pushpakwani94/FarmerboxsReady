export type OrderStatus = 'Delivered' | 'Out for Delivery' | 'Preparing' | 'Confirmed' | 'Pending' | 'Cancelled';
export const OrderStatus = {
  Delivered: 'Delivered',
  OutForDelivery: 'Out for Delivery',
  Preparing: 'Preparing',
  Confirmed: 'Confirmed',
  Pending: 'Pending',
  Cancelled: 'Cancelled'
} as const;

export interface OrderItem {
  id: number;
  productName: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
}

export interface Order {
  id: string; // e.g., FB1001
  orderId?: string;
  hotelId?: string | number;
  date: string;
  time: string;
  hotelName: string;
  hotelImage?: string;
  hotelOwner?: string;
  hotelPhone?: string;
  zone: string;
  joiner: string;
  joinerId?: string | number;
  joinedBy?: string;
  joinerPhone?: string;
  amount: number;
  totalAmount?: number;
  paymentMode: 'Online' | 'COD' | 'Wallet';
  paymentMethod?: string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  transactionId?: string;
  driver: string;
  driverPhone?: string;
  driverId?: string | number;
  walletCredited?: boolean;
  deliveryAddress?: string;
  deliveryPartnerId?: string | number;
  status: OrderStatus;
  orderStatus?: OrderStatus;
  commission: number;
  items?: OrderItem[];
  subtotal?: number;
  deliveryCharge?: number;
  discount?: number;
  addedBy?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Zone {
  id: number;
  name: string;
  areaLocations: string;
  joinersCount: number;
  hotelsCount: number;
  ordersThisMonth: number;
  salesThisMonth: number;
  status: 'Active' | 'Inactive';
  color?: string;
  addedBy?: string;
  createdBy?: string;
  assignedJoinersList?: { name: string; hotelsCount: number; phone: string; status: 'Active' | 'Inactive' }[];
}

export interface AssignedHotel {
  id?: number | string;
  name: string;
  location: string;
  owner?: string;
  phone?: string;
  orders?: number;
  joinedDate?: string;
  status: 'Active' | 'Inactive';
}

export interface Joiner {
  id: number | string;
  joinerCode: string;
  name: string;
  mobile: string;
  phone?: string;
  email: string;
  zone: string;
  totalHotels: number;
  hotelsCount?: number;
  totalOrders: number;
  activeOrdersToday?: number;
  totalEarnings: number;
  commissionEarned?: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Active' | 'Inactive';
  avatar: string;
  joinedDate: string;
  addedBy?: string;
  createdBy?: string;
  assignedHotelsList?: AssignedHotel[];
  performanceHistory?: { month: string; orders: number }[];
}

export const AssignedHotel = {} as unknown as AssignedHotel;

export interface Driver {
  id: number;
  name: string;
  mobile: string;
  phone?: string;
  zone: string;
  vehicleNo: string;
  vehicleNumber?: string;
  vehicleType?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  totalDeliveries: number;
  assignedOrdersCount?: number;
  rating: number;
  avatar: string;
  email?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  vehicleModel?: string;
  joiningDate?: string;
  completedToday?: number;
  activeDeliveries?: number;
  onTimeRate?: string;
  addedBy?: string;
  createdBy?: string;
  recentOrders?: {
    id: string;
    hotelName: string;
    zone: string;
    time: string;
    status: 'Delivered' | 'In Transit' | 'Assigned';
    amount: number;
  }[];
}

export interface Hotel {
  id: number;
  name: string;
  ownerName: string;
  contactPerson?: string;
  mobile: string;
  phone?: string;
  email: string;
  zone: string;
  joiner: string;
  assignedJoiner?: string;
  joinedBy?: string;
  joinerId?: string;
  addedBy?: string;
  createdBy?: string;
  address: string;
  totalOrders: number;
  orders?: number;
  dailyOrderKg?: number;
  type?: string;
  totalSpent: number;
  registrationDate: string;
  joinedDate?: string;
  gstNumber: string;
  fssaiNumber: string;
  rating: number;
  status: 'Active' | 'Inactive';
  image: string;
  orderHistory?: { id: string; date: string; amount: number; status: OrderStatus }[];
}

export type CatalogType = 'B2C' | 'B2B' | 'Both';

export interface Product {
  id: number;
  image: string;
  imageUrl?: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  price?: number;
  b2bPrice?: number;
  b2cPrice?: number;
  catalogType?: CatalogType;
  targetCatalog?: CatalogType;
  minOrderQty?: number;
  stock: number;
  minimumStock: number;
  status: 'Active' | 'Low Stock' | 'Out of Stock';
  isImported?: boolean;
  originCountry?: string;
  countryFlag?: string;
  addedOn?: string;
  addedBy?: string;
  createdBy?: string;
  description?: string;
  images?: string[];
  stockHistory?: { date: string; type: 'Stock In' | 'Stock Out'; qty: string; ref: string; user: string }[];
}

export interface PaymentTransaction {
  id: number;
  dateTime: string;
  referenceId: string;
  type: 'Order Payment' | 'COD Payment' | 'Joiner Commission' | 'Driver Payout' | 'Refund';
  fromTo: string;
  orderId: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Refunded';
  paymentMode: string;
}

export interface NotificationItem {
  id: number | string;
  title: string;
  message?: string;
  subtitle?: string;
  userType?: 'Hotels' | 'Drivers' | 'Joiners' | 'Admins' | 'All Users' | string;
  status?: 'Sent' | 'Scheduled' | 'Failed' | string;
  dateTime?: string;
  read?: boolean;
  time?: string;
  category?: string;
  iconType?: string;
  notificationType?: 'Alert' | 'Order' | 'Commission' | 'AppUpdate';
  isAppUpdate?: boolean;
  hasUpdateFile?: boolean;
  fileName?: string;
  fileUrl?: string;
  version?: string;
}

// Runtime exports for Vite ES module safety
export const Zone = {} as unknown as Zone;
export const Joiner = {} as unknown as Joiner;
export const Driver = {} as unknown as Driver;
export const Hotel = {} as unknown as Hotel;
export const Product = {} as unknown as Product;
export const PaymentTransaction = {} as unknown as PaymentTransaction;
export const NotificationItem = {} as unknown as NotificationItem;
