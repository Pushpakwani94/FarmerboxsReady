import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config';
import type { WalletTransaction, JoinerWallet } from '../../types';

export const WALLET_COLLECTION = 'wallets';
export const WALLET_TX_COLLECTION = 'walletTransactions';
export const WALLET_AUDIT_COLLECTION = 'walletAuditLogs';

/**
 * Returns date in YYYY-MM-DD formatted specifically for Asia/Kolkata timezone.
 */
export const getISTDateString = (dateInput?: any): string => {
  let date: Date;
  if (!dateInput) {
    date = new Date();
  } else if (dateInput?.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date();
  }

  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
};

/**
 * Returns month in YYYY-MM formatted specifically for Asia/Kolkata timezone.
 */
export const getISTMonthString = (dateInput?: any): string => {
  const d = getISTDateString(dateInput);
  return d ? d.slice(0, 7) : '';
};

export interface JoinerWalletState {
  walletBalance: number;
  totalCommissionEarned: number;
  todayCommission: number;
  monthlyCommission: number;
  eligibleDeliveredOrders: number;
  pendingCommission: number;
  transactions: WalletTransaction[];
}

export const walletService = {
  getISTDateString,
  getISTMonthString,

  /**
   * Real-time subscription to a Joiner's wallet balance and transactions.
   */
  subscribeWallet(
    joinerId: string,
    onUpdate: (state: JoinerWalletState) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured() || !db || !joinerId) {
      onUpdate({
        walletBalance: 0,
        totalCommissionEarned: 0,
        todayCommission: 0,
        monthlyCommission: 0,
        eligibleDeliveredOrders: 0,
        pendingCommission: 0,
        transactions: []
      });
      return () => {};
    }

    const cleanJoinerId = String(joinerId).trim();
    const cleanPhone = cleanJoinerId.replace(/\D/g, '').slice(-10);
    const altJoinerId = cleanPhone ? `usr_${cleanPhone}` : cleanJoinerId;

    try {
      const txColRef = collection(db, WALLET_TX_COLLECTION);
      const q = query(txColRef, orderBy('createdAt', 'desc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const todayIST = getISTDateString();
          const currentMonthIST = getISTMonthString();

          const allTx: WalletTransaction[] = [];
          let computedBalance = 0;
          let todayTotal = 0;
          let monthTotal = 0;
          let eligibleDelivered = 0;

          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const txJoinerId = String(data.joinerId || data.partnerId || '');
            const txCleanPhone = txJoinerId.replace(/\D/g, '').slice(-10);

            // Match joiner UID or Phone
            const isMatch =
              txJoinerId === cleanJoinerId ||
              txJoinerId === altJoinerId ||
              (cleanPhone && cleanPhone.length === 10 && txCleanPhone === cleanPhone);

            if (!isMatch) return;

            const txAmt = Number(data.commissionAmount ?? data.amount ?? 0);
            const isCredited = data.status === 'credited' || data.status === 'Success';
            const txDateIST = getISTDateString(data.createdAt);
            const txMonthIST = getISTMonthString(data.createdAt);

            const txObj: WalletTransaction = {
              id: docSnap.id,
              transactionId: data.transactionId || docSnap.id,
              joinerId: txJoinerId,
              partnerId: txJoinerId,
              partnerName: data.partnerName || '',
              orderId: String(data.orderId || ''),
              hotelId: String(data.hotelId || ''),
              hotelName: data.hotelName || '',
              type: data.type || data.transactionType || 'commission',
              transactionType: data.transactionType || data.type || 'commission',
              amount: txAmt,
              orderAmount: Number(data.orderAmount ?? 0),
              commissionAmount: txAmt,
              status: isCredited ? 'credited' : 'pending',
              description: data.description || `₹${txAmt} Commission for Order #${data.orderId}`,
              createdAt: data.createdAt
            };

            allTx.push(txObj);

            if (isCredited) {
              computedBalance += txAmt;
              eligibleDelivered += 1;
              if (txDateIST === todayIST) {
                todayTotal += txAmt;
              }
              if (txMonthIST === currentMonthIST) {
                monthTotal += txAmt;
              }
            }
          });

          onUpdate({
            walletBalance: computedBalance,
            totalCommissionEarned: computedBalance,
            todayCommission: todayTotal,
            monthlyCommission: monthTotal,
            eligibleDeliveredOrders: eligibleDelivered,
            pendingCommission: 0,
            transactions: allTx
          });
        },
        (err) => {
          console.error('walletService subscribeWallet error:', err);
          if (onError) onError(err);
        }
      );
    } catch (e: any) {
      console.error('walletService subscribeWallet exception:', e);
      if (onError) onError(e);
      return () => {};
    }
  },

  /**
   * Atomic ₹100 Wallet Commission Credit on Admin Delivery Approval.
   * Requirement 7 Rule: strictly greater than ₹1,500 (> 1500).
   * Generates a deterministic order transaction ID (tx_comm_<cleanOrderId>)
   * to guarantee that the same order can NEVER be credited more than once.
   */
  async creditOrderCommission(
    order: any,
    adminName: string = 'Super Admin'
  ): Promise<{ success: boolean; message: string; transactionId?: string; isBonusEligible: boolean }> {
    if (!isFirebaseConfigured() || !db) {
      return { success: false, message: 'Database not connected.', isBonusEligible: false };
    }

    const orderId = String(order.orderId || order.id || '').trim();
    const cleanOrderId = orderId.replace(/^#/, '');
    const totalAmt = Number(order.totalAmount ?? order.amount ?? order.grandTotal ?? 0);

    // Strict Rule: Amount must be STRICTLY GREATER than ₹1,500
    const isBonusEligible = totalAmt > 1500;

    const partnerId = String(order.assignedJoinerId || order.partnerId || order.joinerId || order.joinedBy || '');
    const cleanPhone = String(order.joinerPhone || order.mobileNumber || '').replace(/\D/g, '').slice(-10);
    const joinerDocId = partnerId.startsWith('usr_') ? partnerId : (cleanPhone ? `usr_${cleanPhone}` : partnerId);
    const hotelId = String(order.hotelId || order.customerId || '');
    const hotelName = String(order.hotelName || order.customerName || 'Hotel Partner');

    const deterministicTxId = `tx_comm_${cleanOrderId}`;

    try {
      const orderRef = doc(db, 'orders', orderId);
      const txRef = doc(db, WALLET_TX_COLLECTION, deterministicTxId);
      const walletRef = doc(db, WALLET_COLLECTION, joinerDocId);
      const joinerRef = doc(db, 'joiners', joinerDocId);

      // 1. Idempotency Check: Verify if commission already credited for this order
      const existingTxSnap = await getDoc(txRef);
      if (existingTxSnap.exists()) {
        return {
          success: true,
          message: `Order #${orderId} delivery was already approved. Commission previously released.`,
          transactionId: deterministicTxId,
          isBonusEligible: true
        };
      }

      // If order amount is <= 1500: No commission is credited
      if (!isBonusEligible) {
        await updateDoc(orderRef, {
          adminApproved: true,
          deliveryApprovedAt: serverTimestamp(),
          deliveredAt: order.deliveredAt || serverTimestamp(),
          status: 'Delivered',
          orderStatus: 'Delivered',
          commissionAmount: 0,
          commissionStatus: 'not_eligible',
          walletCredited: false,
          updatedAt: serverTimestamp()
        });

        return {
          success: true,
          message: `Delivery approved for Order #${orderId}. Order amount (₹${totalAmt.toLocaleString('en-IN')}) is ₹1,500 or below (not eligible for ₹100 bonus).`,
          isBonusEligible: false
        };
      }

      // 2. Atomic Batch Update: Order + Transaction + Wallet + Joiner
      const batch = writeBatch(db);

      // Order Update
      batch.update(orderRef, {
        adminApproved: true,
        adminApprovedAt: serverTimestamp(),
        deliveryApprovedAt: serverTimestamp(),
        deliveredAt: order.deliveredAt || serverTimestamp(),
        status: 'Delivered',
        orderStatus: 'Delivered',
        commissionAmount: 100,
        commissionStatus: 'credited',
        walletCredited: true,
        updatedAt: serverTimestamp()
      });

      // Wallet Transaction
      const walletTx: WalletTransaction = {
        transactionId: deterministicTxId,
        id: deterministicTxId,
        joinerId: joinerDocId,
        partnerId: joinerDocId,
        partnerName: String(order.partnerName || order.joiner || 'Hotel Joiner'),
        orderId: cleanOrderId,
        hotelId,
        hotelName,
        orderAmount: totalAmt,
        commissionAmount: 100,
        amount: 100,
        type: 'commission',
        transactionType: 'commission',
        status: 'credited',
        description: `₹100 Commission for Order #${cleanOrderId} (${hotelName})`,
        createdAt: serverTimestamp()
      };
      batch.set(txRef, walletTx);

      // Dedicated Wallets Collection Doc
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        const cur = walletSnap.data();
        batch.update(walletRef, {
          walletBalance: Number(cur.walletBalance || 0) + 100,
          totalCommission: Number(cur.totalCommission || 0) + 100,
          updatedAt: serverTimestamp()
        });
      } else {
        batch.set(walletRef, {
          joinerId: joinerDocId,
          walletBalance: 100,
          totalCommission: 100,
          updatedAt: serverTimestamp()
        });
      }

      // Joiners Collection Mirror
      const jSnap = await getDoc(joinerRef);
      if (jSnap.exists()) {
        const jData = jSnap.data();
        batch.update(joinerRef, {
          walletBalance: Number(jData.walletBalance || 0) + 100,
          totalEarnings: Number(jData.totalEarnings || jData.commissionEarned || 0) + 100,
          commissionEarned: Number(jData.commissionEarned || jData.totalEarnings || 0) + 100,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      return {
        success: true,
        message: `Delivery approved for Order #${orderId}! ₹100 commission successfully credited to wallet.`,
        transactionId: deterministicTxId,
        isBonusEligible: true
      };
    } catch (err: any) {
      console.error('walletService.creditOrderCommission error:', err);
      return { success: false, message: err?.message || 'Failed to process commission.', isBonusEligible };
    }
  },

  /**
   * Authorized Admin Manual Adjustment with mandatory reason and audit log.
   */
  async manualAdjustment(
    joinerId: string,
    amount: number,
    reason: string,
    adminName: string = 'Super Admin'
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    if (!isFirebaseConfigured() || !db) {
      return { success: false, message: 'Database not connected.' };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'A valid mandatory reason (minimum 5 characters) is required for wallet adjustments.' };
    }

    const cleanJoinerId = String(joinerId).trim();
    const txId = `tx_adj_${Date.now()}`;

    try {
      const batch = writeBatch(db);
      const txRef = doc(db, WALLET_TX_COLLECTION, txId);
      const auditRef = doc(db, WALLET_AUDIT_COLLECTION, `audit_${Date.now()}`);
      const walletRef = doc(db, WALLET_COLLECTION, cleanJoinerId);
      const joinerRef = doc(db, 'joiners', cleanJoinerId);

      const walletSnap = await getDoc(walletRef);
      const prevBal = walletSnap.exists() ? Number(walletSnap.data().walletBalance || 0) : 0;
      const newBal = Math.max(0, prevBal + amount);

      batch.set(txRef, {
        transactionId: txId,
        id: txId,
        joinerId: cleanJoinerId,
        partnerId: cleanJoinerId,
        partnerName: 'Joiner Partner',
        orderId: 'MANUAL_ADJUSTMENT',
        orderAmount: 0,
        commissionAmount: amount,
        amount,
        type: 'adjustment',
        transactionType: 'adjustment',
        status: 'credited',
        description: `Admin Adjustment (${reason}) by ${adminName}`,
        createdAt: serverTimestamp()
      });

      batch.set(auditRef, {
        id: auditRef.id,
        joinerId: cleanJoinerId,
        amount,
        previousBalance: prevBal,
        newBalance: newBal,
        reason,
        adjustedBy: adminName,
        createdAt: serverTimestamp()
      });

      if (walletSnap.exists()) {
        batch.update(walletRef, { walletBalance: newBal, updatedAt: serverTimestamp() });
      } else {
        batch.set(walletRef, { joinerId: cleanJoinerId, walletBalance: newBal, updatedAt: serverTimestamp() });
      }

      const jSnap = await getDoc(joinerRef);
      if (jSnap.exists()) {
        batch.update(joinerRef, { walletBalance: newBal, updatedAt: serverTimestamp() });
      }

      await batch.commit();
      return { success: true, message: `Wallet adjusted successfully by ₹${amount}. New balance: ₹${newBal}.`, transactionId: txId };
    } catch (e: any) {
      console.error('walletService.manualAdjustment error:', e);
      return { success: false, message: e?.message || 'Failed to adjust wallet.' };
    }
  }
};
