export interface JoinerCommissionRecord {
  id: number | string;
  name: string;
  mobile: string;
  zone: string;
  totalOrders: number;
  completedOrders?: number;
  deliveredOrders: number;
  pendingOrders?: number;
  commissionRate: number; // default 100
  commission: number; // cumulative non-decreasing commission
  paidAmount: number;
  pendingAmount: number;
  status: 'Paid' | 'Pending';
  avatar: string;
  upiId: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  walletBalance: number;
  recentTransactions: CommissionTransaction[];
}

export interface CommissionTransaction {
  id: string;
  date: string;
  orderId: string;
  hotelName?: string;
  amount: number;
  status: 'Paid' | 'Pending';
  paymentMode?: string;
  utr?: string;
}

export interface PayoutRequest {
  id: string;
  joinerId: number | string;
  joinerName: string;
  mobile: string;
  zone: string;
  amount: number;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentMethod: 'UPI' | 'Bank Transfer';
  upiOrAccount: string;
}

export const initialCommissionList: JoinerCommissionRecord[] = [];

export const initialPayoutRequests: PayoutRequest[] = [];

export const initialPaymentHistory: {
  id: string;
  date: string;
  joinerName: string;
  mobile: string;
  zone: string;
  amount: number;
  mode: string;
  utr: string;
  status: string;
}[] = [];
