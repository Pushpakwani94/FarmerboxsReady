import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config';
import type { Order, OrderStatus, WalletTransaction, OrderItem } from '../../types';
import { walletService } from './walletService';

const COLLECTION = 'orders';
const WALLET_TX_COLLECTION = 'walletTransactions';

/**
 * Generates a standard central FarmerBox order ID.
 * Format: FB-YYYYMMDD-XXXXXX
 * Example: FB-20261009-000001
 */
export const generateOrderId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randNum = String(Math.floor(100000 + Math.random() * 900000));
  return `FB-${year}${month}${day}-${randNum}`;
};

/**
 * Normalizes raw Firestore document data into standard Order model.
 */
export const normalizeOrder = (data: any, fallbackId?: string): Order => {
  const rawId = String(data.orderId || data.id || fallbackId || generateOrderId());
  const formattedId = rawId.startsWith('#') ? rawId : rawId;

  const rawItems: any[] = Array.isArray(data.items) ? data.items : [];
  const normalizedItems: OrderItem[] = rawItems.map((it: any, idx: number) => {
    const pName = it.productName || it.name || `Produce Item ${idx + 1}`;
    const pQty = Number(it.qty ?? it.quantity ?? 1);
    const pPrice = Number(it.price ?? 0);
    const pTotal = Number(it.total ?? (pQty * pPrice));
    return {
      id: it.id || it.productId || idx + 1,
      productId: it.productId || it.id || `PROD_${idx + 1}`,
      productName: pName,
      name: pName,
      qty: pQty,
      quantity: pQty,
      unit: it.unit || 'kg',
      price: pPrice,
      total: pTotal,
      image: it.image || it.imageUrl,
      category: it.category,
      isImported: it.isImported,
      originCountry: it.originCountry
    };
  });

  const subtotal = Number(data.subtotal ?? data.amount ?? data.totalAmount ?? 0);
  const deliveryCharge = Number(data.deliveryCharge ?? 0);
  const discount = Number(data.discount ?? 0);
  const grandTotal = Number(data.grandTotal ?? data.totalAmount ?? (subtotal + deliveryCharge - discount));

  const statusVal = (data.status || data.orderStatus || 'Pending') as OrderStatus;
  const paymentStatusVal = (data.paymentStatus || 'Pending');

  return {
    id: formattedId,
    orderId: formattedId,

    // Customer / Hotel
    customerId: data.customerId || data.hotelId || '',
    customerName: data.customerName || data.hotelName || 'Partner Hotel',
    hotelId: data.hotelId || data.customerId || '',
    hotelName: data.hotelName || data.customerName || 'Partner Hotel',
    hotelImage: data.hotelImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
    hotelOwner: data.hotelOwner || data.contactPerson || data.customerName || '',
    hotelPhone: data.hotelPhone || data.mobileNumber || data.phone || data.mobile || '',
    mobileNumber: data.mobileNumber || data.hotelPhone || data.phone || data.mobile || '',
    deliveryAddress: data.deliveryAddress || `${data.zoneName || data.zone || 'Kharadi'}, Pune`,

    // Partner / Joiner
    assignedJoinerId: data.assignedJoinerId || data.partnerId || data.joinerId || data.joinedBy || '',
    partnerId: data.partnerId || data.assignedJoinerId || data.joinerId || data.joinedBy || '',
    partnerName: data.partnerName || data.joiner || data.assignedJoiner || '',
    joiner: data.joiner || data.partnerName || data.assignedJoiner || 'Direct Partner',
    joinerId: data.joinerId || data.assignedJoinerId || data.partnerId || data.joinedBy || '',
    joinedBy: data.joinedBy || data.assignedJoinerId || data.joinerId || data.partnerId || '',
    joinerPhone: data.joinerPhone || data.partnerPhone || '',

    // Zone
    zoneId: data.zoneId || (data.zone ? `ZONE_${String(data.zone).toUpperCase().replace(/\s+/g, '_')}` : 'ZONE_001'),
    zoneName: data.zoneName || data.zone || data.hotelZone || 'Kharadi',
    zone: data.zone || data.zoneName || data.hotelZone || 'Kharadi',
    hotelZone: data.hotelZone || data.zoneName || data.zone || 'Kharadi',

    // Source & Tracking
    orderSource: data.orderSource || 'mobile',
    clientOrderId: data.clientOrderId,
    idempotencyKey: data.idempotencyKey || data.clientOrderId || formattedId,
    date: data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timeSlot: data.timeSlot || '8 AM - 10 AM',

    // Line items & Financials
    items: normalizedItems,
    amount: grandTotal,
    totalAmount: grandTotal,
    subtotal: subtotal > 0 ? subtotal : grandTotal,
    deliveryCharge,
    discount,
    grandTotal,

    // Payment
    paymentMode: data.paymentMode || data.paymentMethod || 'Online',
    paymentMethod: data.paymentMethod || data.paymentMode || 'Online',
    paymentStatus: paymentStatusVal,
    transactionId: data.transactionId,

    // Delivery & Driver
    driver: data.driver || data.deliveryPartnerName || 'Not Assigned',
    driverPhone: data.driverPhone,
    driverId: data.driverId || data.deliveryPartnerId,
    deliveryPartnerId: data.deliveryPartnerId || data.driverId || null,
    deliveryPartnerName: data.deliveryPartnerName || data.driver || null,

    // Status & Approval
    status: statusVal,
    orderStatus: statusVal,
    adminApproved: Boolean(data.adminApproved),
    adminApprovedAt: data.adminApprovedAt,
    deliveryApprovedAt: data.deliveryApprovedAt || data.adminApprovedAt || null,
    deliveredAt: data.deliveredAt,
    rejectionReason: data.rejectionReason,

    // Commission
    commission: Number(data.commissionAmount ?? data.commission ?? 100),
    commissionAmount: Number(data.commissionAmount ?? (data.adminApproved ? 100 : 0)),
    commissionStatus: data.commissionStatus || (data.adminApproved ? 'credited' : 'pending'),
    walletCredited: Boolean(data.walletCredited || data.commissionStatus === 'credited'),

    // Audit
    addedBy: data.addedBy || 'Mobile App',
    createdBy: data.createdBy || data.partnerName || 'Field Agent',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
};

export const orderService = {
  generateOrderId,
  normalizeOrder,

  /**
   * Real-time subscription to centralized orders in Firestore for Admin Panel.
   * Receives all orders across all zones immediately as they are created.
   */
  subscribe(onUpdate: (orders: Order[]) => void, onError?: (error: Error) => void): Unsubscribe {
    if (!isFirebaseConfigured() || !db) {
      if (onError) onError(new Error('Firebase Firestore is not configured.'));
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, COLLECTION);
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            onUpdate([]);
            return;
          }

          const map = new Map<string, Order>();
          snapshot.forEach((d) => {
            const ord = normalizeOrder(d.data(), d.id);
            const rawId = String(ord.orderId || ord.id || d.id);
            const cleanKey = rawId.replace(/^#/, '');
            if (cleanKey && !map.has(cleanKey)) {
              map.set(cleanKey, ord);
            }
          });

          const orders = Array.from(map.values());

          // Sort latest created first
          orders.sort((a, b) => {
            const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt || a.date || 0).getTime();
            const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt || b.date || 0).getTime();
            return (timeB || 0) - (timeA || 0);
          });

          onUpdate(orders);
        },
        (error) => {
          console.error('orderService snapshot error:', error);
          if (onError) onError(error);
          onUpdate([]);
        }
      );
    } catch (err: any) {
      console.error('orderService subscribe exception:', err);
      if (onError) onError(err);
      onUpdate([]);
      return () => {};
    }
  },

  /**
   * Real-time subscription for a specific zone.
   */
  subscribeForZone(zoneIdOrName: string, onUpdate: (orders: Order[]) => void, onError?: (error: Error) => void): Unsubscribe {
    if (!isFirebaseConfigured() || !db) {
      if (onError) onError(new Error('Firebase Firestore is not configured.'));
      onUpdate([]);
      return () => {};
    }

    const cleanZone = zoneIdOrName.trim().toLowerCase().replace(' zone', '');
    return this.subscribe(
      (allOrders) => {
        if (!cleanZone || cleanZone === 'all' || cleanZone === 'all zones (hq)') {
          onUpdate(allOrders);
        } else {
          const filtered = allOrders.filter(o => {
            const zName = (o.zoneName || o.zone || '').toLowerCase().replace(' zone', '');
            const zId = String(o.zoneId || '').toLowerCase();
            return zName === cleanZone || zName.includes(cleanZone) || zId === cleanZone;
          });
          onUpdate(filtered);
        }
      },
      onError
    );
  },

  /**
   * Real-time subscription for a specific mobile partner/joiner.
   */
  subscribeForJoiner(
    joinerOrUid: string | { uid: string; name?: string; zone?: string; phone?: string },
    onUpdate: (orders: Order[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured() || !db) {
      if (onError) onError(new Error('Firebase Firestore is not configured.'));
      onUpdate([]);
      return () => {};
    }

    const uid = typeof joinerOrUid === 'string' ? joinerOrUid : (joinerOrUid?.uid || '');
    const cleanUid = uid.replace(/[^0-9]/g, '').slice(-10);
    const phone = typeof joinerOrUid === 'object' ? (joinerOrUid?.phone || '').replace(/[^0-9]/g, '').slice(-10) : '';

    return this.subscribe(
      (allOrders) => {
        const filtered = allOrders.filter(o => {
          const assignedJoinerId = String(o.assignedJoinerId || o.partnerId || o.joinerId || o.joinedBy || '');
          const cleanAssignedId = assignedJoinerId.replace(/[^0-9]/g, '').slice(-10);
          const orderPhone = String(o.joinerPhone || '').replace(/[^0-9]/g, '').slice(-10);

          // Strictly match assigned joiner ID or verified phone
          const isAssigned = Boolean(
            (uid && (assignedJoinerId === uid || cleanAssignedId === cleanUid || (cleanUid && cleanUid.length >= 6 && assignedJoinerId.includes(cleanUid)))) ||
            (phone && phone.length === 10 && (cleanAssignedId === phone || orderPhone === phone || assignedJoinerId.includes(phone)))
          );

          return isAssigned;
        });
        onUpdate(filtered);
      },
      onError
    );
  },

  async getAll(): Promise<Order[]> {
    if (!isFirebaseConfigured() || !db) return [];
    try {
      const colRef = collection(db, COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => normalizeOrder(d.data(), d.id));
    } catch (e) {
      console.error('orderService.getAll error:', e);
      return [];
    }
  },

  async getById(orderId: string): Promise<Order | null> {
    if (!isFirebaseConfigured() || !db) return null;
    try {
      const docRef = doc(db, COLLECTION, orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return normalizeOrder(snap.data(), snap.id);
    } catch (e) {
      console.error(`orderService.getById(${orderId}) error:`, e);
      return null;
    }
  },

  /**
   * Centralized Order Creation.
   * Every order is stored directly in Firestore `orders` collection.
   * Supports duplicate protection via clientOrderId and doc ID.
   */
  async add(orderData: Partial<Order>): Promise<string> {
    const finalOrderId = orderData.orderId || orderData.id || generateOrderId();
    const docId = finalOrderId;
    const idempotencyKey = orderData.idempotencyKey || orderData.clientOrderId || finalOrderId;

    // Idempotency: Check if order with this ID already exists or matching idempotencyKey
    if (isFirebaseConfigured() && db) {
      try {
        const existingSnap = await getDoc(doc(db, COLLECTION, docId));
        if (existingSnap.exists()) {
          console.warn(`Order ${docId} already exists in Firestore. Preventing duplicate write.`);
          return docId;
        }

        if (idempotencyKey) {
          const qIdemp = query(collection(db, COLLECTION), where('idempotencyKey', '==', idempotencyKey));
          const idempSnap = await getDocs(qIdemp);
          if (!idempSnap.empty) {
            const existing = idempSnap.docs[0].data();
            const existingId = existing.orderId || idempSnap.docs[0].id;
            console.warn(`Order with idempotencyKey ${idempotencyKey} already exists (${existingId}). Preventing duplicate.`);
            return existingId;
          }
        }
      } catch (checkErr) {
        console.warn('Idempotency check warning:', checkErr);
      }
    }

    const calculatedSubtotal = Number(
      orderData.subtotal ??
      orderData.amount ??
      orderData.totalAmount ??
      (Array.isArray(orderData.items) ? orderData.items.reduce((s, i) => s + Number(i.total || (i.price * (i.quantity || i.qty || 1))), 0) : 0)
    );
    const deliveryCharge = Number(orderData.deliveryCharge ?? 0);
    const discount = Number(orderData.discount ?? 0);
    const grandTotal = Number(orderData.grandTotal ?? orderData.amount ?? orderData.totalAmount ?? (calculatedSubtotal + deliveryCharge - discount));

    const zoneNameVal = orderData.zoneName || orderData.zone || orderData.hotelZone || 'Kharadi';
    const zoneIdVal = orderData.zoneId || `ZONE_${zoneNameVal.toUpperCase().replace(/\s+/g, '_')}`;

    const assignedJoinerIdVal = orderData.assignedJoinerId || orderData.partnerId || orderData.joinerId || orderData.joinedBy || '';

    const newOrderRecord: any = {
      orderId: finalOrderId,
      id: finalOrderId,
      idempotencyKey,

      customerId: orderData.customerId || orderData.hotelId || 'CUSTOMER_001',
      customerName: orderData.customerName || orderData.hotelName || 'ABC Hotel',

      assignedJoinerId: assignedJoinerIdVal,
      partnerId: assignedJoinerIdVal || 'PARTNER_001',
      partnerName: orderData.partnerName || orderData.joiner || 'Rahul Patil',

      mobileNumber: orderData.mobileNumber || orderData.hotelPhone || '9876543210',

      zoneId: zoneIdVal,
      zoneName: zoneNameVal,

      orderSource: orderData.orderSource || 'mobile',
      clientOrderId: orderData.clientOrderId || finalOrderId,

      date: orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: orderData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeSlot: orderData.timeSlot || '8 AM - 10 AM',

      items: Array.isArray(orderData.items) ? orderData.items.map((it: any, idx: number) => ({
        productId: it.productId || it.id || `PROD_${idx + 1}`,
        productName: it.productName || it.name || 'Produce Item',
        quantity: Number(it.quantity || it.qty || 1),
        unit: it.unit || 'kg',
        price: Number(it.price || 0),
        total: Number(it.total || ((it.price || 0) * (it.quantity || it.qty || 1))),
        image: it.image || it.imageUrl
      })) : [],

      subtotal: calculatedSubtotal,
      deliveryCharge,
      discount,
      grandTotal,
      amount: grandTotal,
      totalAmount: grandTotal,

      paymentMethod: orderData.paymentMethod || orderData.paymentMode || 'COD',
      paymentMode: orderData.paymentMode || orderData.paymentMethod || 'COD',
      paymentStatus: orderData.paymentStatus || 'pending',

      orderStatus: orderData.orderStatus || orderData.status || 'pending',
      status: orderData.status || orderData.orderStatus || 'Pending',

      deliveryPartnerId: orderData.deliveryPartnerId || null,
      deliveryPartnerName: orderData.deliveryPartnerName || orderData.driver || null,
      driver: orderData.driver || orderData.deliveryPartnerName || 'Unassigned',
      driverPhone: orderData.driverPhone || '',

      adminApproved: false,
      adminApprovedAt: null,
      deliveredAt: null,

      commissionAmount: 0,
      commissionStatus: 'pending',
      walletCredited: false,

      hotelId: orderData.hotelId || orderData.customerId || 'CUSTOMER_001',
      hotelName: orderData.hotelName || orderData.customerName || 'ABC Hotel',
      hotelImage: orderData.hotelImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100',
      hotelZone: zoneNameVal,
      zone: zoneNameVal,
      joiner: orderData.joiner || orderData.partnerName || 'Rahul Patil',
      joinerId: assignedJoinerIdVal || 'PARTNER_001',
      joinedBy: assignedJoinerIdVal || 'PARTNER_001',
      joinerPhone: orderData.joinerPhone || orderData.mobileNumber || '',

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, docId);
      await setDoc(docRef, newOrderRecord, { merge: true });

      // Verify Firestore write succeeded
      const verifySnap = await getDoc(docRef);
      if (!verifySnap.exists()) {
        throw new Error(`Failed to verify order ${docId} persistence in Firestore.`);
      }
    }

    return finalOrderId;
  },

  /**
   * Updates general order status.
   * When status is updated to 'Delivered', automatically triggers commission credit.
   */
  async updateStatus(orderId: string, status: OrderStatus, fallbackOrder?: any): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const cleanId = String(orderId).trim();
      const docRef = doc(db, COLLECTION, cleanId);
      const updates: any = {
        status,
        orderStatus: status,
        updatedAt: serverTimestamp()
      };
      if (status === 'Delivered') {
        updates.deliveredAt = serverTimestamp();
      }
      try {
        await updateDoc(docRef, updates);
      } catch (e) {
        console.warn(`Notice updating status in firestore for order ${cleanId}:`, e);
      }

      // AUTOMATIC COMMISSION UPDATE ONCE DELIVERY DONE
      if (status === 'Delivered') {
        try {
          await this.approveDelivery(cleanId, 'Super Admin / Delivery Done', fallbackOrder);
        } catch (err) {
          console.warn('Auto commission credit error on updateStatus Delivered:', err);
        }
      }
    } else if (status === 'Delivered' && fallbackOrder) {
      // Local or offline fallback
      try {
        await walletService.creditOrderCommission(fallbackOrder, 'Super Admin / Delivery Done');
      } catch (err) {
        console.warn('Auto commission credit error in offline fallback:', err);
      }
    }
  },

  /**
   * Assigns a delivery driver to an order.
   */
  async assignDriver(
    orderId: string,
    driverId: string | number,
    driverName: string,
    driverPhone?: string,
    newStatus: OrderStatus = 'Out for Delivery'
  ): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, orderId);
      await updateDoc(docRef, {
        deliveryPartnerId: String(driverId),
        deliveryPartnerName: driverName,
        driver: driverName,
        driverId: String(driverId),
        driverPhone: driverPhone || '',
        status: newStatus,
        orderStatus: newStatus,
        updatedAt: serverTimestamp()
      });
    }
  },

  /**
   * Admin Delivery Verification & Commission Release.
   * Atomically verifies that delivery is approved ONLY ONCE.
   * Strictly enforces Requirement 7:
   * Order total > ₹1,500 credits ₹100 commission.
   * Order total <= ₹1,500 receives ₹0 commission.
   */
  async approveDelivery(
    orderId: string,
    adminName: string = 'Super Admin',
    fallbackOrder?: any
  ): Promise<{ success: boolean; message: string; transactionId?: string; isBonusEligible?: boolean }> {
    if (!isFirebaseConfigured() || !db) {
      if (fallbackOrder) {
        return await walletService.creditOrderCommission(fallbackOrder, adminName);
      }
      return { success: false, message: 'Firestore not configured' };
    }

    try {
      const cleanId = String(orderId).trim();
      const docRef = doc(db, COLLECTION, cleanId);
      let snap = await getDoc(docRef);

      // Check alternate ID without leading '#'
      if (!snap.exists()) {
        const unhashedId = cleanId.replace(/^#/, '');
        const altRef = doc(db, COLLECTION, unhashedId);
        snap = await getDoc(altRef);
      }

      if (!snap.exists()) {
        if (fallbackOrder) {
          return await walletService.creditOrderCommission(fallbackOrder, adminName);
        }
        return { success: false, message: `Order ${orderId} does not exist.` };
      }

      const orderData = normalizeOrder(snap.data(), snap.id);
      return await walletService.creditOrderCommission(orderData, adminName);
    } catch (err: any) {
      console.error('approveDelivery exception:', err);
      if (fallbackOrder) {
        return await walletService.creditOrderCommission(fallbackOrder, adminName);
      }
      return { success: false, message: err?.message || 'Failed to approve delivery' };
    }
  },

  /**
   * Admin Delivery Rejection.
   */
  async rejectDelivery(orderId: string, reason: string = 'Delivery verification rejected by Admin'): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, orderId);
      await updateDoc(docRef, {
        adminApproved: false,
        commissionStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
    }
  },

  async delete(orderId: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const docRef = doc(db, COLLECTION, orderId);
      await deleteDoc(docRef);
    }
  }
};
