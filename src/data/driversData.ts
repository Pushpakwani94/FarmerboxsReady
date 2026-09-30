import type { Driver } from '../types';

export interface DriverDetail extends Driver {
  email?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  vehicleModel?: string;
  joiningDate?: string;
  completedToday?: number;
  activeDeliveries?: number;
  onTimeRate?: string;
  recentOrders?: {
    id: string;
    hotelName: string;
    zone: string;
    time: string;
    status: 'Delivered' | 'In Transit' | 'Assigned';
    amount: number;
  }[];
}

export const initialDriversList: DriverDetail[] = [];

export const zoneWiseDriverStats: { zone: string; total: number; active: number; inactive: number }[] = [];
