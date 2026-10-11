/**
 * FarmerBoxs Commission Calculation Slabs (Exact Business Rules):
 * -------------------------------------------------------------
 * Eligible order amount          Commission
 * Below ₹1,500                   ₹50
 * ₹1,500 to below ₹2,000         ₹100
 * ₹2,000 to below ₹3,000         ₹150
 * ₹3,000 to below ₹4,000         ₹200
 * ₹4,000 to below ₹5,000         ₹250
 * ₹5,000 to ₹10,000 inclusive    ₹300
 * Above ₹10,000                  ₹500
 * -------------------------------------------------------------
 * Verified Examples:
 * - ₹1,200 order  -> ₹50
 * - ₹1,499 order  -> ₹50
 * - ₹1,500 order  -> ₹100
 * - ₹1,999 order  -> ₹100
 * - ₹2,000 order  -> ₹150
 * - ₹2,500 order  -> ₹150
 * - ₹2,999 order  -> ₹150
 * - ₹3,000 order  -> ₹200
 * - ₹3,999 order  -> ₹200
 * - ₹4,000 order  -> ₹250
 * - ₹4,999 order  -> ₹250
 * - ₹5,000 order  -> ₹300
 * - ₹6,000 order  -> ₹300
 * - ₹10,000 order -> ₹300
 * - ₹10,001 order -> ₹500
 */

export interface CommissionSlab {
  minAmount: number;
  maxAmount: number | null;
  inclusiveMax?: boolean;
  commission: number;
  label: string;
}

export const COMMISSION_SLABS: CommissionSlab[] = [
  { minAmount: 0, maxAmount: 1500, inclusiveMax: false, commission: 50, label: 'Below ₹1,500' },
  { minAmount: 1500, maxAmount: 2000, inclusiveMax: false, commission: 100, label: '₹1,500 to below ₹2,000' },
  { minAmount: 2000, maxAmount: 3000, inclusiveMax: false, commission: 150, label: '₹2,000 to below ₹3,000' },
  { minAmount: 3000, maxAmount: 4000, inclusiveMax: false, commission: 200, label: '₹3,000 to below ₹4,000' },
  { minAmount: 4000, maxAmount: 5000, inclusiveMax: false, commission: 250, label: '₹4,000 to below ₹5,000' },
  { minAmount: 5000, maxAmount: 10000, inclusiveMax: true, commission: 300, label: '₹5,000 to ₹10,000 inclusive' },
  { minAmount: 10000.01, maxAmount: null, inclusiveMax: false, commission: 500, label: 'Above ₹10,000' }
];

export const calculateCommission = (orderAmount: number): number => {
  const amt = Number(orderAmount) || 0;
  if (amt <= 0) return 0;
  if (amt < 1500) return 50;
  if (amt < 2000) return 100;
  if (amt < 3000) return 150;
  if (amt < 4000) return 200;
  if (amt < 5000) return 250;
  if (amt <= 10000) return 300;
  return 500;
};

export const getCommissionSlabLabel = (orderAmount: number): string => {
  const amt = Number(orderAmount) || 0;
  if (amt <= 0) return 'No eligible amount';
  if (amt < 1500) return 'Below ₹1,500 (₹50)';
  if (amt < 2000) return '₹1,500 - ₹1,999 (₹100)';
  if (amt < 3000) return '₹2,000 - ₹2,999 (₹150)';
  if (amt < 4000) return '₹3,000 - ₹3,999 (₹200)';
  if (amt < 5000) return '₹4,000 - ₹4,999 (₹250)';
  if (amt <= 10000) return '₹5,000 - ₹10,000 (₹300)';
  return 'Above ₹10,000 (₹500)';
};
