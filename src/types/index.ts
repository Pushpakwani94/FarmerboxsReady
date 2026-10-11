export type OrderStatus = 'Delivered' | 'Out for Delivery' | 'Preparing' | 'Confirmed' | 'Accepted' | 'Pending' | 'Cancelled' | 'Rejected';
export const OrderStatus = {
  Delivered: 'Delivered',
  OutForDelivery: 'Out for Delivery',
  Preparing: 'Preparing',
  Confirmed: 'Confirmed',
  Accepted: 'Accepted',
  Pending: 'Pending',
  Cancelled: 'Cancelled',
  Rejected: 'Rejected'
} as const;

export interface OrderItem {
  id?: number | string;
  productId?: number | string;
  productName: string;
  name?: string;
  qty?: number;
  quantity?: number;
  unit: string;
  price: number;
  total: number;
  image?: string;
  category?: string;
  isImported?: boolean;
  originCountry?: string;
}

export interface WalletTransaction {
  id?: string | number;
  transactionId: string;
  partnerId?: string | number;
  partnerName?: string;
  joinerId?: string;
  orderId: string;
  hotelId?: string;
  hotelName?: string;
  type?: 'commission' | 'bonus' | 'withdrawal' | 'deposit' | 'adjustment';
  transactionType?: 'commission' | 'bonus' | 'withdrawal' | 'deposit' | 'adjustment';
  amount: number;
  orderAmount?: number;
  commissionAmount?: number;
  status: 'credited' | 'pending' | 'debited' | 'Success' | 'Failed';
  description?: string;
  createdAt: any;
}

export interface JoinerWallet {
  joinerId: string;
  walletBalance: number;
  totalCommission?: number;
  updatedAt?: any;
}

export interface HotelReassignmentAuditLog {
  id: string;
  hotelId: string;
  hotelName: string;
  previousJoinerId: string;
  previousJoinerName: string;
  newJoinerId: string;
  newJoinerName: string;
  reassignedBy: string;
  reason: string;
  createdAt: any;
}

export interface Order {
  id: string; // e.g., FB-20261009-000001 or FB1001
  orderId: string; // Central unique order ID

  // Customer / Hotel Info
  customerId?: string | number;
  customerName?: string;
  hotelId: string | number;
  hotelName: string;
  hotelImage?: string;
  hotelOwner?: string;
  hotelPhone?: string;
  mobileNumber?: string;
  deliveryAddress?: string;

  // Partner / Joiner Info
  assignedJoinerId?: string;
  partnerId?: string | number;
  partnerName?: string;
  joiner: string;
  joinerId?: string | number;
  joinedBy?: string;
  joinerPhone?: string;

  // Zone Info
  zoneId?: string | number;
  zoneName?: string;
  zone: string;
  hotelZone?: string;

  // Source & Metadata
  orderSource?: 'mobile' | 'web' | 'joiner_app' | 'customer_app' | string;
  idempotencyKey?: string;
  clientOrderId?: string; // Idempotency key
  date: string;
  time: string;
  timeSlot?: string;

  // Line items
  items: OrderItem[];

  // Financial Breakdown
  amount: number;
  totalAmount: number;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;

  // Payment
  paymentMode: 'Online' | 'COD' | 'Wallet' | string;
  paymentMethod?: 'Online' | 'COD' | 'Wallet' | string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded' | 'Failed' | 'paid' | 'pending' | 'failed' | string;
  transactionId?: string;

  // Delivery & Dispatch
  driver: string;
  driverPhone?: string;
  driverId?: string | number;
  deliveryPartnerId?: string | number | null;
  deliveryPartnerName?: string | null;

  // Order Lifecycle Status
  status: OrderStatus;
  orderStatus: OrderStatus;

  // Delivery Verification & Admin Approval
  adminApproved: boolean;
  adminApprovedAt?: any;
  deliveryApprovedAt?: any;
  deliveredAt?: any;
  rejectionReason?: string;

  // Partner Commission & Wallet
  commission: number;
  commissionAmount: number;
  commissionStatus: 'pending' | 'credited' | 'rejected' | 'not_eligible' | string;
  walletCredited?: boolean;

  // Audit
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
  uid?: string;
  joinerCode: string;
  name: string;
  mobile: string;
  phone?: string;
  email: string;
  password?: string;
  dummyPassword?: string;
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
  walletBalance?: number;
  upiId?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
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
  id: number | string;
  hotelId: string | number;
  hotelName?: string;
  name: string;
  ownerName: string;
  contactPerson?: string;
  mobile: string;
  phone?: string;
  normalizedPhone?: string;
  email: string;
  zone: string;
  assignedJoinerId?: string;
  joiner: string;
  assignedJoiner?: string;
  joinedBy?: string;
  joinerId?: string;
  joinerPhone?: string;
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
  createdAt?: any;
  updatedAt?: any;
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
  qualityGrade?: string;
  farmOrigin?: string;
  isOrganic?: boolean;
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
export const Order = {} as unknown as Order;
export const WalletTransaction = {} as unknown as WalletTransaction;
export const Zone = {} as unknown as Zone;
export const Joiner = {} as unknown as Joiner;
export const Driver = {} as unknown as Driver;
export const Hotel = {} as unknown as Hotel;
export const Product = {} as unknown as Product;
export const PaymentTransaction = {} as unknown as PaymentTransaction;
export const NotificationItem = {} as unknown as NotificationItem;
